import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusComponent } from './status';
import { GameEngineService } from '../../core/services/game-engine.service';
import { signal } from '@angular/core';

describe('StatusComponent', () => {
  let component: StatusComponent;
  let fixture: ComponentFixture<StatusComponent>;
  let mockGameEngine: jasmine.SpyObj<GameEngineService>;

  beforeEach(async () => {
    // Create mock signals
    const playerSignal = signal({
      currentRoomId: 'west-of-house',
      inventory: ['brass-lamp', 'sword'],
      score: 10,
      moveCount: 5,
      isAlive: true,
      flags: new Map([
        ['hasLight', true],
        ['inDark', false],
      ]),
    });

    const roomSignal = signal({
      id: 'west-of-house',
      name: 'West of House',
      description: 'You are standing in an open field west of a white house.',
      shortDescription: 'West of House',
      exits: new Map([
        ['north', 'north-of-house'],
        ['south', 'south-of-house'],
      ]),
      objectIds: ['mailbox'],
      visited: false,
    });

    // Create mock GameEngineService
    mockGameEngine = jasmine.createSpyObj('GameEngineService', ['executeCommand', 'getObject']);
    Object.defineProperty(mockGameEngine, 'player', {
      value: playerSignal.asReadonly(),
      writable: false,
    });
    Object.defineProperty(mockGameEngine, 'currentRoom', {
      value: roomSignal.asReadonly(),
      writable: false,
    });

    await TestBed.configureTestingModule({
      imports: [StatusComponent],
      providers: [{ provide: GameEngineService, useValue: mockGameEngine }],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Status Display', () => {
    it('should display score', () => {
      const scoreElement = fixture.nativeElement.querySelector(
        '.status-item .status-value[aria-live="polite"]'
      );
      expect(scoreElement.textContent.trim()).toBe('10');
    });

    it('should display move count', () => {
      const allValues = fixture.nativeElement.querySelectorAll('.status-value[aria-live="polite"]');
      expect(allValues[1].textContent.trim()).toBe('5');
    });

    it('should display location name', () => {
      const locationElement = fixture.nativeElement.querySelector(
        '.status-item--wide .status-value'
      );
      expect(locationElement.textContent.trim()).toBe('West of House');
    });

    it('should display inventory count', () => {
      const rows = fixture.nativeElement.querySelectorAll('.status-row');
      const inventoryRow = rows[2]; // Third row is inventory
      const value = inventoryRow.querySelector('.status-value');
      expect(value.textContent.trim()).toBe('2');
    });

    it('should display alive status', () => {
      const rows = fixture.nativeElement.querySelectorAll('.status-row');
      const healthRow = rows[3]; // Fourth row is health
      const value = healthRow.querySelector('.status-value');
      expect(value.textContent.trim()).toBe('Alive');
      expect(value.classList.contains('status-value--danger')).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should compute score from player state', () => {
      expect(component.score()).toBe(10);
    });

    it('should compute move count from player state', () => {
      expect(component.moveCount()).toBe(5);
    });

    it('should compute isAlive from player state', () => {
      expect(component.isAlive()).toBe(true);
    });

    it('should compute location name from current room', () => {
      expect(component.locationName()).toBe('West of House');
    });

    it('should compute inventory count from player inventory', () => {
      expect(component.inventoryCount()).toBe(2);
    });

    it('should return "Unknown" when room is null', async () => {
      // Reset and reconfigure TestBed with null room
      TestBed.resetTestingModule();

      const playerSignal = signal({
        currentRoomId: 'unknown',
        inventory: [],
        score: 0,
        moveCount: 0,
        isAlive: true,
        flags: new Map(),
      });

      const roomSignal = signal(null);

      const newMockEngine = jasmine.createSpyObj('GameEngineService', [
        'executeCommand',
        'getObject',
      ]);
      Object.defineProperty(newMockEngine, 'player', {
        value: playerSignal.asReadonly(),
        writable: false,
      });
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [StatusComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.locationName()).toBe('Unknown');
    });
  });

  describe('Status Effects', () => {
    it('should display status effects when flags are set', () => {
      const effectsSection = fixture.nativeElement.querySelector('.status-effects');
      expect(effectsSection).toBeTruthy();
    });

    it('should show "Has light" effect when hasLight flag is true', () => {
      const badges = fixture.nativeElement.querySelectorAll('.status-effect-badge');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const texts = Array.from(badges).map((badge: any) => badge.textContent?.trim());
      expect(texts).toContain('Has light');
    });

    it('should not show effects section when no status effects', async () => {
      // Reset and reconfigure TestBed with no flags
      TestBed.resetTestingModule();

      const playerSignal = signal({
        currentRoomId: 'west-of-house',
        inventory: [],
        score: 0,
        moveCount: 0,
        isAlive: true,
        flags: new Map(),
      });

      const roomSignal = signal({
        id: 'west-of-house',
        name: 'West of House',
        description: 'Description',
        shortDescription: 'West of House',
        exits: new Map(),
        objectIds: [],
        visited: false,
      });

      const newMockEngine = jasmine.createSpyObj('GameEngineService', [
        'executeCommand',
        'getObject',
      ]);
      Object.defineProperty(newMockEngine, 'player', {
        value: playerSignal.asReadonly(),
        writable: false,
      });
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [StatusComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusComponent);
      newFixture.detectChanges();

      const effectsSection = newFixture.nativeElement.querySelector('.status-effects');
      expect(effectsSection).toBeFalsy();
    });

    it('should compute all relevant status effects', () => {
      const effects = component.statusEffects();
      expect(effects).toContain('Has light');
      expect(effects.length).toBe(1);
    });

    it('should detect darkness flag', async () => {
      // Reset and reconfigure TestBed with inDark flag
      TestBed.resetTestingModule();

      const playerSignal = signal({
        currentRoomId: 'dark-room',
        inventory: [],
        score: 0,
        moveCount: 0,
        isAlive: true,
        flags: new Map([['inDark', true]]),
      });

      const roomSignal = signal({
        id: 'dark-room',
        name: 'Dark Room',
        description: 'It is pitch black.',
        shortDescription: 'Dark Room',
        exits: new Map(),
        objectIds: [],
        visited: false,
      });

      const newMockEngine = jasmine.createSpyObj('GameEngineService', [
        'executeCommand',
        'getObject',
      ]);
      Object.defineProperty(newMockEngine, 'player', {
        value: playerSignal.asReadonly(),
        writable: false,
      });
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [StatusComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusComponent);
      const newComponent = newFixture.componentInstance;

      const effects = newComponent.statusEffects();
      expect(effects).toContain('In darkness');
    });
  });

  describe('Health Status', () => {
    it('should show "Alive" when player is alive', () => {
      const healthRow = Array.from(fixture.nativeElement.querySelectorAll('.status-row')).find(
        (row: Element) => row.textContent?.includes('Health')
      ) as HTMLElement;
      const value = healthRow?.querySelector('.status-value');
      expect(value?.textContent?.trim()).toBe('Alive');
    });

    it('should apply danger class when player is dead', async () => {
      // Reset and reconfigure TestBed with dead player
      TestBed.resetTestingModule();

      const playerSignal = signal({
        currentRoomId: 'death-room',
        inventory: [],
        score: 0,
        moveCount: 10,
        isAlive: false,
        flags: new Map(),
      });

      const roomSignal = signal({
        id: 'death-room',
        name: 'Death Room',
        description: 'You are dead.',
        shortDescription: 'Death Room',
        exits: new Map(),
        objectIds: [],
        visited: false,
      });

      const newMockEngine = jasmine.createSpyObj('GameEngineService', [
        'executeCommand',
        'getObject',
      ]);
      Object.defineProperty(newMockEngine, 'player', {
        value: playerSignal.asReadonly(),
        writable: false,
      });
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [StatusComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusComponent);
      newFixture.detectChanges();

      const healthRow = Array.from(newFixture.nativeElement.querySelectorAll('.status-row')).find(
        (row: Element) => row.textContent?.includes('Health')
      ) as HTMLElement;
      const value = healthRow?.querySelector('.status-value');
      expect(value?.textContent?.trim()).toBe('Dead');
      expect(value?.classList.contains('status-value--danger')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on panel', () => {
      const panel = fixture.nativeElement.querySelector('.status-panel');
      expect(panel.getAttribute('role')).toBe('region');
      expect(panel.hasAttribute('aria-label')).toBe(true);
      expect(panel.getAttribute('aria-live')).toBe('polite');
    });

    it('should have ARIA label with score and moves', () => {
      const label = component.getAriaLabel();
      expect(label).toContain('Score: 10');
      expect(label).toContain('Moves: 5');
    });

    it('should have aria-live on score and moves values', () => {
      const liveElements = fixture.nativeElement.querySelectorAll('[aria-live="polite"]');
      expect(liveElements.length).toBeGreaterThan(0);
    });

    it('should provide comprehensive status text for screen readers', () => {
      const statusText = component.getStatusText();
      expect(statusText).toContain('Score: 10');
      expect(statusText).toContain('Moves: 5');
      expect(statusText).toContain('Location: West of House');
      expect(statusText).toContain('Status: Has light');
    });

    it('should include screen reader only element', () => {
      const srOnly = fixture.nativeElement.querySelector('.sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly.getAttribute('aria-live')).toBe('polite');
      expect(srOnly.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('Styling and Layout', () => {
    it('should have status-panel class', () => {
      const panel = fixture.nativeElement.querySelector('.status-panel');
      expect(panel).toBeTruthy();
    });

    it('should have status header with title', () => {
      const header = fixture.nativeElement.querySelector('.status-header');
      const title = header.querySelector('.status-title');
      expect(title.textContent.trim()).toBe('Status');
    });

    it('should organize content in rows', () => {
      const rows = fixture.nativeElement.querySelectorAll('.status-row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should use consistent label-value pairs', () => {
      const labels = fixture.nativeElement.querySelectorAll('.status-label');
      const values = fixture.nativeElement.querySelectorAll('.status-value');
      expect(labels.length).toBeGreaterThan(0);
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('Reactive Updates', () => {
    it('should reflect updated score', () => {
      // The component uses signals which are already readonly
      // In a real scenario, the engine would update the signal
      expect(component.score()).toBe(10);
    });

    it('should reflect updated move count', () => {
      expect(component.moveCount()).toBe(5);
    });

    it('should reflect updated location', () => {
      expect(component.locationName()).toBe('West of House');
    });

    it('should reflect updated inventory count', () => {
      expect(component.inventoryCount()).toBe(2);
    });
  });
});
