// Shared data generators for the universal Player Profile. Any player object
// from anywhere in the app (Squad, Tactics, Scouting, Transfers, World,
// Match) can be passed through these — they derive a complete, consistent
// profile from just a seed id, position and overall rating, so we don't need
// six different profile systems each with their own partial data.

function seededRand(seed) {
  let s = Math.abs(Number(seed) || 1) % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  next(); next(); next();
  return next;
}
function hashId(id) {
  return typeof id === 'number' && !Number.isNaN(id) ? id : String(id ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 17);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

const TECHNICAL_KEYS = ['Corners', 'Crossing', 'Dribbling', 'Finishing', 'First Touch', 'Free Kick Taking', 'Heading', 'Long Shots', 'Long Throws', 'Marking', 'Passing', 'Penalty Taking', 'Tackling', 'Technique'];
const MENTAL_KEYS = ['Aggression', 'Anticipation', 'Bravery', 'Composure', 'Concentration', 'Decisions', 'Determination', 'Flair', 'Leadership', 'Off The Ball', 'Positioning', 'Teamwork', 'Vision', 'Work Rate'];
const PHYSICAL_KEYS = ['Acceleration', 'Agility', 'Balance', 'Jumping Reach', 'Natural Fitness', 'Pace', 'Stamina', 'Strength'];
const GK_KEYS = ['GK Diving', 'GK Handling', 'GK Kicking', 'GK Positioning', 'GK Reflexes'];

// A position's standout attributes get a bump so a striker's Finishing/Pace
// look like a striker's, a centre-back's Tackling/Marking look like a
// centre-back's, etc.
const POSITION_EMPHASIS = {
  GK: { mental: ['Concentration', 'Decisions'], physical: ['Agility', 'Jumping Reach'] },
  DC: { technical: ['Marking', 'Tackling', 'Heading'], mental: ['Positioning', 'Bravery'], physical: ['Strength', 'Jumping Reach'] },
  DL: { technical: ['Crossing', 'Tackling'], physical: ['Pace', 'Stamina'] },
  DR: { technical: ['Crossing', 'Tackling'], physical: ['Pace', 'Stamina'] },
  DM: { technical: ['Tackling', 'Passing'], mental: ['Positioning', 'Work Rate'] },
  MC: { technical: ['Passing', 'Technique'], mental: ['Vision', 'Work Rate'] },
  AMC: { technical: ['Passing', 'Dribbling', 'Technique'], mental: ['Vision', 'Flair'] },
  AML: { technical: ['Dribbling', 'Technique'], physical: ['Pace', 'Agility'] },
  AMR: { technical: ['Dribbling', 'Technique'], physical: ['Pace', 'Agility'] },
  ST: { technical: ['Finishing', 'First Touch'], mental: ['Off The Ball', 'Composure'], physical: ['Pace', 'Acceleration'] },
};

function buildCategory(keys, base, seed, boosted = []) {
  const rand = seededRand(seed);
  const out = {};
  keys.forEach((k, i) => {
    const bump = boosted.includes(k) ? 10 : 0;
    out[k] = Math.round(clamp(base + bump + (rand() - 0.45) * 22, 4, 20));
  });
  return out;
}

export function generateFullAttributes(seedId, pos, ovr = 75) {
  const seed = hashId(seedId) * 7 + Math.round(ovr);
  const base = clamp(ovr / 6.2, 8, 17);
  const emphasis = POSITION_EMPHASIS[pos] || {};
  const isGK = pos === 'GK';
  return {
    Technical: buildCategory(TECHNICAL_KEYS, base, seed + 1, emphasis.technical || []),
    Mental: buildCategory(MENTAL_KEYS, base, seed + 2, emphasis.mental || []),
    Physical: buildCategory(PHYSICAL_KEYS, base, seed + 3, emphasis.physical || []),
    Goalkeeping: isGK ? buildCategory(GK_KEYS, base + 2, seed + 4, GK_KEYS) : null,
  };
}

const ROLE_NAMES = {
  GK: 'Goalkeeper', SK: 'Sweeper Keeper', BPK: 'Ball-Playing Keeper',
  FB: 'Full Back', WB: 'Wing Back', IWB: 'Inverted Wing Back',
  CD: 'Central Defender', BPD: 'Ball-Playing Defender', NCB: 'No-Nonsense Centre Back', STP: 'Stopper', COV: 'Covering Centre Back', LIB: 'Libero',
  DM: 'Defensive Midfielder', A: 'Anchor Man', HB: 'Half Back', BWM: 'Ball-Winning Midfielder', DLP: 'Deep-Lying Playmaker',
  CM: 'Central Midfielder', BBM: 'Box-to-Box Midfielder', MEZ: 'Mezzala', RPM: 'Roaming Playmaker', REG: 'Regista', SV: 'Segundo Volante', AP: 'Advanced Playmaker',
  AMC: 'Attacking Midfielder', SS: 'Shadow Striker', TREQ: 'Trequartista', ENG: 'Enganche',
  W: 'Winger', IW: 'Inverted Winger', IF: 'Inside Forward', WP: 'Wide Playmaker', WF: 'Wide Forward',
  AF: 'Advanced Forward', CF: 'Complete Forward', DLF: 'Deep-Lying Forward', F9: 'False Nine', TF: 'Target Forward', PF: 'Pressing Forward', PCH: 'Poacher',
};
const POSITION_ROLE_CODES = {
  GK: ['GK', 'SK', 'BPK'], DR: ['FB', 'WB', 'IWB'], DL: ['FB', 'WB', 'IWB'],
  DC: ['CD', 'BPD', 'NCB', 'STP', 'COV'], DM: ['DM', 'A', 'BWM', 'DLP'],
  MC: ['CM', 'BBM', 'DLP', 'MEZ', 'AP'], AMC: ['AP', 'SS', 'TREQ', 'ENG'],
  AML: ['W', 'IW', 'IF', 'WF'], AMR: ['W', 'IW', 'IF', 'WF'],
  ST: ['AF', 'CF', 'DLF', 'F9', 'TF', 'PCH'],
};
const ADJACENT_POSITIONS = {
  GK: [], DR: ['DC'], DL: ['DC'], DC: ['DR', 'DL', 'DM'], DM: ['MC', 'DC'],
  MC: ['DM', 'AMC'], AMC: ['MC', 'AML', 'AMR'], AML: ['AMR', 'ST'], AMR: ['AML', 'ST'], ST: ['AML', 'AMR'],
};

export function generatePositionsRoles(pos, seedId) {
  const rand = seededRand(hashId(seedId) * 11 + 3);
  const codes = POSITION_ROLE_CODES[pos] || ['CM'];
  const suitability = codes.slice(0, 4).map(code => ({
    code, name: ROLE_NAMES[code] || code, stars: Math.max(2, Math.min(5, Math.round(3 + (rand() - 0.4) * 3))),
  })).sort((a, b) => b.stars - a.stars);
  const otherPositions = (ADJACENT_POSITIONS[pos] || []).slice(0, 2);
  return { mainPosition: pos, otherPositions, suitability };
}

const CLUB_POOL = ['Napoli', 'Lille', 'AC Milan', 'Villarreal', 'Sporting CP', 'Ajax', 'RB Leipzig'];
export function generateCareer(seedId, currentClub, age) {
  const rand = seededRand(hashId(seedId) * 5 + 2);
  const seasons = Math.min(5, Math.max(2, age - 18));
  const rows = [];
  let club = currentClub;
  const startYear = 2025 - seasons;
  for (let i = 0; i < seasons; i++) {
    const year = 2025 - i;
    if (i === Math.floor(seasons / 2) && seasons > 2) club = CLUB_POOL[hashId(seedId) % CLUB_POOL.length];
    rows.push({
      season: `${year - 1}/${String(year).slice(2)}`, club,
      apps: 20 + Math.round(rand() * 20), goals: Math.round(rand() * 20), assists: Math.round(rand() * 8),
    });
  }
  return rows;
}

export function generateDevelopment(ovr, potential, seedId) {
  const rand = seededRand(hashId(seedId) * 3 + 9);
  const trendRoll = rand();
  const trend = trendRoll > 0.6 ? 'Improving' : trendRoll > 0.25 ? 'Stable' : 'Declining';
  const progress = Math.round(30 + rand() * 60);
  return { currentAbility: ovr, potentialAbility: potential, trend, trainingProgress: progress };
}

export { ROLE_NAMES };
