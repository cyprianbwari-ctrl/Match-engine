// Shared seed data for Communications (Inbox / Calendar / News). Everything
// is derived from here via CommunicationContext so the three tabs, and the
// links out to Squad / Staff / Transfers / Competitions / Finance, stay
// consistent with each other.

export const TAG_COLORS = {
  Player: '#8a6bff', Staff: '#4d9dff', Transfer: '#3ddc84', Medical: '#ff5d5d',
  Scouting: '#b06bff', Board: '#e8b23d', Media: '#4da6ff', Competition: '#26c1a4',
  Youth: '#ff6bcf', Contracts: '#4d9dff', Team: '#3ddc84',
};

export const initialInboxMessages = [
  {
    id: 1, sender: 'Bruno Fernandes', kind: 'player', tag: 'Player', time: '09:42', date: 'Today', unread: true,
    subject: 'Request for more playtime',
    preview: 'I would like to discuss my role in the team and my game time going forward.',
    body: 'Gaffer, I wanted to talk about my role in the squad. I feel I can offer more if I get consistent minutes in my preferred position. Can we find time to discuss this?',
    actions: ['Reply', 'View Player'], link: { screen: 'Squad' },
  },
  {
    id: 2, sender: 'Erik ten Hag', kind: 'staff', tag: 'Staff', time: '08:30', date: 'Today', unread: true,
    subject: 'Training report – Team',
    preview: 'Here is the latest training report on the squad ahead of the weekend.',
    body: 'Overall fitness levels are strong across the squad. A couple of players are carrying knocks — worth checking with the medical team before selection.',
    actions: ['Reply', 'View Staff'], link: { screen: 'Staff' },
  },
  {
    id: 3, sender: 'FC Barcelona', kind: 'club', tag: 'Transfer', time: 'Yesterday', date: 'Yesterday', unread: true,
    subject: 'Transfer offer for Alejandro Garnacho',
    preview: 'Barcelona have submitted a bid of €70M for Alejandro Garnacho.',
    body: 'FC Barcelona have formally submitted an offer of €70,000,000 plus add-ons for Alejandro Garnacho. They are requesting a response within 7 days.',
    actions: ['Accept', 'Reject', 'View Transfer'], link: { screen: 'Transfers' },
  },
  {
    id: 4, sender: 'Club Doctor', kind: 'medical', tag: 'Medical', time: 'Yesterday', date: 'Yesterday', unread: true,
    subject: 'Injury update – Lisandro Martínez',
    preview: 'Lisandro Martínez is expected to be out for 2–3 weeks with a knee issue.',
    body: 'Scan results confirm a minor knee ligament strain. Expected return: 2–3 weeks. Recommend light individual training only for now.',
    actions: ['View Player', 'View Staff'], link: { screen: 'Staff' },
  },
  {
    id: 5, sender: 'Chief Scout', kind: 'scouting', tag: 'Scouting', time: '12 Dec', date: '12 Dec', unread: true,
    subject: 'Scouting report – South America',
    preview: 'We have identified 3 potential targets in the region worth tracking.',
    body: 'Our scouting network in South America has flagged three promising prospects. Full reports and reputational grades are attached in the Scouting hub.',
    actions: ['View Scouting Report'], link: { screen: 'Scouting' },
  },
  {
    id: 6, sender: 'Board', kind: 'board', tag: 'Board', time: '12 Dec', date: '12 Dec', unread: true,
    subject: 'Monthly financial update',
    preview: 'The board would like to provide you with an update on club finances.',
    body: 'Revenue is tracking ahead of forecast this month. The board remains supportive of the January transfer budget as previously agreed.',
    actions: ['View Finances'], link: { screen: 'Finance' },
  },
  {
    id: 7, sender: 'Media', kind: 'media', tag: 'Media', time: '11 Dec', date: '11 Dec', unread: false,
    subject: 'Press conference invitation',
    preview: 'You are invited to the pre-match press conference on Friday at 10:00.',
    body: 'Please confirm your attendance for the pre-match press conference. Topics likely to include team news and the upcoming fixture list.',
    actions: ['Accept', 'Reply'], link: { screen: 'Communications', tab: 'calendar' },
  },
  {
    id: 8, sender: 'UEFA', kind: 'competition', tag: 'Competition', time: '10 Dec', date: '10 Dec', unread: false,
    subject: 'Champions League draw confirmed',
    preview: 'Your club has been drawn against Bayern Munich, Inter Milan and Real Sociedad.',
    body: 'The league phase draw has been finalised. Full fixture dates and kickoff times are now available in the Continental section.',
    actions: ['View Competition'], link: { screen: 'Competitions', tab: 'continental' },
  },
  {
    id: 9, sender: 'Youth Team', kind: 'youth', tag: 'Youth', time: '10 Dec', date: '10 Dec', unread: false,
    subject: 'U18 match result',
    preview: 'Manchester United U18 2 - 1 Aston Villa U18.',
    body: 'A strong performance from the youth side, with two second-half goals sealing the win. Several players caught the eye of the academy staff.',
    actions: ['View Staff'], link: { screen: 'Staff', tab: 'coaching' },
  },
];

