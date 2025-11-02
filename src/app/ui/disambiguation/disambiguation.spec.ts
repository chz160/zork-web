import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisambiguationComponent } from './disambiguation';
import { ObjectCandidate } from '../../core/models/parser-result.model';
import { ComponentRef } from '@angular/core';

describe('DisambiguationComponent', () => {
  let component: DisambiguationComponent;
  let componentRef: ComponentRef<DisambiguationComponent>;
  let fixture: ComponentFixture<DisambiguationComponent>;

  const mockCandidates: ObjectCandidate[] = [
    {
      id: 'brass-lamp',
      displayName: 'brass lamp',
      score: 0.95,
      context: 'here',
    },
    {
      id: 'lamp-post',
      displayName: 'lamp post',
      score: 0.85,
      context: 'in the street',
    },
    {
      id: 'oil-lamp',
      displayName: 'oil lamp',
      score: 0.8,
      context: 'in inventory',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisambiguationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisambiguationComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Inputs', () => {
    it('should accept candidates input', () => {
      componentRef.setInput('candidates', mockCandidates);
      fixture.detectChanges();

      expect(component.candidates()).toEqual(mockCandidates);
    });

    it('should accept prompt input', () => {
      componentRef.setInput('candidates', mockCandidates);
      componentRef.setInput('prompt', 'Which lamp do you mean?');
      fixture.detectChanges();

      expect(component.prompt()).toBe('Which lamp do you mean?');
    });

    it('should have default prompt', () => {
      componentRef.setInput('candidates', mockCandidates);
      fixture.detectChanges();

      expect(component.prompt()).toBe('Which one do you mean?');
    });

    it('should accept maxCandidates input', () => {
      componentRef.setInput('candidates', mockCandidates);
      componentRef.setInput('maxCandidates', 2);
      fixture.detectChanges();

      expect(component.maxCandidates()).toBe(2);
    });
  });

  describe('Candidate Rendering', () => {
    beforeEach(() => {
      componentRef.setInput('candidates', mockCandidates);
      componentRef.setInput('prompt', 'Which lamp?');
      fixture.detectChanges();
    });

    it('should render all candidates within maxCandidates limit', () => {
      const items = fixture.nativeElement.querySelectorAll('.disambiguation-item');
      expect(items.length).toBe(3);
    });

    it('should limit displayed candidates to maxCandidates', () => {
      componentRef.setInput('maxCandidates', 2);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.disambiguation-item');
      expect(items.length).toBe(2);
    });

    it('should display candidate names', () => {
      const names = fixture.nativeElement.querySelectorAll('.disambiguation-name');
      expect(names[0].textContent).toContain('brass lamp');
      expect(names[1].textContent).toContain('lamp post');
      expect(names[2].textContent).toContain('oil lamp');
    });

    it('should display candidate context', () => {
      const contexts = fixture.nativeElement.querySelectorAll('.disambiguation-context');
      expect(contexts[0].textContent).toContain('here');
      expect(contexts[1].textContent).toContain('in the street');
      expect(contexts[2].textContent).toContain('in inventory');
    });

    it('should display match scores', () => {
      const scores = fixture.nativeElement.querySelectorAll('.disambiguation-score');
      expect(scores[0].textContent).toContain('95% match');
      expect(scores[1].textContent).toContain('85% match');
      expect(scores[2].textContent).toContain('80% match');
    });

    it('should display numeric shortcuts', () => {
      const numbers = fixture.nativeElement.querySelectorAll('.disambiguation-number');
      expect(numbers[0].textContent).toContain('1');
      expect(numbers[1].textContent).toContain('2');
      expect(numbers[2].textContent).toContain('3');
    });

    it('should display prompt text', () => {
      const prompt = fixture.nativeElement.querySelector('.disambiguation-prompt');
      expect(prompt.textContent).toContain('Which lamp?');
    });
  });

  describe('Selection Handling', () => {
    beforeEach(() => {
      componentRef.setInput('candidates', mockCandidates);
      fixture.detectChanges();
    });

    it('should emit selected event when candidate is clicked', (done) => {
      component.selected.subscribe((candidate) => {
        expect(candidate).toEqual(mockCandidates[0]);
        done();
      });

      const firstItem = fixture.nativeElement.querySelector('.disambiguation-item');
      firstItem.click();
    });

    it('should hide component after selection', () => {
      expect(component.isVisible()).toBe(true);

      const firstItem = fixture.nativeElement.querySelector('.disambiguation-item');
      firstItem.click();

      expect(component.isVisible()).toBe(false);
    });

    it('should emit cancelled event when cancel button is clicked', (done) => {
      component.cancelled.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const closeButton = fixture.nativeElement.querySelector('.disambiguation-close');
      closeButton.click();
    });

    it('should hide component after cancel', () => {
      expect(component.isVisible()).toBe(true);

      const closeButton = fixture.nativeElement.querySelector('.disambiguation-close');
      closeButton.click();

      expect(component.isVisible()).toBe(false);
    });
  });

  describe('Keyboard Handling', () => {
    beforeEach(() => {
      componentRef.setInput('candidates', mockCandidates);
      fixture.detectChanges();
    });

    it('should select first candidate on "1" key press', (done) => {
      component.selected.subscribe((candidate) => {
        expect(candidate).toEqual(mockCandidates[0]);
        done();
      });

      const event = new KeyboardEvent('keydown', { key: '1' });
      component.onKeyDown(event);
    });

    it('should select second candidate on "2" key press', (done) => {
      component.selected.subscribe((candidate) => {
        expect(candidate).toEqual(mockCandidates[1]);
        done();
      });

      const event = new KeyboardEvent('keydown', { key: '2' });
      component.onKeyDown(event);
    });

    it('should cancel on Escape key press', (done) => {
      component.cancelled.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeyDown(event);
    });

    it('should ignore invalid numeric keys', () => {
      let emitted = false;
      component.selected.subscribe(() => {
        emitted = true;
      });

      // Try pressing "9" when only 3 candidates exist
      const event = new KeyboardEvent('keydown', { key: '9' });
      component.onKeyDown(event);

      expect(emitted).toBe(false);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      componentRef.setInput('candidates', mockCandidates);
      componentRef.setInput('prompt', 'Which lamp?');
      fixture.detectChanges();
    });

    it('should have role="dialog" on dialog container', () => {
      const dialog = fixture.nativeElement.querySelector('.disambiguation-dialog');
      expect(dialog.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true" on dialog', () => {
      const dialog = fixture.nativeElement.querySelector('.disambiguation-dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label on dialog', () => {
      const dialog = fixture.nativeElement.querySelector('.disambiguation-dialog');
      const ariaLabel = dialog.getAttribute('aria-label');
      expect(ariaLabel).toContain('Which lamp?');
      expect(ariaLabel).toContain('3 options');
    });

    it('should have role="listbox" on list', () => {
      const list = fixture.nativeElement.querySelector('.disambiguation-list');
      expect(list.getAttribute('role')).toBe('listbox');
    });

    it('should have role="option" on list items', () => {
      const items = fixture.nativeElement.querySelectorAll('.disambiguation-item');
      items.forEach((item: Element) => {
        expect(item.getAttribute('role')).toBe('option');
      });
    });

    it('should have aria-label on list items', () => {
      const firstItem = fixture.nativeElement.querySelector('.disambiguation-item');
      const ariaLabel = firstItem.getAttribute('aria-label');
      expect(ariaLabel).toContain('brass lamp');
      expect(ariaLabel).toContain('here');
    });

    it('should have tabindex on list items for keyboard navigation', () => {
      const items = fixture.nativeElement.querySelectorAll('.disambiguation-item');
      items.forEach((item: Element) => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have aria-label on close button', () => {
      const closeButton = fixture.nativeElement.querySelector('.disambiguation-close');
      expect(closeButton.getAttribute('aria-label')).toBe('Cancel disambiguation');
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      componentRef.setInput('candidates', mockCandidates);
      fixture.detectChanges();
    });

    it('should return display candidates limited by maxCandidates', () => {
      componentRef.setInput('maxCandidates', 2);
      const displayed = component.getDisplayCandidates();
      expect(displayed.length).toBe(2);
      expect(displayed[0]).toEqual(mockCandidates[0]);
      expect(displayed[1]).toEqual(mockCandidates[1]);
    });

    it('should return context description', () => {
      expect(component.getContextDescription(mockCandidates[0])).toBe('here');
      expect(component.getContextDescription(mockCandidates[1])).toBe('in the street');
    });

    it('should return "nearby" for missing context', () => {
      const candidateWithoutContext: ObjectCandidate = {
        id: 'test',
        displayName: 'test',
        score: 1,
      };
      expect(component.getContextDescription(candidateWithoutContext)).toBe('nearby');
    });

    it('should generate proper ARIA label', () => {
      componentRef.setInput('prompt', 'Select item');
      const label = component.getAriaLabel();
      expect(label).toContain('Select item');
      expect(label).toContain('3 options');
    });
  });
});
