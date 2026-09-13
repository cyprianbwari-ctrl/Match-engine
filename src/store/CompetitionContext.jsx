import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as D from '../data/competitionData.js';
import { buildXI, buildOpponentPool, initMatch, simulateInstant } from '../engine/matchSimulator.js';
import { FORMATIONS } from '../tactics/formations.js';

const CompCtx = createContext(null);

const UPCOMING_OPPONENTS = ['Man City', 'Newcastle', 'West Ham', 'Wolves', 'Brighton', 'Fulham', 'Everton', 'Crystal Palace', 'Brentford', 'Nottingham Forest', 'Leeds United', 'Burnley', 'Sunderland', 'Aston Villa'];
let fixtureCursor = 0;

function recomputePositions(table) {
  return [...table].sort((a, b) => b.pts - a.pts || b.gd - a.gd).map((row, i) => ({ ...row, pos: i + 1 }));
}

function simulateGenericFixture(clubA, clubB) {
  const strengthA = 55 + Math.round(clubA.pts / 2);
  const strengthB = 55 + Math.round(clubB.pts / 2);
  const slots = FORMATIONS['4-3-3'];
  const poolA = buildOpponentPool(strengthA, slots, clubA.club);
  const poolB = buildOpponentPool(strengthB, slots, clubB.club);
  const homeXI = buildXI(slots.map((slot, i) => ({ slot, player: poolA[i] })), 'home');
  const awayXI = buildXI(slots.map((slot, i) => ({ slot, player: poolB[i] })), 'away');
  const result = simulateInstant(initMatch({
    homeXI, awayXI, homeName: clubA.club, awayName: clubB.club,
    homeTactics: { mentality: 'Balanced', tempo: 55, defensiveLine: 55, pressing: { intensity: 55 } },
    awayTactics: { mentality: 'Balanced', tempo: 55, defensiveLine: 55, pressing: { intensity: 55 } },
  }));
  return { homeGoals: result.score.home, awayGoals: result.score.away };
}

function applyResult(table, clubName, gf, ga) {
  return table.map(row => {
    if (row.club !== clubName) return row;
    const w = gf > ga ? 1 : 0, l = gf < ga ? 1 : 0, d = gf === ga ? 1 : 0;
    return { ...row, p: row.p + 1, w: row.w + w, d: row.d + d, l: row.l + l, gd: row.gd + (gf - ga), pts: row.pts + (w ? 3 : d ? 1 : 0) };
  });
}

