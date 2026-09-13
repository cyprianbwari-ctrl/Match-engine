import React, { useMemo, useState } from 'react';
import {
  Users, UserRound, HeartPulse, Search, ChevronRight, ChevronLeft, Plus,
  Pencil, CalendarDays, CheckCircle2, AlertTriangle, Target, Globe2,
  BriefcaseMedical, Dumbbell, ShieldCheck, Star, ArrowUpRight, UserPlus,
  FileText, BarChart3, Building2, GraduationCap, ClipboardList, Crosshair,
  Stethoscope, UserCheck, X, Bot, Inbox, Info
} from 'lucide-react';
import './staff.css';
import { useStaffData } from './store/StaffContext.jsx';
import {
  COACH_CATEGORIES, MEDICAL_CATEGORIES, SCOUT_CATEGORIES, ATTR_LABELS,
  TRAINING_GROUPS, TRAINING_AREAS, MEDICAL_RESPONSIBILITIES, STAFF_TYPES
} from './data/staffData.js';

function initials(name) { return name.split(' ').map(x => x[0]).join('').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase(); }
function Avatar({ person, large = false }) { return <div className={`staff-avatar ${large ? 'large' : ''}`}><span>{initials(person.name)}</span></div>; }
function Stars({ value = 4 }) { return <span className="stars">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />)}</span>; }
function StatBar({ label, value }) { return <div className="statbar"><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}</b></div>; }
function Pill({ children, color = 'green' }) { return <span className={`staff-pill ${color}`}>{children}</span>; }
function AttrBars({ attributes }) { return <>{Object.entries(attributes || {}).map(([k, v]) => <StatBar key={k} label={ATTR_LABELS[k] || k} value={v} />)}</>; }
function money(n) { return `£${n.toLocaleString()}`; }

function parseContractDate(str) {
  const d = new Date(str);
  return isNaN(d) ? new Date('2099-01-01') : d;
}

// ---------- Tabs & delegation ----------

function StaffTabs({ tab, setTab }) {
  const tabs = [['overview', 'Overview'], ['coaching', 'Coaching Staff'], ['medical', 'Medical Staff'], ['scouting', 'Scouting Staff'], ['find', 'Find Staff']];
  return <div className="staff-tabs">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>;
}

function DelegationBar() {
  const { delegation, toggleDelegation } = useStaffData();
  return <section className="staff-panel delegation-bar">
    <div className="delegation-item">
      <div><Bot size={16} /><b>Staff Recruitment</b></div>
      <div className="seg"><button className={delegation.recruitment === 'MANUAL' ? 'active' : ''} onClick={() => delegation.recruitment !== 'MANUAL' && toggleDelegation('recruitment')}>MANUAL</button><button className={delegation.recruitment === 'ASSISTANT' ? 'active' : ''} onClick={() => delegation.recruitment !== 'ASSISTANT' && toggleDelegation('recruitment')}>ASSISTANT MANAGER</button></div>
    </div>
    <div className="delegation-item">
      <div><Bot size={16} /><b>Staff Assignments</b></div>
      <div className="seg"><button className={delegation.assignments === 'MANUAL' ? 'active' : ''} onClick={() => delegation.assignments !== 'MANUAL' && toggleDelegation('assignments')}>MANUAL</button><button className={delegation.assignments === 'ASSISTANT' ? 'active' : ''} onClick={() => delegation.assignments !== 'ASSISTANT' && toggleDelegation('assignments')}>ASSISTANT MANAGER</button></div>
    </div>
  </section>;
}

function InboxPanel() {
  const { inbox, resolveInbox, hireCandidate } = useStaffData();
  const pending = inbox.filter(i => i.status === 'pending' || i.status === 'info');
  if (!pending.length) return null;
  return <section className="staff-panel manager-inbox">
    <div className="panel-title"><Inbox size={16} /><h2>Manager Inbox</h2><span>{pending.filter(p => p.status === 'pending').length} awaiting a decision</span></div>
    {pending.map(item => <div className="inbox-item" key={item.id}>
      {item.status === 'info' ? <Info size={15} /> : <AlertTriangle size={15} />}
      <span>{item.text}</span>
      {item.status === 'pending' && item.kind === 'hire-approval' ? <div className="inbox-actions">
        <button className="green-btn" onClick={() => resolveInbox(item.id, 'approved', () => hireCandidate(item.candidateId))}>Approve Hire</button>
        <button className="ghost-btn" onClick={() => resolveInbox(item.id, 'dismissed')}>Dismiss</button>
      </div> : item.status === 'pending' ? <div className="inbox-actions">
        <button className="green-btn" onClick={() => resolveInbox(item.id, 'approved')}>Acknowledge</button>
        <button className="ghost-btn" onClick={() => resolveInbox(item.id, 'dismissed')}>Dismiss</button>
      </div> : <button className="ghost-btn" onClick={() => resolveInbox(item.id, 'dismissed')}><X size={13} /></button>}
    </div>)}
  </section>;
}

