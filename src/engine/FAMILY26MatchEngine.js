// FAMILY 26 — UNIFIED MATCH ENGINE
// Merged from the three previously separated engine components:
//   1) FM Tweak v1.3 management/readiness/event model
//   2) FM Match Lab tactical model adapter
//   3) FAMILY 26 core match simulator
//
// This file is now the single authoritative football simulation module.
// The 3D renderer should consume its state/events; it must not calculate
// football outcomes independently.

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

export function pickContextualCommentary(action, rand=createSeededRng(deriveSeed('commentary', action))) {
  const key = eventFamilyFromAction(action);
  const list = EVENT_FAMILIES[key] || EVENT_FAMILIES.MOVEMENT;
  return list[Math.floor(rand() * list.length)];
}


// FAMILY 26 — FM Match Lab v1.4 inspired tactical model adapter.
//
// This module contains a clean-room representation of the tactical data
// decoded from the user-supplied .fmf file. It does not execute or embed
// proprietary engine code. The numeric ranges are used as tactical inputs
// for FAMILY 26's own simulation model.

export const FM_MATCH_LAB_VERSION = '23.1.8';

const STYLE_DATA = {
  CONTROL_POSSESSION: {
    attacking:[11,15], depth:[4,8], directness:[4,8], fluidity:[10,16], closingDown:[15,19], tempo:[6,10], width:[10,14],
    tendencies:{playOut:10, workBox:10, press:10, counterPress:10}, favoured:['Passing','Composure','Vision']
  },
  GEGENPRESS: {
    attacking:[11,15], depth:[1,5], directness:[8,12], fluidity:[10,16], closingDown:[18,20], tempo:[18,20], width:[5,9],
    tendencies:{counter:13, manMark:10, holdLine:13, press:15, counterPress:15}, favoured:['Stamina','Acceleration','Dribbling']
  },
  TIKI_TAKA: {
    attacking:[11,15], depth:[1,5], directness:[1,5], fluidity:[14,20], closingDown:[18,20], tempo:[1,5], width:[5,9],
    tendencies:{setPieces:1, counter:1, playOut:13, holdLine:10, crosses:1, workBox:13, press:13, counterPress:13}, favoured:['Composure','Passing','Flair']
  },
  VERTICAL_TIKI_TAKA: {
    attacking:[8,12], depth:[5,9], directness:[4,8], fluidity:[12,18], closingDown:[14,18], tempo:[4,8], width:[1,5],
    tendencies:{setPieces:1, counter:1, playOut:13, holdLine:10, crosses:1, underlap:10, workBox:13, press:13, counterPress:13}, favoured:['Vision','Technique','Stamina']
  },
  WING_PLAY: {
    attacking:[8,12], depth:[10,14], directness:[12,16], fluidity:[7,13], closingDown:[4,8], tempo:[13,17], width:[18,20],
    tendencies:{crosses:13, underlap:1, overlap:13, flanks:13}, favoured:['Dribbling','Crossing','Anticipation']
  },
  ROUTE_ONE: {
    attacking:[5,9], depth:[15,19], directness:[18,20], fluidity:[7,13], closingDown:[6,10], tempo:[10,14], width:[4,8],
    tendencies:{setPieces:13, playOut:1, crosses:13, workBox:1}, favoured:['Strength','Set Piece Ability','Aggression']
  },
  FLUID_COUNTER_ATTACK: {
    attacking:[5,9], depth:[15,19], directness:[4,8], fluidity:[12,18], closingDown:[4,8], tempo:[10,14], width:[4,8],
    tendencies:{counter:13, press:1, counterPress:1}, favoured:['Pace','Work Rate','Technique']
  },
  DIRECT_COUNTER_ATTACK: {
    attacking:[5,9], depth:[15,19], directness:[13,17], fluidity:[4,10], closingDown:[4,8], tempo:[10,14], width:[8,12],
    tendencies:{setPieces:13, counter:13, playOut:1, crosses:13, workBox:1, press:1, counterPress:1}, favoured:['Work Rate','Pace','Strength']
  },
  CATENACCIO: {
    attacking:[1,5], depth:[15,19], directness:[13,17], fluidity:[3,9], closingDown:[3,7], tempo:[1,4], width:[4,8],
    tendencies:{setPieces:10, manMark:10, holdLine:1, press:1, counterPress:1, preventCross:1}, favoured:['Concentration','Positioning','Set Piece Ability']
  },
  PARK_THE_BUS: {
    attacking:[1,5], depth:[18,20], directness:[8,12], fluidity:[1,7], closingDown:[1,5], tempo:[1,4], width:[6,10],
    tendencies:{setPieces:10, manMark:1, holdLine:1, press:1, counterPress:1, preventCross:1}, favoured:['Teamwork','Work Rate','Aggression']
  }
};

const STYLE_ALIASES = {
  'Control Possession':'CONTROL_POSSESSION', 'Gegenpress':'GEGENPRESS', 'Tiki-Taka':'TIKI_TAKA',
  'Vertical Tiki-Taka':'VERTICAL_TIKI_TAKA', 'Wing Play':'WING_PLAY', 'Route One':'ROUTE_ONE',
  'Fluid Counter-Attack':'FLUID_COUNTER_ATTACK', 'Direct Counter-Attack':'DIRECT_COUNTER_ATTACK',
  'Catenaccio':'CATENACCIO', 'Park the Bus':'PARK_THE_BUS'
};

const mid = r => (r[0] + r[1]) / 2;
const scale20 = value => Math.round(((value - 1) / 19) * 100);

export function getFMStyle(style) {
  const key = STYLE_ALIASES[style] || style || 'CONTROL_POSSESSION';
  return STYLE_DATA[key] || STYLE_DATA.CONTROL_POSSESSION;
}

