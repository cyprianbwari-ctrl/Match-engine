import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu, Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Settings, Sun,
  Crosshair, Gauge, Users, Repeat, X, Check, TriangleAlert, ListVideo, BarChart3,
  Radio, MessageSquare, Zap, Minus, Plus,
} from 'lucide-react';
import './match.css';
import { useTacticsData } from './store/TacticsContext.jsx';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useSimulation } from './store/SimulationContext.jsx';
import { useWorldData } from './store/WorldContext.jsx';
import { mapRosterPlayer } from './data/homeData.js';
import {
  buildXI, buildOpponentPool, initMatch, stepMatch, resolveDecision, simulateInstant, substitutePlayer,
} from './engine/matchSimulator.js';
import { FORMATIONS } from './tactics/formations.js';
import { players as roster } from './data/roster.js';

const SPEEDS = [1, 2, 4, 8];
// Fixed engine tick = 0.5 game-seconds (see matchSimulator.FIXED_GAME_SECONDS).
// A full 90' match is therefore 10,800 ticks. We render every 40ms and, per
// speed tier, consume a base number of ticks per render. At the default
// (4x + Highlights Only) this alone lands ~2.4 real minutes for 90 game
// minutes; Highlights Only's quiet-tick skipping (below) pulls that down
// further, landing in the ~1.5-3 minute range described for default viewing.
const REAL_TICK_MS = 40;
const BASE_TICKS_BY_SPEED = { 1: 1, 2: 2, 4: 3, 8: 6 };
const HIGHLIGHT_SKIP_MULTIPLIER = 10; // cap on how far a single render can fast-forward through quiet play

const ROLE_NAMES = {
  GK: 'Goalkeeper', SK: 'Sweeper Keeper', BPK: 'Ball-Playing Keeper',
  FB: 'Full Back', WB: 'Wing Back', IWB: 'Inverted Wing Back',
  CD: 'Central Defender', BPD: 'Ball-Playing Defender', NCB: 'No-Nonsense Centre Back', STP: 'Stopper', COV: 'Covering Centre Back', LIB: 'Libero',
  DM: 'Defensive Midfielder', A: 'Anchor Man', HB: 'Half Back', BWM: 'Ball-Winning Midfielder', DLP: 'Deep-Lying Playmaker',
  CM: 'Central Midfielder', BBM: 'Box-to-Box Midfielder', MEZ: 'Mezzala', RPM: 'Roaming Playmaker', REG: 'Regista', SV: 'Segundo Volante', AP: 'Advanced Playmaker',
  AMC: 'Attacking Midfielder', SS: 'Shadow Striker', TREQ: 'Trequartista', ENG: 'Enganche',
  W: 'Winger', IW: 'Inverted Winger', IF: 'Inside Forward', WP: 'Wide Playmaker', WF: 'Wide Forward',
  AF: 'Advanced Forward', CF: 'Complete Forward', DLF: 'Deep-Lying Forward', F9: 'False Nine', TF: 'Target Forward', PF: 'Pressing Forward', PCH: 'Poacher',
};
const OPPONENT_FORMATION_BY_CLUB = { Brighton: '4-2-3-1' };
const BRIGHTON_XI_NAMES = [
  { name: 'Bart Verbruggen', pos: 'GK' }, { name: 'Tariq Lamptey', pos: 'DR' }, { name: 'Lewis Dunk', pos: 'DC' },
  { name: 'Jan Paul van Hecke', pos: 'DC' }, { name: 'Pervis Estupiñán', pos: 'DL' }, { name: 'Carlos Baleba', pos: 'DM' },
  { name: 'Mats Wieffer', pos: 'DM' }, { name: 'Yankuba Minteh', pos: 'AMR' }, { name: 'João Pedro', pos: 'AMC' },
  { name: 'Kaoru Mitoma', pos: 'AML' }, { name: 'Danny Welbeck', pos: 'ST' },
];
const BRIGHTON_BENCH = ['James Milner', 'Simon Adingra', 'Solly March', 'Jack Hinshelwood', 'Diego Gómez'];