// ---------- Shared staff list / detail ----------

function StaffList({ rows, selected, setSelected, filterDept = true, title = 'Staff List' }) {
  const [role, setRole] = useState('All Staff Roles'); const [dept, setDept] = useState('All Departments'); const [q, setQ] = useState('');
  const filtered = useMemo(() => rows.filter(s => (role === 'All Staff Roles' || s.category === role) && (dept === 'All Departments' || s.dept === dept) && s.name.toLowerCase().includes(q.toLowerCase())), [rows, role, dept, q]);
  const roles = [...new Set(rows.map(s => s.category))];
  return <section className="staff-panel staff-list-panel">
    <div className="panel-title"><h2>{title}</h2><span>{filtered.length} staff members</span></div>
    <div className="staff-filters"><select value={role} onChange={e => setRole(e.target.value)}><option>All Staff Roles</option>{roles.map(r => <option key={r}>{r}</option>)}</select>{filterDept && <select value={dept} onChange={e => setDept(e.target.value)}><option>All Departments</option><option>Coaching</option><option>Medical</option><option>Scouting</option></select>}<label><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff..." /></label></div>
    <div className="staff-table head"><span>#</span><span>NAME</span><span>ROLE</span><span>NAT</span><span>AGE</span><span>CONTRACT</span><span>RATING</span><span /></div>
    {filtered.slice(0, 10).map((s, i) => <button className={`staff-row ${selected?.id === s.id ? 'selected' : ''}`} key={s.id} onClick={() => setSelected(s)}><span>{i + 1}</span><span className="name-cell"><Avatar person={s} /><b>{s.name}</b></span><Pill color={s.color}>{s.category}</Pill><span>{s.nat}</span><span>{s.age}</span><span>{s.contract}</span><Stars value={s.rating} /><ChevronRight size={17} /></button>)}
    <div className="list-foot"><span>Showing 1 - {Math.min(filtered.length, 10)} of {rows.length} staff members</span><div><button><ChevronLeft /></button><button className="page">1</button><button><ChevronRight /></button></div></div>
  </section>;
}

function AssignControl({ person }) {
  const { assignStaff } = useStaffData();
  const [group, setGroup] = useState(person.assignment?.group || TRAINING_GROUPS[0]);
  const [area, setArea] = useState(person.assignment?.area || TRAINING_AREAS[0]);
  const [resp, setResp] = useState(person.assignment?.responsibility || MEDICAL_RESPONSIBILITIES[0]);
  if (person.category === 'Manager') return null;
  if (person.dept === 'Medical') return <div className="assign-control">
    <select value={resp} onChange={e => setResp(e.target.value)}>{MEDICAL_RESPONSIBILITIES.map(r => <option key={r}>{r}</option>)}</select>
    <button className="green-btn" onClick={() => assignStaff(person.id, { responsibility: resp })}>{person.assignment ? 'Update Responsibility' : 'Assign Responsibility'}</button>
  </div>;
  if (person.dept === 'Coaching') return <div className="assign-control">
    <select value={group} onChange={e => setGroup(e.target.value)}>{TRAINING_GROUPS.map(g => <option key={g}>{g}</option>)}</select>
    <select value={area} onChange={e => setArea(e.target.value)}>{TRAINING_AREAS.map(a => <option key={a}>{a}</option>)}</select>
    <button className="green-btn" onClick={() => assignStaff(person.id, { group, area })}>{person.assignment ? 'Update Assignment' : 'Assign to Training'}</button>
  </div>;
  return null;
}

