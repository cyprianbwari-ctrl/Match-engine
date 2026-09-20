import React, { useState, useRef } from 'react';
import {
  Shield, Info, Settings as SettingsIcon, ChevronRight, Star, Building2,
  GraduationCap, Trophy, ClipboardList, Target, Coins, Users, Landmark,
  Swords, Handshake, CalendarDays, UserRound, Binoculars, ArrowLeftRight,
  Crosshair, Bell, Gauge, Cloud, Monitor, Check
} from 'lucide-react';
import './club.css';
import { useClubData } from './store/ClubContext.jsx';
import { useStaffData } from './store/StaffContext.jsx';
import { useClubState } from './store/ClubStateContext.jsx';
import { useManagerData } from './store/ManagerContext.jsx';
import { usePlayerState } from './store/PlayerStateContext.jsx';
import { useTransfersData } from './store/TransfersContext.jsx';
import { useFinanceData } from './store/FinanceContext.jsx';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import * as D from './data/clubData.js';
import { useDatabase } from './store/DatabaseContext.jsx';
import { buildClubProfile, clubInitials, resolveDivisionLevel } from './engine/careerClub.js';

// ---------- Shared bits ----------

function getOrdinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }

function useClubProfile() {
  const db = useDatabase();
  const level = resolveDivisionLevel(db.competitions, db.careerClub);
  return buildClubProfile({ club: db.careerClub, stadiums: db.stadiums, divisionLevel: level });
}

function Stars({ value }) {
  const full = Math.floor(value), half = value % 1 >= 0.5;
  return <span className="stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14}
    fill={i < full ? '#ffd76b' : (i === full && half) ? '#ffd76b88' : 'none'} color="#ffd76b" />)}</span>;
}

function Badge() {
  const db = useDatabase();
  return <div className="club-badge"><Shield size={40} color="#ffd76b" /><span>{clubInitials(db.careerClub)}</span></div>;
}

function ResBadge({ r }) {
  const cls = r === 'W' ? 'w' : r === 'L' ? 'l' : 'd';
  return <span className={`res-badge ${cls}`}>{r}</span>;
}

function DelegationToggle({ label, sub, value, onToggle }) {
  return <div className="delegation-row">
    <div><b>{label}</b><span>{sub}</span></div>
    <div className="deleg-switch">
      <button className={value === 'MANUAL' ? 'active' : ''} onClick={() => value !== 'MANUAL' && onToggle()}>Manual</button>
      <button className={value === 'ASSISTANT' ? 'active' : ''} onClick={() => value !== 'ASSISTANT' && onToggle()}>Assistant</button>
    </div>
  </div>;
}

function Toggle({ checked, onChange }) {
  return <button className={`switch ${checked ? 'on' : ''}`} onClick={onChange}><i /></button>;
}

// ================= CLUB INFORMATION ================= 

function IdentityCard() {
  const db = useDatabase();
  const profile = useClubProfile();
  const clubState = useClubState();
  const club = db.careerClub;
  const nation = club ? db.nations.find(n => String(n.nation_id) === String(club.countryId)) : null;
  const competition = club ? db.competitions.find(c => String(c.competitionId ?? c.uid ?? c.id) === String(club.leagueId)) : null;
  return <section className="comm-card club-identity">
    <Badge />
    <div className="ci-main">
      <h2>{profile.name}</h2>
      {profile.nickname && <span className="muted-sub">{profile.nickname}</span>}
      <div className="ci-meta"><span>{nation?.name || profile.country || 'Unknown'}</span><span>{competition?.name || profile.league || 'Unknown League'}</span></div>
    </div>
    <div className="ci-rep"><div><span>Reputation</span><b>Worldwide</b><Stars value={profile.stars5} /></div>
      <div><span>Continental Reputation</span><b>Europe</b><Stars value={Math.max(1, profile.stars5 - 1)} /></div>
      <div><span>Board Confidence</span><b style={{ color: clubState.boardConfidence >= 60 ? '#3ddc84' : clubState.boardConfidence >= 40 ? '#f2c94c' : '#ef4f4f' }}>{clubState.confidenceTier}</b><small className="muted-sub">{clubState.boardConfidence}% · Target: {clubState.seasonExpectation.label}</small></div></div>
    <div className="ci-kits">{profile.kits.map(k => <div className="kit" key={k.label}><i style={{ background: k.color, border: k.border ? '1px solid #999' : 'none' }} /><span>{k.label}</span></div>)}</div>
  </section>;
}

