import React, { useState, useMemo } from 'react';
import {
  Globe2, Info, ChevronDown, TrendingUp, TrendingDown, Minus, X, Star,
  Search as SearchIcon, MapPin, Sparkles, ArrowLeftRight, Users, ShieldCheck,
  Trophy, UserRound, ChevronRight
} from 'lucide-react';
import './world.css';
import { useWorldData } from './store/WorldContext.jsx';

// ---------- Shared bits ----------

function PlayerAvatar({ name, size = 34 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return <span className="wp-avatar" style={{ width: size, height: size, fontSize: size * 0.32, background: `radial-gradient(circle at 32% 28%, hsl(${hue} 70% 45%), hsl(${hue} 60% 20%) 70%, #05070f 130%)` }}>{initials}</span>;
}

function RatingBadge({ value }) {
  const color = value >= 90 ? '#3ddc84' : value >= 80 ? '#a6e22e' : value >= 70 ? '#ffd76b' : '#ff9d5c';
  return <span className="rating-badge" style={{ background: `${color}22`, color, borderColor: `${color}88` }}>{value}</span>;
}

function ChangeIndicator({ value }) {
  if (value > 0) return <span className="chg up"><TrendingUp size={13} />+{value}</span>;
  if (value < 0) return <span className="chg down"><TrendingDown size={13} />{value}</span>;
  return <span className="chg flat"><Minus size={13} />0</span>;
}

function FormDots({ form }) {
  return <span className="form-dots">{form.map((v, i) => <i key={i} style={{ background: v >= 88 ? '#3ddc84' : v >= 78 ? '#a6e22e' : v >= 65 ? '#ffd76b' : '#ff6b6b' }} />)}</span>;
}

function ResultBadge({ r }) {
  const cls = r === 'W' ? 'w' : r === 'L' ? 'l' : 'd';
  return <span className={`res-badge ${cls}`}>{r}</span>;
}

// ================= PLAYER PROFILE MODAL =================

export function PlayerProfileModal({ goTo }) {
  const { selectedPlayer: p, profileOpen, setProfileOpen, toggleShortlist, shortlist, addScout, scouted } = useWorldData();
  const [tab, setTab] = useState('Overview');
  const [convoMsg, setConvoMsg] = useState('');
  if (!profileOpen || !p) return null;
  const isShortlisted = shortlist.includes(p.id);
  const isScouted = scouted.includes(p.id);
  const isOwn = !!p.isOwn;

  const convoOptions = [
    ['Praise Performance', 'He nods, looking pleased. Morale improved slightly.'],
    ['Ask About Playing Time', 'He appreciates the honesty and asks for patience.'],
    ['Discuss Contract', 'He\u2019s open to talks — his agent will be in touch.'],
    ['Reassure on Role', 'He seems reassured, but will judge you on team selection.'],
  ];

  return <div className="wp-modal-backdrop" onClick={() => setProfileOpen(false)}>
    <div className="wp-modal" onClick={e => e.stopPropagation()}>
      <button className="wp-modal-close" onClick={() => setProfileOpen(false)}><X size={18} /></button>
      <div className="wp-modal-head">
        <PlayerAvatar name={p.name} size={72} />
        <div>
          <h2>{p.name} <span className="wp-flag">{p.nat}</span></h2>
          <span className="muted-sub">{p.pos} · {p.club} · Age {p.age} · {p.country}</span>
        </div>
        <div className="wp-modal-rating"><RatingBadge value={p.rating} /><ChangeIndicator value={p.change} /></div>
      </div>
      <div className="sub-tabs">{['Overview', 'Stats', 'Career', ...(isOwn ? ['Conversation'] : [])].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && <div className="wp-modal-body">
        <div className="panel-label">Key Attributes</div>
        <div className="attr-bars">{Object.entries(p.keyAttributes).map(([k, v]) => <div className="attr-row" key={k}><span>{k}</span><div className="attr-track"><i style={{ width: `${v}%` }} /></div><b>{v}</b></div>)}</div>
        <div className="wp-info-grid">
          <div><span>Preferred Foot</span><b>{p.preferredFoot}</b></div>
          <div><span>Potential</span><b>{p.potential}</b></div>
          <div><span>Value</span><b>{p.value}</b></div>
          <div><span>Wage</span><b>{p.wage}</b></div>
          <div><span>Contract Expiry</span><b>{p.contractExpiry}</b></div>
          <div><span>Reputation</span><b>{p.reputation}</b></div>
          <div><span>Tactical Role</span><b>{p.tacticalRole}</b></div>
          <div><span>Availability</span><b>{p.availability}</b></div>
        </div>
      </div>}
      {tab === 'Stats' && <div className="wp-modal-body">
        <div className="panel-label">Season Statistics</div>
        <div className="pst-row pst-head"><span>Season</span><span>Club</span><span>Apps</span><span>Goals</span><span>Assists</span></div>
        {p.career.map(c => <div className="pst-row" key={c.season}><b>{c.season}</b><span>{c.club}</span><span>{c.apps}</span><span>{c.goals}</span><span>{c.assists}</span></div>)}
        <div className="panel-label" style={{ marginTop: 10 }}>Recent Form</div>
        <div className="form-row">{p.recentResults.map((r, i) => <ResultBadge r={r} key={i} />)}</div>
      </div>}
      {tab === 'Career' && <div className="wp-modal-body">
        <div className="panel-label">Career History</div>
        {p.career.map((c, i) => <div className="career-row" key={i}><b>{c.season}</b><span>{c.club}</span><span className="muted-sub">{c.apps} apps · {c.goals} goals · {c.assists} assists</span></div>)}
      </div>}
      {tab === 'Conversation' && isOwn && <div className="wp-modal-body">
        <div className="panel-label">Have a Word</div>
        <div className="convo-grid">{convoOptions.map(([label, resp]) => <button key={label} className="wp-action" onClick={() => setConvoMsg(resp)}>{label}</button>)}</div>
        {convoMsg && <div className="convo-response"><b>{p.name}:</b> {convoMsg}</div>}
      </div>}

      <div className="wp-modal-actions">
        {!isOwn && <>
          <button className="wp-action" onClick={() => addScout(p.id)}><SearchIcon size={15} />{isScouted ? 'Scouted' : 'Scout Player'}</button>
          <button className={`wp-action ${isShortlisted ? 'active' : ''}`} onClick={() => toggleShortlist(p.id)}><Star size={15} fill={isShortlisted ? 'currentColor' : 'none'} />{isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}</button>
          <button className="wp-action solid" onClick={() => { goTo('Transfers'); setProfileOpen(false); }}><ArrowLeftRight size={15} />Approach for Transfer</button>
        </>}
        {isOwn && <>
          <button className="wp-action solid" onClick={() => { goTo('Squad'); setProfileOpen(false); }}><UserRound size={15} />View in Squad</button>
          <button className="wp-action" onClick={() => setTab('Conversation')}><Users size={15} />Have a Word</button>
        </>}
      </div>
    </div>
  </div>;
}

// ================= GLOBAL RANKING =================

function PlayerSidePanel() {
  const { selectedPlayer: p, setProfileOpen } = useWorldData();
  const [tab, setTab] = useState('Overview');
  if (!p) return null;
  return <aside className="wp-side-panel">
    <div className="wp-side-top">
      <PlayerAvatar name={p.name} size={64} />
      <span className="wp-rank-badge gold">{p.rank}</span>
    </div>
    <h3>{p.name}</h3>
    <span className="muted-sub">{p.nat} {p.country}</span>
    <div className="wp-side-meta"><span>{p.pos}</span><span>{p.club}</span><span>Age {p.age}</span></div>
    <div className="wp-side-rating"><RatingBadge value={p.rating} /><ChangeIndicator value={p.change} /><small>(Last update: 14 Dec 2025)</small></div>
    <div className="sub-tabs small">{['Overview', 'Stats', 'Career'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === 'Overview' && <>
      <div className="panel-label">Key Attributes</div>
      <div className="attr-bars">{Object.entries(p.keyAttributes).slice(0, 6).map(([k, v]) => <div className="attr-row" key={k}><span>{k}</span><div className="attr-track"><i style={{ width: `${v}%` }} /></div><b>{v}</b></div>)}</div>
      <div className="panel-label">Player Info</div>
      <div className="wp-info-list">
        <div><span>Preferred Foot</span><b>{p.preferredFoot}</b></div>
        <div><span>Value</span><b>{p.value}</b></div>
        <div><span>Wage</span><b>{p.wage}</b></div>
        <div><span>Contract Expiry</span><b>{p.contractExpiry}</b></div>
        <div><span>Reputation</span><b>{p.reputation}</b></div>
      </div>
    </>}
    {tab === 'Stats' && <div className="pst-row pst-head"><span>Season</span><span>Apps</span><span>G</span><span>A</span></div>}
    {tab === 'Stats' && p.career.map(c => <div className="pst-row" key={c.season}><b>{c.season}</b><span>{c.apps}</span><span>{c.goals}</span><span>{c.assists}</span></div>)}
    {tab === 'Career' && p.career.map((c, i) => <div className="career-row" key={i}><b>{c.season}</b><span>{c.club}</span></div>)}
    <div className="panel-label">Recent Form</div>
    <div className="form-row">{p.recentResults.map((r, i) => <ResultBadge r={r} key={i} />)}</div>
    <button className="wp-action solid full" onClick={() => setProfileOpen(true)}><UserRound size={15} />View Player Profile</button>
  </aside>;
}

function GlobalRanking() {
  const { rankedList, rankingMode, setRankingMode, rankingScope, setRankingScope, selectedId, setSelectedId, players } = useWorldData();
  const [posFilter, setPosFilter] = useState('All Positions');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [clubFilter, setClubFilter] = useState('All Clubs');

  const countries = useMemo(() => ['All Countries', ...new Set(players.map(p => p.country))], [players]);
  const clubs = useMemo(() => ['All Clubs', ...new Set(players.map(p => p.club))], [players]);
  const positions = useMemo(() => ['All Positions', ...new Set(players.map(p => p.pos))], [players]);

  const passesFilter = (p) => (posFilter === 'All Positions' || p.pos === posFilter)
    && (countryFilter === 'All Countries' || p.country === countryFilter)
    && (clubFilter === 'All Clubs' || p.club === clubFilter);

  const modes = [['ranking', 'Ranking'], ['position', 'Position Ranking'], ['nationality', 'Nationality'], ['club', 'Club'], ['form', 'Form']];

  return <div className="world-tab-page">
    <div className="gr-head">
      <div>
        <h2>Global Ranking</h2>
        <span className="muted-sub">The world's best players, ranked by current performance. Top 100 only.</span>
      </div>
      <Info size={18} color="#3ddc84" />
      <select className="scope-select" value={rankingScope} onChange={e => setRankingScope(e.target.value)}>
        {['Top 10', 'Top 25', 'Top 50', 'Top 100'].map(s => <option key={s}>{s}</option>)}
      </select>
    </div>
    <div className="sub-tabs">{modes.map(([id, label]) => <button key={id} className={rankingMode === id ? 'active' : ''} onClick={() => setRankingMode(id)}>{label}</button>)}</div>

    <div className="gr-columns">
      <section className="comm-card gr-table-card">
        <div className="gr-table-head-row"><span>#</span><span>Player</span><span>Pos</span><span>Club</span><span>Age</span><span>Rating</span><span>Form</span><span>Value</span><span>Change</span></div>
        <div className="gr-table-body">
          {rankedList.groups.map((g, gi) => <React.Fragment key={g.label || gi}>
            {g.label && <div className="gr-group-label">{g.label}</div>}
            {g.rows.filter(passesFilter).map(p => <button key={p.id} className={`gr-row ${p.id === selectedId ? 'selected' : ''} ${p.rank <= 100 ? 'top100' : ''}`} onClick={() => setSelectedId(p.id)}>
              <span className={`gr-rank ${g.label ? '' : p.groupRank <= 5 ? 'gold' : ''}`}>{p.groupRank}</span>
              <span className="gr-player"><PlayerAvatar name={p.name} /><div><b>{p.name}</b><small>{p.nat} {p.country}</small></div></span>
              <span>{p.pos}</span>
              <span>{p.club}</span>
              <span>{p.age}</span>
              <span><RatingBadge value={p.rating} /></span>
              <span><FormDots form={p.form} /></span>
              <span>{p.value}</span>
              <span><ChangeIndicator value={p.change} /></span>
            </button>)}
          </React.Fragment>)}
        </div>
        <div className="gr-footer">
          <select value={posFilter} onChange={e => setPosFilter(e.target.value)}>{positions.map(x => <option key={x}>{x}</option>)}</select>
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>{countries.map(x => <option key={x}>{x}</option>)}</select>
          <select value={clubFilter} onChange={e => setClubFilter(e.target.value)}>{clubs.map(x => <option key={x}>{x}</option>)}</select>
          <div className="gr-legend"><span className="up"><TrendingUp size={12} />Up</span><span className="down"><TrendingDown size={12} />Down</span><span className="flat"><Minus size={12} />No change</span></div>
        </div>
      </section>
      <PlayerSidePanel />
    </div>
  </div>;
}

// ================= PLAYER SEARCH =================

function PlayerSearch() {
  const { filters, setFilters, searchResults, players, toggleShortlist, shortlist, addScout, scouted, setSelectedId, setProfileOpen } = useWorldData();
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const positions = useMemo(() => ['All', ...new Set(players.map(p => p.pos))], [players]);
  const clubs = useMemo(() => ['All', ...new Set(players.map(p => p.club))], [players]);
  const countries = useMemo(() => ['All', ...new Set(players.map(p => p.country))], [players]);
  const leaguesList = useMemo(() => ['All', ...new Set(players.map(p => p.league))], [players]);

  const openProfile = (p) => { setSelectedId(p.id); setProfileOpen(true); };

  return <div className="world-tab-page">
    <div className="comm-col-head"><span className="flag-badge"><SearchIcon size={18} /></span><div><h2>Player Search</h2><span>The worldwide player database — find anyone, then Scout, Shortlist or pursue a Transfer.</span></div></div>
    <section className="comm-card">
      <div className="ps-filter-grid">
        <label>Name<input value={filters.name} onChange={e => set('name', e.target.value)} placeholder="Search by name..." /></label>
        <label>Position<select value={filters.position} onChange={e => set('position', e.target.value)}>{positions.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Club<select value={filters.club} onChange={e => set('club', e.target.value)}>{clubs.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Country<select value={filters.country} onChange={e => set('country', e.target.value)}>{countries.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>League<select value={filters.league} onChange={e => set('league', e.target.value)}>{leaguesList.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Preferred Foot<select value={filters.foot} onChange={e => set('foot', e.target.value)}>{['All', 'Left', 'Right'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Min Rating<input type="number" min={0} max={99} value={filters.minRating} onChange={e => set('minRating', Number(e.target.value))} /></label>
        <label>Min Potential<input type="number" min={0} max={99} value={filters.minPotential} onChange={e => set('minPotential', Number(e.target.value))} /></label>
        <label>Availability<select value={filters.availability} onChange={e => set('availability', e.target.value)}>{['All', 'Not for Sale', 'Will Consider Offers', 'Transfer Listed'].map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
    </section>
    <section className="comm-card">
      <div className="comm-card-head"><h3>Results</h3><span className="muted-sub">{searchResults.length} players found</span></div>
      <div className="gr-table-head-row search"><span>Player</span><span>Pos</span><span>Club</span><span>Age</span><span>Rating</span><span>Pot.</span><span>Value</span><span>Availability</span><span>Actions</span></div>
      <div className="gr-table-body">
        {searchResults.map(p => <div key={p.id} className="gr-row search">
          <button className="gr-player as-link" onClick={() => openProfile(p)}><PlayerAvatar name={p.name} /><div><b>{p.name}</b><small>{p.nat} {p.country}</small></div></button>
          <span>{p.pos}</span><span>{p.club}</span><span>{p.age}</span>
          <span><RatingBadge value={p.rating} /></span><span>{p.potential}</span><span>{p.value}</span>
          <span className="avail-tag">{p.availability}</span>
          <span className="ps-actions">
            <button title="Scout Player" onClick={() => addScout(p.id)}><SearchIcon size={13} color={scouted.includes(p.id) ? '#3ddc84' : '#c8d0e6'} /></button>
            <button title="Shortlist" onClick={() => toggleShortlist(p.id)}><Star size={13} fill={shortlist.includes(p.id) ? 'currentColor' : 'none'} color={shortlist.includes(p.id) ? '#ffd76b' : '#c8d0e6'} /></button>
            <button title="View Profile" onClick={() => openProfile(p)}><ChevronRight size={14} color="#c8d0e6" /></button>
          </span>
        </div>)}
        {searchResults.length === 0 && <p className="muted-sub" style={{ padding: 12 }}>No players match these filters.</p>}
      </div>
    </section>
  </div>;
}

// ================= SCOUTING / WORLD INFO =================

function WorldInfo() {
  const { leagues, wonderkids, transferActivity, reputationMovers, availablePlayers, toggleShortlist, shortlist, setSelectedId, setProfileOpen } = useWorldData();
  const regions = [['Europe', 68], ['South America', 34], ['Asia', 22], ['Africa', 18], ['North America', 14]];

  const openProfile = (p) => { setSelectedId(p.id); setProfileOpen(true); };

  return <div className="world-tab-page">
    <div className="comm-col-head"><span className="flag-badge"><Globe2 size={18} /></span><div><h2>Scouting / World Information</h2><span>What's happening across world football — leagues, clubs, wonderkids and the transfer market.</span></div></div>

    <div className="two-col">
      <section className="comm-card">
        <div className="comm-card-head"><ShieldCheck size={17} color="#8a6bff" /><h3>Countries & Leagues</h3></div>
        {leagues.map(l => <div className="league-row" key={l.league}>
          <div><b>{l.league}</b><span className="muted-sub">{l.country} · {l.topClubs.join(', ')}</span></div>
          <div className="league-bars">
            <div className="lb-item"><span>Strength</span><div className="attr-track"><i style={{ width: `${l.strength}%`, background: '#8a6bff' }} /></div></div>
            <div className="lb-item"><span>Your Scouting Knowledge</span><div className="attr-track"><i style={{ width: `${l.knowledge}%`, background: l.knowledge > 50 ? '#3ddc84' : '#ffb84d' }} /></div></div>
          </div>
        </div>)}
      </section>

      <div className="ovg-col">
        <section className="comm-card">
          <div className="comm-card-head"><Sparkles size={17} color="#ffd76b" /><h3>Wonderkids</h3></div>
          <div className="wonderkid-grid">{wonderkids.map(w => <div className="wonderkid-card" key={w.name}>
            <b>{w.name}</b><span>{w.pos} · Age {w.age}</span><span className="muted-sub">{w.club}</span>
            <span className="wk-pot">PA {w.potential}</span>
          </div>)}</div>
        </section>

        <section className="comm-card">
          <div className="comm-card-head"><MapPin size={17} color="#4d9dff" /><h3>Scouting Knowledge by Region</h3></div>
          {regions.map(([r, v]) => <div className="lb-item wide" key={r}><span>{r}</span><div className="attr-track"><i style={{ width: `${v}%`, background: '#4d9dff' }} /></div><b>{v}%</b></div>)}
        </section>
      </div>
    </div>

    <div className="two-col">
      <section className="comm-card">
        <div className="comm-card-head"><ArrowLeftRight size={17} color="#3ddc84" /><h3>World Transfer Activity</h3></div>
        {transferActivity.map((t, i) => <div className="transfer-row" key={i}>
          <div><b>{t.headline}</b><p className="muted-sub">{t.detail}</p></div>
          <div className="transfer-meta"><span className={`tag-pill sm ${t.tag.toLowerCase()}`}>{t.tag}</span><small>{t.time}</small></div>
        </div>)}
      </section>

      <section className="comm-card">
        <div className="comm-card-head"><Trophy size={17} color="#ff8a5c" /><h3>Reputation Movers</h3></div>
        <div className="panel-label">Rising</div>
        {reputationMovers.rising.map(p => <button className="mover-row" key={p.id} onClick={() => openProfile(p)}><PlayerAvatar name={p.name} size={26} /><b>{p.name}</b><ChangeIndicator value={p.change} /></button>)}
        <div className="panel-label" style={{ marginTop: 8 }}>Falling</div>
        {reputationMovers.falling.map(p => <button className="mover-row" key={p.id} onClick={() => openProfile(p)}><PlayerAvatar name={p.name} size={26} /><b>{p.name}</b><ChangeIndicator value={p.change} /></button>)}
      </section>
    </div>

    <section className="comm-card">
      <div className="comm-card-head"><Users size={17} color="#b06bff" /><h3>Available Players</h3><span className="muted-sub">Transfer listed or open to offers</span></div>
      {availablePlayers.map(p => <div className="mover-row wide" key={p.id}>
        <PlayerAvatar name={p.name} size={30} /><b>{p.name}</b><span className="muted-sub">{p.pos} · {p.club}</span>
        <span className="avail-tag">{p.availability}</span>
        <button className="ia-btn" onClick={() => toggleShortlist(p.id)}><Star size={12} fill={shortlist.includes(p.id) ? 'currentColor' : 'none'} />{shortlist.includes(p.id) ? 'Shortlisted' : 'Shortlist'}</button>
        <button className="ia-btn" onClick={() => openProfile(p)}>View Profile</button>
      </div>)}
    </section>
  </div>;
}

// ================= ROOT =================

const TABS = [['ranking', 'Global Ranking', Trophy], ['search', 'Player Search', SearchIcon], ['info', 'Scouting / World Info', Globe2]];

export default function WorldScreen({ setActive, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'ranking');
  const goTo = (screen) => setActive(screen);

  return <div className="world-page">
    <div className="comm-header">
      <span className="comm-header-icon" style={{ background: 'linear-gradient(150deg,#4d9dff,#1a3a7a)' }}><Globe2 size={22} /></span>
      <div><h1>World</h1><span>Discover. Scout. Explore.</span></div>
    </div>
    <div className="comm-tabs">
      {TABS.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={16} />{label}</button>)}
    </div>
    {tab === 'ranking' && <GlobalRanking />}
    {tab === 'search' && <PlayerSearch />}
    {tab === 'info' && <WorldInfo />}
  </div>;
}
