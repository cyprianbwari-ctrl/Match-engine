import React, { useMemo, useState } from "react";
import {
  Search, Filter, ChevronDown, ChevronRight, Star, Eye, Clock3, Check,
  UserRound, Globe2, Map, Users, BriefcaseBusiness, FileText, Plus,
  ArrowRight, Target, Sparkles, TrendingUp, CircleDot, X
} from "lucide-react";
import "./scouting.css";
import { useStaffData } from "./store/StaffContext.jsx";

// Real-world identity/current-club data is kept separate from FAMILY26 game ratings.
// Current-season numbers shown in the selected-player panel are real football statistics.
const scoutPlayers = [
  { id: 1, name: "Jamal Musiala", pos: "AM", age: 23, nat: "🇩🇪", country: "Germany", club: "Bayern Munich", league: "Bundesliga", ovr: 88, pot: 93, status: "Shortlist", accent: "JM", stats: { apps: 3, mins: 190, goals: 1, assists: 1, shots: 7, pass: 88, value: "€120M", foot: "Right" }, report: "Elite creator with close control and game-breaking movement.", scout: "J. Carter", date: "10 Sep 2026", recommendation: "Highly Recommended" },
  { id: 2, name: "Victor Osimhen", pos: "ST", age: 27, nat: "🇳🇬", country: "Nigeria", club: "Galatasaray", league: "Süper Lig", ovr: 86, pot: 90, status: "In Progress", accent: "VO", stats: { apps: 4, mins: 302, goals: 6, assists: 2, shots: 35, pass: 74, value: "€73M", foot: "Right" }, report: "Explosive striker; elite finishing, pace and aerial threat.", scout: "J. Carter", date: "9 Sep 2026", recommendation: "Highly Recommended", injury: "Muscle injury · expected return October 2026" },
  { id: 3, name: "Rafael Leão", pos: "LW", age: 27, nat: "🇵🇹", country: "Portugal", club: "Galatasaray", league: "Süper Lig", ovr: 85, pot: 90, status: "Watching", accent: "RL", stats: { apps: 1, mins: 23, goals: 0, assists: 0, shots: 1, pass: 86, value: "€45M", foot: "Right" }, report: "Powerful wide forward with elite carrying and transition threat.", scout: "M. Silva", date: "8 Sep 2026", recommendation: "Good Potential" },
  { id: 4, name: "Alejandro Garnacho", pos: "LW", age: 22, nat: "🇦🇷", country: "Argentina", club: "Chelsea", league: "Premier League", ovr: 84, pot: 89, status: "Shortlist", accent: "AG", stats: { apps: 23, mins: 1430, goals: 1, assists: 3, shots: 31, pass: 79, value: "€45M", foot: "Right" }, report: "Direct winger who attacks space and isolates full-backs.", scout: "J. Carter", date: "7 Sep 2026", recommendation: "Recommended" },
  { id: 5, name: "Warren Zaïre-Emery", pos: "CM", age: 20, nat: "🇫🇷", country: "France", club: "Paris SG", league: "Ligue 1", ovr: 83, pot: 92, status: "Watching", accent: "WZ", stats: { apps: 3, mins: 214, goals: 0, assists: 0, shots: 2, pass: 91, value: "€78M", foot: "Right" }, report: "Press-resistant midfielder with exceptional maturity and passing.", scout: "M. Silva", date: "6 Sep 2026", recommendation: "Top Target" },
  { id: 6, name: "Joško Gvardiol", pos: "CB", age: 24, nat: "🇭🇷", country: "Croatia", club: "Man City", league: "Premier League", ovr: 82, pot: 87, status: "Shortlist", accent: "JG", stats: { apps: 5, mins: 345, goals: 1, assists: 0, shots: 3, pass: 85, value: "€75M", foot: "Left" }, report: "Modern defender comfortable defending space and progressing the ball.", scout: "D. Rossi", date: "5 Sep 2026", recommendation: "Top Target" },
  { id: 7, name: "Benjamin Šeško", pos: "ST", age: 23, nat: "🇸🇮", country: "Slovenia", club: "Man Utd", league: "Premier League", ovr: 81, pot: 91, status: "In Progress", accent: "BS", stats: { apps: 4, mins: 56, goals: 2, assists: 0, shots: 4, pass: 74, value: "€73M", foot: "Right" }, report: "High-upside striker with pace, height and elite box movement.", scout: "L. Fernandez", date: "4 Sep 2026", recommendation: "Interesting" },
  { id: 8, name: "Pedro Neto", pos: "RW", age: 26, nat: "🇵🇹", country: "Portugal", club: "Chelsea", league: "Premier League", ovr: 80, pot: 85, status: "Watching", accent: "PN", stats: { apps: 23, mins: 1500, goals: 5, assists: 7, shots: 32, pass: 81, value: "€52M", foot: "Left" }, report: "Fast, creative winger who creates chances from wide areas.", scout: "P. Mendes", date: "3 Sep 2026", recommendation: "Good Potential" },
  { id: 9, name: "Moisés Caicedo", pos: "CDM", age: 24, nat: "🇪🇨", country: "Ecuador", club: "Chelsea", league: "Premier League", ovr: 79, pot: 84, status: "Shortlist", accent: "MC", stats: { apps: 104, mins: 7900, goals: 5, assists: 6, shots: 42, pass: 89, value: "€80M", foot: "Right" }, report: "Ball-winning midfielder with elite recovery and defensive range.", scout: "J. Carter", date: "2 Sep 2026", recommendation: "Recommended" },
  { id: 10, name: "Jarrad Branthwaite", pos: "CB", age: 24, nat: "🏴", country: "England", club: "Everton", league: "Premier League", ovr: 78, pot: 83, status: "Watching", accent: "JB", stats: { apps: 85, mins: 7200, goals: 5, assists: 0, shots: 12, pass: 82, value: "€42M", foot: "Left" }, report: "Dominant left-footed centre-back with excellent aerial reach.", scout: "D. Rossi", date: "1 Sep 2026", recommendation: "Watching" }
];