function StadiumCard() {
  const profile = useClubProfile();
  const s = profile.stadium;
  return <section className="comm-card stadium-card">
    <div className="stadium-photo"><Building2 size={40} color="#c8d0e6" /></div>
    <div className="stadium-info">
      <h3>{s.name}</h3>
      <div><span>Capacity</span><b>{(s.capacity || 0).toLocaleString()}</b></div>
      <div><span>Training Ground</span><b className="good">{profile.trainingGround.level}</b></div>
      <div><span>Youth Facilities</span><b className="good">{profile.youthAcademy.youthFacilities}</b></div>
    </div>
  </section>;
}

function InfoTile({ icon: Icon, title, rows, onClick }) {
  return <button className={`info-tile ${onClick ? 'clickable' : ''}`} onClick={onClick}>
    <span className="tile-icon"><Icon size={17} /></span>
    <div><b>{title}</b>{rows.map((r, i) => <div className="tile-row" key={i}><span>{r[0]}</span>{r[1] && <em className={r[2] || ''}>{r[1]}</em>}</div>)}</div>
    {onClick && <ChevronRight size={15} className="tile-chevron" />}
  </button>;
}

function InfoTiles({ goTo }) {
  const profile = useClubProfile();
  const db = useDatabase();
  const { staffList } = useStaffData();
  const finance = useFinanceData();
  const clubState = useClubState();
  const s = profile.stadium, tg = profile.trainingGround, ya = profile.youthAcademy;
  const rep = D.clubReputation;
  const be = { headline: [clubState.seasonExpectation.label, 'Develop young players', 'Maintain financial stability'] };
  const obj = [clubState.seasonExpectation.label, 'Develop youth players', 'Maintain financial stability'];
  const balance = `£${Math.round(finance.balance || 0).toLocaleString()}`;
  const coachingStaff = staffList.filter(st => st.dept === 'Coaching').length;
  return <div className="info-tile-grid">
    <InfoTile icon={Landmark} title="Stadium" rows={[[s.name], ['Capacity:', (s.capacity || 0).toLocaleString()], ['Pitch Quality:', s.pitchQuality, 'good']]} />
    <InfoTile icon={Building2} title="Training Ground" rows={[[tg.name], ['Level:', tg.level, 'good'], ['Facilities:', tg.facilities]]} />
    <InfoTile icon={GraduationCap} title="Youth Academy" rows={[['Youth System:', ya.youthSystem], ['Scouting Network:', ya.scoutingNetwork], ['Youth Facilities:', ya.youthFacilities, 'good']]} />
    <InfoTile icon={Trophy} title="Club Reputation" rows={[['Worldwide'], ['Domestic:', rep.domestic], ['Continental:', rep.continental]]} />
    <InfoTile icon={ClipboardList} title="Board Expectations" rows={be.headline.map(h => [h])} />
    <InfoTile icon={Target} title="Club Objectives" rows={obj.slice(0, 3).map(o => [o])} />
    <InfoTile icon={Coins} title="Finances (Current Season)" rows={[['Balance:', balance], ['Transfer Budget:', profile.transferBudget], ['Status:', finance.financialStatus, 'good']]} onClick={() => goTo('Finance')} />
    <InfoTile icon={Users} title="Squad & Staff" rows={[['Senior Squad:', db.careerSquad.length], ['Total Staff:', staffList.length], ['Coaching Staff:', coachingStaff]]} onClick={() => goTo('Squad')} />
  </div>;
}

