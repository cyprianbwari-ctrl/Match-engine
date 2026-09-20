// FAMILY 26 tactical definitions — no player records live here.
export const roles = {
  GK:["GK","SK","BPK"], DR:["FB","WB","IWB"], DL:["FB","WB","IWB"],
  DC:["CD","BPD","NCB","STP","COV","LIB"], DM:["DM","A","HB","BWM","DLP"],
  MC:["CM","BBM","DLP","BWM","MEZ","RPM","REG","SV","AP"], AMC:["AP","SS","TREQ","ENG"],
  AML:["W","IW","IF","WP","WF"], AMR:["W","IW","IF","WP","WF"],
  ST:["AF","CF","DLF","F9","TF","PF","PCH","SS"]
};
export const duties = ["Defend","Support","Attack"];
export const POS_COMPAT = {
  GK:{GK:1}, DL:{DL:1,DR:.5,AML:.55}, DR:{DR:1,DL:.5,AMR:.55}, DC:{DC:1,DM:.5},
  DM:{DM:1,MC:.7,DC:.4}, MC:{MC:1,DM:.65,AMC:.55}, AMC:{AMC:1,MC:.5,AML:.45,AMR:.45,ST:.45},
  AML:{AML:1,AMR:.5,DL:.45,AMC:.5}, AMR:{AMR:1,AML:.5,DR:.45,AMC:.5}, ST:{ST:1,AMC:.45}
};
export function compat(playerPos, slotCode){ return playerPos===slotCode ? 1 : POS_COMPAT[playerPos]?.[slotCode] ?? .15; }
export function fitTier(score){ return score>=.9 ? "natural" : score>=.45 ? "playable" : "poor"; }