export function buildTacticalModel(tactics = {}) {
  const style = getFMStyle(tactics.tacticalStyle || tactics.style || tactics.tactical_style);
  const pressing = tactics.pressing?.intensity ?? tactics.pressingIntensity ?? scale20(mid(style.closingDown));
  const tempo = tactics.tempo ?? scale20(mid(style.tempo));
  const width = tactics.width ?? scale20(mid(style.width));
  const directness = tactics.directness ?? scale20(mid(style.directness));
  const defensiveLine = tactics.teamInstructions?.defensiveLine ?? tactics.defensiveLine ?? 50 + (10 - mid(style.depth)) * 3.2;
  return {
    style,
    styleName: STYLE_ALIASES[tactics.tacticalStyle] ? tactics.tacticalStyle : 'Control Possession',
    tempo: Math.max(1, Math.min(100, tempo)),
    width: Math.max(1, Math.min(100, width)),
    directness: Math.max(1, Math.min(100, directness)),
    pressing: { intensity: Math.max(1, Math.min(100, pressing)) },
    defensiveLine: Math.max(10, Math.min(90, defensiveLine)),
    fluidity: scale20(mid(style.fluidity)),
    attacking: scale20(mid(style.attacking)),
    tendencies: style.tendencies,
    favouredAttributes: style.favoured,
  };
}

export function styleEffect(tactics = {}) {
  const m = buildTacticalModel(tactics);
  return {
    shortPassing: 1 - m.directness / 180,
    forwardPassing: m.directness / 100,
    runFrequency: 0.55 + m.fluidity / 220,
    pressFrequency: m.pressing.intensity / 100,
    width: m.width / 100,
    tempo: m.tempo / 100,
    counterAttack: m.tendencies.counter ? 0.55 + m.tendencies.counter / 40 : 0.25,
    crossFrequency: m.tendencies.crosses ? m.tendencies.crosses / 20 : 0.25,
    overlapFrequency: m.tendencies.overlap ? m.tendencies.overlap / 20 : 0.25,
    underlapFrequency: m.tendencies.underlap ? m.tendencies.underlap / 20 : 0.25,
    workBox: m.tendencies.workBox ? m.tendencies.workBox / 20 : 0.5,
  };
}

export { STYLE_DATA };


// FAMILY 26 Match Engine — rebuilt from the ground up (v2).
//
// Why this exists: the previous engine let far too many players chase the
// ball at once, re-decided actions every tick (causing cascading instability
// and unrealistic scorelines), and resolved shots/passes instantly with no
// real travel time. This version fixes all three by construction:
//
//   1. MOVEMENT is role-differentiated every tick. Only the 1-2 nearest
//      defenders to the ball ("pressers") ever move directly toward it.
//      Only ONE attacker at a time ("the runner") makes a forward run.
//      Everyone else holds/shifts a zonal shape relative to their own
//      formation slot and the ball's general area — a compact block, not a
//      crowd. This is the direct fix for "all of them running in the same
//      direction."
//   2. DECISIONS happen once per genuine possession touch, not every tick —
//      a player who receives the ball commits to a pass/shot/dribble and
//      that plays out over several ticks before anyone decides again.
//   3. The BALL is explicit and separate from any player once struck: a
//      pass or shot becomes an actual travelling object (ballInFlight) that
//      takes real ticks to arrive and can be intercepted along the way,
//      rather than resolving in the same tick it was declared.
//
// External API (buildXI, buildOpponentPool, initMatch, stepMatch,
// resolveDecision, simulateInstant, substitutePlayer) is unchanged so the
// Match.jsx UI needed no changes for this rebuild.

import { getCanonicalPlayers } from '../data/databaseBridge.js';
import { build51Vector, decisionProfile } from './playerIntelligence.js';
import { passSuccess, shotQuality, goalkeeperSaveChance, firstTouchQuality, dribbleSuccess, tackleOutcome, reboundChance } from './footballActionModel.js';
import { createSeededRng, deriveSeed, pick, randomInt } from './seededRng.js';
import { tacticalRoleAnchor, tacticalPressTrigger, teamShapeTargets } from './tacticalShape.js';
const worldPlayers = getCanonicalPlayers();

export const FIXED_DT_MS = 50;
export const FIXED_GAME_SECONDS = 0.5;

// ============================================================================
// Data construction (roster/attributes) — unchanged from the previous engine.
// This was never the source of the movement/scoreline problems; only the
// decision/physics/collision core below has been rebuilt.
// ============================================================================

function seededRand(seed) {
  let s = Math.abs(Number(seed) || 1) % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  next(); next(); next();
  return next;
}

const ATTR_KEYS = [
  'finishing','passing','technique','dribbling','pace','positioning',
  'anticipation','composure','tackling','strength','vision','decisions',
  'workRate','aggression','crossing','heading','offBall','acceleration'
];

function hashId(id) {
  return typeof id === 'number' && !Number.isNaN(id)
    ? id
    : String(id ?? '').split('').reduce((a,c) => a + c.charCodeAt(0), 17);
}

export function synthAttrs(id, ovr, pos, clubStrength = ovr) {
  const rand = seededRand(hashId(id) * 9973 + 17);
  const base = Math.max(35, Math.min(92, Number(ovr) || clubStrength || 70));
  const positional = {
    GK:['positioning','anticipation','composure','decisions'],
    ST:['finishing','pace','composure','offBall','acceleration'],
    AML:['dribbling','pace','technique','offBall','acceleration'],
    AMR:['dribbling','pace','technique','offBall','acceleration'],
    AMC:['vision','passing','technique','decisions','offBall'],
    MC:['passing','vision','decisions','workRate','offBall'],
    DM:['tackling','positioning','strength','anticipation','decisions'],
    DC:['tackling','positioning','strength','anticipation','heading'],
    DR:['pace','tackling','positioning','crossing','workRate'],
    DL:['pace','tackling','positioning','crossing','workRate'],
  }[pos] || [];
  const attrs = {};
  ATTR_KEYS.forEach(k => {
    const bump = positional.includes(k) ? 6 : 0;
    attrs[k] = Math.max(35, Math.min(99, Math.round(base + bump + (rand() - .5) * 12)));
  });
  return attrs;
}

