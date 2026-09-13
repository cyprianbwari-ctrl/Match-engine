import React, { useState, useEffect } from 'react';
import {
  Dumbbell, CalendarDays, Users, Target, Activity, TrendingUp, TrendingDown,
  ShieldAlert, Sprout, FileText, Bot, ChevronRight, Send, UserRound,
  Crosshair, Gauge, HeartPulse, AlertTriangle, CheckCircle2, Sparkles
} from 'lucide-react';
import './training.css';
import { players as roster } from './data/roster.js';
import { roles as ROLE_OPTIONS } from './data/roster.js';
import { useTrainingData, SESSION_TYPES, SESSION_COACH_CATEGORY } from './store/TrainingContext.jsx';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useCommunicationData } from './store/CommunicationContext.jsx';
import { useStaffData } from './store/StaffContext.jsx';
import { useWorldData } from './store/WorldContext.jsx';
import { mapRosterPlayer } from './data/homeData.js';

function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <span className="tr-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>;
}
function Ring({ value, size = 70, color = '#3ddc84' }) {
  return <div className="tr-ring" style={{ width: size, height: size, background: `conic-gradient(${color} ${value * 3.6}deg, #1a2040 0)` }}>
    <div className="tr-ring-inner"><b>{value}%</b></div>
  </div>;
}
function coachFor(sessionType, staffList) {
  const cat = SESSION_COACH_CATEGORY[sessionType];
  return staffList.find(s => s.category === cat);
}

// ================= OVERVIEW =================

function Overview({ goTo }) {
  const { schedule, delegation, setDelegation, trainingEffectiveness, overloaded } = useTrainingData();
  const { league } = useCompetitionData();
  const { staffList } = useStaffData();
  const fixture = league.fixtures[0];
  const today = schedule[0];
  const coach = coachFor(today.type, staffList);
  const avgFit = Math.round(roster.reduce((a, p) => a + p.fit, 0) / roster.length);

  return <div className="tr-tab-page">
    <div className="tr-summary-row">
      <div className="tr-summary-card"><Gauge size={18} color="#3ddc84" /><div><b>{trainingEffectiveness}%</b><span>Training Effectiveness</span></div></div>
      <div className="tr-summary-card"><Activity size={18} color={overloaded.length ? '#ffb84d' : '#3ddc84'} /><div><b>{overloaded.length ? 'High' : 'Optimal'}</b><span>Squad Workload</span></div></div>
      <div className="tr-summary-card"><ShieldAlert size={18} color={overloaded.length > 3 ? '#ff5d5d' : '#3ddc84'} /><div><b>{overloaded.length > 3 ? 'Elevated' : 'Low'}</b><span>Injury Risk</span></div></div>
      <div className="tr-summary-card"><CalendarDays size={18} color="#4d9dff" /><div><b>{fixture.date}</b><span>Next Match vs {fixture.away === 'Man Utd' ? fixture.home : fixture.away}</span></div></div>
    </div>

    <div className="two-col">
      <section className="comm-card">
        <div className="comm-card-head"><Dumbbell size={16} color="#8a6bff" /><h3>Today's Training</h3><button className="link-btn" onClick={() => goTo('schedule')}>View Schedule</button></div>
        <div className="today-session">
          <div><b>{today.type}</b><span>{today.detail}</span></div>
          <span className="tr-time">{today.time}</span>
        </div>
        <div className="panel-label">Coach Responsible</div>
        <div className="coach-row"><Avatar name={coach?.name || 'Unassigned'} size={28} /><div><b>{coach?.name || 'No coach assigned'}</b><span>{coach?.category || '—'}</span></div></div>
        <div className="panel-label">This Week</div>
        <div className="week-strip">{schedule.map((d, i) => <div className="week-chip" key={i}><b>{d.day.split(' ')[0]}</b><span>{d.type}</span></div>)}</div>
      </section>

      <section className="comm-card">
        <div className="comm-card-head"><Bot size={16} color="#4d9dff" /><h3>Training Delegation</h3></div>
        <div className="deleg-switch">{['Manual', 'Assisted', 'Automatic'].map(lvl => <button key={lvl} className={delegation === lvl ? 'active' : ''} onClick={() => setDelegation(lvl)}>{lvl}</button>)}</div>
        <p className="muted-sub">
          {delegation === 'Manual' && 'You control the entire weekly schedule.'}
          {delegation === 'Assisted' && 'The assistant recommends sessions — you approve changes in Schedule.'}
          {delegation === 'Automatic' && 'The assistant manages the schedule, prioritising tactical work and set pieces as the next match approaches.'}
        </p>
        <div className="panel-label">Squad Averages</div>
        <div className="snapshot-rings">
          <div><Ring value={avgFit} color="#68ff2e" /><span>Fitness</span></div>
          <div><Ring value={trainingEffectiveness} color="#4d9dff" /><span>Sharpness</span></div>
        </div>
      </section>
    </div>
  </div>;
}

