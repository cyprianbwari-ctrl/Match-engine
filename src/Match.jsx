import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, FastForward, Rewind, Trophy, Radio, AlertTriangle,
  Crosshair, Gauge, ListVideo, Zap, Repeat, X
} from 'lucide-react';
import './match.css';
import { useTacticsData } from './store/TacticsContext.jsx';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useSimulation } from './store/SimulationContext.jsx';
import {
  buildXI, buildOpponentPool, initMatch, stepMatch, resolveDecision, simulateInstant, substitutePlayer,
} from './engine/matchSimulator.js';
import { FORMATIONS } from './tactics/formations.js';
import { players as roster } from './data/roster.js';

const MODES = ['Full Match', 'Highlights', 'Key Events', 'Instant Result'];
const SPEEDS = [1, 2, 4, 8];
const TICK_MS = 50;

function buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, homeName, league }) {
  const homePairs = slots.map((slot, i) => ({ slot, player: startXI.find(p => p.id === assignment[slot.id]) || startXI[i % startXI.length] }));
  const homeXI = buildXI(homePairs, 'home');

  const oppRow = league.table.find(r => !r.us) || { club: 'Opponent', pts: 20 };
  const oppSlots = FORMATIONS['4-3-3'];
  const oppPool = buildOpponentPool(60 + Math.min(30, oppRow.pts / 2), oppSlots, oppRow.club);
  const awayPairs = oppSlots.map((slot, i) => ({ slot, player: oppPool[i] }));
  const awayXI = buildXI(awayPairs, 'away');

  return initMatch({
    homeXI, awayXI, homeName, awayName: oppRow.club,
    homeTactics: { mentality: teamInstructions.mentality, tempo: teamInstructions.tempo, defensiveLine: teamInstructions.defensiveLine, pressing },
    awayTactics: { mentality: oppRow.pts >= 30 ? 'Positive' : 'Balanced', tempo: oppRow.pts >= 30 ? 62 : 56, defensiveLine: 55, pressing: { intensity: oppRow.pts >= 30 ? 66 : 58 } },
  });
}

