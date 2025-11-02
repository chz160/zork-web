# Telemetry Export Guide

This guide explains how to export telemetry data for thief events and parser interactions in the Zork Web application.

## Overview

The telemetry system captures structured data about:
- **Thief Events**: tick actions, item theft, deposits, death, revival, and gift acceptance
- **Parser Events**: parse attempts, successes, failures, fuzzy matches, autocorrect, and disambiguation

## Privacy & Consent

The telemetry system respects user privacy:
- **Memory-only storage** by default (no persistent logging)
- **Opt-in/opt-out controls** for data collection
- **Configurable input text collection** (may contain PII)
- **No remote transmission** without explicit consent

## Exporting Telemetry Data

### Browser Console Method (Recommended)

The easiest way to export telemetry data is through the browser console:

1. Open the browser's developer console (F12 or right-click → Inspect)
2. In the console, run one of the following commands:

```javascript
// Enable remote transmission (required for export)
// Get the TelemetryService instance
const telemetryService = window['ng'].getInjector(document.querySelector('app-root')).get('TelemetryService');

// Configure privacy settings to allow export
telemetryService.setPrivacyConfig({ allowRemoteTransmission: true });

// Export with analytics summary
telemetryService.downloadAsJSON();

// Export without analytics summary
telemetryService.downloadAsJSON('my-telemetry.json', false);

// Or get the JSON string directly
const jsonData = telemetryService.exportAsJSON();
console.log(jsonData);
```

### Angular Injection Method (For Developers)

In any Angular component or service, you can inject the TelemetryService:

```typescript
import { inject } from '@angular/core';
import { TelemetryService } from './core/services/telemetry.service';

export class MyComponent {
  private telemetry = inject(TelemetryService);

  exportTelemetry(): void {
    // Configure to allow export
    this.telemetry.setPrivacyConfig({ allowRemoteTransmission: true });
    
    // Download the data
    const success = this.telemetry.downloadAsJSON();
    if (!success) {
      console.error('Telemetry export is not allowed. Check privacy settings.');
    }
  }
}
```

## Export Data Format

The exported JSON file includes:

```json
{
  "events": [
    {
      "type": "thief.tick",
      "timestamp": "2025-11-02T17:00:00.000Z",
      "data": {
        "actorId": "thief",
        "fromRoomId": "round-room",
        "mode": "CONSCIOUS"
      }
    },
    {
      "type": "thief.item_stolen",
      "timestamp": "2025-11-02T17:00:05.000Z",
      "data": {
        "actorId": "thief",
        "itemIds": ["sword", "lamp"],
        "fromRoomId": "round-room",
        "toRoomId": "thief",
        "probability": 0.1
      }
    },
    {
      "type": "thief.item_deposited",
      "timestamp": "2025-11-02T17:00:10.000Z",
      "data": {
        "actorId": "thief",
        "itemIds": ["treasure"],
        "fromRoomId": "thief",
        "toRoomId": "treasure-room"
      }
    },
    {
      "type": "thief.death",
      "timestamp": "2025-11-02T17:00:15.000Z",
      "data": {
        "actorId": "thief",
        "roomId": "round-room",
        "strength": 0
      }
    },
    {
      "type": "thief.revived",
      "timestamp": "2025-11-02T17:00:20.000Z",
      "data": {
        "actorId": "thief",
        "roomId": "round-room",
        "newStrength": 5
      }
    },
    {
      "type": "thief.gift_accepted",
      "timestamp": "2025-11-02T17:00:25.000Z",
      "data": {
        "actorId": "thief",
        "itemId": "gold-coin",
        "itemValue": 10,
        "roomId": "round-room",
        "engrossed": true
      }
    }
  ],
  "analytics": {
    "totalEvents": 100,
    "parseAttempts": 50,
    "parseSuccesses": 45,
    "parseFailures": 5,
    "parseSuccessRate": 0.9,
    "thiefTicks": 10,
    "itemsStolen": 5,
    "itemsDeposited": 3,
    "thiefDeaths": 1,
    "thiefRevivals": 1,
    "thiefGiftsAccepted": 2,
    "topFailedInputs": [],
    "topAmbiguousPhrases": [],
    "topAutocorrects": [],
    "startTime": "2025-11-02T17:00:00.000Z",
    "endTime": "2025-11-02T17:30:00.000Z"
  },
  "exportedAt": "2025-11-02T17:30:00.000Z",
  "privacyConfig": {
    "enabled": true,
    "collectInput": true,
    "allowPersistentStorage": false,
    "allowRemoteTransmission": true
  }
}
```

## Event Types

### Thief Events

- `thief.tick` - Thief actor tick (movement/behavior)
  - `actorId`: ID of the thief actor
  - `fromRoomId`: Current room ID
  - `toRoomId`: (optional) Destination room ID
  - `mode`: Current thief mode (CONSCIOUS, UNCONSCIOUS, DEAD, BUSY)

