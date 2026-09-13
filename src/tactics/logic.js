import { compat } from "../data/roster.js";

// Greedy max-weight assignment: for every (slot, player) pair, take the
// highest-compatibility pairing first, skipping anything already used.
// Approximate but good enough for an 11-slot squad and gives sensible
// results (keeper always in goal, natural fits filled first).
export function autoAssign(slots, roster) {
  const pairs = [];
  for (const slot of slots) {
    for (const p of roster) {
      pairs.push({ slotId: slot.id, playerId: p.id, score: compat(p.pos, slot.code) });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const usedSlots = new Set();
  const usedPlayers = new Set();
  const assignment = {};
  for (const pr of pairs) {
    if (usedSlots.has(pr.slotId) || usedPlayers.has(pr.playerId)) continue;
    assignment[pr.slotId] = pr.playerId;
    usedSlots.add(pr.slotId);
    usedPlayers.add(pr.playerId);
  }
  return assignment;
}

// --- Tactical Familiarity -------------------------------------------------
// Breaks familiarity into four components, each 0-100, and an overall
// weighted score. All are derived from real state (no random numbers) so
// changing the tactic actually moves the needle.

const KNOWN_FORMATIONS = new Set([
  "4-4-2", "4-3-3", "4-2-3-1", "4-1-4-1", "5-3-2", "5-4-1",
]); // "classic" shapes a squad settles into faster than exotic ones

export function familiarity({ formation, slots, assignment, roster, roleAssignment, squares }) {
  // Formation familiarity: known shapes score high, unusual ones lower,
  // "Custom" (freeform, dragged off-slot) lower still.
  const formationFamiliarity = formation === "Custom"
    ? 55
    : KNOWN_FORMATIONS.has(formation) ? 88 : 72;

  // Position/role familiarity: average natural-fit compatibility of every
  // assigned player against the slot they're playing.
  const scores = slots.map(slot => {
    const playerId = assignment[slot.id];
    const player = roster.find(p => p.id === playerId);
    return player ? compat(player.pos, slot.code) : 0;
  });
  const positionFamiliarity = Math.round(
    (scores.reduce((a, b) => a + b, 0) / (scores.length || 1)) * 100
  );

  // Player-role familiarity: does each player's assigned role match their
  // "natural" trained role from the roster?
  const roleScores = slots.map(slot => {
    const playerId = assignment[slot.id];
    const player = roster.find(p => p.id === playerId);
    const assignedRole = roleAssignment[slot.id];
    if (!player || !assignedRole) return 0.6;
    return assignedRole === player.role ? 1 : 0.55;
  });
  const roleFamiliarity = Math.round(
    (roleScores.reduce((a, b) => a + b, 0) / (roleScores.length || 1)) * 100
  );

  // Tactical cohesion: rewards having defined Square System relationships
  // (the squad understands who supports/covers whom), capped at 100.
  const cohesion = Math.min(100, 60 + squares.length * 10);

  const overall = Math.round(
    formationFamiliarity * 0.3 +
    positionFamiliarity * 0.3 +
    roleFamiliarity * 0.25 +
    cohesion * 0.15
  );

  return {
    overall,
    breakdown: [
      { label: "Formation Familiarity", value: formationFamiliarity },
      { label: "Position Familiarity", value: positionFamiliarity },
      { label: "Player-Role Familiarity", value: roleFamiliarity },
      { label: "Tactical Cohesion", value: cohesion },
    ],
  };
}

// --- Automatic Tactical Intelligence --------------------------------------
// Rule-based insights derived from current state. Insights that would
// require live match data (opponent overloads, dangerous opposition
// players) are clearly flagged as match-day only, since there's no
// opponent model yet.
export function assistantInsights({ roster, assignment, pressing, teamInstructions, avgFit }) {
  const insights = [];

  if (pressing.intensity >= 75 && teamInstructions.mentality.includes("Attacking")) {
    insights.push({
      type: "fatigue",
      text: "High pressing intensity combined with an attacking mentality will tire the squad faster — consider rotating in behind-the-ball games.",
      fix: { label: "Lower pressing intensity", field: "pressing.intensity", delta: -20 },
    });
  }
  if (avgFit < 90) {
    insights.push({
      type: "fatigue",
      text: `Average squad fitness is ${avgFit}% — a lower pressing intensity may be safer until fitness recovers.`,
      fix: { label: "Lower pressing intensity", field: "pressing.intensity", delta: -15 },
    });
  }
  const poorFits = Object.entries(assignment).length && roster
    ? roster.filter(p => Object.values(assignment).includes(p.id))
    : [];
  if (pressing.trigger.includes("Full Team") && teamInstructions.defensiveLine < 40) {
    insights.push({
      type: "mismatch",
      text: "Full-team press with a deep defensive line leaves a large gap between the lines — opponents can exploit the space in behind.",
      fix: { label: "Raise defensive line", field: "teamInstructions.defensiveLine", delta: 20 },
    });
  }
  insights.push({
    type: "matchday",
    text: "Opponent overloads and dangerous-player alerts appear here once a match is in progress.",
  });
  return insights;
}
