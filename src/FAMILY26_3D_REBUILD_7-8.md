# FAMILY 26 — Roadmap 7–8

## 7. Real player intelligence

The match engine now gives every player a deterministic football-intelligence layer. Decisions use the player's technical, mental and physical attributes plus role, fatigue, morale and current team tactics.

The decision layer produces passing, progression, shooting, pressing, carrying and defending tendencies. It is evaluated at football-action decision points rather than every render frame.

## 8. 51-value player vector

Every XI player receives a complete `vector51` with 51 named values. Existing database/engine attributes are preserved when available; missing values are derived deterministically from related football attributes and player identity so the same player behaves consistently.

Pipeline:

Database player → 51-value vector → role profile → tactical context → decision profile → football action → FrameState → 3D presentation.

The renderer does not decide outcomes.
