// FAMILY 26 — unified 3D player visual/asset layer.
// Visuals consume player/club data but never change match outcomes.

export const PLAYER_ANIMATION_SET = Object.freeze({
  idle: 'idle',
  walk: 'walk',
  run: 'run',
  sprint: 'sprint',
  accelerate: 'accelerate',
  decelerate: 'decelerate',
  turn: 'turn',
  carry: 'carry',
  pass: 'pass',
  cross: 'cross',
  throughPass: 'through-pass',
  shot: 'shoot',
  volley: 'volley',
  header: 'header',
  tackle: 'tackle',
  slide: 'slide-tackle',
  intercept: 'intercept',
  save: 'save',
  claim: 'claim',
  parry: 'parry',
  celebrate: 'celebrate',
  injured: 'injured',
});

export const LOD_POLICY = Object.freeze({
  near: { maxDistance: 18, segments: 16, shadow: true, labels: true },
  mid: { maxDistance: 42, segments: 10, shadow: true, labels: false },
  far: { maxDistance: Infinity, segments: 6, shadow: false, labels: false },
});

export function getPlayerVisualProfile(player = {}) {
  const height = Number(player.height || 180);
  const weight = Number(player.weight || 76);
  const bmiLike = weight / Math.max(1, (height / 100) ** 2);
  return {
    height: Math.max(0.88, Math.min(1.12, height / 180)),
    build: Math.max(0.84, Math.min(1.10, 0.94 + (bmiLike - 23.5) / 70)),
    skin: player.skinTone || '#b8795d',
    hair: player.hairColor || '#251b1a',
    beard: Boolean(player.beard),
  };
}

export function getClubVisuals(club, side = 'home') {
  const key = String(club || '').toLowerCase();
  const known = {
    'west ham': { primary: '#7A263A', secondary: '#1BB1E7', shorts: '#1BB1E7', trim: '#ffffff', badge: '' },
    'liverpool': { primary: '#C8102E', secondary: '#F6EB61', shorts: '#C8102E', trim: '#ffffff', badge: '' },
    'brighton': { primary: '#0057B8', secondary: '#ffffff', shorts: '#0057B8', trim: '#ffffff', badge: '' },
    'manchester united': { primary: '#DA291C', secondary: '#FBE122', shorts: '#000000', trim: '#ffffff', badge: '' },
  };
  if (known[key]) return known[key];
  return side === 'away'
    ? { primary: '#dfe5f0', secondary: '#596a86', shorts: '#dfe5f0', trim: '#ffffff', badge: '' }
    : { primary: '#6c3eea', secondary: '#72ff32', shorts: '#11182e', trim: '#ffffff', badge: '' };
}

export function resolveAnimation(action, speed = 0) {
  const a = String(action || '').toLowerCase();
  if (a.includes('slide')) return PLAYER_ANIMATION_SET.slide;
  if (a.includes('tackle')) return PLAYER_ANIMATION_SET.tackle;
  if (a.includes('through')) return PLAYER_ANIMATION_SET.throughPass;
  if (a.includes('cross')) return PLAYER_ANIMATION_SET.cross;
  if (a.includes('volley')) return PLAYER_ANIMATION_SET.volley;
  if (a.includes('header')) return PLAYER_ANIMATION_SET.header;
  if (a.includes('shoot')) return PLAYER_ANIMATION_SET.shot;
  if (a.includes('pass')) return PLAYER_ANIMATION_SET.pass;
  if (a.includes('save')) return PLAYER_ANIMATION_SET.save;
  if (a.includes('claim')) return PLAYER_ANIMATION_SET.claim;
  if (a.includes('parry')) return PLAYER_ANIMATION_SET.parry;
  if (speed > 6.0) return PLAYER_ANIMATION_SET.sprint;
  if (speed > 2.0) return PLAYER_ANIMATION_SET.run;
  if (speed > 0.2) return PLAYER_ANIMATION_SET.walk;
  return PLAYER_ANIMATION_SET.idle;
}
