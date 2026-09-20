import Football3DPresentation from './Football3DPresentation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu, Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Settings, Sun,
  Crosshair, Gauge, Users, Repeat, X, Check, TriangleAlert, ListVideo, BarChart3,
  Radio, MessageSquare, Zap, Minus, Plus, Maximize2, Minimize2, Monitor, MonitorOff,
} from 'lucide-react';
import './match.css';
import Player3DWebGL from './Player3DWebGL.jsx';
import { useTacticsData } from './store/TacticsContext.jsx';
import { useFinanceData } from './store/FinanceContext.jsx';
import { usePlayerState } from './store/PlayerStateContext.jsx';
import { useCommunicationData } from './store/CommunicationContext.jsx';
import { useManagerData } from './store/ManagerContext.jsx';
import { useClubState } from './store/ClubStateContext.jsx';
import { homeMatchdayRevenue, homeAdvantageFactor, fixtureDetail } from './data/fixtureDetail.js';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useSimulation } from './store/SimulationContext.jsx';
import { useWorldData } from './store/WorldContext.jsx';
import { mapRosterPlayer } from './data/homeData.js';
import TacticsScreen from './Tactics.jsx';
import {
  buildXI, buildOpponentPool, initMatch, stepMatch, resolveDecision, simulateInstant, substitutePlayer,
} from './engine/FAMILY26MatchEngine.js';
import { FORMATIONS } from './tactics/formations.js';
import { useDatabase } from './store/DatabaseContext.jsx';
import { createSeededRng, deriveSeed } from './engine/seededRng.js';
import { getMatchSeed } from './engine/simulationSeeds.js';
import { getCareerClubId, getCareerClubName } from './engine/clubIdentity.js';
import { tacticalRoleAnchor, tacticalPressTrigger, teamShapeTargets } from './engine/tacticalShape.js';

const SPEEDS = [1, 2, 4, 8];
// Fixed engine tick = 0.5 game-seconds (see FAMILY26MatchEngine.FIXED_GAME_SECONDS).
// A full 90' match is therefore 10,800 ticks. We render every 40ms and, per
// speed tier, consume a base number of ticks per render. At the default
// (4x + Highlights Only) this alone lands ~2.4 real minutes for 90 game
// minutes; Highlights Only's quiet-tick skipping (below) pulls that down
// further, landing in the ~1.5-3 minute range described for default viewing.
const REAL_TICK_MS = 40;
const BASE_TICKS_BY_SPEED = { 1: 2, 2: 4, 4: 8, 8: 16 };
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

function buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, formation, homeName, league, dutyAssignment, matchSeed, currentClubId }) {
  const userPairs = slots.map((slot, i) => ({ slot, duty: dutyAssignment?.[slot.id] || 'Support', player: startXI.find(p => p.id === assignment[slot.id]) || startXI[i % startXI.length] }));

  const rawFixture = league.fixtures[0];
  const fixture = rawFixture ? { ...rawFixture } : null;
  // `fixtures[0]` is guaranteed by CompetitionContext to be the career club's
  // next fixture. Never substitute Newcastle or another placeholder club here.
  const fixtureHome = fixture
    ? (fixture.homeId != null
      ? String(fixture.homeId) === String(currentClubId)
      : fixture.home === homeName)
    : true;
  const oppName = fixture ? (fixtureHome ? fixture.away : fixture.home) : 'Brighton';
  const oppRow = league.table.find(r => r.club === oppName) || league.table.find(r => !r.us) || { club: oppName, pts: 20 };
  const oppFormationName = OPPONENT_FORMATION_BY_CLUB[oppName] || '4-3-3';
  const oppSlots = FORMATIONS[oppFormationName];
  const oppPool = buildOpponentPool(60 + Math.min(30, oppRow.pts / 2), oppSlots, oppRow.club);
  const namedPool = oppPool.map((p, i) => BRIGHTON_XI_NAMES[i] ? { ...p, name: BRIGHTON_XI_NAMES[i].name } : p);
  const DEFAULT_DUTY = { GK:'Defend', DL:'Support', DR:'Support', DC:'Defend', DM:'Defend', MC:'Support', AMC:'Support', AML:'Attack', AMR:'Attack', ST:'Attack' };
  const opponentPairs = oppSlots.map((slot, i) => ({ slot, duty: DEFAULT_DUTY[slot.code] || 'Support', player: namedPool[i] }));

  // Build each side according to the real fixture orientation. This matters
  // for away matches: the career club must actually be the away side in the
  // engine, not just in the scoreboard text.
  const userXI = buildXI(userPairs, fixtureHome ? 'home' : 'away');
  const opponentXI = buildXI(opponentPairs, fixtureHome ? 'away' : 'home');
  const homeXI = fixtureHome ? userXI : opponentXI;
  const awayXI = fixtureHome ? opponentXI : userXI;

  const isHomeFixture = fixtureHome;
  const advantage = isHomeFixture ? homeAdvantageFactor(fixtureDetail(fixture, true).attendance, fixtureDetail(fixture, true).capacity) : 1;
  const userTactics = {
    mentality: teamInstructions.mentality,
    tempo: Math.min(90, Math.round(teamInstructions.tempo * advantage)),
    width: teamInstructions.width,
    directness: teamInstructions.passingStyle === 'Direct Passing' ? 78 : teamInstructions.passingStyle === 'Short Passing' ? 28 : 52,
    buildUp: teamInstructions.buildUp,
    crossing: teamInstructions.crossing,
    attackingFocus: teamInstructions.attackingFocus,
    lineOfEngagement: teamInstructions.lineOfEngagement,
    compactness: teamInstructions.compactness,
    transition: teamInstructions.transition,
    defensiveLine: teamInstructions.defensiveLine,
    pressing,
  };
  const opponentTactics = { mentality: oppRow.pts >= 30 ? 'Positive' : 'Balanced', tempo: oppRow.pts >= 30 ? 62 : 56, defensiveLine: 55, pressing: { intensity: oppRow.pts >= 30 ? 66 : 58 } };

  const state = initMatch({
    homeXI, awayXI,
    homeName: fixtureHome ? homeName : oppRow.club,
    awayName: fixtureHome ? oppRow.club : homeName,
    homeTactics: fixtureHome ? userTactics : opponentTactics,
    awayTactics: fixtureHome ? opponentTactics : userTactics,
    matchSeed,
  });
  state.oppFormationName = oppFormationName;
  state.formationName = FORMATIONS[formation] ? formation : '4-3-3';
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
  const db = useDatabase();
  const { careerSquad: roster } = db;
  const { slots, assignment, startXI, teamInstructions, pressing, tacticalDelegation, formation, dutyAssignment } = useTacticsData();
  const { league, recordUserMatchResult } = useCompetitionData();
  const { reportLiveMatch, unlockAfterMatch, now: simulationNow } = useSimulation();
  const { openProfileFor } = useWorldData();
  const finance = useFinanceData();
  const playerState = usePlayerState();
  const { addNews } = useCommunicationData();
  const manager = useManagerData();
  const clubState = useClubState();
  const currentClubId = getCareerClubId(manager.profile, db);
  const currentClubName = getCareerClubName(manager.profile, db);
  const currentFixture = league.fixtures?.[0];
  const fixtureIsHome = currentFixture?.homeId ? String(currentFixture.homeId) === String(currentClubId) : currentFixture?.home === currentClubName;
  const currentOpponent = currentFixture ? (fixtureIsHome ? currentFixture.away : currentFixture.home) : 'Brighton';
  const matchSeed = getMatchSeed(manager.profile?.careerSeed, simulationNow?.toISOString?.() || '', currentClubId, currentOpponent, league.name || 'Premier League');

  const [match, setMatch] = useState(() => buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, formation, homeName: currentClubName, league, dutyAssignment, matchSeed, currentClubId }));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [highlightsOnly, setHighlightsOnly] = useState(false);
  const [view, setView] = useState('Tactical');
  const [statsTab, setStatsTab] = useState('Match');
  const [feedTab, setFeedTab] = useState('Live Commentary');
  const [selectedId, setSelectedId] = useState(null);
  const [subsOpen, setSubsOpen] = useState(false);
  const [subOut, setSubOut] = useState(null);
  const [subsMade, setSubsMade] = useState(0);
  const [teamTalkOpen, setTeamTalkOpen] = useState(false);
  const [teamTalkNote, setTeamTalkNote] = useState('');
  const [halfTimeOpen, setHalfTimeOpen] = useState(false);
  const [tacticsOverlayOpen, setTacticsOverlayOpen] = useState(false);
  const [matchFullscreen, setMatchFullscreen] = useState(false);
  const [browserFullscreen, setBrowserFullscreen] = useState(false);
  const matchWindowRef = useRef(null);
  const halfTimeShown = useRef(false);
  const resultRecorded = useRef(false);
  const MAX_SUBS = 5;
  const MAX_BENCH_CHOICES = 10;

  // 3D player asset contract: when real kit/badge images are supplied, these
