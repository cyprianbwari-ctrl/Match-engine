import React, { useState } from 'react';
import {
  ChevronRight, Crown, Trophy, Shield, Sparkles, Award, Star, Target,
  TrendingUp, CalendarDays, BarChart3, Users, ListChecks, Clock3, MapPin,
  CheckCircle2, Circle
} from 'lucide-react';
import './competitions.css';
import { useCompetitionData } from './store/CompetitionContext.jsx';

// ---------- Crest helpers (stylised initials, not real club/competition logos) ----------

const TEAM_COLORS = {
  'Man Utd': '#DA291C', 'Liverpool': '#C8102E', 'Arsenal': '#EF0107', 'Man City': '#6CABDD',
  'Chelsea': '#034694', 'Tottenham': '#132257', 'Leicester City': '#003090', 'Aston Villa': '#670E36',
  'Newcastle': '#241F20', 'Brighton': '#0057B8', 'Bournemouth': '#DA291C', 'Fulham': '#000000',
  'Crystal Palace': '#1B458F', 'Everton': '#003399', 'West Ham': '#7A263A', 'Brentford': '#E30613',
  'Wolves': '#FDB913', 'Nottingham Forest': '#DD0000', 'Leeds United': '#FFCD00', 'Burnley': '#6C1D45',
  'Sunderland': '#EB172B', 'Bayern Munich': '#DC052D', 'Inter Milan': '#010E80', 'Real Sociedad': '#0067B1',
  'Roma': '#8E1F2F', 'Fenerbahçe': '#FFED00', 'Braga': '#DA291C', 'Real Betis': '#00954C',
  'Preston North End': '#2E4593', 'Barnsley': '#EE2737',
};
const TEAM_CODES = {
  'Man Utd': 'MU', 'Liverpool': 'LIV', 'Arsenal': 'ARS', 'Man City': 'MCI', 'Chelsea': 'CHE',
  'Tottenham': 'TOT', 'Leicester City': 'LEI', 'Aston Villa': 'AVL', 'Newcastle': 'NEW',
  'Brighton': 'BHA', 'Bournemouth': 'BOU', 'Fulham': 'FUL', 'Crystal Palace': 'CRY', 'Everton': 'EVE',
  'West Ham': 'WHU', 'Brentford': 'BRE', 'Wolves': 'WOL', 'Nottingham Forest': 'NFO',
  'Leeds United': 'LEE', 'Burnley': 'BUR', 'Sunderland': 'SUN', 'Bayern Munich': 'BAY',
  'Inter Milan': 'INT', 'Real Sociedad': 'RSO', 'Roma': 'ROM', 'Fenerbahçe': 'FEN',
  'Braga': 'BRA', 'Real Betis': 'BET', 'Preston North End': 'PNE', 'Barnsley': 'BAR',
};

function Crest({ team, size = 24 }) {
  const bg = TEAM_COLORS[team] || '#3a4570';
  const code = TEAM_CODES[team] || team.slice(0, 3).toUpperCase();
  return <span className="team-crest" style={{ width: size, height: size, fontSize: size * 0.34, background: `radial-gradient(circle at 32% 28%, ${bg}dd, ${bg}99 60%, #05070f 130%)` }}>{code}</span>;
}

function CompBadge({ icon: Icon, color, size = 40 }) {
  return <span className="comp-badge" style={{ width: size, height: size, background: `linear-gradient(150deg, ${color}33, #0a0e22)`, borderColor: `${color}88` }}>
    <Icon size={size * 0.46} color={color} />
  </span>;
}

const COMP_ICON = { 'Premier League': Crown, 'Emirates FA Cup': Trophy, 'Carabao Cup': Trophy, 'FA Community Shield': Shield, 'UEFA Champions League': Star, 'UEFA Europa League': Award, 'UEFA Conference League': Sparkles };

function StatusDot({ label, color = '#3ddc84' }) {
  return <span className="status-dot"><i style={{ background: color, boxShadow: `0 0 8px ${color}` }} />{label}</span>;
}

