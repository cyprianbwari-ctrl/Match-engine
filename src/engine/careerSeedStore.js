import { DEFAULT_CAREER_SEED, normalizeCareerSeed } from './simulationSeeds.js';

const KEY = 'family26_career_seed_v1';

export function getCareerSeed() {
  try { return normalizeCareerSeed(localStorage.getItem(KEY)); } catch { return DEFAULT_CAREER_SEED; }
}

export function setCareerSeed(seed) {
  const normalized = normalizeCareerSeed(seed);
  try { localStorage.setItem(KEY, String(normalized)); } catch {}
  return normalized;
}

export function ensureCareerSeed(seed) {
  const existing = getCareerSeed();
  if (seed !== undefined && seed !== null) return setCareerSeed(seed);
  try {
    if (!localStorage.getItem(KEY)) return setCareerSeed(existing);
  } catch {}
  return existing;
}
