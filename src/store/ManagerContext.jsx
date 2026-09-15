import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ManagerCtx = createContext(null);

export function ManagerProvider({ children }) {
  const [profile] = useState({
    name: 'Cyprian', nationality: '🏴', dob: '14 Mar 1988',
    coachingStyle: 'Possession-Based', tacticalStyle: 'Attacking Full-Backs',
    attributes: { attacking: 68, defending: 62, tactical: 74, manManagement: 71, fitness: 65, youthDevelopment: 58 },
    experience: 3, currentClub: 'Manchester United',
    previousClubs: [{ club: 'Sporting CP', period: '2023-2025', role: 'Manager', result: 'League Runner-Up' }],
    achievements: [],
  });
  const [reputation, setReputation] = useState(52);
  const [careerHistory, setCareerHistory] = useState([
    { date: 'Season Start', event: 'Appointed Manager', club: 'Manchester United' },
  ]);

  const adjustReputation = useCallback((delta, reason) => {
    setReputation(r => Math.max(0, Math.min(100, Math.round(r + delta))));
    if (Math.abs(delta) >= 3) setCareerHistory(h => [...h, { date: 'Recently', event: reason, club: 'Manchester United' }].slice(-30));
  }, []);

  const reputationTier = reputation >= 80 ? 'World Renowned' : reputation >= 60 ? 'Highly Regarded' : reputation >= 40 ? 'Respected' : reputation >= 20 ? 'Building a Reputation' : 'Unproven';

  const value = useMemo(() => ({
    profile, reputation, reputationTier, careerHistory, adjustReputation,
    getSnapshot: () => ({ reputation, careerHistory }),
    restoreSnapshot: (s) => { if (!s) return; if (s.reputation !== undefined) setReputation(s.reputation); if (s.careerHistory) setCareerHistory(s.careerHistory); },
  }), [profile, reputation, reputationTier, careerHistory, adjustReputation]);

  return <ManagerCtx.Provider value={value}>{children}</ManagerCtx.Provider>;
}

export function useManagerData() {
  const ctx = useContext(ManagerCtx);
  if (!ctx) throw new Error('useManagerData must be used within a ManagerProvider');
  return ctx;
}
