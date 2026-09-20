import React, { useEffect, useRef } from 'react';

/*
 * FAMILY 26 — Ball-centred broadcast presentation
 *
 * The match engine remains authoritative. This layer only presents the
 * already-simulated frame. The camera continuously solves for the ball,
 * nearby play, and the current phase of play.
 */

const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;

function pitchPoint(x,y,w,h){
  const depth=.48+y*.82;
  return {
    x:w*(.5+(x-.5)*depth),
    y:h*.19+h*.70*y,
    depth
  };
}

function drawPitch(ctx,w,h,camera){
  const corners=[
    pitchPoint(0,0,w,h),pitchPoint(1,0,w,h),
    pitchPoint(1,1,w,h),pitchPoint(0,1,w,h)
  ];
  ctx.fillStyle='#155a31';ctx.beginPath();
  corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.closePath();ctx.fill();

  for(let i=0;i<16;i++){
    const y0=i/16,y1=(i+1)/16;
    const a=pitchPoint(0,y0,w,h),b=pitchPoint(1,y0,w,h);
    const c=pitchPoint(1,y1,w,h),d=pitchPoint(0,y1,w,h);
    ctx.fillStyle=i%2?'#185f35':'#14582f';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
  }

  ctx.strokeStyle='rgba(255,255,255,.82)';
  ctx.lineWidth=Math.max(1,w/1000);
  const line=pts=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()};
  line([...corners,corners[0]]);
  const ml=pitchPoint(0,.5,w,h),mr=pitchPoint(1,.5,w,h);line([ml,mr]);

  const cc=pitchPoint(.5,.5,w,h);
  ctx.beginPath();ctx.arc(cc.x,cc.y,Math.min(w,h)*.105,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.arc(cc.x,cc.y,2.2,0,TAU);ctx.fillStyle='#fff';ctx.fill();

  for(const end of [0,1]){
    const outer=end?.88:.12;
    const inner=end?.945:.055;
    const l1=pitchPoint(.22,outer,w,h),r1=pitchPoint(.78,outer,w,h);
    const l2=pitchPoint(.22,inner,w,h),r2=pitchPoint(.78,inner,w,h);
    line([l1,r1,r2,l2]);
    const sl=pitchPoint(.37,inner,w,h),sr=pitchPoint(.63,inner,w,h);
    const sl2=pitchPoint(.37,end?.975:.025,w,h),sr2=pitchPoint(.63,end?.975:.025,w,h);
    line([sl,sr,sr2,sl2]);
  }

  // Subtle camera-facing vignette for television depth.
  const v=ctx.createRadialGradient(w*.5,h*.52,Math.min(w,h)*.15,w*.5,h*.52,Math.max(w,h)*.7);
  v.addColorStop(0,'rgba(0,0,0,0)');
  v.addColorStop(1,'rgba(0,0,0,.34)');
  ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
}

function drawBall(ctx,ball,w,h,focus){
  if(!ball)return null;
  const x=clamp(Number(ball.x??50)/100,0,1);
  const y=clamp(Number(ball.y??50)/100,0,1);
  const z=clamp(Number(ball.z??0.02),0,1);
  const p=pitchPoint(x,y,w,h);
  const r=clamp(2.0*p.depth+z*2.2,1.4,5.2);

  if(z>.10){
    ctx.save();ctx.globalAlpha=.2;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(p.x,p.y+8*p.depth,r*1.9,r*.65,0,0,TAU);ctx.fill();ctx.restore();
  }
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y-z*18*p.depth,r,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=.8;ctx.stroke();

  if(focus){
    ctx.strokeStyle='rgba(255,255,255,.34)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(p.x,p.y-z*18*p.depth,r+5,0,TAU);ctx.stroke();
  }
  return {x:p.x,y:p.y-z*18*p.depth};
}

