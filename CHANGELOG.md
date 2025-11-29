# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **TrollActor Migration Complete**: The actor-based troll system is now enabled by default
  - The `ACTOR_MIGRATION_TROLL` feature flag is now `true` by default
  - All troll combat, blocking, and state management now uses the `TrollActor` class
  - Legacy inline troll handlers have been removed from `GameEngineService`

### Removed

- **Legacy Troll Combat Code**: Removed ad-hoc troll combat handlers from `GameEngineService`
  - Removed `updateTrollState()` method (legacy state management)
  - Removed legacy code path in `handleTrollCombat()` that bypassed `TrollActor`
  - Removed `handleTrollCombatViaActor()` (merged into `handleTrollCombat()`)

### Deprecated

- **Legacy Save Migration Utilities**: The following are deprecated and will be removed in a future major version:
  - `LegacyTrollData` interface - retained for old save file compatibility
  - `isLegacyTrollData()` function - retained for old save file compatibility
  - `migrateLegacyTrollData()` function - retained for old save file compatibility

### Notes

- Old save files using the legacy format will continue to work through automatic migration
- New games and save files will use the actor-based format exclusively
- The `syncTrollActorToGameObject()` method is retained for compatibility with broader game engine systems that read troll state from game objects
