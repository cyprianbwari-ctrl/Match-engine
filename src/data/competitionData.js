// Shared seed data for the whole Competitions system. Everything the UI
// shows (Overview / League / Cups / Continental / History) is derived from
// this single set of objects via CompetitionContext, so it all stays in sync.

export const SEASON = '2025/26';

// ---------- League ----------

const plClubs = [
  ['Man Utd', 16, 12, 3, 1, 24, 39],
  ['Liverpool', 16, 11, 4, 1, 20, 37],
  ['Arsenal', 16, 10, 4, 2, 18, 34],
  ['Man City', 16, 10, 3, 3, 15, 33],
  ['Chelsea', 16, 9, 4, 3, 12, 31],
  ['Newcastle', 16, 8, 5, 3, 10, 29],
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
].map(([club, p, w, d, l, gd, pts], i) => ({ pos: i + 1, club, p, w, d, l, gd, pts, us: club === 'Man Utd' }));

export const leagueTable = plClubs;

export const leagueResults = [
  { id: 'l1', comp: 'Premier League', date: '7 Dec 2025', home: 'Man Utd', away: 'Everton', score: '3 - 0' },
  { id: 'l2', comp: 'Premier League', date: '30 Nov 2025', home: 'Chelsea', away: 'Man Utd', score: '1 - 2' },
  { id: 'l3', comp: 'Premier League', date: '23 Nov 2025', home: 'Man Utd', away: 'Brighton', score: '2 - 2' },
  { id: 'l4', comp: 'Premier League', date: '9 Nov 2025', home: 'Man Utd', away: 'Arsenal', score: '1 - 1' },
  { id: 'l5', comp: 'Premier League', date: '2 Nov 2025', home: 'Fulham', away: 'Man Utd', score: '0 - 3' },
];

export const leagueFixtures = [
  { id: 'lf1', comp: 'Premier League', date: 'Today', time: '16:00', home: 'Man Utd', away: 'Tottenham' },
  { id: 'lf2', comp: 'Premier League', date: 'Sat, 20 Dec', time: '15:00', home: 'Man City', away: 'Man Utd' },
  { id: 'lf3', comp: 'Premier League', date: 'Sat, 27 Dec', time: '17:30', home: 'Man Utd', away: 'Newcastle' },
  { id: 'lf4', comp: 'Premier League', date: 'Tue, 30 Dec', time: '19:45', home: 'West Ham', away: 'Man Utd' },
  { id: 'lf5', comp: 'Premier League', date: 'Sat, 3 Jan', time: '15:00', home: 'Man Utd', away: 'Wolves' },
];

export const topScorers = [
  { player: 'Bruno Fernandes', club: 'Man Utd', goals: 13 },
  { player: 'Erling Haaland', club: 'Man City', goals: 12 },
  { player: 'Mohamed Salah', club: 'Liverpool', goals: 11 },
  { player: 'Rasmus Højlund', club: 'Man Utd', goals: 10 },
  { player: 'Marcus Rashford', club: 'Man Utd', goals: 9 },
  { player: 'Bukayo Saka', club: 'Arsenal', goals: 9 },
  { player: 'Cole Palmer', club: 'Chelsea', goals: 8 },
  { player: 'Alexander Isak', club: 'Newcastle', goals: 8 },
];

export const topAssists = [
  { player: 'Bruno Fernandes', club: 'Man Utd', assists: 10 },
  { player: 'Kevin De Bruyne', club: 'Man City', assists: 8 },
  { player: 'Alejandro Garnacho', club: 'Man Utd', assists: 7 },
  { player: 'Mohamed Salah', club: 'Liverpool', assists: 7 },
  { player: 'Martin Ødegaard', club: 'Arsenal', assists: 6 },
  { player: 'Luke Shaw', club: 'Man Utd', assists: 5 },
];

export const teamStats = {
  goalsFor: 41, goalsAgainst: 17, avgPossession: 58, shotsPerGame: 15.4,
  cleanSheets: 8, yellowCards: 24, redCards: 1, passAccuracy: 86,
};

// Man Utd player stats — sourced from the shared squad roster.
export const playerLeagueStats = [
  { name: 'Bruno Fernandes', apps: 16, goals: 13, assists: 10, rating: 7.9 },
  { name: 'Rasmus Højlund', apps: 15, goals: 10, assists: 3, rating: 7.5 },
  { name: 'Marcus Rashford', apps: 16, goals: 9, assists: 4, rating: 7.6 },
  { name: 'Alejandro Garnacho', apps: 14, goals: 5, assists: 7, rating: 7.3 },
  { name: 'Casemiro', apps: 16, goals: 1, assists: 2, rating: 7.2 },
  { name: 'Kobbie Mainoo', apps: 15, goals: 2, assists: 3, rating: 7.1 },
  { name: 'Lisandro Martínez', apps: 13, goals: 1, assists: 0, rating: 7.3 },
  { name: 'André Onana', apps: 16, goals: 0, assists: 0, rating: 6.9 },
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
      { round: '4th Round', opponent: 'Newcastle', venue: 'A', score: '2 - 1', result: 'W' },
    ],
    stats: { played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 10, goalsAgainst: 2 },
  },
  other: [
    { name: 'FA Community Shield', color: '#b9c2de', status: 'Completed', round: 'Final', opponent: 'Liverpool', score: '1 - 1 (4-3 pens)', result: 'W' },
  ],
};

