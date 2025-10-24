import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Console } from './console';
import { GameEngineService } from '../core/services/game-engine.service';
import { signal } from '@angular/core';

describe('Console', () => {
  let component: Console;
  let fixture: ComponentFixture<Console>;
  let mockGameEngine: jasmine.SpyObj<GameEngineService>;
  let outputSignal: ReturnType<typeof signal<string[]>>;

  beforeEach(async () => {
    // Create a mock GameEngineService with signal support
    outputSignal = signal<string[]>([]);
    mockGameEngine = jasmine.createSpyObj('GameEngineService', [], {
      output: outputSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [Console],
      providers: [{ provide: GameEngineService, useValue: mockGameEngine }],
    }).compileComponents();

    fixture = TestBed.createComponent(Console);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Rendering', () => {
    it('should render empty state when no output', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyMessage = compiled.querySelector('.console-line');

      expect(emptyMessage?.textContent).toContain('Waiting for game to start');
    });

    it('should render console lines from game engine output', () => {
      // Update the mock output signal
      outputSignal.set(['Welcome to Zork!', 'You are standing west of a white house.']);
      fixture.detectChanges();

      const lines = fixture.nativeElement.querySelectorAll('.console-line');
      expect(lines.length).toBe(2);
      expect(lines[0].textContent).toContain('Welcome to Zork!');
      expect(lines[1].textContent).toContain('You are standing west of a white house.');
    });

    it('should render lines with prompts', () => {
      outputSignal.set(['Test message']);
      fixture.detectChanges();

      const prompt = fixture.nativeElement.querySelector('.console-prompt');
      expect(prompt?.textContent).toBe('>');
    });

    it('should apply correct CSS classes based on line type', () => {
      outputSignal.set(["I don't understand that.", 'Taken.']);
      fixture.detectChanges();

      const lines = fixture.nativeElement.querySelectorAll('.console-line');
      expect(lines[0].classList.contains('console-line--error')).toBe(true);
      expect(lines[1].classList.contains('console-line--success')).toBe(true);
    });
  });

  describe('Line Type Inference', () => {
    it('should infer error type for error messages', () => {
      const line = {
        text: "I don't understand that command.",
        type: 'error' as const,
        timestamp: new Date(),
      };
      const classes = component.getLineClasses(line);
      expect(classes).toContain('console-line--error');
    });

    it('should infer success type for success messages', () => {
      const line = { text: 'Taken.', type: 'success' as const, timestamp: new Date() };
      const classes = component.getLineClasses(line);
      expect(classes).toContain('console-line--success');
    });

    it('should infer description type for long text', () => {
      const longText =
        'You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.';
      const line = { text: longText, type: 'description' as const, timestamp: new Date() };
      const classes = component.getLineClasses(line);
      expect(classes).toContain('console-line--description');
    });

    it('should default to info type for regular messages', () => {
      const line = { text: 'Test message', type: 'info' as const, timestamp: new Date() };
      const classes = component.getLineClasses(line);
      expect(classes).toContain('console-line--info');
    });
  });

  describe('Scrolling', () => {
    it('should have scrollable output container', () => {
      const container = fixture.nativeElement.querySelector('.console-output');
      expect(container).toBeTruthy();

      const styles = window.getComputedStyle(container!);
      expect(styles.overflowY).toBe('auto');
    });

    it('should handle scroll events', () => {
      outputSignal.set(['Line 1', 'Line 2', 'Line 3']);
      fixture.detectChanges();

      component.onScroll();
      // Should not throw error even if container is not at bottom
      expect(component).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const container = fixture.nativeElement.querySelector('.console-container');
      const output = fixture.nativeElement.querySelector('.console-output');

      expect(container?.getAttribute('role')).toBe('log');
      expect(container?.getAttribute('aria-live')).toBe('polite');
      expect(output?.getAttribute('role')).toBe('region');
      expect(output?.hasAttribute('tabindex')).toBe(true);
    });

    it('should announce total lines count', () => {
      outputSignal.set(['Line 1', 'Line 2']);
      fixture.detectChanges();

      const output = fixture.nativeElement.querySelector('.console-output');
      const ariaLabel = output?.getAttribute('aria-label');
      expect(ariaLabel).toContain('2 lines');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive CSS classes', () => {
      const container = fixture.nativeElement.querySelector('.console-container');
      expect(container).toBeTruthy();

      // Verify that the element exists and has the expected class
      expect(container?.classList.contains('console-container')).toBe(true);
    });
  });

  describe('Track By Function', () => {
    it('should track lines by index', () => {
      expect(component.trackByIndex(0)).toBe(0);
      expect(component.trackByIndex(5)).toBe(5);
    });
  });
});
