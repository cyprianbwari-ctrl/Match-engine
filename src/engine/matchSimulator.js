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
import { buildTacticalModel, styleEffect, readinessScore, aiRotationNeed } from './fmMatchLabAdapter.js';

export const FIXED_DT_MS = 50;
export const FIXED_GAME_SECONDS = 0.5;
export const GRID_COLS = 18;
export const GRID_ROWS = 12;

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
      tacticalFamiliarity: p.tacticalFamiliarity ?? 70, condition: p.condition ?? p.fit ?? 90,
      readiness: readinessScore(p), rotationNeed: aiRotationNeed(p, 0, 0),
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
  const model = buildTacticalModel(tactics);
  const intensity = model.pressing.intensity / 55;
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
    pendingDecision:null, finished:false, lastEventPlayer:null,
    spatial:null, currentAction:null, possessionChain:0,
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
  const model = buildTacticalModel(p.teamSide==='home' ? state.homeTactics : state.awayTactics);
  const fx = styleEffect(p.teamSide==='home' ? state.homeTactics : state.awayTactics);

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
  if (isWide) ty += clamp((state.ballY-ty)*(.10 + fx.width*.18),-7,7);
  else ty += clamp((state.ballY-ty)*(.07 + fx.width*.08),-4,4);
  // Tactical depth controls how aggressively the shape steps toward the ball.
  if (attacking) tx += dir * ((50-model.defensiveLine) * 0.018);
  return {x:clamp(tx,3,97),y:clamp(ty,4,96)};
}

