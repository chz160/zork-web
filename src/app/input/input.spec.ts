import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Input } from './input';
import { GameEngineService } from '../core/services/game-engine.service';
import { CommandParserService } from '../core/services/command-parser.service';
import { signal } from '@angular/core';
import { ParserResult } from '../core/models';

describe('Input', () => {
  let component: Input;
  let fixture: ComponentFixture<Input>;
  let mockGameEngine: jasmine.SpyObj<GameEngineService>;
  let mockCommandParser: jasmine.SpyObj<CommandParserService>;

  beforeEach(async () => {
    // Create mock services
    const outputSignal = signal<string[]>([]);
    mockGameEngine = jasmine.createSpyObj(
      'GameEngineService',
      ['executeCommand', 'initializeGame'],
      {
        output: outputSignal.asReadonly(),
      }
    );

    mockCommandParser = jasmine.createSpyObj('CommandParserService', ['parse']);

    await TestBed.configureTestingModule({
      imports: [Input],
      providers: [
        { provide: GameEngineService, useValue: mockGameEngine },
        { provide: CommandParserService, useValue: mockCommandParser },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Input);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Rendering', () => {
    it('should render input field with prompt', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const prompt = compiled.querySelector('.input-prompt');
      const input = compiled.querySelector('.command-input');

      expect(prompt?.textContent).toBe('>');
      expect(input).toBeTruthy();
    });

    it('should have proper ARIA labels', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.input-container');
      const input = compiled.querySelector('.command-input');

      expect(container?.getAttribute('role')).toBe('form');
      expect(container?.getAttribute('aria-label')).toBe('Command input form');
      expect(input?.getAttribute('aria-label')).toBe('Game command input');
      expect(input?.getAttribute('aria-describedby')).toBe('input-instructions');
    });

    it('should display placeholder text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('.command-input') as HTMLInputElement;

      expect(input.placeholder).toContain('Enter command');
      expect(input.placeholder).toContain('help');
    });

    it('should have autocomplete and spellcheck disabled', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('.command-input') as HTMLInputElement;

      expect(input.getAttribute('autocomplete')).toBe('off');
      expect(input.getAttribute('spellcheck')).toBe('false');
      expect(input.getAttribute('autocorrect')).toBe('off');
      expect(input.getAttribute('autocapitalize')).toBe('off');
    });
  });

  describe('Command Submission', () => {
    it('should submit command on Enter key press', () => {
      const mockParserResult: ParserResult = {
        isValid: true,
        verb: 'look',
        directObject: null,
        preposition: null,
        indirectObject: null,
        rawInput: 'look',
      };
      mockCommandParser.parse.and.returnValue(mockParserResult);

      // Set a command
      component.currentCommand.set('look');
      fixture.detectChanges();

      // Submit
      component.onSubmit();

      expect(mockCommandParser.parse).toHaveBeenCalledWith('look');
      expect(mockGameEngine.executeCommand).toHaveBeenCalledWith(mockParserResult);
      expect(component.currentCommand()).toBe('');
    });

    it('should not submit empty command', () => {
      component.currentCommand.set('');
      component.onSubmit();

      expect(mockCommandParser.parse).not.toHaveBeenCalled();
      expect(mockGameEngine.executeCommand).not.toHaveBeenCalled();
    });

    it('should not submit whitespace-only command', () => {
      component.currentCommand.set('   ');
      component.onSubmit();

      expect(mockCommandParser.parse).not.toHaveBeenCalled();
      expect(mockGameEngine.executeCommand).not.toHaveBeenCalled();
    });

    it('should trim command before submission', () => {
      const mockParserResult: ParserResult = {
        isValid: true,
        verb: 'look',
        directObject: null,
        preposition: null,
        indirectObject: null,
        rawInput: 'look',
      };
      mockCommandParser.parse.and.returnValue(mockParserResult);

      component.currentCommand.set('  look  ');
      component.onSubmit();

      expect(mockCommandParser.parse).toHaveBeenCalledWith('look');
    });

    it('should clear input after submission', () => {
      const mockParserResult: ParserResult = {
        isValid: true,
        verb: 'look',
        directObject: null,
        preposition: null,
        indirectObject: null,
        rawInput: 'look',
      };
      mockCommandParser.parse.and.returnValue(mockParserResult);

      component.currentCommand.set('look');
      component.onSubmit();

      expect(component.currentCommand()).toBe('');
    });
  });

  describe('Command History', () => {
    beforeEach(() => {
      // Setup mock parser
      const mockParserResult: ParserResult = {
        isValid: true,
        verb: 'look',
        directObject: null,
        preposition: null,
        indirectObject: null,
        rawInput: 'look',
      };
      mockCommandParser.parse.and.returnValue(mockParserResult);
    });

    it('should add commands to history on submission', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      // Access private property for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const history = (component as any).commandHistory();
      expect(history).toEqual(['look', 'inventory']);
    });

    it('should not add duplicate consecutive commands', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('look');
      component.onSubmit();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const history = (component as any).commandHistory();
      expect(history).toEqual(['look']);
    });

    it('should allow duplicate non-consecutive commands', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      component.currentCommand.set('look');
      component.onSubmit();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const history = (component as any).commandHistory();
      expect(history).toEqual(['look', 'inventory', 'look']);
    });

    it('should navigate to previous command with Up arrow', () => {
      // Add commands to history
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      // Navigate up
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.currentCommand()).toBe('inventory');
    });

    it('should navigate through multiple commands with Up arrow', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      component.currentCommand.set('north');
      component.onSubmit();

      // Navigate up twice
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('north');

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('inventory');
    });

    it('should navigate to next command with Down arrow', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('inventory');
      component.onSubmit();

      // Navigate up twice
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      // Navigate down once
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.currentCommand()).toBe('inventory');
    });

    it('should restore temporary command when navigating past end of history', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      // Type a new command
      component.currentCommand.set('test command');

      // Navigate up to history
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('look');

      // Navigate down past end
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.currentCommand()).toBe('test command');
    });

    it('should save current input when starting to navigate history', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      component.currentCommand.set('partial');

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('look');

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.currentCommand()).toBe('partial');
    });

    it('should not navigate beyond the beginning of history', () => {
      component.currentCommand.set('first');
      component.onSubmit();

      component.currentCommand.set('second');
      component.onSubmit();

      // Navigate to first command
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('first');

      // Try to go further up
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('first');
    });

    it('should reset history navigation when typing', () => {
      component.currentCommand.set('look');
      component.onSubmit();

      // Navigate to history
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('look');

      // Type something new
      component.onInputChange('new command');
      expect(component.currentCommand()).toBe('new command');

      // History index should be reset
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyIndex = (component as any).historyIndex();
      expect(historyIndex).toBe(-1);
    });

    it('should handle empty history gracefully', () => {
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.currentCommand()).toBe('');

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.currentCommand()).toBe('');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should clear input on Escape key', () => {
      component.currentCommand.set('test command');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.currentCommand()).toBe('');
    });

    it('should prevent default behavior for Up arrow', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent default behavior for Down arrow', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
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
      const mockParserResult: ParserResult = {
        isValid: true,
        verb: 'look',
        directObject: null,
        preposition: null,
        indirectObject: null,
        rawInput: 'look',
      };
      mockCommandParser.parse.and.returnValue(mockParserResult);

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
  });

  describe('Input Change Handling', () => {
    it('should update current command on input change', () => {
      component.onInputChange('test input');
      expect(component.currentCommand()).toBe('test input');
    });

    it('should reset history navigation on input change', () => {
      // Setup history
      component.currentCommand.set('look');
      component.onSubmit();

      // Navigate to history
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      // Modify input
      component.onInputChange('modified');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyIndex = (component as any).historyIndex();
      expect(historyIndex).toBe(-1);
    });
  });

  describe('Accessibility', () => {
    it('should have hidden instructions for screen readers', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const instructions = compiled.querySelector('#input-instructions');

      expect(instructions).toBeTruthy();
      expect(instructions?.classList.contains('sr-only')).toBe(true);
      expect(instructions?.textContent).toContain('Enter a command');
      expect(instructions?.textContent).toContain('Up and Down arrow keys');
    });
  });
});