export const cupFixtures = [
  { id: 'c1', comp: 'Emirates FA Cup', date: 'Sun, 4 Jan', time: '14:00', home: 'Bournemouth', away: 'Man Utd' },
];

// ---------- Continental ----------

export const continental = {
  ucl: {
    name: 'UEFA Champions League', color: '#c9d3f0', phase: 'League Phase',
    table: [
      { pos: 1, club: 'Man Utd', p: 6, w: 5, d: 1, l: 0, gd: 12, pts: 16, us: true },
      { pos: 2, club: 'Bayern Munich', p: 6, w: 4, d: 1, l: 1, gd: 8, pts: 13 },
      { pos: 3, club: 'Inter Milan', p: 6, w: 2, d: 2, l: 2, gd: 1, pts: 8 },
      { pos: 4, club: 'Real Sociedad', p: 6, w: 1, d: 0, l: 5, gd: -11, pts: 3 },
    ],
    fixtures: [{ home: 'Man Utd', away: 'Bayern Munich', date: 'Tue, 16 Dec', time: '20:00' }],
    results: [
      { home: 'Man Utd', away: 'Inter Milan', score: '2 - 1', date: '26 Nov' },
      { home: 'Real Sociedad', away: 'Man Utd', score: '0 - 3', date: '5 Nov' },
    ],
    knockout: 'Top 8 advance directly to the Round of 16; 9th–24th play a knockout play-off round in February.',
    stats: { played: 6, won: 5, drawn: 1, lost: 0, goalsFor: 17, goalsAgainst: 5 },
  },
  uel: {
    name: 'UEFA Europa League', color: '#ff8a3d', phase: 'League Phase',
    table: [
      { pos: 1, club: 'Man Utd', p: 6, w: 4, d: 1, l: 1, gd: 6, pts: 13, us: true },
      { pos: 2, club: 'Roma', p: 6, w: 3, d: 1, l: 2, gd: 4, pts: 10 },
      { pos: 3, club: 'Fenerbahçe', p: 6, w: 2, d: 2, l: 2, gd: 0, pts: 8 },
      { pos: 4, club: 'Braga', p: 6, w: 1, d: 0, l: 5, gd: -10, pts: 3 },
    ],
    fixtures: [{ home: 'Man Utd', away: 'Roma', date: 'Thu, 18 Dec', time: '18:45' }],
    results: [{ home: 'Braga', away: 'Man Utd', score: '1 - 2', date: '28 Nov' }],
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

// ---------- History (real Manchester United honours & records) ----------

export const previousSeasons = [
  { season: '2021/22', league: '6th', notes: 'No major trophies', manager: 'Rangnick (interim)' },
  { season: '2022/23', league: '3rd', notes: 'Carabao Cup winners; FA Cup runners-up', manager: 'Erik ten Hag' },
  { season: '2023/24', league: '8th', notes: 'FA Cup winners (beat Man City 2-1)', manager: 'Erik ten Hag' },
  { season: '2024/25', league: '15th', notes: 'Europa League runners-up', manager: 'Ten Hag / van Nistelrooy / Amorim' },
];

export const trophyCabinet = [
  { name: 'English League Titles', count: 20, years: '1907/08 – 2012/13' },
  { name: 'FA Cup', count: 13, years: '1908/09 – 2023/24' },
  { name: 'League Cup', count: 6, years: '1991/92 – 2022/23' },
  { name: 'FA Community Shield', count: 21, years: '1908 – 2016' },
  { name: 'European Cup / Champions League', count: 3, years: '1968, 1999, 2008' },
  { name: 'UEFA Europa League', count: 1, years: '2017' },
  { name: 'UEFA Cup Winners\u2019 Cup', count: 1, years: '1991' },
  { name: 'UEFA Super Cup', count: 1, years: '1991' },
  { name: 'FIFA Club World Cup', count: 1, years: '2008' },
  { name: 'Intercontinental Cup', count: 1, years: '1999' },
];

export const clubRecords = [
  { label: 'Most League Appearances', value: 'Ryan Giggs — 632' },
  { label: 'Most Appearances (all comps)', value: 'Ryan Giggs — 963' },
  { label: 'All-time Top Scorer', value: 'Wayne Rooney — 253 goals' },
  { label: 'Longest-serving Manager', value: 'Sir Alex Ferguson — 1986–2013' },
  { label: 'Record Win', value: 'Man Utd 10–0 Wigan Athletic (1995)' },
];

export const notableAchievements = [
  { year: '1968', text: 'First English club to win the European Cup.' },
  { year: '1999', text: 'Historic Treble: Premier League, FA Cup and Champions League.' },
  { year: '2008', text: 'Champions League and FIFA Club World Cup double.' },
  { year: '2013', text: 'Record 20th English league title, Sir Alex Ferguson\u2019s final season.' },
];

export const historicalStats = {
  totalMajorTrophies: 68,
  europeanCups: 3,
  leagueTitles: 20,
  domesticCups: 19,
};
