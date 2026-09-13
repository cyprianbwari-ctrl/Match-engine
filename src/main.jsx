
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {Menu,Home,Users,Crosshair,Dumbbell,Search,ArrowLeftRight,UserRound,Coins,Trophy,Mail,CalendarDays,Globe2,UserSearch,Shield,Settings,Bell,Cloud,Play,Save,RotateCcw,ChevronRight,Target,Zap,BarChart3,Timer,Maximize2,Sparkles,Check,ClipboardList,X} from "lucide-react";
import "./styles.css";
import SquadPage from "./SquadPage.jsx";

const nav=[["Home",Home],["Squad",Users],["Tactics",Crosshair],["Training",Dumbbell],["Scouting",Search],["Transfers",ArrowLeftRight],["Staff",UserRound],["Finances",Coins],["Competitions",Trophy],["Inbox",Mail],["Calendar",CalendarDays],["Global Ranking",Globe2],["Player Search",UserSearch],["Club",Shield],["Settings",Settings]];
const players=[
["GK","André Onana","SK",7.3,91,50,90],["DR","Diogo Dalot","WB",7.0,96,84,75],["DC","Harry Maguire","CD",7.1,94,38,76],["DC","Lisandro Martínez","CD",7.3,92,62,76],["DL","Luke Shaw","FB",7.0,94,16,75],["MC","Casemiro","CM",7.3,95,39,58],["MC","Kobbie Mainoo","DLP",7.1,95,61,58],["AMC","Bruno Fernandes","AP",7.8,98,50,42],["AML","Marcus Rashford","IF",7.6,96,17,43],["AMR","Alejandro Garnacho","IW",7.2,93,83,43],["ST","Rasmus Højlund","AF",7.4,90,50,20]
];
function Crest({letters="MU",small=false}){return <div className={"crest "+(small?"small":"")}>{letters}</div>}
function Header(){return <header className="topbar"><div className="brand"><Menu/><div><b>FAMILY<span>26</span></b><small>BIGGER STRONGER TOGETHER</small></div></div><div className="club-head"><Crest/><div><strong>Manchester United</strong><span>Manager: Cyprian</span></div></div><div className="league-head">🏴<div><strong>Premier League</strong><span>England</span></div></div><div className="date-head"><strong>Sat, 14 Sep 2025</strong><span>15:42 ◷</span></div><div className="header-actions"><button><Cloud/> Cloud Save</button><Search/><div className="bell"><Bell/><i>3</i></div><button className="continue"><Play fill="currentColor"/> Continue</button></div></header>}
function Sidebar({active,setActive}){return <aside className="sidebar">{nav.map(([n,I])=><button className={active===n?"active":""} onClick={()=>setActive(n)} key={n}><I/><span>{n}</span>{n==="Inbox"&&<em>3</em>}</button>)}<div className="slogan">BIGGER<br/>STRONGER<br/><span>TOGETHER</span></div></aside>}

