import React, { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

function project(x, y, z, cx, cy, depth, yaw = 0) {
  const sy = Math.sin(yaw), cyaw = Math.cos(yaw);
  const rx = x * cyaw - z * sy;
  const rz = x * sy + z * cyaw;
  const perspective = 1 / (1 + rz / 900);
  return { x: cx + rx * perspective * depth, y: cy - (y * perspective * depth), s: perspective * depth };
}

function poly(ctx, pts, fill, stroke = null) {
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function limb(ctx, a, b, width, fill) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len * width, ny = dx / len * width;
  poly(ctx, [{x:a.x+nx,y:a.y+ny},{x:a.x-nx,y:a.y-ny},{x:b.x-nx*.8,y:b.y-ny*.8},{x:b.x+nx*.8,y:b.y+ny*.8}], fill);
}

function drawPlayer(ctx, p, x, y, scale, selected, now) {
  const team = p.teamSide === 'away';
  const kit = team ? '#eef2f8' : '#8d1420';
  const kitLight = team ? '#ffffff' : '#d72a35';
  const shorts = team ? '#d8dee8' : '#151925';
  const skin = '#c88967';
  const hair = '#2a2020';
  const moving = ['run','press','carry','carrier','support'].includes(p.action);
  const phase = moving ? now * 0.012 + (p.id % 7) : 0;
  const stride = moving ? Math.sin(phase) * 0.58 : 0;
  const armSwing = moving ? Math.sin(phase + Math.PI) * 0.42 : 0;
  const kick = p.action === 'shoot' || p.action === 'pass' || p.action === 'through-pass' ? Math.sin(now * 0.018 + p.id) * 0.8 : 0;
  const tackle = p.action === 'tackle' ? 0.55 : 0;
  const gk = p.role === 'GK';
  const yaw = Math.atan2((p.x - 50), 38) * 0.35;
  const cx = x, cy = y;
  const h = (gk ? 54 : 58) * scale;
  const s = scale;
  const footY = cy + 4 * s;

  // Ground shadow.
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(cx, footY + 3*s, 12*s, 3.5*s, 0, 0, TAU); ctx.fill();
  ctx.restore();

  const torso = project(0, h*.47, 0, cx, cy, s, yaw);
  const hip = project(0, h*.22, 0, cx, cy, s, yaw);
  const neck = project(0, h*.72, 0, cx, cy, s, yaw);
  const head = project(0, h*.9, 0, cx, cy, s, yaw);
  const shoulderL = project(-10, h*.67, 0, cx, cy, s, yaw);
  const shoulderR = project(10, h*.67, 0, cx, cy, s, yaw);
  const elbowL = project(-13, h*.48 + armSwing*4, 1, cx, cy, s, yaw);
  const elbowR = project(13, h*.48 - armSwing*4, 1, cx, cy, s, yaw);
  const handL = project(-11, h*.31 + armSwing*7, 0, cx, cy, s, yaw);
  const handR = project(11, h*.31 - armSwing*7, 0, cx, cy, s, yaw);
  const kneeL = project(-5, h*.18, stride*5, cx, cy, s, yaw);
  const kneeR = project(5, h*.18, -stride*5, cx, cy, s, yaw);
  const footL = project(-6, 0, stride*11 + kick*7 + tackle*8, cx, cy, s, yaw);
  const footR = project(6, 0, -stride*11 - kick*7, cx, cy, s, yaw);

  // Legs first.
  limb(ctx, hip, kneeL, 3.1*s, '#252b36');
  limb(ctx, hip, kneeR, 3.1*s, '#252b36');
  limb(ctx, kneeL, footL, 2.8*s, '#141923');
  limb(ctx, kneeR, footR, 2.8*s, '#141923');
  limb(ctx, footL, project(-7,-1,footL.x>cx?4:2,cx,cy,s,yaw), 2*s, '#f0f2f6');
  limb(ctx, footR, project(7,-1,footR.x<cx?4:2,cx,cy,s,yaw), 2*s, '#f0f2f6');

  // Shorts and torso as shaded faceted mesh.
  poly(ctx, [project(-11,h*.32,0,cx,cy,s,yaw),project(11,h*.32,0,cx,cy,s,yaw),project(10,h*.18,1,cx,cy,s,yaw),project(-10,h*.18,1,cx,cy,s,yaw)], shorts);
  poly(ctx, [project(-14,h*.70,0,cx,cy,s,yaw),project(14,h*.70,0,cx,cy,s,yaw),project(11,h*.30,2,cx,cy,s,yaw),project(-11,h*.30,2,cx,cy,s,yaw)], kit);
  poly(ctx, [project(-14,h*.70,0,cx,cy,s,yaw),project(0,h*.74,0,cx,cy,s,yaw),project(0,h*.30,2,cx,cy,s,yaw),project(-11,h*.30,2,cx,cy,s,yaw)], kitLight);

  // Arms.
  limb(ctx, shoulderL, elbowL, 3.0*s, skin);
  limb(ctx, elbowL, handL, 2.6*s, skin);
  limb(ctx, shoulderR, elbowR, 3.0*s, skin);
  limb(ctx, elbowR, handR, 2.6*s, skin);

  // Head + hair.
  const hr = 7.2*s;
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(head.x, head.y, hr, hr*1.08, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(head.x-0.3*s, head.y-4*s, hr*0.9, Math.PI, TAU); ctx.fill();

  // Kit number and selected ring.
  if (p.number) {
    ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(6, 7*s)}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(p.number), torso.x, torso.y + 1*s);
  }
  if (selected) {
    ctx.strokeStyle = '#72ff32'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, footY+2*s, 14*s, 4*s, 0, 0, TAU); ctx.stroke();
  }
  if (gk) {
    ctx.strokeStyle = team ? '#9be8ff' : '#66ff8a'; ctx.lineWidth = 2*s; ctx.beginPath(); ctx.arc(head.x, head.y, hr+2*s, 0, TAU); ctx.stroke();
  }
}

export default function Player3DCanvas({ players = [], selectedId, running, getPosition }) {
  const ref = useRef(null);
  const raf = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let alive = true;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(r.width*dpr));
      canvas.height = Math.max(1, Math.floor(r.height*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize(); window.addEventListener('resize', resize);
    const render = (now) => {
      if (!alive) return;
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0,0,r.width,r.height);
      const sorted = [...players].sort((a,b)=>(a.y||0)-(b.y||0));
      sorted.forEach(p => {
        const pos = getPosition ? getPosition(p, r.width, r.height) : {x:(p.x||50)/100*r.width,y:(p.y||50)/100*r.height,scale:0.72};
        drawPlayer(ctx,p,pos.x,pos.y,pos.scale || 0.72,selectedId===p.id,running?now:0);
      });
      raf.current=requestAnimationFrame(render);
    };
    raf.current=requestAnimationFrame(render);
    return () => { alive=false; cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize); };
  }, [players, selectedId, running, getPosition]);
  return <canvas ref={ref} className="player-3d-canvas" aria-hidden="true" />;
}