function SelectedStaff({ person }) {
  const [innerTab, setInnerTab] = useState('Profile');
  if (!person) return <section className="staff-panel selected-staff"><p>Select a staff member.</p></section>;
  const tabs = ['Profile', 'Attributes', 'Contract'];
  return <section className="staff-panel selected-staff">
    <div className="selected-head"><Avatar person={person} large /><div><h2>{person.name}</h2><p>{person.title || person.category}</p><span>{person.nat} &nbsp; Age {person.age} &nbsp;|&nbsp; {person.club} &nbsp;|&nbsp; {person.contract}</span><Stars value={person.rating} /></div><div className="club-mini">MU</div></div>
    <div className="inner-tabs">{tabs.map(t => <button key={t} className={innerTab === t ? 'active' : ''} onClick={() => setInnerTab(t)}>{t}</button>)}</div>
    {innerTab === 'Profile' && <div className="profile-body">
      <div className="info-list"><div><span>Wage</span><b>{money(person.wage)}/wk</b></div><div><span>Status</span><b>{person.status}</b></div><div><span>Workload</span><b>{person.workload}%</b></div>{person.assignment?.group && <div><span>Assigned To</span><b>{person.assignment.group} · {person.assignment.area}</b></div>}{person.assignment?.responsibility && <div><span>Responsibility</span><b>{person.assignment.responsibility}</b></div>}</div>
      <h3>Key Responsibilities</h3>
      {(person.dept === 'Medical' ? ['Player fitness & recovery', 'Injury prevention', 'Coordination with coaching staff'] : person.dept === 'Scouting' ? ['Player identification', 'Reporting on assigned region', 'Recommending transfer targets'] : ['Player development', 'Tactical preparation', 'Match-day support']).map(x => <div className="check-line" key={x}><CheckCircle2 /> {x}</div>)}
      <AssignControl person={person} />
      {person.bio && <div className="bio"><h3>Biography</h3><p>{person.bio}</p></div>}
    </div>}
    {innerTab === 'Attributes' && <div className="profile-body"><h3>{person.dept} Attributes</h3><AttrBars attributes={person.attributes} /></div>}
    {innerTab === 'Contract' && <div className="profile-body">
      <div className="info-list"><div><span>Club</span><b>{person.club}</b></div><div><span>Contract Expiry</span><b>{person.contract}</b></div><div><span>Wage</span><b>{money(person.wage)}/wk</b></div><div><span>Status</span><b>{person.status}</b></div></div>
      <button className="purple-btn"><Pencil size={16} /> Offer New Contract</button>
    </div>}
  </section>;
}

// ---------- Overview ----------

function SummaryCards({ staffList, vacancies }) {
  const wageBill = staffList.reduce((a, s) => a + s.wage, 0);
  const youth = staffList.filter(s => s.category === 'Youth Coaches' || s.category === 'Youth Scouts').length;
  const quality = (staffList.reduce((a, s) => a + s.rating, 0) / staffList.length).toFixed(1);
  const openVacancies = vacancies.reduce((a, v) => a + v.open, 0);
  const cards = [
    ['Total Staff', staffList.length, Users, 'purple'],
    ['Coaching Staff', staffList.filter(s => s.dept === 'Coaching').length, GraduationCap, 'green'],
    ['Medical Staff', staffList.filter(s => s.dept === 'Medical').length, BriefcaseMedical, 'blue'],
    ['Scouting Staff', staffList.filter(s => s.dept === 'Scouting').length, Crosshair, 'violet'],
    ['Youth Staff', youth, UserRound, 'cyan'],
    ['Wage Bill /wk', money(wageBill), Star, 'gold'],
    ['Vacancies', openVacancies, AlertTriangle, 'orange'],
    ['Overall Quality', `${quality}★`, Star, 'pink'],
  ];
  return <section className="staff-panel overview-cards"><div className="panel-title"><h2>Staff Overview</h2></div><div className="count-grid count-grid-8">
    {cards.map(([label, val, I, color]) => <div className={`count-card ${color}`} key={label}><I /><span>{label}</span><b>{val}</b></div>)}
  </div></section>;
}

function StrengthsWeaknesses({ staffList }) {
  const byDept = ['Coaching', 'Medical', 'Scouting'].map(dept => {
    const members = staffList.filter(s => s.dept === dept);
    const totals = {};
    members.forEach(m => Object.entries(m.attributes || {}).forEach(([k, v]) => { totals[k] = (totals[k] || []).concat(v); }));
    const avgs = Object.entries(totals).map(([k, arr]) => [k, arr.reduce((a, b) => a + b, 0) / arr.length]);
    avgs.sort((a, b) => b[1] - a[1]);
    return { dept, best: avgs[0], worst: avgs[avgs.length - 1] };
  });
  return <section className="staff-panel strengths-weaknesses"><div className="panel-title"><h2>Strengths & Weaknesses</h2></div>
    {byDept.map(d => <div className="sw-row" key={d.dept}><b>{d.dept}</b>
      <span className="sw-good">▲ {d.best ? ATTR_LABELS[d.best[0]] : '—'}</span>
      <span className="sw-bad">▼ {d.worst ? ATTR_LABELS[d.worst[0]] : '—'}</span>
    </div>)}
  </section>;
}