- `thief.item_stolen` - Items stolen by thief
  - `actorId`: ID of the thief actor
  - `itemIds`: Array of stolen item IDs
  - `fromRoomId`: Room ID where items were stolen
  - `toRoomId`: Destination (usually 'thief')
  - `probability`: (optional) Probability used for stealing

- `thief.item_deposited` - Items deposited by thief
  - `actorId`: ID of the thief actor
  - `itemIds`: Array of deposited item IDs
  - `fromRoomId`: Source (usually 'thief')
  - `toRoomId`: Room ID where items were deposited

- `thief.death` - Thief died
  - `actorId`: ID of the thief actor
  - `roomId`: Room ID where death occurred
  - `strength`: Strength at time of death (0)

- `thief.revived` - Thief regained consciousness
  - `actorId`: ID of the thief actor
  - `roomId`: Room ID where revival occurred
  - `newStrength`: Restored strength value

- `thief.gift_accepted` - Thief accepted a gift from player
  - `actorId`: ID of the thief actor
  - `itemId`: ID of the gifted item
  - `itemValue`: Treasure value of the item
  - `roomId`: Room ID where gift was accepted
  - `engrossed`: Whether thief became engrossed (valuable gift)

### Parser Events

See the main telemetry documentation for parser event types (parse attempts, fuzzy matches, autocorrect, disambiguation, etc.).

## Analytics Summary

The analytics object provides aggregate statistics:

- **totalEvents**: Total number of events logged
- **thiefTicks**: Number of thief tick events
- **itemsStolen**: Number of item stolen events
- **itemsDeposited**: Number of item deposited events
- **thiefDeaths**: Number of thief death events
- **thiefRevivals**: Number of thief revival events
- **thiefGiftsAccepted**: Number of gifts accepted by thief
- **parseAttempts**: Number of parse attempts
- **parseSuccesses**: Number of successful parses
- **parseFailures**: Number of failed parses
- **parseSuccessRate**: Success rate (0-1)
- Additional parser-related metrics...

## Use Cases

### Debugging Thief Behavior

Export telemetry to analyze thief actions and identify issues:

```javascript
// Enable telemetry export
telemetryService.setPrivacyConfig({ allowRemoteTransmission: true });

// Play the game and interact with the thief
// (give gifts, fight, steal items, etc.)

// Export the data
telemetryService.downloadAsJSON('thief-debug.json');

// Analyze the sequence of events to understand thief behavior
```

### Measuring Thief Performance

Use analytics to measure thief activity:

```javascript
const analytics = telemetryService.getAnalytics();
console.log(`Thief ticked ${analytics.thiefTicks} times`);
console.log(`Items stolen: ${analytics.itemsStolen}`);
console.log(`Items deposited: ${analytics.itemsDeposited}`);
console.log(`Deaths: ${analytics.thiefDeaths}`);
console.log(`Revivals: ${analytics.thiefRevivals}`);
```

### ML Training Data

Export anonymized data for machine learning:

```javascript
// Configure for ML export (no user input)
telemetryService.setPrivacyConfig({
  enabled: true,
  collectInput: false,
  allowRemoteTransmission: true
});

// Export anonymized data
const mlData = telemetryService.exportAnonymizedData();
```

## Privacy Best Practices

1. **Always get user consent** before enabling telemetry
2. **Disable input collection** if you don't need user commands: 
   ```javascript
   telemetryService.setPrivacyConfig({ collectInput: false });
   ```
3. **Clear events** when privacy settings change:
   ```javascript
   telemetryService.clearEvents();
   ```
4. **Export only when needed** and delete after use
5. **Never transmit data remotely** without explicit consent

## Clearing Telemetry Data

To clear all telemetry events:

```javascript
telemetryService.clearEvents();
```

This is useful after:
- Exporting data
- Changing privacy settings
- Debugging sessions

## Troubleshooting

### Export Returns Null

**Problem**: `exportAsJSON()` or `downloadAsJSON()` returns `null` or `false`.

**Solution**: Enable remote transmission in privacy config:
```javascript
telemetryService.setPrivacyConfig({ allowRemoteTransmission: true });
```

### No Thief Events Logged

**Problem**: Thief events are not appearing in the export.

**Solution**: 
1. Check that telemetry is enabled: `telemetryService.isEnabled()`
2. Verify the thief is active and performing actions
3. Ensure ThiefActor has TelemetryService injected (may require code changes)

### Export File Too Large

**Problem**: The export file is very large.

**Solution**:
1. Clear events periodically: `telemetryService.clearEvents()`
2. Export smaller time ranges
3. Disable analytics in export: `downloadAsJSON('file.json', false)`

## API Reference

See the TelemetryService TypeScript documentation for complete API details:
- `/src/app/core/services/telemetry.service.ts`
