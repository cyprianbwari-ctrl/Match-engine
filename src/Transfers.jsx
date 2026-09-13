import React, {useMemo, useState} from "react";
import {
  ArrowRight, Bookmark, ChevronDown, ChevronRight, Clock3, Minus, Plus,
  Search, Star, TrendingUp, Trophy, Users, X, Check, ArrowLeftRight,
  Newspaper, WalletCards, CircleDollarSign
} from "lucide-react";
import "./transfers.css";

const transferPlayers = [
  {id:1,name:"Viktor Gyökeres",nat:"🇸🇪",pos:"ST",club:"Sporting CP",type:"Transfer",value:70,age:26,role:"Striker",ovr:88,pot:92,fit:82,goals:54,assists:13,apps:52,season:"2024/25",fee:70,status:"Target",colour:"#1d9c56"},
  {id:2,name:"Florian Wirtz",nat:"🇩🇪",pos:"AM",club:"Bayer Leverkusen",type:"Transfer",value:85,age:22,role:"Attacking Midfielder",ovr:91,pot:94,fit:88,goals:16,assists:15,apps:45,season:"2024/25",fee:85,status:"Target",colour:"#d32f45"},
  {id:3,name:"Moisés Caicedo",nat:"🇪🇨",pos:"DM",club:"Chelsea",type:"Transfer",value:75,age:23,role:"Defensive Midfielder",ovr:87,pot:90,fit:94,goals:1,assists:2,apps:38,season:"2024/25",fee:75,status:"Target",colour:"#1d63b5"},
  {id:4,name:"Antoine Semenyo",nat:"🇬🇭",pos:"RW",club:"Bournemouth",type:"Transfer",value:50,age:25,role:"Winger",ovr:82,pot:86,fit:89,goals:13,assists:7,apps:42,season:"2024/25",fee:50,status:"Target",colour:"#d51d35"},
  {id:5,name:"Rayan Cherki",nat:"🇫🇷",pos:"AM",club:"Lyon",type:"Transfer",value:40,age:21,role:"Attacking Midfielder",ovr:84,pot:91,fit:86,goals:12,assists:20,apps:44,season:"2024/25",fee:40,status:"Target",colour:"#173d8c"},
  {id:6,name:"Jorrel Hato",nat:"🇳🇱",pos:"CB",club:"Ajax",type:"Transfer",value:35,age:19,role:"Defender",ovr:80,pot:89,fit:84,goals:3,assists:6,apps:51,season:"2024/25",fee:35,status:"Target",colour:"#d71920"},
  {id:7,name:"Dean Huijsen",nat:"🇪🇸",pos:"CB",club:"Bournemouth",type:"Transfer",value:42,age:20,role:"Ball-Playing Defender",ovr:82,pot:91,fit:90,goals:3,assists:1,apps:34,season:"2024/25",fee:42,status:"Target",colour:"#d51d35"},
  {id:8,name:"Eberechi Eze",nat:"🏴",pos:"AM",club:"Crystal Palace",type:"Transfer",value:60,age:26,role:"Attacking Midfielder",ovr:86,pot:88,fit:91,goals:14,assists:11,apps:34,season:"2024/25",fee:60,status:"Target",colour:"#27904c"},
  {id:9,name:"Rasmus Højlund",nat:"🇩🇰",pos:"ST",club:"Man Utd",type:"Loan",value:35,age:21,role:"Striker",ovr:80,pot:88,fit:83,goals:10,assists:4,apps:52,season:"2024/25",fee:35,status:"Loan",colour:"#da2037"},
  {id:10,name:"Joshua Zirkzee",nat:"🇳🇱",pos:"ST",club:"Man Utd",type:"Loan",value:32,age:23,role:"Forward",ovr:78,pot:85,fit:79,goals:8,assists:3,apps:49,season:"2024/25",fee:32,status:"Loan",colour:"#da2037"}
];

const competitionStart = [
  ["Arsenal","£65M","Active"],["Chelsea","£62M","Active"],["Liverpool","£60M","Pending"],["Tottenham","£58M","Withdrawn"]
];

function Avatar({player, large=false}){
  const initials=player.name.split(" ").map(x=>x[0]).join("").slice(0,2);
  return <div className={`transfer-avatar ${large?"large":""}`} style={{"--club":player.colour}}><span>{initials}</span></div>
}

function StatStars({value}){
  const filled=Math.max(1,Math.round(value/18));
  return <span className="star-row">{[0,1,2,3,4].map(i=><Star key={i} size={15} fill={i<filled?"currentColor":"none"}/>)}</span>
}