function chooseRunTarget(p,state,attackXI,defendXI,tactics) {
  const dir=state.possession==='home'?1:-1;
  const fx=styleEffect(tactics);
  const defenders=outfield(defendXI);
  const nearest=defenders.map(d=>distance(p,d)).sort((a,b)=>a-b)[0]??30;
  const forward=dir*(p.x-p.baseX);
  const rand=seededRand(hashId(p.id)+state.tick*31)();
  const target=roleSpaceTarget(p,state,true);
  // All requested run types: behind, cut-inside, overlap and late midfield runs.
  if (p.pos==='ST') {
    target.x=clamp(p.x+dir*((4+effAttr(p,'pace')/18)*(0.75+fx.runFrequency)),8,92);
    target.y=clamp(p.y + (rand-.5)*5,8,92);
  } else if (p.pos==='AML'||p.pos==='AMR') {
    target.x=clamp(p.x+dir*((3+effAttr(p,'acceleration')/22)*(0.8+fx.runFrequency*.7)),5,95);
    target.y=clamp(p.y+(p.pos==='AML'?2.5:-2.5),5,95);
  } else if (p.pos==='DR'||p.pos==='DL') {
    target.x=clamp(p.x+dir*((5+effAttr(p,'pace')/20)*(0.8+fx.overlapFrequency*.8)),4,96);
    target.y=clamp(p.y+(p.pos==='DR'?-2:2),5,95);
  } else if (p.pos==='MC'||p.pos==='DM'||p.pos==='AMC') {
    target.x=clamp(p.x+dir*((2.2+effAttr(p,'offBall')/30)*(0.8+fx.runFrequency*.5)),5,95);
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
  const fx=styleEffect(tactics);
  const throughBonus=forward>7 && receiver.offBallAction==='run' ? 10 + fx.forwardPassing*8 : 0;
  const distanceFit=fx.shortPassing*(1-Math.min(1,d/35))*8 + fx.forwardPassing*Math.min(1,Math.max(0,forward)/30)*12;
  return effAttr(carrier,'passing')*.26+effAttr(carrier,'vision')*.20+effAttr(carrier,'decisions')*.12+
    effAttr(receiver,'offBall')*.13+space*.14+lane*.08+forward*(.35+fx.forwardPassing*.45)-Math.min(35,d*.30)+throughBonus+distanceFit+
    ((fx.tempo*100)-50)*.10;
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

function resolveShot(attacker,gk,defenders,state,tactics) {
  const nearest=defenders.filter(p=>p.pos!=='GK').sort((a,b)=>distance(a,attacker)-distance(b,attacker)).slice(0,3);
  const pressure=nearest.reduce((s,p)=>s+clamp(18-distance(p,attacker),0,18),0)/Math.max(1,nearest.length);
  const xDist=state.possession==='home'?100-attacker.x:attacker.x;
  const chance=effAttr(attacker,'finishing')*.34+effAttr(attacker,'composure')*.18+effAttr(attacker,'technique')*.12+
    effAttr(attacker,'decisions')*.08+(100-clamp(xDist,0,100))*.28-pressure*.72+
    (MENTALITY_ATTACK[tactics?.mentality]||0)*3;
  const save=gk?(effAttr(gk,'positioning')*.25+effAttr(gk,'anticipation')*.25+effAttr(gk,'composure')*.10+effAttr(gk,'decisions')*.10):62;
  const roll=Math.random()*45;
  if(chance+roll-save>11) return {goal:true,text:`${attacker.name} finds the finish... GOAL!`};
  if(chance+roll-save>-7) return {goal:false,text:`${attacker.name} gets the shot away, but the goalkeeper saves it!`};
  return {goal:false,text:`${attacker.name}'s effort is blocked or misses under pressure.`};
}

function setBallTarget(state,x,y,ownerId=null) {
  state.ballTargetX=clamp(x,1,99); state.ballTargetY=clamp(y,2,98); state.ballOwnerId=ownerId;
}

function physicsStep(state) {
  // Ball interpolation is independent of player rendering.
  const dx=state.ballTargetX-state.ballX, dy=state.ballTargetY-state.ballY;
  const d=Math.hypot(dx,dy);
  if(d>0.15) {
    const ballSpeed=state.ballOwnerId ? 1.9 : 5.8;
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
  const attackXI=state.possession==='home'?state.homeXI:state.awayXI;
  const defendXI=state.possession==='home'?state.awayXI:state.homeXI;
  const attackT=state.possession==='home'?state.homeTactics:state.awayTactics;
  const defendT=state.possession==='home'?state.awayTactics:state.homeTactics;
  const attackName=state.possession==='home'?state.homeName:state.awayName;
  const carrier=chooseCarrier(attackXI,state);
  const pressure=pressureAt(carrier,defendXI)*(buildTacticalModel(defendT).pressing.intensity/55);
  const xGoal=state.possession==='home'?100:0;
  const goalDistance=Math.abs(xGoal-carrier.x);

  // Give the carrier ownership so the ball follows him between decision ticks.
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

  // Defenders use grid pressure + attributes to select press, cover and mark roles.
  const dangerous=outfield(attackXI).map(p=>({p,d:distance(p,{x:state.ballX,y:state.ballY})}))
    .sort((a,b)=>a.d-b.d).slice(0,3);
  defendXI.forEach((p,i)=>{
    if(p.pos==='GK'){p.targetX=p.baseX;p.targetY=p.baseY;return;}
    const nearestAtt=outfield(attackXI).map(a=>({a,d:distance(p,a)})).sort((a,b)=>a.d-b.d)[0];
    const canPress=i<3 || distance(p,{x:state.ballX,y:state.ballY})<13;
    if(canPress && nearestAtt && buildTacticalModel(defendT).pressing.intensity>50) {
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

  // Utility decision: shot > through ball > normal pass > carry, based on
  // attributes, space and tactical context.
  const inFinalThird=state.possession==='home'?carrier.x>68:carrier.x<32;
  const shootingRole=['ST','AML','AMR','AMC'].includes(carrier.pos);
  const shootingUtility=shootingRole
    ? effAttr(carrier,'finishing')*.34+effAttr(carrier,'composure')*.16+effAttr(carrier,'decisions')*.13+
      (100-goalDistance)*.42-pressure*.65
    : -999;

  const receiver=chooseReceiver(carrier,attackXI,defendXI,state,attackT);
  const passUtility=receiver?scorePass(carrier,receiver,defendXI,state,attackT):-999;
  const runReceiver=receiver && receiver.offBallAction==='run';
  const passThreshold=passUtility + effAttr(carrier,'vision')*.08 - pressure*.55;

  if(inFinalThird && shootingUtility>54 && shootingUtility>passThreshold+5) {
    carrier.action='shoot';
    state.phase='attack';
    state.currentAction={type:'shot',playerId:carrier.id};
    setBallTarget(state,xGoal,clamp(carrier.y+(Math.random()-.5)*4,5,95),carrier.id);
    return;
  }

  if(receiver && passThreshold>48) {
    const through=runReceiver && Math.abs((state.possession==='home'?receiver.x-carrier.x:carrier.x-receiver.x))>5;
    carrier.action=through?'through-pass':'pass';
    state.phase=through?'transition':'build-up';
    state.currentAction={type:through?'through-pass':'pass',playerId:carrier.id,targetId:receiver.id};
    const lead=through ? 3.8+effAttr(receiver,'pace')/35 : 1.2;
    const dir=state.possession==='home'?1:-1;
    const tx=clamp(receiver.x+dir*lead,3,97);
    setBallTarget(state,tx,receiver.y,receiver.id);
    return;
  }

  // Carry/dribble into the best available cell when passing is not worthwhile.
  carrier.action='carry';
  state.phase='transition';
  state.currentAction={type:'carry',playerId:carrier.id};
  const dir=state.possession==='home'?1:-1;
  carrier.targetX=clamp(carrier.x+dir*(2.5+effAttr(carrier,'dribbling')/55),3,97);
  carrier.targetY=clamp(carrier.y+(Math.random()-.5)*2.5,4,96);
  setBallTarget(state,carrier.targetX,carrier.targetY,carrier.id);
}

function collisionAndEventStep(state) {
  const attackXI=state.possession==='home'?state.homeXI:state.awayXI;
  const defendXI=state.possession==='home'?state.awayXI:state.homeXI;
  const attackT=state.possession==='home'?state.homeTactics:state.awayTactics;
  const defendT=state.possession==='home'?state.awayTactics:state.homeTactics;
  const carrier=attackXI.find(p=>p.id===state.ballOwnerId) || chooseCarrier(attackXI,state);
  const defenders=nearestDefenders(carrier,defendXI,3);

  // Ball has reached a receiver/carrier: resolve the action.
  if(state.currentAction && state.currentAction.targetId && state.ballOwnerId===state.currentAction.targetId &&
     distance(carrier,{x:state.ballX,y:state.ballY})<4) {
    log(state,`${state.currentAction.type==='through-pass'?'Through ball':'Pass'} reaches ${carrier.name}.`);
    state.possessionChain++;
    state.currentAction=null;
  }

  // Press/tackle/interception resolution.
  const close=defenders[0]?.d;
  if(close!=null && close<4.6 && state.currentAction?.type!=='shot') {
    const tackler=selectDefender(defendXI,carrier,state);
    const tackleUtility=effAttr(tackler,'tackling')*.42+effAttr(tackler,'anticipation')*.22+effAttr(tackler,'aggression')*.10+
      effAttr(tackler,'decisions')*.12+buildTacticalModel(defendT).pressing.intensity*.10-distance(tackler,carrier)*2.4;
    const controlUtility=effAttr(carrier,'technique')*.25+effAttr(carrier,'dribbling')*.28+effAttr(carrier,'strength')*.12+
      effAttr(carrier,'decisions')*.18+effAttr(carrier,'pace')*.08;
    if(Math.random()*100 < clamp(34+(tackleUtility-controlUtility)*.48,8,82)) {
      log(state,`${tackler.name} wins the duel with ${carrier.name}.`,'turnover');
      state.possession=state.possession==='home'?'away':'home';
      state.ballOwnerId=tackler.id; state.ballX=tackler.x; state.ballY=tackler.y;
      state.ballTargetX=tackler.x; state.ballTargetY=tackler.y;
      state.currentAction=null; state.possessionChain=0;
      return;
    }
  }

  if(state.currentAction?.type==='shot' && state.ballOwnerId===carrier.id) {
    const gk=defendXI.find(p=>p.pos==='GK');
    const outcome=resolveShot(carrier,gk,defendXI,state,attackT);
    log(state,outcome.text,outcome.goal?'goal':'chance');
    if(outcome.goal) {
      state.score[state.possession]++;
      state.lastEventPlayer=carrier.id;
    }
    state.possession=state.possession==='home'?'away':'home';
    state.ballOwnerId=null;
    state.currentAction=null;
    state.ballX=state.possession==='home'?50:50; state.ballY=50;
    state.ballTargetX=50; state.ballTargetY=50;
    state.possessionChain=0;
    return;
  }

  // Interception while the ball is travelling through a spatially occupied cell.
  if(!state.ballOwnerId && state.currentAction?.targetId) {
    const idx=gridIndex(state.ballX,state.ballY);
    const cell=state.spatial?.grid?.[idx];
    const defendingInfluence=state.possession==='home'?cell?.away||0:cell?.home||0;
    const receiver=attackXI.find(p=>p.id===state.currentAction.targetId);
    const defender=selectDefender(defendXI,{x:state.ballX,y:state.ballY},state);
    const interceptionChance=clamp(.018*defendingInfluence + (defender?effAttr(defender,'anticipation')/1200:0),.02,.30);
    if(receiver && defender && Math.random()<interceptionChance) {
      log(state,`${defender.name} reads the pass and intercepts.`,'turnover');
      state.possession=state.possession==='home'?'away':'home';
      state.ballOwnerId=defender.id;
      state.ballX=defender.x; state.ballY=defender.y;
      state.ballTargetX=defender.x; state.ballTargetY=defender.y;
      state.currentAction=null; state.possessionChain=0;
    }
  }

  // Keep the ball from becoming stuck.
  if(state.ballX<=1 || state.ballX>=99 || state.ballY<=1 || state.ballY>=99) {
    log(state,'The ball goes out of play.','info');
    state.possession=state.possession==='home'?'away':'home';
    state.ballX=50; state.ballY=50; state.ballTargetX=50; state.ballTargetY=50;
    state.ballOwnerId=null; state.currentAction=null; state.possessionChain=0;
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