// ================= SCHEDULE =================

function Schedule() {
  const { schedule, setDaySession, delegation, applyAutoSchedule } = useTrainingData();
  const { league } = useCompetitionData();
  const { staffList } = useStaffData();
  const fixture = league.fixtures[0];
  const daysToMatch = fixture.date === 'Today' ? 0 : 3;

  useEffect(() => {
    if (delegation === 'Automatic') applyAutoSchedule(daysToMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegation]);

  return <div className="tr-tab-page">
    <div className="comm-card-head"><CalendarDays size={17} color="#4d9dff" /><h3>Training Schedule</h3><span className="muted-sub">Next match: {fixture.home} vs {fixture.away} · {fixture.date}</span>
      {delegation === 'Automatic' && <button className="link-btn" onClick={() => applyAutoSchedule(daysToMatch)}>Re-run Auto Schedule</button>}</div>
    <div className="schedule-grid">
      {schedule.map((d, i) => {
        const coach = coachFor(d.type, staffList);
        return <div className="schedule-card" key={i}>
          <b>{d.day}</b>
          <select value={d.type} disabled={delegation === 'Automatic'} onChange={e => setDaySession(i, e.target.value)}>
            {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input value={d.detail} disabled={delegation === 'Automatic'} onChange={e => setDaySession(i, d.type, e.target.value)} />
          <span className="tr-time">{d.time}</span>
          <div className="coach-tag"><UserRound size={12} />{coach?.name || 'Unassigned'}</div>
        </div>;
      })}
    </div>
    {delegation === 'Automatic' && <p className="muted-sub">Schedule is managed automatically — switch to Manual or Assisted in Overview to edit sessions directly.</p>}
  </div>;
}

// ================= INDIVIDUAL =================

function Individual({ onOpen }) {
  const { individualPlans, setPlan, FOCUS_OPTIONS } = useTrainingData();
  const [selectedId, setSelectedId] = useState(roster[0].id);
  const player = roster.find(p => p.id === selectedId);
  const plan = individualPlans[selectedId] || { focuses: [], developFor: '' };
  const roleChoices = ROLE_OPTIONS[player.pos] || [];

  const toggleFocus = (f) => {
    const focuses = plan.focuses.includes(f) ? plan.focuses.filter(x => x !== f) : [...plan.focuses, f];
    setPlan(selectedId, { ...plan, focuses });
  };

  return <div className="tr-tab-page">
    <div className="two-col">
      <section className="comm-card">
        <div className="comm-card-head"><Users size={16} color="#3ddc84" /><h3>Squad</h3></div>
        <div className="ind-list">{roster.map(p => <button className={`ind-row ${selectedId === p.id ? 'active' : ''}`} key={p.id} onClick={() => setSelectedId(p.id)}>
          <Avatar name={p.name} size={26} /><div><b>{p.name}</b><span>{p.displayPos} · Age {p.age}</span></div>
          {individualPlans[p.id]?.focuses?.length > 0 && <span className="plan-dot" />}
        </button>)}</div>
      </section>
      <section className="comm-card">
        <div className="comm-card-head"><Target size={16} color="#ffd76b" /><h3>Individual Development Plan</h3><button className="link-btn" onClick={() => onOpen(player)}>View Profile</button></div>
        <div className="ind-player-head"><Avatar name={player.name} size={48} /><div><b>{player.name}</b><span>{player.displayPos} · {player.roleLabel}</span></div></div>
        <div className="panel-label">Training Focus</div>
        <div className="focus-grid">{FOCUS_OPTIONS.map(f => <button key={f} className={`focus-chip ${plan.focuses.includes(f) ? 'active' : ''}`} onClick={() => toggleFocus(f)}>{f}</button>)}</div>
        <div className="panel-label">Develop Player For</div>
        <select value={plan.developFor} onChange={e => setPlan(selectedId, { ...plan, developFor: e.target.value })}>
          <option value="">— No specific role —</option>
          {roleChoices.map(r => <option key={r}>{r}</option>)}
        </select>
        {plan.developFor && <p className="muted-sub">Training will emphasise the attributes needed to play as a {plan.developFor}.</p>}
      </section>
    </div>
  </div>;
}

// ================= TACTICAL =================

function Tactical({ goTo }) {
  const [levels, setLevels] = useState({ 'Formation Familiarity': 74, 'Role Familiarity': 68, 'Team Cohesion': 71, 'Pressing Coordination': 62, 'Defensive Organisation': 70, 'Attacking Movements': 66, 'Set Pieces': 58 });
  const bump = (k) => setLevels(l => ({ ...l, [k]: Math.min(99, l[k] + 3) }));
  return <div className="tr-tab-page">
    <div className="comm-card-head"><Crosshair size={17} color="#8a6bff" /><h3>Tactical Training</h3><span className="muted-sub">Repeated sessions gradually build familiarity with your system in Tactics</span>
      <button className="link-btn" onClick={() => goTo('Tactics')}>Open Tactics</button></div>
    <section className="comm-card">
      {Object.entries(levels).map(([k, v]) => <div className="tactical-row" key={k}>
        <span>{k}</span>
        <div className="attr-track"><i style={{ width: `${v}%`, background: v >= 80 ? '#3ddc84' : v >= 60 ? '#ffd76b' : '#ff8a5c' }} /></div>
        <b>{v}%</b>
        <button className="train-btn" onClick={() => bump(k)}>Train</button>
      </div>)}
    </section>
  </div>;
}

// ================= DEVELOPMENT =================

function Development({ onOpen }) {
  const { developmentLog } = useTrainingData();
  return <div className="tr-tab-page">
    <div className="comm-card-head"><Sparkles size={17} color="#ffd76b" /><h3>Player Development</h3><span className="muted-sub">Attribute changes tracked over the last training period</span></div>
    <section className="comm-card">
      {developmentLog.map((d, i) => {
        const p = roster.find(r => r.id === d.playerId);
        return <button className="dev-row" key={i} onClick={() => p && onOpen(p)}>
          <Avatar name={d.name} size={30} /><b>{d.name}</b><span className="muted-sub">{d.attr}</span>
          <span className="dev-change">{d.before} → {d.after} <TrendingUp size={13} color="#3ddc84" /></span>
          <small>{d.date}</small>
        </button>;
      })}
    </section>
  </div>;
}

// ================= FITNESS & WORKLOAD =================

function Fitness() {
  const { playerTraining, reduceWorkload } = useTrainingData();
  return <div className="tr-tab-page">
    <div className="comm-card-head"><HeartPulse size={17} color="#ff5d5d" /><h3>Fitness & Workload</h3></div>
    <div className="fit-table">
      <div className="fit-row fit-head"><span>Player</span><span>Fitness</span><span>Sharpness</span><span>Workload</span><span>Injury Risk</span><span></span></div>
      {roster.map(p => {
        const t = playerTraining[p.id];
        const overloaded = t.workload >= 80;
        return <div className="fit-row" key={p.id}>
          <span className="fit-name"><Avatar name={p.name} size={26} /><b>{p.name}</b></span>
          <span>{p.fit}%</span>
          <span>{t.sharpness}%</span>
          <span className={overloaded ? 'workload-high' : ''}>{overloaded && <AlertTriangle size={12} />} {t.workload}%</span>
          <span className={`risk-${t.injuryRisk.toLowerCase()}`}>{t.injuryRisk}</span>
          <span>{overloaded && <button className="train-btn" onClick={() => reduceWorkload(p.id)}>Reduce Load</button>}</span>
        </div>;
      })}
    </div>
  </div>;
}

// ================= YOUTH =================

function Youth({ onOpen }) {
  const { youthPlayers } = useTrainingData();
  const ready = youthPlayers.filter(p => p.readyForFirstTeam);
  return <div className="tr-tab-page">
    <div className="comm-card-head"><Sprout size={17} color="#26c1a4" /><h3>Youth Training</h3></div>
    {ready.map(p => <div className="youth-alert" key={p.id}><CheckCircle2 size={14} color="#3ddc84" /> {p.name} is ready for first-team training</div>)}
    <section className="comm-card">
      {youthPlayers.map(p => <button className="youth-row" key={p.id} onClick={() => onOpen(p)}>
        <Avatar name={p.name} size={30} /><b>{p.name}</b><span className="muted-sub">{p.displayPos} · Age {p.age}</span>
        <div className="attr-track" style={{ width: 100 }}><i style={{ width: `${p.progress}%`, background: '#4d9dff' }} /></div>
        <span>{p.progress}%</span>
        {p.readyForFirstTeam && <span className="ready-tag">Ready</span>}
      </button>)}
    </section>
  </div>;
}

// ================= REPORTS =================

function Reports() {
  const { reports, addReport } = useTrainingData();
  const { addMessage } = useCommunicationData();
  const generate = () => {
    const text = 'Weekly training report: tactical familiarity and fitness both trending up.';
    addReport(text, 'positive');
    addMessage({ subject: 'Training Report', preview: text, tag: 'Staff', kind: 'staff', sender: 'Coaching Staff', actions: ['View'], link: { screen: 'Training' } });
  };
  return <div className="tr-tab-page">
    <div className="comm-card-head"><FileText size={17} color="#4d9dff" /><h3>Training Reports</h3><button className="link-btn" onClick={generate}><Send size={12} /> Generate & Send to Inbox</button></div>
    <section className="comm-card">
      {reports.map(r => <div className={`report-line ${r.type}`} key={r.id}>
        {r.type === 'positive' ? <TrendingUp size={14} color="#3ddc84" /> : <TrendingDown size={14} color="#ff8a5c" />}
        <span>{r.text}</span><small>{r.date}</small>
      </div>)}
    </section>
  </div>;
}

// ================= ROOT =================

const TABS = [['overview', 'Overview', Dumbbell], ['schedule', 'Schedule', CalendarDays], ['individual', 'Individual', Target],
['tactical', 'Tactical', Crosshair], ['development', 'Development', Sparkles], ['fitness', 'Fitness', HeartPulse],
['youth', 'Youth', Sprout], ['reports', 'Reports', FileText]];

export default function TrainingScreen({ setActive }) {
  const [tab, setTab] = useState('overview');
  const { openProfileFor } = useWorldData();
  const goTo = (screen) => setActive && setActive(screen);
  const onOpen = (p) => openProfileFor(mapRosterPlayer(p));

  return <div className="training-page">
    <div className="comm-header">
      <span className="comm-header-icon" style={{ background: 'linear-gradient(150deg,#3ddc84,#0f5c34)' }}><Dumbbell size={22} /></span>
      <div><h1>Training</h1><span>Develop players, prepare the team, and manage workload.</span></div>
    </div>
    <div className="comm-tabs">
      {TABS.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={15} />{label}</button>)}
    </div>
    {tab === 'overview' && <Overview goTo={setTab} />}
    {tab === 'schedule' && <Schedule />}
    {tab === 'individual' && <Individual onOpen={onOpen} />}
    {tab === 'tactical' && <Tactical goTo={goTo} />}
    {tab === 'development' && <Development onOpen={onOpen} />}
    {tab === 'fitness' && <Fitness />}
    {tab === 'youth' && <Youth onOpen={onOpen} />}
    {tab === 'reports' && <Reports />}
  </div>;
}