/* Existing Tactics/Formation screen — deliberately kept as its own implementation. */
function TacticsPage(){
 const [formation,setFormation]=useState("4-2-3-1"),[selected,setSelected]=useState(8);
 return <div className="tactics-page">
  <div className="tabs"><button className="active">Tactics</button><button>Formation</button><button>Player Instructions</button><button>Set Pieces</button><button>Opposition Instructions</button></div>
  <div className="workspace-head"><div className="formation-select"><Crosshair/><b>Square System {formation}</b><select value={formation} onChange={e=>setFormation(e.target.value)}>{["4-2-3-1","4-3-3","4-4-2","4-1-4-1","4-2-2-2","3-5-2","3-4-3","3-4-2-1","5-3-2","5-2-3","3-2-4-1","3-2-5","2-3-5","Custom"].map(x=><option key={x}>{x}</option>)}</select></div><button className="green-btn"><Save/> Save Tactic</button></div>
  <div className="tactic-grid">
   <div className="tactic-left"><TPanel title="Tactical Style"><b className="lime">Custom</b><p>Balanced, high pressing with possession focus.</p></TPanel><TPanel title="Mentality"><select><option>Positive</option><option>Very Defensive</option><option>Defensive</option><option>Balanced</option><option>Attacking</option><option>Very Attacking</option></select></TPanel><TPanel title="In Possession"><p>↗ Shorter Passing</p><p>↗ Play Out Of Defence</p><p>↗ Work Ball Into Box</p><p>↗ Higher Tempo</p></TPanel><TPanel title="In Transition"><p>↗ Counter Press</p><p>↗ Quick Transitions</p></TPanel><TPanel title="Out Of Possession"><p>↗ Higher Defensive Line</p><p>↗ High Press</p><p>↗ More Urgent</p></TPanel></div>
   <Pitch selected={selected} setSelected={setSelected}/>
   <div className="tactic-right"><div className="players-panel"><h3><Users/> Available Players</h3>{players.map((p,i)=><button className={selected===i?"selected-row":""} onClick={()=>setSelected(i)} key={p[1]}><span>{p[0]}</span><strong>{p[1]}</strong><em>{p[2]}</em><b>{p[4]}%</b><i>{p[3]}</i></button>)}</div><TPanel title="Player Role"><h2>{players[selected][1]}</h2><p>{players[selected][2]} · Attack</p><hr/><p>Key Instructions</p><p>✓ Cut Inside</p><p>✓ Take More Risks</p><p>✓ Get Further Forward</p></TPanel></div>
  </div>
  <div className="tactic-footer"><span><BarChart3/> Match Engine <b>Text + 2D (No 3D)</b></span><button><Play fill="currentColor"/></button><span>Speed　1x　2x　<strong>4x</strong>　8x</span><button><Save/> Save</button><button><RotateCcw/> Reset</button></div>
 </div>
}
function TPanel({title,children}){return <section className="tpanel"><h3><Sparkles/>{title}</h3>{children}</section>}
function Pitch({selected,setSelected}){return <div className="pitch"><div className="pitch-title"><b>4-2-3-1</b><select><option>Attacking</option><option>Balanced</option><option>Defensive</option></select></div><div className="pitch-lines">{players.map((p,i)=><button className={"token "+(selected===i?"sel":"")} style={{left:p[5]+"%",top:p[6]+"%"}} onClick={()=>setSelected(i)} key={p[1]}><b>{i+1}</b><span>{p[1].split(" ").slice(-1)}</span><small>{p[2]}</small><i>{p[3].toFixed(1)}</i></button>)}</div><div className="pitch-footer">◉ Team Fluidity <b>Flexible</b><Maximize2/></div></div>}

