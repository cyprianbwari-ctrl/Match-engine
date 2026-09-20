/**
 * FAMILY 26 #6 — tactical command adapter.
 * Pure, deterministic translation from manager tactics to player behaviour.
 */
export function buildTacticalContext(tactics = {}, team = {}) {
  const mentality = tactics.mentality ?? "Balanced";
  const tempo = Number(tactics.tempo ?? 50);
  const width = Number(tactics.width ?? 50);
  const pressing = Number(tactics.pressing ?? 50);
  const line = Number(tactics.defensiveLine ?? 50);
  const directness = Number(tactics.directness ?? 50);

  const mentalMap = {
    VeryDefensive: -0.35, Defensive: -0.18, Balanced: 0,
    Positive: 0.16, Attacking: 0.28, VeryAttacking: 0.4
  };
  const mentalityBias = mentalMap[mentality] ?? 0;

  return {
    teamId: team.id ?? team.teamId ?? null,
    mentality,
    mentalityBias,
    tempo: Math.max(0, Math.min(100, tempo)),
    width: Math.max(0, Math.min(100, width)),
    pressing: Math.max(0, Math.min(100, pressing)),
    defensiveLine: Math.max(0, Math.min(100, line)),
    directness: Math.max(0, Math.min(100, directness)),
    forwardRunBias: mentalityBias + (directness - 50) / 180 + (tempo - 50) / 240,
    pressDistance: Math.max(3.5, 15 - pressing * 0.09),
    defensiveDepth: 8 + (100 - line) * 0.11,
    teamWidth: 28 + width * 0.18
  };
}

export function applyTacticsToDecision(decision, tacticalContext, role = "CM") {
  const d = { ...decision };
  const t = tacticalContext;

  const forwardRoles = new Set(["ST","CF","LW","RW","AM","IF"]);
  const defensiveRoles = new Set(["CB","LB","RB","DM"]);

  if (forwardRoles.has(role)) d.forwardBias = (d.forwardBias ?? 0) + t.forwardRunBias;
  if (defensiveRoles.has(role)) d.recoveryBias = (d.recoveryBias ?? 0) + (50 - t.defensiveLine) / 100;

  d.pressBias = (d.pressBias ?? 0) + (t.pressing - 50) / 100;
  d.widthBias = (d.widthBias ?? 0) + (t.width - 50) / 100;
  d.directnessBias = (d.directnessBias ?? 0) + (t.directness - 50) / 100;
  d.tempoBias = (d.tempoBias ?? 0) + (t.tempo - 50) / 100;
  return d;
}
