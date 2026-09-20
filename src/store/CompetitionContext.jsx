import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as D from '../data/competitionData.js';
import { buildOpponentPool, buildXI, initMatch, simulateInstant } from '../engine/FAMILY26MatchEngine.js';
import { FORMATIONS } from '../tactics/formations.js';
import { getMatchSeed } from '../engine/simulationSeeds.js';
import { getCareerSeed } from '../engine/careerSeedStore.js';
import { useManagerData } from './ManagerContext.jsx';
import { useDatabase } from './DatabaseContext.jsx';
import { getCareerClubId, getCareerClubName } from '../engine/clubIdentity.js';
import { normalizeActiveLeagues, canGenerateCareerMatch } from '../engine/activeLeaguePolicy.js';
import { buildCompetitionWorld, applyFixtureResult, nextFixtureForClub, fixturesForRound, isSeasonComplete } from '../engine/worldCompetitionScheduler.js';
import { resolveSeasonOutcome, findAdjacentDivision } from '../engine/seasonOutcome.js';

const CompCtx = createContext(null);

function simulateFixture(fixture, table, competitionName) {
  const home = table.find(r => String(r.clubId) === String(fixture.homeId));
  const away = table.find(r => String(r.clubId) === String(fixture.awayId));
  if (!home || !away) return { homeGoals: 0, awayGoals: 0 };
  const strengthA = 55 + Math.round(home.pts / 2) + Math.round(home.gf / Math.max(1, home.p));
  const strengthB = 55 + Math.round(away.pts / 2) + Math.round(away.gf / Math.max(1, away.p));
  const slots = FORMATIONS['4-3-3'];
  const poolA = buildOpponentPool(strengthA, slots, home.club);
  const poolB = buildOpponentPool(strengthB, slots, away.club);
  const homeXI = buildXI(slots.map((slot,i)=>({slot,player:poolA[i]})), 'home');
  const awayXI = buildXI(slots.map((slot,i)=>({slot,player:poolB[i]})), 'away');
  const result = simulateInstant(initMatch({
    homeXI, awayXI, homeName:home.club, awayName:away.club,
    homeTactics:{mentality:'Balanced',tempo:55,defensiveLine:55,pressing:{intensity:55}},
    awayTactics:{mentality:'Balanced',tempo:55,defensiveLine:55,pressing:{intensity:55}},
    matchSeed:getMatchSeed(getCareerSeed(), fixture.date, home.club, away.club, competitionName),
  }));
  return { homeGoals:result.score.home, awayGoals:result.score.away };
}

