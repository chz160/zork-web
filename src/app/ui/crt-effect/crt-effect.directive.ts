import { Directive, ElementRef, input, effect, inject } from '@angular/core';

/**
 * CRT Effect Directive
 *
 * Applies a vintage CRT monitor effect to the host element, including:
 * - Scanlines (horizontal interlacing lines)
 * - Screen flicker animation
 * - Subtle color separation (RGB shift)
 * - Phosphor glow
 *
 * The effect uses colors from the Zork game's green phosphor palette.
 *
 * Usage:
 * ```html
 * <div appCrtEffect [enabled]="crtEnabled()">Content</div>
 * ```
 *
 * Features:
 * - Respects prefers-reduced-motion accessibility preference
 * - Minimal performance impact (CSS-based animations)
 * - Toggleable via input signal
 * - Compatible with OnPush change detection
 */
@Directive({
  selector: '[appCrtEffect]',
  standalone: true,
})
export class CrtEffectDirective {
  private readonly element = inject(ElementRef<HTMLElement>);

  /** Whether the CRT effect is enabled */
  readonly enabled = input<boolean>(true);

  constructor() {
    // Apply/remove effect when enabled state changes
    effect(() => {
      const isEnabled = this.enabled();
      this.toggleEffect(isEnabled);
    });
  }

  /**
   * Toggle the CRT effect on/off
   */
  private toggleEffect(isEnabled: boolean): void {
    const nativeElement = this.element.nativeElement;

    if (isEnabled) {
      nativeElement.classList.add('crt-effect');
    } else {
      nativeElement.classList.remove('crt-effect');
    }
  }
}
