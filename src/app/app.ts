import { Component, signal, inject, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Console } from './console/console';
import { Input } from './input/input';
import { GameService } from './core/services/game.service';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Console, Input, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('zork-web');
  private readonly gameService = inject(GameService);

  /** Current font size setting */
  protected readonly fontSize = signal<FontSize>('medium');

  /** Show/hide controls panel */
  protected readonly showControls = signal(false);

  ngOnInit(): void {
    // Initialize the game via GameService
    this.gameService.initializeGame();

    // Load saved font size preference
    const savedFontSize = localStorage.getItem('zork-font-size') as FontSize;
    if (savedFontSize) {
      this.setFontSize(savedFontSize);
    }
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
}