export function CompetitionProvider({ children }) {
  const manager = useManagerData();
  const db = useDatabase();
  const currentClubId = getCareerClubId(manager.profile, db);
  const currentClubName = getCareerClubName(manager.profile, db);
  const activeLeagues = normalizeActiveLeagues(manager.profile?.activeLeagues || []);
  const leagueOverride = manager.profile?.leagueOverride || null;
  // The club object as it actually competes this season: same real club,
  // but with its leagueId swapped to wherever promotion/relegation has
  // moved it, since the database's own leagueId is a fixed real-world
  // snapshot and can't reflect an in-career division change on its own.
  const currentClub = useMemo(() => {
    const base = (db.clubs || []).find(c => String(c.id) === String(currentClubId) || String(c.uid) === String(currentClubId));
    if (!base) return null;
    if (leagueOverride && String(leagueOverride.clubUid) === String(base.uid)) {
      return { ...base, leagueId: leagueOverride.leagueId };
    }
    return base;
  }, [db.clubs, currentClubId, leagueOverride]);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [world, setWorld] = useState(() => buildCompetitionWorld({ db, activeCountries:activeLeagues, currentClubId, currentClub, seasonIndex }));

  useEffect(() => {
    setWorld(buildCompetitionWorld({ db, activeCountries:activeLeagues, currentClubId, currentClub, seasonIndex }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.loading, db.clubs.length, db.competitions.length, db.nations.length, currentClubId, activeLeagues.join('|'), leagueOverride?.leagueId, seasonIndex]);

  const activeState = useMemo(() => {
    const states = Object.values(world);
    // Prefer the competition that actually contains the career club's next
    // fixture. The `us` table marker is useful too, but the fixture check is
    // the stronger invariant for match generation and survives imported/old
    // table state where the marker may not have been set yet.
    return states.find(s => nextFixtureForClub(s, currentClubId))
      || states.find(s => s.table.some(r => r.us))
      || states.find(s => String(s.competition.country || '').toLowerCase() === String(activeLeagues[0] || '').toLowerCase())
      || states[0] || null;
  }, [world, activeLeagues]);

  const fallbackLeague = useMemo(() => ({
    name:'Premier League', table:D.leagueTable.map(r=>({...r, us:r.club===currentClubName})),
    fixtures:D.leagueFixtures.map(f=>({...f,home:f.home==='Newcastle'?currentClubName:f.home,away:f.away==='Newcastle'?currentClubName:f.away})),
    results:D.leagueResults, topScorers:D.topScorers, topAssists:D.topAssists, teamStats:D.teamStats,
    playerStats:D.playerLeagueStats, objectives:D.leagueObjectives,
  }), [currentClubName]);

  const league = useMemo(() => {
    if (!activeState) return fallbackLeague;
    const us = activeState.table.find(r=>r.us);
    // The first fixture in the scheduler is not necessarily our fixture — it
    // is simply the first match in the round-robin array. The career UI must
    // always make the user's own next fixture the authoritative `fixtures[0]`
    // because Home, Matchday and Match all consume that slot.
    const scheduled = activeState.fixtures.filter(f=>f.status==='scheduled');
    const userFixture = nextFixtureForClub(activeState, currentClubId);
    const orderedFixtures = userFixture
      ? [userFixture, ...scheduled.filter(f=>f.id !== userFixture.id)].slice(0, 12)
      : scheduled.slice(0, 12);
    const fixtures = orderedFixtures.map(f => ({ ...f, comp: f.competition || activeState.competition.name }));
    const results = activeState.results.slice(0, 20).map(f=>({comp:activeState.competition.name,date:f.date,home:f.home,away:f.away,score:f.result?.score||'0 - 0'}));
    const gf = us?.gf || 0, ga = us?.ga || 0;
    const teamStats = {...D.teamStats, goalsFor:gf, goalsAgainst:ga, matchesPlayed:us?.p||0};
    return {
      name:activeState.competition.name, table:activeState.table, fixtures, results,
      topScorers:D.topScorers, topAssists:D.topAssists, teamStats, playerStats:D.playerLeagueStats,
      objectives:D.leagueObjectives.map(o=>({...o, label:o.label.replace(/Premier League/g, activeState.competition.name)})),
      competitionId:activeState.competition.id, country:activeState.competition.country, season:activeState.season,
    };
  }, [activeState, fallbackLeague]);

  const simulateMatchday = useCallback(() => {
    if (!activeState || !canGenerateCareerMatch(activeState.competition.country, activeLeagues)) return null;
    const userFixture = nextFixtureForClub(activeState, currentClubId) || fixturesForRound(activeState, activeState.currentRound)[0];
    if (!userFixture) return null;
    const updates = {};
    let userResult = null;
    Object.values(world).forEach(state => {
      const roundFixtures = fixturesForRound(state, state.currentRound).filter(f=>f.status==='scheduled');
      let nextState = state;
      roundFixtures.forEach(f => {
        const r = simulateFixture(f, nextState.table, nextState.competition.name);
        nextState = applyFixtureResult(nextState, f.id, r.homeGoals, r.awayGoals);
        if (state.key === activeState.key && f.id === userFixture.id) userResult = {...f,...r};
      });
      if (roundFixtures.length) updates[state.key] = nextState;
    });
    setWorld(prev=>({...prev,...updates}));
    if (!userResult) return null;
    return { home:userResult.home, away:userResult.away, homeGoals:userResult.homeGoals, awayGoals:userResult.awayGoals,
      usWon:String(userResult.homeId)===String(currentClubId)?userResult.homeGoals>userResult.awayGoals:userResult.awayGoals>userResult.homeGoals,
      competition:activeState.competition.name, fixtureId:userResult.id };
  }, [activeState, activeLeagues, currentClubId, world]);

  const recordUserMatchResult = useCallback((homeGoals, awayGoals) => {
    if (!activeState) return;
    const fixture = nextFixtureForClub(activeState, currentClubId);
    if (!fixture) return;
    const nextState = applyFixtureResult(activeState, fixture.id, Number(homeGoals)||0, Number(awayGoals)||0);
    setWorld(prev=>({...prev,[nextState.key]:nextState}));
  }, [activeState, currentClubId]);

  const seasonComplete = useMemo(() => isSeasonComplete(activeState), [activeState]);

  const seasonOutcome = useMemo(() => {
    if (!seasonComplete || !activeState || !currentClub) return null;
    return resolveSeasonOutcome({
      table: activeState.table,
      divisionLevel: activeState.competition.level ?? 0,
      clubId: currentClub.id,
      careerSeed: manager.profile.careerSeed,
      season: activeState.season,
    });
  }, [seasonComplete, activeState, currentClub, manager.profile.careerSeed]);

  const advanceSeason = useCallback(() => {
    if (!seasonOutcome || !activeState) return null;
    if (seasonOutcome.direction !== 0) {
      // The adjacent-division search needs every level of this country, not
      // just the ones currently active as world states, so re-derive from
      // the full competitions list rather than only what's already built.
      const countryComps = (db.competitions || []).filter(c => String(c.nationId) === String(activeState.competition.nationId));
      const next = findAdjacentDivision(countryComps, activeState.competition, seasonOutcome.direction);
      if (next) {
        manager.updateProfile({
          leagueOverride: { clubUid: currentClub.uid, leagueId: next.competitionId ?? next.uid ?? next.id },
        });
      }
    }
    setSeasonIndex(i => i + 1);
    return seasonOutcome;
  }, [seasonOutcome, activeState, world, db.competitions, currentClub, manager]);

  const cups = useMemo(()=>D.cups,[]);
  const continental = useMemo(()=>D.continental,[]);
  const history = useMemo(()=>({previousSeasons:D.previousSeasons,trophyCabinet:D.trophyCabinet,clubRecords:D.clubRecords,notableAchievements:D.notableAchievements,historicalStats:D.historicalStats}),[]);

  const value = useMemo(() => {
    const usRow = league.table.find(r=>r.us) || league.table[0] || {pos:1,pts:0,p:0};
    const activeCompetitions = [
      {key:'league',name:league.name,status:`${usRow.pos===1?'1st':usRow.pos+getOrdinal(usRow.pos)} place`,progress:`${usRow.pts} pts from ${usRow.p} games`,color:'#8a6bff'},
      {key:'cups',sub:'faCup',name:cups.faCup.name,status:cups.faCup.currentRound,progress:`Next: ${cups.faCup.nextOpponent}`,color:cups.faCup.color},
      {key:'cups',sub:'leagueCup',name:cups.leagueCup.name,status:cups.leagueCup.currentRound,progress:cups.leagueCup.draw,color:cups.leagueCup.color},
      {key:'continental',sub:'ucl',name:continental.ucl.name,status:continental.ucl.phase,progress:`1st in league phase, ${continental.ucl.table[0].pts} pts`,color:continental.ucl.color},
    ];
    const allResults = [...league.results.map(r=>({...r})), ...cups.faCup.previousRounds.map(r=>({comp:cups.faCup.name,date:'8 Dec 2025',home:currentClubName,away:r.opponent,score:r.score}))].slice(0,8);
    const allFixtures = [...league.fixtures, {comp:cups.faCup.name,date:'Sun, 4 Jan',time:'14:00',home:'Bournemouth',away:currentClubName}].slice(0,8);
    const form = league.results.slice(0,5).reverse().map(r=>{const [hs,as]=r.score.split(' - ').map(Number);const home=r.home===currentClubName;const u=home?hs:as,o=home?as:hs;return u>o?'W':u<o?'L':'D';});
    const keyStats = {goalsScored:league.teamStats.goalsFor||0,goalsConceded:league.teamStats.goalsAgainst||0,unbeatenRun:9,winRate:71};
    const objectives = [...(league.objectives||[]),{label:'Win a domestic cup',status:'On Track',detail:`${cups.faCup.name} & ${cups.leagueCup.name} still alive`,comp:'Cups'}];
    return {league,cups,continental,continentalList:Object.values(continental),history,activeCompetitions,allResults,allFixtures,form,keyStats,objectives,worldCompetitions:Object.values(world),simulateMatchday,recordUserMatchResult,
      seasonComplete,seasonOutcome,advanceSeason,divisionLevel:activeState?.competition?.level??0,
      getSnapshot:()=>({world,seasonIndex}),restoreSnapshot:(s)=>{if(s?.world)setWorld(s.world); if(s?.seasonIndex!==undefined)setSeasonIndex(s.seasonIndex); else if(s?.leagueTable){ /* legacy save migration */ }}};
  }, [league,cups,continental,history,currentClubName,world,simulateMatchday,recordUserMatchResult,seasonComplete,seasonOutcome,advanceSeason,activeState,seasonIndex]);

  return <CompCtx.Provider value={value}>{children}</CompCtx.Provider>;
}
function getOrdinal(n){const s=['th','st','nd','rd'],v=n%100;return s[(v-20)%10]||s[v]||s[0];}
export function useCompetitionData(){const ctx=useContext(CompCtx);if(!ctx)throw new Error('useCompetitionData must be used within a CompetitionProvider');return ctx;}
