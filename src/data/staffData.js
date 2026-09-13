// Shared data + constants for the Staff HQ. Kept as plain JS so it can be
// imported by both Staff.jsx and Scouting.jsx (scout assignments are shared).

export const COACH_CATEGORIES = ['Assistant Manager', 'Coaches', 'Fitness Coaches', 'Goalkeeping Coaches', 'Youth Coaches', 'Set-Piece Coaches'];
export const MEDICAL_CATEGORIES = ['Head Physio', 'Physiotherapists', 'Sports Scientists', 'Doctors', 'Rehabilitation Specialists'];
export const SCOUT_CATEGORIES = ['Chief Scout', 'Scouts', 'Recruitment Analysts', 'Data Analysts', 'Youth Scouts'];

export const COACH_ATTRS = ['coaching', 'attacking', 'defending', 'technical', 'tactical', 'fitness', 'goalkeeping', 'mental', 'youthDevelopment'];
export const MEDICAL_ATTRS = ['medical', 'physiotherapy', 'sportsScience', 'rehabilitation', 'workRate', 'mental'];
export const SCOUT_ATTRS = ['judgingAbility', 'judgingPotential', 'tacticalKnowledge', 'countryKnowledge', 'leagueKnowledge', 'adaptability'];

export const ATTR_LABELS = {
  coaching: 'Coaching', attacking: 'Attacking', defending: 'Defending', technical: 'Technical', tactical: 'Tactical',
  fitness: 'Fitness', goalkeeping: 'Goalkeeping', mental: 'Mental', youthDevelopment: 'Youth Development',
  medical: 'Medical', physiotherapy: 'Physiotherapy', sportsScience: 'Sports Science', rehabilitation: 'Rehabilitation', workRate: 'Work Rate',
  judgingAbility: 'Judging Player Ability', judgingPotential: 'Judging Player Potential', tacticalKnowledge: 'Tactical Knowledge',
  countryKnowledge: 'Knowledge of Countries', leagueKnowledge: 'Knowledge of Leagues', adaptability: 'Adaptability'
};

export const TRAINING_GROUPS = ['First Team', 'U23', 'U18', 'Goalkeepers'];
export const TRAINING_AREAS = ['Attacking', 'Defending', 'Fitness', 'Set Pieces', 'Match Preparation', 'Individual Development'];
export const MEDICAL_RESPONSIBILITIES = ['First-Team Physio', 'Injury Prevention', 'Rehabilitation Lead', 'Fitness Testing', 'Matchday Cover', 'Youth Medical'];

export const DEPT_ATTRS = { Coaching: COACH_ATTRS, Medical: MEDICAL_ATTRS, Scouting: SCOUT_ATTRS };

function attrSet(keys, base) {
  return Object.fromEntries(keys.map((k, i) => [k, Math.max(35, Math.min(99, base + (((i * 11) % 19) - 9)))]));
}

function mk(id, name, dept, category, nat, age, contract, rating, color, extra = {}) {
  const keys = DEPT_ATTRS[dept] || COACH_ATTRS;
  const base = Math.round(rating * 20);
  return {
    id, name, dept, category, role: category, title: category, nat, age, contract, rating, color,
    club: 'Manchester United', status: 'Active', wage: 900 + base * 90 + (id % 5) * 200,
    workload: 30 + ((id * 17) % 60), attributes: attrSet(keys, base), assignment: null,
    ...extra
  };
}