function tacticalBehaviour(p) {
  if (p.action === 'press') return 'Pressing';
  if (p.action === 'run') return 'Making runs';
  if (p.action === 'shoot') return 'Shooting';
  if (p.action === 'pass' || p.action === 'through-pass') return 'Building play';
  if (p.action === 'carrier' || p.action === 'carry') return 'Attacking space';
  if (p.action === 'support') return ['DR', 'DL', 'AML', 'AMR'].includes(p.pos) ? 'Providing width' : 'Supporting attack';
  if (p.action === 'cover') return p.y > 60 || p.y < 40 ? 'Tracking runner' : 'Holding position';
  return 'Holding position';
}
function matchRating(p) {
  const r = 6.0 + (p.goals || 0) * 1.1 + (p.assists || 0) * 0.6 + (p.tackles || 0) * 0.12 +
    (p.passesCompleted || 0) * 0.02 + (p.shots || 0) * 0.15 - Math.max(0, (p.passesAttempted || 0) - (p.passesCompleted || 0)) * 0.05;
  return Math.max(5.2, Math.min(9.8, r)).toFixed(1);
}
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, homeName, league, dutyAssignment }) {
  const homePairs = slots.map((slot, i) => ({ slot, duty: dutyAssignment?.[slot.id] || 'Support', player: startXI.find(p => p.id === assignment[slot.id]) || startXI[i % startXI.length] }));
  const homeXI = buildXI(homePairs, 'home');

  const fixture = league.fixtures[0];
  const oppName = fixture ? (fixture.home === 'Man Utd' ? fixture.away : fixture.home) : 'Brighton';
  const oppRow = league.table.find(r => r.club === oppName) || league.table.find(r => !r.us) || { club: oppName, pts: 20 };
  const oppFormationName = OPPONENT_FORMATION_BY_CLUB[oppName] || '4-3-3';
  const oppSlots = FORMATIONS[oppFormationName];
  const oppPool = buildOpponentPool(60 + Math.min(30, oppRow.pts / 2), oppSlots, oppRow.club);
  // Give the generated opponent pool recognisable names/positions for this
  // specific fixture rather than generic placeholders, when we have them.
  const namedPool = oppPool.map((p, i) => BRIGHTON_XI_NAMES[i] ? { ...p, name: BRIGHTON_XI_NAMES[i].name } : p);
  const DEFAULT_DUTY = { GK:'Defend', DL:'Support', DR:'Support', DC:'Defend', DM:'Defend', MC:'Support', AMC:'Support', AML:'Attack', AMR:'Attack', ST:'Attack' };
  const awayPairs = oppSlots.map((slot, i) => ({ slot, duty: DEFAULT_DUTY[slot.code] || 'Support', player: namedPool[i] }));
  const awayXI = buildXI(awayPairs, 'away');

  const state = initMatch({
    homeXI, awayXI, homeName, awayName: oppRow.club,
    homeTactics: { mentality: teamInstructions.mentality, tempo: teamInstructions.tempo, defensiveLine: teamInstructions.defensiveLine, pressing },
    awayTactics: { mentality: oppRow.pts >= 30 ? 'Positive' : 'Balanced', tempo: oppRow.pts >= 30 ? 62 : 56, defensiveLine: 55, pressing: { intensity: oppRow.pts >= 30 ? 66 : 58 } },
  });
  state.oppFormationName = oppFormationName;
  return state;
}

function MiniFormation({ formationName, side }) {
  const slots = FORMATIONS[formationName] || FORMATIONS['4-3-3'];
  return <svg viewBox="0 0 100 100" className="mf-svg" preserveAspectRatio="none">
    <rect x="2" y="2" width="96" height="96" rx="4" className="mf-bg" />
    <line x1="2" y1="50" x2="98" y2="50" className="mf-mid" />
    {slots.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r="5.5" className={`mf-dot ${side}`} />)}
  </svg>;
}

