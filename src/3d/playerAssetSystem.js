// FAMILY 26 — unified 3D player asset contract.
// The renderer can use procedural fallbacks today and real GLB/texture assets
// later without changing match-engine data structures.

export const ACTIONS = {
  idle:'idle', walk:'walk', jog:'jog', run:'run', sprint:'sprint', accelerate:'accelerate',
  decelerate:'decelerate', turn:'turn', stop:'stop', backpedal:'backpedal', sidestep:'sidestep',
  control:'control', pass:'pass', throughPass:'through-pass', cross:'cross', lob:'lob', shot:'shoot',
  volley:'volley', header:'header', dribble:'carry', shield:'shield', tackle:'tackle', slide:'slide',
  intercept:'intercept', block:'block', press:'press', save:'save', parry:'parry', claim:'claim',
  punch:'punch', distribute:'distribute', celebrate:'celebrate', miss:'miss', frustrated:'frustrated',
  injured:'injured', appeal:'appeal', card:'card', substitute:'substitute'
};

const CLUB_KITS = {
  'Newcastle': { home:'#000000', away:'#63b1e5', accent:'#ffffff', shorts:'#000000' },
  'West Ham': { home:'#7a263a', away:'#f5f5f5', accent:'#1bb1e7', shorts:'#1b1b2a' },
  'Liverpool': { home:'#c8102e', away:'#f5f5f5', accent:'#00a398', shorts:'#ffffff' },
  'Brighton': { home:'#0057b8', away:'#f5f5f5', accent:'#ffffff', shorts:'#0057b8' },
  'Arsenal': { home:'#d00000', away:'#ffffff', accent:'#0b1f41', shorts:'#ffffff' },
  'Man City': { home:'#6cabdd', away:'#ffffff', accent:'#ffffff', shorts:'#ffffff' },
};

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function hash(s){return String(s??'').split('').reduce((a,c)=>(a*31+c.charCodeAt(0))%1000003,17);}

export function getPlayerVisualProfile(player={}) {
  const id=player.id??player.uid??player.name;
  const h=hash(id);
  const height=Number(player.height)||180;
  const weight=Number(player.weight)||76;
  const skinTones=['#6f432d','#8c563b','#ad7050','#c98b69','#e0a77f','#f0c4a0'];
  const hair=['#17120f','#2a1c16','#4a3024','#6b4a35','#1d2430','#8b6a4b'];
  return {
    height:clamp(height,160,205), weight:clamp(weight,55,105),
    build:clamp(0.86+(weight-55)/250,0.86,1.08),
    skin:skinTones[h%skinTones.length], hair:hair[(h>>3)%hair.length],
    boots:(h%3===0?'#111827':h%3===1?'#f2f4f7':'#d6e3ff'),
    bodyType: weight>88?'strong':weight<68?'slim':'athletic',
    faceSeed:h%1000,
  };
}

export function getKitProfile(player={}) {
  const kit=CLUB_KITS[player.club] || {home:'#5b2b90',away:'#e9edf5',accent:'#a8ff3e',shorts:'#171b2d'};
  const away=player.teamSide==='away';
  const gk=player.pos==='GK'||player.role==='GK';
  if(gk) return { shirt:away?'#f08a24':'#20a86b', shorts:away?'#2a1c0e':'#082b18', accent:'#ffffff', goalkeeper:true };
  return {shirt:away?kit.away:kit.home, shorts:kit.shorts, accent:kit.accent, goalkeeper:false};
}

export function getLOD(distance=0, quality='auto') {
  if(quality==='low') return {segments:6, shadows:false, labels:false};
  if(distance<18) return {segments:14, shadows:true, labels:true};
  if(distance<42) return {segments:9, shadows:true, labels:false};
  return {segments:5, shadows:false, labels:false};
}

export function normalizeAction(action='idle', speed=0, velocity=0) {
  const a=String(action).toLowerCase();
  if(ACTIONS[a]) return ACTIONS[a];
  if(a.includes('through')) return ACTIONS.throughPass;
  if(a.includes('shot')) return ACTIONS.shot;
  if(a.includes('cross')) return ACTIONS.cross;
  if(a.includes('header')) return ACTIONS.header;
  if(a.includes('tackle')) return ACTIONS.tackle;
  if(a.includes('save')) return ACTIONS.save;
  if(a.includes('claim')) return ACTIONS.claim;
  if(a.includes('press')) return ACTIONS.press;
  if(speed>0.75) return ACTIONS.sprint;
  if(speed>0.25) return ACTIONS.run;
  return ACTIONS.idle;
}

export function buildPlayerAssetContract(player={}) {
  const visual=getPlayerVisualProfile(player);
  return {id:player.id??player.uid, visual, kit:getKitProfile(player), lod:getLOD(0), animationSet:Object.values(ACTIONS), source:player.assetSource||'procedural-fallback'};
}
