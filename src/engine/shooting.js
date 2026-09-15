// FAMILY 26 — Shooting quality, execution and goalkeeper resolution.
// This module is deliberately pure: the match engine owns the state, while
// this file calculates shot intent/physics and the goalkeeper's response.

const PITCH_LENGTH_M = 105;
const PITCH_WIDTH_M = 68;
const GOAL_WIDTH_M = 7.32;
const GOAL_HALF_WIDTH_PCT = (GOAL_WIDTH_M / PITCH_WIDTH_M) * 50;
const GOAL_CENTER_Y = 50;
const EPS = 1e-9;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function pct(v) { return clamp(Number(v) || 0, 0, 100); }
function attr(p, key, fallback = 60) { return Number(p?.attrs?.[key] ?? fallback); }
function gaussian() {
  let u = 0, v = 0;
  while (u <= EPS) u = Math.random();
  while (v <= EPS) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function distance2D(a, b) {
  return Math.hypot((Number(a?.x) || 0) - (Number(b?.x) || 0), (Number(a?.y) || 0) - (Number(b?.y) || 0));
}

export function goalPostsFor(side) {
  return side === 'home'
    ? { left: { x: 100, y: GOAL_CENTER_Y - GOAL_HALF_WIDTH_PCT }, right: { x: 100, y: GOAL_CENTER_Y + GOAL_HALF_WIDTH_PCT } }
    : { left: { x: 0, y: GOAL_CENTER_Y - GOAL_HALF_WIDTH_PCT }, right: { x: 0, y: GOAL_CENTER_Y + GOAL_HALF_WIDTH_PCT } };
}

export function visibleGoalAngle(shooter, side) {
  const posts = goalPostsFor(side);
  const d1 = distance2D(shooter, posts.left);
  const d2 = distance2D(shooter, posts.right);
  const goalWidth = GOAL_WIDTH_M;
  // Convert the 0–100 pitch representation to metres for the angle formula.
  const scaleX = PITCH_LENGTH_M / 100;
  const scaleY = PITCH_WIDTH_M / 100;
  const dx1 = (posts.left.x - shooter.x) * scaleX;
  const dy1 = (posts.left.y - shooter.y) * scaleY;
  const dx2 = (posts.right.x - shooter.x) * scaleX;
  const dy2 = (posts.right.y - shooter.y) * scaleY;
  const md1 = Math.hypot(dx1, dy1);
  const md2 = Math.hypot(dx2, dy2);
  if (md1 < EPS || md2 < EPS) return Math.PI;
  return Math.acos(clamp((md1 * md1 + md2 * md2 - goalWidth * goalWidth) / (2 * md1 * md2), -1, 1));
}

export function pressureFactor(shooter, defenders = [], radius = 7) {
  const nearest = defenders.map(d => distance2D(shooter, d)).sort((a, b) => a - b).slice(0, 3);
  if (!nearest.length) return 0;
  const raw = nearest.reduce((sum, d) => sum + clamp(1 - d / radius, 0, 1), 0) / nearest.length;
  const composure = clamp((attr(shooter, 'composure') - 1) / 19, 0, 1);
  return clamp(raw * (1 - composure * 0.45), 0, 1);
}

export function calculateShotQuality({ shooter, side, defenders = [], shotType = 'standard' } = {}) {
  const goalX = side === 'home' ? 100 : 0;
  const distancePct = Math.abs(goalX - pct(shooter?.x));
  const distanceM = distancePct * PITCH_LENGTH_M / 100;
  const angle = visibleGoalAngle(shooter, side);
  const angleNorm = clamp(angle / Math.PI, 0, 1);
  const pressure = pressureFactor(shooter, defenders);
  const technique = clamp(attr(shooter, 'technique') / 20, 0, 1);
  const finishing = clamp(attr(shooter, 'finishing') / 20, 0, 1);
  const composure = clamp(attr(shooter, 'composure') / 20, 0, 1);
  const body = clamp((attr(shooter, 'balance') + attr(shooter, 'technique')) / 40, 0, 1);

  // xG is an opportunity-quality prior, not the final goal roll.
  // Broad angle and short distance increase quality; pressure reduces it.
  let xg = 0.015 +
    0.58 * clamp(angle / 1.2, 0, 1) +
    0.30 * (1 - clamp(distanceM / 35, 0, 1)) -
    0.20 * pressure +
    0.08 * body;
  if (shotType === 'finesse') xg += 0.025 * technique;
  if (shotType === 'volley') xg -= 0.035 * (1 - technique);
  if (shotType === 'header') xg -= 0.02 * (1 - attr(shooter, 'heading') / 20);
  xg = clamp(xg, 0.01, 0.92);

  return { xg, distanceM, angle, pressure, finishing, technique, composure, body };
}

export function chooseShotTarget({ shooter, side, goalkeeper, shotType = 'standard' } = {}) {
  const posts = goalPostsFor(side);
  const gkY = goalkeeper ? pct(goalkeeper.y) : GOAL_CENTER_Y;
  const quality = clamp((attr(shooter, 'finishing') + attr(shooter, 'technique') + attr(shooter, 'composure')) / 60, 0, 1);
  const angle = visibleGoalAngle(shooter, side);
  const wideBias = clamp(0.5 + (quality - 0.5) * 0.25 + (angle / Math.PI - 0.18) * 0.25, 0.18, 0.82);
  const preferredSide = gkY < GOAL_CENTER_Y ? 1 : -1;
  const cornerOffset = GOAL_HALF_WIDTH_PCT * (0.72 + 0.2 * quality);
  let targetY;
  if (shotType === 'finesse') {
    targetY = GOAL_CENTER_Y + preferredSide * cornerOffset * 0.9;
  } else if (Math.random() < wideBias) {
    targetY = GOAL_CENTER_Y + (Math.random() < 0.5 ? -1 : 1) * cornerOffset;
  } else {
    targetY = GOAL_CENTER_Y + gaussian() * (GOAL_HALF_WIDTH_PCT * 0.35);
  }
  return { x: side === 'home' ? 100 : 0, y: clamp(targetY, GOAL_CENTER_Y - GOAL_HALF_WIDTH_PCT, GOAL_CENTER_Y + GOAL_HALF_WIDTH_PCT) };
}

export function executeShot({ shooter, side, defenders = [], goalkeeper, shotType = 'standard', target } = {}) {
  const quality = calculateShotQuality({ shooter, side, defenders, shotType });
  const targetPoint = target || chooseShotTarget({ shooter, side, goalkeeper, shotType });
  const dist = distance2D(shooter, targetPoint);
  const finishing = clamp(attr(shooter, 'finishing') / 20, 0, 1);
  const technique = clamp(attr(shooter, 'technique') / 20, 0, 1);
  const composure = clamp(attr(shooter, 'composure') / 20, 0, 1);
  const weakFootPenalty = shooter?.weakFootShot ? 1.15 : 1;

  const baseSigma = 2.1;
  const distanceFactor = clamp(dist / 65, 0, 1);
  const pressureFactorValue = quality.pressure;
  const sigma = clamp(
    baseSigma * (1 + 0.85 * distanceFactor + 0.8 * pressureFactorValue) *
      (1 - 0.58 * finishing - 0.18 * technique - 0.12 * composure) * weakFootPenalty,
    0.25,
    5.5,
  );

  const errorY = gaussian() * sigma;
  const actualTarget = {
    x: targetPoint.x,
    y: clamp(targetPoint.y + errorY, 0.2, 99.8),
  };

  const power = clamp(
    4.8 + finishing * 1.4 + technique * 1.8 + (shotType === 'power' ? 1.4 : 0) - quality.pressure * 0.8,
    3.2,
    9.8,
  );
  const elevation = clamp(
    (shotType === 'chip' ? 0.62 : shotType === 'low' ? 0.18 : 0.28) + gaussian() * (0.06 + (1 - technique) * 0.05),
    0.05,
    0.85,
  );
  const curl = clamp(
    (shotType === 'finesse' ? 1.25 : 0.55) * (attr(shooter, 'curve', 12) / 20) * (attr(shooter, 'technique') / 20),
    0,
    1.35,
  );
  const sideSign = actualTarget.y >= shooter.y ? 1 : -1;
  const dx = actualTarget.x - shooter.x;
  const dy = actualTarget.y - shooter.y;
  const d = Math.hypot(dx, dy) || 1;
  const vx = dx / d * power;
  const vy = dy / d * power;

  return {
    ...quality,
    target: targetPoint,
    actualTarget,
    sigma,
    power,
    elevation,
    curl,
    curlSign: sideSign,
    vx,
    vy,
  };
}

export function resolveGoalkeeper({ goalkeeper, shooter, side, shot, ballTravelSeconds, goalLineX = side === 'home' ? 100 : 0 } = {}) {
  if (!goalkeeper || !shot) return { save: false, reason: 'no-goalkeeper' };
  const target = shot.actualTarget || shot.target;
  const lateralDistance = Math.abs(pct(goalkeeper.y) - pct(target.y));
  const positioningError = Math.abs(pct(goalkeeper.y) - GOAL_CENTER_Y);
  const anticipation = clamp(attr(goalkeeper, 'anticipation') / 20, 0, 1);
  const agility = clamp(attr(goalkeeper, 'agility') / 20, 0, 1);
  const reflexes = clamp(attr(goalkeeper, 'reflexes', attr(goalkeeper, 'anticipation')) / 20, 0, 1);
  const reach = clamp(1.5 + agility * 1.8 + reflexes * 1.4, 1.5, 4.7);
  const reaction = clamp(0.34 - anticipation * 0.16 - reflexes * 0.10, 0.08, 0.36);
  const diveSpeed = 8.5 + agility * 4.5;
  const diveSeconds = reaction + Math.max(0, lateralDistance - reach) / diveSpeed;
  const travel = Math.max(0, Number(ballTravelSeconds) || 0);
  const canReach = diveSeconds <= travel;
  const placementDifficulty = clamp(lateralDistance / 25, 0, 1);
  const saveQuality = clamp(0.45 * reflexes + 0.25 * agility + 0.20 * anticipation + 0.10 * (1 - positioningError / 50), 0, 1);
  const parryChance = canReach ? clamp(0.18 + 0.35 * (1 - saveQuality) + 0.12 * placementDifficulty, 0.12, 0.58) : 0;

  if (!canReach) return { save: false, reason: 'dive-too-slow', diveSeconds, travelSeconds: travel, lateralDistance, reach };
  const saveProbability = clamp(0.20 + 0.68 * saveQuality - 0.38 * placementDifficulty + (positioningError < 8 ? 0.10 : -0.04), 0.04, 0.94);
  const roll = Math.random();
  if (roll < saveProbability * (1 - parryChance)) return { save: true, outcome: 'save', diveSeconds, travelSeconds: travel, saveProbability };
  if (roll < saveProbability) return { save: true, outcome: 'parry', diveSeconds, travelSeconds: travel, saveProbability };
  return { save: false, outcome: 'goal', diveSeconds, travelSeconds: travel, saveProbability };
}
