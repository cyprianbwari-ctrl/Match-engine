# FAMILY 26 — Workstreams 1–3

## 1. 3D match/player quality
The player renderer is a visual presentation layer. It consumes player dimensions,
actions and club visual assets. It does not calculate football outcomes.

Animation resolution:
match action -> animation state -> blended 3D pose -> render.

LOD:
near / mid / far keeps 22-player scenes performant on mobile.

## 2. Match-engine realism
The simulation remains authoritative. The renderer receives state and should never
invent goals, passes, fouls or possession. A future FrameState adapter can expose
ball trajectory, player velocity, action phase and camera hints.

## 3. Database/world integration
Player identity, club identity, physical measurements and visual assets are data
inputs. Match events can be written back to the existing player/competition state
through the existing simulation/store layer.

Asset contract:
- public player/club data may supply height, weight, skin/hair metadata.
- club assets can supply kit and badge URLs/paths.
- renderer falls back safely when an asset is missing.