function PlayerList({players,selected,setSelected,tab}){
  return <section className="transfer-panel transfer-list-panel">
    <div className="transfer-table-head"><span>PLAYER</span><span>AGE</span><span>POS</span><span>CLUB</span><span>TYPE</span><span>VALUE</span><span></span></div>
    <div className="transfer-list-scroll">
      {players.map((p,i)=><button key={p.id} className={`transfer-row ${selected.id===p.id?"selected":""}`} onClick={()=>setSelected(p)}>
        <div className="player-cell"><Avatar player={p}/><div><strong>{p.name}</strong><small>{p.nat} {p.role}</small></div></div>
        <span>{p.age}</span><b className="pos-pill">{p.pos}</b><span className="club-cell"><i style={{background:p.colour}}>{p.club.slice(0,2).toUpperCase()}</i>{p.club}</span>
        <span>{p.type}</span><strong>£{p.value}M</strong><ChevronRight size={16}/>
      </button>)}
    </div>
  </section>
}

function PlayerDetails({player,onOffer,onShortlist}){
  return <section className="transfer-panel player-detail">
    <div className="player-hero"><Avatar player={player} large/><div className="hero-info"><h1>{player.name}</h1><p>{player.nat} <b>{player.role}</b></p><small>Age {player.age} &nbsp;|&nbsp; 2024/25 season data</small></div><div className="club-badge" style={{borderColor:player.colour}}>{player.club.split(" ").map(x=>x[0]).join("").slice(0,3)}</div></div>
    <div className="stat-cards"><div><span>OVR</span><b>{player.ovr}</b></div><div><span>Potential</span><b>{player.pot}</b></div><div><span>Value</span><b>£{player.value}M</b></div></div>
    <div className="detail-tabs"><button className="active">Overview</button><button>Attributes</button><button>Report</button></div>
    <div className="detail-body">
      <div className="ability-line"><span>Current Ability</span><StatStars value={player.ovr}/><b>{player.ovr}</b></div>
      <div className="ability-line"><span>Potential Ability</span><StatStars value={player.pot}/><b>{player.pot}</b></div>
      <div className="season-grid"><div><span>Appearances</span><b>{player.apps}</b></div><div><span>Goals</span><b>{player.goals}</b></div><div><span>Assists</span><b>{player.assists}</b></div></div>
      <div className="attribute-grid"><div><span>Finishing</span><b>{Math.min(99,player.ovr+0)}</b></div><div><span>Composure</span><b>{Math.min(99,player.ovr-4)}</b></div><div><span>Pace</span><b>{Math.min(99,player.ovr+2)}</b></div><div><span>Strength</span><b>{Math.min(99,player.ovr-1)}</b></div><div><span>Work Rate</span><b>{Math.min(99,player.ovr-3)}</b></div></div>
      <div className="fit-block"><div><span>Suitability for Man Utd</span><b>{player.fit}%</b></div><div className="fit-track"><i style={{width:`${player.fit}%`}}></i></div><small>Ideal for your tactical system</small></div>
    </div>
    <div className="detail-actions"><button className="purple-btn" onClick={onShortlist}><Bookmark size={16}/>{player.status==="Shortlisted"?"Shortlisted":"Add to Shortlist"}</button><button className="lime-btn" onClick={onOffer}>Make Offer <ArrowRight size={17}/></button></div>
  </section>
}

function OfferPanel({player,offer,setOffer,onSubmit}){
  const [wage,setWage]=useState(220000);
  const [years,setYears]=useState(5);
  const [inst,setInst]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [competition,setCompetition]=useState(competitionStart);
  const adjust=(amount)=>setOffer(Math.max(0,offer+amount));
  const submit=()=>{setSubmitted(true);onSubmit();setCompetition(c=>c.map((x,i)=>i===1?[x[0],`£${offer}M`,"Active"]:x));};
  return <section className="transfer-panel offer-panel">
    <div className="panel-title"><h3>Transfer Offer</h3><span className="asking">£{player.value}M<br/><small>Asking Price</small></span></div>
    <div className="selling-club"><div className="mini-crest" style={{background:player.colour}}>{player.club.slice(0,2).toUpperCase()}</div><div><b>{player.club}</b><span>Selling Club</span></div></div>
    <label className="field-label">Your Offer</label><div className="number-control"><span>£{offer}M</span><button onClick={()=>adjust(-1)}><Minus size={15}/></button><button onClick={()=>adjust(1)}><Plus size={15}/></button></div>
    <div className="toggle-row"><span>Add Installments</span><button className={inst?"on":""} onClick={()=>setInst(v=>!v)}><i/></button></div>
    <label className="field-label">Wage Offer</label><div className="number-control"><span>£{wage.toLocaleString()} p/w</span><button onClick={()=>setWage(Math.max(0,wage-10000))}><Minus size={15}/></button><button onClick={()=>setWage(wage+10000)}><Plus size={15}/></button></div>
    <label className="field-label">Contract Length</label><select value={years} onChange={e=>setYears(+e.target.value)} className="offer-select"><option value={3}>3 years</option><option value={4}>4 years</option><option value={5}>5 years</option><option value={6}>6 years</option></select>
    <button className="submit-offer" onClick={submit}>{submitted?<><Check size={17}/> Offer Submitted</>:<>Submit Offer <ArrowRight size={17}/></>}</button>
    <div className="competition"><h3>Competition</h3><div className="comp-head"><span>Club</span><span>Offer</span><span>Status</span></div>{competition.map((c,i)=><div className="comp-row" key={c[0]}><span><i className="comp-dot">{c[0].slice(0,1)}</i>{c[0]}</span><b>{c[1]}</b><em className={c[2].toLowerCase()}>{c[2]}</em></div>)}</div>
    <div className="offer-news"><h3><Newspaper size={16}/> Transfer News</h3><p>{player.club} are open to selling {player.name} this window, but expect a fee close to £{player.value}M.</p></div>
  </section>
}

