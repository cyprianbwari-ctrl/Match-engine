// FAMILY 26 — injected men's database loader
const TABLES = {
  players: 'players.json.gz',
  clubs: 'clubs.json.gz',
  competitions: 'competitions.json.gz',
  stadiums: 'stadiums.json.gz',
  clubSquads: 'club_squads.json.gz',
  contracts: 'starting_contracts_raw.json.gz',
  nations: 'nations.json.gz',
};

async function readGzipJson(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Database asset failed: ${url} (${res.status})`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Vite may transparently serve .gz assets as JSON during development.
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser does not support DecompressionStream; use a modern browser for the injected database.');
    }
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(stream).text());
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

const unpack = payload => {
  const { columns = [], rows = [] } = payload || {};
  return rows.map(row => {
    const obj = {};
    for (let i=0;i<columns.length;i++) obj[columns[i]] = row[i] ?? null;
    return obj;
  });
};

const n = v => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const clean = v => (v === '' || v == null ? null : v);
// Database exports can contain numeric UIDs as strings such as "260676.0".
// Normalize them so player <-> club_squads joins are stable.
const uidKey = v => {
  if (v == null || v === '') return '';
  const num = Number(v);
  return Number.isFinite(num) ? String(Math.trunc(num)) : String(v).trim();
};
const derivedMarketValue = (ca, pa, age) => {
  const rating = Math.max(0, Number(ca) || 0);
  const potential = Math.max(rating, Number(pa) || rating);
  const upside = Math.max(0, potential - rating);
  const ageFactor = age <= 21 ? 1.18 : age <= 24 ? 1.08 : age <= 28 ? 1 : age <= 31 ? 0.86 : 0.68;
  const base = Math.max(0, rating - 45) ** 2 * 6500;
  const value = (base + upside * 275000) * ageFactor;
  return Math.max(25000, Math.round(value / 10000) * 10000);
};

const VECTOR_51 = [
  'left_foot','right_foot','crossing','dribbling','tackling','finishing','long_shot','heading','jumping','passing','decision','unselfishness','pace','strength','stamina','technique','consistency','aggression','big_match','injury_prone','leadership','versatility','set_pieces','penalty','creativity','movement','positioning','work_rate','flair','handling','kicking','agility','aerial','reflexes','communication','throwing','gk','lib','lb','cb','rb','dm','lm','cm','rm','lw','am','rw','cf','lwb','rwb'
];
const POSITION_KEYS = [
  ['GK', 'gk'], ['DC', 'cb'], ['DL', 'lb'], ['DR', 'rb'], ['DM', 'dm'],
  ['MC', 'cm'], ['AMC', 'am'], ['AML', 'lw'], ['AMR', 'rw'], ['ST', 'cf'],
  ['WB', 'lwb'], ['WB', 'rwb'], ['LIB', 'lib'],
];

function primaryPosition(row) {
  const ranked = POSITION_KEYS
    .map(([position, key], index) => ({ position, score: n(row[key]), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked[0]?.score > 1 ? ranked[0].position : null;
}

function makeVector(row) { return VECTOR_51.map(k => n(row[k])); }

export function normalizeInjectedDatabase(raw) {
  const clubsRaw = raw.clubs || [];
  const clubByUid = new Map(clubsRaw.map(c => [String(c.club_uid), c]));
  const clubByName = new Map(clubsRaw.map(c => [String(c.full_name || c.short_name || '').toLowerCase(), c]));
  const squadRows = raw.clubSquads || [];
  const squadClubByPlayerUid = new Map();
  for (const s of squadRows) {
    if (s.player_uid != null && s.club_uid != null) squadClubByPlayerUid.set(uidKey(s.player_uid), uidKey(s.club_uid));
  }

  const players = (raw.players || []).map(p => {
    const playerUid = uidKey(p.player_uid ?? p.player_id);
    const squadClubUid = squadClubByPlayerUid.get(playerUid);
    const c = squadClubUid ? clubByUid.get(squadClubUid) : (p.club_id != null ? clubByUid.get(uidKey(p.club_id)) : null);
    const clubName = c?.full_name || clean(p.club) || null;
    const positions = String(p.positions || '').split(',').map(x=>x.trim()).filter(Boolean);
      const position = primaryPosition(p) || positions[0] || null;
    const attrs = {};
    for (const k of VECTOR_51) attrs[k] = n(p[k]);
    return {
      id: `db:${p.player_uid ?? p.player_id}`,
      legacyId: p.player_id,
      uid: p.player_uid,
      personId: p.person_uid,
      name: p.name || 'Unknown Player',
      club: clubName,
      clubId: c?.club_uid ?? p.club_id ?? null,
      nation: clean(p.nationality),
      nat: clean(p.nationality),
      country: clean(p.nationality),
      nationId: p.nation_id,
      position: positions[0] || null,
      position,
      pos: position,
      positions,
      displayPos: position,
      age: p.date_of_birth ? Math.max(0, Math.floor((Date.now()-new Date(p.date_of_birth).getTime())/31557600000)) : 0,
      dateOfBirth: p.date_of_birth,
      height: n(p.height_cm) || null,
      weight: n(p.weight_kg) || null,
      ca: n(p.ca), pa: Math.max(n(p.ca), n(p.pa)), rating: n(p.ca), potential: Math.max(n(p.ca), n(p.pa)),
      attributes: attrs,
      keyAttributes: attrs,
      vector51: makeVector(p),
      contract: null, contractExpiry: null, wage: null, wageValue: 0,
      value: null, valueNumber: derivedMarketValue(n(p.ca), Math.max(n(p.ca), n(p.pa)), p.date_of_birth ? Math.max(0, Math.floor((Date.now()-new Date(p.date_of_birth).getTime())/31557600000)) : 0),
      reputation: n(p.ca)>=88?'World Class':n(p.ca)>=80?'Worldwide':'Continental',
      fit: 80, rate: 6.8, form: [7,7,7,7], morale: 'Good', availability: 'Available',
      playTime: 'Squad Player', role: null, tacticalRole: null, roleLabel: null,
      number: null, league: clean(p.competition), competitionId: p.competition_id,
      source: 'decoded-men-database', namespace: 'family26-mens-only',
      squadSeed: Boolean(squadClubUid), raw: p
    };
  });

  const clubs = clubsRaw.map(c => ({
    id: `db:club:${c.club_uid}`,
    uid: c.club_uid, clubId: c.club_id, name: c.full_name || c.short_name,
    shortName: c.short_name, code: c.three_letter_name || c.six_letter_name,
    countryId: c.nation_id, leagueId: c.league_id, stadiumId: c.stadium_id,
    reputation: n(c.reputation), facilities: n(c.facilities), attendanceAvg: n(c.attendance_avg),
    type: n(c.type), gender: n(c.gender), playerCount: n(c.player_count), raw: c
  }));
  const competitions = (raw.competitions || []).map(c => ({
    id:`db:competition:${c.competition_uid}`, uid:c.competition_uid, competitionId:c.competition_id,
    name:c.full_name || c.short_name, shortName:c.short_name, code:c.code_name, type:c.type,
    continentId:c.continent_id, nationId:c.nation_id, reputation:n(c.reputation), level:n(c.level),
    parentCompetitionId:c.parent_competition_id, raw:c
  }));
  const stadiums = (raw.stadiums || []).map(s => ({ id:`db:stadium:${s.stadium_uid}`, uid:s.stadium_uid, stadiumId:s.stadium_id, name:s.name || s.name2, cityId:s.city_id, capacity:n(s.capacity), expansionCapacity:n(s.expansion_capacity), raw:s }));
  const nations = raw.nations || [];
  const contracts = raw.contracts || [];
  const clubSquads = raw.clubSquads || [];
  return { players, clubs, competitions, stadiums, contracts, nations, clubSquads, leagues: competitions.filter(c=>c.type===0 || c.type==='League') };
}

export async function loadInjectedMenDatabase() {
  const entries = await Promise.all(Object.entries(TABLES).map(async ([key,file]) => [key, unpack(await readGzipJson(`/database/${file}`))]));
  const raw = Object.fromEntries(entries);
  return normalizeInjectedDatabase(raw);
}
