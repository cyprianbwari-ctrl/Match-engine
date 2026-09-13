// FAMILY 26 — FM Tweak v1.3 integration layer.
// Clean-room gameplay configuration derived from readable, user-supplied FM tweak data.
// It is used as a blueprint for squad readiness, AI rotation, match-event selection,
// and contextual commentary. It does not execute proprietary FM code.

export const FM_TWEAK_VERSION = 'v1.3';

export const SQUAD_SELECTION_WEIGHTS = {
  tacticalFamiliarity: 60,
  matchFitness: 20,
  condition: 80,
  ca: 200,
  pa: 90,
  reputation: 35,
  matchRatingTimeOn: 25,
  allowedMins: -250,
  playingSidePreference: 20,
  starPlayer: 35,
  boostLowMatchFitness: 20,
  boostSubstitute: 35,
  captaincy: 40,
  footballPromises: 15,
  unhappiness: 15,
  declaredForReserves: 170,
};

export const EVENT_FAMILIES = {
  HOLD_UP: ['hold-up','wait for support','assesses options','slows play','keeps possession'],
  LOOSE_BALL: ['loose ball','ball runs loose','possession breaks'],
  PRESSURE: ['forced back under pressure','under pressure','retreats under pressure'],
  INTERCEPTION: ['interception','finds himself in the way','ball strikes defender'],
  TACKLE: ['standing tackle','sliding tackle','dispossess'],
  THROUGH_BALL: ['through ball','played into space','clean through'],
  MOVEMENT: ['passing and movement','run into space','forward run'],
  SHOT: ['shot','strike','effort','finishing'],
  GOALKEEPER: ['save','parry','claims','one-on-one'],
  TRANSITION: ['quick attack','counter attack','break'],
};

export function clamp(v, min=0, max=100) {
  return Math.max(min, Math.min(max, v));
}

export function readinessScore(player={}) {
  const fit = clamp(Number(player.fit ?? player.matchFitness ?? 90));
  const condition = clamp(Number(player.condition ?? 90));
  const tactical = clamp(Number(player.tacticalFamiliarity ?? 70));
  const ca = clamp(Number(player.ca ?? player.ovr ?? 70));
  const pa = clamp(Number(player.pa ?? ca));
  const reputation = clamp(Number(player.reputation ?? 50));
  const morale = player.morale === 'Good' ? 5 : player.morale === 'Unhappy' ? -6 : 0;

  // Normalised from the supplied selection-factor ranges.
  return (
    fit * 0.28 +
    condition * 0.22 +
    tactical * 0.16 +
    ca * 0.20 +
    pa * 0.08 +
    reputation * 0.06 +
    morale
  );
}

export function aiRotationNeed(player={}, minute=0, scoreDiff=0) {
  const fit = clamp(Number(player.fit ?? 90));
  const condition = clamp(Number(player.condition ?? 90));
  const fatigue = Number(player.fatigue ?? 0);
  const lowFitness = fit < 72 || condition < 68;
  const lateMatch = minute >= 65;
  const protectingLead = scoreDiff > 0;
  const chasing = scoreDiff < 0;

  let score = 0;
  if (lowFitness) score += 35;
  score += Math.max(0, fatigue - 55) * 0.8;
  if (lateMatch) score += 8;
  if (protectingLead) score += 10;
  if (chasing) score -= 5;
  return clamp(score);
}

export function eventFamilyFromAction(action='') {
  const a = String(action).toLowerCase();
  if (a.includes('hold') || a.includes('wait')) return 'HOLD_UP';
  if (a.includes('press') || a.includes('retreat')) return 'PRESSURE';
  if (a.includes('intercept')) return 'INTERCEPTION';
  if (a.includes('tackle')) return 'TACKLE';
  if (a.includes('through')) return 'THROUGH_BALL';
  if (a.includes('run') || a.includes('overlap') || a.includes('underlap')) return 'MOVEMENT';
  if (a.includes('shot')) return 'SHOT';
  if (a.includes('save')) return 'GOALKEEPER';
  if (a.includes('counter')) return 'TRANSITION';
  return 'MOVEMENT';
}

export function pickContextualCommentary(action, rand=Math.random) {
  const key = eventFamilyFromAction(action);
  const list = EVENT_FAMILIES[key] || EVENT_FAMILIES.MOVEMENT;
  return list[Math.floor(rand() * list.length)];
}
