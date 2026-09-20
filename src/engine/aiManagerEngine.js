// FAMILY 26 #9 — deterministic AI manager decision model.
// AI decisions are world simulation inputs; they never render the match.
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
export function evaluateManager(manager={}, context={}) {
  const scoreDiff=Number(context.scoreDiff||0), fatigue=Number(context.squadFatigue||0), form=Number(context.form||50);
  const risk=clamp((manager.riskTolerance??50) + scoreDiff*12 - fatigue*.25 + (form-50)*.08);
  const needResult=scoreDiff<0 ? 75 : scoreDiff>0 ? 25 : 50;
  const tacticalPressure=clamp((manager.intensity==='High'?70:manager.intensity==='Medium'?52:35) + needResult*.2);
  let action='Maintain Plan';
  if (scoreDiff<0 && risk>55) action='Increase Attacking Risk';
  else if (scoreDiff>0 && risk<45) action='Protect Lead';
  else if (fatigue>72) action='Rotate XI';
  else if (manager.intensity==='High') action='Press Higher';
  else if (manager.style==='Possession') action='Control Tempo';
  return { action, risk, tacticalPressure };
}

export function chooseTransferTargets(manager={}, players=[], budget=0) {
  const philosophy=manager.transferPhilosophy||'Balanced';
  const sorted=players.map(p=>{
    const positionFit = philosophy==='Youth' && Number(p.age)<23 ? 15 : philosophy==='Experience' && Number(p.age)>28 ? 12 : 0;
    const valueFit = Number(p.value||0)<=budget ? 12 : -18;
    const roleFit = p.position || p.pos ? 6 : 0;
    return {...p, aiScore:Number(p.rating||p.ovr||0)+positionFit+valueFit+roleFit};
  }).sort((a,b)=>b.aiScore-a.aiScore);
  return sorted.slice(0,5);
}