function mapWorldPos(pos) {
  return ({ GK:'GK', ST:'ST', LW:'AML', RW:'AMR', CAM:'AMC', AM:'AMC', CM:'MC', CDM:'DM', DM:'DM', CB:'DC', LB:'DL', RB:'DR', WB:'DR' })[pos] || 'MC';
}

const OPP_NAMES = ['Onana II','Baptiste','Kessler','Njie','Alric','Voss','Mercer','Delacroix','Yamamoto','Bergqvist','Torino'];

function attrsFromWorld(k, ovr, pos) {
  const a = synthAttrs(`world-${k?.Passing || k?.Finishing || ovr}-${pos}`, ovr, pos);
  if (!k) return a;
  if (k.Passing != null) a.passing = k.Passing;
  if (k['Chance Creation'] != null) a.vision = k['Chance Creation'];
  if (k.Progression != null) a.dribbling = k.Progression;
  if (k.Finishing != null) a.finishing = k.Finishing;
  if (k.Tackles != null) a.tackling = k.Tackles;
  if (k.Interceptions != null) a.anticipation = k.Interceptions;
  if (k.Positioning != null) a.positioning = k.Positioning;
  if (k['Duels Won'] != null) a.strength = k['Duels Won'];
  if (k.Distribution != null) a.passing = k.Distribution;
  if (k['Save %'] != null) a.positioning = k['Save %'];
  return a;
}

function makeOpponentFromWorld(source, slot, index, strengthRating, clubName) {
  const ovr = Math.max(58, Math.min(96, source?.rating ?? strengthRating + ((index % 5) - 2)));
  return {
    id: source?.id ? `opp-${clubName}-${source.id}` : `opp-${clubName}-${90000 + index}`,
    name: source?.name || OPP_NAMES[index % OPP_NAMES.length],
    ovr, fit: source ? 88 + (index % 9) : 84 + (index % 10),
    morale: 'Good', sourceClub: clubName, sourceRating: source?.rating ?? ovr,
    keyAttributes: source?.keyAttributes || null,
  };
}

export function buildOpponentPool(strengthRating, formationSlots, clubName = 'Opponent') {
  const clubPlayers = worldPlayers.filter(p => p.club === clubName);
  const used = new Set();
  return formationSlots.map((slot, i) => {
    let source = clubPlayers.find(p => !used.has(p.id) && mapWorldPos(p.pos) === slot.code);
    if (!source) source = clubPlayers.find(p => !used.has(p.id) && ['AML','AMR'].includes(slot.code) && ['AML','AMR'].includes(mapWorldPos(p.pos))) || null;
    if (source) used.add(source.id);
    return makeOpponentFromWorld(source, slot, i, strengthRating, clubName);
  });
}

export function buildXI(pairs, teamSide) {
  return pairs.map(({ slot, player: p, duty }, i) => {
    const attrs = p.keyAttributes
      ? attrsFromWorld(p.keyAttributes, p.ovr ?? 70, slot.code)
      : synthAttrs(p.id ?? i, p.ovr ?? 70, slot.code, p.sourceRating ?? p.ovr ?? 70);
    const x = teamSide === 'away' ? slot.y : 100 - slot.y;
    const y = slot.x;
    return {
      id: p.id ?? `gen-${i}`, name: p.name || `Player ${i + 1}`, pos: slot.code, role: slot.label,
      duty: duty || p.duty || 'Support',
      ovr: p.ovr ?? 70, fit: p.fit ?? 90, morale: p.morale || 'Good', attrs,
      tacticalFamiliarity: p.tacticalFamiliarity ?? 70, condition: p.condition ?? p.fit ?? 90,
      readiness: readinessScore(p), rotationNeed: aiRotationNeed(p, 0, 0),
      vector51: build51Vector(p, attrs),
      intelligence: null,
      baseX: x, baseY: y, x, y, vx: 0, vy: 0, fatigue: 0,
      ai: teamSide === 'away',
      teamSide,
      action: 'shape',
      intelligence: null,
      targetX: x, targetY: y,
      tackleCooldown: 0,
      lastActionTick: 0,
      touches: 0, passesAttempted: 0, passesCompleted: 0, shots: 0, goals: 0, assists: 0, tackles: 0, distanceKm: 0,
    };
  }).map(p => ({ ...p, intelligence: decisionProfile(p, { homeTactics:{}, awayTactics:{} }, teamSide) }));
}

export function substitutePlayer(xi, outId, inPlayer) {
  return xi.map(p => p.id !== outId ? p : {
    ...p, id: inPlayer.id, name: inPlayer.name, ovr: inPlayer.ovr ?? 70,
    fit: inPlayer.fit ?? 95, morale: inPlayer.morale || 'Good',
    attrs: synthAttrs(inPlayer.id, inPlayer.ovr ?? 70, p.pos), fatigue: 0,
  });
}

// ============================================================================
// Small shared utilities.
// ============================================================================

const MENTALITY_ATTACK = { 'Very Defensive':-2, Defensive:-1, Balanced:0, Positive:1, Attacking:2, 'Very Attacking':3 };

function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
function outfield(xi) { return xi.filter(p => p.pos !== 'GK'); }
function fatigueFactor(p) { return Math.max(.62, 1 - p.fatigue / 170); }
function moraleFactor(p) { return p.morale === 'Good' ? 1.05 : p.morale === 'Unhappy' ? .94 : 1; }
function effAttr(p,key) { return (p.attrs?.[key] || 60) * fatigueFactor(p) * moraleFactor(p) * ((p.fit || 90) / 100); }

function log(state,text,type='play',team=null) {
  state.events.unshift({minute:state.minute,second:Math.floor(state.second),text,type,team});
  state.events=state.events.slice(0,80);
}

// ============================================================================
// Role-based shape/behaviour tables — the heart of the rebuild.
// ============================================================================