// Every field the UI reads is derived here, once, from the same seed data —
// so Overview / League / Cups / Continental / History never disagree.
export function CompetitionProvider({ children }) {
  const [leagueTable, setLeagueTable] = useState(D.leagueTable);
  const [leagueFixtures, setLeagueFixtures] = useState(D.leagueFixtures);
  const [leagueResults, setLeagueResults] = useState(D.leagueResults);

  // Resolve today's fixture (and a handful of other Premier League fixtures)
  // using the real match engine's Instant Result logic, then update the
  // table. Used both when the user's match auto-resolves in the background
  // and to keep the rest of the league moving alongside them.
  const simulateMatchday = useCallback(() => {
    const fixture = leagueFixtures[0];
    if (!fixture) return null;
    const us = leagueTable.find(r => r.us);
    const oppName = fixture.home === 'Man Utd' ? fixture.away : fixture.home;
    const opp = leagueTable.find(r => r.club === oppName) || leagueTable.find(r => !r.us);
    const { homeGoals, awayGoals } = simulateGenericFixture(
      fixture.home === 'Man Utd' ? us : opp, fixture.away === 'Man Utd' ? us : opp,
    );
    let table = applyResult(leagueTable, fixture.home, homeGoals, awayGoals);
    table = applyResult(table, fixture.away, awayGoals, homeGoals);

    // A handful of other fixtures elsewhere in the division, so the table
    // keeps moving even when it isn't our matchday focus.
    const others = table.filter(r => r.club !== fixture.home && r.club !== fixture.away);
    for (let i = 0; i + 1 < others.length; i += 2) {
      const a = others[i], b = others[i + 1];
      const { homeGoals: hg, awayGoals: ag } = simulateGenericFixture(a, b);
      table = applyResult(table, a.club, hg, ag);
      table = applyResult(table, b.club, ag, hg);
    }
    table = recomputePositions(table);
    setLeagueTable(table);

    const score = `${homeGoals} - ${awayGoals}`;
    setLeagueResults(rs => [{ comp: 'Premier League', date: fixture.date === 'Today' ? 'Today' : fixture.date, home: fixture.home, away: fixture.away, score }, ...rs].slice(0, 10));

    const nextOpp = UPCOMING_OPPONENTS[fixtureCursor % UPCOMING_OPPONENTS.length];
    fixtureCursor++;
    const atHome = fixtureCursor % 2 === 0;
    setLeagueFixtures(fs => [...fs.slice(1), {
      comp: 'Premier League', date: `In ${7 + (fixtureCursor % 3)} days`, time: '15:00',
      home: atHome ? 'Man Utd' : nextOpp, away: atHome ? nextOpp : 'Man Utd',
    }]);

    return { home: fixture.home, away: fixture.away, homeGoals, awayGoals, usWon: (fixture.home === 'Man Utd' ? homeGoals > awayGoals : awayGoals > homeGoals) };
  }, [leagueTable, leagueFixtures]);

  // Called when the user actually watches their match live in the Match
  // Engine, so a watched result feeds back into the same persistent table
  // rather than only background-simulated ones counting.
  const recordUserMatchResult = useCallback((homeGoals, awayGoals) => {
    const fixture = leagueFixtures[0];
    if (!fixture) return;
    let table = applyResult(leagueTable, fixture.home, homeGoals, awayGoals);
    table = applyResult(table, fixture.away, awayGoals, homeGoals);
    table = recomputePositions(table);
    setLeagueTable(table);
    setLeagueResults(rs => [{ comp: 'Premier League', date: 'Today', home: fixture.home, away: fixture.away, score: `${homeGoals} - ${awayGoals}` }, ...rs].slice(0, 10));
    const nextOpp = UPCOMING_OPPONENTS[fixtureCursor % UPCOMING_OPPONENTS.length];
    fixtureCursor++;
    const atHome = fixtureCursor % 2 === 0;
    setLeagueFixtures(fs => [...fs.slice(1), {
      comp: 'Premier League', date: `In ${7 + (fixtureCursor % 3)} days`, time: '15:00',
      home: atHome ? 'Man Utd' : nextOpp, away: atHome ? nextOpp : 'Man Utd',
    }]);
  }, [leagueTable, leagueFixtures]);

  const value = useMemo(() => {
    const league = {
      table: leagueTable,
      results: leagueResults,
      fixtures: leagueFixtures,
      topScorers: D.topScorers,
      topAssists: D.topAssists,
      teamStats: D.teamStats,
      playerStats: D.playerLeagueStats,
      objectives: D.leagueObjectives,
    };
    const cups = D.cups;
    const continental = D.continental;
    const history = {
      previousSeasons: D.previousSeasons,
      trophyCabinet: D.trophyCabinet,
      clubRecords: D.clubRecords,
      notableAchievements: D.notableAchievements,
      historicalStats: D.historicalStats,
    };

    const usRow = league.table.find(r => r.us);
    const continentalList = Object.values(continental);

    // Cross-competition views for the Overview tab.
    const activeCompetitions = [
      { key: 'league', name: 'Premier League', status: `${usRow.pos === 1 ? '1st' : usRow.pos + getOrdinal(usRow.pos)} place`, progress: `${usRow.pts} pts from ${usRow.p} games`, color: '#8a6bff' },
      { key: 'cups', sub: 'faCup', name: cups.faCup.name, status: cups.faCup.currentRound, progress: `Next: ${cups.faCup.nextOpponent}`, color: cups.faCup.color },
      { key: 'cups', sub: 'leagueCup', name: cups.leagueCup.name, status: cups.leagueCup.currentRound, progress: cups.leagueCup.draw, color: cups.leagueCup.color },
      { key: 'continental', sub: 'ucl', name: continental.ucl.name, status: continental.ucl.phase, progress: `1st in league phase, ${continental.ucl.table[0].pts} pts`, color: continental.ucl.color },
      { key: 'continental', sub: 'uel', name: continental.uel.name, status: continental.uel.phase, progress: `1st in league phase, ${continental.uel.table[0].pts} pts`, color: continental.uel.color },
      { key: 'continental', sub: 'uecl', name: continental.uecl.name, status: continental.uecl.phase, progress: `vs ${continental.uecl.tie.opponent}`, color: continental.uecl.color },
    ];

    const allResults = [
      ...league.results.map(r => ({ ...r })),
      { comp: cups.faCup.name, date: '8 Dec 2025', home: 'Man Utd', away: cups.faCup.previousRounds[0].opponent, score: cups.faCup.previousRounds[0].score },
      { comp: cups.leagueCup.name, date: '17 Dec 2025', home: 'Newcastle', away: 'Man Utd', score: '1 - 2' },
      { comp: continental.ucl.name, date: '26 Nov 2025', home: 'Man Utd', away: 'Inter Milan', score: '2 - 1' },
      { comp: continental.uel.name, date: '28 Nov 2025', home: 'Braga', away: 'Man Utd', score: '1 - 2' },
    ];
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date) || 0);
    const allResultsTop = allResults.slice(0, 5);

    const allFixtures = [
      ...league.fixtures,
      { comp: cups.faCup.name, date: 'Sun, 4 Jan', time: '14:00', home: 'Bournemouth', away: 'Man Utd' },
      { comp: continental.ucl.name, date: 'Tue, 16 Dec', time: '20:00', home: 'Man Utd', away: 'Bayern Munich' },
      { comp: continental.uel.name, date: 'Thu, 18 Dec', time: '18:45', home: 'Man Utd', away: 'Roma' },
    ].slice(0, 6);

    const form = [...league.results].slice(0, 5).reverse().map(r => {
      const usHome = r.home === 'Man Utd';
      const [hs, as] = r.score.split(' - ').map(Number);
      const usGoals = usHome ? hs : as, oppGoals = usHome ? as : hs;
      return usGoals > oppGoals ? 'W' : usGoals < oppGoals ? 'L' : 'D';
    });

    const keyStats = {
      goalsScored: league.teamStats.goalsFor + cups.faCup.stats.goalsFor + cups.leagueCup.stats.goalsFor + continental.ucl.stats.goalsFor + continental.uel.stats.goalsFor,
      goalsConceded: league.teamStats.goalsAgainst + cups.faCup.stats.goalsAgainst + cups.leagueCup.stats.goalsAgainst + continental.ucl.stats.goalsAgainst + continental.uel.stats.goalsAgainst,
      unbeatenRun: 9,
      winRate: 71,
    };

    const objectives = [
      ...league.objectives.map(o => ({ ...o, comp: 'Premier League' })),
      { label: 'Win a domestic cup', status: 'On Track', detail: `${cups.faCup.name} & ${cups.leagueCup.name} still alive`, comp: 'Cups' },
      { label: 'Reach the Champions League knockout rounds', status: 'On Track', detail: '1st in league phase', comp: 'Continental' },
    ];

    return {
      league, cups, continental, continentalList, history, activeCompetitions, allResults: allResultsTop, allFixtures, form, keyStats, objectives,
      simulateMatchday, recordUserMatchResult,
    };
  }, [leagueTable, leagueFixtures, leagueResults, simulateMatchday, recordUserMatchResult]);

  return <CompCtx.Provider value={value}>{children}</CompCtx.Provider>;
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function useCompetitionData() {
  const ctx = useContext(CompCtx);
  if (!ctx) throw new Error('useCompetitionData must be used within a CompetitionProvider');
  return ctx;
}
