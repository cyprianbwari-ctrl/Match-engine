// FAMILY 26 — Predictive interception with discrete ball-flight simulation.
// The solver mirrors the fixed-timestep engine so friction, pitch condition,
// reaction delay and a ball coming to rest are all represented consistently.

const EPSILON = 1e-8;

export const PITCH_CONDITIONS = {
  dry: { ballRetention: 0.950, label: 'Dry / high grass' },
  normal: { ballRetention: 0.970, label: 'Normal' },
  wet: { ballRetention: 0.985, label: 'Wet / rain' },
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function getBallRetention({ pitchCondition = 'normal', ballRetention } = {}) {
  if (Number.isFinite(ballRetention)) return clamp(ballRetention, 0.90, 0.9999);
  return PITCH_CONDITIONS[pitchCondition]?.ballRetention ?? PITCH_CONDITIONS.normal.ballRetention;
}

/**
 * Advance ball position by one fixed simulation step using exponential-style
 * discrete velocity retention. `dt` is in seconds and `speed` is expressed
 * in pitch-units per second.
 */
export function stepBallWithFriction(ball, { dt = 0.05, retention = 0.97, stopSpeed = 0.015 } = {}) {
  const lambda = clamp(retention, 0, 0.999999);
  const vx = Number(ball.vx) || 0;
  const vy = Number(ball.vy) || 0;
  const x = (Number(ball.x) || 0) + vx * dt;
  const y = (Number(ball.y) || 0) + vy * dt;
  const nvx = vx * lambda;
  const nvy = vy * lambda;
  const next = { x, y, vx: nvx, vy: nvy };
  if (Math.hypot(nvx, nvy) < stopSpeed) {
    next.vx = 0;
    next.vy = 0;
    next.stopped = true;
  }
  return next;
}

/**
 * Predict an interception by replaying future ball ticks and comparing the
 * player's physically reachable distance against the predicted ball point.
 * This intentionally avoids the old constant-velocity quadratic assumption.
 */
export function solveInterceptionDiscrete({
  player,
  ball,
  ballVelocity,
  speed,
  acceleration = Infinity,
  dt = 0.05,
  retention = 0.97,
  maxTime = 4,
  stopSpeed = 0.015,
} = {}) {
  const px = Number(player?.x) || 0;
  const py = Number(player?.y) || 0;
  const s = Math.max(0, Number(speed) || 0);
  const a = Number.isFinite(acceleration) ? Math.max(0, acceleration) : Infinity;
  const startBall = {
    x: Number(ball?.x) || 0,
    y: Number(ball?.y) || 0,
    vx: Number(ballVelocity?.x ?? ballVelocity?.vx) || 0,
    vy: Number(ballVelocity?.y ?? ballVelocity?.vy) || 0,
  };

  const ticks = Math.max(1, Math.ceil(maxTime / dt));
  let predicted = startBall;
  let reachableSpeed = 0;
  let travel = 0;

  for (let tick = 0; tick <= ticks; tick++) {
    const t = tick * dt;
    const distanceToBall = Math.hypot(predicted.x - px, predicted.y - py);

    // A simple reachable-distance envelope. Acceleration limits the early
    // part of the run; once top speed is reached, the envelope grows linearly.
    if (Number.isFinite(a)) {
      reachableSpeed = Math.min(s, reachableSpeed + a * dt);
      travel += reachableSpeed * dt;
    } else {
      travel = s * t;
    }

    if (distanceToBall <= Math.max(0.15, travel + 0.08)) {
      return {
        reachable: true,
        time: t,
        x: predicted.x,
        y: predicted.y,
        ticks: tick,
        ballSpeed: Math.hypot(predicted.vx, predicted.vy),
        stopped: !!predicted.stopped,
      };
    }

    if (predicted.stopped) break;
    predicted = stepBallWithFriction(predicted, { dt, retention, stopSpeed });
  }

  return {
    reachable: false,
    reason: predicted.stopped ? 'ball-stopped-before-reach' : 'unreachable-within-horizon',
    x: predicted.x,
    y: predicted.y,
  };
}

// Retained for compatibility with earlier engine callers. This is now only
// used as a fallback when explicitly requested; normal interception uses the
// discrete friction-aware solver above.
export function solveInterception({ player, ball, ballVelocity, speed }) {
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const vx = ballVelocity.x;
  const vy = ballVelocity.y;
  const s = Math.max(0, Number(speed) || 0);
  const a = vx * vx + vy * vy - s * s;
  const b = 2 * (dx * vx + dy * vy);
  const c = dx * dx + dy * dy;
  if (Math.abs(a) < EPSILON) {
    if (Math.abs(b) < EPSILON) return c < EPSILON ? { reachable: true, time: 0, x: ball.x, y: ball.y } : { reachable: false, reason: 'stationary-ball-too-far' };
    const t = -c / b;
    return t >= 0 ? { reachable: true, time: t, x: ball.x + vx * t, y: ball.y + vy * t } : { reachable: false, reason: 'moving-away' };
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return { reachable: false, reason: 'no-real-intercept' };
  const root = Math.sqrt(discriminant);
  const candidates = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(t => Number.isFinite(t) && t >= 0).sort((m,n)=>m-n);
  return candidates.length ? { reachable: true, time: candidates[0], x: ball.x + vx*candidates[0], y: ball.y + vy*candidates[0] } : { reachable: false, reason: 'positive-root-missing' };
}

export function anticipationDelay(player, anticipation = 60, readGame = anticipation, vision = anticipation) {
  const mental = clamp((Number(anticipation) + Number(readGame) + Number(vision)) / 3, 1, 99);
  return Math.max(0, 0.38 - mental * 0.0032);
}

export function interceptionTarget({
  player, ball, ballVelocity, speed, acceleration, anticipation, readGame, vision,
  dt = 0.05, pitchCondition = 'normal', ballRetention,
  maxTime = 4,
} = {}) {
  const retention = getBallRetention({ pitchCondition, ballRetention });
  const delay = anticipationDelay(player, anticipation, readGame, vision);
  const raw = solveInterceptionDiscrete({ player, ball, ballVelocity, speed, acceleration, dt, retention, maxTime });
  if (!raw.reachable) return { ...raw, reactionDelay: delay, retention };

  // Delay is represented as delayed recognition, so the ball is advanced from
  // the current position using the same friction model rather than assuming
  // constant velocity during the delay.
  let delayedBall = { x: ball.x, y: ball.y, vx: ballVelocity.x || 0, vy: ballVelocity.y || 0 };
  const delayTicks = Math.max(0, Math.ceil(delay / dt));
  for (let i = 0; i < delayTicks && !delayedBall.stopped; i++) {
    delayedBall = stepBallWithFriction(delayedBall, { dt, retention });
  }

  const delayed = solveInterceptionDiscrete({
    player, ball: delayedBall,
    ballVelocity: { x: delayedBall.vx, y: delayedBall.vy },
    speed, acceleration, dt, retention, maxTime: Math.max(dt, maxTime - delayTicks * dt),
  });
  if (!delayed.reachable) return { ...delayed, reactionDelay: delay, retention };
  return { ...delayed, time: delayed.time + delayTicks * dt, reactionDelay: delay, retention };
}
