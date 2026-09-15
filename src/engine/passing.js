// FAMILY 26 — Passing accuracy, target selection and curved pass execution.
// Uses a Gaussian error cone for direction plus power error. Vision is used
// primarily for target selection; Passing/Technique/Composure reduce execution error.

const EPS = 1e-8;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function attr(p, key, fallback = 60) {
  return Number.isFinite(Number(p?.attrs?.[key])) ? Number(p.attrs[key]) : fallback;
}

function linePointDistance(point, a, b) {
  const ax = a.x, ay = a.y, bx = b.x, by = b.y;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return { distance: dist(point, a), t: 0 };
  const t = clamp(((point.x - ax) * dx + (point.y - ay) * dy) / len2, 0, 1);
  const x = ax + t * dx, y = ay + t * dy;
  return { distance: Math.hypot(point.x - x, point.y - y), t };
}

export function pressureFactor(passer, defenders = [], radius = 7) {
  const threats = defenders.map(d => dist(passer, d)).sort((a, b) => a - b).slice(0, 3);
  if (!threats.length) return 0;
  const raw = threats.reduce((s, d) => s + clamp(1 - d / radius, 0, 1), 0) / threats.length;
  const composure = clamp((attr(passer, 'composure') - 1) / 19, 0, 1);
  return clamp(raw * (1 - composure * 0.45), 0, 1);
}

export function calculatePassAccuracy({ passer, receiver, defenders = [], passType = 'pass', pitchMaxDistance = 40 } = {}) {
  const distance = dist(passer, receiver);
  const distanceNorm = clamp(distance / Math.max(1, pitchMaxDistance), 0, 1);
  const pressure = pressureFactor(passer, defenders);
  const passing = clamp(attr(passer, 'passing') / 20, 0, 1);
  const vision = clamp(attr(passer, 'vision') / 20, 0, 1);
  const technique = clamp(attr(passer, 'technique') / 20, 0, 1);
  const composure = clamp(attr(passer, 'composure') / 20, 0, 1);

  // Error standard deviation in pitch-coordinate units. Distance grows
  // quadratically, while pressure and difficult pass types add variance.
  const typeDifficulty = passType === 'through-pass' ? 0.18 : passType === 'long-pass' ? 0.24 : 0;
  const baseSigma = 0.42;
  const sigma = clamp(
    baseSigma * (1 + 1.10 * distanceNorm * distanceNorm + 0.95 * pressure + typeDifficulty) *
      (1 - 0.58 * passing - 0.16 * technique - 0.10 * composure),
    0.10,
    3.8,
  );

  // Vision affects recognition/selection rather than foot accuracy directly.
  const selectionQuality = clamp(0.35 * vision + 0.45 * passing + 0.20 * technique, 0, 1);
  return { distance, distanceNorm, pressure, passing, vision, technique, composure, sigma, selectionQuality };
}

export function findDirectPassBlocker(from, to, defenders = [], clearance = 1.25) {
  let best = null;
  for (const defender of defenders) {
    const hit = linePointDistance(defender, from, to);
    if (hit.t > 0.04 && hit.t < 0.96 && hit.distance <= clearance) {
      if (!best || hit.t < best.t) best = { defender, ...hit };
    }
  }
  return best;
}

export function choosePassTrajectory({ passer, receiver, defenders = [], passType = 'pass' } = {}) {
  const directBlock = findDirectPassBlocker(passer, receiver, defenders);
  const dx = receiver.x - passer.x;
  const dy = receiver.y - passer.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;

  // A curved pass is only considered when a defender genuinely blocks the
  // direct lane and the passer has enough technique/curve to bend around it.
  const curveSkill = clamp((attr(passer, 'curve', 60) + attr(passer, 'technique')) / 40, 0, 2);
  if (!directBlock || curveSkill < 0.95 || passType === 'long-pass') {
    return { type: passType, curve: 0, curveSign: 0, blocker: directBlock?.defender || null };
  }

  const side = ((directBlock.defender.x - passer.x) * ny - (directBlock.defender.y - passer.y) * nx) >= 0 ? -1 : 1;
  const requiredBend = clamp((1.6 - directBlock.distance) * 0.34 + 0.18, 0.18, 0.78);
  const curve = clamp(requiredBend * (0.72 + curveSkill * 0.22), 0.14, 1.0);
  return { type: passType, curve, curveSign: side, blocker: directBlock.defender, nx, ny };
}

export function executePass({ passer, receiver, defenders = [], passType = 'pass' } = {}) {
  const accuracy = calculatePassAccuracy({ passer, receiver, defenders, passType });
  const trajectory = choosePassTrajectory({ passer, receiver, defenders, passType });
  const dx = receiver.x - passer.x;
  const dy = receiver.y - passer.y;
  const d = Math.hypot(dx, dy) || 1;

  // Direction error and power/weight error are independent so passes can be
  // too soft, too firm, or slightly off-line rather than simply "failed".
  const angleError = gaussian() * (accuracy.sigma / Math.max(2, d)) * 0.95;
  const cos = Math.cos(angleError), sin = Math.sin(angleError);
  const dirX = (dx / d) * cos - (dy / d) * sin;
  const dirY = (dx / d) * sin + (dy / d) * cos;
  const powerError = gaussian() * clamp(0.025 + accuracy.sigma * 0.018, 0.02, 0.10);

  const baseSpeed = passType === 'through-pass' ? 5.9 : passType === 'long-pass' ? 6.4 : 4.8;
  const speed = clamp(baseSpeed * (1 + powerError), 2.8, 8.2);

  // Slightly offset the intended endpoint using the same execution model.
  const actualDistance = Math.max(0.5, d * (1 + powerError));
  const actualTarget = {
    x: passer.x + dirX * actualDistance,
    y: passer.y + dirY * actualDistance,
  };

  return {
    ...accuracy,
    ...trajectory,
    target: { x: receiver.x, y: receiver.y },
    actualTarget,
    vx: dirX * speed,
    vy: dirY * speed,
    speed,
    curl: trajectory.curve,
    curlSign: trajectory.curveSign,
    curlDecay: 0.972,
  };
}
