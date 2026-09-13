import React, { createContext, useContext, useState } from 'react';
import { players as roster } from '../data/roster.js';
import { FORMATIONS } from '../tactics/formations.js';

const TacticsCtx = createContext(null);

export function defaultTeamInstructions() {
  return {
    mentality: "Balanced",
    tempo: 55, width: 55, creativeFreedom: 55, attackingFocus: 50,
    passingStyle: "Mixed Passing", buildUp: "Mixed", crossing: "Mixed Crosses",
    transition: { counterPress: true, quickTransitions: true, regroup: false, counter: false, holdShape: false, distributeFlanks: true },
    defensiveLine: 60, lineOfEngagement: 55, compactness: 60,
    tackling: "Balanced", marking: "Zonal Marking",
    offsideTrap: false, preventShortGK: false, higherDefLine: true, highPress: true,
  };
}
export function defaultPressing() {
  return { trigger: "Full Team Press", intensity: 65, compactness: 60, zone: "Final Third", initiator: "Forwards" };
}

// Squad -> Tactics: pick the best available XI from real squad status
// (availability / playing-time rank) rather than raw roster order.
const PLAYTIME_RANK = { "Key Player": 0, "First Team": 1, "Squad Player": 2, "Rotation": 3, "Backup": 4, "Prospect": 5, "Third Choice": 5, "Youth": 6, "Emergency": 7 };
export function pickStartXI() {
  return [...roster]
    .filter(p => p.availability !== "Injured" && p.availability !== "Suspended")
    .sort((a, b) => (PLAYTIME_RANK[a.playTime] ?? 9) - (PLAYTIME_RANK[b.playTime] ?? 9) || b.ovr - a.ovr)
    .slice(0, 11);
}

export function TacticsProvider({ children }) {
  const [formation, setFormation] = useState("4-2-3-1");
  const [assignment, setAssignment] = useState({});
  const [roleAssignment, setRoleAssignment] = useState({});
  const [dutyAssignment, setDutyAssignment] = useState({});
  const [playerInstructions, setPlayerInstructions] = useState({});
  const [squares, setSquares] = useState([]);
  const [teamInstructions, setTeamInstructions] = useState(defaultTeamInstructions());
  const [pressing, setPressing] = useState(defaultPressing());
  const [tacticalDelegation, setTacticalDelegation] = useState("Manual");
  const [appliedFixKeys, setAppliedFixKeys] = useState(new Set());
  const [autoLog, setAutoLog] = useState([]);
  const [presets, setPresets] = useState([
    { name: "Main — 4-3-3", formation: "4-3-3", teamInstructions: { ...defaultTeamInstructions(), mentality: "Positive" }, pressing: defaultPressing() },
    { name: "Control — 4-2-3-1", formation: "4-2-3-1", teamInstructions: { ...defaultTeamInstructions(), mentality: "Balanced", tempo: 40, width: 45 }, pressing: { ...defaultPressing(), intensity: 45 } },
    { name: "Defensive — 5-4-1", formation: "5-4-1", teamInstructions: { ...defaultTeamInstructions(), mentality: "Defensive", defensiveLine: 35, tempo: 40 }, pressing: { ...defaultPressing(), intensity: 35, zone: "Own Half" } },
    { name: "Chasing Goal — 3-2-4-1", formation: "3-2-4-1", teamInstructions: { ...defaultTeamInstructions(), mentality: "Very Attacking", tempo: 80, width: 75 }, pressing: { ...defaultPressing(), intensity: 85 } },
  ]);
  const [situationPreset, setSituationPreset] = useState({ "Default Tactic": "Main — 4-3-3", "Protecting A Lead": null, "Need A Goal": null });
  const [setPieces, setSetPieces] = useState({ cornerTaker: null, cornerType: 'Near Post', freeKickTaker: null, freeKickType: 'Direct', penaltyTaker: null, backupPenaltyTaker: null, throwInStyle: 'Short', defensiveCorner: 'Zonal' });
  const [oppositionInstructions, setOppositionInstructions] = useState({});

  const startXI = pickStartXI();
  const slots = FORMATIONS[formation];

  const value = {
    formation, setFormation, assignment, setAssignment, roleAssignment, setRoleAssignment,
    dutyAssignment, setDutyAssignment, playerInstructions, setPlayerInstructions,
    squares, setSquares, teamInstructions, setTeamInstructions, pressing, setPressing,
    tacticalDelegation, setTacticalDelegation, appliedFixKeys, setAppliedFixKeys,
    autoLog, setAutoLog, presets, setPresets, situationPreset, setSituationPreset,
    setPieces, setSetPieces, oppositionInstructions, setOppositionInstructions,
    startXI, slots,
  };

  return <TacticsCtx.Provider value={value}>{children}</TacticsCtx.Provider>;
}

export function useTacticsData() {
  const ctx = useContext(TacticsCtx);
  if (!ctx) throw new Error('useTacticsData must be used within a TacticsProvider');
  return ctx;
}
