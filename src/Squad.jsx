import React, { useState, useMemo } from 'react';
import {
  Users, Search as SearchIcon, TrendingUp, TrendingDown, Minus, ChevronRight,
  Crown, ShieldCheck, Repeat2, Wrench, Sprout, LifeBuoy, Bot, UserPlus,
  Crosshair, CalendarDays, Flag, FileText, AlertTriangle, Info, Star
} from 'lucide-react';
import './squad.css';
import { players as roster } from './data/roster.js';
import { useWorldData } from './store/WorldContext.jsx';
import { useStaffData } from './store/StaffContext.jsx';
import { useClubData } from './store/ClubContext.jsx';
import { mapRosterPlayer } from './data/homeData.js';

// ---------- Shared bits ----------

function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <span className="sq-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>;
}

const MORALE_EMOJI = { Good: '🙂', Okay: '😐', Unhappy: '😠' };
function MoraleIcon({ morale }) { return <span className="morale-emoji" title={morale}>{MORALE_EMOJI[morale] || '😐'}</span>; }

function FormDots({ form }) {
  const trend = form[form.length - 1] >= form[form.length - 2] ? 'up' : 'down';
  return <span className="form-cell">
    {trend === 'up' ? <TrendingUp size={12} color="#3ddc84" /> : <TrendingDown size={12} color="#ff6b6b" />}
    <span className="form-dots">{form.map((v, i) => <i key={i} style={{ background: v >= 7.3 ? '#3ddc84' : v >= 6.8 ? '#a6e22e' : v >= 6.2 ? '#ffd76b' : '#ff6b6b' }} />)}</span>
  </span>;
}

function FitCell({ fit }) {
  const Icon = fit >= 88 ? TrendingUp : fit >= 78 ? Minus : TrendingDown;
  const color = fit >= 88 ? '#3ddc84' : fit >= 78 ? '#ffd76b' : '#ff6b6b';
  return <span className="fit-cell" style={{ color }}><Icon size={12} />{fit}%</span>;
}

function StatusDot({ availability }) {
  const color = availability === 'Injured' ? '#ff5d5d' : availability === 'Suspended' ? '#ffb84d' : '#3ddc84';
  return <span className="status-cell"><i style={{ background: color }} />{availability}</span>;
}

const BUCKETS = [['GK', 'GK'], ['DEF', 'DEF'], ['MID', 'MID'], ['ATT', 'ATT'], ['ALL', 'ALL']];

// ================= TABLE (shared by Overview / First Team / Youth) =================

function SquadTable({ rows, onOpen }) {
  return <div className="squad-table">
    <div className="sq-row sq-head"><span>#</span><span>Name</span><span>Pos</span><span>Age</span><span>OVR</span><span>Form</span><span>Fitness</span><span>Morale</span><span>Play Time</span><span>Contract</span><span>Wage</span><span>Status</span></div>
    <div className="sq-body">
      {rows.map(p => <button className="sq-row sq-player-row" key={p.id} onClick={() => onOpen(p)}>
        <span className="sq-number">{p.number}</span>
        <span className="sq-name-cell"><Avatar name={p.name} /><div><b className="sq-name">{p.name}</b><small>{p.nat}</small></div></span>
        <span>{p.displayPos}</span>
        <span>{p.age}</span>
        <span><span className="ovr-badge" style={{ borderColor: p.ovr >= 85 ? '#3ddc84' : p.ovr >= 78 ? '#ffd76b' : '#8f9abb', color: p.ovr >= 85 ? '#3ddc84' : p.ovr >= 78 ? '#ffd76b' : '#c8d0e6' }}>{p.ovr}</span></span>
        <span><FormDots form={p.form} /></span>
        <span><FitCell fit={p.fit} /></span>
        <span><MoraleIcon morale={p.morale} /></span>
        <span className="playtime-cell">{p.playTime}</span>
        <span>{p.contract}</span>
        <span>{p.wage}</span>
        <span><StatusDot availability={p.availability} /></span>
      </button>)}
      {rows.length === 0 && <p className="muted-sub" style={{ padding: 14 }}>No players match this view.</p>}
    </div>
  </div>;
}

// ================= OVERVIEW EXTRAS =================

function SquadRolesCard() {
  const counts = useMemo(() => {
    const c = {};
    roster.forEach(p => { c[p.playTime] = (c[p.playTime] || 0) + 1; });
    return c;
  }, []);
  const rows = [['Key Player', Crown, '#ffd76b'], ['First Team', ShieldCheck, '#3ddc84'], ['Rotation', Repeat2, '#4d9dff'],
  ['Backup', Wrench, '#8f9abb'], ['Prospect', Sprout, '#b06bff'], ['Youth', Sprout, '#26c1a4'], ['Emergency', LifeBuoy, '#ff8a5c']];
  return <section className="sq-card">
    <div className="sq-card-head"><Crown size={16} color="#ffd76b" /><h3>Squad Roles</h3></div>
    {rows.map(([label, Icon, color]) => <div className="role-row" key={label}><Icon size={13} color={color} /><span>{label}</span><b>{counts[label] || 0}</b></div>)}
    <button className="sq-btn">Manage Roles</button>
  </section>;
}

