// FAMILY 26 — deterministic simulation RNG
// A career seed establishes the world; derived match/day/event seeds keep
// outcomes reproducible without sharing mutable global randomness.

export function hashSeed(value) {
  const text = String(value ?? '');
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deriveSeed(...parts) {
  return hashSeed(parts.join('|')) || 1;
}

export function createSeededRng(seed = 1) {
  let state = hashSeed(seed) || 1;
  return function rng() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick(rng, array = []) {
  return array.length ? array[randomInt(rng, 0, array.length - 1)] : undefined;
}

export function shuffle(rng, array = []) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