function StatRow({ label, home, away, format = v => v }) {
  const total = (Number(home) || 0) + (Number(away) || 0) || 1;
  const homeShare = Math.max(6, Math.min(94, (Number(home) / total) * 100));
  return <div className="stat-row">
    <b>{format(home)}</b>
    <div className="stat-track"><i className="home" style={{ width: `${homeShare}%` }} /><i className="away" style={{ width: `${100 - homeShare}%` }} /></div>
    <span>{label}</span>
    <em>{format(away)}</em>
  </div>;
}

function PitchMarker({ p, isBall, onClick, selected }) {
  if (isBall) return <div className="mk ball" style={{ left: `${p.x}%`, top: `${p.y}%` }} />;
  return <button className={`mk ${p.teamSide} ${selected ? 'selected' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => onClick(p)} title={p.name}>
    <b>{p.number || p.name.split(' ')[0][0]}</b>
    <small>{p.name.split(' ').slice(-1)[0].slice(0, 3).toUpperCase()}</small>
  </button>;
}

export default function MatchScreen({ setActive }) {
  const { slots, assignment, startXI, teamInstructions, pressing, tacticalDelegation, formation, dutyAssignment } = useTacticsData();
  const { league, recordUserMatchResult } = useCompetitionData();
  const { reportLiveMatch } = useSimulation();
  const { openProfileFor } = useWorldData();

  const [match, setMatch] = useState(() => buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, homeName: 'Man Utd', league, dutyAssignment }));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [highlightsOnly, setHighlightsOnly] = useState(true);
  const [view, setView] = useState('Tactical');
  const [statsTab, setStatsTab] = useState('Match');
  const [feedTab, setFeedTab] = useState('Live Commentary');
  const [selectedId, setSelectedId] = useState(null);
  const [subsOpen, setSubsOpen] = useState(false);
  const [subOut, setSubOut] = useState(null);
  const [subsMade, setSubsMade] = useState(0);
  const [teamTalkOpen, setTeamTalkOpen] = useState(false);
  const [teamTalkNote, setTeamTalkNote] = useState('');
  const resultRecorded = useRef(false);

  // Simulation loop. See BASE_TICKS_BY_SPEED comment for the timing model.
  useEffect(() => {
    if (!running || match.finished || match.pendingDecision) return;
    const id = setInterval(() => {
      setMatch(m => {
        let next = m;
        const baseTicks = BASE_TICKS_BY_SPEED[speed] || 3;
        const maxBudget = baseTicks * HIGHLIGHT_SKIP_MULTIPLIER;
        let consumed = 0;
        while (consumed < baseTicks || (highlightsOnly && consumed < maxBudget)) {
          const prevEvents = next.events;
          next = stepMatch({ ...next }, 7);
          consumed++;
          if (next.finished || next.pendingDecision) break;
          if (consumed >= baseTicks) {
            if (!highlightsOnly) break;
            if (next.events !== prevEvents && next.events[0].type !== 'play') break;
          }
        }
        return next;
      });
    }, REAL_TICK_MS);
    return () => clearInterval(id);
  }, [running, speed, highlightsOnly, match.finished, match.pendingDecision]);

  // Tactics changed mid-match (e.g. the manager opened Tactics and came
  // back) — feed the live tactical state into the running engine so the new
  // instructions actually start influencing player behaviour immediately,
  // per spec, without restarting the match.
  useEffect(() => {
    setMatch(m => m.finished ? m : { ...m, homeTactics: { ...m.homeTactics, mentality: teamInstructions.mentality, tempo: teamInstructions.tempo, defensiveLine: teamInstructions.defensiveLine, pressing } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamInstructions.mentality, teamInstructions.tempo, teamInstructions.defensiveLine, pressing.intensity, pressing.trigger]);

  const restart = () => {
    resultRecorded.current = false;
    setMatch(buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, homeName: 'Man Utd', league, dutyAssignment }));
    setSelectedId(null); setSubsMade(0);
  };
  const bench = useMemo(() => roster.filter(p => !match.homeXI.some(h => h.id === p.id)), [match.homeXI]);

  const makeSub = (inPlayer) => {
    if (!subOut) return;
    setMatch(m => {
      const outPlayer = m.homeXI.find(p => p.id === subOut);
      const newXI = substitutePlayer(m.homeXI, subOut, inPlayer);
      const events = [{ minute: m.minute, second: m.second, text: `Substitution: ${inPlayer.name} replaces ${outPlayer?.name || 'a player'}.`, type: 'sub', team: 'home' }, ...m.events].slice(0, 80);
      return { ...m, homeXI: newXI, events };
    });
    setSubsMade(n => n + 1);
    setSubOut(null);
    setSubsOpen(false);
  };
  const runQuickSim = () => { setRunning(false); setMatch(m => simulateInstant({ ...m })); };
  const jumpToNextHighlight = () => {
    setRunning(false);
    setMatch(m => {
      if (m.finished || m.pendingDecision) return m;
      let next = m, consumed = 0;
      const budget = 400;
      while (consumed < budget) {
        const prevEvents = next.events;
        next = stepMatch({ ...next }, 7);
        consumed++;
        if (next.finished || next.pendingDecision) break;
        if (next.events !== prevEvents && next.events[0].type !== 'play') break;
      }
      return next;
    });
  };
  const choose = (key) => setMatch(m => resolveDecision({ ...m }, key));
  const giveTeamTalk = (tone) => {
    const notes = { Calm: 'The players look settled and composed.', Encouraging: 'The dressing room responds well — spirits are up.', Demanding: 'A few sharp words. The response will show in the next few minutes.' };
    setTeamTalkNote(notes[tone]);
    setMatch(m => ({ ...m, events: [{ minute: m.minute, second: m.second, text: `Team Talk (${tone}): ${notes[tone]}`, type: 'info', team: null }, ...m.events].slice(0, 80) }));
    setTimeout(() => setTeamTalkOpen(false), 900);
  };

  useEffect(() => {
    if (match.pendingDecision && tacticalDelegation === 'Automatic') {
      const id = setTimeout(() => choose(match.pendingDecision.options[1].key), 900);
      return () => clearTimeout(id);
    }
  }, [match.pendingDecision, tacticalDelegation]);

  useEffect(() => {
    reportLiveMatch({ inProgress: running && !match.finished, minute: match.minute, second: match.second, homeScore: match.score.home, awayScore: match.score.away, opponent: match.awayName, finished: match.finished });
    if (match.finished && !resultRecorded.current) { resultRecorded.current = true; recordUserMatchResult(match.score.home, match.score.away); }
  }, [running, match.minute, match.second, match.finished, match.score.home, match.score.away]);

  useEffect(() => () => {
    if (!match.finished) reportLiveMatch({ inProgress: false, minute: match.minute, second: match.second, homeScore: match.score.home, awayScore: match.score.away, opponent: match.awayName, finished: false, awayFromScreen: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPlayers = [...match.homeXI, ...match.awayXI];
  const selected = allPlayers.find(p => p.id === selectedId) || null;
  const goals = match.events.filter(e => e.type === 'goal').slice().reverse();
  const visibleFeed = feedTab === 'Match Events'
    ? match.events.filter(e => ['goal', 'sub', 'foul'].includes(e.type))
    : highlightsOnly ? match.events.filter(e => e.type !== 'play') : match.events;

  const homeStats = match.stats.home, awayStats = match.stats.away;
  const possessionHome = pct(match.possessionTicks.home, match.possessionTicks.home + match.possessionTicks.away);
  const territoryHome = pct(match.territoryTicks.home, match.territoryTicks.home + match.territoryTicks.away);
  const passCompHome = pct(homeStats.passesCompleted, homeStats.passesAttempted);
  const passCompAway = pct(awayStats.passesCompleted, awayStats.passesAttempted);

  const mm = String(match.minute).padStart(2, '0');
  const ss = String(Math.floor(match.second)).padStart(2, '0');
  const half = match.minute >= 45 ? '2nd Half' : '1st Half';

  // Camera behaviour for Action View: pan/zoom the pitch container toward
  // wherever the ball currently is, so watching it actually feels different
  // from the full Tactical View rather than just relabelling the same thing.
  const pitchStyle = view === 'Action'
    ? { transform: `scale(1.7) translate(${(50 - match.ballX) * 0.55}%, ${(50 - match.ballY) * 0.55}%)`, transition: 'transform 300ms ease-out' }
    : { transform: 'scale(1)', transition: 'transform 400ms ease-out' };

  return <div className="match-page">
    <div className="mtb">
      <button className="mtb-menu"><Menu size={19} /></button>
      <button className="mtb-brand" onClick={() => setActive('Home')}>FAMILY<span>26</span></button>
      <div className="mtb-team"><b>{match.homeName}</b><small>{formation}</small></div>
      <div className="mtb-score">{match.score.home} - {match.score.away}</div>
      <div className="mtb-team right"><b>{match.awayName}</b><small>{match.oppFormationName}</small></div>
      <div className="mtb-clock"><Radio size={13} color={running ? '#ff5d5d' : '#8f9abb'} /> {mm}:{ss}{match.finished ? <span className="ft"> · FT</span> : <small>{half}</small>}</div>
      <div className="mtb-weather"><Sun size={15} /> 12°C<small>Old Trafford</small></div>
      <div className="mtb-speeds">{SPEEDS.map(s => <button key={s} className={speed === s ? 'active' : ''} onClick={() => setSpeed(s)}>{s}x</button>)}</div>
      <button className="mtb-icon" onClick={() => window.confirm('Restart the match from kick-off?') && restart()} title="Restart match"><SkipBack size={16} /></button>
      <button className="mtb-icon play" onClick={() => setRunning(r => !r)} disabled={match.finished}>{running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
      <button className="mtb-icon" onClick={jumpToNextHighlight} title="Jump to next highlight"><SkipForward size={16} /></button>
      <button className="mtb-icon" onClick={() => setActive('Tactics')} title="Match settings"><Settings size={16} /></button>
    </div>

    {match.pendingDecision && <div className="md-decision">
      <div className="md-decision-head"><TriangleAlert size={16} color="#ffb84d" /> Decision Required</div>
      <p>{match.pendingDecision.text}</p>
      {tacticalDelegation === 'Automatic'
        ? <p className="muted-sub">Assistant Manager is handling this automatically...</p>
        : <div className="md-decision-options">{match.pendingDecision.options.map(o => <button key={o.key} onClick={() => choose(o.key)}><b>{o.key}</b> {o.label}</button>)}</div>}
    </div>}

    {subsOpen && <div className="md-subs-panel">
      <div className="md-subs-head"><b>Make a Substitution</b><span className="muted-sub">Pick who comes off, then who comes on. The match continues.</span><button className="md-close" onClick={() => { setSubsOpen(false); setSubOut(null); }}><X size={15} /></button></div>
      <div className="md-subs-body">
        <div className="md-subs-col"><div className="panel-label">On the Pitch</div>
          {match.homeXI.map(p => <button key={p.id} className={`md-sub-row ${subOut === p.id ? 'active' : ''}`} onClick={() => setSubOut(p.id)}><b>{p.name}</b><span>{p.role}</span></button>)}
        </div>
        <div className="md-subs-col"><div className="panel-label">Bench</div>
          {!subOut && <p className="muted-sub">Pick an outgoing player first.</p>}
          {subOut && bench.map(p => <button key={p.id} className="md-sub-row" onClick={() => makeSub(p)}><b>{p.name}</b><span>{p.displayPos} · OVR {p.ovr} · Fit {p.fit}%</span></button>)}
        </div>
      </div>
    </div>}

    {teamTalkOpen && <div className="md-subs-panel">
      <div className="md-subs-head"><b>Team Talk</b><span className="muted-sub">Your tone affects morale and motivation, not an instant boost.</span><button className="md-close" onClick={() => setTeamTalkOpen(false)}><X size={15} /></button></div>
      <div className="tt-choices">
        {['Calm', 'Encouraging', 'Demanding'].map(t => <button key={t} onClick={() => giveTeamTalk(t)}>{t}</button>)}
      </div>
      {teamTalkNote && <p className="muted-sub" style={{ marginTop: 10 }}>{teamTalkNote}</p>}
    </div>}

    <div className="match-grid">
      <aside className="mcol-left">
        <section className="panel">
          <h3><ListVideo size={15} /> Match Info</h3>
          <p className="mi-line">Premier League · Matchday 4</p>
          <p className="mi-line">Old Trafford · {mm}:{ss}</p>
          <div className="mi-score-row">
            <div className="mi-team"><div className="crest-sq">MU</div><small>{match.homeName}</small></div>
            <div className="mi-vs">{match.score.home} - {match.score.away}</div>
            <div className="mi-team"><div className="crest-sq brighton">{match.awayName.slice(0, 2).toUpperCase()}</div><small>{match.awayName}</small></div>
          </div>
          <div className="mi-goals">
            {goals.length === 0 && <p className="muted-sub">No goals yet.</p>}
            {goals.map((g, i) => <p key={i} className="mi-goal"><Zap size={11} color={g.team === 'home' ? '#5be887' : '#8fa6ff'} /> {String(g.minute).padStart(2, '0')}' {g.text.split(' finds')[0].split(' shoots')[0]}</p>)}
          </div>
        </section>

        <section className="panel">
          <h3><BarChart3 size={15} /> Live Stats</h3>
          <StatRow label="Possession" home={possessionHome} away={100 - possessionHome} format={v => v + '%'} />
          <StatRow label="Shots" home={homeStats.shots} away={awayStats.shots} />
          <StatRow label="Shots on Target" home={homeStats.onTarget} away={awayStats.onTarget} />
          <StatRow label="Corners" home={homeStats.corners} away={awayStats.corners} />
          <StatRow label="Fouls" home={homeStats.fouls} away={awayStats.fouls} />
          <StatRow label="Pass Completion" home={passCompHome} away={passCompAway} format={v => v + '%'} />
        </section>

        <section className="panel">
          <h3><Crosshair size={15} /> Formations</h3>
          <div className="mf-row">
            <button className="mf-card" onClick={() => setActive('Tactics')}><MiniFormation formationName={formation} side="home" /><small>{formation}</small></button>
            <button className="mf-card" onClick={() => setActive('Tactics')}><MiniFormation formationName={match.oppFormationName} side="away" /><small>{match.oppFormationName}</small></button>
          </div>
        </section>
      </aside>

      <div className="mcol-center">
        <div className="view-tabs">
          {['Tactical View', 'Action View', 'Commentary View'].map(v => <button key={v} className={view === v.split(' ')[0] ? 'active' : ''} onClick={() => setView(v.split(' ')[0])}>{v}</button>)}
        </div>

        <div className={`pitch-card ${view === 'Commentary' ? 'shrink' : ''}`}>
          <div className="pitch-head"><span><Users size={13} /> {match.homeName} <small>{formation}</small></span><span className="right">{match.awayName} <small>{match.oppFormationName}</small></span></div>
          <div className="pitch-viewport">
            <div className="pitch-surface" style={pitchStyle}>
              {[...Array(6)].map((_, i) => <div key={i} className="stripe" style={{ left: `${i * (100 / 6)}%`, width: `${100 / 6}%` }} />)}
              <div className="mid-line" /><div className="center-circle" /><div className="pbox left" /><div className="pbox right" />
              {match.homeXI.map(p => <PitchMarker key={p.id} p={p} onClick={pl => setSelectedId(pl.id)} selected={selectedId === p.id} />)}
              {match.awayXI.map(p => <PitchMarker key={p.id} p={p} onClick={pl => setSelectedId(pl.id)} selected={selectedId === p.id} />)}
              <PitchMarker p={{ x: match.ballX, y: match.ballY }} isBall />
            </div>
          </div>
          <div className="pitch-legend">
            <span><i className="dot home" /> Ball</span>
            <span className="lg-arrow home">— —&gt;</span> Player movement
            <span className="lg-arrow pass">- - -&gt;</span> Pass
            <span className="lg-arrow away">— —&gt;</span> Opponent movement
          </div>
        </div>

        <div className="bottom-row">
          <div className="panel feed-panel">
            <div className="feed-tabs">{['Live Commentary', 'Match Events', 'Statistics'].map(t => <button key={t} className={feedTab === t ? 'active' : ''} onClick={() => setFeedTab(t)}>{t}</button>)}</div>
            {feedTab === 'Statistics' ? <div className="feed-stats">
              <StatRow label="Possession" home={possessionHome} away={100 - possessionHome} format={v => v + '%'} />
              <StatRow label="Shots" home={homeStats.shots} away={awayStats.shots} />
              <StatRow label="xG" home={(homeStats.xG||0).toFixed(2)} away={(awayStats.xG||0).toFixed(2)} />
              <StatRow label="Pass Completion" home={passCompHome} away={passCompAway} format={v => v + '%'} />
            </div> : <div className="feed-list">
              {visibleFeed.slice(0, 40).map((e, i) => <div className={`feed-row ${e.type}`} key={i}>
                <b>{String(e.minute).padStart(2, '0')}:{String(e.second).padStart(2, '0')}</b><span>{e.text}</span>
              </div>)}
              {visibleFeed.length === 0 && <p className="muted-sub" style={{ padding: 10 }}>Nothing to show yet.</p>}
            </div>}
          </div>

          <div className="panel controls-panel">
            <h3>Match Controls</h3>
            <button onClick={() => setActive('Tactics')}><Crosshair size={14} /> Tactics</button>
            <button onClick={() => setSubsOpen(s => !s)}><Repeat size={14} /> Substitutions {subsMade > 0 && <em>{subsMade}</em>}</button>
            <button onClick={() => setTeamTalkOpen(o => !o)}><MessageSquare size={14} /> Team Talk</button>
            <button onClick={runQuickSim}><FastForward size={14} /> Quick Sim</button>
            <div className="speed-stepper">
              <span>Speed</span>
              <button onClick={() => setSpeed(s => SPEEDS[Math.max(0, SPEEDS.indexOf(s) - 1)])}><Minus size={13} /></button>
              <b>{speed}x</b>
              <button onClick={() => setSpeed(s => SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(s) + 1)])}><Plus size={13} /></button>
            </div>
            <label className="hl-toggle"><span>Highlights Only</span><button className={highlightsOnly ? 'on' : ''} onClick={() => setHighlightsOnly(h => !h)}><i /></button></label>
          </div>
        </div>
      </div>

      <aside className="mcol-right">
        <section className="panel">
          <div className="stats-tabs">{['Match', 'Tactical', 'Player'].map(t => <button key={t} className={statsTab === t ? 'active' : ''} onClick={() => setStatsTab(t)}>{t}</button>)}</div>
          {statsTab === 'Match' && <>
            <StatRow label="Possession" home={possessionHome} away={100 - possessionHome} format={v => v + '%'} />
            <StatRow label="Shots" home={homeStats.shots} away={awayStats.shots} />
            <StatRow label="Shots on Target" home={homeStats.onTarget} away={awayStats.onTarget} />
            <StatRow label="xG" home={(homeStats.xG||0).toFixed(2)} away={(awayStats.xG||0).toFixed(2)} />
            <StatRow label="Corners" home={homeStats.corners} away={awayStats.corners} />
            <StatRow label="Fouls" home={homeStats.fouls} away={awayStats.fouls} />
            <StatRow label="Pass Completion" home={passCompHome} away={passCompAway} format={v => v + '%'} />
          </>}
          {statsTab === 'Tactical' && <>
            <p className="ti-line"><span>Formation</span><b>{formation} <small className="muted-sub">vs</small> {match.oppFormationName}</b></p>
            <p className="ti-line"><span>Defensive Line</span><b>{Math.round(teamInstructions.defensiveLine)}%</b></p>
            <p className="ti-line"><span>Pressing Intensity</span><b>{Math.round(pressing.intensity)}%</b></p>
            <StatRow label="Territory" home={territoryHome} away={100 - territoryHome} format={v => v + '%'} />
            <p className="muted-sub" style={{ marginTop: 8 }}>Territory reflects which half of the pitch the ball has spent its time in, tracked live from the simulation.</p>
          </>}
          {statsTab === 'Player' && <div className="player-tab-list">
            {match.homeXI.slice().sort((a, b) => matchRating(b) - matchRating(a)).map(p => <button key={p.id} className={`ptab-row ${selectedId === p.id ? 'sel' : ''}`} onClick={() => setSelectedId(p.id)}>
              <b>{p.name}</b><span>{p.role}</span><em>{matchRating(p)}</em>
            </button>)}
          </div>}
        </section>

        <section className="panel player-details">
          <h3>Player Details</h3>
          {!selected && <p className="muted-sub">Click a player on the pitch to see their live details.</p>}
          {selected && <>
            <div className="pd-head">
              <div className="pd-avatar">{selected.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
              <div><b>{selected.name}</b><small>{selected.pos} | {ROLE_NAMES[selected.role] || selected.role}</small><small className="muted-sub">{selected.teamSide === 'home' ? match.homeName : match.awayName}</small></div>
              <div className="pd-rating">{matchRating(selected)}</div>
            </div>
            <div className="pd-bar"><span>Condition</span><div className="bar-track"><i style={{ width: `${selected.fit}%` }} /></div><b>{Math.round(selected.fit)}%</b></div>
            <div className="pd-bar"><span>Sharpness</span><div className="bar-track"><i style={{ width: `${Math.max(30, 100 - selected.fatigue)}%` }} /></div><b>{Math.max(30, Math.round(100 - selected.fatigue))}%</b></div>
            <p className="pd-morale">Morale <b className="lime">{selected.morale}</b></p>
            <div className="pd-stats">
              <div><small>Touches</small><b>{selected.touches || 0}</b></div>
              <div><small>Passes</small><b>{selected.passesCompleted || 0}/{selected.passesAttempted || 0}</b></div>
              <div><small>Shots</small><b>{selected.shots || 0}</b></div>
              <div><small>Goals</small><b>{selected.goals || 0}</b></div>
              <div><small>Distance (km)</small><b>{(selected.distanceKm || 0).toFixed(1)}</b></div>
              <div><small>Tackles</small><b>{selected.tackles || 0}</b></div>
            </div>
            <div className="pd-behaviour"><Gauge size={13} /> Tactical Behaviour <b>{tacticalBehaviour(selected)}</b></div>
            {selected.teamSide === 'home' && <button className="link-btn" onClick={() => openProfileFor(mapRosterPlayer(roster.find(r => r.id === selected.id) || { id: selected.id, name: selected.name, displayPos: selected.pos }), 'Match')}>View Full Profile</button>}
          </>}
        </section>

        <section className="panel">
          <h3><TriangleAlert size={15} /> Recent Events</h3>
          <div className="recent-list">
            {match.events.filter(e => e.type !== 'play' && e.type !== 'info').slice(0, 10).map((e, i) => <button className="recent-row" key={i} onClick={() => { }}>
              <b>{e.minute}'</b>
              <span className={`ev-tag ${e.type}`}>{e.type === 'goal' ? 'GOAL' : e.type === 'foul' ? 'Foul' : e.type === 'sub' ? 'Sub' : e.type === 'turnover' ? 'Turnover' : e.type === 'setpiece' ? 'Corner' : 'Chance'}</span>
              <small>{e.text}</small>
            </button>)}
            {match.events.filter(e => e.type !== 'play' && e.type !== 'info').length === 0 && <p className="muted-sub">No major events yet.</p>}
          </div>
        </section>
      </aside>
    </div>
  </div>;
}
