import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useCompetitionData } from './CompetitionContext.jsx';
import { computeBoardExpectation } from '../engine/careerClub.js';

const ClubStateCtx = createContext(null);

export function ClubStateProvider({ children }) {
  const { league, divisionLevel } = useCompetitionData();
  const [boardConfidence, setBoardConfidence] = useState(72);
  const [clubReputation, setClubReputation] = useState(84); // slow-moving baseline, adjusted by results over time
  const [clubHistory, setClubHistory] = useState([
    { date: 'Season Start', event: 'Season Underway', detail: 'A new season begins.' },
  ]);

  // Live, division-aware target instead of a fixed "top-4 finish" assumption
  // that made no sense outside the top flight — recalculates as the table
  // (and the club's actual position in it) changes through the season.
  const seasonExpectation = useMemo(() => {
    const table = league?.table || [];
    const rank = table.findIndex(r => r.us) + 1;
    const { label, minPosition } = computeBoardExpectation(rank || 1, table.length || 20, divisionLevel);
    return { label, minPosition };
  }, [league, divisionLevel]);

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
