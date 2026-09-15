import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { players as roster } from '../data/roster.js';
import { useStaffData } from './StaffContext.jsx';

const PlayerStateCtx = createContext(null);

const INJURY_TYPES = [
  { type: 'Hamstring Strain', area: 'Hamstring', severity: 'Minor', days: [7, 14] },
  { type: 'Ankle Sprain', area: 'Ankle', severity: 'Minor', days: [10, 18] },
  { type: 'Knock', area: 'General', severity: 'Knock', days: [2, 5] },
  { type: 'Groin Strain', area: 'Groin', severity: 'Moderate', days: [21, 28] },
  { type: 'Calf Strain', area: 'Calf', severity: 'Minor', days: [10, 16] },
  { type: 'Knee Ligament Damage', area: 'Knee', severity: 'Severe', days: [56, 84] },
  { type: 'Shoulder Injury', area: 'Shoulder', severity: 'Moderate', days: [21, 35] },
  { type: 'Concussion', area: 'Head', severity: 'Moderate', days: [10, 14] },
];

function seededRand(seed) {
  let s = Math.abs(Number(seed) || 1) % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  next(); next();
  return next;
}

const PERSONALITY_TRAITS = ['professionalism', 'ambition', 'loyalty', 'determination', 'pressureHandling', 'leadership', 'adaptability', 'temperament'];
const AGENT_SURNAMES = ['Mendes', 'Raiola', 'Pimenta', 'Barnett', 'Levy', 'Elmi', 'Volpi', 'Struth', 'Konate', 'Ferraz'];

function generatePersonality(id) {
  const rand = seededRand(id * 31 + 11);
  const out = {};
  PERSONALITY_TRAITS.forEach((t, i) => { out[t] = Math.round(35 + seededRand(id * 31 + 11 + i)() * 60); });
  return out;
}
function generateAgent(id, name) {
  const rand = seededRand(id * 53 + 7);
  return `${AGENT_SURNAMES[Math.floor(rand() * AGENT_SURNAMES.length)]} Sports Management`;
}

function emptySeasonStats() {
  return { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, shots: 0, tackles: 0, passesCompleted: 0, passesAttempted: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: null, ratingSum: 0 };
}

function defaultLiveState(p) {
  return {
    currentAbility: p.ovr,
    form: p.form ? [...p.form] : [7.0, 7.0, 7.0, 7.0],
    morale: p.morale || 'Good',
    fitness: p.fit ?? 90,
    sharpness: 80,
    fatigue: 10,
    happiness: 75,
    developmentTrend: 'Stable',
    managerRelationship: 70,
    injury: null,
    suspension: null,
    relationships: { manager: 70, teammates: 72, club: 65, agent: 60 },
    abilityHistory: [{ date: 'Season Start', ca: p.ovr }],
    trainingProgress: 40,
    appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0,
    yellowCards: 0, redCards: 0, avgRating: null,
    seasonStats: emptySeasonStats(),
    careerStats: emptySeasonStats(),
    personality: generatePersonality(p.id),
    agent: generateAgent(p.id, p.name),
    contractHistory: [{ date: 'Season Start', event: 'Contract on file', detail: `${p.wage || ''} · until ${p.contract || 'TBC'}` }],
  };
}

