// FAMILY 26 — league pyramid helpers.
// Builds the tier list (division picker) and club list for a given nation,
// straight from the canonical database, instead of hardcoding a single
// top-flight competition per country.

function competitionMatchesClub(comp, club) {
  // In the canonical database, club `league_id` references competition_id.
  // Do not also compare the UID here: both are numeric but live in separate
  // namespaces, so an overlapping value can pull in a different country's teams.
  // The UID fallback is only for legacy/imported competition records that lack
  // a canonical competition ID.
  const ids = comp.competitionId != null
    ? [comp.competitionId]
    : [comp.uid, comp.id].filter(x => x != null);
  const normalizedIds = ids.map(String);
  return normalizedIds.includes(String(club.leagueId));
}

// A handful of regional/duplicate divisions share a level (e.g. National League
// North vs South, Segunda B groups). We keep them distinct rather than collapsing
// them, since that's how the real pyramid works, but we cap how deep we surface
// by default so the picker doesn't run into semi-professional regional football.
const MAX_LEVEL_DEPTH = 3; // top flight (0) down to third tier below it

// The database's nation names don't always match the friendly names used
// elsewhere in the app (ACTIVE_LEAGUE_COUNTRIES, UI labels). Bridge the two
// here rather than renaming what the app shows the player.
const COUNTRY_NAME_ALIASES = {
  Turkey: 'Türkiye',
  USA: 'U.S.A.',
};

export function getNationId(nations = [], countryName) {
  const lookupName = COUNTRY_NAME_ALIASES[countryName] ?? countryName;
  const hit = nations.find(n => n.name === lookupName);
  return hit ? hit.nation_id ?? hit.nationId ?? null : null;
}

export function getDivisionsForNation(competitions = [], nationId, { maxDepth = MAX_LEVEL_DEPTH } = {}) {
  if (nationId == null) return [];
  const inNation = competitions.filter(c => {
    const nid = c.nationId ?? c.raw?.nation_id;
    const isWomen = c.raw?.is_women;
    const level = c.level;
    return String(nid) === String(nationId) && !isWomen && level != null && level <= maxDepth;
  });
  // Dedupe same level+name pairs (decoded export sometimes repeats rows), keep highest reputation.
  const byKey = new Map();
  for (const c of inNation) {
    const key = `${c.level}:${c.name}`;
    const existing = byKey.get(key);
    if (!existing || (c.reputation ?? 0) > (existing.reputation ?? 0)) byKey.set(key, c);
  }
  return [...byKey.values()].sort((a, b) => (a.level - b.level) || (b.reputation - a.reputation));
}

export function getClubsForDivision(clubs = [], competition) {
  if (!competition) return [];
  return clubs.filter(c => c.type === 0 && !c.raw?.is_women && competitionMatchesClub(competition, c))
    .sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
}

// Reputation -> a rough 1-5 star rating for display, since the raw scale (0-9999-ish)
// isn't meaningful to show directly.
export function reputationStars(reputation = 0) {
  if (reputation >= 8000) return 5;
  if (reputation >= 6500) return 4;
  if (reputation >= 5000) return 3;
  if (reputation >= 3000) return 2;
  return 1;
}

export function divisionShortLabel(level) {
  return ['Top Flight', 'Second Tier', 'Third Tier', 'Fourth Tier'][level] ?? `Tier ${level + 1}`;
}