function PitchDot({ p, isBall, side }) {
  return <div className={`md-dot ${side} ${isBall ? 'ball' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, transitionDuration: `${TICK_MS}ms` }}>
    {!isBall && <span>{p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>}
  </div>;
}

const EVENT_VISIBILITY = {
  'Full Match': () => true,
  'Highlights': (e) => e.type !== 'play',
  'Key Events': (e) => e.type === 'goal' || e.type === 'decision' || e.type === 'info',
  'Instant Result': (e) => e.type === 'goal' || e.type === 'info',
};

export default function MatchScreen({ setActive }) {
  const { slots, assignment, startXI, teamInstructions, pressing, tacticalDelegation } = useTacticsData();
  const { league, recordUserMatchResult } = useCompetitionData();
  const { reportLiveMatch } = useSimulation();

  const [match, setMatch] = useState(() => buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, homeName: 'Man Utd', league }));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [mode, setMode] = useState('Full Match');
  const [subsOpen, setSubsOpen] = useState(false);
  const [subOut, setSubOut] = useState(null);
  const [subsMade, setSubsMade] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running || match.finished || match.pendingDecision || mode === 'Instant Result') return;
    intervalRef.current = setInterval(() => {
      // The engine itself is fixed at 50 ms. Speed only changes how many
      // fixed simulation ticks are consumed per render pulse.
      setMatch(m => {
        let next = m;
        const ticks = Math.min(speed, 8);
        for (let i = 0; i < ticks; i++) {
          next = stepMatch({ ...next }, 7);
          if (next.finished || next.pendingDecision) break;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(intervalRef.current);
  }, [running, speed, match.finished, match.pendingDecision, mode]);

  const restart = () => { resultRecorded.current = false; setMatch(buildMatchState({ slots, assignment, startXI, teamInstructions, pressing, homeName: 'Man Utd', league })); };
  const bench = useMemo(() => roster.filter(p => !match.homeXI.some(h => h.id === p.id)), [match.homeXI]);

  const makeSub = (inPlayer) => {
    if (!subOut) return;
    setMatch(m => {
      const outPlayer = m.homeXI.find(p => p.id === subOut);
      const newXI = substitutePlayer(m.homeXI, subOut, inPlayer);
      const events = [{ minute: m.minute, second: m.second, text: `Substitution: ${inPlayer.name} replaces ${outPlayer?.name || 'a player'}.`, type: 'decision' }, ...m.events].slice(0, 60);
      return { ...m, homeXI: newXI, events };
    });
    setSubsMade(n => n + 1);
    setSubOut(null);
    setSubsOpen(false);
  };

  const runInstant = () => {
    setRunning(false);
    setMatch(m => simulateInstant({ ...m }));
  };

  const choose = (key) => setMatch(m => resolveDecision({ ...m }, key));

  // Automatic tactical delegation: resolve manager-AI prompts on its own —
  // the human is never blocked, matching the "Automatic" behaviour from
  // Tactics' Assistant Manager.
  useEffect(() => {
    if (match.pendingDecision && tacticalDelegation === 'Automatic') {
      const id = setTimeout(() => choose(match.pendingDecision.options[1].key), 900);
      return () => clearTimeout(id);
    }
  }, [match.pendingDecision, tacticalDelegation]);

  // Report live status up to the global game clock, so the header shows
  // "Match In Progress" / a View Match shortcut, and record the final
  // result into the persistent league table exactly once when it finishes.
  const resultRecorded = useRef(false);
  useEffect(() => {
    reportLiveMatch({
      inProgress: running && !match.finished,
      minute: match.minute, second: match.second,
      homeScore: match.score.home, awayScore: match.score.away,
      opponent: match.awayName, finished: match.finished,
    });
    if (match.finished && !resultRecorded.current) {
      resultRecorded.current = true;
      recordUserMatchResult(match.score.home, match.score.away);
    }
  }, [running, match.minute, match.second, match.finished, match.score.home, match.score.away]);

  // If the manager navigates away from a match that's still running (e.g.
  // to check Tactics mid-game), the header should still be able to say
  // "still going" rather than getting stuck — but the ticking itself only
  // runs while this screen is mounted, so on unmount we mark it paused
  // rather than silently "in progress" forever.
  useEffect(() => () => {
    if (!match.finished) reportLiveMatch({ inProgress: false, minute: match.minute, second: match.second, homeScore: match.score.home, awayScore: match.score.away, opponent: match.awayName, finished: false, awayFromScreen: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleEvents = useMemo(() => match.events.filter(EVENT_VISIBILITY[mode] || (() => true)), [match.events, mode]);

  const mm = String(match.minute).padStart(2, '0');
  const ss = String(match.second).padStart(2, '0');

  return <div className="match-page">
    <div className="md-header">
      <div className="md-score-block">
        <div className="md-team"><b>{match.homeName}</b></div>
        <div className="md-score">{match.score.home} - {match.score.away}</div>
        <div className="md-team"><b>{match.awayName}</b></div>
      </div>
      <div className="md-clock"><Radio size={14} color={running ? '#ff5d5d' : '#8f9abb'} /> {mm}:{ss}{match.finished && <span className="md-ft"> · FT</span>}</div>
    </div>

    <div className="md-controls">
      <button className="md-play" onClick={() => mode === 'Instant Result' ? runInstant() : setRunning(r => !r)} disabled={match.finished}>
        {mode === 'Instant Result' ? <><FastForward size={15} /> Run Instant Result</> : running ? <><Pause size={15} /> Pause</> : <><Play size={15} fill="currentColor" /> {match.minute === 0 && match.second === 0 ? 'Kick Off' : 'Resume'}</>}
      </button>
      <div className="md-speeds">{SPEEDS.map(s => <button key={s} className={speed === s ? 'active' : ''} onClick={() => setSpeed(s)}>{s}x</button>)}</div>
      <div className="md-modes">{MODES.map(m => <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{m}</button>)}</div>
      <button className="md-restart" onClick={restart}><Rewind size={14} /> New Match</button>
      <button className="md-subs-btn" onClick={() => setSubsOpen(s => !s)}><Repeat size={14} /> Substitutes {subsMade > 0 && <em>{subsMade}</em>}</button>
    </div>

    {subsOpen && <div className="md-subs-panel">
      <div className="md-subs-head">
        <b>Make a Substitution</b><span className="muted-sub">Available any time — pick a player to bring off, then who comes on.</span>
        <button className="md-close" onClick={() => { setSubsOpen(false); setSubOut(null); }}><X size={15} /></button>
      </div>
      <div className="md-subs-body">
        <div className="md-subs-col">
          <div className="panel-label">On the Pitch — select who comes off</div>
          {match.homeXI.map(p => <button key={p.id} className={`md-sub-row ${subOut === p.id ? 'active' : ''}`} onClick={() => setSubOut(p.id)}>
            <b>{p.name}</b><span>{p.role}</span>
          </button>)}
        </div>
        <div className="md-subs-col">
          <div className="panel-label">Bench — select who comes on</div>
          {!subOut && <p className="muted-sub">Pick an outgoing player first.</p>}
          {subOut && bench.map(p => <button key={p.id} className="md-sub-row" onClick={() => makeSub(p)}>
            <b>{p.name}</b><span>{p.displayPos} · OVR {p.ovr} · Fit {p.fit}%</span>
          </button>)}
        </div>
      </div>
    </div>}

    {match.pendingDecision && <div className="md-decision">
      <div className="md-decision-head"><AlertTriangle size={16} color="#ffb84d" /> Decision Required</div>
      <p>{match.pendingDecision.text}</p>
      {tacticalDelegation === 'Automatic'
        ? <p className="muted-sub">Assistant Manager is handling this automatically...</p>
        : <div className="md-decision-options">{match.pendingDecision.options.map(o => <button key={o.key} onClick={() => choose(o.key)}><b>{o.key}</b> {o.label}</button>)}</div>}
    </div>}

    <div className="md-body">
      <div className="md-pitch-wrap">
        <div className="md-pitch">
          <div className="md-pitch-mid" /><div className="md-pitch-box left" /><div className="md-pitch-box right" />
          {match.homeXI.map(p => <PitchDot key={p.id} p={p} side="home" />)}
          {match.awayXI.map(p => <PitchDot key={p.id} p={p} side="away" />)}
          <PitchDot p={{ x: match.ballX, y: match.ballY, name: 'ball' }} side="ball" isBall />
        </div>
        <div className="md-legend"><span className="dot home" /> {match.homeName} <span className="dot away" /> {match.awayName}</div>
      </div>

      <div className="md-text-feed">
        <div className="md-feed-head"><ListVideo size={15} /> Live Text — {mode}</div>
        <div className="md-feed-list">
          {visibleEvents.map((e, i) => <div className={`md-feed-row ${e.type}`} key={i}>
            <b>{String(e.minute).padStart(2, '0')}:{String(e.second).padStart(2, '0')}</b><span>{e.text}</span>
          </div>)}
        </div>
      </div>
    </div>

    <div className="md-footer">
      <button className="md-foot-btn" onClick={() => setActive('Tactics')}><Crosshair size={14} /> Adjust Tactics</button>
      <div className="md-tactic-summary"><Gauge size={14} /> {teamInstructions.mentality} · Pressing {pressing.intensity}% · Tempo {teamInstructions.tempo}%</div>
    </div>
  </div>;
}