export default function TransfersScreen(){
  const [selected,setSelected]=useState(transferPlayers[0]);
  const [tab,setTab]=useState("All");
  const [query,setQuery]=useState("");
  const [offer,setOffer]=useState(60);
  const [shortlisted,setShortlisted]=useState(new Set());
  const [news,setNews]=useState("Man Utd linked with Gyökeres deal");
  const tabs=["All","In","Out","Loan In","Loan Out"];
  const filtered=useMemo(()=>transferPlayers.filter(p=>{
    const matchTab=tab==="All"||(tab==="In"&&p.type==="Transfer")||(tab==="Loan In"&&p.type==="Loan")||(tab==="Out"&&false)||(tab==="Loan Out"&&false);
    const q=query.toLowerCase(); return matchTab && (!q || `${p.name} ${p.club} ${p.pos}`.toLowerCase().includes(q));
  }),[tab,query]);
  const choose=(p)=>{setSelected(p);setOffer(Math.max(1,p.value-10));};
  const addShortlist=()=>{setShortlisted(s=>{const n=new Set(s); if(n.has(selected.id))n.delete(selected.id); else n.add(selected.id); return n});setNews(`${selected.name} added to Manchester United shortlist`)};
  const submitOffer=()=>setNews(`Offer submitted for ${selected.name} — rival clubs are monitoring the deal`);
  return <>
    <div className="transfer-tabs"><button className="active">Transfer Centre</button><button>Player Search</button><button>Shortlist <span>{shortlisted.size||""}</span></button><button>Negotiations</button><button>Transfers</button><button>Loan List</button></div>
    <div className="transfer-budget"><div><span>Transfer Budget</span><b>£180,000,000</b></div><div><span>Wage Budget</span><b>£320,000 p/w</b></div><div><span>Available Funds</span><b>£45,600,000</b></div></div>
    <div className="transfer-toolbar"><div className="transfer-filter-tabs">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</div><div className="transfer-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search players, clubs, or positions..."/></div></div>
    <div className="transfer-main-grid">
      <div className="left-transfer"><PlayerList players={filtered} selected={selected} setSelected={choose} tab={tab}/><div className="bottom-transfer-grid"><section className="transfer-panel news-panel"><h3><Newspaper size={16}/> Latest News</h3><p><b>Man Utd</b> linked with Gyökeres deal <small>2 hours ago</small></p><p><b>Liverpool</b> make improved bid for Caicedo <small>4 hours ago</small></p><p><b>Chelsea</b> enter race for Wirtz <small>6 hours ago</small></p></section><section className="transfer-panel activity-panel"><h3><ArrowLeftRight size={16}/> Transfer Activity</h3><div className="activity-stats"><b>In <i>3</i></b><b>Out <i>2</i></b><b>Loan In <i>1</i></b><b>Loan Out <i>0</i></b></div><div className="activity-bar"><i/></div></section><section className="transfer-panel targets-panel"><h3><TrendingUp size={16}/> Top Targets</h3>{transferPlayers.slice(0,3).map((p,i)=><div key={p.id}><span>{i+1}</span><Avatar player={p}/><b>{p.name}</b><em>{p.pos}</em><strong>£{p.value}M</strong></div>)}</section></div></div>
      <PlayerDetails player={selected} onOffer={()=>document.querySelector('.offer-panel')?.scrollIntoView({behavior:'smooth',block:'start'})} onShortlist={addShortlist}/>
      <OfferPanel player={selected} offer={offer} setOffer={setOffer} onSubmit={submitOffer}/>
    </div>
    <div className="transfer-smart"><TrendingUp/><div><b>SMART TRANSFERS</b><span>BUILD GREAT TEAMS</span></div><strong>FAMILY <i>26</i></strong></div>
  </>
}