export const initialStaff = [
  mk(1, 'Rúben Amorim', 'Coaching', 'Manager', '🇵🇹', 39, '30 Jun 2027', 4.5, 'purple', { formation: '4-2-3-1', style: 'Attacking', bio: 'Rúben Amorim is a highly regarded manager known for his tactical intelligence and player development.' }),
  mk(2, 'Pep Guardiola', 'Coaching', 'Assistant Manager', '🇪🇸', 53, '30 Jun 2026', 4.5, 'blue'),
  mk(3, 'Rui Faria', 'Coaching', 'Coaches', '🇵🇹', 45, '30 Jun 2026', 4.0, 'green'),
  mk(4, 'Carlos Queiroz', 'Coaching', 'Goalkeeping Coaches', '🇮🇷', 72, '30 Jun 2026', 3.5, 'cyan'),
  mk(5, 'Jason Tindall', 'Coaching', 'Coaches', '🏴', 43, '30 Jun 2026', 3.0, 'blue'),
  mk(6, 'Chris Armas', 'Coaching', 'Coaches', '🇺🇸', 42, '30 Jun 2026', 3.5, 'orange'),
  mk(7, 'Iñaki Caña', 'Coaching', 'Fitness Coaches', '🇪🇸', 37, '30 Jun 2026', 3.5, 'purple'),
  mk(8, 'Frederic Hebert', 'Medical', 'Physiotherapists', '🇫🇷', 41, '30 Jun 2026', 3.0, 'pink'),
  mk(9, 'Steve McClaren', 'Scouting', 'Scouts', '🏴', 63, '30 Jun 2026', 3.0, 'blue'),
  mk(10, 'Javier Ribalta', 'Scouting', 'Chief Scout', '🇪🇸', 52, '30 Jun 2027', 3.5, 'blue'),
  mk(11, 'Dr. James Wilson', 'Medical', 'Head Physio', '🏴', 48, '30 Jun 2027', 4.5, 'purple'),
  mk(12, 'Emma Clarke', 'Medical', 'Physiotherapists', '🏴', 34, '30 Jun 2026', 4.0, 'green'),
  mk(13, 'Daniel Roberts', 'Medical', 'Physiotherapists', '🇵🇹', 32, '30 Jun 2026', 4.0, 'green'),
  mk(14, 'Sophia Martinez', 'Medical', 'Physiotherapists', '🇪🇸', 28, '30 Jun 2027', 4.0, 'green'),
  mk(15, 'Lucas Moreira', 'Medical', 'Sports Scientists', '🇧🇷', 41, '30 Jun 2027', 3.5, 'pink'),
  mk(16, "Karen O'Neill", 'Medical', 'Sports Scientists', '🇮🇪', 36, '30 Jun 2026', 3.5, 'pink'),
  mk(17, 'Markus Jensen', 'Medical', 'Rehabilitation Specialists', '🇩🇰', 39, '30 Jun 2026', 3.5, 'gold'),
  mk(18, 'Daniel Harris', 'Scouting', 'Chief Scout', '🏴', 54, '30 Jun 2027', 4.5, 'purple'),
  mk(19, 'Marco Silva', 'Scouting', 'Scouts', '🇵🇹', 42, '30 Jun 2026', 4.0, 'green'),
  mk(20, 'Sophie Lambert', 'Scouting', 'Scouts', '🇫🇷', 38, '30 Jun 2026', 4.0, 'green'),
  mk(21, 'Carlos Mendes', 'Scouting', 'Scouts', '🇧🇷', 36, '30 Jun 2027', 4.0, 'green'),
  mk(22, 'Kenji Tanaka', 'Scouting', 'Scouts', '🇯🇵', 34, '30 Jun 2026', 4.0, 'green'),
  mk(23, 'Rasmus Højlund', 'Scouting', 'Scouts', '🇩🇰', 32, '30 Jun 2026', 3.5, 'green'),
  mk(24, 'Lukas Weber', 'Scouting', 'Scouts', '🇩🇪', 29, '30 Jun 2026', 3.5, 'green'),
  mk(25, 'Fatou Diop', 'Scouting', 'Scouts', '🇸🇳', 31, '30 Jun 2027', 3.5, 'green'),
  mk(26, 'Nuno Moreira', 'Coaching', 'Youth Coaches', '🇵🇹', 38, '30 Jun 2026', 4.0, 'cyan'),
  mk(27, 'Filippo Galli', 'Coaching', 'Youth Coaches', '🇮🇹', 42, '30 Jun 2026', 3.5, 'cyan'),
  mk(28, 'Samir El Hadji', 'Coaching', 'Youth Coaches', '🇫🇷', 39, '30 Jun 2026', 3.5, 'cyan'),
];

// Desired headcount per category — anything short of this is a vacancy and
// feeds the "Recommended Hires" panel + Find Staff shortcut.
export const DESIRED_HEADCOUNT = {
  'Assistant Manager': 1, 'Coaches': 3, 'Fitness Coaches': 2, 'Goalkeeping Coaches': 1, 'Youth Coaches': 3, 'Set-Piece Coaches': 1,
  'Head Physio': 1, 'Physiotherapists': 3, 'Sports Scientists': 2, 'Doctors': 1, 'Rehabilitation Specialists': 1,
  'Chief Scout': 1, 'Scouts': 5, 'Recruitment Analysts': 1, 'Data Analysts': 1, 'Youth Scouts': 2
};

