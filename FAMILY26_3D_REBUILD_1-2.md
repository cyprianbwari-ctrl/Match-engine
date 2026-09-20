# FAMILY 26 — 3D Match Presentation Rebuild (1–2)

## 1. Rebuilt 3D match presentation
The match viewport now has a dedicated football-first presentation renderer with:
- broadcast-style perspective
- pitch markings and mowing stripes
- depth-based player scale
- player shadows
- action-driven running/pass/shoot poses
- independent ball projection and airborne height
- selected-player ring and shirt numbers
- broadcast LIVE treatment
- responsive fullscreen-friendly sizing

## 2. Make the match actually look like football
The renderer is explicitly presentation-only. It consumes player and ball state from the authoritative match engine through `matchPresentationAdapter.js`.
Football outcomes (goals, possession, fouls, cards, etc.) remain engine-owned.

This is the foundation for the next asset pass: real GLB player models, club kits/badges, skeletal animation clips, broadcast camera tracking, ball physics, and replay/goal cameras.
