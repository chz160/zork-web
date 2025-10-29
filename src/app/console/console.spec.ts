import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Console } from './console';
import { GameService } from '../core/services/game.service';
import { BehaviorSubject } from 'rxjs';

describe('Console', () => {
  let component: Console;
  let fixture: ComponentFixture<Console>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let outputSubject: BehaviorSubject<string[]>;

  beforeEach(async () => {
    // Create a mock GameService with observable support
    outputSubject = new BehaviorSubject<string[]>([]);
    mockGameService = jasmine.createSpyObj('GameService', ['initializeGame', 'submitCommand'], {
      output$: outputSubject.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [Console],
      providers: [{ provide: GameService, useValue: mockGameService }],
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
      // Update the output observable
      outputSubject.next(['Welcome to Zork!', 'You are standing west of a white house.']);
      fixture.detectChanges();

      const lines = fixture.nativeElement.querySelectorAll(
        '.console-line:not(.console-line--input)'
      );
      expect(lines.length).toBe(2);
      expect(lines[0].textContent).toContain('Welcome to Zork!');
      expect(lines[1].textContent).toContain('You are standing west of a white house.');
    });

    it('should not render prompts for output lines', () => {
      outputSubject.next(['Test message']);
      fixture.detectChanges();

      // Output lines should not have prompts
      const outputLines = fixture.nativeElement.querySelectorAll(
        '.console-line:not(.console-line--input)'
      );
      const prompts: (Element | null)[] = [];
      outputLines.forEach((line: Element) => {
        prompts.push(line.querySelector('.console-prompt'));
      });
      expect(prompts.every((p) => p === null)).toBe(true);
    });

    it('should render input line with prompt', () => {
      const inputLine = fixture.nativeElement.querySelector('.console-line--input');
      const prompt = inputLine?.querySelector('.console-prompt');
      expect(prompt?.textContent).toBe('>');
    });

    it('should apply correct CSS classes based on line type', () => {
      outputSubject.next(["I don't understand that.", 'Taken.']);
      fixture.detectChanges();

      const lines = fixture.nativeElement.querySelectorAll(
        '.console-line:not(.console-line--input)'
      );
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
      outputSubject.next(['Line 1', 'Line 2', 'Line 3']);
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
      outputSubject.next(['Line 1', 'Line 2']);
      fixture.detectChanges();

      const output = fixture.nativeElement.querySelector('.console-output');
      const ariaLabel = output?.getAttribute('aria-label');
      expect(ariaLabel).toContain('2 lines');
    });

    it('should have proper input ARIA labels', () => {
      const input = fixture.nativeElement.querySelector('.command-input');
      expect(input?.getAttribute('aria-label')).toBe('Game command input');
      expect(input?.getAttribute('aria-describedby')).toBe('input-instructions');
    });

    it('should have hidden instructions for screen readers', () => {
      const instructions = fixture.nativeElement.querySelector('#input-instructions');
      expect(instructions).toBeTruthy();
      expect(instructions?.classList.contains('sr-only')).toBe(true);
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

  describe('Integrated Input - Focus Management', () => {
    it('should focus input when container is clicked', (done) => {
      const inputElement = fixture.nativeElement.querySelector(
        '.command-input'
      ) as HTMLInputElement;
      spyOn(inputElement, 'focus');

      const container = fixture.nativeElement.querySelector('.console-container');
      container?.dispatchEvent(new Event('click'));

      setTimeout(() => {
        expect(inputElement.focus).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should auto-focus input field after initialization', (done) => {
      const inputElement = fixture.nativeElement.querySelector(
        '.command-input'
      ) as HTMLInputElement;
      spyOn(inputElement, 'focus');

      component.ngAfterViewInit();

      setTimeout(() => {
        expect(inputElement.focus).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should maintain focus after command submission', (done) => {
      const inputElement = fixture.nativeElement.querySelector(
        '.command-input'
      ) as HTMLInputElement;
      spyOn(inputElement, 'focus');

      component.currentCommand.set('look');
      component.onSubmit();

      setTimeout(() => {
        expect(inputElement.focus).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should stop propagation on input click', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      component.onInputClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Integrated Input - Command Submission', () => {
    it('should submit command on Enter key press', () => {
      component.currentCommand.set('look');
      fixture.detectChanges();

      component.onSubmit();

      expect(mockGameService.submitCommand).toHaveBeenCalledWith('look');
      expect(component.currentCommand()).toBe('');
    });

    it('should not submit empty command', () => {
      component.currentCommand.set('');
      component.onSubmit();

      expect(mockGameService.submitCommand).not.toHaveBeenCalled();
    });

    it('should not submit whitespace-only command', () => {
      component.currentCommand.set('   ');
      component.onSubmit();

      expect(mockGameService.submitCommand).not.toHaveBeenCalled();
    });

    it('should trim command before submission', () => {
      component.currentCommand.set('  look  ');
      component.onSubmit();

      expect(mockGameService.submitCommand).toHaveBeenCalledWith('look');
    });

    it('should clear input after submission', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      expect(component.currentCommand()).toBe('');
    });
  });

  describe('Integrated Input - Command History', () => {
    it('should add commands to history on submission', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      const history = component['commandHistory']();
      expect(history).toEqual(['look', 'inventory']);
    });

    it('should not add duplicate consecutive commands', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('look');
      component.onSubmit();

      const history = component['commandHistory']();
      expect(history).toEqual(['look']);
    });

    it('should navigate to previous command with Up arrow', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.currentCommand()).toBe('inventory');
    });

    it('should navigate to next command with Down arrow', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      expect(component.currentCommand()).toBe('inventory');
    });

    it('should clear input on Escape key', () => {
      component.currentCommand.set('test command');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.currentCommand()).toBe('');
    });

    it('should reset history navigation when typing', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('look');

      component.onInputChange('new command');
      expect(component.currentCommand()).toBe('new command');

      const historyIndex = component['historyIndex']();
      expect(historyIndex).toBe(-1);
    });
  });

  describe('Integrated Input - Rendering', () => {
    it('should render input field with correct attributes', () => {
      const input = fixture.nativeElement.querySelector('.command-input') as HTMLInputElement;

      expect(input).toBeTruthy();
      expect(input.getAttribute('autocomplete')).toBe('off');
      expect(input.getAttribute('spellcheck')).toBe('false');
      expect(input.getAttribute('autocorrect')).toBe('off');
      expect(input.getAttribute('autocapitalize')).toBe('off');
    });

    it('should display placeholder text', () => {
      const input = fixture.nativeElement.querySelector('.command-input') as HTMLInputElement;

      expect(input.placeholder).toContain('Enter command');
      expect(input.placeholder).toContain('help');
    });
  });
});