function SquadManagementCard() {
  const issues = useMemo(() => {
    const list = [];
    const rbCount = roster.filter(p => p.displayPos === 'RB').length;
    if (rbCount < 2) list.push({ text: 'No natural backup for RB', level: 'danger' });
    const unhappy = roster.filter(p => p.morale === 'Unhappy');
    if (unhappy.length) list.push({ text: `Player unhappy with playing time (${unhappy.map(p => p.name).join(', ')})`, level: 'warn' });
    const expiring = roster.filter(p => p.contract === 'Jun 2025' || p.contract === 'Jun 2026');
    if (expiring.length) list.push({ text: `Contract expires soon (${expiring.length})`, level: 'warn' });
    const fitConcern = roster.filter(p => p.fit < 78);
    if (fitConcern.length) list.push({ text: `Player fitness concern (${fitConcern.length})`, level: 'warn' });
    const cmCount = roster.filter(p => p.displayPos === 'CM').length;
    if (cmCount > 4) list.push({ text: `Too many players for CM (${cmCount})`, level: 'info' });
    return list;
  }, []);
  const iconFor = { danger: <AlertTriangle size={13} color="#ff5d5d" />, warn: <AlertTriangle size={13} color="#ffb84d" />, info: <Info size={13} color="#4d9dff" /> };
  return <section className="sq-card">
    <div className="sq-card-head"><AlertTriangle size={16} color="#ffb84d" /><h3>Squad Management</h3></div>
    {issues.map((i, idx) => <div className="issue-row" key={idx}>{iconFor[i.level]}<span>{i.text}</span></div>)}
    {issues.length === 0 && <p className="muted-sub">No squad issues detected.</p>}
    <button className="sq-btn">View Full Report</button>
  </section>;
}

function SquadStatisticsCard() {
  const stats = [['Goals', 84], ['Assists', 56], ['Appearances', 547], ['Minutes', '49,230'], ['Average Rating', 7.2],
  ['Clean Sheets', 18], ['Yellow / Red Cards', '48 / 3'], ['Injuries', 12]];
  return <section className="sq-card">
    <div className="sq-card-head"><FileText size={16} color="#4d9dff" /><h3>Squad Statistics</h3></div>
    {stats.map(([label, val]) => <div className="stat-row" key={label}><span>{label}</span><b>{val}</b></div>)}
    <button className="sq-btn">View Detailed Stats</button>
  </section>;
}

function AssistantManagerCard({ goTo }) {
  const { delegation } = useStaffData();
  const { extraDelegation } = useClubData();
  const rows = [
    ['Squad rotation', extraDelegation.tactical], ['Rest tired players', extraDelegation.training],
    ['Youth promotion', delegation.assignments], ['Emergency replacements', extraDelegation.transfers],
    ['Squad registration', delegation.recruitment], ['Identifying weak positions', extraDelegation.scouting],
    ['Managing playing time', extraDelegation.tactical], ['Transfer/loan recommendations', extraDelegation.transfers],
  ];
  return <section className="sq-card">
    <div className="sq-card-head"><Bot size={16} color="#8a6bff" /><div><h3>Assistant Manager</h3><span className="muted-sub">Automatic Squad Management</span></div></div>
    {rows.map(([label, val], i) => <div className="am-row-sq" key={i}>
      {val === 'ASSISTANT' ? <ShieldCheck size={13} color="#3ddc84" /> : <AlertTriangle size={13} color="#8f9abb" />}
      <span>{label}</span><b className={val === 'ASSISTANT' ? 'good' : 'manual'}>{val === 'ASSISTANT' ? 'Automatic' : 'Manual'}</b>
    </div>)}
    <button className="sq-btn" onClick={() => goTo('Club Dashboard')}>Manage Settings</button>
  </section>;
}

function QuickActionsCard({ goTo }) {
  const actions = [
    ['Add Player', UserPlus, () => goTo('Transfers')],
    ['Open Tactics', Crosshair, () => goTo('Tactics')],
    ['Team Meeting', CalendarDays, () => goTo('Communications')],
    ['Set Set-Piece Takers', Flag, () => goTo('Tactics')],
    ['View Contracts', FileText, () => goTo('Finance')],
  ];
  return <section className="sq-card">
    <div className="sq-card-head"><Users size={16} color="#3ddc84" /><h3>Quick Actions</h3></div>
    {actions.map(([label, Icon, fn]) => <button className="qa-row" key={label} onClick={fn}><Icon size={14} />{label}</button>)}
  </section>;
}

// ================= TABS =================

