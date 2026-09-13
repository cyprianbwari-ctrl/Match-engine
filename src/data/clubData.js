// Shared seed data for the Club Dashboard (Club Information + Club Settings).

export const clubIdentity = {
  name: 'Manchester United', nickname: 'The Red Devils', founded: 1878,
  country: 'England', league: 'Premier League',
  reputationWorldwide: 4.5, reputationContinental: 4,
  kits: [{ label: 'Home', color: '#DA291C' }, { label: 'Away', color: '#f5f5f5', border: true }, { label: 'Third', color: '#0d3b2e' }],
};

export const stadium = {
  name: 'Old Trafford', capacity: 74310, yearBuilt: 1910, pitchQuality: 'Excellent',
};

export const trainingGround = { name: 'Aon Training Complex', level: 'Excellent', facilities: '5/5' };
export const youthAcademy = { youthSystem: '5/5', scoutingNetwork: '5/5', youthFacilities: 'Excellent' };
export const clubReputation = { domestic: '5/5', continental: '5/5', stars: 4 };

export const boardExpectations = {
  headline: ['Win the Premier League', 'Reach the Champions League QF'],
  focusAreas: [{ label: 'Development', status: 'good' }, { label: 'Financial stability', status: 'good' }],
};

export const clubObjectives = [
  'Win the Premier League', 'Reach Champions League QF', 'Develop youth players', 'Maintain financial stability',
];

export const financesSummary = {
  balance: '£180,000,000', weeklyWageBudget: '£1,200,000', transferBudget: '£200,000,000', wageStructure: 'Healthy',
};

export const squadStaffSummary = { seniorSquad: 26, u21Squad: 18, totalStaff: 45, coachingStaff: 12 };

export const majorHonours = [
  { name: 'Premier League', count: 20, last: '2023/24' },
  { name: 'FA Cup', count: 12, last: '2023/24' },
  { name: 'League Cup', count: 6, last: '2023/24' },
  { name: 'Champions League', count: 3, last: '2007/08' },
  { name: 'Europa League', count: 1, last: '2016/17' },
  { name: 'FIFA Club World Cup', count: 1, last: '2008' },
];

export const clubRecords = [
  { label: 'Most League Appearances', value: 'Ryan Giggs — 632' },
  { label: 'Most Appearances (all comps)', value: 'Ryan Giggs — 963' },
  { label: 'All-time Top Scorer', value: 'Wayne Rooney — 253 goals' },
  { label: 'Longest-serving Manager', value: 'Sir Alex Ferguson — 1986–2013' },
  { label: 'Record Win', value: 'Man Utd 10–0 Wigan Athletic (1995)' },
];

export const clubHistory = [
  { year: '1878', text: 'Founded as Newton Heath LYR Football Club.' },
  { year: '1902', text: 'Renamed Manchester United.' },
  { year: '1968', text: 'First English club to win the European Cup.' },
  { year: '1999', text: 'Historic Treble: Premier League, FA Cup and Champions League.' },
  { year: '2013', text: 'Record 20th English league title, Sir Alex Ferguson\u2019s final season.' },
];

export const rivals = [
  { name: 'Liverpool', tag: 'Local Rival' },
  { name: 'Man City', tag: 'Local Rival' },
  { name: 'Chelsea', tag: 'Local Rival' },
  { name: 'Arsenal', tag: 'Local Rival' },
];

export const affiliatedClubs = [
  { name: 'FC United', tag: 'Partner Club' },
  { name: 'Altrincham', tag: 'Partner Club' },
  { name: 'Royal Antwerp', tag: 'Partner Club' },
  { name: 'Salford City', tag: 'Partner Club' },
];

export const seasonSummary = [
  { label: 'League Position', value: '1st (16 games)' },
  { label: 'FA Cup', value: 'Still in progress' },
  { label: 'Carabao Cup', value: 'Quarter Final' },
  { label: 'Champions League', value: 'Group Stage' },
];

export const recentForm = ['W', 'W', 'W', 'W', 'D'];
export const last5Matches = [
  { opp: 'Everton', score: '3 - 1', result: 'W' },
  { opp: 'Chelsea', score: '2 - 0', result: 'L' },
  { opp: 'Brighton', score: '1 - 1', result: 'D' },
  { opp: 'Fulham', score: '2 - 0', result: 'W' },
  { opp: 'Newcastle', score: '4 - 1', result: 'W' },
];

export const notificationCategories = ['Player', 'Staff', 'Transfer', 'Medical', 'Scouting', 'Board', 'Media', 'Competition', 'Youth'];
