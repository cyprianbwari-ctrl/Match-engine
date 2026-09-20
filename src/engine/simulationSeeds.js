import { deriveSeed } from './seededRng.js';

export const DEFAULT_CAREER_SEED = 26091826;

export function normalizeCareerSeed(seed) {
  const n = Number(seed);
  return Number.isFinite(n) && n !== 0 ? Math.abs(Math.floor(n)) : DEFAULT_CAREER_SEED;
}

export function getDaySeed(careerSeed, dayIndex) {
  return deriveSeed('career-day', normalizeCareerSeed(careerSeed), dayIndex);
}

export function getMatchSeed(careerSeed, date, home, away, competition = '') {
  return deriveSeed('career-match', normalizeCareerSeed(careerSeed), date, home, away, competition);
}