function Overview({ onOpen, goTo }) {
  const [bucket, setBucket] = useState('ALL');
  const [query, setQuery] = useState('');
  const rows = roster.filter(p => (bucket === 'ALL' || p.bucket === bucket) && p.name.toLowerCase().includes(query.toLowerCase()));
  const counts = { GK: roster.filter(p => p.bucket === 'GK').length, DEF: roster.filter(p => p.bucket === 'DEF').length, MID: roster.filter(p => p.bucket === 'MID').length, ATT: roster.filter(p => p.bucket === 'ATT').length, ALL: roster.length };

  return <div className="squad-tab-page">
    <div className="sq-toolbar">
      <div className="bucket-pills">{BUCKETS.map(([id, label]) => <button key={id} className={bucket === id ? 'active' : ''} onClick={() => setBucket(id)}>{label}<em>{counts[id]}</em></button>)}</div>
      <div className="sq-search"><SearchIcon size={14} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search player..." /></div>
    </div>
    <SquadTable rows={rows} onOpen={onOpen} />
    <div className="sq-bottom-grid">
      <SquadRolesCard />
      <SquadManagementCard />
      <SquadStatisticsCard />
      <AssistantManagerCard goTo={goTo} />
      <QuickActionsCard goTo={goTo} />
    </div>
  </div>;
}

function FirstTeam({ onOpen, goTo }) {
  const rows = roster.filter(p => ['Key Player', 'First Team', 'Squad Player'].includes(p.playTime));
  return <div className="squad-tab-page">
    <div className="comm-card-head"><ShieldCheck size={17} color="#3ddc84" /><h3>First Team</h3><span className="muted-sub">{rows.length} players considered first-team regulars</span>
      <button className="link-btn" onClick={() => goTo('Tactics')}>Send XI to Tactics</button></div>
    <SquadTable rows={rows} onOpen={onOpen} />
  </div>;
}

function Youth({ onOpen }) {
  const rows = roster.filter(p => p.playTime === 'Youth' || p.playTime === 'Prospect' || p.age <= 20);
  return <div className="squad-tab-page">
    <div className="comm-card-head"><Sprout size={17} color="#26c1a4" /><h3>Youth & U21</h3><span className="muted-sub">{rows.length} academy and development players</span></div>
    <SquadTable rows={rows} onOpen={onOpen} />
  </div>;
}

function PlayerSearchTab({ onOpen, goTo }) {
  const [filters, setFilters] = useState({ name: '', pos: 'All', minOvr: 0, maxAge: 40, morale: 'All', availability: 'All' });
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const positions = ['All', ...new Set(roster.map(p => p.displayPos))];
  const results = roster.filter(p =>
    p.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    (filters.pos === 'All' || p.displayPos === filters.pos) &&
    p.ovr >= filters.minOvr && p.age <= filters.maxAge &&
    (filters.morale === 'All' || p.morale === filters.morale) &&
    (filters.availability === 'All' || p.availability === filters.availability)
  );
  return <div className="squad-tab-page">
    <div className="comm-card-head"><SearchIcon size={17} color="#4d9dff" /><h3>Player Search / Management</h3><span className="muted-sub">Filter your own squad, then act on any player</span></div>
    <section className="sq-card">
      <div className="ps-filter-grid">
        <label>Name<input value={filters.name} onChange={e => set('name', e.target.value)} /></label>
        <label>Position<select value={filters.pos} onChange={e => set('pos', e.target.value)}>{positions.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Min OVR<input type="number" value={filters.minOvr} onChange={e => set('minOvr', Number(e.target.value))} /></label>
        <label>Max Age<input type="number" value={filters.maxAge} onChange={e => set('maxAge', Number(e.target.value))} /></label>
        <label>Morale<select value={filters.morale} onChange={e => set('morale', e.target.value)}>{['All', 'Good', 'Okay', 'Unhappy'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Availability<select value={filters.availability} onChange={e => set('availability', e.target.value)}>{['All', 'Available', 'Injured'].map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
    </section>
    <SquadTable rows={results} onOpen={onOpen} />
    <section className="sq-card">
      <div className="sq-card-head"><Star size={16} color="#b06bff" /><h3>Compare</h3><span className="muted-sub">Scout a rival for comparison against these results</span></div>
      <button className="sq-btn" onClick={() => goTo('Scouting')}>Open Scouting</button>
    </section>
  </div>;
}

// ================= ROOT =================

const TABS = [['overview', 'Overview', Users], ['firstTeam', 'First Team', ShieldCheck], ['youth', 'Youth', Sprout], ['search', 'Player Search', SearchIcon]];

export default function SquadScreen({ setActive }) {
  const [tab, setTab] = useState('overview');
  const { openProfileFor } = useWorldData();
  const goTo = (screen) => setActive(screen);
  const onOpen = (p) => openProfileFor(mapRosterPlayer(p));

  return <div className="squad-page">
    <div className="comm-header">
      <span className="comm-header-icon" style={{ background: 'linear-gradient(150deg,#6c5ce7,#2c1b7a)' }}><Users size={22} /></span>
      <div><h1>Squad</h1><span>View and manage your first team, youth and overall squad.</span></div>
    </div>
    <div className="comm-tabs">
      {TABS.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={16} />{label}</button>)}
    </div>
    {tab === 'overview' && <Overview onOpen={onOpen} goTo={goTo} />}
    {tab === 'firstTeam' && <FirstTeam onOpen={onOpen} goTo={goTo} />}
    {tab === 'youth' && <Youth onOpen={onOpen} />}
    {tab === 'search' && <PlayerSearchTab onOpen={onOpen} goTo={goTo} />}
  </div>;
}
