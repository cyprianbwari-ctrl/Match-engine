// FAMILY 26 Match Engine — fixed-timestep, spatial-grid 2D simulation.
//
// Architecture per fixed 50 ms tick:
// 1) Perception       -> rebuild 18x12 spatial influence/pressure maps.
// 2) Decision         -> utility-score pass / run / press / carry / shot choices.
// 3) Physics/Steering -> move players with velocity vectors and move the ball.
// 4) Collision/Events -> resolve tackles, interceptions, shots, goals, turnovers.
//
// The simulation clock is independent from rendering. Match.jsx can render at
// any frame rate; this engine advances only in fixed-size simulation ticks.

import { players as worldPlayers } from '../data/worldData.js';

export const FIXED_DT_MS = 50;
export const FIXED_GAME_SECONDS = 0.5;
export const GRID_COLS = 18;
export const GRID_ROWS = 12;
export const GOAL_PAUSE_GAME_SECONDS = 6;
const PASS_SPEED_PCT_PER_TICK = 3.6;
const SHOT_SPEED_PCT_PER_TICK = 6.5;
const DRIBBLE_SPEED_PCT_PER_TICK = 1.15;

function seededRand(seed) {
  let s = Math.abs(Number(seed) || 1) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
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
  return pairs.map(({ slot, player: p }, i) => {
    const attrs = p.keyAttributes
      ? attrsFromWorld(p.keyAttributes, p.ovr ?? 70, slot.code)
      : synthAttrs(p.id ?? i, p.ovr ?? 70, slot.code, p.sourceRating ?? p.ovr ?? 70);
    const x = teamSide === 'away' ? 100 - slot.x : slot.x;
    const y = teamSide === 'away' ? slot.y : slot.y;
    return {
      id: p.id ?? `gen-${i}`, name: p.name || `Player ${i + 1}`, pos: slot.code, role: slot.label,
      ovr: p.ovr ?? 70, fit: p.fit ?? 90, morale: p.morale || 'Good', attrs,
      baseX: x, baseY: y, x, y, vx: 0, vy: 0, fatigue: 0,
      ai: teamSide === 'away',
      teamSide,
      action: 'shape',
      targetX: x, targetY: y,
      lastActionTick: 0,
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

const MENTALITY_ATTACK = { 'Very Defensive':-2, Defensive:-1, Balanced:0, Positive:1, Attacking:2, 'Very Attacking':3 };

function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
function outfield(xi) { return xi.filter(p => p.pos !== 'GK'); }
function fatigueFactor(p) { return Math.max(.62, 1 - p.fatigue / 170); }
function moraleFactor(p) { return p.morale === 'Good' ? 1.05 : p.morale === 'Unhappy' ? .94 : 1; }
function effAttr(p,key) { return (p.attrs?.[key] || 60) * fatigueFactor(p) * moraleFactor(p) * ((p.fit || 90) / 100); }
function teamAvg(xi,key) { const arr=outfield(xi); return arr.reduce((s,p)=>s+effAttr(p,key),0)/Math.max(1,arr.length); }

function gridIndex(x,y) {
  const c = clamp(Math.floor((x / 100) * GRID_COLS), 0, GRID_COLS - 1);
  const r = clamp(Math.floor((y / 100) * GRID_ROWS), 0, GRID_ROWS - 1);
  return r * GRID_COLS + c;
}

function emptyGrid() {
  return Array.from({length: GRID_COLS * GRID_ROWS}, () => ({
    home: 0, away: 0, homeCount: 0, awayCount: 0, pressureHome: 0, pressureAway: 0
  }));
}

// 18x12 spatial influence map. Each player contributes a soft influence radius
// based on positioning, anticipation, work rate and tactical pressure.
function buildInfluenceMap(xi, side, tactics) {
  const grid = emptyGrid();
  const intensity = (tactics?.pressing?.intensity ?? 55) / 55;
  xi.forEach(p => {
    const radius = p.pos === 'GK' ? 8 : 7 + effAttr(p,'anticipation') / 20;
    const c0 = clamp(Math.floor((p.x / 100) * GRID_COLS),0,GRID_COLS-1);
    const r0 = clamp(Math.floor((p.y / 100) * GRID_ROWS),0,GRID_ROWS-1);
    for (let r=Math.max(0,r0-2); r<=Math.min(GRID_ROWS-1,r0+2); r++) {
      for (let c=Math.max(0,c0-2); c<=Math.min(GRID_COLS-1,c0+2); c++) {
        const cx=(c+.5)*(100/GRID_COLS), cy=(r+.5)*(100/GRID_ROWS);
        const d=Math.hypot(cx-p.x,cy-p.y);
        if (d>radius*1.8) continue;
        const w=Math.max(0,1-d/(radius*1.8));
        const idx=r*GRID_COLS+c;
        grid[idx][side] += w * (.65 + effAttr(p,'workRate')/200);
        if (side === 'home') grid[idx].homeCount += w;
        else grid[idx].awayCount += w;
      }
    }
  });
  // Pressure is relative influence: a side's defensive pressure is increased
  // in cells occupied by the opponent.
  grid.forEach(cell => {
    cell.pressureHome = cell.away * intensity;
    cell.pressureAway = cell.home * intensity;
  });
  return grid;
}

function perceive(state) {
  const grid = emptyGrid();
  const homeMap = buildInfluenceMap(state.homeXI,'home',state.homeTactics);
  const awayMap = buildInfluenceMap(state.awayXI,'away',state.awayTactics);
  for (let i=0;i<grid.length;i++) {
    grid[i].home = homeMap[i].home;
    grid[i].away = awayMap[i].away;
    grid[i].homeCount = homeMap[i].homeCount;
    grid[i].awayCount = awayMap[i].awayCount;
    grid[i].pressureHome = awayMap[i].away * ((state.homeTactics?.pressing?.intensity??55)/55);
    grid[i].pressureAway = homeMap[i].home * ((state.awayTactics?.pressing?.intensity??55)/55);
  }
  const ballCell = grid[gridIndex(state.ballX,state.ballY)];
  const attack = state.possession === 'home' ? 'home' : 'away';
  const defend = attack === 'home' ? 'away' : 'home';
  const nearest = (attack === 'home' ? state.homeXI : state.awayXI)
    .filter(p=>p.pos!=='GK')
    .map(p=>({p,d:distance(p,{x:state.ballX,y:state.ballY})}))
    .sort((a,b)=>a.d-b.d)
    .slice(0,4);
  state.spatial = {
    cols: GRID_COLS, rows: GRID_ROWS, grid,
    ballCell, ballCellIndex:gridIndex(state.ballX,state.ballY),
    nearestAttackers: nearest.map(x=>x.p.id),
    pressure: { attack: attack==='home'?ballCell.pressureHome:ballCell.pressureAway,
      defend: defend==='home'?ballCell.pressureHome:ballCell.pressureAway }
  };
  return state.spatial;
}

function teamPower(xi,tactics) {
  const technical=teamAvg(xi,'passing')*.20+teamAvg(xi,'technique')*.12+teamAvg(xi,'vision')*.10;
  const defensive=teamAvg(xi,'tackling')*.18+teamAvg(xi,'positioning')*.12+teamAvg(xi,'anticipation')*.10;
  const athletic=teamAvg(xi,'pace')*.08+teamAvg(xi,'workRate')*.05+teamAvg(xi,'strength')*.05;
  const mentality=(MENTALITY_ATTACK[tactics?.mentality]??0)*2.5;
  return technical+defensive+athletic+mentality;
}

export function initMatch({ homeXI, awayXI, homeName, awayName, homeTactics, awayTactics }) {
  const state = {
    minute:0, second:0, possession:'home', phase:'build-up', phaseTick:0, tick:0,
    ballX:50, ballY:50, ballVX:0, ballVY:0, ballTargetX:50, ballTargetY:50,
    ballOwnerId:null, score:{home:0,away:0}, homeName, awayName,
    homeXI, awayXI, homeTactics, awayTactics,
    events:[{minute:0,second:0,text:'Kick-off.',type:'info'}],
    pendingDecision:null, finished:false,
    spatial:null, currentAction:null, possessionChain:0, phase:'kickoff', postGoalTicks:0, lastGoalTeam:null, lastEventPlayer:null,
  };
  perceive(state);
  return state;
}

function log(state,text,type='play') {
  state.events.unshift({minute:state.minute,second:Math.floor(state.second),text,type});
  state.events=state.events.slice(0,60);
}

function nearestDefenders(player, defendXI, n=3) {
  return outfield(defendXI).map(d=>({d,dist:distance(player,d)})).sort((a,b)=>a.dist-b.dist).slice(0,n);
}

function pressureAt(player, defendXI) {
  const near=nearestDefenders(player,defendXI,3);
  if (!near.length) return 0;
  return near.reduce((s,o)=>s+clamp(20-o.dist,0,20),0)/near.length;
}

function chooseCarrier(xi,state) {
  const candidates=outfield(xi);
  return candidates.sort((a,b)=>{
    const sa=.26*effAttr(a,'decisions')+.22*effAttr(a,'technique')+.16*effAttr(a,'passing')+
      .12*effAttr(a,'dribbling')+.24*(100-distance(a,{x:state.ballX,y:state.ballY}));
    const sb=.26*effAttr(b,'decisions')+.22*effAttr(b,'technique')+.16*effAttr(b,'passing')+
      .12*effAttr(b,'dribbling')+.24*(100-distance(b,{x:state.ballX,y:state.ballY}));
    return sb-sa;
  })[0] || xi[0];
}

function roleSpaceTarget(p, state, attacking) {
  const dir=attacking ? 1 : -1;
  const isWide=['DR','DL','AML','AMR'].includes(p.pos);
  const isFront=['ST','AML','AMR','AMC'].includes(p.pos);
  let tx=p.baseX, ty=p.baseY;
  // Maintain shape but allow tactical movement around the ball.
  if (attacking) {
    tx += dir * (isFront ? 4 : ['MC','DM'].includes(p.pos) ? 1.5 : .7);
    if (p.pos==='ST') tx += dir*3;
    if (p.pos==='AML') { tx += dir*3; ty -= 2; }
    if (p.pos==='AMR') { tx += dir*3; ty += 2; }
    if (p.pos==='DR' || p.pos==='DL') tx += dir*3;
  } else {
    tx += dir * (isFront ? -2 : -0.7);
  }
  if (isWide) ty += clamp((state.ballY-ty)*.18,-4,4);
  else ty += clamp((state.ballY-ty)*.10,-3,3);
  return {x:clamp(tx,3,97),y:clamp(ty,4,96)};
}

function chooseRunTarget(p,state,attackXI,defendXI,tactics) {
  const dir=state.possession==='home'?1:-1;
  const defenders=outfield(defendXI);
  const nearest=defenders.map(d=>distance(p,d)).sort((a,b)=>a-b)[0]??30;
  const forward=dir*(p.x-p.baseX);
  const rand=seededRand(hashId(p.id)+state.tick*31)();
  const target=roleSpaceTarget(p,state,true);
  // All requested run types: behind, cut-inside, overlap and late midfield runs.
  if (p.pos==='ST') {
    target.x=clamp(p.x+dir*(5+effAttr(p,'pace')/18),8,92);
    target.y=clamp(p.y + (rand-.5)*5,8,92);
  } else if (p.pos==='AML'||p.pos==='AMR') {
    target.x=clamp(p.x+dir*(4+effAttr(p,'acceleration')/22),5,95);
    target.y=clamp(p.y+(p.pos==='AML'?2.5:-2.5),5,95);
  } else if (p.pos==='DR'||p.pos==='DL') {
    target.x=clamp(p.x+dir*(6+effAttr(p,'pace')/20),4,96);
    target.y=clamp(p.y+(p.pos==='DR'?-2:2),5,95);
  } else if (p.pos==='MC'||p.pos==='DM'||p.pos==='AMC') {
    target.x=clamp(p.x+dir*(2.5+effAttr(p,'offBall')/30),5,95);
    target.y=clamp(p.y+(rand-.5)*3,8,92);
  }
  // If defenders are close, prefer a diagonal space away from the nearest marker.
  if (nearest<11) target.y=clamp(target.y+(p.y<50?-4:4),4,96);
  return target;
}

function scorePass(carrier,receiver,defendXI,state,tactics) {
  const dir=state.possession==='home'?1:-1;
  const forward=dir*(receiver.x-carrier.x);
  const d=distance(carrier,receiver);
  const mid={x:(carrier.x+receiver.x)/2,y:(carrier.y+receiver.y)/2};
  const pressure=pressureAt(receiver,defendXI);
  const cell=state.spatial?.grid?.[gridIndex(receiver.x,receiver.y)];
  const space=100-clamp((cell?.[state.possession==='home'?'pressureHome':'pressureAway']||0)*24,0,70);
  const lane=100-clamp(pressureAt(mid,defendXI)*4,0,70);
  const throughBonus=forward>7 && receiver.offBallAction==='run' ? 10 : 0;
  return effAttr(carrier,'passing')*.26+effAttr(carrier,'vision')*.20+effAttr(carrier,'decisions')*.12+
    effAttr(receiver,'offBall')*.13+space*.14+lane*.08+forward*.65-throughBonus*-1-Math.min(35,d*.30)+throughBonus+
    ((tactics?.tempo||55)-50)*.10;
}

function chooseReceiver(carrier,attackXI,defendXI,state,tactics) {
  return outfield(attackXI).filter(p=>p.id!==carrier.id)
    .map(p=>({p,score:scorePass(carrier,p,defendXI,state,tactics)}))
    .sort((a,b)=>b.score-a.score)[0]?.p;
}

function selectDefender(defendXI,target,state) {
  return outfield(defendXI).map(p=>{
    const d=distance(p,target);
    const cell=state.spatial?.grid?.[gridIndex(target.x,target.y)];
    const tacticalPressure=(cell?.[state.possession==='home'?'pressureAway':'pressureHome']||0);
    const score=effAttr(p,'tackling')*.30+effAttr(p,'anticipation')*.22+effAttr(p,'positioning')*.18+
      effAttr(p,'pace')*.10+effAttr(p,'aggression')*.08+effAttr(p,'decisions')*.07+
      tacticalPressure*2.2-d*.85;
    return {p,score};
  }).sort((a,b)=>b.score-a.score)[0]?.p;
}

function pointToGoalGeometry(attacker, state) {
  const attackingHome = state.possession === 'home';
  const goalX = attackingHome ? 100 : 0;
  const dxPct = Math.abs(goalX - attacker.x);
  const dyPct = Math.abs(50 - attacker.y);
  const distanceM = Math.max(5, dxPct * 1.05);
  const lateralM = dyPct * 0.68;
  const angleFactor = clamp(1 - lateralM / 26, 0.35, 1);
  return { goalX, distanceM, angleFactor };
}

function resolveShot(attacker, gk, defenders, state, tactics) {
  const { goalX, distanceM, angleFactor } = pointToGoalGeometry(attacker, state);
  const nearby = defenders
    .filter(p => p.pos !== 'GK')
    .map(p => distance(p, attacker))
    .filter(d => d < 15);
  const pressure = nearby.reduce((s, d) => s + clamp(1 - d / 15, 0, 1), 0);
  const finishing = effAttr(attacker, 'finishing');
  const composure = effAttr(attacker, 'composure');
  const technique = effAttr(attacker, 'technique');
  const decision = effAttr(attacker, 'decisions');

  // xG is deliberately bounded: long/pressured shots are normally low value.
  let xg = 0.34 * Math.exp(-distanceM / 20) * angleFactor;
  xg *= clamp(1 - pressure * 0.17, 0.48, 1);
  xg *= clamp(0.78 + finishing / 260 + composure / 420, 0.95, 1.45);
  xg *= clamp(0.92 + technique / 500 + decision / 650, 0.95, 1.18);
  xg *= 1 + (MENTALITY_ATTACK[tactics?.mentality] || 0) * 0.035;
  xg = clamp(xg, 0.015, 0.42);

  // Goalkeeper quality turns a raw chance into a realistic outcome.
  const keeperSkill = gk
    ? (effAttr(gk, 'positioning') * 0.28 +
       effAttr(gk, 'anticipation') * 0.25 +
       effAttr(gk, 'composure') * 0.12 +
       effAttr(gk, 'decisions') * 0.12 +
       effAttr(gk, 'strength') * 0.06)
    : 60;
  const saveProbability = clamp(0.48 - xg * 0.62 + (keeperSkill - 60) * 0.0022, 0.14, 0.60);
  const goalProbability = clamp(xg * (1 - saveProbability * 0.42), 0.008, 0.34);
  const roll = Math.random();

  if (roll < goalProbability) {
    return { goal: true, xg, text: `${attacker.name} gets the shot away... GOAL!` };
  }
  if (roll < goalProbability + saveProbability * (1 - goalProbability)) {
    return { goal: false, xg, text: `${attacker.name} shoots — the goalkeeper makes the save!` };
  }
  if (Math.random() < 0.35 + pressure * 0.03) {
    return { goal: false, xg, text: `${attacker.name}'s shot is blocked under pressure.` };
  }
  return { goal: false, xg, text: `${attacker.name}'s effort goes wide.` };
}

function setBallTarget(state,x,y,ownerId=null) {
  state.ballTargetX=clamp(x,1,99); state.ballTargetY=clamp(y,2,98); state.ballOwnerId=ownerId;
}

function physicsStep(state) {
  // Ball interpolation is independent of player rendering.
  const dx=state.ballTargetX-state.ballX, dy=state.ballTargetY-state.ballY;
  const d=Math.hypot(dx,dy);
  if(d>0.15) {
    const actionType = state.currentAction?.type;
    const ballSpeed = state.ballOwnerId
      ? (actionType === 'carry' ? DRIBBLE_SPEED_PCT_PER_TICK : 1.25)
      : (actionType === 'shot' ? SHOT_SPEED_PCT_PER_TICK : PASS_SPEED_PCT_PER_TICK);
    const move=Math.min(d,ballSpeed);
    state.ballX+=dx/d*move; state.ballY+=dy/d*move;
    state.ballVX=dx/d*move; state.ballVY=dy/d*move;
  } else {
    state.ballX=state.ballTargetX; state.ballY=state.ballTargetY;
    state.ballVX*=.82; state.ballVY*=.82;
  }

  [state.homeXI,state.awayXI].forEach(xi=>{
    const side=xi===state.homeXI?'home':'away';
    const attacking=side===state.possession;
    const tactics=side==='home'?state.homeTactics:state.awayTactics;
    xi.forEach(p=>{
      const target=p.targetX==null?p.baseX:p.targetX;
      const ty=p.targetY==null?p.baseY:p.targetY;
      const maxSpeed=.28 + effAttr(p,'pace')*.0042;
      const dx=target-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;
      const desiredVx=dx/d*maxSpeed, desiredVy=dy/d*maxSpeed;
      const steering=.16 + effAttr(p,'acceleration')*.0028;
      p.vx += (desiredVx-p.vx)*steering;
      p.vy += (desiredVy-p.vy)*steering;
      p.vx*=.93; p.vy*=.93;
      p.x=clamp(p.x+p.vx,2,98); p.y=clamp(p.y+p.vy,2,98);
      p.fatigue=Math.min(100,p.fatigue + (Math.abs(p.vx)+Math.abs(p.vy))*.006);
      // Defensive pressure makes nearby defenders step toward the danger zone.
      if(!attacking && distance(p,{x:state.ballX,y:state.ballY})<20) {
        const pressureFactor=(tactics?.pressing?.intensity??55)/100;
        p.targetX += (state.ballX-p.targetX)*.04*pressureFactor;
        p.targetY += (state.ballY-p.targetY)*.04*pressureFactor;
      }
    });
  });
}

function decisionStep(state) {
  if (state.phase === 'goal_scored' || state.finished) return;

  const attackXI=state.possession==='home'?state.homeXI:state.awayXI;
  const defendXI=state.possession==='home'?state.awayXI:state.homeXI;
  const attackT=state.possession==='home'?state.homeTactics:state.awayTactics;
  const defendT=state.possession==='home'?state.awayTactics:state.homeTactics;
  const carrier = attackXI.find(p=>p.id===state.ballOwnerId) || chooseCarrier(attackXI,state);
  const pressure=pressureAt(carrier,defendXI)*((defendT?.pressing?.intensity??55)/55);
  const xGoal=state.possession==='home'?100:0;
  const goalDistance=Math.abs(xGoal-carrier.x);

  // Do not make a new football action until the previous one has completed.
  if (state.currentAction?.remainingTicks > 0) return;

  // Give the carrier control only when the ball has actually arrived.
  carrier.action='carrier';
  carrier.targetX=carrier.x + (xGoal>carrier.x?1:-1)*Math.min(2.2,effAttr(carrier,'pace')/45);
  carrier.targetY=carrier.y;
  setBallTarget(state,carrier.x,carrier.y,carrier.id);

  // Defensive line and attacking shape are recalculated every decision cycle.
  attackXI.forEach(p=>{
    if(p.id===carrier.id) return;
    const target=chooseRunTarget(p,state,attackXI,defendXI,attackT);
    const runUtility=effAttr(p,'offBall')*.34+effAttr(p,'pace')*.16+effAttr(p,'decisions')*.15+
      (goalDistance<35?12:0)-pressure*.18;
    p.offBallAction = runUtility>48 ? 'run' : 'support';
    p.action = p.offBallAction;
    p.targetX=target.x; p.targetY=target.y;
  });

  const dangerous=outfield(attackXI).map(p=>({p,d:distance(p,{x:state.ballX,y:state.ballY})}))
    .sort((a,b)=>a.d-b.d).slice(0,3);
  defendXI.forEach((p,i)=>{
    if(p.pos==='GK'){p.targetX=p.baseX;p.targetY=p.baseY;return;}
    const nearestAtt=outfield(attackXI).map(a=>({a,d:distance(p,a)})).sort((a,b)=>a.d-b.d)[0];
    const pressLimit = Math.max(2, Math.round((defendT?.pressing?.intensity??55)/28));
    const canPress=i<pressLimit || distance(p,{x:state.ballX,y:state.ballY})<13;
    if(canPress && nearestAtt && (defendT?.pressing?.intensity??55)>45) {
      p.action='press';
      p.targetX=clamp(state.ballX + (state.possession==='home'?-1.8:1.8),3,97);
      p.targetY=state.ballY;
    } else {
      p.action='cover';
      const shape=roleSpaceTarget(p,state,false);
      p.targetX=shape.x; p.targetY=shape.y;
      if(nearestAtt && distance(nearestAtt.a,p)<10) {
        p.targetX += (nearestAtt.a.x-p.targetX)*.25;
        p.targetY += (nearestAtt.a.y-p.targetY)*.25;
      }
    }
  });

  const inFinalThird=state.possession==='home'?carrier.x>68:carrier.x<32;
  const shootingRole=['ST','AML','AMR','AMC'].includes(carrier.pos);
  const shotGeometry=pointToGoalGeometry(carrier,state);
  const shootingUtility=shootingRole
    ? effAttr(carrier,'finishing')*.25+effAttr(carrier,'composure')*.12+effAttr(carrier,'decisions')*.10+
      (100-goalDistance)*.24-pressure*.75
    : -999;

  const receiver=chooseReceiver(carrier,attackXI,defendXI,state,attackT);
  const passUtility=receiver?scorePass(carrier,receiver,defendXI,state,attackT):-999;
  const runReceiver=receiver && receiver.offBallAction==='run';
  const passThreshold=passUtility + effAttr(carrier,'vision')*.08 - pressure*.55;

  // A shot must be in a credible scoring area and must beat the passing option.
  if(inFinalThird && shootingUtility>58 && shootingUtility>passThreshold+8 && shotGeometry.distanceM<38) {
    carrier.action='shoot';
    state.phase='attack';
    const travel = Math.max(2, Math.round(Math.abs(xGoal-carrier.x)/SHOT_SPEED_PCT_PER_TICK));
    state.currentAction={type:'shot',playerId:carrier.id,remainingTicks:travel+1};
    setBallTarget(state,xGoal,clamp(carrier.y+(Math.random()-.5)*3,5,95),null);
    return;
  }

  if(receiver && passThreshold>48) {
    const through=runReceiver && Math.abs((state.possession==='home'?receiver.x-carrier.x:carrier.x-receiver.x))>5;
    carrier.action=through?'through-pass':'pass';
    state.phase=through?'transition':'build-up';
    const lead=through ? 3.8+effAttr(receiver,'pace')/35 : 1.2;
    const dir=state.possession==='home'?1:-1;
    const tx=clamp(receiver.x+dir*lead,3,97);
    const distanceToTarget=distance(carrier,{x:tx,y:receiver.y});
    const travelTicks=Math.max(2,Math.ceil(distanceToTarget/PASS_SPEED_PCT_PER_TICK));
    state.currentAction={type:through?'through-pass':'pass',playerId:carrier.id,targetId:receiver.id,
      remainingTicks:travelTicks};
    // Ball is released: it now has to physically travel through space.
    setBallTarget(state,tx,receiver.y,null);
    carrier.targetX=carrier.x; carrier.targetY=carrier.y;
    return;
  }

  carrier.action='carry';
  state.phase='transition';
  const dir=state.possession==='home'?1:-1;
  carrier.targetX=clamp(carrier.x+dir*(2.5+effAttr(carrier,'dribbling')/55),3,97);
  carrier.targetY=clamp(carrier.y+(Math.random()-.5)*2.5,4,96);
  const carryTicks=Math.max(2,Math.ceil(distance(carrier,{x:carrier.targetX,y:carrier.targetY})/DRIBBLE_SPEED_PCT_PER_TICK));
  state.currentAction={type:'carry',playerId:carrier.id,remainingTicks:carryTicks};
  setBallTarget(state,carrier.targetX,carrier.targetY,carrier.id);
}

function pointSegmentDistance(point, a, b) {
  const abx=b.x-a.x, aby=b.y-a.y;
  const len2=abx*abx+aby*aby;
  if(len2===0) return distance(point,a);
  const t=clamp(((point.x-a.x)*abx+(point.y-a.y)*aby)/len2,0,1);
  return Math.hypot(point.x-(a.x+t*abx),point.y-(a.y+t*aby));
}

function resetAfterGoal(state) {
  state.homeXI.forEach(p=>{p.x=p.baseX;p.y=p.baseY;p.vx=0;p.vy=0;p.targetX=p.baseX;p.targetY=p.baseY;p.action='shape';});
  state.awayXI.forEach(p=>{p.x=p.baseX;p.y=p.baseY;p.vx=0;p.vy=0;p.targetX=p.baseX;p.targetY=p.baseY;p.action='shape';});
  state.ballX=50; state.ballY=50; state.ballTargetX=50; state.ballTargetY=50;
  state.ballVX=0; state.ballVY=0; state.ballOwnerId=null;
  // Team that conceded restarts from the centre.
  state.possession=state.lastGoalTeam==='home'?'away':'home';
  state.currentAction=null;
  state.possessionChain=0;
  state.phase='kickoff';
  state.postGoalTicks=0;
  log(state,`${state.possession==='home'?state.homeName:state.awayName} restart from the centre.`,'info');
}

function collisionAndEventStep(state) {
  if(state.phase==='goal_scored') {
    state.postGoalTicks=(state.postGoalTicks||0)+1;
    if(state.postGoalTicks * FIXED_GAME_SECONDS >= GOAL_PAUSE_GAME_SECONDS) resetAfterGoal(state);
    return;
  }

  const attackXI=state.possession==='home'?state.homeXI:state.awayXI;
  const defendXI=state.possession==='home'?state.awayXI:state.homeXI;
  const attackT=state.possession==='home'?state.homeTactics:state.awayTactics;
  const defendT=state.possession==='home'?state.awayTactics:state.homeTactics;
  const carrier=attackXI.find(p=>p.id===state.ballOwnerId) || chooseCarrier(attackXI,state);

  // Count down an action only after physics has had a chance to execute it.
  if(state.currentAction?.remainingTicks>0) state.currentAction.remainingTicks--;

  // Resolve a pass only when the ball has physically arrived.
  if(state.currentAction && ['pass','through-pass'].includes(state.currentAction.type) &&
     !state.ballOwnerId) {
    const receiver=attackXI.find(p=>p.id===state.currentAction.targetId);
    if(receiver && distance(receiver,{x:state.ballX,y:state.ballY})<4.5) {
      receiver.x=state.ballX; receiver.y=state.ballY;
      state.ballOwnerId=receiver.id;
      state.currentAction.remainingTicks=0;
      log(state,`${state.currentAction.type==='through-pass'?'Through ball':'Pass'} reaches ${receiver.name}.`);
      state.possessionChain++;
    }
  }

  // Interception checks the actual flight path, not just the final destination.
  if(state.currentAction && ['pass','through-pass'].includes(state.currentAction.type) && !state.ballOwnerId) {
    const from={x:state.ballX-state.ballVX,y:state.ballY-state.ballVY};
    const to={x:state.ballX,y:state.ballY};
    const candidates=outfield(defendXI).map(d=>{
      const pathDist=pointSegmentDistance(d,from,to);
      const anticipation=effAttr(d,'anticipation');
      const positioning=effAttr(d,'positioning');
      const tackling=effAttr(d,'tackling');
      const radius=1.2 + anticipation/28 + positioning/65;
      const chance=clamp((anticipation*.0035+positioning*.0018+tackling*.0012) *
        (1 + (defendT?.pressing?.intensity??55)/160),0.015,0.32);
      return {d,pathDist,radius,chance};
    }).filter(o=>o.pathDist<o.radius).sort((a,b)=>b.chance-a.chance);
    const interceptor=candidates.find(o=>Math.random()<o.chance)?.d;
    if(interceptor) {
      log(state,`${interceptor.name} reads the pass and intercepts.`,'turnover');
      state.possession=state.possession==='home'?'away':'home';
      state.ballOwnerId=interceptor.id;
      state.ballX=interceptor.x; state.ballY=interceptor.y;
      state.ballTargetX=interceptor.x; state.ballTargetY=interceptor.y;
      state.currentAction=null; state.possessionChain=0;
      return;
    }
  }

  // Physical pressure/tackling around the current carrier.
  if(state.ballOwnerId && carrier) {
    const defenders=nearestDefenders(carrier,defendXI,3);
    const close=defenders[0]?.d;
    if(close!=null && close<4.6) {
      const tackler=selectDefender(defendXI,carrier,state);
      const tackleUtility=effAttr(tackler,'tackling')*.42+effAttr(tackler,'anticipation')*.22+
        effAttr(tackler,'aggression')*.10+effAttr(tackler,'decisions')*.12+
        (defendT?.pressing?.intensity??55)*.10-distance(tackler,carrier)*2.4;
      const controlUtility=effAttr(carrier,'technique')*.25+effAttr(carrier,'dribbling')*.28+
        effAttr(carrier,'strength')*.12+effAttr(carrier,'decisions')*.18+effAttr(carrier,'pace')*.08;
      const duelChance=clamp(0.10+(tackleUtility-controlUtility)*.008,0.05,0.42);
      if(Math.random()<duelChance) {
        log(state,`${tackler.name} wins the duel with ${carrier.name}.`,'turnover');
        state.possession=state.possession==='home'?'away':'home';
        state.ballOwnerId=tackler.id;
        state.ballX=tackler.x; state.ballY=tackler.y;
        state.ballTargetX=tackler.x; state.ballTargetY=tackler.y;
        state.currentAction=null; state.possessionChain=0;
        return;
      }
    }
  }

  if(state.currentAction?.type==='shot') {
    const shotPlayer=attackXI.find(p=>p.id===state.currentAction.playerId);
    if(shotPlayer && state.currentAction.remainingTicks<=0) {
      const gk=defendXI.find(p=>p.pos==='GK');
      const outcome=resolveShot(shotPlayer,gk,defendXI,state,attackT);
      log(state,`${outcome.text} (xG ${(outcome.xg||0).toFixed(2)})`,outcome.goal?'goal':'chance');
      if(outcome.goal) {
        state.score[state.possession]++;
        state.lastEventPlayer=shotPlayer.id;
        state.lastGoalTeam=state.possession;
        state.phase='goal_scored';
        state.postGoalTicks=0;
        state.ballOwnerId=null;
        state.ballX=state.possession==='home'?100:0;
        state.ballY=clamp(shotPlayer.y,10,90);
        state.ballTargetX=state.ballX; state.ballTargetY=state.ballY;
        state.currentAction=null;
        state.possessionChain=0;
        return;
      }
      // Save/miss: goalkeeper gathers or the ball goes loose, then possession changes.
      state.possession=state.possession==='home'?'away':'home';
      state.ballOwnerId=gk?.id||null;
      state.ballX=gk?.x ?? (state.possession==='home'?8:92);
      state.ballY=gk?.y ?? 50;
      state.ballTargetX=state.ballX; state.ballTargetY=state.ballY;
      state.currentAction=null; state.possessionChain=0;
      return;
    }
  }

  // If an action completed without an explicit receiver, let the next decision
  // choose the best football action rather than stacking instantaneous actions.
  if(state.currentAction && state.currentAction.remainingTicks<=0 &&
     !state.ballOwnerId && state.currentAction.type!=='shot') {
    state.currentAction=null;
    state.possessionChain=0;
  }

  if(state.ballX<=1 || state.ballX>=99 || state.ballY<=1 || state.ballY>=99) {
    log(state,'The ball goes out of play.','info');
    state.possession=state.possession==='home'?'away':'home';
    state.ballX=50; state.ballY=50; state.ballTargetX=50; state.ballTargetY=50;
    state.ballOwnerId=null; state.currentAction=null; state.possessionChain=0;
    state.phase='kickoff';
  }
}

function maybeTriggerDecision(state) {
  if(state.pendingDecision) return;
  const diff=state.score.home-state.score.away;
  const minute=state.minute;
  if(minute>=55 && diff<0 && !state.__homeChasing){
    state.__homeChasing=true;
    state.homeTactics={...state.homeTactics,mentality:'Attacking',tempo:Math.min(82,(state.homeTactics.tempo||55)+12),
      pressing:{intensity:Math.min(90,(state.homeTactics.pressing?.intensity||55)+15)}};
    log(state,`${state.homeName} increase the tempo and press higher as they chase the game.`,'decision');
  }
  if(minute>=55 && diff>0 && !state.__awayChasing){
    state.__awayChasing=true;
    state.awayTactics={...state.awayTactics,mentality:'Attacking',tempo:Math.min(82,(state.awayTactics.tempo||55)+12),
      pressing:{intensity:Math.min(90,(state.awayTactics.pressing?.intensity||55)+15)}};
    log(state,`${state.awayName} increase the tempo and press higher as they chase the game.`,'decision');
  }
  if(minute>=72 && diff>0 && !state.__homeProtecting){
    state.__homeProtecting=true;
    state.homeTactics={...state.homeTactics,mentality:'Positive',tempo:Math.min(78,state.homeTactics.tempo||55),
      pressing:{intensity:Math.min(88,(state.homeTactics.pressing?.intensity||55)+8)}};
    log(state,`${state.homeName} protect the lead with a more controlled approach.`,'decision');
  }
  if(minute>=72 && diff<0 && !state.__awayProtecting){
    state.__awayProtecting=true;
    state.awayTactics={...state.awayTactics,mentality:'Positive',tempo:Math.min(78,state.awayTactics.tempo||55),
      pressing:{intensity:Math.min(88,(state.awayTactics.pressing?.intensity||55)+8)}};
    log(state,`${state.awayName} push more players forward.`,'decision');
  }
  if(minute>=80 && diff<0 && !state.__awayAllIn){
    state.__awayAllIn=true;
    state.awayTactics={...state.awayTactics,mentality:'Very Attacking',tempo:88,pressing:{intensity:92}};
    log(state,`${state.awayName} go Very Attacking for the final stages.`,'decision');
  }
  if(minute>=80 && diff>0 && !state.__homeAllIn){
    state.__homeAllIn=true;
    state.homeTactics={...state.homeTactics,mentality:'Very Defensive',tempo:45,pressing:{intensity:72}};
    log(state,`${state.homeName} drop deeper to defend the lead.`,'decision');
  }
}

export function resolveDecision(state,optionKey) { state.pendingDecision=null; return state; }

// One and only one fixed simulation tick. The optional interval parameter is
// retained for API compatibility but is no longer tied to rendering.
export function stepMatch(state, decisionInterval=7) {
  if(state.finished || state.pendingDecision) return state;

  state.tick += 1;
  state.phaseTick += 1;
  state.second += FIXED_GAME_SECONDS;
  if(state.second>=60){ state.second-=60; state.minute += 1; }

  // Fixed 50 ms simulation loop: perception -> decision -> physics -> collision.
  perceive(state);
  if(state.tick % Math.max(1,decisionInterval) === 0 || !state.currentAction) decisionStep(state);
  physicsStep(state);
  perceive(state);
  collisionAndEventStep(state);
  maybeTriggerDecision(state);

  if(state.minute>=90) {
    state.finished=true;
    log(state,`Full-time: ${state.homeName} ${state.score.home} - ${state.score.away} ${state.awayName}.`,'info');
  }
  return {...state};
}

export function simulateInstant(initialState) {
  let s={...initialState}, guard=0;
  while(!s.finished && guard<11000){ s=stepMatch(s,7); guard++; }
  return s;
}