function WorkloadPanel({ staffList, setSelected, changeTab }) {
  const top = [...staffList].sort((a, b) => b.workload - a.workload).slice(0, 5);
  return <section className="staff-panel workload-panel"><div className="panel-title"><h2>Staff Workload</h2></div>
    {top.map(s => <button className="workload-row" key={s.id} onClick={() => { setSelected(s); changeTab(s.dept === 'Medical' ? 'medical' : s.dept === 'Scouting' ? 'scouting' : 'coaching'); }}>
      <span className="name-cell"><Avatar person={s} /><b>{s.name}</b></span>
      <div className="statbar"><div><i style={{ width: `${s.workload}%`, background: s.workload > 80 ? 'linear-gradient(90deg,#ff6a3d,#ff2d2d)' : undefined }} /></div><b>{s.workload}%</b></div>
    </button>)}
  </section>;
}

function ContractExpiries({ staffList, setSelected, changeTab }) {
  const sorted = [...staffList].sort((a, b) => parseContractDate(a.contract) - parseContractDate(b.contract)).slice(0, 5);
  return <section className="staff-panel alerts"><h2><CalendarDays /> Upcoming Contract Expiries</h2>
    {sorted.map(s => <div key={s.id} onClick={() => { setSelected(s); changeTab(s.dept === 'Medical' ? 'medical' : s.dept === 'Scouting' ? 'scouting' : 'coaching'); }} style={{ cursor: 'pointer' }}>
      <AlertTriangle /><span>{s.name} — {s.contract}</span><ChevronRight />
    </div>)}
  </section>;
}

