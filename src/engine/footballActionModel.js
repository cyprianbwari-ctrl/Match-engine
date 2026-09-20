// FAMILY 26 — football action resolution model v3
// Deterministic, player-specific football outcomes. The match engine owns time,
// possession and event sequencing; this module owns the quality of actions.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,d=50)=>Number.isFinite(Number(v))?Number(v):d;

export function actionWeights(player={}, tactics={}, context={}) {
  const v=player.vector51||player.attrs||{};
  const pressure=num(context.pressure,0);
  const fatigue=clamp(num(player.fatigue,0),0,100);
  const mentality={ 'Very Defensive':-16, Defensive:-8, Balanced:0, Positive:6, Attacking:12, 'Very Attacking':18 }[tactics.mentality]??0;
  const tempo=(num(tactics.tempo)-50)*.18;
  const direct=(num(tactics.directness)-50)*.16;
  const press=(num(tactics.pressing?.intensity,60)-50)*.2;
  const fatiguePenalty=fatigue*.12;
  return {
    pass: num(v.passing)*.34+num(v.vision)*.24+num(v.decisions)*.22+num(v.technique)*.20+tempo-pressure*.55-fatiguePenalty*.25,
    carry: num(v.dribbling)*.34+num(v.firstTouch)*.22+num(v.agility)*.16+num(v.acceleration)*.12+num(v.flair)*.10+num(v.decisions)*.06-pressure*.25,
    progressive: num(v.vision)*.28+num(v.risk)*.20+num(v.passing)*.20+num(v.flair)*.12+num(v.decisions)*.20+direct,
    shoot: num(v.finishing)*.36+num(v.composure)*.20+num(v.decisions)*.18+num(v.technique)*.12+num(v.bigMatches)*.06+mentality,
    press: num(v.workRate)*.28+num(v.aggression)*.22+num(v.acceleration)*.16+num(v.stamina)*.18+num(v.teamwork)*.16+press-fatiguePenalty,
    defend: num(v.tackling)*.30+num(v.positioning)*.25+num(v.anticipation)*.22+num(v.marking)*.13+num(v.concentration)*.10-pressure*.15,
  };
}

export function passSuccess(player={}, tactics={}, distance=15, pressure=0, context={}) {
  const v=player.vector51||{};
  const bodyFactor = num(context.bodyPosition, 0); // -1 awkward, +1 ideal
  const base=num(v.passing)*.48+num(v.technique)*.20+num(v.decisions)*.14+num(v.composure)*.10+num(v.vision)*.08;
  const distancePenalty=Math.max(0,distance-8)*1.15;
  const pressurePenalty=pressure*.62;
  const directPenalty=Math.max(0,num(tactics.directness)-70)*.10;
  const bodyBonus=bodyFactor*4;
  return clamp(base-distancePenalty-pressurePenalty-directPenalty+bodyBonus,18,97);
}

export function firstTouchQuality(player={}, pressure=0, context={}) {
  const v=player.vector51||{};
  const speed=num(context.ballSpeed,4.5);
  const body=num(context.bodyPosition,0);
  const base=num(v.firstTouch)*.42+num(v.technique)*.20+num(v.composure)*.15+num(v.agility)*.10+num(v.decisions)*.08+num(v.balance)*.05;
  return clamp(base-pressure*.48-Math.max(0,speed-5)*2+body*3,8,97);
}

export function dribbleSuccess(player={}, defender={}, context={}) {
  const a=player.vector51||{}, d=defender.vector51||defender.attrs||{};
  const pressure=num(context.pressure,0);
  const attacking=num(a.dribbling)*.30+num(a.acceleration)*.18+num(a.agility)*.16+num(a.firstTouch)*.12+num(a.flair)*.10+num(a.pace)*.08+num(a.decisions)*.06;
  const defending=num(d.tackling)*.30+num(d.positioning)*.22+num(d.anticipation)*.18+num(d.marking)*.15+num(d.strength)*.15;
  return clamp(50+(attacking-defending)*.72-pressure*.30,8,92);
}

export function tackleOutcome(defender={}, carrier={}, context={}) {
  const d=defender.vector51||defender.attrs||{}, a=carrier.vector51||carrier.attrs||{};
  const pressure=num(context.pressure,0);
  const clean=clamp(34+(num(d.tackling)-num(a.dribbling))*.48+(num(d.positioning)-num(a.agility))*.18+num(d.anticipation)*.08-pressure*.18,5,82);
  const foul=clamp(4+(num(d.aggression)-55)*.08+Math.max(0,num(d.tackling)-75)*.03,1,15);
  return { clean, foul };
}

export function shotQuality(player={}, context={}) {
  const v=player.vector51||{};
  const distance=num(context.distance,20), angle=clamp(num(context.angle,0.7),0.1,1);
  const base=.012 + num(v.finishing)/4400 + num(v.technique)/7000 + num(v.composure)/10000 + num(v.decisions)/14000;
  const distanceFactor=Math.exp(-Math.max(0,distance-8)/22);
  const angleFactor=.32+.68*angle;
  const pressureFactor=1-clamp(num(context.pressure,0)/145,0,.68);
  const bodyFactor=.82+clamp(num(context.bodyPosition,0),-1,1)*.12;
  return clamp(base*distanceFactor*angleFactor*pressureFactor*bodyFactor,.004,.86);
}

export function goalkeeperSaveChance(gk={}, context={}) {
  const v=gk.vector51||{};
  const reaction=num(v.gkReflexes), positioning=num(v.gkPositioning), oneOnOne=num(v.gkOneOnOne);
  const handling=num(v.gkHandling), aerial=num(v.gkAerial);
  const shotQualityValue=num(context.shotQuality,.15);
  const angle=clamp(num(context.angle,.7),.15,1);
  return clamp((reaction*.28+positioning*.28+oneOnOne*.16+handling*.10+aerial*.06+num(v.composure)*.12)/100 - shotQualityValue*.42 + angle*.03,.05,.95);
}

export function reboundChance(context={}) {
  const shot=num(context.shotQuality,.2);
  const save=num(context.saveChance,.4);
  return clamp(.08+shot*.18+save*.20,.05,.42);
}