const RUN_WEIGHT = { ST:5, AMC:4, AML:4, AMR:4, MC:2, DM:1, DR:1.4, DL:1.4, DC:0.2, GK:0 };
const SHAPE_ELASTICITY = { GK:0.04, DC:0.16, DL:0.30, DR:0.30, DM:0.22, MC:0.34, AMC:0.42, AML:0.46, AMR:0.46, ST:0.40 };

function shapeTarget(p, state) {
  const tactics = p.teamSide === 'home' ? state.homeTactics : state.awayTactics;
  const anchor = tacticalRoleAnchor(p, state.formationName, tactics);
  const dir = p.teamSide === 'home' ? 1 : -1;
  const compact = clamp(Number(tactics?.compactness ?? 60), 0, 100);
  const ballShift = clamp((state.ballX - 50) * 0.11 * dir, -7, 7);
  const ballYShift = clamp((state.ballY - 50) * (0.07 + (100-compact)*0.0005), -7, 7);
  const defending = state.possession !== p.teamSide;
  const defensiveLine = clamp(Number(tactics?.defensiveLine ?? 55), 10, 90);
  const blockShift = defending && p.pos !== 'GK' ? -(100-defensiveLine)*0.045*dir : 0;
  const width = clamp(Number(tactics?.width ?? 55), 0, 100);
  const wideRole = ['DL','DR','WBL','WBR','AML','AMR','LW','RW'].includes(p.pos);
  const widthPush = wideRole ? (width-50)*0.06*(p.baseY < 50 ? -1 : 1) : 0;
  return {
    x: clamp(anchor.x + ballShift + blockShift, 3, 97),
    y: clamp(anchor.y + ballYShift + widthPush, 4, 96)
  };
}

function pickPressers(defendXI, ball, state) {
  const tactics = defendXI[0]?.teamSide === 'home' ? state.homeTactics : state.awayTactics;
  const intensity = clamp(Number(tactics?.pressing?.intensity ?? 65), 1, 100);
  const count = intensity >= 78 ? 4 : intensity >= 60 ? 3 : intensity >= 42 ? 2 : 1;
  return outfield(defendXI)
    .map(p => {
      const trigger = tacticalPressTrigger(p, ball, state, tactics);
      const roleBonus = ['ST','AML','AMR','AMC','DM'].includes(p.pos) ? 1.5 : 0;
      return { p, trigger, score: (trigger ? 100 : 0) + roleBonus - distance(p, ball) };
    })
    .sort((a,b) => b.score-a.score)
    .slice(0,count)
    .map(x => x.p.id);
}

function pickRunner(attackXI, state) {
  const candidates = outfield(attackXI).filter(p => p.id !== state.ballOwnerId);
  if (!candidates.length) return null;
  const weighted = candidates.map(p => ({
    id: p.id,
    w: (RUN_WEIGHT[p.pos] ?? 1) * (0.55 + (p.vector51?.offBall || effAttr(p,'offBall'))/170) * (0.7 + (p.vector51?.anticipation || 60)/220) * (0.7 + state.rng()*.6)
  }));
  weighted.sort((a,b) => b.w - a.w);
  return weighted[0].id;
}

function runTarget(p, state) {
  const dir = p.teamSide === 'home' ? 1 : -1;
  const pace = p.vector51?.pace || effAttr(p,'pace');
  const offBall = p.vector51?.offBall || effAttr(p,'offBall');
  const attacking = p.teamSide === state.possession;
  const forwardDepth = attacking ? 18 + pace/8 + offBall/20 : 7;
  const lane = clamp(p.baseY + (p.baseY < 50 ? -1 : 1) * Math.min(8, offBall/18), 8, 92);
  return { x: clamp(p.baseX + dir*forwardDepth, 8, 92), y: lane };
}

// ============================================================================
// Movement — runs every tick. Everyone interpolates toward ONE target chosen
// by their role this tick (press / run / hold shape / carry).
// ============================================================================

function movementStep(state) {
  const ball = { x: state.ballX, y: state.ballY };
  const attackSide = state.possession;
  const defendSide = attackSide === 'home' ? 'away' : 'home';
  const attackXI = attackSide === 'home' ? state.homeXI : state.awayXI;
  const defendXI = defendSide === 'home' ? state.homeXI : state.awayXI;

  const defendTactics = defendSide === 'home' ? state.homeTactics : state.awayTactics;
  const pressIntensity = clamp(Number(defendTactics?.pressing?.intensity ?? 65), 1, 100);
  const pressers = new Set(pickPressers(defendXI, ball, state));
  state.pressers = [...pressers];

  if (state.runnerId == null || state.tick - (state.runnerSetTick||0) > 12 || state.runnerTeam !== attackSide) {
    state.runnerId = pickRunner(attackXI, state);
    state.runnerSetTick = state.tick;
    state.runnerTeam = attackSide;
  }

  const moveTo = (p, target, speedCap) => {
    const dx = target.x - p.x, dy = target.y - p.y;
    const d = Math.hypot(dx,dy) || 1;
    const step = Math.min(d, speedCap);
    p.x = clamp(p.x + (dx/d)*step, 1, 99);
    p.y = clamp(p.y + (dy/d)*step, 1, 99);
    p.distanceKm = (p.distanceKm||0) + step*1.05/1000*100;
  };

  [state.homeXI, state.awayXI].forEach(xi => xi.forEach(p => {
    if (p.id === state.ballOwnerId) return;
    const pace = effAttr(p,'pace')/60;
    if (p.pos === 'GK') {
      const gx = p.teamSide==='home' ? clamp(6 + (state.ballX>75?2:0), 2, 12) : clamp(94 - (state.ballX<25?2:0), 88, 98);
      p.action='cover';
      moveTo(p, { x: gx, y: clamp(50 + (ball.y-50)*0.25, 38, 62) }, 0.6*pace);
      return;
    }
    if (p.teamSide === defendSide && pressers.has(p.id)) {
      p.action = 'press';
      moveTo(p, ball, (1.10 + pressIntensity/100*.85)*pace);
      return;
    }
    if (p.teamSide === attackSide && p.id === state.runnerId && state.ballX > 15 && state.ballX < 85) {
      p.action = 'run';
      const attackTactics = attackSide === 'home' ? state.homeTactics : state.awayTactics;
      const runBoost = attackTactics?.transition?.counter ? 1.25 : 1;
      moveTo(p, runTarget(p, state), (1.20 + Number(attackTactics?.tempo ?? 55)/100*.55)*pace*runBoost);
      return;
    }
    p.action = p.teamSide === attackSide ? 'support' : 'cover';
    moveTo(p, shapeTarget(p, state), 0.95*pace);
  }));
}

