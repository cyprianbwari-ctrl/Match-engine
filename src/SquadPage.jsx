import React,{useState,useEffect} from 'react';
import {Users,IdCard,Layers,ClipboardList,UsersRound,ShieldCheck,Filter,ArrowUpDown,ChevronDown,Star,Battery,Zap,UserRound,ArrowRightLeft,FileText,RefreshCcw,CornerUpRight,Ban,X} from 'lucide-react';
import './squad.css';

const initialPlayers=[
{num:1,position:'GK',name:'André Onana',initials:'AO',nat:'🇨🇲',age:28,overall:86,potential:88,condition:92,sharpness:94,morale:'Excellent',formBars:4,form:'7.6',apps:3,wage:'£120k',value:'£32M',status:'Key Player',goals:0,assists:0},
{num:24,position:'GK',name:'Altay Bayındır',initials:'AB',nat:'🇹🇷',age:26,overall:78,potential:82,condition:90,sharpness:92,morale:'Good',formBars:2,form:'6.8',apps:0,wage:'£60k',value:'£8M',status:'Backup',goals:0,assists:0},
{num:20,position:'RB',name:'Diogo Dalot',initials:'DD',nat:'🇵🇹',age:25,overall:83,potential:86,condition:88,sharpness:90,morale:'Very Good',formBars:4,form:'7.4',apps:3,wage:'£80k',value:'£28M',status:'Regular',goals:0,assists:1},
{num:6,position:'CB',name:'Lisandro Martínez',initials:'LM',nat:'🇦🇷',age:26,overall:84,potential:88,condition:90,sharpness:92,morale:'Good',formBars:4,form:'7.5',apps:3,wage:'£90k',value:'£42M',status:'Key Player',goals:0,assists:0},
{num:4,position:'CB',name:'Matthijs de Ligt',initials:'MD',nat:'🇳🇱',age:25,overall:83,potential:87,condition:89,sharpness:91,morale:'Good',formBars:3,form:'7.2',apps:3,wage:'£85k',value:'£38M',status:'Regular',goals:1,assists:0},
{num:5,position:'CB',name:'Harry Maguire',initials:'HM',nat:'🏴',age:32,overall:78,potential:80,condition:87,sharpness:88,morale:'Good',formBars:2,form:'6.9',apps:1,wage:'£70k',value:'£22M',status:'Rotation',goals:0,assists:0},
{num:23,position:'LB',name:'Luke Shaw',initials:'LS',nat:'🏴',age:29,overall:80,potential:83,condition:85,sharpness:87,morale:'Good',formBars:3,form:'7.1',apps:2,wage:'£75k',value:'£25M',status:'Regular',goals:0,assists:0},
{num:19,position:'RB',name:'Noussair Mazraoui',initials:'NM',nat:'🇲🇦',age:27,overall:80,potential:84,condition:86,sharpness:88,morale:'Good',formBars:3,form:'7.0',apps:2,wage:'£70k',value:'£24M',status:'Regular',goals:0,assists:0},
{num:18,position:'DM',name:'Casemiro',initials:'CS',nat:'🇧🇷',age:33,overall:83,potential:85,condition:86,sharpness:88,morale:'Good',formBars:3,form:'7.1',apps:2,wage:'£90k',value:'£30M',status:'Regular',goals:0,assists:0},
{num:8,position:'CM',name:'Bruno Fernandes',initials:'BF',nat:'🇵🇹',age:30,overall:88,potential:90,condition:91,sharpness:94,morale:'Excellent',formBars:4,form:'7.8',apps:3,wage:'£120k',value:'£60M',status:'Key Player',goals:2,assists:3},
{num:37,position:'CM',name:'Kobbie Mainoo',initials:'KM',nat:'🏴',age:20,overall:82,potential:88,condition:92,sharpness:94,morale:'Very Good',formBars:4,form:'7.3',apps:3,wage:'£60k',value:'£45M',status:'Youngster',goals:0,assists:1},
{num:17,position:'AM',name:'Alejandro Garnacho',initials:'AG',nat:'🇦🇷',age:20,overall:79,potential:85,condition:86,sharpness:89,morale:'Good',formBars:3,form:'7.0',apps:2,wage:'£65k',value:'£40M',status:'Regular',goals:0,assists:0},
{num:10,position:'LW',name:'Marcus Rashford',initials:'MR',nat:'🏴',age:27,overall:82,potential:86,condition:84,sharpness:86,morale:'Good',formBars:3,form:'7.2',apps:2,wage:'£80k',value:'£52M',status:'Regular',goals:3,assists:1},
{num:25,position:'RW',name:'Amad Diallo',initials:'AD',nat:'🇨🇮',age:22,overall:78,potential:84,condition:82,sharpness:85,morale:'Good',formBars:1,form:'6.6',apps:1,wage:'£50k',value:'£30M',status:'Rotation',goals:0,assists:0},
{num:11,position:'ST',name:'Rasmus Højlund',initials:'RH',nat:'🇩🇰',age:22,overall:80,potential:86,condition:84,sharpness:87,morale:'Very Good',formBars:2,form:'6.9',apps:2,wage:'£70k',value:'£40M',status:'Regular',goals:2,assists:1},
{num:9,position:'ST',name:'Joshua Zirkzee',initials:'JZ',nat:'🇳🇱',age:23,overall:76,potential:82,condition:80,sharpness:83,morale:'Good',formBars:1,form:'6.5',apps:1,wage:'£60k',value:'£32M',status:'Rotation',goals:0,assists:0}
];
const tabs=[['Overview',Users],['Players',IdCard],['Squad Depth',Layers],['Development',ClipboardList],['Squad Dynamics',UsersRound],['Registration',ShieldCheck]];
const sortOptions=[{key:'overall',label:'Overall Rating'},{key:'potential',label:'Potential'},{key:'age',label:'Age'},{key:'value',label:'Value'},{key:'wage',label:'Wage'},{key:'formBars',label:'Form'}];
const statusOrder=['Key Player','Regular','Rotation','Backup','Youngster'];
function statusClass(s){return{'Key Player':'st-key','Backup':'st-backup','Regular':'st-regular','Rotation':'st-rotation','Youngster':'st-youngster','Transfer Listed':'st-transfer','On Loan':'st-loan','Unavailable':'st-unavail'}[s]||'st-regular'}
function parseMoney(s){const n=parseFloat(String(s).replace(/[£,]/g,''));return String(s).includes('M')?n*1e6:String(s).includes('k')?n*1e3:n}
function inGroup(pos,group){
 if(group==='All')return true;
 if(group==='Goalkeepers')return pos==='GK';
 if(group==='Defenders')return ['RB','CB','LB'].includes(pos);
 if(group==='Midfielders')return ['DM','CM','AM'].includes(pos);
 if(group==='Forwards'||group==='Attackers')return ['LW','RW','ST'].includes(pos);
 return true;
}
function Kpi({n,v}){return <div className="kpi"><small>{n}</small><b>{v}</b></div>}
function Table({rows,onPlayer}){return <div className="ptable"><div className="ptr head"><b>Player</b><b>Pos</b><b>Age</b><b>OVR</b><b>POT</b><b>Condition</b><b>Sharp.</b><b>Morale</b><b>Form</b><b>Value</b></div>{rows.map(p=><button className="ptr prow" onClick={()=>onPlayer(p)} key={p.name}><strong><span className="mini">{p.initials}</span>{p.name}</strong><span>{p.position}</span><span>{p.age}</span><b>{p.overall}</b><b className="lime">{p.potential}</b><span>{p.condition}%</span><span>{p.sharpness}%</span><span className="lime">{p.morale}</span><span>{p.form}</span><span>{p.value}</span></button>)}</div>}
function Profile({p,setActive,back}){return <><div className="subtop"><button onClick={back}>← Squad</button><div><b>{p.name}</b><small>{p.position} · {p.status}</small></div><button onClick={()=>setActive('Tactics')}>Open in Tactics</button></div><div className="profile-grid"><section className="card profile"><div className="portrait">{p.initials}</div><h1>{p.name}</h1><p>{p.position} · {p.age} · {p.nat}</p><div className="big-rating">{p.overall}</div><small>OVERALL</small><div className="profile-actions"><button onClick={()=>setActive('Training')}>Training</button><button onClick={()=>setActive('Transfers')}>Transfer</button><button>Contract</button></div></section><section className="card"><h2>Performance</h2><div className="stats">{[['Matches',p.apps],['Starts',p.apps],['Goals',p.goals],['Assists',p.assists],['Avg. Rating',p.form],['Minutes',p.apps*90]].map(x=><div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}</div><h2>Condition & Morale</h2><p>Condition <b className="lime">{p.condition}%</b></p><p>Sharpness <b className="lime">{p.sharpness}%</b></p><p>Morale <b className="lime">{p.morale}</b></p></section><section className="card"><h2>Player Information</h2><p>Squad status <b>{p.status}</b></p><p>Wage <b>{p.wage}/week</b></p><p>Market value <b>{p.value}</b></p><p>Potential <b className="lime">{p.potential}</b></p><h2>Personality</h2><div className="chips"><i>Professional</i><i>Consistent</i><i>Adaptable</i></div></section></div></>}

export default function SquadPage({setActive}){
 const [tab,setTab]=useState('Overview');
 const [players,setPlayers]=useState(initialPlayers);
 const [filter,setFilter]=useState('All');
 const [ovFilter,setOvFilter]=useState('All');
 const [sortKey,setSortKey]=useState('overall');
 const [activeRow,setActiveRow]=useState(null);
 const [sideTab,setSideTab]=useState('Key Stats');
 const [selected,setSelected]=useState(null);
 const [toast,setToast]=useState('');

 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)},[toast]);

 function updateStatus(name,status){
  setPlayers(ps=>ps.map(p=>p.name===name?{...p,status}:p));
  setActiveRow(ar=>ar&&ar.name===name?{...ar,status}:ar);
 }
 function handleAction(key){
  if(!activeRow){setToast('Select a player from the list first');return}
  if(key==='profile'){setSelected(activeRow);return}
  if(key==='transfer'){updateStatus(activeRow.name,'Transfer Listed');setToast(activeRow.name+' added to the transfer list');return}
  if(key==='contract'){setToast('Contract offer sent to '+activeRow.name);return}
  if(key==='status'){const next=statusOrder[(statusOrder.indexOf(activeRow.status)+1)%statusOrder.length];updateStatus(activeRow.name,next);setToast(activeRow.name+"'s squad status set to "+next);return}
  if(key==='loan'){updateStatus(activeRow.name,'On Loan');setToast(activeRow.name+' sent on loan');return}
  if(key==='unavailable'){updateStatus(activeRow.name,'Unavailable');setToast(activeRow.name+' marked unavailable');return}
 }

 if(selected)return <div className="squad-page"><Profile p={selected} setActive={setActive} back={()=>setSelected(null)}/></div>;

 const rows=players.filter(p=>inGroup(p.position,filter));
 const ovRowsFiltered=players.filter(p=>inGroup(p.position,ovFilter));
 const ovRows=[...ovRowsFiltered].sort((a,b)=>sortKey==='value'||sortKey==='wage'?parseMoney(b[sortKey])-parseMoney(a[sortKey]):b[sortKey]-a[sortKey]);
 const sortLabel=(sortOptions.find(s=>s.key===sortKey)||{}).label||'Overall Rating';
 const gaugeR=64,gaugeC=2*Math.PI*gaugeR,ovrPct=82;
 const topPerformers=[{name:'Bruno Fernandes',role:'Midfielder',rating:88},{name:'Rasmus Højlund',role:'Forward',rating:80},{name:'Lisandro Martínez',role:'Defender',rating:84}];
 const actions=[['Player Profile','View detailed player info',UserRound,'profile'],['Add to Transfer List','Transfer market',ArrowRightLeft,'transfer'],['Offer New Contract','Manage contracts',FileText,'contract'],['Set Squad Status','Change player status',RefreshCcw,'status'],['Send on Loan','Loan list',CornerUpRight,'loan'],['Make Unavailable','Exclude from selection',Ban,'unavailable']];

 return <div className="squad-page">
  <div className="squad-head"><div className="squad-head-icon"><Users/></div><div><h1>SQUAD</h1><p>Manage your players, build your team, achieve your goals.</p></div></div>

  <div className="squad-tabs">{tabs.map(([t,I])=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}><I size={14}/>{t}</button>)}</div>

  {tab==='Overview'&&<>
   {toast&&<div className="toast"><span>{toast}</span><button onClick={()=>setToast('')}><X size={13}/></button></div>}

   <div className="card squad-info-card">
    <div className="si-block si-club">
     <div className="crest-sq">MU</div>
     <div className="si-club-name"><b>Manchester United</b><small>First Team Squad</small></div>
     <div className="si-circles">
      <div className="si-circle"><b>24</b><span>Players</span></div>
      <div className="si-circle"><b>3</b><span>Goalkeepers</span></div>
      <div className="si-circle"><b>8</b><span>Defenders</span></div>
      <div className="si-circle"><b>8</b><span>Midfielders</span></div>
      <div className="si-circle"><b>5</b><span>Forwards</span></div>
     </div>
    </div>
    <div className="si-block">
     <span className="si-label">Squad Quality</span>
     <div className="stars-row">{[0,1,2,3,4].map(i=><Star key={i} size={15} fill={i<4?'currentColor':'none'} className={i<4?'':'off'}/>)}</div>
     <small className="si-sub">Overall Rating</small>
     <div className="si-big">82</div>
    </div>
    <div className="si-block">
     <span className="si-label">Squad Value</span>
     <div className="si-big">£720,000,000</div>
     <small className="si-sub">Total Market Value</small>
    </div>
    <div className="si-block">
     <span className="si-label">Average Age</span>
     <div className="si-big">26.3</div>
     <small className="si-sub">Years</small>
    </div>
    <div className="si-block">
     <span className="si-label">Squad Status</span>
     <div className="si-status-row"><span className="dot green"/>Key Players<b>8</b></div>
     <div className="si-status-row"><span className="dot green"/>Regulars<b>12</b></div>
     <div className="si-status-row"><span className="dot yellow"/>Rotation<b>4</b></div>
     <div className="si-status-row"><span className="dot red"/>Youngsters<b>0</b></div>
    </div>
   </div>

   <div className="squad-main-grid">
    <section className="card squad-table-card">
     <div className="table-head">
      <h2>First Team Squad</h2>
      <div className="dropdown-btn"><Filter size={13}/>Filter: {ovFilter}<ChevronDown size={13}/>
       <select value={ovFilter} onChange={e=>setOvFilter(e.target.value)}>{['All','Goalkeepers','Defenders','Midfielders','Forwards'].map(f=><option key={f} value={f}>{f}</option>)}</select>
      </div>
      <div className="dropdown-btn"><ArrowUpDown size={13}/>Sort: {sortLabel}<ChevronDown size={13}/>
       <select value={sortKey} onChange={e=>setSortKey(e.target.value)}>{sortOptions.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select>
      </div>
     </div>
     <div className="ov-table">
      <div className="ov-row ov-head"><span>#</span><span>Pos</span><span>Player</span><span>Nat</span><span>Age</span><span>OVR</span><span>POT</span><span>Con</span><span>Sharp</span><span>Morale</span><span>Form</span><span>Apps</span><span>Wage</span><span>Value</span><span>Status</span></div>
      {ovRows.map(p=><button key={p.name} className={"ov-row ov-body"+(activeRow&&activeRow.name===p.name?' sel':'')} onClick={()=>setActiveRow(p)}>
       <span>{p.num}</span>
       <span>{p.position}</span>
       <span className="ov-name"><span className="ov-avatar"><UserRound size={13}/></span>{p.name}</span>
       <span>{p.nat}</span>
       <span>{p.age}</span>
       <b className="badge ovr">{p.overall}</b>
       <b className="badge pot">{p.potential}</b>
       <span className="ov-pct con"><Battery size={11}/>{p.condition}%</span>
       <span className="ov-pct sharp"><Zap size={11}/>{p.sharpness}%</span>
       <span className="emoji">🙂</span>
       <span className="formbars">{[0,1,2,3].map(i=><i key={i} className={i<p.formBars?'on':''}/>)}</span>
       <span>{p.apps}</span>
       <span>{p.wage}</span>
       <span>{p.value}</span>
       <span className={"status-pill "+statusClass(p.status)}>{p.status}</span>
      </button>)}
     </div>
    </section>

    <aside className="squad-side">
     <section className="card side-overview">
      <h2>Squad Overview</h2>
      <div className="pill-tabs">
       <button className={sideTab==='Key Stats'?'active':''} onClick={()=>setSideTab('Key Stats')}>Key Stats</button>
       <button className={sideTab==='Squad Info'?'active':''} onClick={()=>setSideTab('Squad Info')}>Squad Info</button>
      </div>
      {sideTab==='Key Stats'?<>
       <div className="gauge-wrap">
        <svg className="gauge" viewBox="0 0 150 150">
         <circle className="gauge-bg" cx="75" cy="75" r={gaugeR}/>
         <circle className="gauge-fg" cx="75" cy="75" r={gaugeR} strokeDasharray={`${gaugeC*ovrPct/100} ${gaugeC}`}/>
        </svg>
        <div className="gauge-label"><b>{ovrPct}</b><small>Overall Rating</small></div>
       </div>
       <div className="dot-list">
        <div><span className="dot blue"/><b>24</b> Players</div>
        <div><span className="dot green"/><b>3</b> Goalkeepers</div>
        <div><span className="dot yellow"/><b>8</b> Defenders</div>
        <div><span className="dot yellow"/><b>8</b> Midfielders</div>
        <div><span className="dot red"/><b>5</b> Forwards</div>
       </div>
       <div className="chem">
        <div className="chem-head"><span>Team Chemistry</span></div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
         <div className="chem-bar" style={{flex:1}}><i style={{width:'88%'}}/></div>
         <b style={{fontSize:11}}>88%</b>
        </div>
       </div>
      </>:<div className="squad-info-panel">
       <p><span>Manager</span><b>Cyprian</b></p>
       <p><span>Formation</span><b>4-2-3-1</b></p>
       <p><span>Captain</span><b>Bruno Fernandes</b></p>
       <p><span>Vice Captain</span><b>Lisandro Martínez</b></p>
       <p><span>Stadium</span><b>Old Trafford</b></p>
       <p><span>League Position</span><b>4th</b></p>
      </div>}
     </section>

     <section className="card top-performers">
      <h2>Top Performers</h2>
      {topPerformers.map(t=><div className="tp-row" key={t.name}><div className="tp-avatar"><UserRound size={16}/></div><div><b>{t.name}</b><small>{t.role}</small></div><span className="tp-badge">{t.rating}</span></div>)}
     </section>

     <section className="card next-match">
      <h2>Next Match</h2>
      <div className="nm-row">
       <div className="nm-team"><div className="crest-sq small">MU</div><b>Man Utd</b></div>
       <span>VS</span>
       <div className="nm-team"><div className="crest-sq small brighton">BHA</div><b>Brighton</b></div>
      </div>
      <div className="nm-meta"><span>Premier League</span><span>14 Sep 2025</span><span>17:30</span></div>
      <button className="green-wide" onClick={()=>setActive('Tactics')}>View Match</button>
     </section>
    </aside>
   </div>

   <div className="action-bar">{actions.map(([label,desc,Icon,key])=><button key={key} onClick={()=>handleAction(key)}><span className="ab-icon"><Icon size={15}/></span><span><b>{label}</b><small>{desc}</small></span></button>)}</div>
  </>}

  {tab==='Players'&&<section className="card squad-table"><div className="filters"><h2>Players</h2>{['All','Goalkeepers','Defenders','Midfielders','Attackers'].map(f=><button className={filter===f?'active':''} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div><Table rows={rows} onPlayer={setSelected}/></section>}
  {tab==='Squad Depth'&&<Depth/>}
  {tab==='Development'&&<Development players={players} onPlayer={setSelected}/>}
  {tab==='Squad Dynamics'&&<Dynamics/>}
  {tab==='Registration'&&<Registration/>}
 </div>
}

function Depth(){const rows=[['Goalkeeper','André Onana','Bayındır','🟢'],['Right Back','Diogo Dalot','Mazraoui','🟢'],['Centre Back','Matthijs de Ligt','Lisandro Martínez','🟢'],['Left Back','Luke Shaw','Dalot','🟢'],['Defensive Midfield','Casemiro','Ugarte','🟡'],['Central Midfield','Bruno Fernandes','Kobbie Mainoo','🟢'],['Wide Attack','Garnacho','Rashford','🟢'],['Striker','Rasmus Højlund','Zirkzee','🟢']];return <section className="card depth"><div className="section-head"><h2>Squad Depth</h2><span>🟢 Strong　🟡 Adequate　🔴 Weak</span></div>{rows.map(r=><div className="depth-row" key={r[0]}><b>{r[0]}</b><span>1</span><div><strong>{r[1]}</strong><small>Primary option</small></div><div><strong>{r[2]}</strong><small>Backup option</small></div><em>{r[3]}</em></div>)}</section>}
function Development({players,onPlayer}){return <section className="card development"><div className="section-head"><h2>Player Development</h2><span>Current ability → potential</span></div>{players.map(p=><div className="dev-row" key={p.name}><span className="mini">{p.initials}</span><div><b>{p.name}</b><small>{p.position} · Age {p.age}</small></div><b>{p.overall}</b><div className="devbar"><i style={{width:Math.min(100,p.overall/91*100)+'%'}}/></div><strong className="lime">↑ {Math.max(0,p.potential-p.overall)}</strong><button onClick={()=>onPlayer(p)}>Profile</button></div>)}</section>}
function Dynamics(){return <div className="dynamics"><section className="card"><h2>Team Hierarchy</h2>{[['Captain','Bruno Fernandes'],['Vice Captain','Lisandro Martínez'],['Team Leader','Casemiro'],['Influential','Marcus Rashford'],['Young Leader','Kobbie Mainoo']].map(x=><p className="dyn" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></p>)}</section><section className="card"><h2>Dressing Room</h2><div className="morale">88%<small>Atmosphere</small></div><p>Team morale: <b className="lime">Very Good</b></p><p>Positive groups: <b>4</b></p><p>Players with concerns: <b className="warn">2</b></p><p>Unhappy players: <b>0</b></p></section><section className="card"><h2>Playing Time Concerns</h2><p><b>J. Zirkzee</b><br/><small>Wants more playing time · Medium</small></p><p><b>Casemiro</b><br/><small>Wants clearer squad role · Low</small></p></section></div>}
function Registration(){return <div className="registration"><section className="card"><h2>Premier League Registration</h2><div className="regbig"><b>22 / 25</b><small>Senior players registered</small></div><p>Homegrown <b>8 / 8</b></p><p>Non-homegrown <b>14</b></p><p>U21 exemptions <b>4</b></p></section><section className="card"><h2>Registration Checks</h2><p className="check">✓ Squad size compliant</p><p className="check">✓ Homegrown requirement met</p><p className="check">✓ Foreign-player limits met</p><p className="check">✓ All selected players eligible</p></section></div>}
