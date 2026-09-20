# FAMILY 26 — Roadmap 9–11

## 9. AI manager system
AI managers now have an explicit decision model with tactical identity, intensity, risk tolerance and transfer philosophy. Match-context decisions can produce `Press Higher`, `Increase Attacking Risk`, `Protect Lead`, `Rotate XI`, `Control Tempo` or `Maintain Plan`. Transfer planning can score database players against the manager's philosophy.

## 10. Transfer market
Negotiations now use a multi-factor player move score rather than only comparing the fee. Fee, playing time, role, club reputation, competition, player preference and salary all contribute. A lower bid can remain viable when the overall move is attractive, while a high bid is not automatically treated as the player's preferred destination.

## 11. Database connection
Added a normalized database bridge and provider. Static identity, club, nation, position, CA/PA, attributes and contract fields are exposed through one indexed read model. The bridge accepts a decoded export through `upsertDecoded()` without requiring UI consumers to change. Existing prototype data remains as a fallback until the full decoded database is injected.

### Architecture
Database → normalized index → game-world consumers → AI/transfer decisions → simulation. Rendering remains downstream and cannot decide football outcomes.
