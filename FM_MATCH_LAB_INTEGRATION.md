# FAMILY 26 — FM Match Lab integration notes

The supplied `FM Match Lab v1.4 (player ratings revamped).fmf` was inspected as a data container. Its readable portion contains tactical style templates and player-performance coefficient tables. FAMILY 26 does not execute the original engine or copy proprietary executable code.

## Tactical model imported

The latest embedded tactical data exposes 10 tactical styles:

- Control Possession
- Gegenpress
- Tiki-Taka
- Vertical Tiki-Taka
- Wing Play
- Route One
- Fluid Counter-Attack
- Direct Counter-Attack
- Catenaccio
- Park the Bus

For each style FAMILY 26 now uses the decoded ranges for attacking intent, depth, directness, fluidity, closing-down, tempo, width and relevant tendencies such as playing out, working the ball into the box, pressing, counter-pressing, counter-attacking, crossing, overlapping and underlapping.

## How it affects the engine

The model is an input to FAMILY 26's own simulation:

`Tactical style -> tactical model -> perception/grid -> utility decision -> movement/ball physics -> collision/event resolution`

This means the style changes the behaviour of both teams instead of acting as a cosmetic label.
