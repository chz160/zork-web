import { TestBed } from '@angular/core/testing';
import { VisibilityInspectorService } from './visibility-inspector.service';
import { GameObject } from '../models/game-object.model';

describe('VisibilityInspectorService', () => {
  let service: VisibilityInspectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisibilityInspectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('inspectItem', () => {
    it('should identify visible item', () => {
      const item: GameObject = {
        id: 'sword',
        name: 'sword',
        description: 'A sharp sword',
        portable: true,
        visible: true,
        location: 'west-of-house',
      };

      const info = service.inspectItem(item);

      expect(info.effectiveVisibility).toBe('visible');
      expect(info.visible).toBe(true);
      expect(info.hidden).toBe(false);
      expect(info.touched).toBe(false);
      expect(info.explanation).toContain('visible normally');
    });

    it('should identify invisible item', () => {
      const item: GameObject = {
        id: 'treasure',
        name: 'treasure',
        description: 'A valuable treasure',
        portable: true,
        visible: false,
        location: 'thief',
      };

      const info = service.inspectItem(item);

      expect(info.effectiveVisibility).toBe('invisible');
      expect(info.visible).toBe(false);
      expect(info.hidden).toBe(false);
      expect(info.explanation).toContain('invisible');
    });

    it('should identify touched invisible item', () => {
      const item: GameObject = {
        id: 'rope',
        name: 'rope',
        description: 'A rope',
        portable: true,
        visible: false,
        location: 'thief',
        properties: {
          touched: true,
        },
      };

      const info = service.inspectItem(item);

      expect(info.effectiveVisibility).toBe('invisible');
      expect(info.touched).toBe(true);
      expect(info.explanation).toContain('stolen by thief');
    });

    it('should identify hidden item', () => {
      const item: GameObject = {
        id: 'secret-door',
        name: 'secret door',
        description: 'A hidden door',
        portable: false,
        visible: true,
        hidden: true,
        location: 'library',
      };

      const info = service.inspectItem(item);

      expect(info.effectiveVisibility).toBe('hidden');
      expect(info.visible).toBe(true);
      expect(info.hidden).toBe(true);
      expect(info.explanation).toContain('explicitly hidden');
    });

    it('should identify conditional visibility item', () => {
      const item: GameObject = {
        id: 'shadow',
        name: 'shadow',
        description: 'A mysterious shadow',
        portable: false,
        visible: true,
        location: 'dark-room',
        visibleFor: ['has_lantern', 'daylight'],
      };

      const info = service.inspectItem(item);

      expect(info.effectiveVisibility).toBe('conditional');
      expect(info.visibleFor).toEqual(['has_lantern', 'daylight']);
      expect(info.explanation).toContain('conditional');
      expect(info.explanation).toContain('has_lantern');
    });
  });

  describe('findInvisibleItems', () => {
    let items: Map<string, GameObject>;

    beforeEach(() => {
      items = new Map([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'room1',
          },
        ],
        [
          'treasure',
          {
            id: 'treasure',
            name: 'treasure',
            description: 'treasure',
            portable: true,
            visible: false,
            location: 'thief',
          },
        ],
        [
          'secret',
          {
            id: 'secret',
            name: 'secret',
            description: 'secret',
            portable: false,
            visible: true,
            hidden: true,
            location: 'room2',
          },
        ],
      ]);
    });

    it('should find all non-visible items including hidden', () => {
      const invisibleItems = service.findInvisibleItems(items, true);

      expect(invisibleItems.length).toBe(2);
      expect(invisibleItems.some((i) => i.id === 'treasure')).toBe(true);
      expect(invisibleItems.some((i) => i.id === 'secret')).toBe(true);
    });

    it('should exclude hidden items when requested', () => {
      const invisibleItems = service.findInvisibleItems(items, false);

      expect(invisibleItems.length).toBe(1);
      expect(invisibleItems[0].id).toBe('treasure');
    });

    it('should return empty array when all items are visible', () => {
      const visibleItems = new Map([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'room1',
          },
        ],
      ]);

      const invisibleItems = service.findInvisibleItems(visibleItems);

      expect(invisibleItems.length).toBe(0);
    });
  });

  describe('inspectLocation', () => {
    it('should find all items at a location', () => {
      const items = new Map<string, GameObject>([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'room1',
          },
        ],
        [
          'treasure',
          {
            id: 'treasure',
            name: 'treasure',
            description: 'treasure',
            portable: true,
            visible: false,
            location: 'room1',
          },
        ],
        [
          'lamp',
          {
            id: 'lamp',
            name: 'lamp',
            description: 'lamp',
            portable: true,
            visible: true,
            location: 'room2',
          },
        ],
      ]);

      const room1Items = service.inspectLocation(items, 'room1');

      expect(room1Items.length).toBe(2);
      expect(room1Items.some((i) => i.id === 'sword')).toBe(true);
      expect(room1Items.some((i) => i.id === 'treasure')).toBe(true);
      expect(room1Items.some((i) => i.id === 'lamp')).toBe(false);
    });

    it('should return empty array for location with no items', () => {
      const items = new Map<string, GameObject>([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'room1',
          },
        ],
      ]);

      const emptyRoom = service.inspectLocation(items, 'room2');

      expect(emptyRoom.length).toBe(0);
    });
  });

  describe('findTouchedItems', () => {
    it('should find all touched items', () => {
      const items = new Map<string, GameObject>([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'room1',
            properties: {
              touched: true,
            },
          },
        ],
        [
          'treasure',
          {
            id: 'treasure',
            name: 'treasure',
            description: 'treasure',
            portable: true,
            visible: false,
            location: 'thief',
            properties: {
              touched: true,
            },
          },
        ],
        [
          'lamp',
          {
            id: 'lamp',
            name: 'lamp',
            description: 'lamp',
            portable: true,
            visible: true,
            location: 'room2',
          },
        ],
      ]);

      const touchedItems = service.findTouchedItems(items);

      expect(touchedItems.length).toBe(2);
      expect(touchedItems.some((i) => i.id === 'sword')).toBe(true);
      expect(touchedItems.some((i) => i.id === 'treasure')).toBe(true);
    });

    it('should return empty array when no items are touched', () => {
      const items = new Map<string, GameObject>([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'room1',
          },
        ],
      ]);

      const touchedItems = service.findTouchedItems(items);

      expect(touchedItems.length).toBe(0);
    });
  });

  describe('formatForConsole', () => {
    it('should format visible item info', () => {
      const info = {
        id: 'sword',
        name: 'sword',
        location: 'room1',
        visible: true,
        hidden: false,
        touched: false,
        effectiveVisibility: 'visible' as const,
        explanation: 'Item is visible normally',
      };

      const formatted = service.formatForConsole(info);

      expect(formatted).toContain('sword (sword)');
      expect(formatted).toContain('Location: room1');
      expect(formatted).toContain('VISIBLE');
      expect(formatted).toContain('visible=true');
      expect(formatted).toContain('hidden=false');
      expect(formatted).toContain('touched=false');
    });

    it('should format conditional visibility item with conditions', () => {
      const info = {
        id: 'shadow',
        name: 'shadow',
        location: 'dark-room',
        visible: true,
        hidden: false,
        touched: false,
        visibleFor: ['has_lantern', 'daylight'],
        effectiveVisibility: 'conditional' as const,
        explanation: 'Item visibility is conditional',
      };

      const formatted = service.formatForConsole(info);

      expect(formatted).toContain('Conditions: has_lantern, daylight');
    });
  });

  describe('formatListForConsole', () => {
    it('should format empty list', () => {
      const formatted = service.formatListForConsole([]);

      expect(formatted).toBe('(none)');
    });

    it('should format empty list with title', () => {
      const formatted = service.formatListForConsole([], 'Invisible Items');

      expect(formatted).toContain('Invisible Items');
      expect(formatted).toContain('(none)');
    });

    it('should format list with multiple items', () => {
      const infos = [
        {
          id: 'sword',
          name: 'sword',
          location: 'room1',
          visible: true,
          hidden: false,
          touched: false,
          effectiveVisibility: 'visible' as const,
          explanation: 'Item is visible',
        },
        {
          id: 'treasure',
          name: 'treasure',
          location: 'thief',
          visible: false,
          hidden: false,
          touched: true,
          effectiveVisibility: 'invisible' as const,
          explanation: 'Item is invisible',
        },
      ];

      const formatted = service.formatListForConsole(infos, 'Test Items');

      expect(formatted).toContain('Test Items');
      expect(formatted).toContain('sword (sword)');
      expect(formatted).toContain('treasure (treasure)');
    });
  });
});
