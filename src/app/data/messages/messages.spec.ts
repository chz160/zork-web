import { TestBed } from '@angular/core/testing';
import { MessageService } from '../../core/services/message.service';
import { RandomService } from '../../core/services/random.service';
import thiefMessages from './thief-messages.json';

describe('Thief Messages Integration', () => {
  let messageService: MessageService;
  let randomService: RandomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService, RandomService],
    });

    messageService = TestBed.inject(MessageService);
    randomService = TestBed.inject(RandomService);

    // Register thief messages
    messageService.registerTable('thief', thiefMessages);
  });

  it('should load thief messages from JSON', () => {
    expect(messageService.hasTable('thief')).toBe(true);
  });

  describe('THIEF_MELEE message categories', () => {
    it('should have THIEF_MELEE_MISS messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_MISS')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_MISS');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(4);
    });

    it('should have THIEF_MELEE_UNCONSCIOUS messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_UNCONSCIOUS')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_UNCONSCIOUS');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(2);
    });

    it('should have THIEF_MELEE_KILL messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_KILL')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_KILL');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(3);
    });

    it('should have THIEF_MELEE_LIGHT_WOUND messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_LIGHT_WOUND')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_LIGHT_WOUND');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(4);
    });

    it('should have THIEF_MELEE_SERIOUS_WOUND messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_SERIOUS_WOUND')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_SERIOUS_WOUND');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(4);
    });

    it('should have THIEF_MELEE_STAGGER messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_STAGGER')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_STAGGER');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(3);
    });

    it('should have THIEF_MELEE_DISARM messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_DISARM')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_DISARM');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(3);
    });

    it('should have THIEF_MELEE_PAUSE messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_PAUSE')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_PAUSE');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(3);
    });

    it('should have THIEF_MELEE_FINAL_BLOW messages', () => {
      expect(messageService.hasCategory('thief', 'THIEF_MELEE_FINAL_BLOW')).toBe(true);
      const messages = messageService.getAllMessages('thief', 'THIEF_MELEE_FINAL_BLOW');
      expect(messages).toBeDefined();
      expect(messages!.length).toBe(2);
    });
  });

  describe('deterministic message selection', () => {
    it('should return same message with same seed', () => {
      randomService.setSeed(42);
      const message1 = messageService.getRandomMessage('thief', 'THIEF_MELEE_MISS');

      randomService.setSeed(42);
      const message2 = messageService.getRandomMessage('thief', 'THIEF_MELEE_MISS');

      expect(message1).toBeDefined();
      expect(message2).toBe(message1);
    });

    it('should handle template replacements in DISARM messages', () => {
      randomService.setSeed(100);
      const message = messageService.getRandomMessage('thief', 'THIEF_MELEE_DISARM', {
        weapon: 'sword',
      });

      expect(message).toBeDefined();
      expect(message).toContain('sword');
      expect(message).not.toContain('{weapon}');
    });
  });

  describe('action messages', () => {
    it('should have THIEF_EXAMINE message', () => {
      expect(messageService.hasCategory('thief', 'THIEF_EXAMINE')).toBe(true);
      const message = messageService.getRandomMessage('thief', 'THIEF_EXAMINE');
      expect(message).toBeDefined();
      expect(message).toContain('slippery character');
    });

    it('should have THIEF_GIFT_VALUABLE message', () => {
      expect(messageService.hasCategory('thief', 'THIEF_GIFT_VALUABLE')).toBe(true);
      const message = messageService.getRandomMessage('thief', 'THIEF_GIFT_VALUABLE', {
        item: 'jewel',
      });
      expect(message).toBeDefined();
      expect(message).toContain('jewel');
    });

    it('should have THIEF_GIFT_WORTHLESS message', () => {
      expect(messageService.hasCategory('thief', 'THIEF_GIFT_WORTHLESS')).toBe(true);
      const message = messageService.getRandomMessage('thief', 'THIEF_GIFT_WORTHLESS', {
        item: 'rock',
      });
      expect(message).toBeDefined();
      expect(message).toContain('rock');
    });

    it('should have THIEF_REVIVE message', () => {
      expect(messageService.hasCategory('thief', 'THIEF_REVIVE')).toBe(true);
      const message = messageService.getRandomMessage('thief', 'THIEF_REVIVE');
      expect(message).toBeDefined();
      expect(message).toContain('revives');
    });
  });
});
