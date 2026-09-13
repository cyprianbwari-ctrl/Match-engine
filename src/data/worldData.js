// Shared seed data for the World section (Global Ranking / Player Search /
// Scouting-World Info). Real player names with fictional in-game stats,
// consistent with how Scouting.jsx already treats the world player pool.

function attrsFor(pos, seed) {
  const s = seed;
  if (pos === 'GK') return { 'Saves': 84 + s % 10, 'Save %': 70 + s % 15, 'Goals Prevented': 60 + s % 20, 'Distribution': 65 + s % 20, 'Crosses Claimed': 60 + s % 20, 'Clean Sheets': 55 + s % 25 };
  if (['CB', 'LB', 'RB', 'WB'].includes(pos)) return { 'Tackles': 80 + s % 15, 'Interceptions': 78 + s % 15, 'Duels Won': 75 + s % 15, 'Blocks': 70 + s % 20, 'Positioning': 80 + s % 15, 'Build-up': 65 + s % 20 };
  if (['CM', 'CDM', 'DM', 'CAM', 'AM'].includes(pos)) return { 'Passing': 82 + s % 14, 'Chance Creation': 78 + s % 18, 'Progression': 80 + s % 15, 'Assists': 60 + s % 30, 'Defensive Contribution': 55 + s % 30, 'Ball Recoveries': 65 + s % 25 };
  return { 'Finishing': 85 + s % 12, 'xG': 78 + s % 18, 'Assists': 55 + s % 30, 'Shots': 75 + s % 20, 'Conversion': 60 + s % 25, 'Chance Creation': 60 + s % 25 };
}

const raw = [
  [1, 'Erling Haaland', '🇳🇴', 'ST', 'Man City', 24, 96, [92, 94, 96, 95, 97], '€180M', 2],
  [2, 'Kylian Mbappé', '🇫🇷', 'ST', 'Real Madrid', 25, 94, [90, 93, 94, 92, 95], '€160M', 1],
  [3, 'Vinícius Júnior', '🇧🇷', 'LW', 'Real Madrid', 24, 92, [88, 91, 93, 92, 94], '€140M', 3],
  [4, 'Jude Bellingham', '🏴', 'CM', 'Real Madrid', 21, 91, [87, 90, 92, 91, 93], '€120M', 1],
  [5, 'Rodri', '🇪🇸', 'DM', 'Man City', 28, 90, [88, 89, 91, 88, 82], '€110M', 0],
  [6, 'Lionel Messi', '🇦🇷', 'RW', 'Inter Miami', 38, 89, [86, 90, 88, 91, 85], '€75M', -2],
  [7, 'Lamine Yamal', '🇪🇸', 'RW', 'Barcelona', 17, 88, [84, 87, 90, 91, 92], '€90M', 4],
  [8, 'Mohamed Salah', '🇪🇬', 'RW', 'Liverpool', 32, 87, [85, 86, 88, 87, 89], '€70M', 1],
  [9, 'Kevin De Bruyne', '🇧🇪', 'CM', 'Man City', 33, 87, [88, 89, 84, 87, 82], '€60M', -1],
  [10, 'Harry Kane', '🏴', 'ST', 'Bayern Munich', 31, 86, [84, 85, 87, 88, 86], '€65M', 2],
  [11, 'Jamal Musiala', '🇩🇪', 'AM', 'Bayern Munich', 21, 85, [82, 84, 86, 87, 88], '€95M', 3],
  [12, 'Victor Osimhen', '🇳🇬', 'ST', 'Galatasaray', 26, 84, [86, 85, 83, 82, 78], '€80M', -1],
  [13, 'Phil Foden', '🏴', 'CAM', 'Man City', 24, 84, [81, 83, 85, 84, 86], '€75M', 1],
  [14, 'Bukayo Saka', '🏴', 'RW', 'Arsenal', 23, 83, [80, 82, 84, 85, 83], '€70M', 2],
  [15, 'Rafael Leão', '🇵🇹', 'LW', 'AC Milan', 25, 83, [85, 84, 81, 79, 77], '€65M', -1],
  [16, 'Federico Valverde', '🇺🇾', 'CM', 'Real Madrid', 26, 82, [79, 81, 83, 82, 84], '€65M', 1],
  [17, 'Alexis Mac Allister', '🇦🇷', 'CM', 'Liverpool', 26, 82, [80, 81, 82, 83, 84], '€60M', 2],
  [18, 'Julián Álvarez', '🇦🇷', 'ST', 'Atlético Madrid', 25, 81, [83, 82, 80, 78, 76], '€55M', -1],
  [19, 'Florian Wirtz', '🇩🇪', 'CAM', 'Leverkusen', 21, 81, [78, 80, 82, 83, 85], '€50M', 3],
  [20, 'Declan Rice', '🏴', 'DM', 'Arsenal', 26, 80, [78, 79, 81, 80, 82], '€55M', 0],
  [21, 'Martin Ødegaard', '🇳🇴', 'CAM', 'Arsenal', 25, 79, [77, 78, 80, 81, 79], '€75M', 1],
  [22, 'Cole Palmer', '🏴', 'CAM', 'Chelsea', 22, 79, [76, 78, 80, 82, 83], '€90M', 3],
  [23, 'Alexander Isak', '🇸🇪', 'ST', 'Newcastle', 25, 78, [76, 77, 79, 80, 78], '€85M', 1],
  [24, 'Virgil van Dijk', '🇳🇱', 'CB', 'Liverpool', 33, 78, [80, 79, 77, 76, 75], '€35M', -1],
  [25, 'William Saliba', '🇫🇷', 'CB', 'Arsenal', 23, 78, [76, 77, 78, 79, 80], '€80M', 2],
  [26, 'Rúben Dias', '🇵🇹', 'CB', 'Man City', 27, 77, [75, 76, 77, 78, 76], '€75M', 0],
  [27, 'Achraf Hakimi', '🇲🇦', 'RB', 'Paris SG', 26, 77, [74, 76, 78, 79, 77], '€65M', 1],
  [28, 'Ousmane Dembélé', '🇫🇷', 'RW', 'Paris SG', 27, 77, [78, 76, 75, 74, 73], '€60M', -1],
  [29, 'Khvicha Kvaratskhelia', '🇬🇪', 'LW', 'Paris SG', 24, 76, [74, 75, 77, 78, 76], '€75M', 1],
  [30, 'Pedri', '🇪🇸', 'CM', 'Barcelona', 22, 76, [73, 75, 76, 78, 79], '€90M', 2],
  [31, 'Gavi', '🇪🇸', 'CM', 'Barcelona', 21, 75, [72, 74, 76, 75, 73], '€80M', -1],
  [32, 'Jules Koundé', '🇫🇷', 'CB', 'Barcelona', 25, 75, [73, 74, 75, 76, 74], '€55M', 0],
  [33, 'Nico Williams', '🇪🇸', 'LW', 'Athletic Bilbao', 22, 75, [72, 74, 76, 77, 78], '€70M', 2],
  [34, 'Xavi Simons', '🇳🇱', 'AM', 'RB Leipzig', 21, 74, [71, 73, 75, 76, 74], '€70M', 1],
  [35, 'Marquinhos', '🇧🇷', 'CB', 'Paris SG', 30, 74, [75, 74, 73, 72, 71], '€40M', -1],
  [36, 'Thibaut Courtois', '🇧🇪', 'GK', 'Real Madrid', 32, 84, [82, 83, 85, 86, 84], '€60M', 1],
  [37, 'Alisson Becker', '🇧🇷', 'GK', 'Liverpool', 31, 83, [81, 82, 84, 83, 82], '€45M', 0],
  [38, 'Ederson', '🇧🇷', 'GK', 'Man City', 31, 81, [79, 80, 82, 81, 80], '€40M', -1],
  [39, 'Manuel Neuer', '🇩🇪', 'GK', 'Bayern Munich', 38, 78, [76, 77, 79, 78, 76], '€8M', -2],
  [40, 'Antoine Griezmann', '🇫🇷', 'ST', 'Atlético Madrid', 33, 78, [77, 78, 79, 76, 75], '€25M', -1],
];

