# FAMILY 26 — Canonical Database Restructure

## Goal
The decoded database is now treated as the canonical game-data boundary. Prototype roster/world arrays are bootstrap seeds used only by `src/data/databaseBridge.js` until the full decoded export is loaded.

## Canonical flow
Decoded database / bootstrap seed
→ Database Gateway
→ DatabaseContext
→ canonical Player / Club / Competition / Stadium / Contract read models
→ World / Squad / Tactics / Training / Transfers / Finance / Match / Scouting
→ Simulation and 3D presentation

## Changes
- Stable player identity: club-squad seed IDs remain compatible; global-world IDs are namespaced to prevent collisions.
- Normalized player aliases are provided once (`position/pos`, `nation/country/nat`, `contract/contractExpiry`, `tacticalRole/roleLabel`, etc.).
- Clubs are indexed by ID and name.
- Competitions, stadiums and contracts are exposed through the same database context.
- Decoded database updates are propagated to the engine-safe gateway.
- Match engine reads the canonical gateway instead of importing prototype datasets.
- World, squad, tactics, training, transfers, finance, matchday, match, simulation and global search no longer import `roster.js` or `worldData.js` directly.
- Tactical role definitions were separated from player seed records into `data/tacticalDefinitions.js`.
- Duplicate numeric player IDs between the old squad seed and world seed no longer merge unrelated people.

## Source-of-truth rule
Gameplay code must not import `src/data/roster.js` or `src/data/worldData.js`. New decoded data should enter through `DatabaseContext.upsertDecoded()` or the database import pipeline.
