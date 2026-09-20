import React, { useEffect, useRef } from 'react';
import { getPlayerVisualProfile, getKitProfile, normalizeAction } from './3d/playerAssetSystem.js';

const TAU = Math.PI * 2;
const TEAM = {
  home: { primary: [0.53, 0.05, 0.09], secondary: [0.98, 0.98, 0.98], shorts: [0.07, 0.09, 0.14], trim: [0.77, 0.78, 0.82] },
  away: { primary: [0.91, 0.94, 0.98], secondary: [0.35, 0.56, 0.86], shorts: [0.84, 0.87, 0.92], trim: [0.16, 0.22, 0.30] },
  gkHome: { primary: [0.08, 0.65, 0.30], secondary: [0.08, 0.88, 0.45], shorts: [0.05, 0.18, 0.10], trim: [0.80, 0.98, 0.70] },
  gkAway: { primary: [0.98, 0.55, 0.08], secondary: [1.0, 0.72, 0.18], shorts: [0.25, 0.14, 0.04], trim: [1.0, 0.90, 0.60] },
};

const SKIN = [0.62, 0.38, 0.25];
const HAIR = [0.045, 0.035, 0.03];

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function deg(a) { return a * Math.PI / 180; }
function mat4Identity() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
function mat4Mul(a,b){
  const o=new Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
function mat4Translate(m,x,y,z){ const t=mat4Identity(); t[12]=x;t[13]=y;t[14]=z;return mat4Mul(m,t); }
function mat4Scale(m,x,y,z){ const t=mat4Identity();t[0]=x;t[5]=y;t[10]=z;return mat4Mul(m,t); }
function mat4RotateX(m,a){const c=Math.cos(a),s=Math.sin(a),t=mat4Identity();t[5]=c;t[6]=s;t[9]=-s;t[10]=c;return mat4Mul(m,t);}
function mat4RotateY(m,a){const c=Math.cos(a),s=Math.sin(a),t=mat4Identity();t[0]=c;t[2]=-s;t[8]=s;t[10]=c;return mat4Mul(m,t);}
function mat4RotateZ(m,a){const c=Math.cos(a),s=Math.sin(a),t=mat4Identity();t[0]=c;t[1]=s;t[4]=-s;t[5]=c;return mat4Mul(m,t);}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2), nf=1/(near-far);return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,(2*far*near)*nf,0];}
function lookAt(eye,center,up){
  let zx=eye[0]-center[0],zy=eye[1]-center[1],zz=eye[2]-center[2];
  let l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;
  let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;
  l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return [xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx*eye[0]+xy*eye[1]+xz*eye[2]), -(yx*eye[0]+yy*eye[1]+yz*eye[2]), -(zx*eye[0]+zy*eye[1]+zz*eye[2]),1];
}

function createBox(){
  const p=[-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1];
  const faces=[[0,1,2,3,0,0,-1],[4,7,6,5,0,0,1],[0,4,5,1,0,-1,0],[3,2,6,7,0,1,0],[0,3,7,4,-1,0,0],[1,5,6,2,1,0,0]];
  const v=[],n=[]; faces.forEach(f=>{const [a,b,c,d,nx,ny,nz]=f;[a,b,c,a,c,d].forEach(i=>{v.push(p[i*3],p[i*3+1],p[i*3+2]);n.push(nx,ny,nz);});}); return {v,n,count:v.length/3};
}
function createSphere(rows=10,cols=14){
  const v=[],n=[]; for(let r=0;r<rows;r++){const t0=Math.PI*r/rows,t1=Math.PI*(r+1)/rows;for(let c=0;c<cols;c++){const p0=TAU*c/cols,p1=TAU*(c+1)/cols;const pts=[[Math.sin(t0)*Math.cos(p0),Math.cos(t0),Math.sin(t0)*Math.sin(p0)],[Math.sin(t0)*Math.cos(p1),Math.cos(t0),Math.sin(t0)*Math.sin(p1)],[Math.sin(t1)*Math.cos(p1),Math.cos(t1),Math.sin(t1)*Math.sin(p1)],[Math.sin(t1)*Math.cos(p0),Math.cos(t1),Math.sin(t1)*Math.sin(p0)]];[0,1,2,0,2,3].forEach(i=>{v.push(...pts[i]);n.push(...pts[i]);});}} return {v,n,count:v.length/3};
}
function createCylinder(segments=12){
  const v=[],n=[]; for(let i=0;i<segments;i++){const a0=TAU*i/segments,a1=TAU*(i+1)/segments;const x0=Math.cos(a0),z0=Math.sin(a0),x1=Math.cos(a1),z1=Math.sin(a1);const pts=[[-1,0,0],[1,0,0],[1,1,0],[-1,1,0]]; // overwritten by radial ring helper below
    const q=[[x0,0,z0],[x1,0,z1],[x1,1,z1],[x0,1,z0]];[0,1,2,0,2,3].forEach(j=>{v.push(...q[j]);n.push(q[j][0],0,q[j][2]);});}
  return {v,n,count:v.length/3};
}