export const players = raw.map(([rank, name, nat, pos, club, age, rating, form, value, change]) => {
  const country = { '🇳🇴': 'Norway', '🇫🇷': 'France', '🇧🇷': 'Brazil', '🏴': 'England', '🇪🇸': 'Spain', '🇦🇷': 'Argentina', '🇪🇬': 'Egypt', '🇧🇪': 'Belgium', '🇩🇪': 'Germany', '🇳🇬': 'Nigeria', '🇵🇹': 'Portugal', '🇺🇾': 'Uruguay', '🇳🇱': 'Netherlands', '🇸🇪': 'Sweden', '🇲🇦': 'Morocco', '🇬🇪': 'Georgia' }[nat] || nat;
  const league = { 'Man City': 'Premier League', 'Real Madrid': 'La Liga', 'Liverpool': 'Premier League', 'Arsenal': 'Premier League', 'Bayern Munich': 'Bundesliga', 'Barcelona': 'La Liga', 'Inter Miami': 'MLS', 'Galatasaray': 'Süper Lig', 'AC Milan': 'Serie A', 'Atlético Madrid': 'La Liga', 'Leverkusen': 'Bundesliga', 'Chelsea': 'Premier League', 'Newcastle': 'Premier League', 'Paris SG': 'Ligue 1', 'Athletic Bilbao': 'La Liga', 'RB Leipzig': 'Bundesliga' }[club] || 'Other';
  return {
    id: rank, rank, name, nat, country, pos, club, league, age, rating, form, value, change,
    potential: Math.min(99, rating + (age < 24 ? 6 : age < 29 ? 1 : -3)),
    wage: `€${Math.max(50, Math.round(rating * 2.2))}0K / week`,
    contractExpiry: `30 Jun ${2027 + (rank % 4)}`,
    preferredFoot: rank % 3 === 0 ? 'Left' : 'Right',
    reputation: rating >= 88 ? 'World Class' : rating >= 80 ? 'Worldwide' : rating >= 74 ? 'Continental' : 'National',
    tacticalRole: { ST: 'Advanced Forward', LW: 'Inside Forward', RW: 'Inside Forward', CM: 'Box-to-Box', DM: 'Anchor Man', CAM: 'Advanced Playmaker', AM: 'Advanced Playmaker', CB: 'Ball-Playing Defender', RB: 'Attacking Full-back', LB: 'Attacking Full-back', GK: 'Sweeper Keeper' }[pos] || 'Versatile',
    availability: rank % 9 === 0 ? 'Transfer Listed' : rank % 5 === 0 ? 'Will Consider Offers' : 'Not for Sale',
    keyAttributes: attrsFor(pos, rank * 7),
    career: [
      { season: '2023/24', club, apps: 34 + (rank % 5), goals: pos === 'GK' ? 0 : Math.max(2, 28 - rank), assists: pos === 'GK' ? 0 : Math.max(1, 14 - Math.floor(rank / 2)) },
      { season: '2022/23', club: rank % 6 === 0 ? 'Previous Club' : club, apps: 30 + (rank % 6), goals: pos === 'GK' ? 0 : Math.max(1, 24 - rank), assists: pos === 'GK' ? 0 : Math.max(0, 11 - Math.floor(rank / 2)) },
    ],
    recentResults: rank % 2 === 0 ? ['W', 'W', 'D', 'W', 'W'] : ['W', 'D', 'W', 'L', 'W'],
  };
});

