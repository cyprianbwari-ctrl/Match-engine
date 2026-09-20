// Shared seed data for the whole Competitions system. Everything the UI
// shows (Overview / League / Cups / Continental / History) is derived from
// this single set of objects via CompetitionContext, so it all stays in sync.

export const SEASON = '2025/26';

// ---------- League ----------

const plClubs = [
  ['Newcastle', 16, 12, 3, 1, 24, 39],
  ['Liverpool', 16, 11, 4, 1, 20, 37],
  ['Arsenal', 16, 10, 4, 2, 18, 34],
  ['Man City', 16, 10, 3, 3, 15, 33],
  ['Chelsea', 16, 9, 4, 3, 12, 31],
  ['West Ham', 16, 8, 5, 3, 10, 29],
  ['Aston Villa', 16, 8, 4, 4, 7, 28],
  ['Tottenham', 16, 7, 5, 4, 6, 26],
  ['Brighton', 16, 7, 4, 5, 3, 25],
  ['Bournemouth', 16, 6, 6, 4, 1, 24],
  ['Fulham', 16, 6, 5, 5, -1, 23],
  ['Crystal Palace', 16, 5, 6, 5, -3, 21],
  ['Everton', 16, 5, 5, 6, -5, 20],
  ['West Ham', 16, 5, 4, 7, -7, 19],
  ['Brentford', 16, 4, 6, 6, -6, 18],
  ['Wolves', 16, 4, 5, 7, -9, 17],
  ['Nottingham Forest', 16, 4, 4, 8, -10, 16],
  ['Leeds United', 16, 3, 5, 8, -12, 14],
  ['Burnley', 16, 3, 4, 9, -15, 13],
  ['Sunderland', 16, 2, 4, 10, -17, 10],
].map(([club, p, w, d, l, gd, pts], i) => ({ pos: i + 1, club, p, w, d, l, gd, pts, us: club === 'Newcastle' }));

export const leagueTable = plClubs;

export const leagueResults = [
  { id: 'l1', comp: 'Premier League', date: '7 Dec 2025', home: 'Newcastle', away: 'Everton', score: '3 - 0' },
  { id: 'l2', comp: 'Premier League', date: '30 Nov 2025', home: 'Chelsea', away: 'Newcastle', score: '1 - 2' },
  { id: 'l3', comp: 'Premier League', date: '23 Nov 2025', home: 'Newcastle', away: 'Brighton', score: '2 - 2' },
  { id: 'l4', comp: 'Premier League', date: '9 Nov 2025', home: 'Newcastle', away: 'Arsenal', score: '1 - 1' },
  { id: 'l5', comp: 'Premier League', date: '2 Nov 2025', home: 'Fulham', away: 'Newcastle', score: '0 - 3' },
];

export const leagueFixtures = [
  { id: 'lf1', comp: 'Premier League', date: 'Today', time: '16:00', home: 'Newcastle', away: 'Tottenham' },
  { id: 'lf2', comp: 'Premier League', date: 'Sat, 20 Dec', time: '15:00', home: 'Man City', away: 'Newcastle' },
  { id: 'lf3', comp: 'Premier League', date: 'Sat, 27 Dec', time: '17:30', home: 'Newcastle', away: 'Aston Villa' },
  { id: 'lf4', comp: 'Premier League', date: 'Tue, 30 Dec', time: '19:45', home: 'West Ham', away: 'Newcastle' },
  { id: 'lf5', comp: 'Premier League', date: 'Sat, 3 Jan', time: '15:00', home: 'Newcastle', away: 'Wolves' },
];

export const topScorers = [
  { player: 'Rafael Teixeira', club: 'Newcastle', goals: 13 },
  { player: 'Erling Haaland', club: 'Man City', goals: 12 },
  { player: 'Mohamed Salah', club: 'Liverpool', goals: 11 },
  { player: 'Anders Krogh', club: 'Newcastle', goals: 10 },
  { player: 'Jayden Okafor', club: 'Newcastle', goals: 9 },
  { player: 'Bukayo Saka', club: 'Arsenal', goals: 9 },
  { player: 'Cole Palmer', club: 'Chelsea', goals: 8 },
  { player: 'Viktor Solheim', club: 'Napoli', goals: 8 },
];