function HonoursHistoryCard() {
  const [sub, setSub] = useState('Honours');
  const clubState = useClubState();
  const manager = useManagerData();
  const playerState = usePlayerState();
  const { history: transferHistory } = useTransfersData();
  // A real, merged timeline of this actual playthrough — club confidence
  // swings, manager reputation events, awards, and completed transfers —
  // rather than only the pre-written all-time club history.
  const thisSeasonHistory = [
    ...clubState.clubHistory.map(h => ({ ...h, source: 'Club' })),
    ...manager.careerHistory.map(h => ({ date: h.date, event: h.event, detail: h.club, source: 'Manager' })),
    ...playerState.awardsHistory.map(h => ({ date: h.month, event: `${h.award}: ${h.winner}`, detail: `Rating ${h.rating}`, source: 'Award' })),
    ...transferHistory.map(h => ({ date: h.date, event: `Signed ${h.name}`, detail: `${h.from} → ${h.to} · £${Math.round(h.fee).toLocaleString()}`, source: 'Transfer' })),
  ].slice(-40).reverse();

  const profile = useClubProfile();

  return <section className="comm-card">
    <div className="sub-tabs">{['Honours', 'Records', 'History', 'This Season'].map(t => <button key={t} className={sub === t ? 'active' : ''} onClick={() => setSub(t)}>{t === 'Honours' ? 'Honours & Trophies' : t === 'Records' ? 'Club Records' : t}</button>)}</div>
    {sub === 'Honours' && <>
      <div className="panel-label">Major Honours</div>
      {profile.majorHonours
        ? <div className="honours-grid">{profile.majorHonours.map(h => <div className="honour-card" key={h.name}><Trophy size={22} color="#ffd76b" /><b>{h.count}</b><span>{h.name}</span><small>(Last: {h.last})</small></div>)}</div>
        : <p className="muted-sub">Trophy history isn't tracked yet for this club.</p>}
    </>}
    {sub === 'Records' && (profile.clubRecords
      ? profile.clubRecords.map(r => <div className="objective-row" key={r.label}><Star size={14} color="#ffd76b" /><div><b>{r.label}</b><span>{r.value}</span></div></div>)
      : <p className="muted-sub">Club records aren't tracked yet for this club.</p>)}
    {sub === 'History' && (profile.clubHistory
      ? profile.clubHistory.map(h => <div className="achievement-row" key={h.year}><b>{h.year}</b><span>{h.text}</span></div>)
      : <p className="muted-sub">Founding history isn't tracked yet for this club.</p>)}
    {sub === 'This Season' && <>
      {thisSeasonHistory.length === 0 && <p className="muted-sub">Nothing significant recorded yet this season.</p>}
      {thisSeasonHistory.map((h, i) => <div className="achievement-row" key={i}><b>{h.date}</b><span>{h.event}</span><small className="muted-sub" style={{ marginLeft: 8 }}>{h.detail}</small></div>)}
    </>}
  </section>;
}

function RivalsAffiliatesCard() {
  const profile = useClubProfile();
  return <div className="two-col">
    <section className="comm-card">
      <div className="comm-card-head"><Swords size={16} color="#ff6b6b" /><h3>Rivals</h3></div>
      {profile.rivals
        ? <div className="club-chip-grid">{profile.rivals.map(r => <div className="club-chip" key={r.name}><span className="chip-badge">{r.name.slice(0, 2).toUpperCase()}</span><div><b>{r.name}</b><span>{r.tag}</span></div></div>)}</div>
        : <p className="muted-sub">Rivalries aren't tracked yet for this club.</p>}
    </section>
    <section className="comm-card">
      <div className="comm-card-head"><Handshake size={16} color="#3ddc84" /><h3>Affiliated Clubs</h3><button className="link-btn">View All</button></div>
      {profile.curated
        ? <div className="club-chip-grid">{D.affiliatedClubs.map(r => <div className="club-chip" key={r.name}><span className="chip-badge">{r.name.slice(0, 2).toUpperCase()}</span><div><b>{r.name}</b><span>{r.tag}</span></div></div>)}</div>
        : <p className="muted-sub">No affiliated clubs on record.</p>}
    </section>
  </div>;
}

function SeasonSummaryCard({ goTo }) {
  const { league, form, allResults } = useCompetitionData();
  const usRow = league.table.find(r => r.us);
  const rows = [
    { label: 'League Position', value: usRow ? `${usRow.pos}${getOrdinal(usRow.pos)} (${usRow.p} games)` : '—' },
    { label: 'Points', value: usRow ? `${usRow.pts} pts` : '—' },
    { label: 'Goal Difference', value: usRow ? (usRow.gd > 0 ? `+${usRow.gd}` : usRow.gd) : '—' },
  ];
  const last5 = allResults.slice(0, 5).map(m => {
    const usHome = m.home === league.table.find(r => r.us)?.club;
    const [hs, as] = String(m.score).split(' - ').map(Number);
    const gf = usHome ? hs : as, ga = usHome ? as : hs;
    const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    return { opp: usHome ? m.away : m.home, score: m.score, result };
  });
  return <section className="comm-card">
    <div className="comm-card-head"><CalendarDays size={16} color="#4d9dff" /><h3>Current Season Summary</h3><button className="link-btn" onClick={() => goTo('Competitions')}>View Details</button></div>
    <div className="season-summary-body">
      <div className="season-rows">
        {rows.map(r => <button className="season-row" key={r.label} onClick={() => goTo('Competitions')}><span>{r.label}</span><b>{r.value}</b><ChevronRight size={14} /></button>)}
      </div>
      <div className="season-side">
        <div className="panel-label">Form</div>
        <div className="form-row">{form.map((r, i) => <ResBadge r={r} key={i} />)}</div>
        <div className="panel-label" style={{ marginTop: 8 }}>Last 5 Matches</div>
        {last5.map((m, i) => <div className="last5-row" key={i}><ResBadge r={m.result} /><span>{m.score}</span><small>{m.opp}</small></div>)}
      </div>
    </div>
  </section>;
}

function ClubInformation({ goTo, refs }) {
  return <div className="world-tab-page">
    <div ref={refs.overview}><IdentityCard /></div>
    <StadiumCard />
    <div ref={refs.stadium}><InfoTiles goTo={goTo} /></div>
    <div ref={refs.history}><HonoursHistoryCard /></div>
    <div ref={refs.rivals}><RivalsAffiliatesCard /></div>
    <div ref={refs.season}><SeasonSummaryCard goTo={goTo} /></div>
  </div>;
}

// ================= CLUB SETTINGS =================

function SettingRow({ label, children }) {
  return <div className="setting-row"><span>{label}</span>{children}</div>;
}

function ClubSettings({ refs }) {
  const { extraDelegation, toggleExtraDelegation, general, setGeneral, notifications, toggleNotification, simulation, setSimulation, saveCloud, setSaveCloud, display, setDisplay } = useClubData();
  const { delegation, toggleDelegation } = useStaffData();

  return <div className="world-tab-page">
    <section className="comm-card" ref={refs.general}>
      <div className="comm-card-head"><SettingsIcon size={17} color="#8a6bff" /><h3>General Preferences</h3></div>
      <SettingRow label="Show club nickname"><Toggle checked={general.nicknameDisplay} onChange={() => setGeneral(g => ({ ...g, nicknameDisplay: !g.nicknameDisplay }))} /></SettingRow>
      <SettingRow label="Language"><select value={general.language} onChange={e => setGeneral(g => ({ ...g, language: e.target.value }))}>{['English', 'Spanish', 'Portuguese', 'German'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
      <SettingRow label="UI Density"><select value={general.density} onChange={e => setGeneral(g => ({ ...g, density: e.target.value }))}>{['Comfortable', 'Compact'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
    </section>

    <section className="comm-card" ref={refs.staffDeleg}>
      <div className="comm-card-head"><UserRound size={17} color="#4d9dff" /><h3>Staff Delegation</h3><span className="muted-sub">Shared with Staff → Overview</span></div>
      <DelegationToggle label="Staff Recruitment" sub="Who finds and negotiates with new staff" value={delegation.recruitment} onToggle={() => toggleDelegation('recruitment')} />
      <DelegationToggle label="Staff Assignments" sub="Who assigns staff to responsibilities" value={delegation.assignments} onToggle={() => toggleDelegation('assignments')} />
    </section>

    <section className="comm-card" ref={refs.trainingDeleg}>
      <div className="comm-card-head"><Crosshair size={17} color="#3ddc84" /><h3>Training Delegation</h3></div>
      <DelegationToggle label="Training Schedules" sub="Who builds and automates training sessions" value={extraDelegation.training} onToggle={() => toggleExtraDelegation('training')} />
    </section>

    <section className="comm-card" ref={refs.scoutingDeleg}>
      <div className="comm-card-head"><Binoculars size={17} color="#b06bff" /><h3>Scouting Delegation</h3></div>
      <DelegationToggle label="Scouting Assignments" sub="Who manages scout assignments and reports" value={extraDelegation.scouting} onToggle={() => toggleExtraDelegation('scouting')} />
    </section>

    <section className="comm-card" ref={refs.transferDeleg}>
      <div className="comm-card-head"><ArrowLeftRight size={17} color="#ff8a5c" /><h3>Transfer Delegation</h3></div>
      <DelegationToggle label="Transfers & Negotiations" sub="Who handles incoming/outgoing transfer talks" value={extraDelegation.transfers} onToggle={() => toggleExtraDelegation('transfers')} />
    </section>

    <section className="comm-card" ref={refs.tacticalDeleg}>
      <div className="comm-card-head"><Target size={17} color="#ffd76b" /><h3>Match / Tactical Delegation</h3></div>
      <DelegationToggle label="Tactics & Team Selection" sub="Who sets tactics and picks the matchday XI" value={extraDelegation.tactical} onToggle={() => toggleExtraDelegation('tactical')} />
    </section>

    <section className="comm-card" ref={refs.notifications}>
      <div className="comm-card-head"><Bell size={17} color="#ffb84d" /><h3>Notifications</h3><span className="muted-sub">Mirrors the categories used in Communications → Inbox</span></div>
      <div className="notif-grid">{D.notificationCategories.map(c => <label className="notif-item" key={c}>
        <input type="checkbox" checked={notifications[c]} onChange={() => toggleNotification(c)} /><span>{c}</span>
      </label>)}</div>
    </section>

    <section className="comm-card" ref={refs.simulation}>
      <div className="comm-card-head"><Gauge size={17} color="#4d9dff" /><h3>Simulation Preferences</h3></div>
      <SettingRow label="Simulation Speed"><select value={simulation.speed} onChange={e => setSimulation(s => ({ ...s, speed: e.target.value }))}>{['Normal', 'Fast', 'Fastest'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
      <SettingRow label="Match Highlights"><select value={simulation.highlights} onChange={e => setSimulation(s => ({ ...s, highlights: e.target.value }))}>{['Full Match', 'Key Highlights', 'None'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
      <SettingRow label="Pause on Injury"><Toggle checked={simulation.pauseOnInjury} onChange={() => setSimulation(s => ({ ...s, pauseOnInjury: !s.pauseOnInjury }))} /></SettingRow>
      <SettingRow label="Pause on Red Card"><Toggle checked={simulation.pauseOnRedCard} onChange={() => setSimulation(s => ({ ...s, pauseOnRedCard: !s.pauseOnRedCard }))} /></SettingRow>
    </section>

    <section className="comm-card" ref={refs.saveCloud}>
      <div className="comm-card-head"><Cloud size={17} color="#68ff2e" /><h3>Save & Cloud</h3></div>
      <SettingRow label="Autosave"><Toggle checked={saveCloud.autosave} onChange={() => setSaveCloud(s => ({ ...s, autosave: !s.autosave }))} /></SettingRow>
      <SettingRow label="Autosave Frequency"><select value={saveCloud.frequency} onChange={e => setSaveCloud(s => ({ ...s, frequency: e.target.value }))}>{['Every Match', 'Every Week', 'Daily'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
      <SettingRow label="Cloud Sync"><Toggle checked={saveCloud.cloudSync} onChange={() => setSaveCloud(s => ({ ...s, cloudSync: !s.cloudSync }))} /></SettingRow>
    </section>

    <section className="comm-card" ref={refs.display}>
      <div className="comm-card-head"><Monitor size={17} color="#c9d3f0" /><h3>Data & Display</h3></div>
      <SettingRow label="Player Name Format"><select value={display.nameFormat} onChange={e => setDisplay(d => ({ ...d, nameFormat: e.target.value }))}>{['Full Name', 'Last Name Only'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
      <SettingRow label="Show Nationality Flags"><Toggle checked={display.showFlags} onChange={() => setDisplay(d => ({ ...d, showFlags: !d.showFlags }))} /></SettingRow>
      <SettingRow label="Currency"><select value={general.currency} onChange={e => setGeneral(g => ({ ...g, currency: e.target.value }))}>{['£', '€', '$'].map(x => <option key={x}>{x}</option>)}</select></SettingRow>
    </section>
  </div>;
}

// ================= ROOT =================

const INFO_NAV = [
  ['overview', Info, 'Overview', 'Quick summary of the club'],
  ['stadium', Landmark, 'Stadium & Facilities', 'Stadium, training ground, youth facilities'],
  ['history', Trophy, 'Club History', 'Honours, records and achievements'],
  ['rivals', Swords, 'Rivals & Affiliates', 'Rival clubs and partner clubs'],
  ['finance', Coins, 'Finance Overview', 'Key financial information'],
  ['objectives', Target, 'Objectives', 'Board expectations and club goals'],
  ['season', CalendarDays, 'Season Summary', 'Current progress and form'],
];
const SETTINGS_NAV = [
  ['general', SettingsIcon, 'General Preferences', 'Club style, language, display options'],
  ['staffDeleg', UserRound, 'Staff Delegation', 'Set assistant manager handling'],
  ['trainingDeleg', Crosshair, 'Training Delegation', 'Assign training tasks and automation'],
  ['scoutingDeleg', Binoculars, 'Scouting Delegation', 'Manage scouting and assignments'],
  ['transferDeleg', ArrowLeftRight, 'Transfer Delegation', 'Handle transfers and negotiations'],
  ['tacticalDeleg', Target, 'Match / Tactical Delegation', 'Adjust tactics and team selection'],
  ['notifications', Bell, 'Notifications', 'Choose what you want to be notified about'],
  ['simulation', Gauge, 'Simulation Preferences', 'Speed, highlights and other options'],
  ['saveCloud', Cloud, 'Save & Cloud', 'Manage saves and cloud sync'],
  ['display', Monitor, 'Data & Display', 'Player names, colours'],
];

export default function ClubScreen({ setActive, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'info');
  const goTo = (screen) => setActive(screen);

  const infoRefs = { overview: useRef(), stadium: useRef(), history: useRef(), rivals: useRef(), finance: useRef(), objectives: useRef(), season: useRef() };
  const settingsRefs = { general: useRef(), staffDeleg: useRef(), trainingDeleg: useRef(), scoutingDeleg: useRef(), transferDeleg: useRef(), tacticalDeleg: useRef(), notifications: useRef(), simulation: useRef(), saveCloud: useRef(), display: useRef() };

  const jump = (which, key) => {
    setTab(which);
    requestAnimationFrame(() => {
      const refs = which === 'info' ? infoRefs : settingsRefs;
      refs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return <div className="world-page">
    <div className="comm-header">
      <span className="comm-header-icon" style={{ background: 'linear-gradient(150deg,#e5394f,#5a0f18)' }}><Shield size={22} /></span>
      <div><h1>Club Dashboard</h1><span>Club information and settings for Newcastle United.</span></div>
    </div>
    <div className="comm-tabs">
      <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}><Info size={16} />Club Information</button>
      <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><SettingsIcon size={16} />Club Settings</button>
    </div>

    <div className="club-columns">
      <div>
        {tab === 'info' && <ClubInformation goTo={goTo} refs={infoRefs} />}
        {tab === 'settings' && <ClubSettings refs={settingsRefs} />}
      </div>
      <aside className="club-nav-col">
        <section className="comm-card">
          <div className="comm-card-head"><Info size={16} color="#3ddc84" /><h3>Club Information</h3></div>
          {INFO_NAV.map(([key, Icon, label, sub]) => <button className="nav-item" key={key} onClick={() => jump('info', key)}>
            <span className="nav-icon"><Icon size={15} /></span><div><b>{label}</b><span>{sub}</span></div><ChevronRight size={14} />
          </button>)}
        </section>
        <section className="comm-card">
          <div className="comm-card-head"><SettingsIcon size={16} color="#8a6bff" /><h3>Club Settings</h3></div>
          {SETTINGS_NAV.map(([key, Icon, label, sub]) => <button className="nav-item" key={key} onClick={() => jump('settings', key)}>
            <span className="nav-icon"><Icon size={15} /></span><div><b>{label}</b><span>{sub}</span></div><ChevronRight size={14} />
          </button>)}
        </section>
      </aside>
    </div>
  </div>;
}