function CtaBtn({ children, solid = false, onClick }) {
  return <button className={`cta-btn ${solid ? 'solid' : ''}`} onClick={onClick}>{children}<ChevronRight size={14} /></button>;
}

function LeagueTable({ rows }) {
  return <div className="league-table">
    <div className="lt-row lt-head"><span>Pos</span><span>Club</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>Pts</span></div>
    {rows.map(r => <div className={`lt-row ${r.us ? 'us' : ''}`} key={r.club}>
      <span>{r.pos}</span>
      <span className="lt-club"><Crest team={r.club} size={20} /><b>{r.club}</b></span>
      <span>{r.p}</span><span>{r.w}</span><span>{r.d}</span><span>{r.l}</span><span>{r.gd > 0 ? `+${r.gd}` : r.gd}</span><span className="lt-pts">{r.pts}</span>
    </div>)}
  </div>;
}

function FormBadge({ result }) {
  const cls = result === 'W' ? 'w' : result === 'L' ? 'l' : 'd';
  return <span className={`form-badge ${cls}`}>{result}</span>;
}

// ================= OVERVIEW =================

function ActiveCompetitions({ data, goTo }) {
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={Trophy} color="#8a6bff" /><div><h3>All Active Competitions</h3><span className="muted-sub">6 competitions currently in play</span></div></div>
    <div className="active-comp-grid">
      {data.activeCompetitions.map(c => <button className="active-comp-row" key={c.name} onClick={() => goTo(c.key, c.sub)}>
        <CompBadge icon={COMP_ICON[c.name] || Trophy} color={c.color} size={34} />
        <div><b>{c.name}</b><span>{c.status}</span></div>
        <span className="acr-progress">{c.progress}</span>
        <ChevronRight size={16} />
      </button>)}
    </div>
  </section>;
}

function ObjectivesCard({ objectives }) {
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={Target} color="#3ddc84" /><div><h3>Competition Objectives</h3></div></div>
    {objectives.map(o => <div className="objective-row" key={o.label}>
      {o.status === 'Achieved' ? <CheckCircle2 size={16} color="#3ddc84" /> : <Circle size={16} color="#ffb84d" />}
      <div><b>{o.label}</b><span>{o.detail}</span></div>
      <span className={`obj-status ${o.status === 'Achieved' ? 'ok' : 'track'}`}>{o.status}</span>
    </div>)}
  </section>;
}

function RecentResults({ results }) {
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={ListChecks} color="#4d9dff" /><div><h3>Recent Results</h3></div></div>
    {results.map((r, i) => <div className="mini-fixture-row" key={i}>
      <span className="mfr-comp">{r.comp}</span>
      <span className="fixture-team"><Crest team={r.home} size={20} /><b>{r.home}</b></span>
      <span className="fixture-score small">{r.score}</span>
      <span className="fixture-team right"><b>{r.away}</b><Crest team={r.away} size={20} /></span>
    </div>)}
  </section>;
}

function UpcomingFixtures({ fixtures }) {
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={CalendarDays} color="#ff8a3d" /><div><h3>Upcoming Fixtures</h3></div></div>
    {fixtures.map((f, i) => <div className="mini-fixture-row" key={i}>
      <span className="mfr-comp">{f.comp || 'Premier League'}</span>
      <span className="fixture-team"><Crest team={f.home} size={20} /><b>{f.home}</b></span>
      <span className="mfr-date"><Clock3 size={11} />{f.date} {f.time}</span>
      <span className="fixture-team right"><b>{f.away}</b><Crest team={f.away} size={20} /></span>
    </div>)}
  </section>;
}

function FormCard({ form }) {
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={TrendingUp} color="#c9d3f0" /><div><h3>Form</h3><span className="muted-sub">Last {form.length} competitive matches</span></div></div>
    <div className="form-row">{form.map((r, i) => <FormBadge key={i} result={r} />)}</div>
  </section>;
}

