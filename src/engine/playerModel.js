// FAMILY 26 — AUTHORITATIVE PLAYER MODEL
// Database identity is immutable source data; live state is the single mutable
// career layer. Every consumer should receive this assembled object.

export const PLAYER_MODEL_VERSION = 1;

export function buildAuthoritativePlayer(base = {}, live = {}, overrides = {}) {
  const attributes = {
    ...(base.attributes || {}),
    ...(live.trainingAttributes || {}),
    ...(overrides.attributes || {}),
  };
  return {
    modelVersion: PLAYER_MODEL_VERSION,
    identity: {
      id: base.id ?? overrides.id,
      uid: base.uid ?? overrides.uid ?? null,
      personId: base.personId ?? overrides.personId ?? null,
      name: base.name ?? overrides.name ?? 'Unknown Player',
      nation: base.nation ?? base.nat ?? overrides.nation ?? null,
      dateOfBirth: base.dateOfBirth ?? null,
    },
    attributes,
    vector51: live.vector51 || base.vector51 || null,
    position: {
      primary: base.position ?? base.pos ?? null,
      positions: base.positions || [base.position].filter(Boolean),
      role: live.tacticalRole ?? base.tacticalRole ?? base.role ?? null,
    },
    club: {
      id: base.clubId ?? null,
      name: base.club ?? null,
      league: base.league ?? null,
      competitionId: base.competitionId ?? null,
    },
    contract: {
      expiry: base.contractExpiry ?? base.contract ?? null,
      wage: base.wage ?? null,
      wageValue: base.wageValue ?? null,
      value: base.value ?? null,
      valueNumber: base.valueNumber ?? null,
      history: live.contractHistory || [],
    },
    fitness: {
      current: Math.round(live.fitness ?? base.fit ?? 80),
      sharpness: Math.round(live.sharpness ?? 80),
      fatigue: Math.round(live.fatigue ?? 0),
      injury: live.injury ?? null,
      suspension: live.suspension ?? null,
      available: live.injury ? false : !(live.suspension?.matchesRemaining > 0),
    },
    morale: {
      overall: live.morale ?? base.morale ?? 'Good',
      happiness: Math.round(live.happiness ?? 75),
      relationships: live.relationships || { manager: 70, teammates: 72, club: 65, agent: 60 },
    },
    form: live.form || base.form || [7, 7, 7, 7],
    training: {
      progress: live.trainingProgress ?? 0,
      developmentTrend: live.developmentTrend ?? 'Stable',
      attributes: live.trainingAttributes || {},
    },
    careerStats: live.careerStats || {},
    seasonStats: live.seasonStats || {},
    tacticalRole: live.tacticalRole ?? base.tacticalRole ?? base.role ?? null,
    visualProfile: {
      ...(base.visualProfile || {}),
      ...(live.visualProfile || {}),
    },
    ca: Math.round(live.currentAbility ?? base.ca ?? base.ovr ?? 0),
    pa: Math.round(base.pa ?? base.potential ?? 0),
    rating: live.avgRating ?? base.rate ?? base.rating ?? null,
    personality: live.personality || base.personality || null,
    agent: live.agent || base.agent || null,
    source: base.source || 'family26-canonical-database',
  };
}

export function playerForUi(base, live, overrides = {}) {
  const p = buildAuthoritativePlayer(base, live, overrides);
  return {
    ...base,
    ...overrides,
    id: p.identity.id,
    uid: p.identity.uid,
    name: p.identity.name,
    nation: p.identity.nation,
    nat: p.identity.nation,
    position: p.position.primary,
    positions: p.position.positions,
    tacticalRole: p.position.role,
    club: p.club.name,
    clubId: p.club.id,
    attributes: p.attributes,
    vector51: p.vector51,
    ovr: p.ca,
    ca: p.ca,
    pa: p.pa,
    fit: p.fitness.current,
    sharpness: p.fitness.sharpness,
    fatigue: p.fitness.fatigue,
    injury: p.fitness.injury,
    suspension: p.fitness.suspension,
    isAvailable: p.fitness.available,
    morale: p.morale.overall,
    happiness: p.morale.happiness,
    form: p.form,
    developmentTrend: p.training.developmentTrend,
    trainingProgress: p.training.progress,
    seasonStats: p.seasonStats,
    careerStats: p.careerStats,
    personality: p.personality,
    agent: p.agent,
    contractHistory: p.contract.history,
    visualProfile: p.visualProfile,
    authoritative: p,
  };
}