const extraPlayers = [
  [11,"Florian Wirtz","AM",23,"🇩🇪","Bayer Leverkusen","Bundesliga",88,94,"Shortlist","FW","€110M"],
  [12,"Lamine Yamal","RW",19,"🇪🇸","Barcelona","La Liga",91,96,"Shortlist","LY","€200M"],
  [13,"William Saliba","CB",25,"🇫🇷","Real Madrid","La Liga",87,90,"Watching","WS","€90M"],
  [14,"Declan Rice","CM",27,"🏴","Arsenal","Premier League",86,88,"Shortlist","DR","€110M"],
  [15,"Khvicha Kvaratskhelia","LW",25,"🇬🇪","PSG","Ligue 1",86,90,"Watching","KK","€95M"],
  [16,"Martin Ødegaard","CM",27,"🇳🇴","Arsenal","Premier League",87,89,"In Progress","MO","€100M"],
  [17,"Rayan Cherki","AM",23,"🇫🇷","Man City","Premier League",81,89,"Watching","RC","€55M"],
  [18,"Nuno Mendes","LB",24,"🇵🇹","PSG","Ligue 1",86,90,"Shortlist","NM","€85M"],
  [19,"Rodri","CDM",30,"🇪🇸","Man City","Premier League",90,90,"Watching","R","€75M"],
  [20,"Michael Olise","RW",24,"🇫🇷","Bayern Munich","Bundesliga",86,91,"Shortlist","MO","€90M"]
].map(([id,name,pos,age,nat,club,league,ovr,pot,status,accent,value])=>({id,name,pos,age,nat,country:nat,club,league,ovr,pot,status,accent,stats:{apps:0,mins:0,goals:0,assists:0,shots:0,pass:0,value,foot:"Right"},report:"Scouting report pending detailed review.",scout:"J. Carter",date:"11 Sep 2026",recommendation:"Pending"}));

const allPlayers = [...scoutPlayers, ...extraPlayers];

function Portrait({ player, large = false }) {
  return <div className={`scout-portrait ${large ? "large" : ""}`}><span>{player.accent}</span></div>;
}

