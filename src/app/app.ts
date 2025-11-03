import { Component, signal, inject, OnInit, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Console } from './console/console';
import { GameService } from './core/services/game.service';
import { GameEngineService } from './core/services/game-engine.service';
import { DisambiguationComponent } from './ui/disambiguation/disambiguation';
import { AutocorrectConfirmationComponent } from './ui/autocorrect-confirmation/autocorrect-confirmation';
import { InventoryComponent } from './ui/inventory/inventory';
import { StatusComponent } from './ui/status/status';
import { VoxelMapComponent } from './ui/map/voxel-map';
import { ObjectCandidate } from './core/models';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Console,
    CommonModule,
    DisambiguationComponent,
    AutocorrectConfirmationComponent,
    InventoryComponent,
    StatusComponent,
    VoxelMapComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('zork-web');
  private readonly gameService = inject(GameService);
  private readonly gameEngine = inject(GameEngineService);

  /** Reference to console component for focus management */
  @ViewChild(Console) consoleComponent?: Console;

  /** Current font size setting */
  protected readonly fontSize = signal<FontSize>('medium');

  /** Show/hide controls panel */
  protected readonly showControls = signal(false);

  /** Show/hide map visualization */
  protected readonly showMap = signal(false);

  /** Show/hide status dialog */
  protected readonly showStatus = signal(false);

  /** Show/hide inventory dialog */
  protected readonly showInventory = signal(false);

  /** CRT effect enabled state */
  protected readonly crtEffectEnabled = signal(true);

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

    // Load saved CRT effect preference
    const savedCrtEffect = localStorage.getItem('zork-crt-effect');
    if (savedCrtEffect !== null) {
      this.crtEffectEnabled.set(savedCrtEffect === 'true');
    }

    // Wire up UI callbacks to game engine
    this.setupUICallbacks();

    // Subscribe to command output to intercept map, status, and inventory commands
    this.gameService.commandOutput$.subscribe((output) => {
      // Check if this is a map command by checking the output type or messages
      if (output.metadata && output.metadata['isMapCommand']) {
        this.showMap.set(true);
      }
      if (output.metadata && output.metadata['isStatusCommand']) {
        this.showStatus.set(true);
      }
      if (output.metadata && output.metadata['isInventoryCommand']) {
        this.showInventory.set(true);
      }
    });
  }

  /**
   * Handle keyboard shortcuts for font size adjustment and dialog management
   * Ctrl/Cmd + Plus: Increase font size
   * Ctrl/Cmd + Minus: Decrease font size
   * Ctrl/Cmd + 0: Reset to medium
   * Ctrl/Cmd + M: Toggle map
   * Ctrl/Cmd + I: Toggle inventory
   * Ctrl/Cmd + Shift + S: Toggle status
   * ESC: Close any open dialog
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // ESC key closes any open dialog
    if (event.key === 'Escape') {
      if (this.showMap()) {
        event.preventDefault();
        this.closeMap();
        return;
      }
      if (this.showStatus()) {
        event.preventDefault();
        this.closeStatus();
        return;
      }
      if (this.showInventory()) {
        event.preventDefault();
        this.closeInventory();
        return;
      }
      if (this.disambiguationCandidates()) {
        event.preventDefault();
        this.onDisambiguationCancelled();
        return;
      }
      if (this.autocorrectOriginalInput()) {
        event.preventDefault();
        this.onAutocorrectRejected();
        return;
      }
      if (this.showControls()) {
        event.preventDefault();
        this.toggleControls();
        return;
      }
    }

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
      } else if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        this.toggleMap();
      } else if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        this.toggleInventory();
      } else if (event.shiftKey && (event.key === 's' || event.key === 'S')) {
        // Ctrl/Cmd + Shift + S for status (avoids conflict with Ctrl+T for new tab)
        event.preventDefault();
        this.toggleStatus();
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
   * Toggle map visualization visibility
   */
  toggleMap(): void {
    this.showMap.set(!this.showMap());
    if (!this.showMap()) {
      // Focus input when map closes
      this.focusCommandInput();
    }
  }

  /**
   * Close the map modal
   */
  closeMap(): void {
    this.showMap.set(false);
    this.focusCommandInput();
  }

  /**
   * Toggle status dialog visibility
   */
  toggleStatus(): void {
    this.showStatus.set(!this.showStatus());
    if (!this.showStatus()) {
      // Focus input when status closes
      this.focusCommandInput();
    }
  }

  /**
   * Close the status dialog
   */
  closeStatus(): void {
    this.showStatus.set(false);
    this.focusCommandInput();
  }

  /**
   * Toggle inventory dialog visibility
   */
  toggleInventory(): void {
    this.showInventory.set(!this.showInventory());
    if (!this.showInventory()) {
      // Focus input when inventory closes
      this.focusCommandInput();
    }
  }

  /**
   * Close the inventory dialog
   */
  closeInventory(): void {
    this.showInventory.set(false);
    this.focusCommandInput();
  }

  /**
   * Focus the command input field
   */
  private focusCommandInput(): void {
    setTimeout(() => {
      this.consoleComponent?.focusInput();
    }, 100);
  }

  /**
   * Toggle CRT effect on/off
   */
  toggleCrtEffect(): void {
    const newValue = !this.crtEffectEnabled();
    this.crtEffectEnabled.set(newValue);
    localStorage.setItem('zork-crt-effect', String(newValue));
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
    this.focusCommandInput();
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
    this.focusCommandInput();
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
    this.focusCommandInput();
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
    this.focusCommandInput();
  }
}
