import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CrtEffectDirective } from './crt-effect.directive';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [CrtEffectDirective],
  template: '<div [appCrtEffect]="enabled()">Test Content</div>',
})
class TestHostComponent {
  enabled = signal(true);
}

describe('CrtEffectDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let divElement: HTMLDivElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    divElement = fixture.nativeElement.querySelector('div');
    fixture.detectChanges();
  });

  it('should create the directive', () => {
    expect(divElement).toBeTruthy();
  });

  it('should apply crt-effect class when enabled is true', () => {
    component.enabled.set(true);
    fixture.detectChanges();
    expect(divElement.classList.contains('crt-effect')).toBe(true);
  });

  it('should remove crt-effect class when enabled is false', () => {
    component.enabled.set(false);
    fixture.detectChanges();
    expect(divElement.classList.contains('crt-effect')).toBe(false);
  });

  it('should toggle class when enabled changes', () => {
    // Start enabled
    component.enabled.set(true);
    fixture.detectChanges();
    expect(divElement.classList.contains('crt-effect')).toBe(true);

    // Disable
    component.enabled.set(false);
    fixture.detectChanges();
    expect(divElement.classList.contains('crt-effect')).toBe(false);

    // Enable again
    component.enabled.set(true);
    fixture.detectChanges();
    expect(divElement.classList.contains('crt-effect')).toBe(true);
  });

  it('should be enabled by default', () => {
    expect(divElement.classList.contains('crt-effect')).toBe(true);
  });
});