export const STAFF_TYPES = ['Coaching', 'Medical', 'Scouting'];

function cand(id, name, staffType, category, nat, age, club, contractStatus, reputation, wageDemand, availability, extra = {}) {
  const keys = DEPT_ATTRS[staffType] || COACH_ATTRS;
  const base = 55 + reputation * 8;
  return {
    id, name, staffType, dept: staffType, category, role: category, title: category, nat, age, club, contractStatus,
    reputation, wageDemand, availability, attributes: attrSet(keys, base), stage: 'Search',
    personality: extra.personality || 'Professional', ...extra
  };
}

export const candidatePool = [
  cand(101, 'Thierry Dubois', 'Coaching', 'Set-Piece Coaches', '🇫🇷', 47, 'Lille', 'Under Contract', 4, 2400, 'End of Season', { personality: 'Perfectionist' }),
  cand(102, 'Marco Rossi', 'Coaching', 'Set-Piece Coaches', '🇮🇹', 51, 'Unattached', 'Free Agent', 3, 1600, 'Immediate'),
  cand(103, 'Alan Whittle', 'Coaching', 'Fitness Coaches', '🏴', 44, 'Leeds Utd', 'Under Contract', 3, 1900, 'Immediate'),
  cand(104, 'Dr. Priya Nair', 'Medical', 'Doctors', '🏴', 45, 'Unattached', 'Free Agent', 4, 3100, 'Immediate', { personality: 'Calm' }),
  cand(105, 'Dr. Hendrik Voss', 'Medical', 'Doctors', '🇩🇪', 52, 'RB Leipzig', 'Under Contract', 5, 4200, 'End of Season'),
  cand(106, 'Isabela Rocha', 'Scouting', 'Recruitment Analysts', '🇧🇷', 29, 'Unattached', 'Free Agent', 3, 1400, 'Immediate', { personality: 'Analytical' }),
  cand(107, 'Tom Fielding', 'Scouting', 'Data Analysts', '🏴', 27, 'Brentford', 'Under Contract', 4, 1800, 'End of Season', { personality: 'Analytical' }),
  cand(108, 'Yuki Sato', 'Scouting', 'Youth Scouts', '🇯🇵', 33, 'Unattached', 'Free Agent', 3, 1200, 'Immediate'),
  cand(109, 'Emeka Obi', 'Scouting', 'Youth Scouts', '🇳🇬', 36, 'Unattached', 'Free Agent', 3, 1250, 'Immediate'),
  cand(110, 'Helena Kovač', 'Coaching', 'Youth Coaches', '🇭🇷', 40, 'Dinamo Zagreb', 'Under Contract', 4, 2000, 'End of Season', { personality: 'Ambitious' }),
  cand(111, 'Bruno Alves', 'Scouting', 'Scouts', '🇵🇹', 46, 'Unattached', 'Free Agent', 4, 1700, 'Immediate'),
  cand(112, 'Grace Muller', 'Medical', 'Physiotherapists', '🇩🇪', 30, 'Wolfsburg', 'Under Contract', 3, 1500, 'End of Season'),
];

// Scout assignments — shared between the Staff → Scouting Staff tab and the
// Scouting page's Assignments tab.
export const initialScoutAssignments = [
  { id: 1, scout: 'Marco Silva', region: 'Portugal — Primeira Liga', focus: 'U21 players', duration: 30, daysLeft: 18, status: 'In Progress' },
  { id: 2, scout: 'Carlos Mendes', region: 'South America', focus: 'Attacking talent', duration: 45, daysLeft: 40, status: 'In Progress' },
  { id: 3, scout: 'Sophie Lambert', region: 'Europe — Top 5 Leagues', focus: 'Wing-backs', duration: 21, daysLeft: 3, status: 'On Track' },
  { id: 4, scout: 'Kenji Tanaka', region: 'Asia', focus: 'Goalkeepers', duration: 30, daysLeft: 30, status: 'On Track' },
];

export const initialInbox = [
  { id: 1, kind: 'contract', text: 'Pep Guardiola\'s contract expires in under 12 months — begin renewal talks?', status: 'pending' },
  { id: 2, kind: 'vacancy', text: 'No Set-Piece Coach on staff. The board has approved a budget to hire one.', status: 'pending' },
];
