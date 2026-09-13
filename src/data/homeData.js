import { players as roster } from './roster.js';

const NAT_COUNTRY = { '🇨🇲': 'Cameroon', '🇵🇹': 'Portugal', '🏴': 'England', '🇦🇷': 'Argentina', '🇩🇰': 'Denmark', '🇹🇷': 'Turkey', '🇸🇪': 'Sweden', '🇺🇾': 'Uruguay', '🇳🇱': 'Netherlands', '🇧🇷': 'Brazil' };

function attrsForPos(pos, seed) {
  const s = seed;
  if (pos === 'GK') return { 'Saves': 78 + s % 15, 'Distribution': 70 + s % 20, 'Clean Sheets': 60 + s % 20 };
  if (pos === 'MC' || pos === 'DM') return { 'Passing': 80 + s % 14, 'Vision': 76 + s % 18, 'Work Rate': 78 + s % 15 };
  if (pos.startsWith('D')) return { 'Tackling': 78 + s % 15, 'Positioning': 76 + s % 15, 'Build-up': 68 + s % 20 };
  if (pos.startsWith('AM')) return { 'Passing': 82 + s % 14, 'Chance Creation': 80 + s % 16, 'Dribbling': 78 + s % 16 };
  return { 'Finishing': 78 + s % 18, 'Pace': 80 + s % 15, 'Off The Ball': 76 + s % 18 };
}

export function mapRosterPlayer(rp) {
  const rating = rp.ovr ?? Math.min(94, Math.round(rp.rate * 11.6));
  const seed = rp.id * 13;
  return {
    id: `own-${rp.id}`, name: rp.name, nat: rp.nat, country: NAT_COUNTRY[rp.nat] || rp.nat,
    pos: rp.displayPos || rp.pos, club: 'Man Utd', age: rp.age ?? (20 + (rp.id % 12)), rating,
    form: rp.form ? rp.form.map(f => Math.round(f * 12.5)) : [rating - 3, rating - 1, rating, rating + 1, rating - 2],
    value: rp.value ? `£${(Number(rp.value.replace(/[^0-9]/g, '')) / 1000000).toFixed(0)}M` : `€${Math.max(8, Math.round(rating * 1.3))}M`,
    change: rp.id % 3 === 0 ? 1 : rp.id % 5 === 0 ? -1 : 0,
    potential: Math.min(96, rating + 4), wage: rp.wage || `€${Math.max(40, rating * 1.8).toFixed(0)}K / week`,
    contractExpiry: rp.contract || `30 Jun ${2027 + (rp.id % 4)}`, preferredFoot: rp.id % 2 === 0 ? 'Right' : 'Left',
    reputation: rating >= 85 ? 'World Class' : rating >= 78 ? 'Worldwide' : 'Continental',
    tacticalRole: rp.roleLabel || rp.role, availability: rp.availability === 'Injured' ? 'Injured' : 'Not for Sale',
    keyAttributes: attrsForPos(rp.pos, seed),
    career: [{ season: '2025/26', club: 'Man Utd', apps: 14 + (rp.id % 4), goals: rp.pos === 'ST' ? 9 : rp.pos.startsWith('AM') ? 5 : 1, assists: rp.pos.startsWith('AM') || rp.pos === 'MC' ? 6 : 2 }],
    recentResults: ['W', 'W', 'D', 'W', 'W'], isOwn: true, fit: rp.fit,
  };
}

export const todaysSchedule = [
  { time: '10:00', kind: 'training', title: 'Training Session', sub: 'First Team' },
  { time: '12:00', kind: 'meeting', title: 'Team Meeting', sub: 'All Staff' },
  { time: '14:30', kind: 'prep', title: 'Match Prep', sub: 'Tactical & Set Pieces' },
  { time: '15:00', kind: 'match', title: 'Liverpool vs Man Utd', sub: 'Premier League' },
  { time: '18:00', kind: 'training', title: 'Youth Training', sub: 'U18 Squad' },
];

export const matchPreparation = {
  percent: 92,
  checklist: ['Tactics Ready', 'Team Selection', 'Set Pieces', 'Opposition Analysis'],
};

export const squadSnapshot = {
  morale: 82, fitness: 88, formRating: 7.5,
  injuries: [{ name: 'Lisandro Martínez', detail: '3 weeks out', rosterId: 4 }],
  suspensions: [{ name: 'Casemiro', detail: '1 match — accumulated cards', rosterId: 6 }],
  watchlist: [{ name: 'Kobbie Mainoo', detail: 'Dip in form — monitor minutes', rosterId: 7 }, { name: 'Luke Shaw', detail: 'Heavy fixture load', rosterId: 5 }],
  returning: [{ name: 'Rasmus Højlund', detail: 'Back in full training', rosterId: 11 }],
};

export const quickSimOptions = [
  { key: 'day', label: 'Simulate Day' },
  { key: 'week', label: 'Simulate Week' },
  { key: 'month', label: 'Simulate Month' },
  { key: 'nextMatch', label: 'Continue to Next Match' },
];
