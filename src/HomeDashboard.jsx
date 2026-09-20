import React, { useState } from 'react';
import {
  Trophy, CalendarDays, Users, ChevronRight, Crosshair, Dumbbell, Play,
  Cloud, Smile, Heart, Gauge, ShieldAlert, Ban, Eye, RotateCcw, Bot,
  Wrench, Binoculars, UserRound, ArrowLeftRight, Target, Clock3, CheckCircle2,
  Newspaper, Mail, Coins, Landmark, Globe2
} from 'lucide-react';
import './home.css';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useCommunicationData } from './store/CommunicationContext.jsx';
import { useStaffData } from './store/StaffContext.jsx';
import { useClubData } from './store/ClubContext.jsx';
import { useWorldData } from './store/WorldContext.jsx';
import { useDatabase } from './store/DatabaseContext.jsx';
import { mapRosterPlayer, todaysSchedule, matchPreparation, squadSnapshot, quickSimOptions } from './data/homeData.js';
import { stadium, financesSummary } from './data/clubData.js';
import { useSimulation } from './store/SimulationContext.jsx';
import { useTransfersData } from './store/TransfersContext.jsx';
import { useAIManagers } from './store/AIManagersContext.jsx';
import { useFinanceData } from './store/FinanceContext.jsx';

function Crest({ name, size = 34 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return <span className="home-crest" style={{ width: size, height: size, fontSize: size * 0.32, background: `radial-gradient(circle at 32% 28%, hsl(${hue} 70% 45%), hsl(${hue} 60% 20%) 70%, #05070f 130%)` }}>{initials}</span>;
}

function ResBadge({ r }) {
  const cls = r === 'W' ? 'w' : r === 'L' ? 'l' : 'd';
  return <span className={`res-badge ${cls}`}>{r}</span>;
}

function Ring({ value, size = 74, color = '#3ddc84', label }) {
  return <div className="ring" style={{ width: size, height: size, background: `conic-gradient(${color} ${value * 3.6}deg, #1a2040 0)` }}>
    <div className="ring-inner"><b>{label ?? `${value}%`}</b></div>
  </div>;
}

const SCHEDULE_ICON = { training: Dumbbell, meeting: Users, prep: Crosshair, match: Trophy };

// ================= CARDS =================

function NextMatchCard({ goTo }) {
  const { league } = useCompetitionData();
  const { careerClub, stadiums } = useDatabase();
  const fixture = league.fixtures[0];
  const venue = stadiums.find(s => String(s.stadiumId ?? s.id) === String(careerClub?.stadiumId)) || null;
  const us = league.table.find(r => r.us) || league.table[0] || { pos: 1 };
  const opp = league.table.find(r => r.club === fixture.away) || league.table.find(r => r.club === fixture.home);
  const ord = (n) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

  return <section className="home-card next-match-card">
    <div className="home-card-head"><Trophy size={17} color="#8a6bff" /><h3>Next Match</h3><span className="comp-pill">{fixture.comp}</span></div>
    <div className="nm-body">
      <div className="nm-photo">
        <div className="nm-vs-row">
          <div className="nm-team"><Crest name={fixture.home} size={56} /><b>{fixture.home}</b><span>{ord(us.pos)}</span></div>
          <b className="nm-vs">VS</b>
          <div className="nm-team"><Crest name={fixture.away} size={56} /><b>{fixture.away}</b><span>{opp ? ord(opp.pos) : ''}</span></div>
        </div>
      </div>
      <div className="nm-info">
        <div className="nm-info-row"><Landmark size={15} /><div><b>{venue?.name || careerClub?.name || 'Home Stadium'}</b><span>Capacity: {Number(venue?.capacity || 0).toLocaleString() || '—'}</span></div></div>
        <div className="nm-info-row"><CalendarDays size={15} /><div><b>{fixture.date}</b><span>{fixture.time}</span></div></div>
      </div>
      <div className="nm-prep">
        <div className="panel-label">Match Preparation</div>
        <div className="prep-bar"><i style={{ width: `${matchPreparation.percent}%` }} /><span>{matchPreparation.percent}%</span></div>
        {matchPreparation.checklist.map(c => <div className="prep-check" key={c}><CheckCircle2 size={14} color="#3ddc84" />{c}</div>)}
        <div className="nm-actions">
          <button className="nm-btn purple" onClick={() => goTo('Tactics')}><Crosshair size={14} />Go to Tactics</button>
          <button className="nm-btn green" onClick={() => goTo('Match')}><Play size={14} fill="currentColor" />Go to Match</button>
        </div>
      </div>
    </div>
  </section>;
}

function TodaysScheduleCard({ goTo }) {
  const { league } = useCompetitionData();
  const fixture = league.fixtures[0];
  const routeFor = { training: 'Training', meeting: 'Communications', prep: 'Tactics', match: 'Match' };
  const schedule = todaysSchedule.map(item => item.kind === 'match' && fixture
    ? { ...item, title: `${fixture.home} vs ${fixture.away}`, sub: league.name }
    : item);
  return <section className="home-card">
    <div className="home-card-head"><CalendarDays size={16} color="#4d9dff" /><h3>Today's Schedule</h3><button className="link-btn" onClick={() => goTo('Communications')}>View Calendar</button></div>
    <div className="panel-label">Sat, 14 Dec 2025</div>
    {schedule.map((s, i) => {
      const Icon = SCHEDULE_ICON[s.kind] || Clock3;
      return <button className="sched-row" key={i} onClick={() => goTo(routeFor[s.kind])}>
        <span className="sched-icon"><Icon size={15} /></span>
        <b>{s.time}</b>
        <div><b>{s.title}</b><span>{s.sub}</span></div>
        <ChevronRight size={14} />
      </button>;
    })}
  </section>;
}

function SquadSnapshotCard({ goTo }) {
  const { openProfileFor } = useWorldData();
  const { careerSquad: roster } = useDatabase();
  const openPlayer = (rosterId) => {
    const rp = roster.find(r => r.id === rosterId);
    if (rp) openProfileFor(mapRosterPlayer(rp), 'Home');
  };
  const unavailable = roster.filter(p => p.availability && p.availability !== 'Available');
  const s = {
    morale: 82,
    fitness: roster.length ? Math.round(roster.reduce((total, p) => total + (Number(p.fit) || 80), 0) / roster.length) : 0,
    formRating: 7.5,
    injuries: unavailable.filter(p => p.availability === 'Injured').map(p => ({ name: p.name, detail: p.availability, rosterId: p.id })),
    suspensions: unavailable.filter(p => p.availability === 'Suspended').map(p => ({ name: p.name, detail: p.availability, rosterId: p.id })),
    watchlist: roster.slice(0, 2).map(p => ({ name: p.name, detail: 'Available for selection', rosterId: p.id })),
    returning: [],
  };
  return <section className="home-card">
    <div className="home-card-head"><Users size={16} color="#3ddc84" /><h3>Squad Snapshot</h3><button className="link-btn" onClick={() => goTo('Squad')}>View Squad</button></div>
    <div className="snapshot-rings">
      <div><Ring value={s.morale} color="#68ff2e" /><span><Smile size={12} />Morale</span><b>Good</b></div>
      <div><Ring value={s.fitness} color="#4d9dff" /><span><Heart size={12} />Fitness</span><b>Good</b></div>
      <div><Ring value={s.formRating * 10} color="#ffd76b" label={s.formRating} /><span><Gauge size={12} />Form</span><b>Excellent</b></div>
    </div>
    <button className="snap-row" onClick={() => openPlayer(s.injuries[0]?.rosterId)}><ShieldAlert size={15} color="#ff6b6b" /><span>Injuries</span><b>{s.injuries.length}</b><small>{s.injuries[0]?.detail}</small><ChevronRight size={14} /></button>
    <button className="snap-row" onClick={() => openPlayer(s.suspensions[0]?.rosterId)}><Ban size={15} color="#ffb84d" /><span>Suspensions</span><b>{s.suspensions.length}</b><small>{s.suspensions[0]?.detail}</small><ChevronRight size={14} /></button>
    <button className="snap-row" onClick={() => openPlayer(s.watchlist[0]?.rosterId)}><Eye size={15} color="#4d9dff" /><span>Players to Watch</span><b>{s.watchlist.length}</b><ChevronRight size={14} /></button>
    <button className="snap-row" onClick={() => openPlayer(s.returning[0]?.rosterId)}><RotateCcw size={15} color="#3ddc84" /><span>Returning from Injury</span><b>{s.returning.length}</b><ChevronRight size={14} /></button>
  </section>;
}

function ClubStatusCard({ goTo }) {
  const { league, activeCompetitions } = useCompetitionData();
  const { budgets, financialStatus } = useFinanceData();
  const us = league.table.find(r => r.us) || league.table[0] || { pos: 1 };
  const ord = (n) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
  return <section className="home-card">
    <div className="home-card-head"><Trophy size={16} color="#ffd76b" /><h3>Club Status</h3><button className="link-btn" onClick={() => goTo('Club Dashboard')}>View Club</button></div>
    <button className="cs-league-row" onClick={() => goTo('Competitions')}><b>{ord(us.pos)}</b><span>{league.name}</span><ChevronRight size={14} /></button>
    <div className="panel-label">Current Competitions</div>
    {activeCompetitions.map(c => <button className="cs-comp-row" key={c.name} onClick={() => goTo('Competitions')}><span>{c.name}</span><b>{c.status}</b></button>)}
    <div className="panel-label">Finances</div>
    <button className="cs-fin-row" onClick={() => goTo('Finance')}><span>Transfer Budget</span><b>£{Math.round(budgets.available || 0).toLocaleString()}</b></button>
    <button className="cs-fin-row" onClick={() => goTo('Finance')}><span>Wage Budget</span><b>£{Math.round(budgets.wagesWeekly || 0).toLocaleString()}</b></button>
    <button className="cs-fin-row" onClick={() => goTo('Finance')}><span>Club Finances</span><b className="good">{financialStatus}</b></button>
    <div className="cs-fin-row"><span>Board Confidence</span><b className="good">High</b></div>
    <div className="cs-fin-row"><span>Squad Morale</span><b className="good">Good</b></div>
  </section>;
}


function ManagerCommandCentre({ goTo }) {
  const sim = useSimulation();
  const transfers = useTransfersData();
  const ai = useAIManagers();
  const pending = transfers.incomingOffers.filter(o => o.status === 'Pending').length;
  const negotiations = transfers.negotiations.filter(n => !['Completed','Withdrawn','Rejected'].includes(n.status)).length;
  return <section className="home-card command-centre">
    <div className="home-card-head"><Bot size={16} color="#b06bff" /><h3>Manager Command Centre</h3><span className="comp-pill">LIVE WORLD</span></div>
    <div className="command-grid">
      <button onClick={() => goTo('Squad')}><Users size={15}/><span>Squad</span><b>Review</b></button>
      <button onClick={() => goTo('Training')}><Dumbbell size={15}/><span>Training</span><b>Ready</b></button>
      <button onClick={() => goTo('Scouting')}><Binoculars size={15}/><span>Scouting</span><b>{transfers.targetIds.length} targets</b></button>
      <button onClick={() => goTo('Transfers')}><ArrowLeftRight size={15}/><span>Transfers</span><b>{negotiations} active</b></button>
      <button onClick={() => goTo('Communications')}><Mail size={15}/><span>Inbox</span><b>{pending} decisions</b></button>
      <button onClick={() => goTo('Competitions')}><Trophy size={15}/><span>League</span><b>{sim.daysUntilMatch === 0 ? 'Matchday' : `${sim.daysUntilMatch} days`}</b></button>
    </div>
    <div className="command-world"><span><Globe2 size={13}/>World activity</span><b>{ai.managers.length} AI managers active</b><small>{sim.worldPulse?.[0]?.text || 'Rival clubs continue to make decisions in the background.'}</small></div>
  </section>;
}

function RecentResultsFormCard({ goTo }) {
  const { league, form } = useCompetitionData();
  const { careerClub } = useDatabase();
  const clubName = careerClub?.name || 'Current Club';
  return <section className="home-card">
    <div className="home-card-head"><Trophy size={16} color="#4da6ff" /><h3>Recent Results & Form</h3><button className="link-btn" onClick={() => goTo('Competitions')}>View All</button></div>
    <div className="rr-body">
      <div className="rr-list">
        {league.results.map((r, i) => {
          const usHome = r.home === clubName;
          const [hs, as] = r.score.split(' - ').map(Number);
          const res = hs === as ? 'D' : (usHome ? hs > as : as > hs) ? 'W' : 'L';
          return <div className="rr-row" key={i}>
            <span className="fixture-team"><Crest name={r.home} size={22} /><b>{r.home}</b></span>
            <span className="rr-score">{r.score}</span>
            <span className="fixture-team right"><b>{r.away}</b><Crest name={r.away} size={22} /></span>
            <ResBadge r={res} />
          </div>;
        })}
      </div>
      <div className="rr-side">
        <div className="panel-label">Form</div>
        <div className="form-row">{form.map((r, i) => <ResBadge r={r} key={i} />)}</div>
        <div className="panel-label" style={{ marginTop: 10 }}>Next 3 Fixtures</div>
        {league.fixtures.slice(0, 3).map((f, i) => <div className="rr-fixture-row" key={i}><Crest name={f.home === clubName ? f.away : f.home} size={20} /><span>{f.home === clubName ? f.away : f.home}</span><small>{f.date}</small></div>)}
      </div>
    </div>
  </section>;
}

function WorldNewsCard({ goTo }) {
  const { newsItems } = useCommunicationData();
  return <section className="home-card">
    <div className="home-card-head"><Newspaper size={16} color="#b06bff" /><h3>World News</h3><button className="link-btn" onClick={() => goTo('Communications')}>View All</button></div>
    {newsItems.slice(0, 5).map(n => <button className="news-row" key={n.id} onClick={() => goTo(n.link?.screen || 'Communications')}>
      <Crest name={n.crest} size={30} />
      <div><b className="news-cat">{n.category}</b><span>{n.headline}</span><small>{n.time}</small></div>
      <ChevronRight size={14} />
    </button>)}
  </section>;
}

function InboxCard({ goTo }) {
  const { messages, unreadCount } = useCommunicationData();
  const ordered = [...messages].sort((a, b) => (b.unread === a.unread) ? 0 : b.unread ? 1 : -1).slice(0, 5);
  return <section className="home-card side-card">
    <div className="home-card-head"><Mail size={16} color="#8a6bff" /><h3>Inbox</h3>{unreadCount > 0 && <span className="new-pill">{unreadCount}</span>}<button className="link-btn" onClick={() => goTo('Communications')}>View All</button></div>
    {ordered.map(m => <button className="inbox-row-home" key={m.id} onClick={() => goTo(m.link?.screen || 'Communications')}>
      <span className={`inbox-dot ${m.tag.toLowerCase()}`} />
      <div><b>{m.subject}</b><span>{m.preview}</span></div>
      <small>{m.time}</small>
    </button>)}
  </section>;
}

const AM_ROWS = [
  ['Training', Dumbbell, 'training', 'club'],
  ['Scouting', Binoculars, 'scouting', 'club'],
  ['Staff Management', UserRound, 'assignments', 'staff'],
  ['Match Preparation', Target, 'tactical', 'club'],
  ['Transfers', ArrowLeftRight, 'transfers', 'club'],
];

function AssistantManagerCard({ goTo }) {
  const { delegation } = useStaffData();
  const { extraDelegation } = useClubData();
  return <section className="home-card side-card">
    <div className="home-card-head"><Bot size={17} color="#8a6bff" /><div><h3>Assistant Manager</h3><span className="muted-sub">Automation Status</span></div></div>
    {AM_ROWS.map(([label, Icon, key, src]) => {
      const val = src === 'staff' ? delegation[key] : extraDelegation[key];
      const isAuto = val === 'ASSISTANT';
      return <div className="am-row" key={label}>
        <span className="am-icon"><Icon size={14} /></span><span>{label}</span>
        <b className={isAuto ? 'good' : 'manual'}>{isAuto ? 'Automatic' : 'Manual'}</b>
      </div>;
    })}
    <button className="am-manage" onClick={() => goTo('Club Dashboard')}>Manage</button>
  </section>;
}

function QuickSimulationCard() {
  const [sel, setSel] = useState('day');
  const [toast, setToast] = useState('');
  const sim = useSimulation();
  const comms = useCommunicationData();
  return <section className="home-card side-card">
    <div className="home-card-head"><Clock3 size={17} color="#68ff2e" /><h3>Quick Simulation</h3></div>
    {quickSimOptions.map(o => <button key={o.key} className={`sim-row ${sel === o.key ? 'active' : ''}`} onClick={() => setSel(o.key)}>{o.label}</button>)}
    <button className="sim-continue" onClick={() => { sim.continueGame(comms); setToast(`Processing ${quickSimOptions.find(o => o.key === sel).label}...`); setTimeout(() => setToast(''), 1400); }}><Play size={15} fill="currentColor" />Continue</button>
    {toast && <div className="comm-toast">{toast}</div>}
  </section>;
}

// ================= ROOT =================

function SeasonEndBanner({ goTo }) {
  const { seasonComplete, seasonOutcome, advanceSeason, league } = useCompetitionData();
  if (!seasonComplete || !seasonOutcome) return null;
  const tone = seasonOutcome.outcome === 'promoted' ? 'good' : seasonOutcome.outcome === 'relegated' ? 'bad' : 'neutral';
  return <div className={`season-end-banner ${tone}`}>
    <div>
      <b>Season complete — {league.name}</b>
      <span>{seasonOutcome.label}</span>
    </div>
    <button onClick={() => advanceSeason()}>Start Next Season</button>
  </div>;
}

export default function HomeDashboard({ setActive }) {
  const { careerSquad: roster } = useDatabase();
  const goTo = (screen) => setActive && setActive(screen);
  return <div className="home-page">
    <div className="home-main">
      <SeasonEndBanner goTo={goTo} />
      <NextMatchCard goTo={goTo} />
      <div className="home-row-3">
        <TodaysScheduleCard goTo={goTo} />
        <SquadSnapshotCard goTo={goTo} />
        <ClubStatusCard goTo={goTo} />
      </div>
      <ManagerCommandCentre goTo={goTo} />
      <div className="home-row-2">
        <RecentResultsFormCard goTo={goTo} />
        <WorldNewsCard goTo={goTo} />
      </div>
    </div>
    <div className="home-side">
      <InboxCard goTo={goTo} />
      <AssistantManagerCard goTo={goTo} />
      <QuickSimulationCard />
    </div>
  </div>;
}