// ============================================================================
// Ball-in-flight — a pass or shot is a real travelling object, not an
// instantly-resolved event.
// ============================================================================

function launchBall(state, from, toX, toY, kind, meta={}) {
  state.ballOwnerId = null;
  state.ballInFlight = { fromId: from.id, fromX: state.ballX, fromY: state.ballY, toX, toY, kind, meta, attempted: new Set(), ticks: 0, ballSpeed: kind === 'shot' ? 7.5 : kind === 'through-pass' ? 5.6 : 4.6 };
}

function flightStep(state) {
  const f = state.ballInFlight;
  f.ticks++;
  const speed = f.kind === 'shot' ? 7.5 : f.kind === 'through-pass' ? 5.6 : 4.6;
  const dx = f.toX - state.ballX, dy = f.toY - state.ballY;
  const d = Math.hypot(dx,dy) || 1;
  const step = Math.min(d, speed);
  state.ballX = clamp(state.ballX + (dx/d)*step, 0, 100);
  state.ballY = clamp(state.ballY + (dy/d)*step, 0, 100);

  if (state.ballY <= 0.5 || state.ballY >= 99.5) {
    log(state, 'The ball goes out for a throw-in.', 'info', null);
    const throwSide = state.possession === 'home' ? 'away' : 'home';
    state.possession = throwSide;
    resetForRestart(state, clamp(state.ballX,4,96), clamp(state.ballY,4,96));
    return;
  }

  if (f.kind !== 'shot') {
    const defendXI = state.possession === 'home' ? state.awayXI : state.homeXI;
    for (const def of outfield(defendXI)) {
      if (f.attempted.has(def.id)) continue;
      if (distance(def, {x:state.ballX,y:state.ballY}) < 5.5) {
        f.attempted.add(def.id);
        const chance = clamp(effAttr(def,'anticipation')*.4 + effAttr(def,'positioning')*.2 - 20, 6, 42);
        if (state.rng()*100 < chance) {
          def.tackles=(def.tackles||0)+1;
          state.possession = def.teamSide;
          state.ballInFlight = null;
          state.ballOwnerId = def.id;
          state.possessionChain = 0;
          state.dribbleTicksLeft = 5;
          state.dribbleTargetSet = false;
          log(state, `${def.name} steps in and cuts out the pass.`, 'turnover', def.teamSide);
          return;
        }
      }
    }
  }

  if (d <= step + 0.5) {
    if (f.kind === 'shot') { resolveShotArrival(state, f); return; }
    // Execution is resolved when the pass reaches its target so the ball can be
    // intercepted during flight. This is separate from first-touch quality.
    if (state.rng()*100 > Number(f.meta.successChance ?? 70)) {
      state.ballInFlight=null;
      const other=state.possession==='home'?'away':'home';
      state.possession=other;
      const pickup=outfield(other==='home'?state.homeXI:state.awayXI).reduce((best,p)=>distance(p,{x:state.ballX,y:state.ballY})<distance(best,{x:state.ballX,y:state.ballY})?p:best, outfield(other==='home'?state.homeXI:state.awayXI)[0]);
      if (pickup) { state.ballOwnerId=pickup.id; state.possessionChain=0; state.dribbleTicksLeft=3; state.dribbleTargetSet=false; }
      log(state, `${f.meta.fromName}'s pass misses its target.`, 'turnover', other);
      return;
    }
    resolvePassArrival(state, f);
  }
}

function resolvePassArrival(state, f) {
  const side = state.possession;
  const xi = side === 'home' ? state.homeXI : state.awayXI;
  const receiver = xi.find(p => p.id === f.meta.receiverId) || outfield(xi).reduce((best,p) =>
    distance(p,{x:state.ballX,y:state.ballY}) < distance(best,{x:state.ballX,y:state.ballY}) ? p : best, outfield(xi)[0]);
  const pressure = receiver ? outfield(side==='home'?state.awayXI:state.homeXI)
    .map(p=>distance(p,receiver)).sort((a,b)=>a-b).slice(0,3)
    .reduce((sum,d)=>sum+clamp(16-d,0,16),0)/Math.max(1,Math.min(3,outfield(side==='home'?state.awayXI:state.homeXI).length)) : 0;

  state.stats[side].passesAttempted++;
  if (!receiver) { state.ballInFlight=null; return; }

  // Offside is determined at the instant the pass is played, not when it arrives.
  if (f.meta.offside) {
    state.stats[side].offsides++;
    log(state, `${receiver.name} is caught offside.`, 'offside', side);
    state.ballInFlight=null;
    state.possession = side==='home'?'away':'home';
    resetForRestart(state, side==='home'?58:42, clamp(receiver.y,8,92));
    return;
  }

  const touch = firstTouchQuality(receiver, pressure, { ballSpeed:f.ballSpeed || 4.6, bodyPosition:f.meta.bodyPosition || 0 });
  const controlRoll = state.rng()*100;
  state.ballInFlight = null;
  if (controlRoll > touch) {
    state.stats[side].passesCompleted += touch > 48 ? 0.5 : 0;
    receiver.touches=(receiver.touches||0)+1;
    state.possessionChain=0;
    state.ballOwnerId=null;
    state.looseBallTicks=8;
    state.looseBallReason='heavy first touch';
    log(state, `${receiver.name} struggles to control the pass.`, 'loose-ball', side);
    return;
  }

  receiver.touches=(receiver.touches||0)+1;
  state.stats[side].passesCompleted++;
  state.possessionChain = (state.possessionChain||0) + 1;
  state.ballOwnerId = receiver.id;
  state.lastPasser = xi.find(p => p.id === f.fromId) || null;
  state.dribbleTicksLeft = 0;
  state.dribbleTargetSet = false;
  log(state, `${f.meta.fromName} finds ${receiver.name}.`, 'play', side);
}
const GOAL_HALF_WIDTH = 5;

