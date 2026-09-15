// Deterministic per-fixture detail — not stored data, but consistent for a
// given fixture so pre-match info (Matchday hub) and post-match revenue
// (Match Engine) agree with each other instead of rolling separately.

const REFEREES = ['Michael Oliver', 'Anthony Taylor', 'Paul Tierney', 'Simon Hooper', 'Craig Pawson', 'Chris Kavanagh'];
const AWAY_GROUNDS = { Tottenham: 'Tottenham Hotspur Stadium', 'Man City': 'Etihad Stadium', Newcastle: "St James' Park", 'West Ham': 'London Stadium', Wolves: 'Molineux Stadium', Arsenal: 'Emirates Stadium', Chelsea: 'Stamford Bridge', Brighton: 'Amex Stadium', Everton: 'Goodison Park', Fulham: 'Craven Cottage' };
const HOME_CAPACITY = 74310;
const HOME_TICKET_AVG = 62; // £ per ticket, blended (general admission + hospitality), for revenue purposes

export function fixtureDetail(fixture, weAreHome) {
  const seed = (fixture?.id || 'lf1').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (salt) => Math.abs(Math.sin(seed + salt));
  const venue = weAreHome ? 'Old Trafford' : (AWAY_GROUNDS[fixture?.home] || `${fixture?.home} Stadium`);
  const capacity = weAreHome ? HOME_CAPACITY : 55000 + Math.round(rand(1) * 20000);
  const attendance = Math.round(capacity * (0.88 + rand(2) * 0.11));
  const referee = REFEREES[Math.floor(rand(3) * REFEREES.length)];
  const weatherOptions = ['16°C, Partly Cloudy', '13°C, Clear', '11°C, Light Rain', '18°C, Overcast'];
  const weather = weatherOptions[Math.floor(rand(4) * weatherOptions.length)];
  return { venue, capacity, attendance, referee, weather };
}

// Home advantage isn't just flavour text — a fuller home end genuinely
// nudges the match engine's mentality/tempo inputs (see Match.jsx), and
// scales matchday revenue directly off real attendance rather than a flat
// random figure.
export function homeMatchdayRevenue(fixture) {
  const detail = fixtureDetail(fixture, true);
  const ticketRevenue = detail.attendance * HOME_TICKET_AVG;
  const hospitalityAndOther = ticketRevenue * 0.35; // merchandise, food, hospitality boxes etc.
  return { amount: Math.round(ticketRevenue + hospitalityAndOther), attendance: detail.attendance, capacity: detail.capacity };
}

export function homeAdvantageFactor(attendance, capacity) {
  const fillRate = capacity ? attendance / capacity : 0.9;
  // A near-full Old Trafford is worth a small but real boost — capped so it
  // never dominates the actual player-quality-driven match model.
  return 1 + Math.min(0.06, fillRate * 0.06);
}
