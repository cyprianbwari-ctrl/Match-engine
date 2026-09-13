# FAMILY 26 — FM Tweak v1.3 Integration

The supplied `FM Tweak v1.3.zip` contains a `.fmf` data file with readable Football Manager
match-event definitions and squad-selection/fitness factor data. FAMILY 26 uses those
observable concepts as an independent simulation layer.

## Integrated

- Squad readiness using match fitness, condition, tactical familiarity, CA/PA-style quality,
  reputation and morale.
- AI rotation pressure that increases with fatigue/low fitness and late-match game state.
- Contextual event families for hold-up play, pressure, loose balls, interceptions, tackles,
  through balls, movement, shots, goalkeeper actions and transitions.
- Existing FAMILY 26 fixed timestep and 18x12 spatial-grid simulation remains the underlying
  physics/decision architecture.
- Existing FM Match Lab tactical styles remain intact.

## Important

This is not execution of Football Manager code. The supplied data is treated as a reference
for an original FAMILY 26 implementation. The actual 2D rendering remains FAMILY 26's own.
