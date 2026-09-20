import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { normalizeCareerSeed } from '../engine/simulationSeeds.js';
import { ensureCareerSeed, setCareerSeed } from '../engine/careerSeedStore.js';
import { ACTIVE_LEAGUE_COUNTRIES, normalizeActiveLeagues, isValidActiveLeagueSelection } from '../engine/activeLeaguePolicy.js';

const ManagerCtx = createContext(null);

export function ManagerProvider({ children }) {
  const [profile, setProfile] = useState({
    careerSeed: ensureCareerSeed(), name: 'Cyprian', nationality: '🏴', dob: '14 Mar 1988',
    coachingStyle: 'Possession-Based', tacticalStyle: 'Attacking Full-Backs',
    attributes: { attacking: 68, defending: 62, tactical: 74, manManagement: 71, fitness: 65, youthDevelopment: 58 },
    experience: 3, currentClubId: null, currentClub: 'Current Club',
    previousClubs: [],
    achievements: [],
    // A new career must explicitly choose its five active leagues during onboarding.
    activeLeagues: [],
  });
  const [reputation, setReputation] = useState(52);
  const [careerHistory, setCareerHistory] = useState([]);


  const updateCareerSeed = useCallback((seed) => { const normalized = setCareerSeed(seed); setProfile(p => ({...p, careerSeed: normalized})); }, []);
  const updateProfile = useCallback((patch={}) => {
    setProfile(p => {
      const nextClubId = patch.currentClubId != null ? String(patch.currentClubId) : p.currentClubId;
      const nextClub = patch.currentClub || p.currentClub || 'Current Club';
      const isNewClubAssignment = patch.currentClubId != null && String(p.currentClubId ?? '') !== String(nextClubId);
      if (isNewClubAssignment || (patch.currentClubId != null && !p.currentClubId)) {
        setCareerHistory(h => h.length ? h : [{ date: 'Season Start', event: 'Appointed Manager', club: nextClub }]);
      }
      return {
        ...p,
        ...patch,
        currentClubId: nextClubId,
        currentClub: nextClub,
      };
    });
  }, []);
  const startNewCareer = useCallback((patch={}) => {
    const clubId = patch.currentClubId != null ? String(patch.currentClubId) : null;
    const clubName = patch.currentClub || 'Current Club';
    setProfile(p => ({ ...p, ...patch, currentClubId: clubId, currentClub: clubName, previousClubs: [], achievements: [] }));
    setCareerHistory([{ date: 'Season Start', event: 'Appointed Manager', club: clubName }]);
  }, []);
  const updateAttribute = useCallback((key,value) => setProfile(p => ({...p, attributes:{...p.attributes,[key]:Math.max(0,Math.min(100,Number(value)||0))}})), []);
  const setActiveLeagues = useCallback((leagues=[]) => {
    const next = [...new Set(leagues.map(String).filter(Boolean))];
    if (next.length !== 5) return false;
    setProfile(p => ({...p, activeLeagues: next}));
    return true;
  }, []);

  const adjustReputation = useCallback((delta, reason) => {
    setReputation(r => Math.max(0, Math.min(100, Math.round(r + delta))));
    if (Math.abs(delta) >= 3) setCareerHistory(h => [...h, { date: 'Recently', event: reason, club: profile.currentClub }].slice(-30));
  }, [profile.currentClub]);

  const reputationTier = reputation >= 80 ? 'World Renowned' : reputation >= 60 ? 'Highly Regarded' : reputation >= 40 ? 'Respected' : reputation >= 20 ? 'Building a Reputation' : 'Unproven';

  const value = useMemo(() => ({
    profile, reputation, reputationTier, careerHistory, updateProfile, startNewCareer, updateAttribute, setActiveLeagues, updateCareerSeed, adjustReputation, activeLeagueCountries: ACTIVE_LEAGUE_COUNTRIES, activeLeagueSelectionValid: isValidActiveLeagueSelection(profile.activeLeagues),
    getSnapshot: () => ({ reputation, careerHistory, profile: { ...profile, activeLeagues: [...(profile.activeLeagues || [])], attributes: { ...(profile.attributes || {}) }, previousClubs: [...(profile.previousClubs || [])], achievements: [...(profile.achievements || [])] } }),
    restoreSnapshot: (s) => { if (!s) return; if (s.reputation !== undefined) setReputation(s.reputation); if (s.careerHistory) setCareerHistory(s.careerHistory); if (s.profile) { const incoming = { ...s.profile, activeLeagues: normalizeActiveLeagues(s.profile.activeLeagues || []), attributes: { ...(s.profile.attributes || {}) }, previousClubs: [...(s.profile.previousClubs || [])], achievements: [...(s.profile.achievements || [])] }; if (incoming.careerSeed !== undefined) incoming.careerSeed = setCareerSeed(incoming.careerSeed); setProfile(p => ({...p, ...incoming})); } },
  }), [profile, reputation, reputationTier, careerHistory, adjustReputation, updateProfile, startNewCareer, updateAttribute, setActiveLeagues, updateCareerSeed]);

  return <ManagerCtx.Provider value={value}>{children}</ManagerCtx.Provider>;
}

export function useManagerData() {
  const ctx = useContext(ManagerCtx);
  if (!ctx) throw new Error('useManagerData must be used within a ManagerProvider');
  return ctx;
}
