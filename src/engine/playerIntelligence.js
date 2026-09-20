/**
 * FAMILY 26 #7 — deterministic player intelligence.
 * Converts canonical attributes/vector51 + role + tactical context into
 * consistent football tendencies. No Math.random().
 */
const n = (v, fallback=50) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

export function buildPlayerIntelligence(player = {}, role = "CM") {
  const a = player.attributes || player;
  const v = Array.isArray(player.vector51) ? player.vector51 : [];

  const get = (name, index, fallback=50) =>
    n(a[name] ?? a[name?.toLowerCase?.()] ?? v[index], fallback);

  return {
    pace: get("pace", 0),
    acceleration: get("acceleration", 1),
    agility: get("agility", 2),
    technique: get("technique", 3),
    passing: get("passing", 4),
    vision: get("vision", 5),
    decisions: get("decisions", 6),
    anticipation: get("anticipation", 7),
    positioning: get("positioning", 8),
    composure: get("composure", 9),
    strength: get("strength", 10),
    stamina: get("stamina", 11),
    workRate: get("workRate", 12),
    flair: get("flair", 13),
    determination: get("determination", 14),
    aggression: get("aggression", 15),
    role
  };
}

export function chooseAction(intel, context = {}, tactical = {}) {
  const pressure = n(context.pressure, 0);
  const distance = n(context.distanceToGoal, 30);
  const space = n(context.space, 50);
  const score = n(context.scoreState, 0);

  const forward = n(tactical.forwardBias, 0);
  const direct = n(tactical.directnessBias, 0);
  const tempo = n(tactical.tempoBias, 0);
  const press = n(tactical.pressBias, 0);

  const scores = {
    carry: 0.15 * intel.pace + 0.14 * intel.agility + 0.10 * intel.flair + 0.08 * space - 0.12 * pressure,
    pass: 0.20 * intel.passing + 0.17 * intel.vision + 0.12 * intel.decisions - 0.08 * pressure,
    throughPass: 0.18 * intel.vision + 0.13 * intel.technique + 0.12 * intel.flair + 12 * direct + 0.06 * space,
    shot: 0.18 * intel.technique + 0.18 * intel.composure + 0.17 * intel.decisions +
          Math.max(0, 32 - distance) * 1.2 + 10 * forward - pressure * 0.35,
    press: 0.18 * intel.workRate + 0.14 * intel.aggression + 0.12 * intel.stamina + 15 * press,
  };

  // A deterministic tie-break ordering keeps behaviour reproducible.
  return Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];
}


// Compatibility exports used by the match engine.
const VECTOR_KEYS = [
  "pace","acceleration","agility","balance","jumpingReach","naturalFitness","stamina","strength","workRate",
  "technique","firstTouch","dribbling","finishing","longShots","heading","passing","crossing","corners","freeKickTaking","penaltyTaking",
  "vision","decisions","anticipation","composure","concentration","positioning","offTheBall","teamwork","flair","determination","leadership",
  "aggression","bravery","workRateMental","marking","tackling","interceptions","passingRange","creativity","pressing",
  "gkHandling","gkReflexes","gkOneOnOnes","gkAerial","gkKicking","gkThrowing","gkPositioning","gkCommunication","gkCommandArea",
  "ca","pa"
];

export function build51Vector(player = {}, attrs = {}) {
  if (Array.isArray(player.vector51) && player.vector51.length === 51) return [...player.vector51];
  const source = player.attributes || attrs || {};
  return VECTOR_KEYS.map((k, i) => {
    const v = Number(source[k] ?? source[k.toLowerCase()] ?? player[k]);
    return Number.isFinite(v) ? v : 50;
  });
}

export function decisionProfile(player = {}, state = {}, side = "home") {
  const v = build51Vector(player, player.attrs || {});
  return {
    passing: v[15], vision: v[20], decisions: v[21], anticipation: v[22],
    composure: v[23], positioning: v[25], offBall: v[26], teamwork: v[27],
    flair: v[28], workRate: v[8], aggression: v[31], pace: v[0],
    acceleration: v[1], technique: v[9], finishing: v[12], dribbling: v[11],
    tackling: v[35], strength: v[7], stamina: v[6], role: player.pos,
    side, tactical: side === "home" ? state.homeTactics : state.awayTactics
  };
}
