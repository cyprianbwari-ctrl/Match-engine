import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Search as SearchIcon, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown,
  Crown, ShieldCheck, Repeat2, Wrench, Sprout, LifeBuoy, Bot, UserPlus,
  Crosshair, CalendarDays, Flag, FileText, AlertTriangle, Info, Star,
  IdCard, Layers, UsersRound, Filter, ArrowUpDown, Battery, Zap, UserRound,
  ArrowRightLeft, RefreshCcw, CornerUpRight, Ban, X
} from 'lucide-react';
import './squad.css';
import { players as rosterSeed } from './data/roster.js';
import { useWorldData } from './store/WorldContext.jsx';
import { useStaffData } from './store/StaffContext.jsx';
import { useClubData } from './store/ClubContext.jsx';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useTacticsData } from './store/TacticsContext.jsx';
import { mapRosterPlayer } from './data/homeData.js';
import { clubIdentity, stadium, clubReputation, squadStaffSummary } from './data/clubData.js';

// ---------- Shared bits ----------

function Avatar({ name, size = 32, inXi = false }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <span className={"sq-avatar" + (inXi ? " in-xi" : "")} style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>;
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
const BUCKET_LABEL = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', ATT: 'Forward' };

// ---------- Derived fields the roster doesn't store directly ----------
// (kept in the same style as data/homeData.js's mapRosterPlayer, so numbers
// stay consistent with what the rest of the app already derives from a player)
function potentialOf(p) { return Math.min(96, p.ovr + 4); }
function sharpnessOf(p) { return Math.max(50, Math.min(99, Math.round(p.fit - 3 + (p.id % 7)))); }
function appsOf(p) { return 14 + (p.id % 4); }
function wageShort(p) { return String(p.wage || '').replace('/w', ''); }
function moneyShort(v) { const n = Number(String(v).replace(/[^0-9]/g, '')); return n >= 1000000 ? `£${Math.round(n / 1000000)}M` : `£${Math.round(n / 1000)}k`; }

const STATUS_CLASS = {
  'Key Player': 'st-key', 'First Team': 'st-regular', 'Squad Player': 'st-regular',
  'Rotation': 'st-rotation', 'Backup': 'st-backup', 'Third Choice': 'st-backup',
  'Prospect': 'st-youngster', 'Youth': 'st-youngster', 'Emergency': 'st-rotation',
};
function statusMeta(p) {
  if (p.override === 'Transfer Listed') return { label: 'Transfer Listed', cls: 'st-transfer' };
  if (p.override === 'On Loan') return { label: 'On Loan', cls: 'st-loan' };
  if (p.override === 'Unavailable') return { label: 'Unavailable', cls: 'st-unavail' };
  if (p.availability === 'Injured') return { label: 'Injured', cls: 'st-injured' };
  if (p.availability === 'Suspended') return { label: 'Suspended', cls: 'st-suspended' };
  return { label: p.playTime, cls: STATUS_CLASS[p.playTime] || 'st-regular' };
}

// ================= TABLE (shared by First Team / Youth) =================

function SquadTable({ rows, onOpen, startingIds }) {
  return <div className="squad-table">
    <div className="sq-row sq-head"><span>#</span><span>Name</span><span>Pos</span><span>Age</span><span>OVR</span><span>Form</span><span>Fitness</span><span>Morale</span><span>Play Time</span><span>Contract</span><span>Wage</span><span>Status</span></div>
    <div className="sq-body">
      {rows.map(p => <button className="sq-row sq-player-row" key={p.id} onClick={() => onOpen(p)}>
        <span className="sq-number">{p.number}</span>
        <span className="sq-name-cell"><Avatar name={p.name} inXi={startingIds?.has(p.id)} /><div><b className="sq-name">{p.name}</b><small>{p.nat}</small></div></span>
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

// ================= OVERVIEW (first-team squad, matches approved design) =================

function OverviewOv({ players, setPlayers, onOpen, goTo }) {
  const { formation, startingIds } = useTacticsData();
  const { league } = useCompetitionData();
  const [ovFilter, setOvFilter] = useState('All');
  const [sortKey, setSortKey] = useState('ovr');
  const [activeRow, setActiveRow] = useState(null);
  const [sideTab, setSideTab] = useState('Key Stats');
  const [toast, setToast] = useState('');

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  const firstTeamPool = useMemo(() => players.filter(p => p.playTime !== 'Youth'), [players]);
  const gkCount = firstTeamPool.filter(p => p.bucket === 'GK').length;
  const defCount = firstTeamPool.filter(p => p.bucket === 'DEF').length;
  const midCount = firstTeamPool.filter(p => p.bucket === 'MID').length;
  const attCount = firstTeamPool.filter(p => p.bucket === 'ATT').length;
  const avgOvr = Math.round(firstTeamPool.reduce((a, p) => a + p.ovr, 0) / firstTeamPool.length);
  const avgAge = (firstTeamPool.reduce((a, p) => a + p.age, 0) / firstTeamPool.length).toFixed(1);
  const totalValue = firstTeamPool.reduce((a, p) => a + Number(String(p.value).replace(/[^0-9]/g, '')), 0);
  const keyPlayers = firstTeamPool.filter(p => p.playTime === 'Key Player').length;
  const regulars = firstTeamPool.filter(p => ['First Team', 'Squad Player'].includes(p.playTime)).length;
  const rotation = firstTeamPool.filter(p => ['Rotation', 'Backup', 'Third Choice', 'Emergency'].includes(p.playTime)).length;
  const youngsters = firstTeamPool.filter(p => p.playTime === 'Prospect').length;
  const moraleScore = firstTeamPool.reduce((a, p) => a + (p.morale === 'Good' ? 1 : p.morale === 'Okay' ? 0.5 : 0), 0);
  const chemistry = Math.round(100 * moraleScore / firstTeamPool.length);
  const stars = Math.round(clubReputation.stars);

  const ovRowsFiltered = firstTeamPool.filter(p => ovFilter === 'All' || p.bucket === ovFilter);
  const ovRows = [...ovRowsFiltered].sort((a, b) => {
    if (sortKey === 'value') return Number(String(b.value).replace(/[^0-9]/g, '')) - Number(String(a.value).replace(/[^0-9]/g, ''));
    if (sortKey === 'wage') return Number(String(b.wage).replace(/[^0-9]/g, '')) - Number(String(a.wage).replace(/[^0-9]/g, ''));
    if (sortKey === 'potential') return potentialOf(b) - potentialOf(a);
    return (b[sortKey] ?? 0) - (a[sortKey] ?? 0);
  });

  const topPerformers = [...firstTeamPool].sort((a, b) => b.ovr - a.ovr).slice(0, 3);

  const fixture = league.fixtures[0];
  const weAreHome = fixture ? fixture.home === 'Man Utd' : true;
  const opponent = fixture ? (weAreHome ? fixture.away : fixture.home) : 'TBC';
  const oppAbbr = opponent.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const usRow = league.table.find(r => r.us);

  const sortOptions = [{ key: 'ovr', label: 'Overall Rating' }, { key: 'potential', label: 'Potential' }, { key: 'age', label: 'Age' }, { key: 'value', label: 'Value' }, { key: 'wage', label: 'Wage' }];
  const sortLabel = (sortOptions.find(s => s.key === sortKey) || {}).label || 'Overall Rating';

  const statusOrder = ['Key Player', 'First Team', 'Rotation', 'Backup', 'Prospect'];
  function updateStatus(id, playTime) {
    setPlayers(ps => ps.map(p => p.id === id ? { ...p, playTime, override: undefined } : p));
    setActiveRow(ar => ar && ar.id === id ? { ...ar, playTime, override: undefined } : ar);
  }
  function setOverride(id, override) {
    setPlayers(ps => ps.map(p => p.id === id ? { ...p, override } : p));
    setActiveRow(ar => ar && ar.id === id ? { ...ar, override } : ar);
  }
  function handleAction(key) {
    if (!activeRow) { setToast('Select a player from the list first'); return; }
    if (key === 'profile') { onOpen(activeRow); return; }
    if (key === 'transfer') { setOverride(activeRow.id, 'Transfer Listed'); setToast(activeRow.name + ' added to the transfer list'); return; }
    if (key === 'contract') { setToast('Contract offer sent to ' + activeRow.name); return; }
    if (key === 'status') { const next = statusOrder[(statusOrder.indexOf(activeRow.playTime) + 1) % statusOrder.length]; updateStatus(activeRow.id, next); setToast(activeRow.name + "'s squad status set to " + next); return; }
    if (key === 'loan') { setOverride(activeRow.id, 'On Loan'); setToast(activeRow.name + ' sent on loan'); return; }
    if (key === 'unavailable') { setOverride(activeRow.id, 'Unavailable'); setToast(activeRow.name + ' marked unavailable'); return; }
  }

  const gaugeR = 64, gaugeC = 2 * Math.PI * gaugeR;
  const actions = [['Player Profile', 'View detailed player info', UserRound, 'profile'], ['Add to Transfer List', 'Transfer market', ArrowRightLeft, 'transfer'], ['Offer New Contract', 'Manage contracts', FileText, 'contract'], ['Set Squad Status', 'Change player status', RefreshCcw, 'status'], ['Send on Loan', 'Loan list', CornerUpRight, 'loan'], ['Make Unavailable', 'Exclude from selection', Ban, 'unavailable']];

  return <div className="squad-tab-page">
    {toast && <div className="sq-toast"><span>{toast}</span><button onClick={() => setToast('')}><X size={13} /></button></div>}

    <div className="sq-card squad-info-card">
      <div className="si-block si-club">
        <div className="crest-sq">MU</div>
        <div className="si-club-name"><b>{clubIdentity.name}</b><small>First Team Squad</small></div>
        <div className="si-circles">
          <div className="si-circle"><b>{firstTeamPool.length}</b><span>Players</span></div>
          <div className="si-circle"><b>{gkCount}</b><span>Goalkeepers</span></div>
          <div className="si-circle"><b>{defCount}</b><span>Defenders</span></div>
          <div className="si-circle"><b>{midCount}</b><span>Midfielders</span></div>
          <div className="si-circle"><b>{attCount}</b><span>Forwards</span></div>
        </div>
      </div>
      <div className="si-block">
        <span className="si-label">Squad Quality</span>
        <div className="stars-row">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={15} fill={i < stars ? 'currentColor' : 'none'} className={i < stars ? '' : 'off'} />)}</div>
        <small className="si-sub">Overall Rating</small>
        <div className="si-big">{avgOvr}</div>
      </div>
      <div className="si-block">
        <span className="si-label">Squad Value</span>
        <div className="si-big">£{totalValue.toLocaleString('en-GB')}</div>
        <small className="si-sub">Total Market Value</small>
      </div>
      <div className="si-block">
        <span className="si-label">Average Age</span>
        <div className="si-big">{avgAge}</div>
        <small className="si-sub">Years</small>
      </div>
      <div className="si-block">
        <span className="si-label">Squad Status</span>
        <div className="si-status-row"><span className="dot green" />Key Players<b>{keyPlayers}</b></div>
        <div className="si-status-row"><span className="dot green" />Regulars<b>{regulars}</b></div>
        <div className="si-status-row"><span className="dot yellow" />Rotation<b>{rotation}</b></div>
        <div className="si-status-row"><span className="dot red" />Youngsters<b>{youngsters}</b></div>
      </div>
    </div>

    <div className="squad-main-grid">
      <section className="sq-card squad-table-card">
        <div className="table-head">
          <h3>First Team Squad</h3>
          <div className="dropdown-btn"><Filter size={13} />Filter: {ovFilter === 'All' ? 'All' : BUCKET_LABEL[ovFilter] + 's'}<ChevronDown size={13} />
            <select value={ovFilter} onChange={e => setOvFilter(e.target.value)}>{['All', 'GK', 'DEF', 'MID', 'ATT'].map(f => <option key={f} value={f}>{f === 'All' ? 'All' : BUCKET_LABEL[f] + 's'}</option>)}</select>
          </div>
          <div className="dropdown-btn"><ArrowUpDown size={13} />Sort: {sortLabel}<ChevronDown size={13} />
            <select value={sortKey} onChange={e => setSortKey(e.target.value)}>{sortOptions.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </div>
        </div>
        <div className="ov-table">
          <div className="ov-row ov-head"><span>#</span><span>Pos</span><span>Player</span><span>Nat</span><span>Age</span><span>OVR</span><span>POT</span><span>Con</span><span>Sharp</span><span>Morale</span><span>Form</span><span>Apps</span><span>Wage</span><span>Value</span><span>Status</span></div>
          {ovRows.map(p => {
            const st = statusMeta(p);
            return <button key={p.id} className={"ov-row ov-body" + (activeRow && activeRow.id === p.id ? ' sel' : '')} onClick={() => setActiveRow(p)}>
              <span>{p.number}</span>
              <span>{p.displayPos}</span>
              <span className="ov-name"><span className={"ov-avatar" + (startingIds.has(p.id) ? " in-xi" : "")} title={startingIds.has(p.id) ? "In starting XI" : ""}><UserRound size={13} /></span>{p.name}</span>
              <span>{p.nat}</span>
              <span>{p.age}</span>
              <b className="badge ovr">{p.ovr}</b>
              <b className="badge pot">{potentialOf(p)}</b>
              <span className="ov-pct con"><Battery size={11} />{p.fit}%</span>
              <span className="ov-pct sharp"><Zap size={11} />{sharpnessOf(p)}%</span>
              <span className="emoji">{MORALE_EMOJI[p.morale] || '😐'}</span>
              <span className="formbars">{[0, 1, 2, 3].map(i => <i key={i} className={p.form[i] >= 7 ? 'on' : ''} />)}</span>
              <span>{appsOf(p)}</span>
              <span>{wageShort(p)}</span>
              <span>{moneyShort(p.value)}</span>
              <span className={"status-pill " + st.cls}>{st.label}</span>
            </button>;
          })}
        </div>
      </section>

      <aside className="squad-side">
        <section className="sq-card side-overview">
          <h3>Squad Overview</h3>
          <div className="pill-tabs">
            <button className={sideTab === 'Key Stats' ? 'active' : ''} onClick={() => setSideTab('Key Stats')}>Key Stats</button>
            <button className={sideTab === 'Squad Info' ? 'active' : ''} onClick={() => setSideTab('Squad Info')}>Squad Info</button>
          </div>
          {sideTab === 'Key Stats' ? <>
            <div className="gauge-wrap">
              <svg className="gauge" viewBox="0 0 150 150">
                <circle className="gauge-bg" cx="75" cy="75" r={gaugeR} />
                <circle className="gauge-fg" cx="75" cy="75" r={gaugeR} strokeDasharray={`${gaugeC * avgOvr / 100} ${gaugeC}`} />
              </svg>
              <div className="gauge-label"><b>{avgOvr}</b><small>Overall Rating</small></div>
            </div>
            <div className="dot-list">
              <div><span className="dot blue" /><b>{firstTeamPool.length}</b> Players</div>
              <div><span className="dot green" /><b>{gkCount}</b> Goalkeepers</div>
              <div><span className="dot yellow" /><b>{defCount}</b> Defenders</div>
              <div><span className="dot yellow" /><b>{midCount}</b> Midfielders</div>
              <div><span className="dot red" /><b>{attCount}</b> Forwards</div>
            </div>
            <div className="chem">
              <div className="chem-head"><span>Team Chemistry</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="chem-bar" style={{ flex: 1 }}><i style={{ width: chemistry + '%' }} /></div>
                <b style={{ fontSize: 11 }}>{chemistry}%</b>
              </div>
            </div>
          </> : <div className="squad-info-panel">
            <p><span>Manager</span><b>Cyprian</b></p>
            <p><span>Formation</span><b>{formation}</b></p>
            <p><span>Captain</span><b>{topPerformers[0]?.name}</b></p>
            <p><span>Vice Captain</span><b>{topPerformers[1]?.name}</b></p>
            <p><span>Stadium</span><b>{stadium.name}</b></p>
            <p><span>League Position</span><b>{usRow ? usRow.pos : '—'}</b></p>
          </div>}
        </section>

        <section className="sq-card top-performers">
          <h3>Top Performers</h3>
          {topPerformers.map(p => <div className="tp-row" key={p.id}><div className="tp-avatar"><UserRound size={16} /></div><div><b>{p.name}</b><small>{BUCKET_LABEL[p.bucket]}</small></div><span className="tp-badge">{p.ovr}</span></div>)}
        </section>

        <section className="sq-card next-match">
          <h3>Next Match</h3>
          <div className="nm-row">
            <div className="nm-team"><div className="crest-sq small">MU</div><b>Man Utd</b></div>
            <span>VS</span>
            <div className="nm-team"><div className="crest-sq small brighton">{oppAbbr}</div><b>{opponent}</b></div>
          </div>
          <div className="nm-meta"><span>{fixture ? fixture.comp : 'Premier League'}</span><span>{fixture ? fixture.date : 'TBC'}</span><span>{fixture ? fixture.time : ''}</span></div>
          <button className="green-wide" onClick={() => goTo('Match')}>View Match</button>
        </section>
      </aside>
    </div>

    <div className="action-bar">{actions.map(([label, desc, Icon, key]) => <button key={key} onClick={() => handleAction(key)}><span className="ab-icon"><Icon size={15} /></span><span><b>{label}</b><small>{desc}</small></span></button>)}</div>
  </div>;
}

// ================= OTHER TABS =================

function SquadRolesCard({ players }) {
  const counts = useMemo(() => {
    const c = {};
    players.forEach(p => { c[p.playTime] = (c[p.playTime] || 0) + 1; });
    return c;
  }, [players]);
  const rows = [['Key Player', Crown, '#ffd76b'], ['First Team', ShieldCheck, '#3ddc84'], ['Rotation', Repeat2, '#4d9dff'],
  ['Backup', Wrench, '#8f9abb'], ['Prospect', Sprout, '#b06bff'], ['Youth', Sprout, '#26c1a4'], ['Emergency', LifeBuoy, '#ff8a5c']];
  return <section className="sq-card">
    <div className="sq-card-head"><Crown size={16} color="#ffd76b" /><h3>Squad Roles</h3></div>
    {rows.map(([label, Icon, color]) => <div className="role-row" key={label}><Icon size={13} color={color} /><span>{label}</span><b>{counts[label] || 0}</b></div>)}
  </section>;
}

function SquadManagementCard({ players }) {
  const issues = useMemo(() => {
    const list = [];
    const rbCount = players.filter(p => p.displayPos === 'RB').length;
    if (rbCount < 2) list.push({ text: 'No natural backup for RB', level: 'danger' });
    const unhappy = players.filter(p => p.morale === 'Unhappy');
    if (unhappy.length) list.push({ text: `Player unhappy with playing time (${unhappy.map(p => p.name).join(', ')})`, level: 'warn' });
    const injured = players.filter(p => p.availability === 'Injured');
    if (injured.length) list.push({ text: `Player${injured.length > 1 ? 's' : ''} currently injured (${injured.map(p => p.name).join(', ')})`, level: 'warn' });
    const fitConcern = players.filter(p => p.fit < 78);
    if (fitConcern.length) list.push({ text: `Player fitness concern (${fitConcern.length})`, level: 'warn' });
    return list;
  }, [players]);
  const iconFor = { danger: <AlertTriangle size={13} color="#ff5d5d" />, warn: <AlertTriangle size={13} color="#ffb84d" />, info: <Info size={13} color="#4d9dff" /> };
  return <section className="sq-card">
    <div className="sq-card-head"><AlertTriangle size={16} color="#ffb84d" /><h3>Squad Management</h3></div>
    {issues.map((i, idx) => <div className="issue-row" key={idx}>{iconFor[i.level]}<span>{i.text}</span></div>)}
    {issues.length === 0 && <p className="muted-sub">No squad issues detected.</p>}
  </section>;
}

function AssistantManagerCard({ goTo }) {
  const { delegation } = useStaffData();
  const { extraDelegation } = useClubData();
  const rows = [
    ['Squad rotation', extraDelegation.tactical], ['Rest tired players', extraDelegation.training],
    ['Youth promotion', delegation.assignments], ['Emergency replacements', extraDelegation.transfers],
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

function FirstTeam({ players, onOpen, goTo, startingIds }) {
  const rows = players.filter(p => ['Key Player', 'First Team', 'Squad Player'].includes(p.playTime));
  return <div className="squad-tab-page">
    <div className="comm-card-head"><ShieldCheck size={17} color="#3ddc84" /><h3>First Team</h3><span className="muted-sub">{rows.length} players considered first-team regulars</span>
      <button className="link-btn" onClick={() => goTo('Tactics')}>Send XI to Tactics</button></div>
    <SquadTable rows={rows} onOpen={onOpen} startingIds={startingIds} />
  </div>;
}

function Youth({ players, onOpen, startingIds }) {
  const rows = players.filter(p => p.playTime === 'Youth' || p.playTime === 'Prospect' || p.age <= 20);
  return <div className="squad-tab-page">
    <div className="comm-card-head"><Sprout size={17} color="#26c1a4" /><h3>Youth & U21</h3><span className="muted-sub">{rows.length} academy and development players</span></div>
    <SquadTable rows={rows} onOpen={onOpen} startingIds={startingIds} />
  </div>;
}

function PlayerSearchTab({ players, onOpen, goTo, startingIds }) {
  const [filters, setFilters] = useState({ name: '', pos: 'All', minOvr: 0, maxAge: 40, morale: 'All', availability: 'All' });
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const positions = ['All', ...new Set(players.map(p => p.displayPos))];
  const results = players.filter(p =>
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
    <SquadTable rows={results} onOpen={onOpen} startingIds={startingIds} />
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
  const [players, setPlayers] = useState(rosterSeed);
  const { openProfileFor } = useWorldData();
  const { startingIds } = useTacticsData();
  const goTo = (screen) => setActive(screen);
  const onOpen = (p) => openProfileFor(mapRosterPlayer(p));

  return <div className="squad-page">
    <div className="comm-header">
      <span className="comm-header-icon" style={{ background: 'linear-gradient(150deg,#68ff2e,#1f7a1a)' }}><Users size={22} color="#06210a" /></span>
      <div><h1>Squad</h1><span>View and manage your first team, youth and overall squad.</span></div>
    </div>
    <div className="squad-tabs">
      {TABS.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={14} />{label}</button>)}
    </div>
    {tab === 'overview' && <>
      <OverviewOv players={players} setPlayers={setPlayers} onOpen={onOpen} goTo={goTo} />
      <div className="sq-bottom-grid">
        <SquadRolesCard players={players} />
        <SquadManagementCard players={players} />
        <AssistantManagerCard goTo={goTo} />
      </div>
    </>}
    {tab === 'firstTeam' && <FirstTeam players={players} onOpen={onOpen} goTo={goTo} startingIds={startingIds} />}
    {tab === 'youth' && <Youth players={players} onOpen={onOpen} startingIds={startingIds} />}
    {tab === 'search' && <PlayerSearchTab players={players} onOpen={onOpen} goTo={goTo} startingIds={startingIds} />}
  </div>;
}
