import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutocorrectConfirmationComponent } from './autocorrect-confirmation';
import { ComponentRef } from '@angular/core';

describe('AutocorrectConfirmationComponent', () => {
  let component: AutocorrectConfirmationComponent;
  let componentRef: ComponentRef<AutocorrectConfirmationComponent>;
  let fixture: ComponentFixture<AutocorrectConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocorrectConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AutocorrectConfirmationComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Inputs', () => {
    it('should accept originalInput input', () => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      fixture.detectChanges();

      expect(component.originalInput()).toBe('mailbax');
    });

    it('should accept suggestion input', () => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      fixture.detectChanges();

      expect(component.suggestion()).toBe('mailbox');
    });

    it('should accept confidence input', () => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      componentRef.setInput('confidence', 0.92);
      fixture.detectChanges();

      expect(component.confidence()).toBe(0.92);
    });

    it('should have default confidence of 0.85', () => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      fixture.detectChanges();

      expect(component.confidence()).toBe(0.85);
    });
  });

  describe('UI Rendering', () => {
    beforeEach(() => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      componentRef.setInput('confidence', 0.92);
      fixture.detectChanges();
    });

    it('should display the suggestion', () => {
      const suggestion = fixture.nativeElement.querySelector('.autocorrect-suggestion');
      expect(suggestion.textContent).toContain('mailbox');
    });

    it('should display the original input', () => {
      const originalInput = fixture.nativeElement.querySelector('.autocorrect-input');
      expect(originalInput.textContent).toContain('mailbax');
    });

    it('should display confidence percentage', () => {
      const confidence = fixture.nativeElement.querySelector('.autocorrect-confidence');
      expect(confidence.textContent).toContain('92%');
    });

    it('should not display confidence if 100%', () => {
      componentRef.setInput('confidence', 1.0);
      fixture.detectChanges();

      const confidence = fixture.nativeElement.querySelector('.autocorrect-confidence');
      expect(confidence).toBeNull();
    });

    it('should display accept button with keyboard shortcut', () => {
      const acceptButton = fixture.nativeElement.querySelector('.autocorrect-button--accept');
      expect(acceptButton.textContent).toContain('Y');
      expect(acceptButton.textContent).toContain('es');
    });

    it('should display reject button with keyboard shortcut', () => {
      const rejectButton = fixture.nativeElement.querySelector('.autocorrect-button--reject');
      expect(rejectButton.textContent).toContain('N');
      expect(rejectButton.textContent).toContain('o');
    });
  });

  describe('Accept/Reject Handling', () => {
    beforeEach(() => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      fixture.detectChanges();
    });

    it('should emit accepted event when accept button is clicked', (done) => {
      component.accepted.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const acceptButton = fixture.nativeElement.querySelector('.autocorrect-button--accept');
      acceptButton.click();
    });

    it('should hide component after accepting', () => {
      expect(component.isVisible()).toBe(true);

      const acceptButton = fixture.nativeElement.querySelector('.autocorrect-button--accept');
      acceptButton.click();

      expect(component.isVisible()).toBe(false);
    });

    it('should emit rejected event when reject button is clicked', (done) => {
      component.rejected.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const rejectButton = fixture.nativeElement.querySelector('.autocorrect-button--reject');
      rejectButton.click();
    });

    it('should hide component after rejecting', () => {
      expect(component.isVisible()).toBe(true);

      const rejectButton = fixture.nativeElement.querySelector('.autocorrect-button--reject');
      rejectButton.click();

      expect(component.isVisible()).toBe(false);
    });
  });

  describe('Keyboard Handling', () => {
    beforeEach(() => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      fixture.detectChanges();
    });

    it('should accept on "y" key press', (done) => {
      component.accepted.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const event = new KeyboardEvent('keydown', { key: 'y' });
      component.onKeyDown(event);
    });

    it('should accept on "Y" key press', (done) => {
      component.accepted.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const event = new KeyboardEvent('keydown', { key: 'Y' });
      component.onKeyDown(event);
    });

    it('should reject on "n" key press', (done) => {
      component.rejected.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const event = new KeyboardEvent('keydown', { key: 'n' });
      component.onKeyDown(event);
    });

    it('should reject on "N" key press', (done) => {
      component.rejected.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const event = new KeyboardEvent('keydown', { key: 'N' });
      component.onKeyDown(event);
    });

    it('should reject on Escape key press', (done) => {
      component.rejected.subscribe(() => {
        expect(true).toBe(true); // Assertion to satisfy Jasmine
        done();
      });

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeyDown(event);
    });

    it('should not emit events on other key presses', () => {
      let acceptEmitted = false;
      let rejectEmitted = false;

      component.accepted.subscribe(() => {
        acceptEmitted = true;
      });
      component.rejected.subscribe(() => {
        rejectEmitted = true;
      });

      const event = new KeyboardEvent('keydown', { key: 'a' });
      component.onKeyDown(event);

      expect(acceptEmitted).toBe(false);
      expect(rejectEmitted).toBe(false);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      fixture.detectChanges();
    });

    it('should have role="alert" on container', () => {
      const container = fixture.nativeElement.querySelector('.autocorrect-confirmation');
      expect(container.getAttribute('role')).toBe('alert');
    });

    it('should have aria-label on container', () => {
      const container = fixture.nativeElement.querySelector('.autocorrect-confirmation');
      const ariaLabel = container.getAttribute('aria-label');
      expect(ariaLabel).toContain('mailbox');
      expect(ariaLabel).toContain('Press Y to accept or N to reject');
    });

    it('should have aria-label on accept button', () => {
      const acceptButton = fixture.nativeElement.querySelector('.autocorrect-button--accept');
      expect(acceptButton.getAttribute('aria-label')).toBe('Accept suggestion');
    });

    it('should have aria-label on reject button', () => {
      const rejectButton = fixture.nativeElement.querySelector('.autocorrect-button--reject');
      expect(rejectButton.getAttribute('aria-label')).toBe('Reject suggestion');
    });

    it('should have tabindex for keyboard navigation', () => {
      const container = fixture.nativeElement.querySelector('.autocorrect-confirmation');
      expect(container.getAttribute('tabindex')).toBe('-1');
    });

    it('should have aria-hidden on decorative icon', () => {
      const icon = fixture.nativeElement.querySelector('.autocorrect-icon svg');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      componentRef.setInput('originalInput', 'mailbax');
      componentRef.setInput('suggestion', 'mailbox');
      componentRef.setInput('confidence', 0.92);
      fixture.detectChanges();
    });

    it('should generate proper ARIA label', () => {
      const label = component.getAriaLabel();
      expect(label).toBe('Did you mean mailbox? Press Y to accept or N to reject');
    });

    it('should format confidence as percentage', () => {
      expect(component.getConfidencePercent()).toBe('92%');
    });

    it('should round confidence percentage', () => {
      componentRef.setInput('confidence', 0.876);
      expect(component.getConfidencePercent()).toBe('88%');
    });
  });
});
