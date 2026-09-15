import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import {
  Home, Users, Crosshair, Dumbbell, Search, ArrowLeftRight, UserRound,
  Coins, Trophy, Mail, CalendarDays, Globe2, UserSearch, Shield, Settings,
  Menu, Bell, Cloud, Play, MessageSquare, Tv
} from "lucide-react";
import "./styles.css";
import HomeDashboard from "./HomeDashboard.jsx";
import SquadScreen from "./Squad.jsx";
import TrainingScreen from "./Training.jsx";
import ScoutingScreen from "./Scouting.jsx";
import TransfersScreen from "./Transfers.jsx";
import StaffScreen from "./Staff.jsx";
import FinanceScreen from "./Finance.jsx";
import TacticsScreen from "./Tactics.jsx";
import CompetitionsScreen from "./Competitions.jsx";
import CommunicationsScreen from "./Communications.jsx";
import WorldScreen from "./World.jsx";
import { PlayerProfileModal } from "./World.jsx";
import ClubScreen from "./Club.jsx";
import MatchScreen from "./Match.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import SimulationWindow from "./SimulationWindow.jsx";
import MatchdayScreen from "./Matchday.jsx";
import SettingsScreen from "./Settings.jsx";
import { SaveProvider, useSaveData } from "./store/SaveContext.jsx";
import { StaffProvider } from "./store/StaffContext.jsx";
import { CompetitionProvider, useCompetitionData } from "./store/CompetitionContext.jsx";
import { CommunicationProvider, useCommunicationData } from "./store/CommunicationContext.jsx";
import { WorldProvider } from "./store/WorldContext.jsx";
import { ClubProvider } from "./store/ClubContext.jsx";
import { TrainingProvider } from "./store/TrainingContext.jsx";
import { TacticsProvider } from "./store/TacticsContext.jsx";
import { SimulationProvider, useSimulation } from "./store/SimulationContext.jsx";
import { TransfersProvider } from "./store/TransfersContext.jsx";
import { FinanceProvider } from "./store/FinanceContext.jsx";
import { PlayerStateProvider } from "./store/PlayerStateContext.jsx";
import { ManagerProvider } from "./store/ManagerContext.jsx";
import { ClubStateProvider } from "./store/ClubStateContext.jsx";

const nav = [
  ["Home",Home],["Squad",Users],["Tactics",Crosshair],["Training",Dumbbell],
  ["Scouting",Search],["Transfers",ArrowLeftRight],["Staff",UserRound],
  ["Finance",Coins],["Competitions",Trophy],["Communications",MessageSquare],
  ["World",Globe2],["Club Dashboard",Shield],["Settings",Settings]
];

function Crest({letters="MU", small=false}) {
  return <div className={`crest ${small?"small":""}`}>{letters}</div>
}

function Header({ onMenuClick, onSearchClick, setActive }) {
  const sim = useSimulation();
  const save = useSaveData();
  const { league, simulateMatchday } = useCompetitionData();
  const { unreadCount, addMessage, addNews } = useCommunicationData();

  const fixture = league.fixtures[0];
  const oppShort = fixture ? (fixture.home === 'Man Utd' ? fixture.away : fixture.home) : '—';

  const handleContinue = () => {
    if (sim.phase === 'matchday') { setActive('Matchday'); return; }
    sim.openSimWindow();
  };

  return <header className="topbar">
    <button className="menu-btn" onClick={onMenuClick}><Menu size={26}/></button>
    <button className="brand" onClick={()=>!sim.matchLocked && setActive('Home')} style={sim.matchLocked?{cursor:'default'}:undefined}><div><b>FAMILY<span>26</span></b><small>BIGGER STRONGER TOGETHER</small></div></button>
    <div className="club-head"><Crest/><div><strong>Manchester United</strong><span>Manager: Cyprian</span></div></div>
    <div className="competition-head"><Trophy size={21}/><div><strong>Premier League</strong><span>🏴 England</span></div></div>
    <div className="header-spacer"/>
    <div className="date-block"><CalendarDays size={17}/><div>{sim.dateLabel}<span>{sim.timeLabel}</span></div></div>
    <div className="status-pill"><i className={sim.gameStatus.pulse ? 'pulse' : ''} style={{background:sim.gameStatus.color}}/><span style={{color:sim.gameStatus.color}}>{sim.matchLocked ? 'Match In Progress' : sim.gameStatus.label}</span></div>
    {!sim.liveMatch && !sim.matchLocked && <button className="cloud-save-block" onClick={()=>setActive('Settings')} title="Auto-save enabled"><Cloud size={19}/><div>Cloud Save<span>{save.lastSavedAt ? `Saved ${save.lastSavedAt.toLocaleTimeString().slice(0,5)}` : `Saved ${sim.lastSavedAt}`}</span></div></button>}
    <button className="search-btn" onClick={onSearchClick} disabled={sim.matchLocked} style={sim.matchLocked?{opacity:.35,cursor:'default'}:undefined}><Search size={21}/></button>
    <div className="bell"><Bell size={21}/>{unreadCount>0 && !sim.matchLocked && <i>{unreadCount}</i>}</div>
    {sim.matchLocked
      ? <button className="view-match-btn" disabled><Tv size={16}/> In Match</button>
      : sim.liveMatch
      ? <button className="view-match-btn" onClick={()=>setActive('Match')}><Tv size={16}/> View Match</button>
      : <button className="continue" onClick={handleContinue}><Play size={15} fill="currentColor"/> Continue <small>Next: {sim.phase==='matchday' ? oppShort : sim.nextLabel}</small></button>}
  </header>
}

