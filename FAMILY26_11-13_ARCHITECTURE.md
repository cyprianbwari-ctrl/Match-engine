# FAMILY 26 — Roadmap 11–13 Architecture Pass

## 11. Mature save architecture
Career state is now separated from serialization and persistence transport.
- `src/engine/saveArchitecture.js` owns the v3 save envelope, serialization and local IndexedDB adapter.
- `SaveContext` remains the UI-facing orchestration layer.
- localStorage remains a recovery compatibility fallback; IndexedDB is the structured local-save transport.
- Saves include the full career state snapshots plus database source/version and career seed metadata.
- `exportCloudSave()` produces a transport-neutral payload ready for a future authenticated cloud service.

## 12. Remove prototype wording
Visible prototype wording was removed from the Home quick simulation and Finance revenue cards. Input `placeholder` text remains only where it is useful UX guidance.

## 13. One authoritative player object
- `src/engine/playerModel.js` defines the authoritative player shape.
- Database identity is immutable source data.
- Live career state is the mutable layer.
- `PlayerStateContext` exposes `getAuthoritativePlayer()` and `getPlayer()` as the shared read path.
- Existing `mergePlayer()` now uses the same model, so Squad and Tactics remain compatible while consuming the authoritative structure.
- The model contains identity, attributes, vector51, position, club, contract, fitness, morale, form, training, career stats, tactical role and visual profile.
