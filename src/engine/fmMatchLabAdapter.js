// FAMILY 26 — FM Match Lab v1.4 inspired tactical model adapter.
//
// This module contains a clean-room representation of the tactical data
// decoded from the user-supplied .fmf file. It does not execute or embed
// proprietary engine code. The numeric ranges are used as tactical inputs
// for FAMILY 26's own simulation model.

import { SQUAD_SELECTION_WEIGHTS, readinessScore, aiRotationNeed, eventFamilyFromAction, pickContextualCommentary } from './fmTweakV13.js';

export const FM_MATCH_LAB_VERSION = '23.1.8';
export { SQUAD_SELECTION_WEIGHTS, readinessScore, aiRotationNeed, eventFamilyFromAction, pickContextualCommentary };

const STYLE_DATA = {
  CONTROL_POSSESSION: {
    attacking:[11,15], depth:[4,8], directness:[4,8], fluidity:[10,16], closingDown:[15,19], tempo:[6,10], width:[10,14],
    tendencies:{playOut:10, workBox:10, press:10, counterPress:10}, favoured:['Passing','Composure','Vision']
  },
  GEGENPRESS: {
    attacking:[11,15], depth:[1,5], directness:[8,12], fluidity:[10,16], closingDown:[18,20], tempo:[18,20], width:[5,9],
    tendencies:{counter:13, manMark:10, holdLine:13, press:15, counterPress:15}, favoured:['Stamina','Acceleration','Dribbling']
  },
  TIKI_TAKA: {
    attacking:[11,15], depth:[1,5], directness:[1,5], fluidity:[14,20], closingDown:[18,20], tempo:[1,5], width:[5,9],
    tendencies:{setPieces:1, counter:1, playOut:13, holdLine:10, crosses:1, workBox:13, press:13, counterPress:13}, favoured:['Composure','Passing','Flair']
  },
  VERTICAL_TIKI_TAKA: {
    attacking:[8,12], depth:[5,9], directness:[4,8], fluidity:[12,18], closingDown:[14,18], tempo:[4,8], width:[1,5],
    tendencies:{setPieces:1, counter:1, playOut:13, holdLine:10, crosses:1, underlap:10, workBox:13, press:13, counterPress:13}, favoured:['Vision','Technique','Stamina']
  },
  WING_PLAY: {
    attacking:[8,12], depth:[10,14], directness:[12,16], fluidity:[7,13], closingDown:[4,8], tempo:[13,17], width:[18,20],
    tendencies:{crosses:13, underlap:1, overlap:13, flanks:13}, favoured:['Dribbling','Crossing','Anticipation']
  },
  ROUTE_ONE: {
    attacking:[5,9], depth:[15,19], directness:[18,20], fluidity:[7,13], closingDown:[6,10], tempo:[10,14], width:[4,8],
    tendencies:{setPieces:13, playOut:1, crosses:13, workBox:1}, favoured:['Strength','Set Piece Ability','Aggression']
  },
  FLUID_COUNTER_ATTACK: {
    attacking:[5,9], depth:[15,19], directness:[4,8], fluidity:[12,18], closingDown:[4,8], tempo:[10,14], width:[4,8],
    tendencies:{counter:13, press:1, counterPress:1}, favoured:['Pace','Work Rate','Technique']
  },
  DIRECT_COUNTER_ATTACK: {
    attacking:[5,9], depth:[15,19], directness:[13,17], fluidity:[4,10], closingDown:[4,8], tempo:[10,14], width:[8,12],
    tendencies:{setPieces:13, counter:13, playOut:1, crosses:13, workBox:1, press:1, counterPress:1}, favoured:['Work Rate','Pace','Strength']
  },
  CATENACCIO: {
    attacking:[1,5], depth:[15,19], directness:[13,17], fluidity:[3,9], closingDown:[3,7], tempo:[1,4], width:[4,8],
    tendencies:{setPieces:10, manMark:10, holdLine:1, press:1, counterPress:1, preventCross:1}, favoured:['Concentration','Positioning','Set Piece Ability']
  },
  PARK_THE_BUS: {
    attacking:[1,5], depth:[18,20], directness:[8,12], fluidity:[1,7], closingDown:[1,5], tempo:[1,4], width:[6,10],
    tendencies:{setPieces:10, manMark:1, holdLine:1, press:1, counterPress:1, preventCross:1}, favoured:['Teamwork','Work Rate','Aggression']
  }
};

const STYLE_ALIASES = {
  'Control Possession':'CONTROL_POSSESSION', 'Gegenpress':'GEGENPRESS', 'Tiki-Taka':'TIKI_TAKA',
  'Vertical Tiki-Taka':'VERTICAL_TIKI_TAKA', 'Wing Play':'WING_PLAY', 'Route One':'ROUTE_ONE',
  'Fluid Counter-Attack':'FLUID_COUNTER_ATTACK', 'Direct Counter-Attack':'DIRECT_COUNTER_ATTACK',
  'Catenaccio':'CATENACCIO', 'Park the Bus':'PARK_THE_BUS'
};

const mid = r => (r[0] + r[1]) / 2;
const scale20 = value => Math.round(((value - 1) / 19) * 100);

export function getFMStyle(style) {
  const key = STYLE_ALIASES[style] || style || 'CONTROL_POSSESSION';
  return STYLE_DATA[key] || STYLE_DATA.CONTROL_POSSESSION;
}

export function buildTacticalModel(tactics = {}) {
  const style = getFMStyle(tactics.tacticalStyle || tactics.style || tactics.tactical_style);
  const pressing = tactics.pressing?.intensity ?? tactics.pressingIntensity ?? scale20(mid(style.closingDown));
  const tempo = tactics.tempo ?? scale20(mid(style.tempo));
  const width = tactics.width ?? scale20(mid(style.width));
  const directness = tactics.directness ?? scale20(mid(style.directness));
  const defensiveLine = tactics.teamInstructions?.defensiveLine ?? tactics.defensiveLine ?? 50 + (10 - mid(style.depth)) * 3.2;
  return {
    style,
    styleName: STYLE_ALIASES[tactics.tacticalStyle] ? tactics.tacticalStyle : 'Control Possession',
    tempo: Math.max(1, Math.min(100, tempo)),
    width: Math.max(1, Math.min(100, width)),
    directness: Math.max(1, Math.min(100, directness)),
    pressing: { intensity: Math.max(1, Math.min(100, pressing)) },
    defensiveLine: Math.max(10, Math.min(90, defensiveLine)),
    fluidity: scale20(mid(style.fluidity)),
    attacking: scale20(mid(style.attacking)),
    tendencies: style.tendencies,
    favouredAttributes: style.favoured,
  };
}

export function styleEffect(tactics = {}) {
  const m = buildTacticalModel(tactics);
  return {
    shortPassing: 1 - m.directness / 180,
    forwardPassing: m.directness / 100,
    runFrequency: 0.55 + m.fluidity / 220,
    pressFrequency: m.pressing.intensity / 100,
    width: m.width / 100,
    tempo: m.tempo / 100,
    counterAttack: m.tendencies.counter ? 0.55 + m.tendencies.counter / 40 : 0.25,
    crossFrequency: m.tendencies.crosses ? m.tendencies.crosses / 20 : 0.25,
    overlapFrequency: m.tendencies.overlap ? m.tendencies.overlap / 20 : 0.25,
    underlapFrequency: m.tendencies.underlap ? m.tendencies.underlap / 20 : 0.25,
    workBox: m.tendencies.workBox ? m.tendencies.workBox / 20 : 0.5,
  };
}

export { STYLE_DATA };
