import { Component, signal, inject, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Console } from './console/console';
import { Input } from './input/input';
import { GameService } from './core/services/game.service';
import { GameEngineService } from './core/services/game-engine.service';
import { DisambiguationComponent } from './ui/disambiguation/disambiguation';
import { AutocorrectConfirmationComponent } from './ui/autocorrect-confirmation/autocorrect-confirmation';
import { InventoryComponent } from './ui/inventory/inventory';
import { StatusComponent } from './ui/status/status';
import { LocationPanelComponent } from './ui/location-panel/location-panel';
import { ObjectCandidate } from './core/models';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Console,
    Input,
    CommonModule,
    DisambiguationComponent,
    AutocorrectConfirmationComponent,
    InventoryComponent,
    StatusComponent,
    LocationPanelComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('zork-web');
  private readonly gameService = inject(GameService);
  private readonly gameEngine = inject(GameEngineService);

  /** Current font size setting */
  protected readonly fontSize = signal<FontSize>('medium');

  /** Show/hide controls panel */
  protected readonly showControls = signal(false);

  /** Disambiguation UI state */
  protected readonly disambiguationCandidates = signal<ObjectCandidate[] | null>(null);
  protected readonly disambiguationPrompt = signal<string>('');
  private disambiguationResolve: ((candidate: ObjectCandidate | null) => void) | null = null;

  /** Autocorrect UI state */
  protected readonly autocorrectOriginalInput = signal<string>('');
  protected readonly autocorrectSuggestion = signal<string>('');
  protected readonly autocorrectConfidence = signal<number>(0.85);
  private autocorrectResolve: ((accepted: boolean) => void) | null = null;

  ngOnInit(): void {
    // Initialize the game via GameService
    this.gameService.initializeGame();

    // Load saved font size preference
    const savedFontSize = localStorage.getItem('zork-font-size') as FontSize;
    if (savedFontSize) {
      this.setFontSize(savedFontSize);
    }

    // Wire up UI callbacks to game engine
    this.setupUICallbacks();
  }

  /**
   * Handle keyboard shortcuts for font size adjustment
   * Ctrl/Cmd + Plus: Increase font size
   * Ctrl/Cmd + Minus: Decrease font size
   * Ctrl/Cmd + 0: Reset to medium
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Check for Ctrl (Windows/Linux) or Cmd (Mac)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        this.increaseFontSize();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        this.decreaseFontSize();
      } else if (event.key === '0') {
        event.preventDefault();
        this.setFontSize('medium');
      }
    }
  }

  /**
   * Set font size and update DOM
   */
  setFontSize(size: FontSize): void {
    this.fontSize.set(size);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('zork-font-size', size);
  }

  /**
   * Increase font size
   */
  increaseFontSize(): void {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(this.fontSize());
    if (currentIndex < sizes.length - 1) {
      this.setFontSize(sizes[currentIndex + 1]);
    }
  }

  /**
   * Decrease font size
   */
  decreaseFontSize(): void {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(this.fontSize());
    if (currentIndex > 0) {
      this.setFontSize(sizes[currentIndex - 1]);
    }
  }

  /**
   * Toggle controls panel visibility
   */
  toggleControls(): void {
    this.showControls.set(!this.showControls());
  }

  /**
   * Get display label for font size
   */
  getFontSizeLabel(): string {
    const labels: Record<FontSize, string> = {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      xlarge: 'Extra Large',
    };
    return labels[this.fontSize()];
  }

  /**
   * Setup UI callbacks for disambiguation and autocorrect
   */
  private setupUICallbacks(): void {
    // Set up disambiguation callback
    this.gameEngine.setDisambiguationCallback((candidates, prompt) => {
      return new Promise<ObjectCandidate | null>((resolve) => {
        this.disambiguationCandidates.set(candidates);
        this.disambiguationPrompt.set(prompt);
        this.disambiguationResolve = resolve;
      });
    });

    // Set up autocorrect callback
    this.gameEngine.setAutocorrectCallback((originalInput, suggestion, confidence) => {
      return new Promise<boolean>((resolve) => {
        this.autocorrectOriginalInput.set(originalInput);
        this.autocorrectSuggestion.set(suggestion);
        this.autocorrectConfidence.set(confidence);
        this.autocorrectResolve = resolve;
      });
    });
  }

  /**
   * Handle disambiguation selection
   */
  onDisambiguationSelected(candidate: ObjectCandidate): void {
    if (this.disambiguationResolve) {
      this.disambiguationResolve(candidate);
      this.disambiguationResolve = null;
    }
    this.disambiguationCandidates.set(null);
  }

  /**
   * Handle disambiguation cancellation
   */
  onDisambiguationCancelled(): void {
    if (this.disambiguationResolve) {
      this.disambiguationResolve(null);
      this.disambiguationResolve = null;
    }
    this.disambiguationCandidates.set(null);
  }

  /**
   * Handle autocorrect acceptance
   */
  onAutocorrectAccepted(): void {
    if (this.autocorrectResolve) {
      this.autocorrectResolve(true);
      this.autocorrectResolve = null;
    }
    this.autocorrectOriginalInput.set('');
  }

  /**
   * Handle autocorrect rejection
   */
  onAutocorrectRejected(): void {
    if (this.autocorrectResolve) {
      this.autocorrectResolve(false);
      this.autocorrectResolve = null;
    }
    this.autocorrectOriginalInput.set('');
  }
}