/* Homepage built from the supplied reference image. */
function HomePage({setActive}){
 const [day,setDay]=useState("1 day");
 const actions=[["Continue","Next match vs Brighton",Play,"Tactics"],["Team Selection","Pick your starting XI",Users,"Squad"],["Tactics","Manage formations & roles",Crosshair,"Tactics"],["Training","Plan sessions",Dumbbell,"Training"],["Scouting","Find new talent",Search,"Scouting"],["Transfers","Search & negotiate",ArrowLeftRight,"Transfers"]];
 return <div className="home">
  <section className="hero"><div className="hero-left"><Crest/><div><h1>Manchester United</h1><span>Premier League</span><div className="stars">★★★★<i>★</i></div></div></div><div className="quote">“Greatness is not a destination,<br/>it’s a mindset.”<small>- Sir Alex Ferguson</small></div></section>
  <div className="home-cols"><div>
   <div className="home-top">
    <section className="card next"><h2>Next Match</h2><p>Premier League - Matchday 4</p><div className="versus"><div><Crest/><b>Man Utd</b><small>Home</small></div><strong>VS</strong><div><Crest letters="BHA"/><b>Brighton</b><small>Away</small></div></div><div className="meta">▣ 14 Sep 2025　 ◷ 17:30</div><button className="green-wide" onClick={()=>setActive("Tactics")}>View Match</button></section>
    <section className="card league"><h2>♛ Premier League</h2>{[["1","Man City","3","7","9"],["2","Liverpool","3","6","9"],["3","Arsenal","3","5","7"],["4","Man Utd","3","4","7"],["5","Aston Villa","3","2","6"],["6","Tottenham","3","1","6"],["7","Chelsea","3","1","4"],["8","Newcastle","3","0","4"]].map((r,i)=><div className={i===3?"league-row current":"league-row"} key={r[0]}><b>{r[0]}</b><span>{r[1]}</span><span>{r[2]}</span><span>{r[3]}</span><b>{r[4]}</b></div>)}</section>
    <section className="card overview"><h2>Club Overview</h2><div className="overview-club"><Crest/><b>Manchester United</b></div><p>Squad Quality <b>★★★★½</b></p><p>Team Morale <b className="good">● Good</b></p><p>Board Confidence <b className="confidence">█████████░ 88%</b></p><p>Transfer Budget <b>£120,000,000</b></p><p>Wage Budget <b>£320,000/week</b></p></section>
   </div>
   <div className="home-bottom">
    <section className="card results"><h2>Recent Results</h2>{[["31 Aug 2025","Man Utd","2 - 1","Fulham","W"],["24 Aug 2025","Man Utd","1 - 1","Aston Villa","D"],["17 Aug 2025","Arsenal","1 - 0","Man Utd","L"],["10 Aug 2025","Man Utd","3 - 0","Bournemouth","W"],["5 Aug 2025","Man Utd","4 - 1","Liverpool","W"]].map(r=><div className="result" key={r[0]}><time>{r[0]}</time><span>{r[1]}</span><b>{r[2]}</b><span>{r[3]}</span><i className={r[4]}>{r[4]}</i><small>Premier League</small></div>)}</section>
    <section className="card keys"><h2>Key Players</h2><div className="keygrid">{[["Bruno Fernandes","MC","86","BF"],["Rasmus Højlund","ST","84","RH"],["Diogo Dalot","DR","82","DD"],["André Onana","GK","81","AO"]].map(p=><div className="key" key={p[0]}><div>{p[3]}</div><span><b>{p[0]}</b><small>{p[1]}</small><em>🇵🇹　<strong>{p[2]}</strong></em></span></div>)}</div></section>
    <section className="card quick"><h2>Quick Actions</h2>{actions.map(([a,b,I,target])=><button key={a} onClick={()=>setActive(target)}><I/><span><b>{a}</b><small>{b}</small></span><ChevronRight/></button>)}</section>
   </div>
  </div>
  <aside className="right"><section className="card news"><div className="sidehead"><h2>Latest News</h2><b>News</b></div>{[["10:24","De Ligt impresses in training","The defender looks sharp ahead of ..."],["09:12","Transfer window update","Several clubs show interest in our ..."],["Yesterday","Rashford returns to training","Marcus is back after a minor injury ..."],["Yesterday","Premier League fixtures","Full fixture list for September ..."],["12 Sep 2025","Youth academy talent shines","Young midfielder earns praise from ..."]].map(n=><button key={n[1]}><time>{n[0]}</time><span><b>{n[1]}</b><small>{n[2]}</small></span><ChevronRight/></button>)}</section>
  <section className="card comments"><h2>♥ Top Comments</h2>{[["@UnitedFanTV","2h","Big game coming up! Let’s get back to winning ways! ❤️ ⚽ #MUFC","1.2K","342","18"],["@FootballDaily","3h","Bruno Fernandes continues to be a difference maker. What a leader! 👏","980","210","12"],["@SkySports","4h","Manchester United look stronger this season. The squad depth is impressive.","754","186","8"]].map(c=><div className="comment" key={c[0]}><div className="comment-avatar">♥</div><div><b>{c[0]} <small>{c[1]}</small></b><p>{c[2]}</p><footer>♡ {c[3]}　♡ {c[4]}　♡ {c[5]}</footer></div><ChevronRight/></div>)}</section></aside></div>
  <div className="home-sim"><div><BarChart3/><span><b>Match Engine</b><small>Text + 2D (No 3D)</small></span></div><button className="round"><Play fill="currentColor"/></button><div className="speed"><small>Speed</small><button>1x</button><button>2x</button><button className="on">4x</button><button>8x</button></div><label>Highlights Only <input type="checkbox"/></label><div className="simtime"><Timer/><b>Simulate Time</b>{["1 day","1 week","1 month"].map(x=><button className={day===x?"on":""} onClick={()=>setDay(x)} key={x}>{x}</button>)}</div><div className="auto"><Cloud/><span><b>Auto-save enabled</b><small>Last saved: 14 Sep 2025, 15:30</small></span></div></div>
 </div>
}
function App(){const [active,setActive]=useState("Home");return <div className="app"><Header/><Sidebar active={active} setActive={setActive}/><main>{active==="Home"?<HomePage setActive={setActive}/>:active==="Tactics"?<TacticsPage/>:active==="Squad"?<SquadPage setActive={setActive}/>:<div className="placeholder"><h1>{active}</h1><p>This section is ready for the next implementation pass.</p></div>}</main></div>}
createRoot(document.getElementById("root")).render(<App/>);
