// FAMILY 26 — 3D player visual contract.
import { PLAYER_ANIMATION_SET, LOD_POLICY } from './3d/playerVisuals.js';

export const PLAYER_3D_DEFAULTS = {
  body: 'semi-realistic-broadcast',
  camera: 'broadcast',
  lod: LOD_POLICY,
  animations: Object.values(PLAYER_ANIMATION_SET),
  kitSource: 'club-assets',
  badgeSource: 'club-assets',
  renderer: 'webgl',
  simulationIndependent: true,
};
