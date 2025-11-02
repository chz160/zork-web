# Telemetry Quick Start Guide

This is a quick reference for using the thief telemetry feature.

## Quick Export (5 seconds)

Open the browser console (F12) and run:

```javascript
// Get TelemetryService
const app = document.querySelector('app-root');
const injector = window['ng'].getInjector(app);
const telemetry = injector.get('TelemetryService');

// Enable export
telemetry.setPrivacyConfig({ allowRemoteTransmission: true });

// Download telemetry data
telemetry.downloadAsJSON();
```

The file `telemetry-YYYY-MM-DD.json` will download automatically.

## What Gets Captured

### Thief Events
- **Ticks**: Movement and behavior updates
- **Stealing**: Items stolen from rooms
- **Depositing**: Items deposited in treasure room
- **Death**: When thief dies in combat
- **Revival**: When thief regains consciousness
- **Gifts**: When player gives items to thief

### Parser Events (bonus)
- Parse attempts and successes/failures
- Fuzzy matching and autocorrect
- Disambiguation prompts

## Example Output

```json
{
  "events": [
    {
      "type": "thief.item_stolen",
      "timestamp": "2025-11-02T17:00:00.000Z",
      "data": {
        "actorId": "thief",
        "itemIds": ["sword", "lamp"],
        "fromRoomId": "round-room",
        "toRoomId": "thief",
        "probability": 0.1
      }
    }
  ],
  "analytics": {
    "thiefTicks": 10,
    "itemsStolen": 5,
    "itemsDeposited": 3,
    "thiefDeaths": 1,
    "thiefRevivals": 1,
    "thiefGiftsAccepted": 2
  }
}
```

## View Analytics

```javascript
const analytics = telemetry.getAnalytics();
console.table(analytics);
```

## Privacy

- No data is sent anywhere without your permission
- Data is stored in memory only (cleared on page refresh)
- You must explicitly enable export to download data
- Input text collection can be disabled

## Full Documentation

See [TELEMETRY-EXPORT.md](./TELEMETRY-EXPORT.md) for complete documentation.
