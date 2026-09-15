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

import { players as worldPlayers } from '../data/worldData.js';
import { readinessScore, aiRotationNeed } from './fmMatchLabAdapter.js';

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
      baseX: x, baseY: y, x, y, vx: 0, vy: 0, fatigue: 0,
      ai: teamSide === 'away',
      teamSide,
      action: 'shape',
      targetX: x, targetY: y,
      tackleCooldown: 0,
      lastActionTick: 0,
      touches: 0, passesAttempted: 0, passesCompleted: 0, shots: 0, goals: 0, assists: 0, tackles: 0, distanceKm: 0,
    };
  });
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

function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
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
  const dir = p.teamSide === 'home' ? 1 : -1;
  const ballAdvance = state.ballX - 50;
  const elasticity = SHAPE_ELASTICITY[p.pos] ?? 0.25;
  const shiftX = clamp(ballAdvance * elasticity * dir, -16, 16) * dir;
  const shiftY = clamp((state.ballY - p.baseY) * 0.12, -8, 8);
  return { x: clamp(p.baseX + shiftX, 3, 97), y: clamp(p.baseY + shiftY, 4, 96) };
}

function pickPressers(defendXI, ball) {
  return outfield(defendXI)
    .map(p => ({ p, d: distance(p, ball) }))
    .sort((a,b) => a.d - b.d)
    .slice(0, 2)
    .map(x => x.p.id);
}

function pickRunner(attackXI, state) {
  const candidates = outfield(attackXI).filter(p => p.id !== state.ballOwnerId);
  if (!candidates.length) return null;
  const weighted = candidates.map(p => ({
    id: p.id,
    w: (RUN_WEIGHT[p.pos] ?? 1) * (0.6 + effAttr(p,'offBall')/160) * (0.5 + Math.random())
  }));
  weighted.sort((a,b) => b.w - a.w);
  return weighted[0].id;
}

function runTarget(p, state) {
  const dir = p.teamSide === 'home' ? 1 : -1;
  const depth = clamp(p.baseX + dir * (18 + effAttr(p,'pace')/8), 8, 92);
  const width = clamp(p.baseY + (Math.random()-0.5) * 10, 8, 92);
  return { x: depth, y: width };
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

  const pressers = new Set(pickPressers(defendXI, ball));
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
      moveTo(p, ball, 1.65*pace);
      return;
    }
    if (p.teamSide === attackSide && p.id === state.runnerId && state.ballX > 15 && state.ballX < 85) {
      p.action = 'run';
      moveTo(p, runTarget(p, state), 1.55*pace);
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
  state.ballInFlight = { fromId: from.id, toX, toY, kind, meta, attempted: new Set(), ticks: 0 };
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
        if (Math.random()*100 < chance) {
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
    resolvePassArrival(state, f);
  }
}

