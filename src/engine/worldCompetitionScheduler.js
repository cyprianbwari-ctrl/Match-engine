// FAMILY 26 — authoritative world competition scheduler
// One source of truth for Competition → Season → Round → Fixture → Result → Table.

function isoDate(date) { return new Date(date).toISOString().slice(0, 10); }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function clubName(c) { return c?.name || c?.shortName || 'Unknown Club'; }
function competitionMatchesClub(comp, club) {
  const competitionId = comp?.competitionId;
  const identifier = competitionId != null ? competitionId : (comp?.uid ?? comp?.id);
  return identifier != null && String(club?.leagueId) === String(identifier);
}

function tableForTeams(teams) {
  return teams.map((club, index) => ({
    club: clubName(club), clubId: club.id, p: 0, w: 0, d: 0, l: 0,
    gd: 0, pts: 0, gf: 0, ga: 0, us: false, pos: index + 1,
  }));
}

function sortTable(rows) {
  return [...rows].sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.club.localeCompare(b.club))
    .map((r,i) => ({...r, pos:i+1}));
}

// Circle method round-robin scheduler. Evenly distributes home/away fixtures
// and produces a complete season before the first match is played.
function roundRobin(teams, seasonStart, competitionName) {
  const list = [...teams];
  if (list.length < 2) return [];
  if (list.length % 2) list.push(null);
  const n = list.length;
  const rounds = [];
  let rotating = [...list];
  for (let round = 0; round < n - 1; round++) {
    const fixtures = [];
    for (let i = 0; i < n / 2; i++) {
      const a = rotating[i], b = rotating[n - 1 - i];
      if (a && b) {
        const flip = (round + i) % 2 === 1;
        fixtures.push({
          id: `${competitionName}:${round + 1}:${clubName(a)}:${clubName(b)}`,
          competition: competitionName, season: '2025/26', round: round + 1,
          date: isoDate(addDays(seasonStart, round * 7)), time: '15:00',
          home: flip ? clubName(b) : clubName(a), away: flip ? clubName(a) : clubName(b),
          homeId: flip ? b.id : a.id, awayId: flip ? a.id : b.id,
          status: 'scheduled', result: null,
        });
      }
    }
    rounds.push(fixtures);
    rotating = [rotating[0], rotating[n - 1], ...rotating.slice(1, n - 1)];
  }
  const secondHalf = rounds.map((fixtures, i) => fixtures.map(f => ({
    ...f, id: `${f.id}:R`, round: n - 1 + i + 1,
    date: isoDate(addDays(seasonStart, (n - 1 + i) * 7)),
    home: f.away, away: f.home, homeId: f.awayId, awayId: f.homeId,
  })));
  return [...rounds, ...secondHalf].flat();
}

export function resolveLeagueCompetitions(db, activeCountries = [], currentClub = null) {
  const nations = db.nations || [];
  const nationById = new Map();
  nations.forEach(n => { if(n.nation_uid != null) nationById.set(String(n.nation_uid), n); if(n.nation_id != null) nationById.set(String(n.nation_id), n); });
  const wanted = new Set(activeCountries.map(String));
  // Domestic league competitions only: cups/continental competitions use a
  // level of 100 as a sentinel, so level<100 already excludes them without
  // needing to special-case competition type (which varies: 0 for a top
  // flight, 1 for lower tiers — both are real leagues, not just type 0).
  const allLeagues = (db.competitions || [])
    .filter(c => c.level != null && c.level < 100 && !c.raw?.is_women)
    .filter(c => {
      const nation = nationById.get(String(c.nationId));
      return wanted.has(String(c.country || nation?.name || ''));
    });

  const byCountry = new Map();
  allLeagues.forEach(c => {
    const nation = nationById.get(String(c.nationId));
    const key = String(c.country || nation?.name || 'Unknown');
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key).push({ ...c, country: key });
  });

  const result = [];
  for (const [country, comps] of byCountry) {
    comps.sort((a, b) => (a.level ?? 99) - (b.level ?? 99) || (b.reputation ?? 0) - (a.reputation ?? 0));
    // If the player's club is in this country, use whichever division its
    // (possibly promotion/relegation-overridden) leagueId actually matches —
    // not always the top flight — so a Championship (or lower) career gets
    // a real competition to play in, and moving divisions actually works.
    const ownDivision = currentClub ? comps.find(c => competitionMatchesClub(c, currentClub)) : null;
    result.push(ownDivision || comps[0]);
  }
  return result;
}