function KeyStats({ stats }) {
  const cards = [
    ['Goals Scored', stats.goalsScored, '#3ddc84'],
    ['Goals Conceded', stats.goalsConceded, '#ff5d5d'],
    ['Unbeaten Run', `${stats.unbeatenRun} games`, '#4d9dff'],
    ['Win Rate', `${stats.winRate}%`, '#c9a6ff'],
  ];
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={BarChart3} color="#ffb84d" /><div><h3>Key Competition Statistics</h3></div></div>
    <div className="key-stat-grid">{cards.map(([l, v, c]) => <div className="key-stat" key={l}><b style={{ color: c }}>{v}</b><span>{l}</span></div>)}</div>
  </section>;
}

function Overview({ goTo }) {
  const data = useCompetitionData();
  return <div className="comp-tab-page">
    <ActiveCompetitions data={data} goTo={goTo} />
    <div className="overview-grid-2">
      <div className="ovg-col"><ObjectivesCard objectives={data.objectives} /><RecentResults results={data.allResults} /></div>
      <div className="ovg-col"><UpcomingFixtures fixtures={data.allFixtures} /><FormCard form={data.form} /><KeyStats stats={data.keyStats} /></div>
    </div>
  </div>;
}

// ================= LEAGUE =================

function LeagueSubTabs({ sub, setSub }) {
  const tabs = ['Table', 'Fixtures & Results', 'Top Scorers', 'Assists', 'Team Stats', 'Player Stats', 'Objectives'];
  return <div className="sub-tabs">{tabs.map(t => <button key={t} className={sub === t ? 'active' : ''} onClick={() => setSub(t)}>{t}</button>)}</div>;
}

function StatList({ rows, valueKey, label }) {
  return <div className="stat-list">
    <div className="stat-list-head"><span>#</span><span>Player</span><span>Club</span><span>{label}</span></div>
    {rows.map((r, i) => <div className="stat-list-row" key={r.player}><span>{i + 1}</span><b>{r.player}</b><span className="muted-sub">{r.club}</span><b className="stat-val">{r[valueKey]}</b></div>)}
  </div>;
}

