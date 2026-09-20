// FAMILY 26 #10 — negotiation model. No single "highest bid wins" shortcut.
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const num=v=>Number(String(v??0).replace(/[^0-9.]/g,''))*(String(v??'').toUpperCase().includes('M')?1e6:String(v??'').toLowerCase().includes('K')?1e3:1);
export function playerMoveScore(player={}, offer={}, buyer={}) {
  const fee=num(offer.fee), asking=num(player.asking||player.value), salary=num(offer.wage||0);
  const feeScore=clamp(50 + ((fee/Math.max(1,asking))-1)*55);
  const playing=clamp(Number(offer.playingTime??buyer.playingTime??50));
  const role=clamp(Number(offer.roleScore??buyer.roleScore??50));
  const reputation=clamp(Number(offer.clubReputation??buyer.reputation??50));
  const competition=clamp(Number(offer.competition??buyer.competition??50));
  const preference=clamp(Number(player.preference??50));
  const salaryScore=salary>0?clamp(45+salary/Math.max(1,num(player.wage||1))*25):45;
  return Math.round(feeScore*.22+playing*.22+role*.16+reputation*.12+competition*.10+preference*.10+salaryScore*.08);
}
export function negotiate(player, offer, club) {
  const score=playerMoveScore(player,offer,club);
  const asking=num(player.asking||player.value), fee=num(offer.fee);
  if (fee>=asking) return {status:'Club Agreed', counter:fee, score};
  if (score>=70 && fee>=asking*.82) return {status:'Negotiating', counter:Math.round(asking*.96), score};
  if (score>=52 && fee>=asking*.68) return {status:'Negotiating', counter:Math.round(asking*.92), score};
  return {status:'Rejected', counter:asking, score};
}
