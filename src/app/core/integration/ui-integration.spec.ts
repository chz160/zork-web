import { TestBed } from '@angular/core/testing';
import { GameEngineService } from '../services/game-engine.service';
import { ObjectCandidate } from '../models/parser-result.model';

/**
 * Integration tests for disambiguation and autocorrect UI flow.
 * These tests verify that the UI components properly integrate with the game engine.
 */
describe('Disambiguation & Autocorrect Integration', () => {
  let gameEngine: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameEngineService],
    });
    gameEngine = TestBed.inject(GameEngineService);
    gameEngine.initializeGame();
  });

  describe('Disambiguation Flow', () => {
    it('should request disambiguation when multiple candidates exist', async () => {
      const candidates: ObjectCandidate[] = [
        { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
        { id: 'lamp2', displayName: 'oil lamp', score: 0.85, context: 'in inventory' },
      ];

      // Set up a mock UI callback that automatically selects the first candidate
      gameEngine.setDisambiguationCallback(async (cands, prompt) => {
        expect(cands.length).toBe(2);
        expect(prompt).toBeTruthy();
        return cands[0]; // Simulate user selecting first option
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Which lamp?');

      expect(result).toEqual(candidates[0]);
    });

    it('should handle user cancelling disambiguation', async () => {
      const candidates: ObjectCandidate[] = [
        { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
      ];

      // Set up a mock UI callback that simulates cancellation
      gameEngine.setDisambiguationCallback(async () => {
        return null; // User cancelled
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Which lamp?');

      expect(result).toBeNull();
    });

    it('should fall back to first candidate when no UI callback is set', async () => {
      const candidates: ObjectCandidate[] = [
        { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
        { id: 'lamp2', displayName: 'oil lamp', score: 0.85, context: 'in inventory' },
      ];

      // No callback set - should auto-select first candidate
      const result = await gameEngine.requestDisambiguation(candidates, 'Which lamp?');

      expect(result).toEqual(candidates[0]);
    });

    it('should work with different numbers of candidates', async () => {
      // Test with 5 candidates
      const candidates: ObjectCandidate[] = Array.from({ length: 5 }, (_, i) => ({
        id: `item${i}`,
        displayName: `item ${i}`,
        score: 1 - i * 0.1,
        context: 'here',
      }));

      gameEngine.setDisambiguationCallback(async (cands) => {
        expect(cands.length).toBe(5);
        return cands[2]; // Select third option
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Which item?');

      expect(result).toEqual(candidates[2]);
    });

    it('should pass custom prompts through to UI', async () => {
      const candidates: ObjectCandidate[] = [
        { id: 'key1', displayName: 'brass key', score: 0.9, context: 'here' },
      ];

      let receivedPrompt = '';
      gameEngine.setDisambiguationCallback(async (_cands, prompt) => {
        receivedPrompt = prompt;
        return candidates[0];
      });

      await gameEngine.requestDisambiguation(candidates, 'Which key do you mean?');

      expect(receivedPrompt).toBe('Which key do you mean?');
    });
  });

  describe('Autocorrect Flow', () => {
    it('should request autocorrect confirmation for medium confidence matches', async () => {
      // Set up a mock UI callback that accepts the suggestion
      gameEngine.setAutocorrectCallback(async (original, suggestion, confidence) => {
        expect(original).toBe('mailbax');
        expect(suggestion).toBe('mailbox');
        expect(confidence).toBe(0.88);
        return true; // User accepts
      });

      const result = await gameEngine.requestAutocorrectConfirmation('mailbax', 'mailbox', 0.88);

      expect(result).toBe(true);
    });

    it('should handle user rejecting autocorrect', async () => {
      // Set up a mock UI callback that rejects the suggestion
      gameEngine.setAutocorrectCallback(async () => {
        return false; // User rejects
      });

      const result = await gameEngine.requestAutocorrectConfirmation('tak', 'take', 0.82);

      expect(result).toBe(false);
    });

    it('should auto-accept high confidence suggestions without UI when no callback', async () => {
      // No callback set - high confidence should auto-accept
      const result = await gameEngine.requestAutocorrectConfirmation('tak', 'take', 0.92);

      expect(result).toBe(true);
    });

    it('should auto-reject low confidence suggestions without UI when no callback', async () => {
      // No callback set - low confidence should auto-reject
      const result = await gameEngine.requestAutocorrectConfirmation('abc', 'xyz', 0.72);

      expect(result).toBe(false);
    });

    it('should respect threshold boundary for auto-accept (85%)', async () => {
      // Exactly at threshold
      const result1 = await gameEngine.requestAutocorrectConfirmation('test', 'best', 0.85);
      expect(result1).toBe(true);

      // Just below threshold
      const result2 = await gameEngine.requestAutocorrectConfirmation('test', 'best', 0.849);
      expect(result2).toBe(false);
    });

    it('should work with various typo scenarios', async () => {
      gameEngine.setAutocorrectCallback(async () => {
        // Accept all suggestions in this test
        return true;
      });

      // Common typos
      expect(await gameEngine.requestAutocorrectConfirmation('opne', 'open', 0.9)).toBe(true);
      expect(await gameEngine.requestAutocorrectConfirmation('examin', 'examine', 0.88)).toBe(true);
      expect(await gameEngine.requestAutocorrectConfirmation('lamppost', 'lamp post', 0.86)).toBe(
        true
      );
    });
  });

  describe('Combined Scenario', () => {
    it('should handle disambiguation followed by autocorrect in sequence', async () => {
      // Set up both callbacks
      gameEngine.setDisambiguationCallback(async (cands) => {
        return cands[0]; // Select first
      });

      gameEngine.setAutocorrectCallback(async () => {
        return true; // Accept correction
      });

      // First, disambiguate
      const candidates: ObjectCandidate[] = [
        { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
        { id: 'lamp2', displayName: 'oil lamp', score: 0.85, context: 'in inventory' },
      ];
      const disambiguated = await gameEngine.requestDisambiguation(candidates, 'Which?');
      expect(disambiguated).toEqual(candidates[0]);

      // Then, autocorrect
      const corrected = await gameEngine.requestAutocorrectConfirmation('tak', 'take', 0.88);
      expect(corrected).toBe(true);
    });

    it('should handle multiple disambiguation requests in sequence', async () => {
      let callCount = 0;
      gameEngine.setDisambiguationCallback(async (cands) => {
        callCount++;
        return cands[0];
      });

      const candidates1: ObjectCandidate[] = [
        { id: 'lamp1', displayName: 'lamp 1', score: 0.9, context: 'here' },
      ];
      await gameEngine.requestDisambiguation(candidates1, 'First?');

      const candidates2: ObjectCandidate[] = [
        { id: 'key1', displayName: 'key 1', score: 0.9, context: 'here' },
      ];
      await gameEngine.requestDisambiguation(candidates2, 'Second?');

      expect(callCount).toBe(2);
    });

    it('should handle user accepting some suggestions and rejecting others', async () => {
      const decisions: boolean[] = [];

      gameEngine.setAutocorrectCallback(async (original) => {
        // Accept corrections for 'tak' but reject for 'opne'
        const accept = original === 'tak';
        decisions.push(accept);
        return accept;
      });

      await gameEngine.requestAutocorrectConfirmation('tak', 'take', 0.88);
      await gameEngine.requestAutocorrectConfirmation('opne', 'open', 0.85);

      expect(decisions).toEqual([true, false]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty candidate list', async () => {
      const result = await gameEngine.requestDisambiguation([], 'None?');
      expect(result).toBeNull();
    });

    it('should handle single candidate', async () => {
      const candidates: ObjectCandidate[] = [
        { id: 'lamp1', displayName: 'brass lamp', score: 1.0, context: 'here' },
      ];

      gameEngine.setDisambiguationCallback(async (cands) => {
        return cands[0];
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Only one?');
      expect(result).toEqual(candidates[0]);
    });

    it('should handle 100% confidence autocorrect', async () => {
      gameEngine.setAutocorrectCallback(async () => {
        return true;
      });

      const result = await gameEngine.requestAutocorrectConfirmation('test', 'best', 1.0);
      expect(result).toBe(true);
    });

    it('should handle 0% confidence autocorrect', async () => {
      const result = await gameEngine.requestAutocorrectConfirmation('abc', 'xyz', 0.0);
      expect(result).toBe(false);
    });
  });
});