function drawPlayer(ctx,p,w,h,ballPos,selected,now){
  const pp=pitchPoint(clamp(Number(p.x??50)/100,0,1),clamp(Number(p.y??50)/100,0,1),w,h);
  const s=clamp(.52+pp.depth*.50,.55,1.15);
  const hgt=40*s;
  const action=String(p.action||'idle').toLowerCase();
  const dx=ballPos?ballPos.x-pp.x:0,dy=ballPos?ballPos.y-pp.y:0;
  const nearBall=Math.hypot(dx,dy)<Math.max(30,42*s);
  const moving=/run|sprint|press|carry|support|track|counter|overlap/.test(action);
  const phase=moving?now*.012+(Number(p.id)||0)%13:0;
  const stride=moving?Math.sin(phase)*.43:0;
  const kick=/shot|pass|cross|through/.test(action)?Math.sin(now*.024+(Number(p.id)||0))*.55:0;

  // Ground shadow.
  ctx.save();ctx.globalAlpha=.27;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(pp.x,pp.y+3*s,10*s,3*s,0,0,TAU);ctx.fill();ctx.restore();

  const home=p.teamSide!=='away';
  const kit=home?(p.kitColor||'#8b1020'):(p.kitColor||'#eef2f7');
  const trim=home?'#f3f3f3':'#29344d';
  const skin='#c98b69';

  // legs
  const hip={x:pp.x,y:pp.y-hgt*.34};
  const lk={x:pp.x-4*s,y:pp.y-hgt*.15+stride*5*s};
  const rk={x:pp.x+4*s,y:pp.y-hgt*.15-stride*5*s};
  const lf={x:pp.x-5*s+kick*8*s,y:pp.y+1*s};
  const rf={x:pp.x+5*s-kick*8*s,y:pp.y+1*s};
  ctx.strokeStyle='#17202a';ctx.lineWidth=3*s;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(hip.x,hip.y);ctx.lineTo(lk.x,lk.y);ctx.lineTo(lf.x,lf.y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(hip.x,hip.y);ctx.lineTo(rk.x,rk.y);ctx.lineTo(rf.x,rf.y);ctx.stroke();

  // body
  ctx.fillStyle=kit;ctx.beginPath();ctx.roundRect(pp.x-7*s,pp.y-hgt*.76,14*s,hgt*.43,3*s);ctx.fill();
  ctx.fillStyle=trim;ctx.fillRect(pp.x-7*s,pp.y-hgt*.76,3*s,hgt*.43);

  // arms
  const arm=moving?Math.sin(phase+Math.PI)*4*s:0;
  ctx.strokeStyle=skin;ctx.lineWidth=2.5*s;
  ctx.beginPath();ctx.moveTo(pp.x-7*s,pp.y-hgt*.69);ctx.lineTo(pp.x-11*s,pp.y-hgt*.42+arm);ctx.stroke();
  ctx.beginPath();ctx.moveTo(pp.x+7*s,pp.y-hgt*.69);ctx.lineTo(pp.x+11*s,pp.y-hgt*.42-arm);ctx.stroke();

  // head
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(pp.x,pp.y-hgt*.88,4.7*s,0,TAU);ctx.fill();
  ctx.fillStyle='#282124';ctx.beginPath();ctx.arc(pp.x,pp.y-hgt*.91,4.8*s,Math.PI,TAU);ctx.fill();

  if(p.number!=null){
    ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(5,6*s)}px Arial`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(p.number),pp.x,pp.y-hgt*.57);
  }

  if(nearBall && /pass|shot|carry|control|tackle|intercept|header|save/.test(action)){
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(pp.x,pp.y+2*s,14*s,0,TAU);ctx.stroke();
  }
  if(selected){
    ctx.strokeStyle='#72ff32';ctx.lineWidth=1.5*s;
    ctx.beginPath();ctx.ellipse(pp.x,pp.y+3*s,12*s,3.4*s,0,0,TAU);ctx.stroke();
  }
}

export default function Football3DPresentation({players=[],ball=null,selectedId,running=true}){
  const ref=useRef(null),raf=useRef(0);
  const cam=useRef({x:.5,y:.5,zoom:1,targetX:.5,targetY:.5,targetZoom:1,phase:'open'});
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');let alive=true;
    const resize=()=>{
      const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
      canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);
      ctx.setTransform(d,0,0,d,0,0);
    };
    resize();addEventListener('resize',resize);

    const render=now=>{
      if(!alive)return;
      const r=canvas.getBoundingClientRect(),w=r.width,h=r.height;
      const bx=clamp(Number(ball?.x??50)/100,0,1),by=clamp(Number(ball?.y??50)/100,0,1);
      const vx=Number(ball?.vx??0),vy=Number(ball?.vy??0);
      const speed=Math.hypot(vx,vy);

      // Camera tracks ball, but looks slightly ahead in its travel direction.
      const lead=clamp(speed*.0018,0,.08);
      cam.current.targetX=clamp(bx+vx*lead,.16,.84);
      cam.current.targetY=clamp(by+vy*lead,.12,.88);

      // Automatic cinematic zoom: closer around shots/duels, wider in buildup.
      const nearby=players.reduce((n,p)=>{
        const dx=Number(p.x??50)/100-bx,dy=Number(p.y??50)/100-by;
        return n+(Math.hypot(dx,dy)<.12?1:0);
      },0);
      const action=String(players.find(p=>/shot|save|tackle|header/.test(String(p.action||'').toLowerCase()))?.action||'');
      cam.current.targetZoom=/shot|save/.test(action)?1.14:(nearby>=4?1.08:1.0);

      const c=cam.current;
      c.x=lerp(c.x,c.targetX,.075);c.y=lerp(c.y,c.targetY,.075);c.zoom=lerp(c.zoom,c.targetZoom,.06);

      // Background.
      const bg=ctx.createLinearGradient(0,0,0,h);
      bg.addColorStop(0,'#0b1425');bg.addColorStop(.25,'#18334a');bg.addColorStop(1,'#07101a');
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

      ctx.save();
      // Camera transform around its current target.
      ctx.translate(w/2,h/2);
      ctx.scale(c.zoom,c.zoom);
      ctx.translate(-w/2,-h/2);
      drawPitch(ctx,w,h,c);

      const bp=drawBall(ctx,ball,w,h,true);
      [...players].sort((a,b)=>Number(a.y??50)-Number(b.y??50))
        .forEach(p=>drawPlayer(ctx,p,w,h,bp,selectedId===p.id,running?now:0));
      // Draw ball last so it is never hidden by a player.
      if(bp){
        const rball=clamp(2.0+(Number(ball?.z??0)*2),1.4,4.8);
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bp.x,bp.y,rball,0,TAU);ctx.fill();
      }
      ctx.restore();

      // Minimal broadcast camera indicator.
      ctx.fillStyle='rgba(5,9,20,.68)';ctx.fillRect(12,12,112,25);
      ctx.fillStyle='#fff';ctx.font='900 10px Arial';ctx.fillText('BALL CAM • LIVE',20,28);

      raf.current=requestAnimationFrame(render);
    };
    raf.current=requestAnimationFrame(render);
    return()=>{alive=false;cancelAnimationFrame(raf.current);removeEventListener('resize',resize)};
  },[players,ball,selectedId,running]);
  return <canvas ref={ref} className="football-3d-presentation" aria-label="FAMILY 26 ball-centred 3D football match" />;
}