function StatusPill({ status }) {
  const icon = status === "Shortlist" ? <Star size={12} fill="currentColor"/> : status === "Watching" ? <Eye size={12}/> : <Clock3 size={12}/>;
  return <span className={`scout-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{icon}{status}</span>;
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="scout-filter"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={15}/></label>;
}

function ScoutTable({ players, selected, setSelected, page, setPage }) {
  const pages = Math.max(1, Math.ceil(players.length / 10));
  const visible = players.slice((page - 1) * 10, page * 10);
  return <section className="scout-panel scout-table-panel">
    <div className="scout-panel-title"><h2>Scouted Players ({players.length || 0})</h2><ChevronRight size={17}/></div>
    <div className="scout-table-head"><span>#</span><span>PLAYER</span><span>POS</span><span>AGE</span><span>NAT</span><span>CLUB</span><span>LEAGUE</span><span>OVR</span><span>POT</span><span>STATUS</span></div>
    {visible.map((p,i)=><button className={`scout-row ${selected.id===p.id?"selected":""}`} key={p.id} onClick={()=>setSelected(p)}>
      <span>{(page-1)*10+i+1}</span><span className="player-cell"><Portrait player={p}/><b>{p.name}</b></span><span><em className="pos-pill">{p.pos}</em></span><span>{p.age}</span><span>{p.nat}</span><span className="club-cell"><i>{p.accent.slice(0,1)}</i>{p.club}</span><span className="league-cell"><i>{p.league.slice(0,1)}</i>{p.league}</span><span><b className="rating-ring">{p.ovr}</b></span><span><b className="rating-ring">{p.pot}</b></span><span><StatusPill status={p.status}/></span>
    </button>)}
    <div className="scout-table-footer"><span>Showing {visible.length ? (page-1)*10+1 : 0}–{Math.min(page*10,players.length)} of {players.length} players</span><div className="pager"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button>{Array.from({length:Math.min(5,pages)},(_,i)=><button key={i} className={page===i+1?"current":""} onClick={()=>setPage(i+1)}>{i+1}</button>)}{pages>5&&<><span>…</span><button onClick={()=>setPage(pages)}>{pages}</button></>}<button onClick={()=>setPage(Math.min(pages,page+1))}>›</button></div></div>
  </section>;
}

function Reports({ players, setSelected }) {
  return <section className="scout-panel report-panel"><div className="scout-panel-title"><h2>Scout Reports</h2><button>View All <ChevronRight size={14}/></button></div>{players.slice(1,5).map(p=><button className="report-card" key={p.id} onClick={()=>setSelected(p)}><Portrait player={p}/><div><b>{p.name}</b><span>{p.pos} · {p.age} · {p.club}</span><strong className={`recommend ${p.recommendation.toLowerCase().replaceAll(" ","-")}`}>{p.recommendation}</strong><small>Report by: {p.scout}<br/>{p.date}</small></div><span className="report-more">•••</span></button>)}</section>;
}

function MiniPitch() {
  return <div className="mini-pitch"><div className="mini-center"/><i/><i/><i/><i/><i/><i/></div>;
}

function PlayerDetail({ player, onShortlist, shortlisted }) {
  const [tab,setTab] = useState("Overview");
  return <section className="scout-panel detail-panel">
    <div className="detail-hero"><Portrait player={player} large/><div><h2>{player.name}</h2><span>{player.pos} &nbsp;|&nbsp; Age {player.age} &nbsp;|&nbsp; {player.nat} {player.country}</span></div><b className="club-badge">{player.club}</b></div>
    <div className="detail-tabs">{["Overview","Attributes","Report"].map(x=><button className={tab===x?"active":""} key={x} onClick={()=>setTab(x)}>{x}</button>)}</div>
    {tab === "Overview" ? <>
      <div className="detail-section"><div className="ability-row"><span>Current Ability</span><b>★★★★<i>★</i></b><strong>{player.ovr}</strong></div><div className="ability-row"><span>Potential Ability</span><b>★★★★★</b><strong>{player.pot}</strong></div><div className="detail-line"><span>Value</span><b>{player.stats.value}</b></div><div className="detail-line"><span>Real-life season</span><b>{player.stats.apps} apps · {player.stats.goals} goals · {player.stats.assists} assists</b></div><div className="detail-line"><span>Minutes</span><b>{player.stats.mins}</b></div><div className="detail-line"><span>Preferred foot</span><b>{player.stats.foot}</b></div>{player.injury&&<div className="injury-note"><CircleDot size={14}/>{player.injury}</div>}</div>
      <div className="detail-attributes"><MiniPitch/><div><h3>Key Attributes</h3>{[["Finishing",player.id===2?94:88],["Composure",player.id===2?90:84],["Pace",player.id===2?94:90],["Strength",player.id===2?92:86],["Work Rate",player.id===2?88:82]].map(([n,v])=><div key={n}><span>{n}</span><b>{v}</b></div>)}<p>Source stats update from current real-world competition data.</p></div></div>
    </> : tab === "Attributes" ? <div className="attribute-grid">{["Finishing","Pace","Acceleration","Dribbling","Passing","Vision","Composure","Strength","Heading","Off The Ball","Work Rate","Ball Control"].map((x,i)=><div key={x}><span>{x}</span><b>{[94,94,96,91,78,82,90,92,88,93,86,92][i]}</b></div>)}</div> : <div className="report-full"><strong>{player.recommendation}</strong><p>{player.report}</p><p>Scout: {player.scout} · {player.date}</p>{player.injury&&<p>{player.injury}</p>}</div>}
    <div className="detail-actions"><button className="lime-action" onClick={onShortlist}><Star size={15} fill="currentColor"/>{shortlisted?"Shortlisted":"Add to Shortlist"}</button><button className="purple-action">Make Offer <ChevronRight size={16}/></button></div>
  </section>;
}

function MyScouts() {
  const scouts=["James Carter","Maria Silva","David Rossi"];
  return <section className="scout-panel my-scouts"><div className="my-head"><div><h2>My Scouts</h2><b>3<span>/5 Available</span></b></div><button>Manage Scouts</button></div><div className="scout-agent-grid">{scouts.map((s,i)=><div className="scout-agent" key={s}><Portrait player={{accent:s.split(" ").map(x=>x[0]).join("")}}/><div><b>{s}</b><span>{i===0?"Chief Scout":"Scout"}</span><small>{i===0?"South America":i===1?"Europe":"Asia"}</small></div><StatusPill status={i===1?"Shortlist":"In Progress"}/><em>{i===1?"0 reports":i===0?"4 reports":"3 reports"}</em><div className="agent-progress"><i style={{width:`${[72,38,60][i]}%`}}/></div></div>)}</div></section>;
}

function WorldScouting() {
  return <section className="scout-panel world-panel"><div className="scout-panel-title"><h2>World Scouting</h2><span>Top Regions</span></div><div className="world-body"><div className="world-map"><Map size={18}/><div className="continent c1"/><div className="continent c2"/><div className="continent c3"/><div className="continent c4"/><div className="continent c5"/></div><div className="regions">{[["Europe",42],["South America",28],["Asia",24],["Africa",16],["North America",12]].map(([r,v],i)=><div key={r}><b>{i+1}</b><span>{r}</span><em>{v}</em></div>)}<button>View Scouting World</button></div></div></section>;
}

function AssignmentsBoard() {
  const { scoutAssignments, addScoutAssignment, updateScoutAssignmentStatus } = useStaffData();
  const scoutNames = ["Marco Silva", "Carlos Mendes", "Sophie Lambert", "Kenji Tanaka", "Rasmus Højlund", "Lukas Weber", "Fatou Diop", "Steve McClaren"];
  const [scout, setScout] = useState(scoutNames[0]);
  const [region, setRegion] = useState("");
  const [focus, setFocus] = useState("");
  const [duration, setDuration] = useState(30);
  const submit = (e) => {
    e.preventDefault();
    if (!region.trim() || !focus.trim()) return;
    addScoutAssignment({ scout, region: region.trim(), focus: focus.trim(), duration: Number(duration) });
    setRegion(""); setFocus("");
  };
  return <section className="scout-panel assignments-board">
    <div className="scout-panel-title"><h2>Scout Assignments ({scoutAssignments.length})</h2><span>Shared with Staff → Scouting Staff</span></div>
    <form className="assignment-form" onSubmit={submit}>
      <select value={scout} onChange={e => setScout(e.target.value)}>{scoutNames.map(s => <option key={s}>{s}</option>)}</select>
      <input placeholder="Region / competition" value={region} onChange={e => setRegion(e.target.value)} />
      <input placeholder="Focus (e.g. U21 players)" value={focus} onChange={e => setFocus(e.target.value)} />
      <input type="number" min="5" max="120" value={duration} onChange={e => setDuration(e.target.value)} />
      <button type="submit">Assign</button>
    </form>
    <div className="assignment-head"><span>SCOUT</span><span>REGION</span><span>FOCUS</span><span>DURATION</span><span>STATUS</span></div>
    {scoutAssignments.map(a => <div key={a.id} className="assignment-row">
      <span className="player-cell"><Portrait player={{ accent: a.scout.split(" ").map(x => x[0]).join("") }} /><b>{a.scout}</b></span>
      <span>{a.region}</span><span>{a.focus}</span><span>{a.duration} days</span>
      <select value={a.status} onChange={e => updateScoutAssignmentStatus(a.id, e.target.value)}>
        {["In Progress", "On Track", "Delayed", "Completed"].map(s => <option key={s}>{s}</option>)}
      </select>
    </div>)}
  </section>;
}

function ScoutingScreen({ setActive }) {
  const [tab,setTab]=useState("Scouting");
  const [position,setPosition]=useState("All Positions");
  const [age,setAge]=useState("All Ages");
  const [nation,setNation]=useState("All Nations");
  const [league,setLeague]=useState("All Leagues");
  const [team,setTeam]=useState("All Clubs");
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState(scoutPlayers[1]);
  const [shortlisted,setShortlisted]=useState(false);
  const tabs=["Scouting","Search Players","Shortlist","Assignments","Scout Reports"];
  const filtered=useMemo(()=>allPlayers.filter(p=>{
    const q=query.trim().toLowerCase();
    return (!q||p.name.toLowerCase().includes(q)||p.club.toLowerCase().includes(q))
      && (position==="All Positions"||p.pos===position)
      && (age==="All Ages"||(age==="U21"&&p.age<=21)||(age==="22-25"&&p.age>=22&&p.age<=25)||(age==="26+"&&p.age>=26))
      && (nation==="All Nations"||p.nat===nation)
      && (league==="All Leagues"||p.league===league)
      && (team==="All Clubs"||p.club===team);
  }),[query,position,age,nation,league,team]);
  const updateFilter=(setter)=>value=>{setter(value);setPage(1)};
  const tabFiltered = tab==="Shortlist" ? filtered.filter(p=>p.status==="Shortlist") : filtered;
  if (tab === "Assignments") {
    return <div className="scouting-page">
      <div className="scouting-tabs">{tabs.map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
      <div className="scouting-columns single"><AssignmentsBoard/></div>
    </div>;
  }
  return <div className="scouting-page">
    <div className="scouting-tabs">{tabs.map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
    <div className="scouting-filters">
      <FilterSelect label="Position" value={position} onChange={updateFilter(setPosition)} options={["All Positions","GK","CB","LB","RB","CDM","CM","AM","LW","RW","ST"]}/>
      <FilterSelect label="Age" value={age} onChange={updateFilter(setAge)} options={["All Ages","U21","22-25","26+"]}/>
      <FilterSelect label="Nationality" value={nation} onChange={updateFilter(setNation)} options={["All Nations","🇩🇪","🇳🇬","🇵🇹","🇦🇷","🇫🇷","🇭🇷","🇸🇮","🇪🇨","🏴"]}/>
      <FilterSelect label="League" value={league} onChange={updateFilter(setLeague)} options={["All Leagues","Premier League","Bundesliga","Süper Lig","Ligue 1","La Liga"]}/>
      <FilterSelect label="Team" value={team} onChange={updateFilter(setTeam)} options={["All Clubs","Man Utd","Galatasaray","Chelsea","Bayern Munich","Paris SG","Man City","Everton"]}/>
      <div className="player-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search player name..."/><button onClick={()=>setPage(1)}>Search</button></div>
    </div>
    <div className="scouting-columns">
      <div className="scouting-left"><ScoutTable players={tabFiltered} selected={selected} setSelected={p=>{setSelected(p);setShortlisted(p.status==="Shortlist")}} page={page} setPage={setPage}/><div className="scouting-bottom"><MyScouts/><WorldScouting/></div></div>
      <div className="scouting-middle"><Reports players={tab==="Scout Reports"?tabFiltered:scoutPlayers} setSelected={p=>{setSelected(p);setShortlisted(p.status==="Shortlist")}}/></div>
      <div className="scouting-right"><PlayerDetail player={selected} shortlisted={shortlisted} onShortlist={()=>setShortlisted(true)}/></div>
    </div>
  </div>;
}

export default ScoutingScreen;
