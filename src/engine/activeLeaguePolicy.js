/**
 * FAMILY 26 — exactly five active leagues are career-authoritative.
 * AI/world activity may exist outside these leagues, but user-career
 * progression, transfer visibility, manager movement and match generation
 * are gated by this policy.
 */
export const ACTIVE_LEAGUE_COUNTRIES = [
  "England","Spain","Germany","Italy","France","Portugal","Netherlands","Belgium","Scotland","Turkey",
  "Austria","Switzerland","Denmark","Sweden","Norway","Brazil","Argentina","USA","Mexico","Japan"
];

export const ACTIVE_LEAGUE_COUNT = 5;

export function normalizeActiveLeagues(list = []) {
  const unique = [...new Set(list.map(String).filter(Boolean))];
  return unique.slice(0, ACTIVE_LEAGUE_COUNT);
}

export function isValidActiveLeagueSelection(list = []) {
  return normalizeActiveLeagues(list).length === ACTIVE_LEAGUE_COUNT &&
    new Set(normalizeActiveLeagues(list)).size === ACTIVE_LEAGUE_COUNT;
}

export function isLeagueActive(country, activeLeagues = []) {
  return normalizeActiveLeagues(activeLeagues).includes(String(country));
}

export function activeLeagueFrequency(country, activeLeagues = []) {
  return isLeagueActive(country, activeLeagues) ? "full" : "background";
}

export function canGenerateCareerMatch(country, activeLeagues = []) {
  return isLeagueActive(country, activeLeagues);
}

export function canMoveCareerManagerToClub(club, activeLeagues = []) {
  return isLeagueActive(club?.country || club?.nationCountry || club?.leagueCountry, activeLeagues);
}

export function canExposeTransferToCareer(club, activeLeagues = []) {
  return isLeagueActive(club?.country || club?.nationCountry || club?.leagueCountry, activeLeagues);
}

export function canProgressCompetition(competition, activeLeagues = []) {
  return isLeagueActive(competition?.country || competition?.nationCountry, activeLeagues);
}


export function buildActiveLeagueRuntime(activeLeagues = []) {
  const selected = normalizeActiveLeagues(activeLeagues);
  return Object.freeze({
    countries: selected,
    count: selected.length,
    valid: selected.length === ACTIVE_LEAGUE_COUNT,
    simulationFrequency: country => activeLeagueFrequency(country, selected),
    careerMatchAllowed: country => canGenerateCareerMatch(country, selected),
    transferAllowed: club => canExposeTransferToCareer(club, selected),
    managerMoveAllowed: club => canMoveCareerManagerToClub(club, selected),
    competitionProgressionAllowed: comp => canProgressCompetition(comp, selected),
  });
}