function Sidebar({active,setActive,collapsed}) {
  const { unreadCount } = useCommunicationData();
  const sim = useSimulation();
  return <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${sim.matchLocked ? 'sidebar-locked' : ''}`} inert={sim.matchLocked || undefined}>
    {nav.map(([label,Icon])=><button key={label} className={active===label?"active":""} onClick={()=>setActive(label)}><Icon size={21}/><span>{label}</span>{label==="Communications"&&unreadCount>0&&<em>{unreadCount}</em>}</button>)}
    <div className="slogan">BIGGER<br/>STRONGER<br/><span>TOGETHER</span></div>
  </aside>
}

function MainArea({ children }) {
  const sim = useSimulation();
  return <main className={sim.simWindowOpen ? 'main-disabled' : ''} inert={sim.simWindowOpen || undefined}>{children}</main>;
}

function RecoveryPrompt() {
  const { recovery, recoverSession, discardRecovery } = useSaveData();
  if (!recovery) return null;
  const savedTime = recovery.savedAt ? new Date(recovery.savedAt).toLocaleString() : 'Unknown time';
  return <div className="recovery-backdrop">
    <div className="recovery-panel">
      <h2>RECOVER CAREER?</h2>
      <p>An unsaved session was detected.</p>
      <div className="recovery-date">{recovery.dateLabel || savedTime}</div>
      <div className="recovery-actions">
        <button className="recovery-discard" onClick={discardRecovery}>Discard</button>
        <button className="recovery-recover" onClick={recoverSession}>Recover</button>
      </div>
    </div>
  </div>;
}

function App() {
  const [active,setActive]=useState("Home");
  const [searchOpen,setSearchOpen]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const navigateTo = (screen) => setActive(screen);

  return <StaffProvider><CompetitionProvider><CommunicationProvider><WorldProvider><ClubProvider><ClubStateProvider><TrainingProvider><PlayerStateProvider><TacticsProvider><FinanceProvider><TransfersProvider><ManagerProvider><SimulationProvider onGoToMatch={()=>setActive('Match')}><SaveProvider><div className="app">
    <Header onMenuClick={()=>setSidebarCollapsed(c=>!c)} onSearchClick={()=>setSearchOpen(true)} setActive={setActive}/>
    <Sidebar active={active} setActive={setActive} collapsed={sidebarCollapsed}/>
    <MainArea>
      {active==="Home"
        ? <HomeDashboard setActive={setActive}/>
        : active==="Squad"
          ? <SquadScreen setActive={setActive}/>
        : active==="Training"
          ? <TrainingScreen setActive={setActive}/>
          : active==="Scouting"
            ? <ScoutingScreen setActive={setActive}/>
            : active==="Transfers"
              ? <TransfersScreen setActive={setActive}/>
              : active==="Staff"
                ? <StaffScreen active={active} setActive={setActive}/>
                : active==="Finance"
                  ? <FinanceScreen setActive={setActive}/>
                : active==="Competitions"
                  ? <CompetitionsScreen/>
                : active==="Communications"
                  ? <CommunicationsScreen setActive={setActive}/>
                : active==="World"
                  ? <WorldScreen setActive={setActive}/>
                : active==="Club Dashboard"
                  ? <ClubScreen setActive={setActive}/>
                : active==="Match"
                  ? <MatchScreen setActive={setActive}/>
                : active==="Matchday"
                  ? <MatchdayScreen setActive={setActive}/>
                : active==="Settings"
                  ? <SettingsScreen setActive={setActive}/>
                : <TacticsScreen setActive={setActive}/>}
    </MainArea>
    <PlayerProfileModal goTo={setActive}/>
    <SimulationWindow goTo={setActive}/>
    <RecoveryPrompt/>
    <GlobalSearch open={searchOpen} onClose={()=>setSearchOpen(false)} navigateTo={navigateTo}/>
  </div></SaveProvider></SimulationProvider></ManagerProvider></TransfersProvider></FinanceProvider></TacticsProvider></PlayerStateProvider></TrainingProvider></ClubStateProvider></ClubProvider></WorldProvider></CommunicationProvider></CompetitionProvider></StaffProvider>
}
createRoot(document.getElementById("root")).render(<App/>);
