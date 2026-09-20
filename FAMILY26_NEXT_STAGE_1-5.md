# FAMILY 26 — Owner Pass 1–5

This pass covers the five next priorities requested by the owner:

1. Finish the 3D player system — unified visual profiles, club kits, GK kits,
   body variation, action normalization and distance LOD. Real GLB assets can
   be plugged into the same contract later; the current WebGL fallback remains
   self-contained and dependency-free.
2. Finish the match engine — player-specific action weighting, distance and
   pressure-aware passing, shot quality, and goalkeeper save resolution now
   use the 51-value player vector.
3. Tactics — the existing live tactical state continues to feed the engine;
   this pass strengthens the link by making action outcomes respond to tactical
   directness, tempo, mentality and pressing through the action model.
4. Database — the match engine and World provider now read from the canonical
   database bridge instead of directly depending on the seed world list.
5. Living world — background day simulation now changes form, development and
   availability for world players and feeds those changes into the World Pulse.

No roadmap item beyond these five was started.