export function buildCompetitionWorld({ db, activeCountries = [], currentClubId = null, currentClub = null, seasonIndex = 0, startYear = 2025 }) {
  const year = startYear + seasonIndex;
  const startDate = new Date(year, 8, 13);
  const seasonLabel = `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
  const competitions = resolveLeagueCompetitions(db, activeCountries, currentClub);
  const states = {};
  competitions.forEach(comp => {
    let teams = (db.clubs || []).filter(c => competitionMatchesClub(comp, c) && !c.raw?.is_women);
    if (currentClub && !teams.some(c => String(c.id) === String(currentClub.id))) {
      if (competitionMatchesClub(comp, currentClub)) teams = [...teams, currentClub];
    }
    teams = teams.filter((c,i,a) => a.findIndex(x => String(x.id) === String(c.id)) === i);
    // Some database divisions are small. Two teams are still enough for the
    // round-robin generator and, crucially, must not discard the player's
    // selected division (which otherwise leaves no `us` row in the UI).
    if (teams.length < 2) return;
    const fixtures = roundRobin(teams, startDate, comp.name);
    const table = tableForTeams(teams);
    const us = teams.find(c => String(c.id) === String(currentClubId) || String(c.uid) === String(currentClubId));
    if (us) table.find(r => r.clubId === us.id).us = true;
    states[comp.id] = { key: comp.id, competition: comp, season: seasonLabel, currentRound: 1, fixtures, results: [], table: sortTable(table) };
  });
  return states;
}

export function applyFixtureResult(state, fixtureId, homeGoals, awayGoals) {
  if (!state) return state;
  const fixture = state.fixtures.find(f => f.id === fixtureId);
  if (!fixture || fixture.status === 'played') return state;
  const result = { homeGoals, awayGoals, score: `${homeGoals} - ${awayGoals}` };
  const table = state.table.map(row => {
    if (row.clubId === fixture.homeId) {
      const w = homeGoals > awayGoals ? 1 : 0, d = homeGoals === awayGoals ? 1 : 0;
      return {...row, p:row.p+1, w:row.w+w, d:row.d+d, l:row.l+(homeGoals<awayGoals?1:0), gf:row.gf+homeGoals, ga:row.ga+awayGoals, gd:row.gd+homeGoals-awayGoals, pts:row.pts+(w?3:d)};
    }
    if (row.clubId === fixture.awayId) {
      const w = awayGoals > homeGoals ? 1 : 0, d = homeGoals === awayGoals ? 1 : 0;
      return {...row, p:row.p+1, w:row.w+w, d:row.d+d, l:row.l+(awayGoals<homeGoals?1:0), gf:row.gf+awayGoals, ga:row.ga+homeGoals, gd:row.gd+awayGoals-homeGoals, pts:row.pts+(w?3:d)};
    }
    return row;
  });
  const fixtures = state.fixtures.map(f => f.id === fixtureId ? {...f, status:'played', result} : f);
  const results = [{...fixture, result, status:'played'}, ...state.results];
  const nextRound = Math.max(state.currentRound, fixture.round + 1);
  return {...state, fixtures, results, currentRound: nextRound, table:sortTable(table)};
}

export function isSeasonComplete(state) {
  return !!state && state.fixtures.length > 0 && state.fixtures.every(f => f.status === 'played');
}

export function nextFixtureForClub(state, clubId) {
  return state?.fixtures.find(f => f.status === 'scheduled' && (String(f.homeId) === String(clubId) || String(f.awayId) === String(clubId))) || null;
}

export function fixturesForRound(state, round) {
  return (state?.fixtures || []).filter(f => f.round === round);
}