export const topAssists = [
  { player: 'Rafael Teixeira', club: 'Newcastle', assists: 10 },
  { player: 'Kevin De Bruyne', club: 'Man City', assists: 8 },
  { player: 'Mateo Villanueva', club: 'Newcastle', assists: 7 },
  { player: 'Mohamed Salah', club: 'Liverpool', assists: 7 },
  { player: 'Martin Ødegaard', club: 'Arsenal', assists: 6 },
  { player: 'Jamie Colton', club: 'Newcastle', assists: 5 },
];

export const teamStats = {
  goalsFor: 41, goalsAgainst: 17, avgPossession: 58, shotsPerGame: 15.4,
  cleanSheets: 8, yellowCards: 24, redCards: 1, passAccuracy: 86,
};

// Newcastle United player stats — sourced from the shared squad roster.
export const playerLeagueStats = [
  { name: 'Rafael Teixeira', apps: 16, goals: 13, assists: 10, rating: 7.9 },
  { name: 'Anders Krogh', apps: 15, goals: 10, assists: 3, rating: 7.5 },
  { name: 'Jayden Okafor', apps: 16, goals: 9, assists: 4, rating: 7.6 },
  { name: 'Mateo Villanueva', apps: 14, goals: 5, assists: 7, rating: 7.3 },
  { name: 'Wagner Aguiar', apps: 16, goals: 1, assists: 2, rating: 7.2 },
  { name: 'Tyrell Osei', apps: 15, goals: 2, assists: 3, rating: 7.1 },
  { name: 'Nahuel Ibarra', apps: 13, goals: 1, assists: 0, rating: 7.3 },
  { name: 'Étienne Mbarga', apps: 16, goals: 0, assists: 0, rating: 6.9 },
];

export const leagueObjectives = [
  { label: 'Win the Premier League', status: 'On Track', detail: '1st, 2 points clear' },
  { label: 'Qualify for the Champions League (Top 4)', status: 'Achieved', detail: 'Currently 1st' },
  { label: 'Keep goal difference in the top 3', status: 'Achieved', detail: '+24, best in the league' },
];

// ---------- Cups ----------

export const cups = {
  faCup: {
    name: 'Emirates FA Cup', color: '#e53946',
    currentRound: '4th Round', nextOpponent: 'Bournemouth (A) — 4 Jan 2026',
    draw: 'Draw for the 5th Round takes place after the 4th Round is completed.',
    previousRounds: [
      { round: '3rd Round', opponent: 'Preston North End', venue: 'H', score: '4 - 0', result: 'W' },
    ],
    stats: { played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 0 },
  },
  leagueCup: {
    name: 'Carabao Cup', color: '#26c1a4',
    currentRound: 'Quarter Final', nextOpponent: 'Draw TBC',
    draw: 'Quarter-final draw already completed — Semi-final draw pending.',
    previousRounds: [
      { round: '3rd Round', opponent: 'Barnsley', venue: 'H', score: '5 - 1', result: 'W' },
      { round: '4th Round', opponent: 'West Ham', venue: 'A', score: '2 - 1', result: 'W' },
    ],
    stats: { played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 10, goalsAgainst: 2 },
  },
  other: [
    { name: 'FA Community Shield', color: '#b9c2de', status: 'Completed', round: 'Final', opponent: 'Liverpool', score: '1 - 1 (4-3 pens)', result: 'W' },
  ],
};

export const cupFixtures = [
  { id: 'c1', comp: 'Emirates FA Cup', date: 'Sun, 4 Jan', time: '14:00', home: 'Bournemouth', away: 'Newcastle' },
];

// ---------- Continental ----------

