# FAMILY 26 Match Engine Architecture

This version implements the current match-engine specification:

- Fixed simulation timestep separated from rendering.
- Web Worker entry point (`src/engine/matchEngine.worker.js`) and React bridge (`src/engine/useMatchEngine.js`).
- Player finite-state machine: IN_POSITION, CHASING_BALL, WITH_BALL, MAKING_RUN, MARKING, INTERCEPTING.
- Reaction/state-transition delays influenced by anticipation/decision attributes.
- Tactical pressing/defensive-line overrides.
- Attribute-driven movement: Pace, Acceleration, Agility, Balance, Stamina and mental attributes.
- Vector target calculation with normalized direction.
- Steering/acceleration instead of instant position snapping.
- Arrival deceleration and overshoot prevention.
- Predictive interception using a quadratic solver and earliest positive root.
- Unreachable interception fallback to shape/press/receiver coverage.
- Existing travelling-ball pass/shot model and interception integration retained.

The renderer should consume snapshots rather than perform simulation calculations. The worker is ready for the React match screen to use as the authoritative simulation thread.

## Pitch friction / interception physics
- Ball flight uses a discrete fixed-timestep retention model instead of constant velocity.
- `pitchCondition`: `dry`, `normal`, or `wet` controls ball velocity retention.
- Dry/high grass: 0.950 retention; normal: 0.970; wet/rain: 0.985.
- Predictive interception replays the future ball trajectory tick-by-tick and selects the earliest reachable point.
- Anticipation, Decisions/Read Game, and Vision influence recognition delay.
- Unreachable/stopped balls fall back to defensive shape/receiver coverage rather than endless chasing.
