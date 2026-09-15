import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ClubStateCtx = createContext(null);

export function ClubStateProvider({ children }) {
  const [boardConfidence, setBoardConfidence] = useState(72);
  const [clubReputation, setClubReputation] = useState(84); // slow-moving, world-class baseline for Man Utd
  const [seasonExpectation] = useState({ label: 'Top 4 finish & a domestic cup run', minPosition: 4 });
  const [clubHistory, setClubHistory] = useState([
    { date: 'Season Start', event: 'Season Underway', detail: 'Board expects a top-4 finish and progress in the cups.' },
  ]);

  const adjustBoardConfidence = useCallback((delta, reason) => {
    setBoardConfidence(c => {
      const next = Math.max(0, Math.min(100, Math.round(c + delta)));
      if (Math.abs(delta) >= 4) setClubHistory(h => [...h, { date: 'Recently', event: reason, detail: `Board confidence now ${next}%` }].slice(-40));
      return next;
    });
  }, []);

  const adjustClubReputation = useCallback((delta, reason) => {
    setClubReputation(r => Math.max(0, Math.min(100, Math.round((r + delta) * 10) / 10)));
    if (Math.abs(delta) >= 1) setClubHistory(h => [...h, { date: 'Recently', event: reason, detail: 'Club reputation shift' }].slice(-40));
  }, []);

  const confidenceTier = boardConfidence >= 80 ? 'Excellent' : boardConfidence >= 60 ? 'Good' : boardConfidence >= 40 ? 'Concerned' : boardConfidence >= 20 ? 'Under Pressure' : 'Crisis';

  const value = useMemo(() => ({
    boardConfidence, confidenceTier, clubReputation, seasonExpectation, clubHistory,
    adjustBoardConfidence, adjustClubReputation,
    getSnapshot: () => ({ boardConfidence, clubReputation, clubHistory }),
    restoreSnapshot: (s) => {
      if (!s) return;
      if (s.boardConfidence !== undefined) setBoardConfidence(s.boardConfidence);
      if (s.clubReputation !== undefined) setClubReputation(s.clubReputation);
      if (s.clubHistory) setClubHistory(s.clubHistory);
    },
  }), [boardConfidence, confidenceTier, clubReputation, seasonExpectation, clubHistory, adjustBoardConfidence, adjustClubReputation]);

  return <ClubStateCtx.Provider value={value}>{children}</ClubStateCtx.Provider>;
}

export function useClubState() {
  const ctx = useContext(ClubStateCtx);
  if (!ctx) throw new Error('useClubState must be used within a ClubStateProvider');
  return ctx;
}
