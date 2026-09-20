// Shared seed data for the Club Dashboard (Club Information + Club Settings).
// Career default club: Newcastle United (real database entry, club_uid 688).

export const clubIdentity = {
  name: 'Newcastle United', nickname: 'The Magpies', founded: 1892,
  country: 'England', league: 'Premier League',
  reputationWorldwide: 3.5, reputationContinental: 3,
  kits: [{ label: 'Home', color: '#000000' }, { label: 'Away', color: '#63b1e5' }, { label: 'Third', color: '#f5f5f5', border: true }],
};

export const stadium = {
  name: "St. James' Park", capacity: 52305, yearBuilt: 1892, pitchQuality: 'Excellent',
};

export const trainingGround = { name: 'Newcastle United Training Centre', level: 'Excellent', facilities: '4/5' };
export const youthAcademy = { youthSystem: '4/5', scoutingNetwork: '4/5', youthFacilities: 'Excellent' };
export const clubReputation = { domestic: '4/5', continental: '3/5', stars: 3 };

export const boardExpectations = {
  headline: ['Finish in the top six', 'Reach the Champions League knockout stages'],
  focusAreas: [{ label: 'Development', status: 'good' }, { label: 'Financial stability', status: 'good' }],
};

export const clubObjectives = [
  'Finish in the Premier League top six', 'Progress in the Champions League', 'Develop youth players', 'Maintain financial stability',
];

export const financesSummary = {
  balance: '£95,000,000', weeklyWageBudget: '£850,000', transferBudget: '£120,000,000', wageStructure: 'Healthy',
};

export const squadStaffSummary = { seniorSquad: 26, u21Squad: 18, totalStaff: 45, coachingStaff: 12 };

export const majorHonours = [
  { name: 'First Division / League Championship', count: 4, last: '1926/27' },
  { name: 'FA Cup', count: 6, last: '1954/55' },
  { name: 'Inter-Cities Fairs Cup', count: 1, last: '1968/69' },
];

export const clubRecords = [
  { label: 'Most Appearances', value: 'Jimmy Lawrence — 496' },
  { label: 'All-time Top Scorer', value: 'Alan Shearer — 206 goals' },
  { label: 'Longest Uninterrupted Managerial Spell', value: 'Joe Harvey — 1962–1975' },
  { label: 'Record Win', value: 'Newcastle United 13–0 Newport County (1946)' },
];

export const clubHistory = [
  { year: '1892', text: 'Founded through the merger of Newcastle East End and Newcastle West End.' },
  { year: '1904–1910', text: 'Golden era: three league titles and an FA Cup in six seasons.' },
  { year: '1927', text: 'Fourth and most recent league title.' },
  { year: '1955', text: 'Sixth FA Cup, the club\u2019s last major domestic trophy.' },
  { year: '1969', text: 'Won the Inter-Cities Fairs Cup, the club\u2019s only major European honour.' },
];

export const rivals = [
  { name: 'Sunderland', tag: 'Local Rival' },
  { name: 'Middlesbrough', tag: 'Regional Rival' },
  { name: 'Liverpool', tag: 'Rival' },
  { name: 'Man City', tag: 'Rival' },
];

export const affiliatedClubs = [
  { name: 'Newcastle United U21', tag: 'Development Squad' },
  { name: 'Newcastle United U18', tag: 'Academy' },
];

export const seasonSummary = [
  { label: 'League Position', value: '5th (16 games)' },
  { label: 'FA Cup', value: 'Still in progress' },
  { label: 'Carabao Cup', value: 'Quarter Final' },
  { label: 'Champions League', value: 'League Phase' },
];

export const recentForm = ['W', 'W', 'D', 'W', 'D'];
export const last5Matches = [
  { opp: 'Everton', score: '3 - 1', result: 'W' },
  { opp: 'Chelsea', score: '2 - 0', result: 'L' },
  { opp: 'Brighton', score: '1 - 1', result: 'D' },
  { opp: 'Fulham', score: '2 - 0', result: 'W' },
  { opp: 'West Ham', score: '4 - 1', result: 'W' },
];

export const notificationCategories = ['Player', 'Staff', 'Transfer', 'Medical', 'Scouting', 'Board', 'Media', 'Competition', 'Youth'];
