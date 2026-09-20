# FAMILY 26 — Changes 5–7

## 5. Match UI
Added a reusable broadcast match UI overlay with scoreboard, clock, pause/speed controls,
tactics/instructions/substitution controls, and a compact statistics panel.

## 6. Tactics → Match
Added `tacticalMatchAdapter.js`, a deterministic adapter translating mentality, tempo, width,
pressing, defensive line and directness into football-behaviour modifiers.

## 7. Player intelligence
Added `playerIntelligence.js` so player attributes/vector51, role, pressure, space and tactical
context influence action selection. The layer is deterministic and does not generate random
gameplay outcomes.

## 8. Vector foundation
Added `vector51Adapter.js` so every player can expose one canonical 51-value vector to the
football systems. Existing canonical vectors are preserved; missing values are deterministically
filled from attributes/fallbacks.

No #9+ feature work is included in this pass.