function resolvePassArrival(state, f) {
  const side = state.possession;
  const xi = side === 'home' ? state.homeXI : state.awayXI;
  const receiver = xi.find(p => p.id === f.meta.receiverId) || outfield(xi).reduce((best,p) =>
    distance(p,{x:state.ballX,y:state.ballY}) < distance(best,{x:state.ballX,y:state.ballY}) ? p : best, outfield(xi)[0]);
  state.stats[side].passesAttempted++;
  const success = Math.random()*100 < f.meta.successChance;
  state.ballInFlight = null;
  if (!success) {
    log(state, `${f.meta.fromName}'s pass is cut out.`, 'turnover', side === 'home' ? 'away' : 'home');
    const other = side === 'home' ? 'away' : 'home';
    state.possession = other;
    const pickUpXI = other === 'home' ? state.homeXI : state.awayXI;
    const nearest = outfield(pickUpXI).reduce((best,p) => distance(p,{x:state.ballX,y:state.ballY}) < distance(best,{x:state.ballX,y:state.ballY}) ? p : best, outfield(pickUpXI)[0]);
    state.ballOwnerId = nearest.id;
    state.possessionChain = 0;
    state.dribbleTicksLeft = 4;
    state.dribbleTargetSet = false;
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

  const onTargetChance = clamp(
    16 + effAttr(attacker,'technique')*.26 + effAttr(attacker,'composure')*.15 +
    (100-clamp(xDist,0,100))*.20 - pressure*.85 + (MENTALITY_ATTACK[tactics?.mentality]||0),
    8, 72
  );
  const onTarget = Math.random()*100 < onTargetChance;
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

  const placement = Math.random()*GOAL_HALF_WIDTH;
  const gkQuality = gk ? (effAttr(gk,'positioning')*.3+effAttr(gk,'anticipation')*.3+effAttr(gk,'composure')*.2+effAttr(gk,'decisions')*.2) : 50;
  const saveChance = clamp(gkQuality*1.5 - placement*7 - (effAttr(attacker,'finishing')-60)*.25, 15, 88);
  const xg = clamp((onTargetChance/100) * (1-saveChance/100) * 1.3, 0.02, 0.75);
  state.stats[side].xG = (state.stats[side].xG||0) + xg;
  state.stats[side].onTarget++;

  if (Math.random()*100 < saveChance) {
    log(state, `${attacker.name} gets the shot away, but the goalkeeper saves it!`, 'chance', side);
    if (Math.random()<0.3) {
      state.stats[side].corners++;
      log(state, `Saved behind — corner for ${side==='home'?state.homeName:state.awayName}.`, 'setpiece', side);
      state.possession = side;
      resetForRestart(state, side==='home'?98:2, Math.random()<0.5?2:98);
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
      state.dribbleTarget = { x: clamp(carrier.x + dir*6, 4, 96), y: clamp(carrier.y + (Math.random()-0.5)*8, 4, 96) };
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
      const win = clamp(30 + (effAttr(presser,'tackling')-effAttr(carrier,'dribbling'))*.5 + (effAttr(presser,'aggression')-50)*.15, 8, 78);
      if (Math.random()*100 < win*0.10) {
        state.stats[side==='home'?'away':'home'].fouls++;
        // Cards are a real consequence now, not just a foul counter — most
        // fouls are just fouls, some earn a yellow, a rare few a straight
        // red (or a second yellow). The engine doesn't remodel the pitch
        // for a sent-off player (too risky to the tuned simulation), but
        // the card itself is real and gets read back into the player's
        // live state after full-time.
        const cardRoll = Math.random();
        if (cardRoll < 0.05) {
          presser.redCard = true;
          log(state, `${presser.name} fouls ${carrier.name} and is shown a RED CARD!`, 'card', side==='home'?'away':'home');
        } else if (cardRoll < 0.28) {
          presser.yellowCards = (presser.yellowCards||0)+1;
          if (presser.yellowCards >= 2) {
            presser.redCard = true;
            log(state, `${presser.name} is booked again — second yellow, RED CARD!`, 'card', side==='home'?'away':'home');
          } else {
            log(state, `${presser.name} fouls ${carrier.name} and is booked.`, 'card', side==='home'?'away':'home');
          }
        } else {
          log(state, `${presser.name} fouls ${carrier.name}.`, 'foul', side==='home'?'away':'home');
        }
        state.dribbleTicksLeft = 5; state.dribbleTargetSet = false;
        return;
      }
      if (Math.random()*100 < win) {
        presser.tackles=(presser.tackles||0)+1;
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

  const shootingRole = ['ST','AML','AMR','AMC'].includes(carrier.pos);
  const shootingUtility = shootingRole
    ? effAttr(carrier,'finishing')*.30+effAttr(carrier,'composure')*.14+effAttr(carrier,'decisions')*.10+(100-goalDistance)*.22-pressure*.9
    : -999;

  const teammates = outfield(xi).filter(p=>p.id!==carrier.id);
  let bestReceiver = null, bestScore = -1e9;
  teammates.forEach(p => {
    const score = effAttr(p,'offBall')*.2 + (side==='home'?p.x-carrier.x:carrier.x-p.x)*.6 - distance(p,carrier)*.3 + Math.random()*10;
    if (score > bestScore) { bestScore = score; bestReceiver = p; }
  });
  const passThreshold = bestReceiver ? (effAttr(carrier,'vision')*.35 + effAttr(carrier,'passing')*.25 - pressure*.55 + Math.random()*20) : -999;

  if (inFinalThird && (state.possessionChain||0)>=2 && shootingUtility>60 && shootingUtility>passThreshold+8) {
    carrier.action='shoot';
    log(state, `${carrier.name} shapes to shoot.`, 'play', side);
    launchBall(state, carrier, xGoal, clamp(carrier.y+(Math.random()-0.5)*6,10,90), 'shot');
    return;
  }

  if (bestReceiver && passThreshold>40) {
    const through = Math.abs((side==='home'?bestReceiver.x-carrier.x:carrier.x-bestReceiver.x))>8 && Math.random()<0.3;
    const successChance = clamp(60 + effAttr(carrier,'passing')*.3 - pressure*.7 - distance(carrier,bestReceiver)*.15, 35, 94);
    log(state, `${carrier.name} looks to find ${bestReceiver.name}.`, 'play', side);
    launchBall(state, carrier, bestReceiver.x, bestReceiver.y, through?'through-pass':'pass', { receiverId: bestReceiver.id, fromName: carrier.name, successChance });
    return;
  }

  state.dribbleTicksLeft = 3 + Math.floor(Math.random()*3);
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

export function initMatch({ homeXI, awayXI, homeName, awayName, homeTactics, awayTactics }) {
  const state = {
    minute:0, second:0, possession:'home', phase:'build-up', tick:0,
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
      home: { shots:0, onTarget:0, corners:0, fouls:0, passesAttempted:0, passesCompleted:0, xG:0 },
      away: { shots:0, onTarget:0, corners:0, fouls:0, passesAttempted:0, passesCompleted:0, xG:0 },
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
  else carrierStep(state);

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