export function PlayerStateProvider({ children }) {
  const { staffList } = useStaffData();
  // Real staff quality — not decorative. A better coaching setup speeds up
  // development; better medical staff speeds up recovery. Both read from
  // whoever the manager has actually hired and assigned.
  const coachingQuality = useMemo(() => {
    const coaches = staffList.filter(s => s.dept === 'Coaching');
    if (!coaches.length) return 3;
    return coaches.reduce((a, s) => a + (s.rating || 3), 0) / coaches.length;
  }, [staffList]);
  const medicalQuality = useMemo(() => {
    const medics = staffList.filter(s => s.dept === 'Medical');
    if (!medics.length) return 3;
    return medics.reduce((a, s) => a + (s.rating || 3), 0) / medics.length;
  }, [staffList]);

  const [liveStates, setLiveStates] = useState(() => {
    const initial = {};
    roster.forEach(p => { initial[p.id] = defaultLiveState(p); });
    return initial;
  });
  const [awardsHistory, setAwardsHistory] = useState([]);

  const recordPlayerOfMonthAward = useCallback((monthLabel) => {
    // Compute the winner directly from current state rather than inside a
    // setState updater callback — relying on that updater running
    // synchronously before the next line executes is not guaranteed, and
    // silently left the award out of the merged history even though the
    // news item (which used the same pattern) happened to still fire.
    let winner = null;
    Object.entries(liveStates).forEach(([id, live]) => {
      const stats = live.seasonStats;
      if (!stats || stats.apps < 2 || !stats.avgRating) return;
      if (!winner || stats.avgRating > winner.avgRating) {
        const rosterPlayer = roster.find(p => p.id === Number(id));
        if (rosterPlayer) winner = { id: Number(id), name: rosterPlayer.name, avgRating: stats.avgRating };
      }
    });
    if (winner) {
      setLiveStates(ls => ({ ...ls, [winner.id]: { ...ls[winner.id], happiness: Math.min(100, ls[winner.id].happiness + 8) } }));
      setAwardsHistory(h => [{ month: monthLabel, award: 'Player of the Month', winner: winner.name, rating: winner.avgRating }, ...h].slice(-24));
    }
    return winner;
  }, [liveStates]);

  const getLive = useCallback((id) => liveStates[id] || null, [liveStates]);

  // The single read-path every screen should use: static identity fields
  // (name, position, contract, wage...) from roster.js, live fields
  // (fitness, form, morale, injury...) from here. Live values win where
  // both exist.
  const mergePlayer = useCallback((rosterPlayer) => {
    const live = liveStates[rosterPlayer.id];
    if (!live) return rosterPlayer;
    const isInjured = !!live.injury;
    const isSuspended = !!live.suspension && live.suspension.matchesRemaining > 0;
    return {
      ...rosterPlayer,
      ovr: Math.round(live.currentAbility),
      fit: Math.round(live.fitness),
      form: live.form,
      morale: live.morale,
      rate: live.avgRating ?? rosterPlayer.rate,
      injury: live.injury,
      suspension: live.suspension,
      sharpness: live.sharpness,
      fatigue: live.fatigue,
      happiness: live.happiness,
      developmentTrend: live.developmentTrend,
      relationships: live.relationships,
      seasonStats: live.seasonStats,
      careerStats: live.careerStats,
      personality: live.personality,
      agent: live.agent,
      contractHistory: live.contractHistory,
      abilityHistory: live.abilityHistory,
      isAvailable: !isInjured && !isSuspended,
      availability: isInjured ? 'Injured' : isSuspended ? 'Suspended' : (rosterPlayer.availability || 'Available'),
    };
  }, [liveStates]);

  // A renewal offer either lands or doesn't, based on how happy the player
  // already is and how the new wage compares to their current one — not a
  // guaranteed yes.
  const offerRenewal = useCallback((id, newWageStr, newContractYear, dateLabel) => {
    let result = { accepted: false, reason: '' };
    setLiveStates(ls => {
      const live = ls[id];
      const rosterPlayer = roster.find(p => p.id === id);
      if (!live || !rosterPlayer) return ls;
      const currentWage = Number(String(rosterPlayer.wage).replace(/[^0-9]/g, '')) * (String(rosterPlayer.wage).includes('k') ? 1000 : 1);
      const newWage = Number(String(newWageStr).replace(/[^0-9]/g, '')) * (String(newWageStr).includes('k') ? 1000 : 1);
      const raisePct = ((newWage - currentWage) / currentWage) * 100;
      const chance = Math.min(95, Math.max(5, live.happiness * 0.5 + raisePct * 1.5));
      const accepted = Math.random() * 100 < chance;
      result = accepted
        ? { accepted: true, reason: `${rosterPlayer.name} agrees to new terms.` }
        : { accepted: false, reason: raisePct < 5 ? `${rosterPlayer.name}'s camp feels the offer undervalues him.` : `${rosterPlayer.name} wants more time to consider his future.` };
      if (!accepted) return ls;
      return {
        ...ls,
        [id]: {
          ...live,
          happiness: Math.min(100, live.happiness + 10),
          contractHistory: [...live.contractHistory, { date: dateLabel, event: 'Contract Renewed', detail: `${newWageStr} · until ${newContractYear}` }],
        },
      };
    });
    return result;
  }, []);

  const mergedRoster = useMemo(() => roster.map(mergePlayer), [mergePlayer]);

  const updateLive = useCallback((id, patch) => {
    setLiveStates(ls => ({ ...ls, [id]: { ...(ls[id] || defaultLiveState(roster.find(p => p.id === id) || {})), ...(typeof patch === 'function' ? patch(ls[id]) : patch) } }));
  }, []);

  // Called once per player at full-time for whoever featured in the match.
  // This is what makes fitness/form/fatigue actually move instead of
  // sitting at their seed values forever, and now also feeds real season/
  // career statistics and card-based suspensions from actual match data.
  const recordMatchPerformance = useCallback((id, { minutesPlayed = 90, rating = 6.8, started = true, goals = 0, assists = 0, shots = 0, tackles = 0, passesCompleted = 0, passesAttempted = 0, yellowCards = 0, redCard = false, cleanSheet = false }) => {
    updateLive(id, (prev) => {
      const base = prev || defaultLiveState(roster.find(p => p.id === id) || {});
      const fitnessCost = Math.round((minutesPlayed / 90) * (12 + Math.random() * 8));
      const fatigueGain = Math.round((minutesPlayed / 90) * (15 + Math.random() * 10));
      const newForm = [...(base.form || []), rating].slice(-6);
      const avg = newForm.reduce((a, b) => a + b, 0) / newForm.length;
      const moraleFromForm = avg >= 7.3 ? 'Very Good' : avg >= 6.8 ? 'Good' : avg >= 6.2 ? 'Okay' : 'Unhappy';

      // Card accumulation → real suspensions. Premier League-style: 5
      // yellows in a season earns a 1-match ban; a straight or second
      // yellow red card earns a short ban of its own.
      const seasonYellows = (base.seasonStats?.yellowCards || 0) + yellowCards;
      let suspension = base.suspension;
      if (redCard && !suspension) {
        suspension = { matchesRemaining: 1 + Math.floor(Math.random() * 2), reason: 'Red Card', competition: 'Premier League' };
      } else if (seasonYellows > 0 && seasonYellows % 5 === 0 && !suspension) {
        suspension = { matchesRemaining: 1, reason: 'Accumulated Bookings', competition: 'Premier League' };
      }

      const statDelta = { apps: 1, starts: started ? 1 : 0, minutes: minutesPlayed, goals, assists, shots, tackles, passesCompleted, passesAttempted, cleanSheets: cleanSheet ? 1 : 0, yellowCards, redCards: redCard ? 1 : 0 };
      const mergeStats = (stats) => {
        const s = { ...stats };
        Object.entries(statDelta).forEach(([k, v]) => { s[k] = (s[k] || 0) + v; });
        s.ratingSum = (s.ratingSum || 0) + rating;
        s.avgRating = Math.round((s.ratingSum / s.apps) * 10) / 10;
        return s;
      };

      return {
        ...base,
        fitness: Math.max(35, base.fitness - fitnessCost),
        fatigue: Math.min(100, base.fatigue + fatigueGain),
        sharpness: Math.min(100, base.sharpness + (minutesPlayed >= 60 ? 6 : 3)),
        form: newForm,
        morale: moraleFromForm,
        happiness: Math.max(20, Math.min(100, base.happiness + (started ? 2 : -3))),
        relationships: {
          ...base.relationships,
          // Playing well and getting minutes is what actually keeps a
          // manager relationship healthy — not a flat, unmoving number.
          manager: Math.max(10, Math.min(100, (base.relationships?.manager ?? 70) + (started ? (rating >= 7.2 ? 3 : rating < 6.2 ? -2 : 1) : -2))),
          teammates: Math.max(10, Math.min(100, (base.relationships?.teammates ?? 72) + (rating >= 7.5 ? 1 : redCard ? -3 : 0))),
          club: Math.max(10, Math.min(100, (base.relationships?.club ?? 65) + 0.3)),
          agent: base.relationships?.agent ?? 60,
        },
        appearances: (base.appearances || 0) + 1,
        starts: (base.starts || 0) + (started ? 1 : 0),
        minutes: (base.minutes || 0) + minutesPlayed,
        avgRating: Math.round(avg * 10) / 10,
        suspension,
        seasonStats: mergeStats(base.seasonStats || emptySeasonStats()),
        careerStats: mergeStats(base.careerStats || emptySeasonStats()),
      };
    });
  }, [updateLive]);

  // Every suspended player serves one match toward their ban whenever the
  // team actually plays, whether or not they'd have started.
  const tickSuspensions = useCallback(() => {
    setLiveStates(ls => {
      const next = { ...ls };
      Object.entries(next).forEach(([id, live]) => {
        if (live.suspension && live.suspension.matchesRemaining > 0) {
          const remaining = live.suspension.matchesRemaining - 1;
          next[id] = { ...live, suspension: remaining > 0 ? { ...live.suspension, matchesRemaining: remaining } : null };
        }
      });
      return next;
    });
  }, []);

  // A real injury record — not a flag. Severity determines the actual
  // recovery window, timed against the simulation's own calendar.
  const applyInjury = useCallback((id, currentDateLabel, forcedSeverity = null) => {
    const pick = INJURY_TYPES[Math.floor(seededRand(id * 7 + Date.now() % 1000)() * INJURY_TYPES.length)];
    const template = forcedSeverity ? INJURY_TYPES.find(t => t.severity === forcedSeverity) || pick : pick;
    const days = template.days[0] + Math.round(Math.random() * (template.days[1] - template.days[0]));
    const injured = new Date(currentDateLabel);
    const expected = new Date(injured); expected.setDate(expected.getDate() + days);
    updateLive(id, (prev) => ({
      ...(prev || defaultLiveState(roster.find(p => p.id === id) || {})),
      injury: {
        type: template.type, area: template.area, severity: template.severity,
        dateInjured: injured.toDateString(), expectedReturn: expected.toDateString(),
        totalDays: days, daysRemaining: days, recurrenceRisk: template.severity === 'Severe' ? 'High' : template.severity === 'Moderate' ? 'Medium' : 'Low',
      },
    }));
    return { type: template.type, days, expectedReturn: expected.toDateString() };
  }, [updateLive]);

  // Small, independent daily injury risk (training knocks etc.) — separate
  // from match-caused injuries, and rare on purpose.
  const rollDailyInjuryRisk = useCallback((currentDateLabel) => {
    const fit = roster.filter(p => p.playTime !== 'Youth');
    const results = [];
    fit.forEach(p => {
      const live = liveStates[p.id];
      if (!live || live.injury) return;
      const risk = live.fatigue > 75 ? 0.012 : 0.003;
      if (Math.random() < risk) {
        const info = applyInjury(p.id, currentDateLabel, 'Knock');
        results.push({ id: p.id, name: p.name, ...info });
      }
    });
    return results;
  }, [liveStates, applyInjury]);

  // Called as the simulation clock advances a day: recovery ticks down,
  // fitness/fatigue regenerate toward normal, injuries clear on schedule.
  // Medical staff quality genuinely speeds this up — a 4.5-star medical
  // department heals players meaningfully faster than a 2-star one.
  const advanceDay = useCallback((currentDateLabel) => {
    const medicalFactor = 0.7 + (medicalQuality / 5) * 0.6; // ~0.9x to ~1.3x recovery speed
    setLiveStates(ls => {
      const next = {};
      Object.entries(ls).forEach(([id, live]) => {
        let injury = live.injury;
        if (injury) {
          const daysRemaining = Math.max(0, injury.daysRemaining - medicalFactor);
          const recoveryProgress = Math.round(((injury.totalDays - daysRemaining) / injury.totalDays) * 100);
          injury = daysRemaining <= 0 ? null : { ...injury, daysRemaining, recoveryProgress };
        }
        next[id] = {
          ...live,
          injury,
          fitness: Math.min(99, live.fitness + (injury ? 1 : 3) * medicalFactor),
          fatigue: Math.max(5, live.fatigue - (injury ? 2 : 5) * medicalFactor),
          sharpness: Math.max(20, live.sharpness - (injury ? 2 : 1)),
        };
      });
      return next;
    });
    return rollDailyInjuryRisk(currentDateLabel);
  }, [rollDailyInjuryRisk, medicalQuality]);

  // Monthly development tick — young players below potential nudge toward
  // it, players past their peak nudge gently down. Coaching quality scales
  // how fast development actually happens, both up and down — a poor
  // coaching setup blunts a young player's progress and does nothing to
  // slow an older player's decline.
  const applyMonthlyDevelopment = useCallback((monthLabel) => {
    const coachFactor = 0.6 + (coachingQuality / 5) * 0.8; // ~0.7x to ~1.4x development speed
    setLiveStates(ls => {
      const next = { ...ls };
      roster.forEach(p => {
        const live = next[p.id];
        if (!live) return;
        const potential = Math.min(96, p.ovr + (p.age < 24 ? 8 : p.age < 29 ? 2 : 0));
        let delta = 0;
        let trend = 'Stable';
        if (p.age <= 23 && live.currentAbility < potential) { delta = (0.3 + Math.random() * 0.4) * coachFactor; trend = 'Improving'; }
        else if (p.age >= 32) { delta = -(0.2 + Math.random() * 0.3); trend = 'Declining'; }
        else { delta = (Math.random() - 0.5) * 0.2; trend = Math.abs(delta) < 0.05 ? 'Stable' : delta > 0 ? 'Improving' : 'Declining'; }
        const newCA = Math.max(45, Math.min(96, live.currentAbility + delta));
        next[p.id] = {
          ...live,
          currentAbility: newCA,
          developmentTrend: trend,
          trainingProgress: Math.min(100, live.trainingProgress + 8 * coachFactor),
          abilityHistory: [...live.abilityHistory, { date: monthLabel, ca: Math.round(newCA) }].slice(-24),
        };
      });
      return next;
    });
  }, [coachingQuality]);

  const value = useMemo(() => ({
    liveStates, getLive, mergePlayer, mergedRoster,
    recordMatchPerformance, applyInjury, advanceDay, applyMonthlyDevelopment,
    tickSuspensions, offerRenewal, coachingQuality, medicalQuality,
    awardsHistory, recordPlayerOfMonthAward,
    getSnapshot: () => ({ liveStates, awardsHistory }),
    restoreSnapshot: (s) => { if (s?.liveStates) setLiveStates(s.liveStates); if (s?.awardsHistory) setAwardsHistory(s.awardsHistory); },
  }), [liveStates, getLive, mergePlayer, mergedRoster, recordMatchPerformance, applyInjury, advanceDay, applyMonthlyDevelopment, tickSuspensions, offerRenewal, coachingQuality, medicalQuality, awardsHistory, recordPlayerOfMonthAward]);

  return <PlayerStateCtx.Provider value={value}>{children}</PlayerStateCtx.Provider>;
}

export function usePlayerState() {
  const ctx = useContext(PlayerStateCtx);
  if (!ctx) throw new Error('usePlayerState must be used within a PlayerStateProvider');
  return ctx;
}
