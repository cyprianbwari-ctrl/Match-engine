import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const [now, setNow] = useState(() => { const d = new Date(2025, 8, 13, 15, 42); return d; }); // Sat 13 Sep 2025, arbitrary start
  const [daysUntilMatch, setDaysUntilMatch] = useState(1);
  const [phase, setPhase] = useState('upcoming'); // upcoming | matchday | finished
  const [liveMatch, setLiveMatch] = useState(null); // { inProgress, minute, second, homeScore, awayScore, opponent }
  const [lastSavedAt, setLastSavedAt] = useState(() => formatTime(new Date(2025, 8, 13, 15, 42)));
  const [processLog, setProcessLog] = useState([]);

  const advanceClockOneDay = useCallback(() => {
    setNow(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); nd.setHours(9, 0); return nd; });
  }, []);

  // "Background" world processing for a routine day: generates a couple of
  // plausible inbox items / news so the world feels alive even when nothing
  // match-related is happening, per the Continue -> process events -> stop
  // cycle.
  const processRoutineDay = useCallback((addMessage, addNews) => {
    const picks = [...ROUTINE_EVENTS].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
    picks.forEach(p => addMessage(p));
    if (Math.random() > 0.5) {
      addNews({ category: 'Football News', bucket: 'Football News', crest: 'Fans', headline: OTHER_RESULTS_HEADLINES[Math.floor(Math.random() * OTHER_RESULTS_HEADLINES.length)], body: 'Elsewhere in the division, results continue to shape the table.' });
    }
    setProcessLog(picks.map(p => p.subject));
  }, []);

  // The Continue button's core behaviour: if today is match day, hand off
  // to the real Match Engine (Live) instead of skipping time; otherwise
  // process one routine day in the background.
  const continueGame = useCallback(({ addMessage, addNews, simulateMatchday }) => {
    if (phase === 'matchday' && !liveMatch) {
      onGoToMatch?.();
      return;
    }
    advanceClockOneDay();
    setLastSavedAt(formatTime(new Date()));
    processRoutineDay(addMessage, addNews);
    if (phase === 'finished') {
      setPhase('upcoming');
      setDaysUntilMatch(3 + Math.floor(Math.random() * 3));
      return;
    }
    setDaysUntilMatch(d => {
      const nd = d - 1;
      if (nd <= 0) { setPhase('matchday'); return 0; }
      return nd;
    });
  }, [phase, liveMatch, advanceClockOneDay, processRoutineDay, onGoToMatch]);

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
    continueGame, processLog,
  };

  return <SimCtx.Provider value={value}>{children}</SimCtx.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimCtx);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}
