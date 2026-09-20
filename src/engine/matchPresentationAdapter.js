// FAMILY 26 — Match Frame adapter.
// Converts authoritative engine state into renderer-safe presentation state.
// The renderer never decides possession, goals, fouls or outcomes.

export function toPresentationFrame(state = {}) {
  const players = (state.players || state.frame?.players || []).map((p, i) => ({
    ...p,
    id: p.id ?? p.uid ?? i,
    x: Number(p.x ?? p.position?.x ?? 50),
    y: Number(p.y ?? p.position?.y ?? 50),
    z: Number(p.z ?? p.position?.z ?? 0),
    action: p.action ?? p.animation ?? 'idle',
    teamSide: p.teamSide ?? p.side ?? (p.team === 'away' ? 'away' : 'home'),
  }));
  const ballRaw = state.ball || state.frame?.ball;
  const ball = ballRaw ? {
    x:Number(ballRaw.x ?? 50), y:Number(ballRaw.y ?? 50), z:Number(ballRaw.z ?? 0.02),
    vx:Number(ballRaw.vx ?? 0), vy:Number(ballRaw.vy ?? 0), vz:Number(ballRaw.vz ?? 0)
  } : null;
  return { players, ball, clock: state.clock ?? state.minute ?? 0, score: state.score ?? {home:0,away:0} };
}