function resolveShotArrival(state, f) {
  const side = state.possession;
  const xi = side === 'home' ? state.homeXI : state.awayXI;
  const defXI = side === 'home' ? state.awayXI : state.homeXI;
  const attacker = xi.find(p => p.id === f.fromId);
  const gk = defXI.find(p => p.pos === 'GK');
  const nearest = outfield(defXI).map(p=>({p,d:distance(p,attacker)})).sort((a,b)=>a.d-b.d).slice(0,3);
  const pressure = nearest.reduce((s,o)=>s+clamp(18-o.d,0,18),0)/Math.max(1,nearest.length);
  const xDist = side==='home' ? 100-attacker.x : attacker.x;
  const tactics = side==='home' ? state.homeTactics : state.awayTactics;

  const angle = clamp(1 - Math.abs(attacker.y - 50) / 55, .15, 1);
  const quality = shotQuality(attacker, { distance:xDist, angle, pressure });
  const onTargetChance = clamp(quality*100*0.72 + effAttr(attacker,'technique')*.10 + (MENTALITY_ATTACK[tactics?.mentality]||0), 8, 78);
  const onTarget = state.rng()*100 < onTargetChance;
  state.stats[side].shots++;
  attacker.shots=(attacker.shots||0)+1;
  attacker.touches=(attacker.touches||0)+1;
  state.ballInFlight = null;

  if (!onTarget) {
    state.stats[side].xG = (state.stats[side].xG||0) + (onTargetChance/100)*0.15;
    log(state, `${attacker.name}'s effort goes wide of the post.`, 'chance', side);
    state.possession = side==='home'?'away':'home';
    resetForRestart(state, side==='home'?96:4, 50);
    return;
  }

  const placement = state.rng()*GOAL_HALF_WIDTH;
  const gkQuality = gk ? goalkeeperSaveChance(gk, { shotQuality:quality }) : .18;
  const saveChance = clamp(gkQuality*100 - placement*5 - (effAttr(attacker,'finishing')-60)*.18, 8, 88);
  const xg = clamp((onTargetChance/100) * (1-saveChance/100) * 1.3, 0.02, 0.75);
  state.stats[side].xG = (state.stats[side].xG||0) + xg;
  state.stats[side].onTarget++;

  if (state.rng()*100 < saveChance) {
    state.stats[side==='home'?'away':'home'].saves++;
    log(state, `${attacker.name} gets the shot away, but the goalkeeper saves it!`, 'chance', side);
    if (state.rng()<0.3) {
      state.stats[side].corners++;
      log(state, `Saved behind — corner for ${side==='home'?state.homeName:state.awayName}.`, 'setpiece', side);
      state.possession = side;
      resetForRestart(state, side==='home'?98:2, state.rng()<0.5?2:98);
    } else {
      state.possession = side==='home'?'away':'home';
      resetForRestart(state, side==='home'?92:8, 50);
    }
    return;
  }

  state.score[side]++;
  attacker.goals=(attacker.goals||0)+1;
  const assister = state.lastPasser && state.lastPasser.id!==attacker.id ? state.lastPasser : null;
  if (assister) assister.assists=(assister.assists||0)+1;
  state.lastPasser = null;
  log(state, `${attacker.name} finds the finish... GOAL!`, 'goal', side);
  state.possession = side==='home' ? 'away' : 'home';
  resetForRestart(state, 50, 50);
}

function resetForRestart(state, x, y) {
  state.ballX = x; state.ballY = y;
  state.ballInFlight = null;
  state.possessionChain = 0;
  state.dribbleTicksLeft = 4;
  state.dribbleTargetSet = false;
  [state.homeXI, state.awayXI].forEach(xi => xi.forEach(p => { p.x = p.baseX; p.y = p.baseY; }));
  const xi = state.possession === 'home' ? state.homeXI : state.awayXI;
  const nearest = outfield(xi).reduce((best,p) => distance(p,{x,y}) < distance(best,{x,y}) ? p : best, outfield(xi)[0]);
  state.ballOwnerId = nearest.id;
}

// ============================================================================
// Carrier decisions — made ONCE per possession touch, not every tick.
// ============================================================================

