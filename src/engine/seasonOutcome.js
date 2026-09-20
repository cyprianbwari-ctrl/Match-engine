// FAMILY 26 — end-of-season promotion/relegation outcome for the player's
// own club. Scoped deliberately: this resolves what happens to the CAREER
// CLUB, not a full-pyramid simulation of every other club moving up and
// down too — that's a materially bigger piece of work than this pass covers.
//
// Deterministic and seeded, per the project's existing rule that gameplay
// never uses Math.random() directly — a playoff decides on the same inputs
// every time it's replayed.

import { createSeededRng, deriveSeed } from './seededRng.js';

const PROMOTION_AUTO = 2;   // top 2 promoted automatically
const PLAYOFF_SPOTS = 4;    // next 4 positions contest the play-offs
const RELEGATION_COUNT = 3; // bottom 3 relegated
const CONTINENTAL_SPOTS = 4; // top-flight-only: continental qualification flavor

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// direction: -1 = move up a division (promoted), +1 = move down (relegated), 0 = stay.
export function resolveSeasonOutcome({ table, divisionLevel, clubId, careerSeed, season }) {
  const sorted = [...table].sort((a, b) => a.pos - b.pos);
  const total = sorted.length;
  const idx = sorted.findIndex(r => String(r.clubId) === String(clubId));
  if (idx === -1) return null;
  const pos = idx + 1;
  const topFlight = divisionLevel === 0;

  if (topFlight) {
    if (pos > total - RELEGATION_COUNT) {
      return { outcome: 'relegated', direction: 1, position: pos, label: `Relegated in ${pos}${ordinal(pos)} place` };
    }
    if (pos <= CONTINENTAL_SPOTS) {
      return { outcome: 'continental', direction: 0, position: pos, label: `Qualified for Europe (${pos}${ordinal(pos)})` };
    }
    return { outcome: 'stayed', direction: 0, position: pos, label: `Finished ${pos}${ordinal(pos)}` };
  }

  if (pos <= PROMOTION_AUTO) {
    return { outcome: 'promoted', direction: -1, position: pos, label: `Promoted automatically (finished ${pos}${ordinal(pos)})` };
  }
  if (pos <= PROMOTION_AUTO + PLAYOFF_SPOTS) {
    const rng = createSeededRng(deriveSeed('playoff', careerSeed, season, clubId));
    // A modest edge for the higher finisher, but play-offs are genuinely
    // supposed to be unpredictable — this isn't meant to feel guaranteed.
    const seedRank = pos - PROMOTION_AUTO - 1; // 0 for 3rd place, 3 for 6th
    const winChance = Math.max(0.15, 0.55 - seedRank * 0.07);
    const won = rng() < winChance;
    return won
      ? { outcome: 'promoted', direction: -1, position: pos, label: `Won the promotion play-offs (finished ${pos}${ordinal(pos)})` }
      : { outcome: 'stayed', direction: 0, position: pos, label: `Lost in the promotion play-offs (finished ${pos}${ordinal(pos)})` };
  }
  if (pos > total - RELEGATION_COUNT) {
    return { outcome: 'relegated', direction: 1, position: pos, label: `Relegated in ${pos}${ordinal(pos)} place` };
  }
  return { outcome: 'stayed', direction: 0, position: pos, label: `Finished ${pos}${ordinal(pos)}` };
}

// Finds the competition one level up/down from the given one, in the same
// country, to move the player's club into after promotion/relegation.
export function findAdjacentDivision(competitions, currentCompetition, direction) {
  if (!direction || !currentCompetition) return null;
  const targetLevel = (currentCompetition.level ?? 0) + direction;
  if (targetLevel < 0) return null;
  const candidates = competitions.filter(c =>
    c.level === targetLevel && !c.raw?.is_women &&
    String(c.nationId) === String(currentCompetition.nationId)
  );
  if (!candidates.length) return null;
  // Some levels split into regional groups (e.g. National League North/South) —
  // pick the highest-reputation one as the default landing spot.
  return candidates.sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0))[0];
}
