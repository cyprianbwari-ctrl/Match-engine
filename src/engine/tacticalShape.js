/**
 * FAMILY 26 — deeper positional behaviour.
 * Coordinates are normalized to the engine's 0–100 pitch.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const ROLE_ANCHORS = {
  GK:[5,50],
  DL:[22,16], DC:[22,38], DM:[22,62], DR:[22,84],
  WBL:[31,10], WBR:[31,90],
  DMC:[31,50],
  MC:[45,50], MCL:[45,34], MCR:[45,66],
  AMC:[61,50], AML:[65,24], AMR:[65,76],
  LW:[68,18], RW:[68,82],
  ST:[82,50], CF:[78,50]
};

function normalizePos(pos="") {
  const p=String(pos).toUpperCase();
  if (p==="LB"||p==="DL") return "DL";
  if (p==="RB"||p==="DR") return "DR";
  if (p==="CB"||p==="DC") return "DC";
  if (p==="DM") return "DM";
  if (p==="LM"||p==="ML") return "MCL";
  if (p==="RM"||p==="MR") return "MCR";
  if (p==="AML"||p==="LW") return "AML";
  if (p==="AMR"||p==="RW") return "AMR";
  if (p==="AMC") return "AMC";
  if (p==="ST"||p==="CF") return "ST";
  return p;
}

export function tacticalRoleAnchor(player, formation, tactics={}) {
  const code=normalizePos(player?.pos || player?.position);
  const base=ROLE_ANCHORS[code] || [50,50];
  const width=clamp(Number(tactics.width ?? 50),0,100);
  const compact=clamp(Number(tactics.compactness ?? 55),0,100);
  const line=clamp(Number(tactics.defensiveLine ?? 55),0,100);
  const mentality=String(tactics.mentality || "Balanced");
  const attacking=["Positive","Attacking","Very Attacking"].includes(mentality);
  const defensive=["Defensive","Very Defensive"].includes(mentality);

  let x=base[0], y=50+(base[1]-50)*(0.55+width/100*0.8);

  // Defensive line changes the whole block, not just centre-backs.
  if (["DL","DC","DR","DM"].includes(code)) x += (line-55)*0.20;
  if (attacking && ["AML","AMR","ST","AMC"].includes(code)) x += 3;
  if (defensive && ["AML","AMR","ST","AMC"].includes(code)) x -= 5;

  // High compactness pulls vertical lanes toward the team's central spine.
  y = 50 + (y-50)*(1-compact/100*0.28);
  return {x:clamp(x,3,97), y:clamp(y,5,95)};
}

export function tacticalPressTrigger(player, ball, state, tactics={}) {
  const d=Math.hypot((player.x||0)-(ball.x||0),(player.y||0)-(ball.y||0));
  const intensity=clamp(Number(tactics?.pressing?.intensity ?? tactics?.pressing ?? 55),0,100);
  const role=normalizePos(player?.pos);
  const triggerDistance=5 + intensity*0.07 + (["ST","AML","AMR","AMC"].includes(role)?2:0);
  const opponentHasBall=state?.ballOwnerId && state?.ballOwnerId !== player.id;
  return opponentHasBall && d <= triggerDistance;
}

export function teamShapeTargets(xi, state, side) {
  const tactics=side==="home"?state.homeTactics:state.awayTactics;
  const ball={x:state.ballX,y:state.ballY};
  return xi.reduce((map,p)=>{
    const anchor=tacticalRoleAnchor(p,state.formationName,tactics);
    const dir=side==="home"?1:-1;
    const ballShift=clamp((ball.x-50)*0.10*dir,-6,6);
    const defend=state.possession!==side;
    const retreat=defend ? (100-Number(tactics?.defensiveLine ?? 55))*0.06 : 0;
    map[p.id]={x:clamp(anchor.x+ballShift-dir*retreat,3,97),y:clamp(anchor.y+(ball.y-50)*0.08,5,95)};
    return map;
  },{});
}