export const leagues = [
  { league: 'Premier League', country: 'England', strength: 96, knowledge: 88, topClubs: ['Man City', 'Arsenal', 'Liverpool', 'Man Utd'] },
  { league: 'La Liga', country: 'Spain', strength: 94, knowledge: 74, topClubs: ['Real Madrid', 'Barcelona', 'Atlético Madrid'] },
  { league: 'Bundesliga', country: 'Germany', strength: 90, knowledge: 66, topClubs: ['Bayern Munich', 'Leverkusen', 'RB Leipzig'] },
  { league: 'Serie A', country: 'Italy', strength: 88, knowledge: 58, topClubs: ['Inter Milan', 'AC Milan', 'Juventus'] },
  { league: 'Ligue 1', country: 'France', strength: 85, knowledge: 52, topClubs: ['Paris SG', 'Monaco'] },
  { league: 'Süper Lig', country: 'Turkey', strength: 74, knowledge: 34, topClubs: ['Galatasaray', 'Fenerbahçe'] },
  { league: 'Eredivisie', country: 'Netherlands', strength: 76, knowledge: 41, topClubs: ['Ajax', 'PSV'] },
  { league: 'Primeira Liga', country: 'Portugal', strength: 78, knowledge: 45, topClubs: ['Benfica', 'Porto', 'Sporting CP'] },
  { league: 'Brasileirão', country: 'Brazil', strength: 79, knowledge: 30, topClubs: ['Flamengo', 'Palmeiras'] },
  { league: 'MLS', country: 'USA', strength: 68, knowledge: 22, topClubs: ['Inter Miami', 'LAFC'] },
];

export const wonderkids = [
  { name: 'Lamine Yamal', age: 17, pos: 'RW', club: 'Barcelona', potential: 96 },
  { name: 'Warren Zaïre-Emery', age: 20, pos: 'CM', club: 'Paris SG', potential: 92 },
  { name: 'Florian Wirtz', age: 21, pos: 'CAM', club: 'Leverkusen', potential: 94 },
  { name: 'Jamal Musiala', age: 21, pos: 'AM', club: 'Bayern Munich', potential: 93 },
  { name: 'Gavi', age: 21, pos: 'CM', club: 'Barcelona', potential: 90 },
  { name: 'Endrick', age: 19, pos: 'ST', club: 'Real Madrid', potential: 91 },
];

export const transferActivity = [
  { headline: 'Real Madrid complete signing of Endrick', detail: 'The Brazilian forward joins on a long-term deal from Palmeiras.', time: '3 hours ago', tag: 'Completed' },
  { headline: 'Bayern Munich enquire about Ousmane Dembélé', detail: 'Initial contact made as Bayern look to strengthen the wide areas in January.', time: '6 hours ago', tag: 'Rumour' },
  { headline: 'Chelsea reject Saudi bid for Cole Palmer', detail: 'Chelsea have knocked back an approach worth a reported £120M.', time: '9 hours ago', tag: 'Rejected' },
  { headline: 'Liverpool open talks over Alexander Isak', detail: 'Discussions are at an early stage over a potential summer move.', time: '1 day ago', tag: 'Rumour' },
];
