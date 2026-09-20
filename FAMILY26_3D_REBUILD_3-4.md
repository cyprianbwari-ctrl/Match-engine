# FAMILY 26 — 3D Match Rebuild 3–4

## 3. Ball-centred match presentation
The match view now treats the ball as the visual centre of play:
- ball is always rendered independently and last, so players cannot hide it
- camera target follows the ball
- camera looks ahead in the ball's travel direction
- camera zooms for shots/saves and dense close play
- nearby players receive contextual highlighting around active ball actions
- airborne ball height is visually represented

## 4. Broadcast camera
The camera now uses a smoothing/lead system rather than a fixed viewport:
- continuous ball tracking
- predictive look-ahead based on ball velocity
- adaptive zoom
- wide view during buildup
- tighter view around shots, saves and crowded duels
- broadcast HUD indicator
- camera transform is presentation-only and never changes simulation results

Next asset-level step: true GLB footballer models, skeletal animation blending, club kits/badges, goal/replay camera states and stadium/crowd layers.
