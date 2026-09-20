import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAIManagers } from './AIManagersContext.jsx';
import { useManagerData } from './ManagerContext.jsx';
import { useTransfersData } from './TransfersContext.jsx';
import { useWorldData } from './WorldContext.jsx';
import { createSeededRng, pick, shuffle } from '../engine/seededRng.js';
import { DEFAULT_CAREER_SEED, getDaySeed, normalizeCareerSeed } from '../engine/simulationSeeds.js';

const SimCtx = createContext(null);

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d) {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function formatTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ROUTINE_EVENTS = [
  { subject: 'Training Report', preview: 'First-team training completed — fitness levels trending upward.', tag: 'Staff', kind: 'staff', sender: 'Coaching Staff' },
  { subject: 'Medical Update', preview: 'No new injury concerns from today\u2019s session.', tag: 'Medical', kind: 'medical', sender: 'Club Doctor' },
  { subject: 'Scouting Update', preview: 'A scout assignment has progressed — check Scouting for details.', tag: 'Scouting', kind: 'scouting', sender: 'Chief Scout' },
  { subject: 'Board Note', preview: 'The board is satisfied with recent results and financial progress.', tag: 'Board', kind: 'board', sender: 'Board' },
];
const OTHER_RESULTS_HEADLINES = [
  'Rivals share the points in a tight encounter',
  'Surprise result shakes up the top of the table',
  'Late goal settles an entertaining fixture elsewhere',
];

export function SimulationProvider({ children, onGoToMatch }) {
  const ai = useAIManagers();
  const transfers = useTransfersData();
  const world = useWorldData();
  const manager = useManagerData();
  const careerSeed = normalizeCareerSeed(manager.profile?.careerSeed || DEFAULT_CAREER_SEED);
  const [now, setNow] = useState(() => { const d = new Date(2025, 8, 13, 15, 42); return d; }); // Sat 13 Sep 2025, arbitrary start
  const [daysUntilMatch, setDaysUntilMatch] = useState(1);
  const [phase, setPhase] = useState('upcoming'); // upcoming | matchday | finished
  const [liveMatch, setLiveMatch] = useState(null); // { inProgress, minute, second, homeScore, awayScore, opponent }
  const [lastSavedAt, setLastSavedAt] = useState(() => formatTime(new Date(2025, 8, 13, 15, 42)));
  const [processLog, setProcessLog] = useState([]);
  const [worldPulse, setWorldPulse] = useState([]);
  const [simWindowOpen, setSimWindowOpen] = useState(false);
  const openSimWindow = useCallback(() => setSimWindowOpen(true), []);
  const closeSimWindow = useCallback(() => setSimWindowOpen(false), []);
  const [matchLocked, setMatchLocked] = useState(false);
  const lockForMatch = useCallback(() => setMatchLocked(true), []);
  const unlockAfterMatch = useCallback(() => setMatchLocked(false), []);

  const advanceClockOneDay = useCallback(() => {
    setNow(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); nd.setHours(9, 0); return nd; });
  }, []);

  // "Background" world processing for a routine day: generates a couple of
  // plausible inbox items / news so the world feels alive even when nothing
  // match-related is happening, per the Continue -> process events -> stop
  // cycle.
  const processRoutineDay = useCallback((addMessage, addNews) => {
    const daySeed = getDaySeed(careerSeed, Math.max(0, Math.floor((now.getTime() - new Date(2025, 8, 13).getTime()) / 86400000) + 1));
    const rng = createSeededRng(daySeed);
    const picks = shuffle(rng, ROUTINE_EVENTS).slice(0, 1 + Math.floor(rng() * 2));
    picks.forEach(p => addMessage(p));
    if (rng() > 0.5) {
      addNews({ category: 'Football News', bucket: 'Football News', crest: 'Fans', headline: pick(rng, OTHER_RESULTS_HEADLINES), body: 'Elsewhere in the division, results continue to shape the table.' });
    }
    setProcessLog(picks.map(p => p.subject));
  }, [careerSeed, now]);

  // The Continue button's core behaviour: if today is match day, hand off
  // to the real Match Engine (Live) instead of skipping time; otherwise
  // process one routine day in the background.
  const continueGame = useCallback(({ addMessage, addNews, simulateMatchday }) => {
    if (phase === 'matchday' && !liveMatch) {
      onGoToMatch?.();
      return;
    }
    advanceClockOneDay();
    const dayIndex = Math.floor((now.getTime() - new Date(2025, 8, 13).getTime()) / 86400000) + 1;
    ai.simulateDay({ dayIndex });
    const worldEvents=world.simulateWorldDayStep(dayIndex) || [];
    if(worldEvents.length){ setWorldPulse(prev => [...worldEvents.map(e=>({id:`${dayIndex}-${e.player}-${e.type}`,text:e.text,date:formatDate(new Date(now.getTime()+86400000))})), ...prev].slice(0,12)); }
    // #12 World simulation: rival clubs and the market continue moving while
    // the manager is away from those screens. Keep it deterministic enough to
    // feel like a world, but sparse enough that news remains meaningful.
    let pulse = [];
    if (dayIndex % 2 === 0) {
      const moved = transfers.simulateAITransferActivity();
      if (moved) pulse.push(`${moved.name}: ${moved.from} → ${moved.to}`);
    }
    if (dayIndex % 3 === 0) {
      const managers = ai.managers || [];
      const m = managers[dayIndex % Math.max(1, managers.length)];
      if (m) pulse.push(`${m.club}: ${m.name} reviews the squad and tactical plan`);
    }
    if (pulse.length) setWorldPulse(prev => [...pulse.map(text => ({ id: `${dayIndex}-${text}`, text, date: formatDate(new Date(now.getTime()+86400000)) })), ...prev].slice(0, 12));
    setLastSavedAt(formatTime(new Date()));
    processRoutineDay(addMessage, addNews);
    if (phase === 'finished') {
      const dayRng = createSeededRng(getDaySeed(careerSeed, dayIndex));
      setPhase('upcoming');
      setDaysUntilMatch(3 + Math.floor(dayRng() * 3));
      return;
    }
    setDaysUntilMatch(d => {
      const nd = d - 1;
      if (nd <= 0) { setPhase('matchday'); return 0; }
      return nd;
    });
  }, [phase, liveMatch, advanceClockOneDay, processRoutineDay, onGoToMatch, ai, world, now, careerSeed]);

  // Called by the Match screen when a match starts/ticks/finishes.
  const reportLiveMatch = useCallback((status) => {
    setLiveMatch(status && status.inProgress ? status : null);
    if (status && status.finished) {
      setPhase('finished');
      setLiveMatch(null);
      setLastSavedAt(formatTime(new Date()));
    }
  }, []);

  const nextLabel = phase === 'matchday' ? 'Kick Off' : phase === 'finished' ? 'Training' : 'Training';

  const gameStatus = liveMatch ? { label: 'Match In Progress', color: '#ff5d5d', pulse: true }
    : phase === 'matchday' ? { label: 'Match Day', color: '#3ddc84' }
    : phase === 'finished' ? { label: 'Match Finished', color: '#3ddc84' }
    : { label: 'Training', color: '#4d9dff' };

  const value = {
    now, dateLabel: formatDate(now), timeLabel: formatTime(now), lastSavedAt,
    phase, daysUntilMatch, liveMatch, reportLiveMatch, gameStatus, nextLabel,
    continueGame, processLog, worldPulse,
    simWindowOpen, openSimWindow, closeSimWindow,
    matchLocked, lockForMatch, unlockAfterMatch,
    advanceClockOneDay, setDaysUntilMatch, setPhase, setLastSavedAt,
    aiManagers: ai.managers,
    getSnapshot: () => ({ now: now.toISOString(), daysUntilMatch, phase, lastSavedAt, careerSeed }),
    restoreSnapshot: (s) => {
      if (!s) return;
      if (s.now) setNow(new Date(s.now));
      if (s.daysUntilMatch !== undefined) setDaysUntilMatch(s.daysUntilMatch);
      if (s.phase) setPhase(s.phase);
      if (s.lastSavedAt) setLastSavedAt(s.lastSavedAt);
    },
  };

  return <SimCtx.Provider value={value}>{children}</SimCtx.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimCtx);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}
