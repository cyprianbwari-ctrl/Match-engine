// FAMILY 26 — persistent background world tick.
// Lightweight deterministic processing for days outside the user's match.

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function hash(v){return String(v??'').split('').reduce((a,c)=>(a*33+c.charCodeAt(0))%1000003,17);}

export function simulateWorldDay(players=[], {dayIndex=1}={}) {
  const events=[];
  const updated=players.map((p,i)=>{
    const seed=hash(`${dayIndex}:${p.id??i}`);
    let next={...p};
    if(seed%19===0){
      next.form=Array.isArray(p.form)?[...p.form.slice(-4),clamp((p.form?.at(-1)??75)+((seed%7)-3),45,99)]:p.form;
      events.push({type:'form',player:next.name,text:`${next.name} has a notable form change.`});
    }
    if(seed%37===0 && Number(p.age)>30){
      next.rating=Math.max(40,(Number(p.rating)||70)-1);
      events.push({type:'development',player:next.name,text:`${next.name} shows a small decline in physical output.`});
    }
    if(seed%43===0 && Number(p.age)>0 && Number(p.age)<24){
      next.rating=Math.min(99,(Number(p.rating)||70)+1);
      events.push({type:'development',player:next.name,text:`${next.name} makes development progress.`});
    }
    if(seed%61===0 && p.availability!=='Injured'){
      next.availability='Injured';
      events.push({type:'injury',player:next.name,text:`${next.name} is unavailable after an injury.`});
    } else if(p.availability==='Injured' && seed%11===0){
      next.availability='Available';
      events.push({type:'return',player:next.name,text:`${next.name} returns to availability.`});
    }
    return next;
  });
  return {players:updated,events:events.slice(0,8)};
}