function carrierStep(state) {
  const side = state.possession;
  const xi = side === 'home' ? state.homeXI : state.awayXI;
  const defXI = side === 'home' ? state.awayXI : state.homeXI;
  const carrier = xi.find(p => p.id === state.ballOwnerId);
  if (!carrier) { state.ballOwnerId = outfield(xi)[0]?.id ?? xi[0]?.id; return; }

  if (state.dribbleTicksLeft > 0) {
    if (!state.dribbleTargetSet) {
      const dir = side === 'home' ? 1 : -1;
      state.dribbleTarget = { x: clamp(carrier.x + dir*6, 4, 96), y: clamp(carrier.y + (state.rng()-0.5)*8, 4, 96) };
      state.dribbleTargetSet = true;
    }
    const dx = state.dribbleTarget.x - carrier.x, dy = state.dribbleTarget.y - carrier.y;
    const d = Math.hypot(dx,dy) || 1;
    const step = Math.min(d, 1.3*(effAttr(carrier,'pace')/70));
    carrier.x = clamp(carrier.x + (dx/d)*step, 1, 99);
    carrier.y = clamp(carrier.y + (dy/d)*step, 1, 99);
    carrier.action = 'carrier';
    state.ballX = carrier.x; state.ballY = carrier.y;

    const presser = outfield(defXI).find(d => state.pressers?.includes(d.id) && d.tackleCooldown<=0 && !d.redCard && distance(d,carrier)<3.2);
    if (presser) {
      presser.tackleCooldown = 14;
      const duel = tackleOutcome(presser, carrier, { pressure: Math.max(0, 6-distance(presser,carrier)) });
      const foulRoll = state.rng()*100;
      if (foulRoll < duel.foul) {
        state.stats[side==='home'?'away':'home'].fouls++;
        // Cards are a real consequence now, not just a foul counter — most
        // fouls are just fouls, some earn a yellow, a rare few a straight
        // red (or a second yellow). The engine doesn't remodel the pitch
        // for a sent-off player (too risky to the tuned simulation), but
        // the card itself is real and gets read back into the player's
        // live state after full-time.
        const cardRoll = state.rng();
        if (cardRoll < 0.05) {
          presser.redCard = true;
          state.stats[side==='home'?'away':'home'].redCards++;
          log(state, `${presser.name} fouls ${carrier.name} and is shown a RED CARD!`, 'card', side==='home'?'away':'home');
        } else if (cardRoll < 0.28) {
          presser.yellowCards = (presser.yellowCards||0)+1;
          if (presser.yellowCards >= 2) {
            presser.redCard = true;
            log(state, `${presser.name} is booked again — second yellow, RED CARD!`, 'card', side==='home'?'away':'home');
          } else {
            state.stats[side==='home'?'away':'home'].yellowCards++;
          log(state, `${presser.name} fouls ${carrier.name} and is booked.`, 'card', side==='home'?'away':'home');
          }
        } else {
          log(state, `${presser.name} fouls ${carrier.name}.`, 'foul', side==='home'?'away':'home');
        }
        state.dribbleTicksLeft = 5; state.dribbleTargetSet = false;
        return;
      }
      if (state.rng()*100 < duel.clean) {
        presser.tackles=(presser.tackles||0)+1; state.stats[presser.teamSide || (side==='home'?'away':'home')].tackles++;
        state.possession = presser.teamSide;
        state.ballOwnerId = presser.id;
        state.possessionChain = 0;
        state.dribbleTicksLeft = 5; state.dribbleTargetSet = false;
        log(state, `${presser.name} wins the ball off ${carrier.name}.`, 'turnover', presser.teamSide);
        return;
      }
    }
    [state.homeXI,state.awayXI].forEach(t=>t.forEach(p=>{ if(p.tackleCooldown>0) p.tackleCooldown--; }));
    state.dribbleTicksLeft--;
    return;
  }

  carrier.touches = (carrier.touches||0)+1;
  const xGoal = side==='home' ? 100 : 0;
  const goalDistance = Math.abs(xGoal-carrier.x);
  const inFinalThird = side==='home' ? carrier.x>68 : carrier.x<32;
  const nearest = outfield(defXI).map(p=>({p,d:distance(p,carrier)})).sort((a,b)=>a.d-b.d).slice(0,3);
  const pressure = nearest.reduce((s,o)=>s+clamp(18-o.d,0,18),0)/Math.max(1,nearest.length);

  const tactics = side === 'home' ? state.homeTactics : state.awayTactics;
  const intel = decisionProfile(carrier, state, side);
  carrier.intelligence = intel;
  const directness = clamp(Number(tactics?.directness ?? 52), 1, 100);
  const attackingFocus = clamp(Number(tactics?.attackingFocus ?? 50), 1, 100);
  const tempo = clamp(Number(tactics?.tempo ?? 55), 1, 100);
  const shootingRole = ['ST','AML','AMR','AMC'].includes(carrier.pos);
  const shootingUtility = shootingRole
    ? intel.shoot*.42 + (100-goalDistance)*.22 - pressure*.9
    : -999;

  const teammates = outfield(xi).filter(p=>p.id!==carrier.id);
  let bestReceiver = null, bestScore = -1e9;
  teammates.forEach(p => {
    const forward = (side==='home'?p.x-carrier.x:carrier.x-p.x);
    const lane = 12-Math.abs(p.y-carrier.y)*.12;
    const score = effAttr(p,'offBall')*.24 + forward*.62 - distance(p,carrier)*.28 + lane*.25 + effAttr(p,'vision')*.05;
    if (score > bestScore) { bestScore = score; bestReceiver = p; }
  });
  const passThreshold = bestReceiver ? (intel.passing*.55 + intel.progressive*.20 - pressure*.55 + (100-directness)*.08) : -999;

  if (inFinalThird && (state.possessionChain||0)>=2 && shootingUtility>60 && shootingUtility>passThreshold+8 + (50-attackingFocus)*.10) {
    carrier.action='shoot';
    log(state, `${carrier.name} shapes to shoot.`, 'play', side);
    launchBall(state, carrier, xGoal, clamp(carrier.y+(state.rng()-0.5)*6,10,90), 'shot');
    return;
  }

  if (bestReceiver && passThreshold>40) {
    const forwardGap = Math.abs((side==='home'?bestReceiver.x-carrier.x:carrier.x-bestReceiver.x));
    const through = forwardGap>8 && state.rng() < (0.12 + directness/100*.48);
    const distancePenalty = distance(carrier,bestReceiver)*(.10 + tempo/100*.12);
    const successChance = clamp(passSuccess(carrier, tactics, distance(carrier,bestReceiver), pressure, { bodyPosition: carrier.vx > 0 ? 0.3 : 0 }) - distancePenalty*.18 + (intel.passing-50)*.08, 28, 97);
    const defenders = outfield(defXI);
    const line = side==='home' ? Math.min(...defenders.map(p=>p.x)) : Math.max(...defenders.map(p=>p.x));
    const aheadOfBall = side==='home' ? bestReceiver.x > carrier.x + 0.5 : bestReceiver.x < carrier.x - 0.5;
    const inOppHalf = side==='home' ? bestReceiver.x > 50 : bestReceiver.x < 50;
    const offside = aheadOfBall && inOppHalf && (side==='home' ? bestReceiver.x > line + 0.25 : bestReceiver.x < line - 0.25);
    log(state, `${carrier.name} looks to find ${bestReceiver.name}.`, 'play', side);
    launchBall(state, carrier, bestReceiver.x, bestReceiver.y, through?'through-pass':'pass', { receiverId: bestReceiver.id, fromName: carrier.name, successChance, offside, bodyPosition: 0 });
    return;
  }

  state.dribbleTicksLeft = 3 + Math.floor(state.rng()*3);
  state.dribbleTargetSet = false;
  carrier.action = 'carrier';
}

