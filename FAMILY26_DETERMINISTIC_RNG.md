# FAMILY 26 — Deterministic Simulation RNG

## Purpose
All gameplay randomness now comes from deterministic seeded streams. `Math.random()` is not used by FAMILY 26 gameplay code.

## Seed hierarchy
`Career Seed → Day Seed / Match Seed → Event RNG`

- **Career seed:** persisted with the manager/career and mirrored in `family26_career_seed_v1`.
- **Day seed:** derived from career seed + simulation day index for background world activity.
- **Match seed:** derived from career seed + match date + home club + away club + competition.
- **Event streams:** derived from the match/day seed for individual outcomes such as passes, shots, saves, injuries and post-match consequences.

## Result
Replaying the same career state with the same match seed produces the same simulation outcomes. Rendering speed, React re-renders and UI activity do not create new random numbers.

## Non-game IDs
Event/transaction/news identifiers use deterministic sequence IDs rather than randomness.