export const continental = {
  ucl: {
    name: 'UEFA Champions League', color: '#c9d3f0', phase: 'League Phase',
    table: [
      { pos: 1, club: 'Newcastle', p: 6, w: 5, d: 1, l: 0, gd: 12, pts: 16, us: true },
      { pos: 2, club: 'Bayern Munich', p: 6, w: 4, d: 1, l: 1, gd: 8, pts: 13 },
      { pos: 3, club: 'Inter Milan', p: 6, w: 2, d: 2, l: 2, gd: 1, pts: 8 },
      { pos: 4, club: 'Real Sociedad', p: 6, w: 1, d: 0, l: 5, gd: -11, pts: 3 },
    ],
    fixtures: [{ home: 'Newcastle', away: 'Bayern Munich', date: 'Tue, 16 Dec', time: '20:00' }],
    results: [
      { home: 'Newcastle', away: 'Inter Milan', score: '2 - 1', date: '26 Nov' },
      { home: 'Real Sociedad', away: 'Newcastle', score: '0 - 3', date: '5 Nov' },
    ],
    knockout: 'Top 8 advance directly to the Round of 16; 9th–24th play a knockout play-off round in February.',
    stats: { played: 6, won: 5, drawn: 1, lost: 0, goalsFor: 17, goalsAgainst: 5 },
  },
  uel: {
    name: 'UEFA Europa League', color: '#ff8a3d', phase: 'League Phase',
    table: [
      { pos: 1, club: 'Newcastle', p: 6, w: 4, d: 1, l: 1, gd: 6, pts: 13, us: true },
      { pos: 2, club: 'Roma', p: 6, w: 3, d: 1, l: 2, gd: 4, pts: 10 },
      { pos: 3, club: 'Fenerbahçe', p: 6, w: 2, d: 2, l: 2, gd: 0, pts: 8 },
      { pos: 4, club: 'Braga', p: 6, w: 1, d: 0, l: 5, gd: -10, pts: 3 },
    ],
    fixtures: [{ home: 'Newcastle', away: 'Roma', date: 'Thu, 18 Dec', time: '18:45' }],
    results: [{ home: 'Braga', away: 'Newcastle', score: '1 - 2', date: '28 Nov' }],
    knockout: 'Top 8 go straight to Round of 16; 9th–24th enter the knockout play-off.',
    stats: { played: 6, won: 4, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 6 },
  },
  uecl: {
    name: 'UEFA Conference League', color: '#3ddc84', phase: 'Knockout Play-off',
    tie: { opponent: 'Real Betis', firstLeg: '12 Feb 2026', secondLeg: '19 Feb 2026' },
    roadToFinal: { stage: 'Knockout Play-off', final: '27 May 2026', venue: 'Wrocław Stadium' },
    stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
  },
};

// ---------- History (real Newcastle United honours & records) ----------

export const previousSeasons = [
  { season: '2021/22', league: '13th', notes: 'Mid-table finish', manager: 'Daniel Osgood' },
  { season: '2022/23', league: '7th', notes: 'Europa Conference League qualification', manager: 'Daniel Osgood' },
  { season: '2023/24', league: '5th', notes: 'Champions League qualification', manager: 'Marek Novotný (caretaker)' },
  { season: '2024/25', league: '4th', notes: 'Champions League last 16', manager: 'Marek Novotný' },
];

export const trophyCabinet = [
  { name: 'League Championship / First Division', count: 4, years: '1904/05 – 1926/27' },
  { name: 'FA Cup', count: 6, years: '1910 – 1955' },
  { name: 'Inter-Cities Fairs Cup', count: 1, years: '1969' },
];

export const clubRecords = [
  { label: 'Most Appearances', value: 'Jimmy Lawrence — 496' },
  { label: 'All-time Top Scorer', value: 'Alan Shearer — 206 goals' },
  { label: 'Longest Uninterrupted Managerial Spell', value: 'Joe Harvey — 1962–1975' },
  { label: 'Record Win', value: 'Newcastle United 13–0 Newport County (1946)' },
];

export const notableAchievements = [
  { year: '1904–1910', text: 'Golden era: three league titles and an FA Cup in six seasons.' },
  { year: '1927', text: 'Fourth and most recent league title.' },
  { year: '1955', text: 'Sixth FA Cup, the club\u2019s last major domestic trophy.' },
  { year: '1969', text: 'Won the Inter-Cities Fairs Cup, the club\u2019s only major European honour.' },
  { year: '1996', text: 'The \u201cEntertainers\u201d era under Kevin Keegan set a club-record Premier League points tally.' },
];

export const historicalStats = {
  totalMajorTrophies: 11,
  europeanTrophies: 1,
  leagueTitles: 4,
  domesticCups: 6,
};