function TeamStatsGrid({ stats }) {
  const items = [
    ['Goals For', stats.goalsFor], ['Goals Against', stats.goalsAgainst], ['Avg. Possession', `${stats.avgPossession}%`],
    ['Shots / Game', stats.shotsPerGame], ['Clean Sheets', stats.cleanSheets], ['Pass Accuracy', `${stats.passAccuracy}%`],
    ['Yellow Cards', stats.yellowCards], ['Red Cards', stats.redCards],
  ];
  return <div className="key-stat-grid wide">{items.map(([l, v]) => <div className="key-stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>;
}

function PlayerStatsTable({ rows }) {
  return <div className="player-stat-table">
    <div className="pst-row pst-head"><span>Player</span><span>Apps</span><span>Goals</span><span>Assists</span><span>Rating</span></div>
    {rows.map(r => <div className="pst-row" key={r.name}><b>{r.name}</b><span>{r.apps}</span><span>{r.goals}</span><span>{r.assists}</span><span className="pst-rating">{r.rating}</span></div>)}
  </div>;
}

function League() {
  const { league } = useCompetitionData();
  const [sub, setSub] = useState('Table');
  return <div className="comp-tab-page">
    <div className="comp-col-head"><span className="flag-badge">🏴</span><div><h2>Premier League</h2><span>2025/26 Season · Matchday {league.table.find(r => r.us).p}</span></div></div>
    <LeagueSubTabs sub={sub} setSub={setSub} />
    {sub === 'Table' && <section className="comp-card"><LeagueTable rows={league.table} /></section>}
    {sub === 'Fixtures & Results' && <div className="two-col">
      <section className="comp-card"><h3>Recent Results</h3>{league.results.map((r, i) => <div className="mini-fixture-row" key={i}><span className="mfr-date">{r.date}</span><span className="fixture-team"><Crest team={r.home} size={20} /><b>{r.home}</b></span><span className="fixture-score small">{r.score}</span><span className="fixture-team right"><b>{r.away}</b><Crest team={r.away} size={20} /></span></div>)}</section>
      <section className="comp-card"><h3>Upcoming Fixtures</h3>{league.fixtures.map((f, i) => <div className="mini-fixture-row" key={i}><span className="mfr-date"><Clock3 size={11} />{f.date} {f.time}</span><span className="fixture-team"><Crest team={f.home} size={20} /><b>{f.home}</b></span><span>vs</span><span className="fixture-team right"><b>{f.away}</b><Crest team={f.away} size={20} /></span></div>)}</section>
    </div>}
    {sub === 'Top Scorers' && <section className="comp-card"><StatList rows={league.topScorers} valueKey="goals" label="Goals" /></section>}
    {sub === 'Assists' && <section className="comp-card"><StatList rows={league.topAssists} valueKey="assists" label="Assists" /></section>}
    {sub === 'Team Stats' && <section className="comp-card"><h3>Man Utd — Team Statistics</h3><TeamStatsGrid stats={league.teamStats} /></section>}
    {sub === 'Player Stats' && <section className="comp-card"><h3>Man Utd — Player Statistics</h3><PlayerStatsTable rows={league.playerStats} /></section>}
    {sub === 'Objectives' && <ObjectivesCard objectives={league.objectives} />}
  </div>;
}

// ================= CUPS =================

function CupProgression({ cup }) {
  const rounds = [...cup.previousRounds.map(r => ({ label: r.round, done: true, result: r.result })), { label: cup.currentRound, done: false, current: true }];
  return <div className="progression">{rounds.map((r, i) => <React.Fragment key={r.label}>
    <span className={`prog-step ${r.done ? 'done' : ''} ${r.current ? 'current' : ''}`}>{r.label}{r.result && <em>{r.result}</em>}</span>
    {i < rounds.length - 1 && <i className={`prog-line ${r.done ? 'done' : ''}`} />}
  </React.Fragment>)}</div>;
}

function CupDetail({ cup }) {
  return <section className="comp-card">
    <div className="card-head"><CompBadge icon={Trophy} color={cup.color} /><div><h3>{cup.name}</h3><StatusDot label={cup.currentRound} /></div><CtaBtn>Competition Info</CtaBtn></div>
    <div className="panel-label">Progression</div>
    <CupProgression cup={cup} />
    <div className="two-col" style={{ marginTop: 10 }}>
      <div>
        <div className="panel-label">Previous Rounds</div>
        {cup.previousRounds.map((r, i) => <div className="mini-fixture-row" key={i}><span className="mfr-date">{r.round}</span><span className="fixture-team"><b>Man Utd</b></span><span className="fixture-score small">{r.score}</span><span className="fixture-team right"><b>{r.opponent}</b></span></div>)}
        <div className="panel-label" style={{ marginTop: 8 }}>Next Opponent</div>
        <p className="muted-sub">{cup.nextOpponent}</p>
        <div className="panel-label">Draw</div>
        <p className="muted-sub">{cup.draw}</p>
      </div>
      <div>
        <div className="panel-label">Cup Statistics</div>
        <TeamStatsGrid stats={{ goalsFor: cup.stats.goalsFor, goalsAgainst: cup.stats.goalsAgainst, avgPossession: '—', shotsPerGame: '—', cleanSheets: cup.stats.won, passAccuracy: '—', yellowCards: '—', redCards: '—' }} />
      </div>
    </div>
  </section>;
}

function Cups() {
  const { cups } = useCompetitionData();
  const [sub, setSub] = useState('faCup');
  const tabs = [['faCup', cups.faCup.name], ['leagueCup', cups.leagueCup.name], ['other', 'Other Domestic Cups']];
  return <div className="comp-tab-page">
    <div className="comp-col-head"><span className="flag-badge">🏆</span><div><h2>Cups</h2><span>Domestic cup competitions</span></div></div>
    <div className="sub-tabs">{tabs.map(([id, label]) => <button key={id} className={sub === id ? 'active' : ''} onClick={() => setSub(id)}>{label}</button>)}</div>
    {sub === 'faCup' && <CupDetail cup={cups.faCup} />}
    {sub === 'leagueCup' && <CupDetail cup={cups.leagueCup} />}
    {sub === 'other' && cups.other.map(o => <section className="comp-card" key={o.name}>
      <div className="card-head"><CompBadge icon={Shield} color={o.color} /><div><h3>{o.name}</h3><StatusDot label={o.status} color="#4d9dff" /></div><CtaBtn>View Result</CtaBtn></div>
      <div className="mini-fixture-row"><span className="mfr-date">{o.round}</span><span className="fixture-team"><b>Man Utd</b></span><span className="fixture-score small">{o.score}</span><span className="fixture-team right"><b>{o.opponent}</b></span></div>
    </section>)}
  </div>;
}

// ================= CONTINENTAL =================

function ContinentalDetail({ comp }) {
  const isKnockoutOnly = !comp.table;
  return <div className="comp-tab-page">
    <section className="comp-card">
      <div className="card-head"><CompBadge icon={COMP_ICON[comp.name] || Star} color={comp.color} /><div><h3>{comp.name}</h3><StatusDot label={comp.phase} /></div><CtaBtn>Competition Info</CtaBtn></div>
      {!isKnockoutOnly && <>
        <div className="league-card-body">
          <LeagueTable rows={comp.table} />
          <div className="next-match">
            <div className="panel-label">Next Fixture</div>
            {comp.fixtures.map((f, i) => <div key={i} className="nm-teams"><div><Crest team={f.home} size={36} /><span>{f.home}</span></div><b>vs</b><div><Crest team={f.away} size={36} /><span>{f.away}</span></div></div>)}
            <div className="nm-date">{comp.fixtures[0]?.date} &nbsp; {comp.fixtures[0]?.time}</div>
          </div>
        </div>
        <div className="panel-label" style={{ marginTop: 10 }}>Recent Results</div>
        {comp.results.map((r, i) => <div className="mini-fixture-row" key={i}><span className="mfr-date">{r.date}</span><span className="fixture-team"><Crest team={r.home} size={20} /><b>{r.home}</b></span><span className="fixture-score small">{r.score}</span><span className="fixture-team right"><b>{r.away}</b><Crest team={r.away} size={20} /></span></div>)}
        <div className="panel-label" style={{ marginTop: 10 }}>Knockout Rounds</div>
        <p className="muted-sub">{comp.knockout}</p>
      </>}
      {isKnockoutOnly && <div className="conf-body">
        <div className="conf-tie">
          <div className="panel-label">Knockout Play-off — Draw</div>
          <div className="conf-vs">
            <span className="fixture-team"><Crest team="Man Utd" size={30} /><b>Man Utd</b></span>
            <b>vs</b>
            <span className="fixture-team"><Crest team={comp.tie.opponent} size={30} /><b>{comp.tie.opponent}</b></span>
          </div>
          <div className="conf-legs"><span>1st Leg &nbsp;{comp.tie.firstLeg}</span><span>|</span><span>2nd Leg &nbsp;{comp.tie.secondLeg}</span></div>
        </div>
        <div className="conf-final">
          <div className="panel-label">Road to the Final</div>
          <div className="conf-final-row"><Trophy size={28} color="#c9d3f0" /><div><b>Final</b><span>{comp.roadToFinal.final}</span><span>{comp.roadToFinal.venue}</span></div></div>
        </div>
      </div>}
      <div className="panel-label" style={{ marginTop: 10 }}>Continental Statistics</div>
      <TeamStatsGrid stats={{ goalsFor: comp.stats.goalsFor, goalsAgainst: comp.stats.goalsAgainst, avgPossession: '—', shotsPerGame: '—', cleanSheets: comp.stats.won, passAccuracy: '—', yellowCards: '—', redCards: '—' }} />
    </section>
  </div>;
}

function Continental({ initialSub }) {
  const { continental } = useCompetitionData();
  const [sub, setSub] = useState(initialSub || 'ucl');
  const tabs = [['ucl', continental.ucl.name], ['uel', continental.uel.name], ['uecl', continental.uecl.name]];
  return <div className="comp-tab-page">
    <div className="comp-col-head"><span className="flag-badge">⚽</span><div><h2>Continental</h2><span>Europe & Beyond</span></div></div>
    <div className="sub-tabs">{tabs.map(([id, label]) => <button key={id} className={sub === id ? 'active' : ''} onClick={() => setSub(id)}>{label}</button>)}</div>
    <ContinentalDetail comp={continental[sub]} />
  </div>;
}

// ================= HISTORY =================

function History() {
  const { history } = useCompetitionData();
  const [sub, setSub] = useState('Previous Seasons');
  const tabs = ['Previous Seasons', 'Trophies Won', 'Club Records', 'Statistics', 'Notable Achievements'];
  return <div className="comp-tab-page">
    <div className="comp-col-head"><span className="flag-badge">📖</span><div><h2>History</h2><span>What the club has achieved over the years</span></div></div>
    <div className="sub-tabs">{tabs.map(t => <button key={t} className={sub === t ? 'active' : ''} onClick={() => setSub(t)}>{t}</button>)}</div>
    {sub === 'Previous Seasons' && <section className="comp-card">
      <div className="pst-row pst-head" style={{ gridTemplateColumns: '90px 1fr 1fr 1.6fr' }}><span>Season</span><span>League Finish</span><span>Manager</span><span>Notes</span></div>
      {history.previousSeasons.map(s => <div className="pst-row" key={s.season} style={{ gridTemplateColumns: '90px 1fr 1fr 1.6fr' }}><b>{s.season}</b><span>{s.league}</span><span className="muted-sub">{s.manager}</span><span>{s.notes}</span></div>)}
    </section>}
    {sub === 'Trophies Won' && <section className="comp-card">
      <div className="trophy-grid">{history.trophyCabinet.map(t => <div className="trophy-card" key={t.name}><Trophy size={22} color="#ffd76b" /><b>{t.count}×</b><span>{t.name}</span><small>{t.years}</small></div>)}</div>
    </section>}
    {sub === 'Club Records' && <section className="comp-card">
      {history.clubRecords.map(r => <div className="objective-row" key={r.label}><Star size={15} color="#ffd76b" /><div><b>{r.label}</b><span>{r.value}</span></div></div>)}
    </section>}
    {sub === 'Statistics' && <section className="comp-card">
      <div className="key-stat-grid wide">
        <div className="key-stat"><b>{history.historicalStats.totalMajorTrophies}</b><span>Total Major Trophies</span></div>
        <div className="key-stat"><b>{history.historicalStats.leagueTitles}</b><span>League Titles</span></div>
        <div className="key-stat"><b>{history.historicalStats.domesticCups}</b><span>Domestic Cups</span></div>
        <div className="key-stat"><b>{history.historicalStats.europeanCups}</b><span>European Cups</span></div>
      </div>
    </section>}
    {sub === 'Notable Achievements' && <section className="comp-card">
      {history.notableAchievements.map(a => <div className="achievement-row" key={a.year}><b>{a.year}</b><span>{a.text}</span></div>)}
    </section>}
  </div>;
}

// ================= ROOT =================

const TABS = [['overview', 'Overview', 'purple'], ['league', 'League', 'green'], ['cups', 'Cups', 'blue'], ['continental', 'Continental', 'orange'], ['history', 'History', 'gold']];

export default function CompetitionsScreen({ initialTab }) {
  const [tab, setTab] = useState(initialTab || 'overview');
  const [contSub, setContSub] = useState('ucl');

  const goTo = (key, sub) => {
    setTab(key);
    if (key === 'continental' && sub) setContSub(sub);
  };

  return <div className="comp-page">
    <div className="comp-tabs">
      {TABS.map(([id, label, color]) => <button key={id} className={`ctab ${color} ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {tab === 'overview' && <Overview goTo={goTo} />}
    {tab === 'league' && <League />}
    {tab === 'cups' && <Cups />}
    {tab === 'continental' && <Continental initialSub={contSub} />}
    {tab === 'history' && <History />}
  </div>;
}
