# FAMILY 26 Player Asset Pipeline

The match engine owns player identity and actions. `playerAssetSystem.js` is the visual contract used by the WebGL renderer.

Current implementation:
- Per-player height, weight/build, skin, hair and boot variation.
- Club-aware home/away/goalkeeper kit contract.
- Action normalization for movement, ball actions, defending and goalkeeper actions.
- Distance-based LOD contract.
- Procedural WebGL fallback remains available.

Future real GLB/texture assets can be attached through `assetSource` without changing MatchState or player intelligence.
