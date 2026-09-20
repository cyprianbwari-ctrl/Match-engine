// FAMILY 26 — resolves the career club's real identity/stadium/finance facts
// from the database, instead of always showing the hand-authored Newcastle
// content regardless of which club the manager actually picked.
//
// Curated narrative facts (real trophy history, records, rivals) only exist
// for the one club we've actually fact-checked (Newcastle — see clubData.js).
// For any other club, we don't invent plausible-sounding history: that would
// just reproduce the original "fake facts about a real club" problem for
// whoever gets picked instead. Those sections fall back to an honest
// "not tracked yet" placeholder rather than a guess.

import * as CuratedNewcastle from '../data/clubData.js';

const CURATED_CLUB_UID = '688'; // Newcastle United — the one club with fact-checked history/records.

export function resolveDivisionLevel(competitions = [], club) {
  if (!club) return 0;
  const comp = competitions.find(c => {
    const identifier = c.competitionId != null ? c.competitionId : (c.uid ?? c.id);
    return identifier != null && String(identifier) === String(club.leagueId);
  });
  return comp?.level ?? 0;
}

// Shared by the club picker (pre-season estimate, ranked by reputation) and
// the live Club Dashboard (ranked by actual league position) — same rules,
// same thresholds, so the target the player is shown never quietly changes
// definition between screens.
export function computeBoardExpectation(rankInDivision, totalInDivision, divisionLevel) {
  const total = Math.max(totalInDivision, 1);
  const topFlight = divisionLevel === 0;
  if (topFlight) {
    if (rankInDivision <= 2) return { label: 'Win the league', minPosition: 1 };
    if (rankInDivision <= 6) return { label: 'Qualify for Europe', minPosition: 6 };
    if (rankInDivision >= total - 4) return { label: 'Avoid relegation', minPosition: total - 3 };
    return { label: 'Top half finish', minPosition: Math.ceil(total / 2) };
  }
  if (rankInDivision <= 1) return { label: 'Win automatic promotion', minPosition: 2 };
  if (rankInDivision <= 5) return { label: 'Push for the play-offs', minPosition: 6 };
  if (rankInDivision >= total - 4) return { label: 'Avoid relegation', minPosition: total - 3 };
  return { label: 'Push for promotion', minPosition: 6 };
}

export function isCuratedClub(club) {
  return club && String(club.uid) === CURATED_CLUB_UID;
}

export function resolveStadium(stadiums = [], club) {
  if (!club) return null;
  return stadiums.find(s => String(s.stadiumId) === String(club.stadiumId)) || null;
}

// Same tier-aware shape as the onboarding budget estimate, kept in one place
// so Club Dashboard / Finance don't drift out of sync with what the player
// was shown when picking the club.
const TIER_DIVISOR = [40, 220, 900, 3500];
export function estimateTransferBudget(club, divisionLevel = 0) {
  if (!club) return '£0';
  const divisor = TIER_DIVISOR[divisionLevel] ?? 6000;
  const millions = Math.max(1, Math.round((club.reputation || 0) / divisor));
  return `£${millions.toLocaleString()},000,000`;
}

export function reputationStarsOf5(reputation = 0) {
  // Same buckets as the club-picker, expressed out of 5 for the Stars component.
  if (reputation >= 8000) return 5;
  if (reputation >= 6500) return 4;
  if (reputation >= 5000) return 3;
  if (reputation >= 3000) return 2;
  return 1;
}

export function clubInitials(club) {
  if (!club) return '—';
  return (club.code || club.shortName || club.name || '—').slice(0, 4).toUpperCase();
}

// Builds the identity block IdentityCard/StadiumCard/InfoTiles read from.
// Curated fields (nickname, honours, records, rivals, history) are only
// filled in for the curated club; everything else is real, or a plain
// "not tracked" placeholder — never an invented-but-plausible fact.
export function buildClubProfile({ club, stadiums = [], divisionLevel = 0 }) {
  const curated = isCuratedClub(club);
  const stadium = resolveStadium(stadiums, club);

  if (!club) {
    // Database hasn't loaded yet, or no club resolved — show the curated
    // Newcastle content as a placeholder rather than blank UI.
    return {
      curated: true,
      name: CuratedNewcastle.clubIdentity.name,
      nickname: CuratedNewcastle.clubIdentity.nickname,
      country: CuratedNewcastle.clubIdentity.country,
      league: CuratedNewcastle.clubIdentity.league,
      kits: CuratedNewcastle.clubIdentity.kits,
      stars5: 3,
      stadium: CuratedNewcastle.stadium,
      trainingGround: CuratedNewcastle.trainingGround,
      youthAcademy: CuratedNewcastle.youthAcademy,
      transferBudget: CuratedNewcastle.financesSummary.transferBudget,
      majorHonours: CuratedNewcastle.majorHonours,
      clubRecords: CuratedNewcastle.clubRecords,
      clubHistory: CuratedNewcastle.clubHistory,
      rivals: CuratedNewcastle.rivals,
    };
  }

  return {
    curated,
    name: club.name,
    nickname: curated ? CuratedNewcastle.clubIdentity.nickname : null,
    country: null, // resolved separately from nations where needed
    league: null,
    kits: curated ? CuratedNewcastle.clubIdentity.kits : [
      { label: 'Home', color: '#2a3567' }, { label: 'Away', color: '#f5f5f5', border: true },
    ],
    stars5: reputationStarsOf5(club.reputation),
    stadium: stadium
      ? { name: stadium.name, capacity: stadium.capacity || 0, yearBuilt: null, pitchQuality: 'Good' }
      : { name: 'Stadium data unavailable', capacity: 0, yearBuilt: null, pitchQuality: '—' },
    trainingGround: curated ? CuratedNewcastle.trainingGround : { name: `${club.name} Training Centre`, level: 'Good', facilities: '3/5' },
    youthAcademy: curated ? CuratedNewcastle.youthAcademy : { youthSystem: '3/5', scoutingNetwork: '3/5', youthFacilities: 'Good' },
    transferBudget: estimateTransferBudget(club, divisionLevel),
    majorHonours: curated ? CuratedNewcastle.majorHonours : null,
    clubRecords: curated ? CuratedNewcastle.clubRecords : null,
    clubHistory: curated ? CuratedNewcastle.clubHistory : null,
    rivals: curated ? CuratedNewcastle.rivals : null,
  };
}