function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl){
  const vs=compile(gl,gl.VERTEX_SHADER,`attribute vec3 aPosition; attribute vec3 aNormal; uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProj; uniform vec3 uColor; varying vec3 vN; varying vec3 vC; varying vec3 vP; void main(){vec4 wp=uModel*vec4(aPosition,1.0);vP=wp.xyz;vN=mat3(uModel)*aNormal;vC=uColor;gl_Position=uProj*uView*wp;}`);
  const fs=compile(gl,gl.FRAGMENT_SHADER,`precision mediump float; varying vec3 vN; varying vec3 vC; varying vec3 vP; void main(){vec3 n=normalize(vN);vec3 l=normalize(vec3(-0.35,0.85,0.45));float d=max(dot(n,l),0.0);vec3 c=vC*(0.32+0.68*d);float rim=pow(1.0-max(dot(n,normalize(vec3(0.0,0.35,1.0))),0.0),2.0);c+=vC*rim*0.08;gl_FragColor=vec4(c,1.0);}`);
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;
}
function meshBuffer(gl,mesh){const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.v),gl.STATIC_DRAW);const nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.n),gl.STATIC_DRAW);return {vb,nb,count:mesh.count};}
function modelAt(x,y,z,scale,rx=0,ry=0,rz=0){let m=mat4Identity();m=mat4Translate(m,x,y,z);m=mat4RotateY(m,ry);m=mat4RotateX(m,rx);m=mat4RotateZ(m,rz);return mat4Scale(m,scale,scale,scale);}

function actionPose(action,phase){
  const a=String(action||'shape').toLowerCase();
  const run=['run','press','carrier','carry','support'].includes(a);
  const stride=run?Math.sin(phase)*0.62:0;
  const swing=run?Math.sin(phase+Math.PI)*0.46:0;
  if(a==='shoot')return {l:-0.10,r:0.34,armL:-0.55,armR:0.25,lean:0.18};
  if(a==='pass'||a==='through-pass')return {l:0.08,r:-0.22,armL:0.15,armR:-0.35,lean:0.05};
  if(a==='tackle')return {l:0.65,r:-0.12,armL:-0.25,armR:0.15,lean:0.32};
  if(['save','parry','claim'].includes(a))return {l:0,r:0,armL:-0.95,armR:0.95,lean:0.10};
  return {l:stride,r:-stride,armL:swing,armR:-swing,lean:0};
}

function drawPart(gl, loc, mesh, model, color){
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vb);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.p);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.nb);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.n);
  gl.uniformMatrix4fv(loc.m,false,new Float32Array(model));gl.uniform3fv(loc.c,new Float32Array(color));gl.drawArrays(gl.TRIANGLES,0,mesh.count);
}

function hexColor(hex){const h=String(hex||'#ffffff').replace('#','');const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16)||0xffffff;return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];}

