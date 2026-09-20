/**
 * FAMILY 26 #8 — canonical 51-value player vector adapter.
 * Keeps the vector stable and available to every football subsystem.
 */
const KEYS = [
  "pace","acceleration","agility","balance","jumpingReach","naturalFitness","stamina","strength","workRate",
  "technique","firstTouch","dribbling","finishing","longShots","heading","passing","crossing","corners","freeKickTaking","penaltyTaking",
  "vision","decisions","anticipation","composure","concentration","positioning","offTheBall","teamwork","flair","determination","leadership",
  "aggression","bravery","workRateMental","marking","tackling","interceptions","passingRange","creativity","pressing",
  "gkHandling","gkReflexes","gkOneOnOnes","gkAerial","gkKicking","gkThrowing","gkPositioning","gkCommunication","gkCommandArea",
  "ca","pa"
];

export function ensureVector51(player = {}) {
  if (Array.isArray(player.vector51) && player.vector51.length === 51) return [...player.vector51];

  const a = player.attributes || {};
  const v = KEYS.map((k, i) => {
    const raw = a[k] ?? a[k.toLowerCase()] ?? player[k];
    const value = Number(raw);
    return Number.isFinite(value) ? value : 50;
  });
  return v.slice(0, 51);
}

export function attachVector51(player = {}) {
  return { ...player, vector51: ensureVector51(player) };
}

export { KEYS as VECTOR51_KEYS };