export const calendarDays = [
  { key: '14-sat', dow: 'SAT', dom: 14 }, { key: '15-sun', dow: 'SUN', dom: 15 },
  { key: '16-mon', dow: 'MON', dom: 16 }, { key: '17-tue', dow: 'TUE', dom: 17 },
  { key: '18-wed', dow: 'WED', dom: 18 }, { key: '19-thu', dow: 'THU', dom: 19 },
  { key: '20-fri', dow: 'FRI', dom: 20 },
];

export const calendarEventsByDay = {
  '14-sat': [
    { time: '10:00', title: 'Press Conference', place: 'Old Trafford', tag: 'Media', icon: 'mic' },
    { time: '12:00', title: 'Player Meeting', place: 'Carrington', tag: 'Team', icon: 'users' },
    { time: '14:30', title: 'Board Meeting', place: 'Old Trafford', tag: 'Board', icon: 'users' },
    { time: '16:00', title: 'Contract Meeting – De Ligt', place: 'Carrington', tag: 'Contracts', icon: 'file' },
    { time: '18:00', title: 'Transfer Negotiation Call', place: 'London', tag: 'Transfers', icon: 'phone' },
    { time: '20:00', title: 'Staff Interview', place: 'Online', tag: 'Staff', icon: 'users' },
  ],
  '15-sun': [
    { time: '11:00', title: 'Media Interview – Sky Sports', place: 'Old Trafford', tag: 'Media', icon: 'mic' },
  ],
  '16-mon': [],
  '17-tue': [
    { time: '09:30', title: 'Board Call – Budget Review', place: 'Remote', tag: 'Board', icon: 'users' },
  ],
  '18-wed': [
    { time: '15:00', title: 'Contract Meeting – Rashford', place: 'Carrington', tag: 'Contracts', icon: 'file' },
  ],
  '19-thu': [],
  '20-fri': [
    { time: '10:00', title: 'Pre-match Press Conference', place: 'Old Trafford', tag: 'Media', icon: 'mic' },
  ],
};

export const newsItems = [
  {
    id: 'n1', category: 'Club News', bucket: 'Club News', time: '2 hours ago', crest: 'Man Utd',
    headline: 'Amad Diallo wins Player of the Month',
    body: 'Amad Diallo has been named Manchester United Player of the Month for November, following a string of impressive performances.',
    link: { screen: 'Squad' },
  },
  {
    id: 'n2', category: 'Transfer News', bucket: 'Club News', time: '4 hours ago', crest: 'Real Madrid',
    headline: 'Real Madrid interested in Mainoo',
    body: 'Reports suggest Real Madrid have made contact with Manchester United over a potential deal for Kobbie Mainoo.',
    link: { screen: 'Transfers' },
  },
  {
    id: 'n3', category: 'Football News', bucket: 'Football News', time: '6 hours ago', crest: 'Man City',
    headline: 'Man City close in on January signing',
    body: 'Manchester City are reportedly set to complete the signing of an England international in January.',
    link: { screen: 'Scouting' },
  },
  {
    id: 'n4', category: 'Media', bucket: 'Media', time: '8 hours ago', crest: 'Man Utd', tweet: true, handle: '@ManUtd_Rashford', engagement: { likes: '12.4k', retweets: '2.1k', replies: '890' },
    headline: 'Rashford speaks about his future',
    body: 'Marcus Rashford has hinted that he is happy at Manchester United and wants to remain at the club long-term.',
    link: { screen: 'Squad' },
  },
  {
    id: 'n5', category: 'Competition', bucket: 'Club News', time: '10 hours ago', crest: 'UCL',
    headline: 'Champions League: Group stage draw',
    body: 'Manchester United have been drawn in Group A alongside Bayern Munich, Inter Milan and Galatasaray.',
    link: { screen: 'Competitions', tab: 'continental' },
  },
  {
    id: 'n6', category: 'Fans', bucket: 'Media', time: '12 hours ago', crest: 'Fans', tweet: true, handle: '@RedArmyDaily', engagement: { likes: '3.4k', retweets: '640', replies: '512' },
    headline: 'United fans back Ten Hag',
    body: 'Supporters have shown their backing for Erik ten Hag following the club\u2019s recent results and performances.',
    link: { screen: 'Staff' },
  },
];
