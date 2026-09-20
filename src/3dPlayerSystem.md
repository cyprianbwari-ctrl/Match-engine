# FAMILY 26 3D Player System v3

The match window now uses a dependency-free WebGL renderer rather than CSS/procedural DOM bodies.

## Runtime model
- Each player is assembled from true 3D primitives: torso, shorts, upper/lower limbs, boots, head and hair.
- Depth, lighting and perspective are calculated in WebGL, so players remain volumetric as the broadcast camera tracks play.
- Animation is driven from the match engine action (`run`, `press`, `carry`, `pass`, `through-pass`, `shoot`, `tackle`, `save`, `claim`, etc.).
- Goalkeepers use a distinct kit palette and save/claim pose set.
- Selected-player rings and names remain part of the UI layer.
- The match engine is unchanged: this renderer is presentation-only.

## Real kit / badge asset contract
When club assets are supplied, connect them to the renderer's `TEAM` palettes or add a texture pass. Do not change engine player IDs or match-state fields.

## Asset roadmap
1. Replace primitive head/torso geometry with authored GLB/FBX-derived meshes when assets are available.
2. Add skin/hair/boot material maps.
3. Add real kit texture atlases and club badge decals.
4. Add goalkeeper glove and kit variants.
5. Add motion-capture clips or retargeted animation data for higher fidelity.