// visual assets can be attached to each player without changing match logic.
// The current procedural model is the video-matched fallback renderer.

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
    setMatch(m => m.finished ? m : { ...m, homeTactics: {
      ...m.homeTactics,
      mentality: teamInstructions.mentality,
      tempo: teamInstructions.tempo,
      width: teamInstructions.width,
      directness: teamInstructions.passingStyle === 'Direct Passing' ? 78 : teamInstructions.passingStyle === 'Short Passing' ? 28 : 52,
      buildUp: teamInstructions.buildUp,
      crossing: teamInstructions.crossing,
      attackingFocus: teamInstructions.attackingFocus,
      lineOfEngagement: teamInstructions.lineOfEngagement,
      compactness: teamInstructions.compactness,
      transition: teamInstructions.transition,
      defensiveLine: teamInstructions.defensiveLine,
      pressing,
    } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamInstructions, pressing]);

  const restart = () => {
    resultRecorded.current = false;
    halfTimeShown.current = false;
    setMatch(buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, formation, homeName: currentClubName, league, dutyAssignment, matchSeed, currentClubId }));
    setSelectedId(null); setSubsMade(0); setHalfTimeOpen(false);
  };
  const userIsHome = match.homeName === currentClubName;
  const userXI = userIsHome ? match.homeXI : match.awayXI;
  const userOpponentName = userIsHome ? match.awayName : match.homeName;
  const bench = useMemo(() =>
    roster.filter(p => !userXI.some(h => h.id === p.id))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, MAX_BENCH_CHOICES),
  [roster, userXI]);

  // Half-time is a hard stop, not just a label change: the moment the clock
  // crosses 45', the engine pauses itself and hands control to the manager
  // (team talk / tactics / substitutions) rather than quietly ticking on
  // into the second half.
  useEffect(() => {
    if (match.minute >= 45 && !halfTimeShown.current && !match.finished) {
      halfTimeShown.current = true;
      setRunning(false);
      setHalfTimeOpen(true);
    }
  }, [match.minute, match.finished]);

  const makeSub = (inPlayer) => {
    if (!subOut || subsMade >= MAX_SUBS) return;
    setMatch(m => {
      const userSide = m.homeName === currentClubName ? 'homeXI' : 'awayXI';
      const outPlayer = m[userSide].find(p => p.id === subOut);
      const newXI = substitutePlayer(m[userSide], subOut, inPlayer);
      const events = [{ minute: m.minute, second: m.second, text: `Substitution: ${inPlayer.name} replaces ${outPlayer?.name || 'a player'}.`, type: 'sub', team: m.homeName === currentClubName ? 'home' : 'away' }, ...m.events].slice(0, 80);
      return { ...m, [userSide]: newXI, events };
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

  const toggleMatchFullscreen = () => setMatchFullscreen(v => !v);
  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (matchWindowRef.current || document.documentElement).requestFullscreen();
        setBrowserFullscreen(true);
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser fullscreen can be denied by permissions or embedding; the
      // match-only fullscreen remains available as a reliable fallback.
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setBrowserFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
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
    reportLiveMatch({ inProgress: running && !match.finished, minute: match.minute, second: match.second, homeScore: match.score.home, awayScore: match.score.away, opponent: userOpponentName, finished: match.finished });
    if (match.finished && !resultRecorded.current) {
      resultRecorded.current = true;
      recordUserMatchResult(match.score.home, match.score.away);
      // A manager's reputation is a real, moving number now — built from
      // actual results, not just a static profile field.
      {
        const weWon = match.homeName === currentClubName ? match.score.home > match.score.away : match.score.away > match.score.home;
        const weDrew = match.score.home === match.score.away;
        const oppName = match.homeName === currentClubName ? match.awayName : match.homeName;
        const resultRng = createSeededRng(deriveSeed('post-match', matchSeed, match.score.home, match.score.away));
        if (weWon) manager.adjustReputation(1.5 + resultRng() * 1.5, `Win against ${oppName}`);
        else if (weDrew) manager.adjustReputation(-0.2, `Draw with ${oppName}`);
        else manager.adjustReputation(-(1.5 + resultRng() * 1.5), `Defeat to ${oppName}`);
        // The board reacts to results too — a touch more conservatively
        // than your own reputation, since one bad result rarely shakes
        // board confidence as much as a genuine run of form would.
        if (weWon) clubState.adjustBoardConfidence(1 + resultRng(), `Win against ${oppName}`);
        else if (!weDrew) clubState.adjustBoardConfidence(-(1 + resultRng() * 1.5), `Defeat to ${oppName}`);
      }
      // Every completed home fixture should actually generate matchday
      // income — an away trip still earns a smaller broadcast/travelling
      // support share, not a full house of ticket revenue.
      const weAreHome = match.homeName === currentClubName;
      const won = weAreHome ? match.score.home > match.score.away : match.score.away > match.score.home;
      // Real attendance-based revenue for home games (same fixture detail
      // shown pre-match in the Matchday hub, not a separate random number)
      // — a genuinely full house at Old Trafford earns more than a
      // half-empty one, and away trips only ever earn a broadcast/travel
      // share, never ticket revenue.
      const homeRevenue = weAreHome ? homeMatchdayRevenue(league.fixtures[0]) : null;
      const revenueRng = createSeededRng(deriveSeed('away-revenue', matchSeed));
      const base = weAreHome ? homeRevenue.amount : 350_000 + Math.round(revenueRng() * 250_000);
      const amount = won ? Math.round(base * 1.15) : base;
      finance.addTransaction(
        weAreHome ? `Matchday Revenue vs ${match.awayName} (${homeRevenue.attendance.toLocaleString()} attendance)` : `Away Day Share — ${match.homeName}`,
        amount, 'Matchday Revenue',
      );
      // Write real match involvement back into each player's live state —
      // this is what makes fitness/form/fatigue actually move instead of
      // sitting at their seed values forever, and what can trigger a real
      // injury record tied to the current in-game date.
      const dateLabel = new Date().toDateString();
      userXI.forEach(p => {
        if (typeof p.id !== 'number') return; // skip synthetic opponent players
        const rating = Number(matchRating(p));
        playerState.recordMatchPerformance(p.id, {
          minutesPlayed: 90, rating, started: true,
          goals: p.goals || 0, assists: p.assists || 0, shots: p.shots || 0, tackles: p.tackles || 0,
          passesCompleted: p.passesCompleted || 0, passesAttempted: p.passesAttempted || 0,
          yellowCards: p.yellowCards || 0, redCard: !!p.redCard,
          cleanSheet: userIsHome ? match.score.away === 0 : match.score.home === 0,
        });
        // Small extra injury risk tied to how physical the match was for
        // this player — separate from the independent daily knock risk.
        const injuryChance = 0.02 + (p.tackles || 0) * 0.004;
        const matchInjuryRng = createSeededRng(deriveSeed('match-injury', matchSeed, p.id, p.tackles || 0, p.shots || 0));
        if (matchInjuryRng() < injuryChance) {
          const info = playerState.applyInjury(p.id, dateLabel);
          addNews({ category: 'Injury', bucket: 'Club News', crest: currentClubName, headline: `${p.name} injured — ${info.type}`, body: `Expected to be out until ${info.expectedReturn}.` });
        }
        // A red card is a genuine event that should reach News too, not
        // just sit in the match report — one event, multiple consequences.
        if (p.redCard) {
          const opponentName = weAreHome ? match.awayName : match.homeName;
          addNews({ category: 'Discipline', bucket: 'Club News', crest: currentClubName, headline: `${p.name} sent off vs ${opponentName}`, body: `${p.name} will serve a suspension for the next fixture.` });
        }
      });
      playerState.tickSuspensions();
    }
  }, [running, match.minute, match.second, match.finished, match.score.home, match.score.away]);

  useEffect(() => () => {
    if (!match.finished) reportLiveMatch({ inProgress: false, minute: match.minute, second: match.second, homeScore: match.score.home, awayScore: match.score.away, opponent: userOpponentName, finished: false, awayFromScreen: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPlayers = [...match.homeXI, ...match.awayXI];
  const selected = allPlayers.find(p => p.id === selectedId) || null;
  const goals = match.events.filter(e => e.type === 'goal').slice().reverse();
  const visibleFeed = feedTab === 'Match Events'
    ? match.events.filter(e => ['goal', 'sub', 'foul', 'card'].includes(e.type))
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

  const defaultCamera = 'Broadcast';
  const cameraZoom = defaultCamera === 'Broadcast' ? 1 : 1.08;
  const cameraFocusX = 50 + (match.ballX - 50) * 0.08;
  const cameraFocusY = 50 + (match.ballY - 50) * 0.08;
  const stageVars = {
    '--camera-x': `${cameraFocusX}%`,
    '--camera-y': `${cameraFocusY}%`,
    '--camera-zoom': cameraZoom,
  };
  const depthScale = (p) => (0.64 + (Number(p.y || 50) / 100) * 0.48).toFixed(3);
  const playerHeight = (p) => Math.round(34 + (Number(p.y || 50) / 100) * 12);

  const eventLabel = (e) => e.type === 'goal' ? 'GOAL' : e.type === 'foul' ? 'FOUL' : e.type === 'sub' ? 'SUB' : e.type === 'card' ? 'CARD' : e.type === 'setpiece' ? 'CORNER' : e.type === 'turnover' ? 'TURNOVER' : 'CHANCE';
  const liveEvents = match.events.filter(e => e.type !== 'play' && e.type !== 'info').slice(0, 8);

  return <div ref={matchWindowRef} className={`match-page match-3d-page performance-adaptive ${matchFullscreen ? 'match-only-fullscreen' : ''} ${browserFullscreen ? 'browser-fullscreen' : ''}`}>
    <div className="match-3d-topbar">
      <div className="brand-lockup"><span className="brand-mark">♛</span><b>FAMILY <i>26</i></b></div>
      <div className="competition-chip"><small>{league.name}</small><b>Matchday {league.table.find(r => r.us)?.p ?? 0}</b></div>
      <div className="scoreboard-3d">
        <div className="score-team home"><span className="crest-mini">MU</span><b>{match.homeName}</b></div>
        <strong>{match.score.home} <em>–</em> {match.score.away}</strong>
        <div className="score-team away"><b>{match.awayName}</b><span className="crest-mini away">B</span></div>
        <div className="score-clock"><span className={running ? 'live-dot on' : 'live-dot'} />{mm}:{ss}<small>{match.finished ? 'FULL-TIME' : half}</small></div>
      </div>
      <div className="match-top-actions">
        <button className="icon-button" onClick={toggleMatchFullscreen} title="Match fullscreen">{matchFullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</button>
        <button className="icon-button" onClick={toggleBrowserFullscreen} title="Browser fullscreen">{browserFullscreen ? <MonitorOff size={15}/> : <Monitor size={15}/>}</button>
      </div>
      <div className="match-top-tactics">
        <div><small>MENTALITY</small><b>{teamInstructions.mentality}</b></div>
        <div><small>FORMATION</small><b>{formation}</b></div>
        <div><small>PRESS</small><b>{Math.round(pressing.intensity)}%</b></div>
        <div><small>TEMPO</small><b>{Math.round(teamInstructions.tempo)}</b></div>
      </div>
      <button className="icon-button" onClick={() => setTacticsOverlayOpen(true)} title="Match settings"><Settings size={17} /></button>
    </div>

    {match.pendingDecision && <div className="decision-3d">
      <div><TriangleAlert size={16} /><b>Decision Required</b></div>
      <p>{match.pendingDecision.text}</p>
      {tacticalDelegation === 'Automatic' ? <small>Assistant Manager is handling this automatically…</small> : <div className="decision-options-3d">{match.pendingDecision.options.map(o => <button key={o.key} onClick={() => choose(o.key)}><b>{o.key}</b>{o.label}</button>)}</div>}
    </div>}

    {halfTimeOpen && <div className="ht-backdrop"><div className="ht-panel">
      <div className="ht-head"><span className="ht-badge">HALF-TIME</span><h2>{match.homeName} {match.score.home} - {match.score.away} {match.awayName}</h2></div>
      <div className="ht-stats"><StatRow label="Possession" home={possessionHome} away={100 - possessionHome} format={v => `${v}%`} /><StatRow label="Shots" home={homeStats.shots} away={awayStats.shots} /><StatRow label="xG" home={(homeStats.xG || 0).toFixed(2)} away={(awayStats.xG || 0).toFixed(2)} /><StatRow label="Pass Completion" home={passCompHome} away={passCompAway} format={v => `${v}%`} /><StatRow label="Tackles" home={homeStats.tackles||0} away={awayStats.tackles||0}/><StatRow label="Interceptions" home={homeStats.interceptions||0} away={awayStats.interceptions||0}/><StatRow label="Saves" home={homeStats.saves||0} away={awayStats.saves||0}/><StatRow label="Fouls" home={homeStats.fouls||0} away={awayStats.fouls||0}/><StatRow label="Corners" home={homeStats.corners||0} away={awayStats.corners||0}/></div>
      <div className="ht-actions"><button onClick={() => setTeamTalkOpen(true)}><MessageSquare size={15} /><div><b>Team Talk</b><small>Address the dressing room</small></div></button><button onClick={() => setTacticsOverlayOpen(true)}><Crosshair size={15} /><div><b>Tactics</b><small>Adjust the match plan</small></div></button><button onClick={() => setSubsOpen(true)} disabled={subsMade >= MAX_SUBS}><Repeat size={15} /><div><b>Substitutions</b><small>{MAX_SUBS - subsMade} remaining</small></div></button></div>
      <button className="ht-continue" onClick={() => { setHalfTimeOpen(false); setRunning(true); }}><Play size={15} fill="currentColor" /> Continue to Second Half</button>
    </div></div>}

    {tacticsOverlayOpen && <div className="ht-backdrop"><div className="ht-panel tactics-embed-panel"><div className="ht-embed-head"><b>Tactics — In Match</b><button className="md-close" onClick={() => setTacticsOverlayOpen(false)}><X size={15} /></button></div><div className="ht-embed-body"><TacticsScreen setActive={() => {}} initialTab="Formation" embedded /></div></div></div>}

    {match.finished && <div className="ht-backdrop"><div className="ht-panel pm-panel">
      <div className="ht-head"><span className="ht-badge">FULL-TIME</span><h2>{match.homeName} {match.score.home} - {match.score.away} {match.awayName}</h2></div>
      <div className="ht-stats"><StatRow label="Possession" home={possessionHome} away={100 - possessionHome} format={v => `${v}%`} /><StatRow label="Shots" home={homeStats.shots} away={awayStats.shots} /><StatRow label="Shots on Target" home={homeStats.onTarget} away={awayStats.onTarget} /><StatRow label="xG" home={(homeStats.xG || 0).toFixed(2)} away={(awayStats.xG || 0).toFixed(2)} /><StatRow label="Corners" home={homeStats.corners} away={awayStats.corners} /><StatRow label="Pass Completion" home={passCompHome} away={passCompAway} format={v => `${v}%`} /></div>
      <div className="pm-section"><h4>Match Events</h4><div className="pm-event-list">{match.events.filter(e => ['goal','sub','foul','card'].includes(e.type)).slice().reverse().map((e,i)=><div className="pm-event-row" key={i}><b>{e.minute}'</b><span>{e.text}</span></div>)}</div></div>
      <div className="pm-section"><h4>Top Performers</h4><div className="pm-ratings">{[...userXI].sort((a,b)=>matchRating(b)-matchRating(a)).slice(0,4).map(p=><div className="pm-rating-row" key={p.id}><span>{p.name}</span><em className={matchRating(p)<6.8?'low':''}>{matchRating(p)}</em></div>)}</div></div>
      <button className="ht-continue" style={{marginTop:16}} onClick={() => { unlockAfterMatch(); setActive('Home'); }}><Check size={15} /> Continue</button>
    </div></div>}

    {subsOpen && <div className="md-subs-panel"><div className="md-subs-head"><b>Make a Substitution</b><span className="muted-sub">Pick who comes off, then who comes on. {MAX_SUBS - subsMade} remaining.</span><button className="md-close" onClick={() => { setSubsOpen(false); setSubOut(null); }}><X size={15} /></button></div><div className="md-subs-body"><div className="md-subs-col"><div className="panel-label">On the Pitch</div>{userXI.map(p=><button key={p.id} className={`md-sub-row ${subOut===p.id?'active':''}`} disabled={subsMade>=MAX_SUBS} onClick={()=>setSubOut(p.id)}><b>{p.name}</b><span>{p.role}</span></button>)}</div><div className="md-subs-col"><div className="panel-label">Bench</div>{!subOut&&<p className="muted-sub">Pick an outgoing player first.</p>}{subOut&&subsMade<MAX_SUBS&&bench.map(p=><button key={p.id} className="md-sub-row" onClick={()=>makeSub(p)}><b>{p.name}</b><span>{p.displayPos} · OVR {p.ovr} · Fit {p.fit}%</span></button>)}</div></div></div>}

    {teamTalkOpen && <div className="md-subs-panel"><div className="md-subs-head"><b>Team Talk</b><span className="muted-sub">Your tone affects morale and motivation.</span><button className="md-close" onClick={() => setTeamTalkOpen(false)}><X size={15} /></button></div><div className="tt-choices">{['Calm','Encouraging','Demanding'].map(t=><button key={t} onClick={()=>giveTeamTalk(t)}>{t}</button>)}</div>{teamTalkNote&&<p className="muted-sub" style={{marginTop:10}}>{teamTalkNote}</p>}</div>}

    <main className="match-3d-shell">
      <section className={`match-3d-stage ${running ? 'running' : 'paused'}`} style={stageVars} aria-label="FAMILY 26 3D match view">
        <div className="match-tv-topbar">
          <div className="tv-team home"><span className="tv-crest">WH</span><div><b>{match.homeName}</b><small>HOME · {formation}</small></div></div>
          <div className="tv-score"><small>{match.finished ? 'FULL TIME' : half}</small><strong>{match.score.home} <i>—</i> {match.score.away}</strong><em>{mm}:{ss}</em></div>
          <div className="tv-team away"><div><b>{match.awayName}</b><small>AWAY · {match.oppFormationName}</small></div><span className="tv-crest away">BR</span></div>
        </div>
        <div className="match-tactical-ribbon">
          <span className="live-dot">● LIVE</span><span>{teamInstructions.mentality}</span><span>{formation}</span><span>Width {Math.round(teamInstructions.width)}</span><span>Tempo {Math.round(teamInstructions.tempo)}</span><span>Press {Math.round(pressing.intensity)}%</span><span>Line {Math.round(teamInstructions.defensiveLine)}</span>
          <button onClick={()=>setTacticsOverlayOpen(true)}><Crosshair size={12}/> TACTICS</button>
        </div>
        <div className="stadium-stand stand-top"><span>FAMILY 26</span><span>FAMILY 26</span></div>
        <div className="stadium-stand stand-bottom"><span>FAMILY 26</span><span>DREAM. MANAGE. WIN.</span><span>FAMILY 26</span></div>
        <div className="corner-crowd crowd-left" /><div className="corner-crowd crowd-right" />
        <div className="pitch-shadow" />
        <div className="broadcast-pitch">
          <div className="pitch-stripes" />
          <div className="pitch-lines"><span className="touch top" /><span className="touch bottom" /><span className="touch left" /><span className="touch right" /><span className="half-line" /><span className="center-circle" /><span className="center-dot" /><span className="box left" /><span className="box right" /><span className="six left" /><span className="six right" /><span className="goal left" /><span className="goal right" /><span className="penalty-dot left" /><span className="penalty-dot right" /></div>
          <Player3DWebGL players={[...match.homeXI, ...match.awayXI]} selectedId={selectedId} running={running} getPosition={(p,w,h)=>({x:(p.x||50)/100*w,y:(p.y||50)/100*h,scale:0.60 + Math.max(0, Math.min(1,(100-(p.y||50))/100))*0.22})} />
          {match.homeXI.map(p => <button key={`h-${p.id}`} className={`player-hitbox home ${selectedId===p.id?'selected':''}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>setSelectedId(p.id)} aria-label={`${p.name} — ${ROLE_NAMES[p.role]||p.role}`} title={`${p.name} — ${ROLE_NAMES[p.role]||p.role}`}>
            <span className="hitbox-label">{selectedId===p.id ? p.name.split(' ').slice(-1)[0] : ''}</span></button>)}
          {match.awayXI.map(p => <button key={`a-${p.id}`} className={`player-hitbox away ${selectedId===p.id?'selected':''}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>setSelectedId(p.id)} aria-label={`${p.name} — ${ROLE_NAMES[p.role]||p.role}`} title={`${p.name} — ${ROLE_NAMES[p.role]||p.role}`}>
            <span className="hitbox-label">{selectedId===p.id ? p.name.split(' ').slice(-1)[0] : ''}</span></button>)}
          <div className="ball-3d" style={{left:`${match.ballX}%`,top:`${match.ballY}%`}}><i /></div>
        </div>

        <div className="action-banner"><span className="action-live"><Radio size={12}/> LIVE</span><b>{liveEvents[0]?.text || 'Match in progress'}</b><span>{liveEvents[0] ? `${liveEvents[0].minute}:${String(liveEvents[0].second||0).padStart(2,'0')}` : `${mm}:${ss}`}</span></div>

        <div className="event-rail">
          <div className="rail-head"><b>MATCH EVENTS</b><span>{liveEvents.length}</span></div>
          {liveEvents.map((e,i)=><button key={i} className={`rail-event ${e.type}`} onClick={()=>{}}><b>{e.minute}'</b><span className="rail-icon">{e.type==='goal'?'⚽':e.type==='card'?'▰':e.type==='foul'?'⚑':e.type==='sub'?'↔':'•'}</span><small>{eventLabel(e)}</small><em>{e.text}</em></button>)}
          {!liveEvents.length&&<div className="rail-empty">No major events yet.</div>}
        </div>

        {selected && <div className="player-float"><div className="player-float-head"><span className={`float-dot ${selected.teamSide}`} /><div><b>{selected.name}</b><small>{selected.pos} · {ROLE_NAMES[selected.role]||selected.role}</small></div><strong>{matchRating(selected)}</strong></div><div className="float-grid"><span>Condition <b>{Math.round(selected.fit)}%</b></span><span>Goals <b>{selected.goals||0}</b></span><span>Shots <b>{selected.shots||0}</b></span><span>Passes <b>{selected.passesCompleted||0}/{selected.passesAttempted||0}</b></span></div></div>}

        <div className="camera-pill"><span><Radio size={12}/> CAMERA</span><b>Broadcast</b><small>Default view</small></div>
        <div className="pitch-compass">N</div>

        <div className="match-command-dock">
          <div><small>MENTALITY</small><b>{teamInstructions.mentality}</b></div>
          <div><small>PASSING</small><b>{teamInstructions.passingStyle}</b></div>
          <div><small>BUILD-UP</small><b>{teamInstructions.buildUp}</b></div>
          <div><small>TRANSITION</small><b>{teamInstructions.transition?.counter ? 'COUNTER' : teamInstructions.transition?.regroup ? 'REGROUP' : teamInstructions.transition?.quickTransitions ? 'QUICK' : 'SHAPE'}</b></div>
          <button onClick={()=>setTacticsOverlayOpen(true)}><Crosshair size={14}/> Change Tactics</button>
        </div>

        <div className="match-controls-3d">
          <button onClick={()=>setRunning(r=>!r)} disabled={match.finished} className="control-primary">{running?<Pause size={16} fill="currentColor"/>:<Play size={16} fill="currentColor"/>}</button>
          <div className="speed-control"><span>SPEED</span>{SPEEDS.map(s=><button key={s} className={speed===s?'active':''} onClick={()=>setSpeed(s)}>{s}x</button>)}</div>
          <button onClick={jumpToNextHighlight} title="Next highlight"><SkipForward size={15}/><span>Highlight</span></button>
          <button onClick={()=>setHighlightsOnly(h=>!h)} className={highlightsOnly?'active':''}><Zap size={15}/><span>Highlights</span></button>
          <button onClick={()=>setTacticsOverlayOpen(true)}><Crosshair size={15}/><span>Tactics</span></button>
          <button onClick={()=>setSubsOpen(s=>!s)}><Repeat size={15}/><span>Subs</span>{subsMade>0&&<em>{subsMade}</em>}</button>
          <button onClick={()=>setTeamTalkOpen(o=>!o)}><MessageSquare size={15}/><span>Talk</span></button>
          <button onClick={()=>setStatsTab('Match')}><BarChart3 size={15}/><span>Stats</span></button>
          <button onClick={toggleMatchFullscreen} className={matchFullscreen?'active':''}><Maximize2 size={15}/><span>{matchFullscreen?'Exit Match FS':'Match FS'}</span></button>
          <button onClick={toggleBrowserFullscreen}><Monitor size={15}/><span>{browserFullscreen?'Exit Full':'Full Screen'}</span></button>
          <button onClick={runQuickSim}><FastForward size={15}/><span>Quick Sim</span></button>
        </div>
      </section>

      <section className="match-info-drawer">
        <div className="drawer-tabs"><button className="active">LIVE</button><button>EVENTS</button><button>STATS</button><button>SQUAD</button></div>
        <div className="drawer-content">
          <div className="drawer-section"><div className="drawer-title"><b>LIVE MATCH</b><span>{match.finished?'FT':half}</span></div><div className="drawer-score"><span>{match.homeName}</span><strong>{match.score.home}</strong><i>–</i><strong>{match.score.away}</strong><span>{match.awayName}</span></div></div>
          <div className="drawer-section"><div className="drawer-title"><b>TEAM SHAPE</b><button onClick={()=>setTacticsOverlayOpen(true)}>Edit</button></div><div className="shape-row"><div><MiniFormation formationName={formation} side="home"/><small>{formation}</small></div><div className="shape-arrow">VS</div><div><MiniFormation formationName={match.oppFormationName} side="away"/><small>{match.oppFormationName}</small></div></div></div>
          <div className="drawer-section"><div className="drawer-title"><b>LIVE STATS</b><button onClick={()=>setStatsTab('Match')}>Full</button></div><StatRow label="Possession" home={possessionHome} away={100-possessionHome} format={v=>`${v}%`}/><StatRow label="Shots" home={homeStats.shots} away={awayStats.shots}/><StatRow label="xG" home={(homeStats.xG||0).toFixed(2)} away={(awayStats.xG||0).toFixed(2)}/><StatRow label="Pass Accuracy" home={passCompHome} away={passCompAway} format={v=>`${v}%`}/></div>
          <div className="drawer-section"><div className="drawer-title"><b>TACTICAL STATE</b></div><div className="tactical-chips"><span>{teamInstructions.mentality}</span><span>{formation}</span><span>Press {Math.round(pressing.intensity)}%</span><span>Tempo {Math.round(teamInstructions.tempo)}</span></div></div>
          <div className="drawer-section selected-drawer"><div className="drawer-title"><b>PLAYER PERFORMANCE</b></div>{selected?<><div className="selected-line"><b>{selected.name}</b><strong>{matchRating(selected)}</strong></div><div className="mini-metrics"><span>Touches <b>{selected.touches||0}</b></span><span>Goals <b>{selected.goals||0}</b></span><span>Assists <b>{selected.assists||0}</b></span><span>Distance <b>{(selected.distanceKm||0).toFixed(1)} km</b></span></div></>:<p className="drawer-muted">Select a player on the pitch.</p>}</div>
        </div>
      </section>
    </main>
  </div>;

}