// ============================================================================
// Late-game tactical shifts (score-aware).
// ============================================================================

function maybeTriggerDecision(state) {
  const diff = state.score.home-state.score.away;
  const minute = state.minute;
  if (minute>=55 && diff<0 && !state.__homeChasing) {
    state.__homeChasing=true;
    state.homeTactics={...state.homeTactics,mentality:'Attacking',tempo:Math.min(82,(state.homeTactics.tempo||55)+12)};
    log(state,`${state.homeName} push forward as they chase the game.`,'decision');
  }
  if (minute>=55 && diff>0 && !state.__awayChasing) {
    state.__awayChasing=true;
    state.awayTactics={...state.awayTactics,mentality:'Attacking',tempo:Math.min(82,(state.awayTactics.tempo||55)+12)};
    log(state,`${state.awayName} push forward as they chase the game.`,'decision');
  }
  if (minute>=75 && diff>0 && !state.__homeProtecting) {
    state.__homeProtecting=true;
    state.homeTactics={...state.homeTactics,mentality:'Positive'};
    log(state,`${state.homeName} sit in a little to protect the lead.`,'decision');
  }
  if (minute>=75 && diff<0 && !state.__awayProtecting) {
    state.__awayProtecting=true;
    state.awayTactics={...state.awayTactics,mentality:'Positive'};
    log(state,`${state.awayName} sit in a little to protect the lead.`,'decision');
  }
}

// ============================================================================
// Public API
// ============================================================================

export function initMatch({ homeXI, awayXI, homeName, awayName, homeTactics, awayTactics, matchSeed = deriveSeed(homeName, awayName, 'match') }) {
  const state = {
    formationName: homeXI?.formationName || homeXI?.[0]?.formation || '4-3-3',
    minute:0, second:0, possession:'home', phase:'build-up', tick:0, matchSeed, rng:createSeededRng(matchSeed),
    ballX:50, ballY:50, ballInFlight:null,
    ballOwnerId: outfield(homeXI)[Math.floor(outfield(homeXI).length/2)]?.id ?? homeXI[0]?.id,
    dribbleTicksLeft:3, dribbleTargetSet:false,
    score:{home:0,away:0}, homeName, awayName,
    homeXI, awayXI, homeTactics, awayTactics,
    events:[{minute:0,second:0,text:'Kick-off.',type:'info',team:null}],
    pendingDecision:null, finished:false,
    possessionChain:0, lastPasser:null,
    runnerId:null, runnerSetTick:0, runnerTeam:null, pressers:[],
    stats: {
      home: { shots:0, onTarget:0, corners:0, fouls:0, passesAttempted:0, passesCompleted:0, xG:0, tackles:0, interceptions:0, saves:0, offsides:0, yellowCards:0, redCards:0, crosses:0 },
      away: { shots:0, onTarget:0, corners:0, fouls:0, passesAttempted:0, passesCompleted:0, xG:0, tackles:0, interceptions:0, saves:0, offsides:0, yellowCards:0, redCards:0, crosses:0 },
    },
    possessionTicks: { home:0, away:0 },
    territoryTicks: { home:0, away:0 },
  };
  [state.homeXI, state.awayXI].forEach(xi => xi.forEach(p => { p.x = p.baseX; p.y = p.baseY; }));
  return state;
}

export function resolveDecision(state, optionKey) { state.pendingDecision=null; return state; }

export function stepMatch(state, decisionInterval=7) {
  if (state.finished || state.pendingDecision) return state;

  state.tick += 1;
  state.second += FIXED_GAME_SECONDS;
  if (state.second>=60) { state.second-=60; state.minute+=1; }

  state.possessionTicks[state.possession] = (state.possessionTicks[state.possession]||0)+1;
  const territorySide = state.ballX>=50 ? 'home' : 'away';
  state.territoryTicks[territorySide] = (state.territoryTicks[territorySide]||0)+1;

  const eventsBefore = state.events;

  movementStep(state);
  if (state.ballInFlight) flightStep(state);
  else if (state.looseBallTicks > 0) {
    state.looseBallTicks--;
    const candidates=[...state.homeXI,...state.awayXI].filter(p=>p.pos!=='GK' && !p.redCard);
    const nearest=candidates.sort((a,b)=>distance(a,{x:state.ballX,y:state.ballY})-distance(b,{x:state.ballX,y:state.ballY}))[0];
    if (nearest && distance(nearest,{x:state.ballX,y:state.ballY})<2.8) {
      state.ballOwnerId=nearest.id; state.possession=nearest.teamSide; state.possessionChain=0; state.dribbleTicksLeft=3; state.dribbleTargetSet=false; state.looseBallTicks=0;
      log(state, `${nearest.name} recovers the loose ball.`, 'turnover', nearest.teamSide);
    }
  } else carrierStep(state);

  if (state.events === eventsBefore) {
    log(state, 'Play continues.', 'play', null);
  }

  maybeTriggerDecision(state);

  if (state.minute>=90) {
    state.finished=true;
    log(state,`Full-time: ${state.homeName} ${state.score.home} - ${state.score.away} ${state.awayName}.`,'info',null);
  }
  return {...state};
}

export function simulateInstant(initialState) {
  let s={...initialState}, guard=0;
  while (!s.finished && guard<20000) { s = stepMatch(s,7); guard++; }
  return s;
}
