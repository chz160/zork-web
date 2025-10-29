import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have CRT effect enabled by default', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    expect(app.crtEffectEnabled()).toBe(true);
  });

  it('should toggle CRT effect', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

    // Initially enabled
    expect(app.crtEffectEnabled()).toBe(true);

    // Toggle off
    app.toggleCrtEffect();
    expect(app.crtEffectEnabled()).toBe(false);

    // Toggle on
    app.toggleCrtEffect();
    expect(app.crtEffectEnabled()).toBe(true);
  });

  it('should persist CRT effect preference to localStorage', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

    // Clear localStorage first
    localStorage.removeItem('zork-crt-effect');

    // Toggle and check localStorage
    app.toggleCrtEffect();
    expect(localStorage.getItem('zork-crt-effect')).toBe('false');

    app.toggleCrtEffect();
    expect(localStorage.getItem('zork-crt-effect')).toBe('true');
  });
});