function drawPlayer(gl, loc, meshes, p, now, selected, lod=1){
  const side=p.teamSide==='away'?'away':'home';
  const gk=p.pos==='GK'||p.role==='GK';
  const kitData=getKitProfile(p);
  const kit=gk?(side==='home'?TEAM.gkHome:TEAM.gkAway):TEAM[side];
  const visual=getPlayerVisualProfile(p);
  const profile={height:0.96+((visual.height-180)/1000),build:visual.build,skin:visual.skin,hair:visual.hair,boots:visual.boots};
  const speed=Math.hypot(Number(p.vx)||0,Number(p.vy)||0);
  const action=normalizeAction(p.action,speed,speed);
  const phase=now*0.010+(Number(p.id)||0)*0.77;const pose=actionPose(action,phase);
  const x=((Number(p.x)||50)-50)*0.92; const z=((Number(p.y)||50)-50)*0.74; const base=1.0*profile.height;
  const facing=Math.atan2(Math.sin((Number(p.vx)||0)*0.02),Math.max(0.1,Math.abs(Number(p.vx)||0)+1))*0.5;
  const torsoH=0.92*base, torsoW=0.42*profile.build, limbS=0.12*profile.build;
  const root=modelAt(x,0.02,z,1,0,facing,0);
  // Feet / legs
  const legY=0.40*base;
  const leftLeg=modelAt(x-0.12*profile.build,legY,z+pose.l*0.08,limbS,pose.l*0.42,facing,0);
  const rightLeg=modelAt(x+0.12*profile.build,legY,z+pose.r*0.08,limbS,pose.r*0.42,facing,0);
  drawPart(gl,loc,meshes.cube,mat4Scale(leftLeg,1.15,3.1*base,1.15),[0.09,0.10,0.13]);
  drawPart(gl,loc,meshes.cube,mat4Scale(rightLeg,1.15,3.1*base,1.15),[0.09,0.10,0.13]);
  // Boots
  drawPart(gl,loc,meshes.cube,mat4Translate(mat4Scale(leftLeg,1.25,0.55,2.2),0,-0.10,0.12),[0.93,0.95,0.98]);
  drawPart(gl,loc,meshes.cube,mat4Translate(mat4Scale(rightLeg,1.25,0.55,2.2),0,-0.10,0.12),[0.93,0.95,0.98]);
  // Shorts
  drawPart(gl,loc,meshes.cube,mat4Scale(mat4Translate(root,0,0.72*base,0),0.36*profile.build,0.28,0.22),kit.shorts);
  // Torso
  const torso=mat4Scale(mat4Translate(root,0,1.18*base,0),torsoW,0.55*base,0.24);
  drawPart(gl,loc,meshes.cube,torso,kit.primary);
  // Chest accent stripe
  drawPart(gl,loc,meshes.cube,mat4Scale(mat4Translate(root,0,1.22*base,0.252),torsoW*1.01,0.055*base,0.015),hexColor(kitData.accent));
  // Arms
  const armY=1.32*base;
  const aL=mat4Translate(root,-0.48*profile.build,armY,0);const aR=mat4Translate(root,0.48*profile.build,armY,0);
  drawPart(gl,loc,meshes.cube,mat4RotateZ(mat4Scale(aL,0.12,0.46*base,0.12),pose.armL),kit.primary);
  drawPart(gl,loc,meshes.cube,mat4RotateZ(mat4Scale(aR,0.12,0.46*base,0.12),pose.armR),kit.primary);
  // Head + hair
  const head=mat4Translate(root,0,1.96*base,0);
  drawPart(gl,loc,meshes.sphere,mat4Scale(head,0.25*profile.build,0.28*profile.height,0.25),hexColor(profile.skin));
  drawPart(gl,loc,meshes.sphere,mat4Scale(mat4Translate(head,0,0.075,0),0.255*profile.build,0.11,0.255),hexColor(profile.hair));
  // Shoulder highlight for depth.
  drawPart(gl,loc,meshes.cube,mat4Scale(mat4Translate(root,0,1.56*base,0.03),torsoW*1.02,0.06,0.255),hexColor(kitData.accent));
  // Selection marker is rendered as a flattened disc-like box below the feet.
  if(selected)drawPart(gl,loc,meshes.cylinder,mat4Scale(mat4Translate(root,0,0.015,0),0.42,0.015,0.20),[0.45,1.0,0.20]);
}

export default function Player3DWebGL({players=[],selectedId,running,getPosition}){
  const ref=useRef(null); const raf=useRef(0);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return undefined;
    let gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:false});
    if(!gl) return undefined;
    let alive=true;
    try{
      const prog=program(gl);gl.useProgram(prog);
      const loc={p:gl.getAttribLocation(prog,'aPosition'),n:gl.getAttribLocation(prog,'aNormal'),m:gl.getUniformLocation(prog,'uModel'),v:gl.getUniformLocation(prog,'uView'),pr:gl.getUniformLocation(prog,'uProj'),c:gl.getUniformLocation(prog,'uColor')};
      const meshes={cube:meshBuffer(gl,createBox()),sphere:meshBuffer(gl,createSphere()),cylinder:meshBuffer(gl,createCylinder())};
      gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);
      const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);};
      resize();window.addEventListener('resize',resize);
      const render=(now)=>{if(!alive)return;const r=canvas.getBoundingClientRect();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const aspect=Math.max(.5,r.width/Math.max(1,r.height));const view=lookAt([0,30,52],[0,0,0],[0,1,0]);const proj=perspective(deg(38),aspect,.1,180);gl.useProgram(prog);gl.uniformMatrix4fv(loc.v,false,new Float32Array(view));gl.uniformMatrix4fv(loc.pr,false,new Float32Array(proj));
        const list=[...players].sort((a,b)=>(a.y||0)-(b.y||0));
        list.forEach(p=>{const pos=getPosition?getPosition(p,r.width,r.height):{x:(p.x||50)/100*r.width,y:(p.y||50)/100*r.height,scale:.7};const nx=(pos.x/r.width)*2-1;const nz=(pos.y/r.height)*2-1;const scale=clamp(.68+(1-(p.y||50)/100)*.30,.60,.98);const mapped={...p,x:50+nx*48,y:50+nz*48};drawPlayer(gl,loc,meshes,mapped,running?now:0,selectedId===p.id,scale);});
        raf.current=requestAnimationFrame(render);};
      raf.current=requestAnimationFrame(render);
      return()=>{alive=false;cancelAnimationFrame(raf.current);window.removeEventListener('resize',resize);Object.values(meshes).forEach(m=>{gl.deleteBuffer(m.vb);gl.deleteBuffer(m.nb);});gl.deleteProgram(prog);};
    }catch(e){console.error('FAMILY26 3D player renderer:',e);return undefined;}
  },[players,selectedId,running,getPosition]);
  return <canvas ref={ref} className="player-3d-webgl" aria-hidden="true" />;
}