function RecommendedHires({ vacancies, candidates, changeTab, setFindType }) {
  const recs = vacancies.slice(0, 4).map(v => ({ v, cand: candidates.find(c => c.category === v.category) }));
  return <section className="staff-panel recommended-hires"><div className="panel-title"><h2>Recommended Hires</h2></div>
    {recs.length === 0 && <p className="muted">No vacancies right now — squad's fully staffed.</p>}
    {recs.map(({ v, cand }) => <button className="reco-row" key={v.category} onClick={() => { setFindType(v.category); changeTab('find'); }}>
      <div><b>{v.category}</b><span>{v.open} vacanc{v.open > 1 ? 'ies' : 'y'}</span></div>
      {cand ? <span className="reco-name">{cand.name} available</span> : <span className="reco-name muted">Search candidates</span>}
      <ChevronRight />
    </button>)}
  </section>;
}

function PerformancePanel({ staffList }) {
  const top = [...staffList].sort((a, b) => b.rating - a.rating).slice(0, 5);
  return <section className="staff-panel key-staff"><div className="panel-title"><h2>Staff Performance</h2></div><div className="key-grid">
    {top.map(s => <button key={s.id}><Avatar person={s} /><div><b>{s.name}</b><span>{s.category}</span><Stars value={s.rating} /><small>{s.nat} &nbsp; {s.contract}</small></div></button>)}
  </div></section>;
}

function Responsibilities({ changeTab }) {
  const items = [['Coaching Staff', 'Player development & tactics', GraduationCap, 'coaching'], ['Medical Staff', 'Injury prevention & recovery', BriefcaseMedical, 'medical'], ['Scouting Staff', 'Player scouting & recruitment', Search, 'scouting'], ['Find Staff', 'Recruit new backroom staff', UserPlus, 'find']];
  return <section className="staff-panel responsibilities"><div className="panel-title"><h2>Key Responsibilities</h2></div>{items.map(([a, b, I, t]) => <button key={a} onClick={() => changeTab(t)}><I /><div><b>{a}</b><span>{b}</span></div><ChevronRight /></button>)}</section>;
}
function ClubVision() { return <section className="staff-panel vision"><h2><Target /> Club Vision</h2><p>Build a world-class staff team to support our long-term success.</p><div className="club-mini">MU</div></section>; }

function Overview({ selected, setSelected, changeTab, setFindType }) {
  const { staffList, vacancies, candidates } = useStaffData();
  return <div className="staff-page">
    <DelegationBar />
    <InboxPanel />
    <div className="overview-grid">
      <div className="overview-left">
        <SummaryCards staffList={staffList} vacancies={vacancies} />
        <StaffList rows={staffList} selected={selected} setSelected={setSelected} title="Staff Currently Employed" />
        <StrengthsWeaknesses staffList={staffList} />
      </div>
      <div className="overview-middle"><SelectedStaff person={selected} /><WorkloadPanel staffList={staffList} setSelected={setSelected} changeTab={changeTab} /></div>
      <div className="overview-right"><Responsibilities changeTab={changeTab} /><ContractExpiries staffList={staffList} setSelected={setSelected} changeTab={changeTab} /><RecommendedHires vacancies={vacancies} candidates={candidates} changeTab={changeTab} setFindType={setFindType} /><ClubVision /></div>
    </div>
    <PerformancePanel staffList={staffList} />
  </div>;
}

// ---------- Coaching ----------

function Coaching({ selected, setSelected, changeTab, setFindType }) {
  const { staffList } = useStaffData();
  const coaching = staffList.filter(s => s.dept === 'Coaching');
  return <div className="staff-page"><div className="coaching-grid">
    <div className="coaching-left">
      <section className="staff-panel team-list"><div className="panel-title"><h2>Coaching Staff</h2><span>{coaching.length}/{coaching.length}</span><button className="link-btn" onClick={() => { setFindType('Coaches'); changeTab('find'); }}>Find Staff <ChevronRight /></button></div>
        <div className="staff-table head compact"><span>ROLE</span><span>NAME</span><span>NAT</span><span>AGE</span><span>CONTRACT</span><span>RATING</span><span /></div>
        {coaching.map(s => <button className={`coach-row ${selected?.id === s.id ? 'selected' : ''}`} key={s.id} onClick={() => setSelected(s)}><Pill color={s.color}>{s.category}</Pill><span className="name-cell"><Avatar person={s} /><b>{s.name}</b></span><span>{s.nat}</span><span>{s.age}</span><span>{s.contract}</span><Stars value={s.rating} /><ChevronRight /></button>)}
      </section>
      <section className="staff-panel"><div className="panel-title"><h2>Coaching Categories</h2></div><div className="count-grid">
        {COACH_CATEGORIES.map(cat => <div className="count-card blue" key={cat}><GraduationCap /><span>{cat}</span><b>{coaching.filter(s => s.category === cat).length}</b></div>)}
      </div></section>
    </div>
    <div><SelectedStaff person={selected} /></div>
    <div className="coaching-right"><section className="staff-panel summary"><h2>Coaching Overview</h2>{COACH_CATEGORIES.map(cat => <div key={cat}><Users /><span>{cat}</span><b>{coaching.filter(s => s.category === cat).length}</b></div>)}</section></div>
  </div></div>;
}

// ---------- Medical ----------

function MedicalOverview() { return <section className="staff-panel medical-overview"><h2>Medical Overview</h2><div className="fitness-ring">95%</div><b>Squad Fitness<br /><span>Excellent</span></b>{[['Injured Players', '4', 'red'], ['In Rehab', '3', 'gold'], ['Returning Soon', '2', 'blue'], ['Available', '31', 'green']].map(x => <div key={x[0]}><Pill color={x[2]}>{x[0]}</Pill><b>{x[1]}</b></div>)}</section>; }
function CurrentInjuries() { return <section className="staff-panel injuries"><div className="panel-title"><h2>Current Injuries & Expected Return</h2></div>{[['Lisandro Martínez', 'Knee Ligament Tear', '12 Jan 2026', 'red'], ['Mason Mount', 'Hamstring Injury', '5 Jan 2026', 'red'], ['Luke Shaw', 'Calf Strain', '20 Dec 2025', 'gold'], ['Rasmus Højlund', 'Ankle Sprain', '8 Jan 2026', 'gold']].map(x => <div key={x[0]}><Pill color={x[3]}>{x[0]}</Pill><span>{x[1]}</span><b>{x[2]}</b></div>)}</section>; }
function Recovery() { return <section className="staff-panel recovery"><h2><HeartPulse /> Player Recovery & Fitness</h2>{[['Recovery Rate', 92], ['Injury Prevention', 88], ['Fitness Levels', 90], ['Medical Support', 95]].map(x => <StatBar key={x[0]} label={x[0]} value={x[1]} />)}</section>; }

function Medical({ selected, setSelected, changeTab, setFindType }) {
  const { staffList } = useStaffData();
  const medical = staffList.filter(s => s.dept === 'Medical');
  return <div className="staff-page"><div className="medical-grid">
    <div className="medical-left">
      <section className="staff-panel overview-cards"><div className="panel-title"><h2>Medical Staff</h2><button className="link-btn" onClick={() => { setFindType('Doctors'); changeTab('find'); }}>Find Staff <ChevronRight /></button></div><div className="count-grid medical-count">
        {MEDICAL_CATEGORIES.map((cat, i) => <div className={`count-card ${['purple', 'green', 'blue', 'violet', 'gold'][i % 5]}`} key={cat}><Stethoscope /><span>{cat}</span><b>{medical.filter(s => s.category === cat).length}</b></div>)}
      </div></section>
      <section className="staff-panel staff-list-panel medical-list"><div className="panel-title"><h2>Medical Staff List</h2></div>
        <div className="staff-table head medical-head"><span>#</span><span>NAME</span><span>ROLE</span><span>AGE</span><span>NAT</span><span>CONTRACT</span><span>STATUS</span></div>
        {medical.map((s, i) => <button className={`staff-row ${selected?.id === s.id ? 'selected' : ''}`} key={s.id} onClick={() => setSelected(s)}><span>{i + 1}</span><span className="name-cell"><Avatar person={s} /><b>{s.name}</b></span><Pill color={s.color}>{s.category}</Pill><span>{s.age}</span><span>{s.nat}</span><span>{s.contract}</span><Pill color="green">{s.status}</Pill></button>)}
      </section>
    </div>
    <div><SelectedStaff person={selected} /></div>
    <div className="medical-right"><MedicalOverview /><CurrentInjuries /></div>
    <div className="medical-bottom"><Recovery /></div>
  </div></div>;
}

// ---------- Scouting ----------

function ScoutAssignmentsPanel() {
  const { staffList, scoutAssignments, addScoutAssignment, updateScoutAssignmentStatus } = useStaffData();
  const scouts = staffList.filter(s => s.dept === 'Scouting');
  const [scout, setScout] = useState(scouts[0]?.name || '');
  const [region, setRegion] = useState(''); const [focus, setFocus] = useState(''); const [duration, setDuration] = useState(30);
  const submit = (e) => { e.preventDefault(); if (!region.trim() || !focus.trim()) return; addScoutAssignment({ scout, region: region.trim(), focus: focus.trim(), duration: Number(duration) }); setRegion(''); setFocus(''); };
  return <section className="staff-panel assignments"><div className="panel-title"><h2>Scout Assignments</h2><span>Shared with Scouting page</span></div>
    <form className="assignment-form staff-assign-form" onSubmit={submit}>
      <select value={scout} onChange={e => setScout(e.target.value)}>{scouts.map(s => <option key={s.id}>{s.name}</option>)}</select>
      <input placeholder="Region / competition" value={region} onChange={e => setRegion(e.target.value)} />
      <input placeholder="Focus" value={focus} onChange={e => setFocus(e.target.value)} />
      <input type="number" min="5" max="120" value={duration} onChange={e => setDuration(e.target.value)} />
      <button type="submit">Assign</button>
    </form>
    <div className="assignment-head"><span>SCOUT</span><span>REGION</span><span>FOCUS</span><span>STATUS</span></div>
    {scoutAssignments.map(a => <div className="assignment-row-4" key={a.id}><span className="name-cell"><Avatar person={{ name: a.scout }} /><b>{a.scout}</b></span><span>{a.region}</span><span>{a.focus}</span><select value={a.status} onChange={e => updateScoutAssignmentStatus(a.id, e.target.value)}>{['In Progress', 'On Track', 'Delayed', 'Completed'].map(s => <option key={s}>{s}</option>)}</select></div>)}
  </section>;
}

function QuickActions({ setActive, changeTab }) {
  const [msg, setMsg] = useState('');
  const actions = [
    ['Search Players', Search, () => setActive('Scouting')],
    ['Shortlist', Star, () => setActive('Scouting')],
    ['Scout Reports', FileText, () => setActive('Scouting')],
    ['Transfer Targets', Target, () => setActive('Transfers')],
    ['Find Staff', UserPlus, () => changeTab('find')],
    ['Scout Network', Globe2, () => setMsg('Scout Network')],
  ];
  return <section className="staff-panel quick-actions"><h2><Target /> Quick Actions</h2><div>{actions.map(([label, I, fn]) => <button key={label} onClick={fn}><I /> {label}</button>)}</div>{msg && <span className="action-toast">{msg} opened <X size={12} onClick={() => setMsg('')} /></span>}</section>;
}

function Scouting({ selected, setSelected, changeTab, setFindType, setActive }) {
  const { staffList } = useStaffData();
  const scouting = staffList.filter(s => s.dept === 'Scouting');
  return <div className="staff-page"><div className="scout-grid">
    <div className="scout-left">
      <section className="staff-panel overview-cards"><div className="panel-title"><h2>Scouting Staff</h2><span>{scouting.length} Staff</span></div><div className="count-grid">
        {SCOUT_CATEGORIES.map((cat, i) => <div className={`count-card ${['purple', 'green', 'blue', 'violet', 'gold'][i % 5]}`} key={cat}><Crosshair /><span>{cat}</span><b>{scouting.filter(s => s.category === cat).length}</b></div>)}
      </div></section>
      <section className="staff-panel staff-list-panel"><div className="panel-title"><h2>Scouting Staff</h2><button className="link-btn" onClick={() => { setFindType('Scouts'); changeTab('find'); }}>Find Staff <ChevronRight /></button></div>
        <div className="staff-table head scout-head"><span>#</span><span>NAME</span><span>ROLE</span><span>NAT</span><span>AGE</span><span>CONTRACT</span><span>STATUS</span></div>
        {scouting.map((s, i) => <button className={`staff-row ${selected?.id === s.id ? 'selected' : ''}`} key={s.id} onClick={() => setSelected(s)}><span>{i + 1}</span><span className="name-cell"><Avatar person={s} /><b>{s.name}</b></span><Pill color={s.color}>{s.category}</Pill><span>{s.nat}</span><span>{s.age}</span><span>{s.contract}</span><Pill color="green">{s.status}</Pill></button>)}
      </section>
      <ScoutAssignmentsPanel />
    </div>
    <div className="scout-middle"><SelectedStaff person={selected} /></div>
    <div className="scout-right"><QuickActions setActive={setActive} changeTab={changeTab} /></div>
  </div></div>;
}

// ---------- Find Staff ----------

const STAGES = ['Search', 'Shortlist', 'Interview', 'Negotiate', 'Hire'];
function Stepper({ stage }) { return <div className="stepper">{STAGES.map((s, i) => <React.Fragment key={s}><span className={i <= STAGES.indexOf(stage) ? 'done' : ''}>{s}</span>{i < STAGES.length - 1 && <i className={i < STAGES.indexOf(stage) ? 'done' : ''} />}</React.Fragment>)}</div>; }

function CandidateDetail({ cand, onAdvance, onHire, onReject }) {
  const [tab, setTab] = useState('Profile');
  if (!cand) return <section className="staff-panel selected-staff"><p>Select a candidate to see their profile.</p></section>;
  const tabs = ['Profile', 'Attributes', 'Personality', 'Reputation', 'Contract', 'Responsibilities'];
  return <section className="staff-panel selected-staff">
    <div className="selected-head"><Avatar person={cand} large /><div><h2>{cand.name}</h2><p>{cand.category}</p><span>{cand.nat} &nbsp; Age {cand.age} &nbsp;|&nbsp; {cand.club}</span><Stars value={cand.reputation} /></div></div>
    <Stepper stage={cand.stage} />
    <div className="inner-tabs">{tabs.map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === 'Profile' && <div className="profile-body"><div className="info-list"><div><span>Staff Type</span><b>{cand.staffType}</b></div><div><span>Current Club</span><b>{cand.club}</b></div><div><span>Availability</span><b>{cand.availability}</b></div></div></div>}
    {tab === 'Attributes' && <div className="profile-body"><AttrBars attributes={cand.attributes} /></div>}
    {tab === 'Personality' && <div className="profile-body"><div className="info-list"><div><span>Personality</span><b>{cand.personality}</b></div></div></div>}
    {tab === 'Reputation' && <div className="profile-body"><Stars value={cand.reputation} /><p className="muted">Reputation reflects how highly this candidate is regarded across the game.</p></div>}
    {tab === 'Contract' && <div className="profile-body"><div className="info-list"><div><span>Contract Status</span><b>{cand.contractStatus}</b></div><div><span>Wage Demand</span><b>{money(cand.wageDemand)}/wk</b></div></div></div>}
    {tab === 'Responsibilities' && <div className="profile-body">{['Oversee day-to-day duties in their department', 'Report progress to the manager', 'Collaborate with existing staff'].map(x => <div className="check-line" key={x}><CheckCircle2 /> {x}</div>)}</div>}
    <div className="candidate-actions">
      {cand.stage !== 'Hire' && <button className="purple-btn" onClick={onAdvance}>Advance to {STAGES[STAGES.indexOf(cand.stage) + 1]}</button>}
      {cand.stage === 'Negotiate' && <button className="green-btn" onClick={onHire}>Hire</button>}
      <button className="ghost-btn" onClick={onReject}>Reject</button>
    </div>
  </section>;
}

function FindStaff({ findType, setFindType }) {
  const { candidates, advanceCandidate, hireCandidate, rejectCandidate, vacancies } = useStaffData();
  const [staffType, setStaffType] = useState('All Types');
  const [contractStatus, setContractStatus] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [minRep, setMinRep] = useState(0);
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => candidates.filter(c =>
    (staffType === 'All Types' || c.staffType === staffType) &&
    (!findType || c.category === findType) &&
    (contractStatus === 'All' || c.contractStatus === contractStatus) &&
    (availability === 'All' || c.availability === availability) &&
    c.reputation >= minRep
  ), [candidates, staffType, findType, contractStatus, availability, minRep]);
  const sel = filtered.find(c => c.id === selected?.id) || filtered[0] || null;
  return <div className="staff-page find-staff-page">
    <section className="staff-panel find-filters">
      <div className="panel-title"><h2>Find Staff</h2>{findType && <button className="link-btn" onClick={() => setFindType(null)}>Clear category filter ({findType}) <X size={13} /></button>}</div>
      <div className="find-filter-grid">
        <label>Staff Type<select value={staffType} onChange={e => setStaffType(e.target.value)}><option>All Types</option>{STAFF_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label>Contract Status<select value={contractStatus} onChange={e => setContractStatus(e.target.value)}><option>All</option><option>Free Agent</option><option>Under Contract</option></select></label>
        <label>Availability<select value={availability} onChange={e => setAvailability(e.target.value)}><option>All</option><option>Immediate</option><option>End of Season</option></select></label>
        <label>Min. Reputation<select value={minRep} onChange={e => setMinRep(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}</select></label>
      </div>
      {vacancies.length > 0 && <div className="vacancy-chips">{vacancies.map(v => <button key={v.category} className={findType === v.category ? 'active' : ''} onClick={() => setFindType(v.category)}>{v.category} ({v.open})</button>)}</div>}
    </section>
    <div className="find-columns">
      <section className="staff-panel find-results"><div className="panel-title"><h2>Results</h2><span>{filtered.length} candidates</span></div>
        {filtered.map(c => <button key={c.id} className={`candidate-card ${sel?.id === c.id ? 'selected' : ''}`} onClick={() => setSelected(c)}>
          <Avatar person={c} /><div><b>{c.name}</b><span>{c.category} · {c.nat} · Age {c.age}</span><Stars value={c.reputation} /></div>
          <div className="candidate-meta"><Pill color={c.contractStatus === 'Free Agent' ? 'green' : 'blue'}>{c.contractStatus}</Pill><small>{money(c.wageDemand)}/wk</small><em>{c.stage}</em></div>
        </button>)}
        {filtered.length === 0 && <p className="muted">No candidates match these filters.</p>}
      </section>
      <CandidateDetail cand={sel} onAdvance={() => advanceCandidate(sel.id)} onHire={() => hireCandidate(sel.id)} onReject={() => rejectCandidate(sel.id)} />
    </div>
  </div>;
}

// ---------- Root ----------

export default function StaffScreen({ active, setActive }) {
  const { staffList } = useStaffData();
  const [tab, setTab] = useState('overview');
  const [selected, setSelected] = useState(null);
  const [findType, setFindType] = useState(null);
  const changeTab = (t) => {
    setTab(t);
    const pool = t === 'coaching' ? staffList.filter(s => s.dept === 'Coaching') : t === 'medical' ? staffList.filter(s => s.dept === 'Medical') : t === 'scouting' ? staffList.filter(s => s.dept === 'Scouting') : staffList;
    if (t !== 'find') setSelected(pool[0] || null);
  };
  return <>
    <StaffTabs tab={tab} setTab={changeTab} />
    {tab === 'overview' ? <Overview selected={selected} setSelected={setSelected} changeTab={changeTab} setFindType={setFindType} />
      : tab === 'coaching' ? <Coaching selected={selected} setSelected={setSelected} changeTab={changeTab} setFindType={setFindType} />
      : tab === 'medical' ? <Medical selected={selected} setSelected={setSelected} changeTab={changeTab} setFindType={setFindType} />
      : tab === 'scouting' ? <Scouting selected={selected} setSelected={setSelected} changeTab={changeTab} setFindType={setFindType} setActive={setActive} />
      : <FindStaff findType={findType} setFindType={setFindType} />}
    <div className="staff-bottom-spacer" />
  </>;
}
