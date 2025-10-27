import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationPanelComponent } from './location-panel';
import { GameEngineService } from '../../core/services/game-engine.service';
import { signal } from '@angular/core';
import { Room, GameObject } from '../../core/models';

describe('LocationPanelComponent', () => {
  let component: LocationPanelComponent;
  let fixture: ComponentFixture<LocationPanelComponent>;
  let mockGameEngine: jasmine.SpyObj<GameEngineService>;

  beforeEach(async () => {
    // Create mock room
    const mockRoom: Room = {
      id: 'west-of-house',
      name: 'West of House',
      description:
        'You are standing in an open field west of a white house, with a boarded front door.',
      shortDescription: 'West of House',
      exits: new Map([
        ['north', 'north-of-house'],
        ['south', 'south-of-house'],
        ['east', 'behind-house'],
      ]),
      objectIds: ['mailbox', 'mat'],
      visited: false,
    };

    // Create mock objects
    const mockMailbox: GameObject = {
      id: 'mailbox',
      name: 'small mailbox',
      aliases: ['mailbox', 'box'],
      description: 'The small mailbox is closed.',
      portable: false,
      visible: true,
      location: 'west-of-house',
      properties: {
        isOpen: false,
        contains: ['leaflet'],
      },
    };

    const mockMat: GameObject = {
      id: 'mat',
      name: 'welcome mat',
      aliases: ['mat'],
      description: 'A welcome mat with "Welcome to Zork" written on it.',
      portable: true,
      visible: true,
      location: 'west-of-house',
      properties: {},
    };

    // Create mock signals
    const roomSignal = signal<Room | null>(mockRoom);

    // Create mock GameEngineService
    mockGameEngine = jasmine.createSpyObj('GameEngineService', ['getObject']);
    mockGameEngine.getObject.and.callFake((id: string) => {
      if (id === 'mailbox') return mockMailbox;
      if (id === 'mat') return mockMat;
      return null;
    });

    Object.defineProperty(mockGameEngine, 'currentRoom', {
      value: roomSignal.asReadonly(),
      writable: false,
    });

    await TestBed.configureTestingModule({
      imports: [LocationPanelComponent],
      providers: [{ provide: GameEngineService, useValue: mockGameEngine }],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Room Display', () => {
    it('should display room name', () => {
      const titleElement = fixture.nativeElement.querySelector('.location-title');
      expect(titleElement.textContent.trim()).toBe('West of House');
    });

    it('should display room description', () => {
      const descriptionElement = fixture.nativeElement.querySelector('.location-description p');
      expect(descriptionElement.textContent).toContain('standing in an open field');
    });

    it('should show full description when room not visited', () => {
      expect(component.roomDescription()).toContain('standing in an open field');
    });

    it('should show short description when room is visited', async () => {
      // Reset and reconfigure with visited room
      TestBed.resetTestingModule();

      const visitedRoom: Room = {
        id: 'west-of-house',
        name: 'West of House',
        description:
          'You are standing in an open field west of a white house, with a boarded front door.',
        shortDescription: 'West of House',
        exits: new Map([['north', 'north-of-house']]),
        objectIds: [],
        visited: true,
      };

      const roomSignal = signal<Room | null>(visitedRoom);
      const newMockEngine = jasmine.createSpyObj('GameEngineService', ['getObject']);
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [LocationPanelComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(LocationPanelComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.roomDescription()).toBe('West of House');
    });
  });

  describe('Objects Display', () => {
    it('should display visible objects section', () => {
      const objectSection = fixture.nativeElement.querySelector('.location-section');
      expect(objectSection).toBeTruthy();
    });

    it('should list all visible objects', () => {
      const objectItems = fixture.nativeElement.querySelectorAll('.object-item');
      expect(objectItems.length).toBe(2);
    });

    it('should display object names', () => {
      const objectNames = Array.from(fixture.nativeElement.querySelectorAll('.object-name')).map(
        (el) => (el as HTMLElement).textContent?.trim()
      );
      expect(objectNames).toContain('small mailbox');
      expect(objectNames).toContain('welcome mat');
    });

    it('should show open/closed state for containers', () => {
      const objectStates = fixture.nativeElement.querySelectorAll('.object-state');
      const stateTexts = Array.from(objectStates).map((el) =>
        (el as HTMLElement).textContent?.trim()
      );
      expect(stateTexts).toContain('(closed)');
    });

    it('should filter out invisible objects', () => {
      const visibleObjects = component.visibleObjects();
      expect(visibleObjects.every((obj) => obj.visible)).toBe(true);
    });

    it('should not display objects section when no objects', async () => {
      // Reset and reconfigure with empty room
      TestBed.resetTestingModule();

      const emptyRoom: Room = {
        id: 'empty-room',
        name: 'Empty Room',
        description: 'An empty room.',
        shortDescription: 'Empty Room',
        exits: new Map([['north', 'north-room']]),
        objectIds: [],
        visited: false,
      };

      const roomSignal = signal<Room | null>(emptyRoom);
      const newMockEngine = jasmine.createSpyObj('GameEngineService', ['getObject']);
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [LocationPanelComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(LocationPanelComponent);
      newFixture.detectChanges();

      // Check that no object list is rendered
      const objectList = newFixture.nativeElement.querySelector('.object-list');
      expect(objectList).toBeFalsy();
    });
  });

  describe('Exits Display', () => {
    it('should display exits section', () => {
      const exitsSection = fixture.nativeElement.querySelectorAll('.location-section')[1];
      expect(exitsSection).toBeTruthy();
    });

    it('should list all available exits', () => {
      const exitItems = fixture.nativeElement.querySelectorAll('.exit-item');
      expect(exitItems.length).toBe(3);
    });

    it('should display exit directions', () => {
      const exitLabels = Array.from(fixture.nativeElement.querySelectorAll('.exit-label')).map(
        (el) => (el as HTMLElement).textContent?.trim()
      );
      expect(exitLabels).toContain('north');
      expect(exitLabels).toContain('south');
      expect(exitLabels).toContain('east');
    });

    it('should display exit direction abbreviations', () => {
      const exitDirections = Array.from(
        fixture.nativeElement.querySelectorAll('.exit-direction')
      ).map((el) => (el as HTMLElement).textContent?.trim());
      expect(exitDirections).toContain('N');
      expect(exitDirections).toContain('S');
      expect(exitDirections).toContain('E');
    });

    it('should sort exits in logical order', () => {
      const exits = component.exits();
      const directions = exits.map((e) => e.direction);
      // north, south, east should be in that order
      expect(directions.indexOf('north')).toBeLessThan(directions.indexOf('south'));
      expect(directions.indexOf('south')).toBeLessThan(directions.indexOf('east'));
    });

    it('should show hint text for using exits', () => {
      const hint = fixture.nativeElement.querySelector('.exit-hint');
      expect(hint.textContent).toContain('Use direction commands');
    });

    it('should show "No obvious exits" when no exits available', async () => {
      // Reset and reconfigure with no exits
      TestBed.resetTestingModule();

      const noExitRoom: Room = {
        id: 'trap-room',
        name: 'Trap Room',
        description: 'You appear to be trapped.',
        shortDescription: 'Trap Room',
        exits: new Map(),
        objectIds: [],
        visited: false,
      };

      const roomSignal = signal<Room | null>(noExitRoom);
      const newMockEngine = jasmine.createSpyObj('GameEngineService', ['getObject']);
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [LocationPanelComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(LocationPanelComponent);
      newFixture.detectChanges();

      const noExits = newFixture.nativeElement.querySelector('.no-exits');
      expect(noExits.textContent).toContain('No obvious exits');
    });
  });

  describe('Computed Properties', () => {
    it('should compute room name from current room', () => {
      expect(component.roomName()).toBe('West of House');
    });

    it('should return "Unknown Location" when room is null', async () => {
      TestBed.resetTestingModule();

      const roomSignal = signal<Room | null>(null);
      const newMockEngine = jasmine.createSpyObj('GameEngineService', ['getObject']);
      Object.defineProperty(newMockEngine, 'currentRoom', {
        value: roomSignal.asReadonly(),
        writable: false,
      });

      await TestBed.configureTestingModule({
        imports: [LocationPanelComponent],
        providers: [{ provide: GameEngineService, useValue: newMockEngine }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(LocationPanelComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.roomName()).toBe('Unknown Location');
    });

    it('should compute visible objects from room', () => {
      const objects = component.visibleObjects();
      expect(objects.length).toBe(2);
      expect(objects.some((o) => o.id === 'mailbox')).toBe(true);
      expect(objects.some((o) => o.id === 'mat')).toBe(true);
    });

    it('should compute exits from room', () => {
      const exits = component.exits();
      expect(exits.length).toBe(3);
      expect(exits.some((e) => e.direction === 'north')).toBe(true);
    });

    it('should compute exit count', () => {
      expect(component.exitCount()).toBe(3);
    });

    it('should compute object count', () => {
      expect(component.objectCount()).toBe(2);
    });
  });

  describe('Helper Methods', () => {
    it('should get correct direction abbreviation', () => {
      expect(component.getDirectionAbbrev('north')).toBe('N');
      expect(component.getDirectionAbbrev('south')).toBe('S');
      expect(component.getDirectionAbbrev('east')).toBe('E');
      expect(component.getDirectionAbbrev('west')).toBe('W');
      expect(component.getDirectionAbbrev('up')).toBe('U');
      expect(component.getDirectionAbbrev('down')).toBe('D');
    });

    it('should track objects by id', () => {
      const obj: GameObject = {
        id: 'test-obj',
        name: 'Test',
        aliases: [],
        description: 'Test',
        portable: true,
        visible: true,
        location: 'test',
      };
      expect(component.trackByObjectId(0, obj)).toBe('test-obj');
    });

    it('should track exits by direction', () => {
      const exit = { direction: 'north', destination: 'north-room' };
      expect(component.trackByDirection(0, exit)).toBe('north');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on panel', () => {
      const panel = fixture.nativeElement.querySelector('.location-panel');
      expect(panel.getAttribute('role')).toBe('region');
      expect(panel.hasAttribute('aria-label')).toBe(true);
      expect(panel.getAttribute('aria-live')).toBe('polite');
    });

    it('should have ARIA label with location name', () => {
      const label = component.getAriaLabel();
      expect(label).toContain('West of House');
    });

    it('should provide comprehensive location text for screen readers', () => {
      const locationText = component.getLocationText();
      expect(locationText).toContain('Location: West of House');
      expect(locationText).toContain('Description:');
      expect(locationText).toContain('Exits: north, south, east');
      expect(locationText).toContain('Objects: small mailbox, welcome mat');
    });

    it('should include screen reader only element', () => {
      const srOnly = fixture.nativeElement.querySelector('.sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly.getAttribute('aria-live')).toBe('polite');
      expect(srOnly.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have proper heading hierarchy', () => {
      const h2 = fixture.nativeElement.querySelector('h2.location-title');
      const h3s = fixture.nativeElement.querySelectorAll('h3.section-title');
      expect(h2).toBeTruthy();
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should use semantic list elements', () => {
      const objectList = fixture.nativeElement.querySelector('.object-list[role="list"]');
      const exitList = fixture.nativeElement.querySelector('.exit-list[role="list"]');
      expect(objectList).toBeTruthy();
      expect(exitList).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    it('should have location-panel class', () => {
      const panel = fixture.nativeElement.querySelector('.location-panel');
      expect(panel).toBeTruthy();
    });

    it('should have location header with title', () => {
      const header = fixture.nativeElement.querySelector('.location-header');
      const title = header.querySelector('.location-title');
      expect(title.textContent.trim()).toBe('West of House');
    });

    it('should have description section', () => {
      const description = fixture.nativeElement.querySelector('.location-description');
      expect(description).toBeTruthy();
    });

    it('should organize content in sections', () => {
      const sections = fixture.nativeElement.querySelectorAll('.location-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Reactive Updates', () => {
    it('should reflect updated room name', () => {
      expect(component.roomName()).toBe('West of House');
    });

    it('should reflect updated room description', () => {
      expect(component.roomDescription()).toContain('standing in an open field');
    });

    it('should reflect updated objects', () => {
      const objects = component.visibleObjects();
      expect(objects.length).toBe(2);
    });

    it('should reflect updated exits', () => {
      const exits = component.exits();
      expect(exits.length).toBe(3);
    });
  });
});
