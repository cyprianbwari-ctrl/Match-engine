import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useDatabase } from './DatabaseContext.jsx';
import { usePlayerState } from './PlayerStateContext.jsx';
import { useStaffData } from './StaffContext.jsx';

const TrainingCtx = createContext(null);

const BASE_SCHEDULE = [
  { day: 'Sat 14 Dec', type: 'Recovery', detail: 'Low Intensity', time: '10:00' },
  { day: 'Sun 15 Dec', type: 'Tactical', detail: 'Team Shape', time: '10:00' },
  { day: 'Mon 16 Dec', type: 'Fitness', detail: 'Endurance', time: '10:00' },
  { day: 'Tue 17 Dec', type: 'Possession', detail: 'Passing Patterns', time: '10:00' },
  { day: 'Wed 18 Dec', type: 'Attacking', detail: 'Attacking Movement', time: '10:00' },
  { day: 'Thu 19 Dec', type: 'Defending', detail: 'Defensive Shape', time: '10:00' },
  { day: 'Fri 20 Dec', type: 'Match Preparation', detail: 'Set Pieces', time: '10:00' },
];

export const SESSION_TYPES = ['Recovery', 'Rest', 'Fitness', 'Attacking', 'Defending', 'Possession', 'Tactical', 'Set Pieces', 'Transition', 'Match Preparation', 'Teamwork', 'Youth Development'];

export const SESSION_COACH_CATEGORY = {
  Recovery: 'Fitness Coaches', Rest: 'Fitness Coaches', Fitness: 'Fitness Coaches',
  Attacking: 'Coaches', Defending: 'Coaches', Possession: 'Coaches', Teamwork: 'Coaches',
  Tactical: 'Assistant Manager', Transition: 'Assistant Manager', 'Match Preparation': 'Assistant Manager',
  'Set Pieces': 'Set-Piece Coaches', 'Youth Development': 'Youth Coaches',
};

const FOCUS_OPTIONS = ['Finishing', 'Passing', 'Dribbling', 'Strength', 'Pace', 'Stamina', 'Defensive Ability', 'Positioning', 'Set Pieces'];
const SESSION_DEFAULT_FOCUS = { Fitness:'Stamina', Attacking:'Finishing', Defending:'Defensive Ability', Possession:'Passing', Tactical:'Positioning', 'Set Pieces':'Set Pieces', Transition:'Pace', Teamwork:'Passing', 'Youth Development':'Dribbling', 'Match Preparation':'Positioning', Recovery:'General', Rest:'General' };
const ROLE_FOCUS = { ST:'Finishing', CF:'Finishing', LW:'Dribbling', RW:'Dribbling', AM:'Passing', CM:'Passing', DM:'Defensive Ability', LB:'Defensive Ability', RB:'Defensive Ability', CB:'Defensive Ability', GK:'Positioning' };

function seedPlayerTraining(roster) {
  const map = {};
  roster.forEach(p => {
    map[p.id] = {
      sharpness: Math.max(55, Math.min(98, p.fit - 4 + (p.id % 7))),
      workload: Math.max(30, Math.min(95, 100 - p.fit + 30 + (p.id % 11))),
      injuryRisk: p.fit < 78 ? 'High' : p.fit < 88 ? 'Medium' : 'Low',
    };
  });
  return map;
}

function seedDevelopmentLog(roster) {
  const young = roster.filter(p => p.age <= 24).slice(0, 6);
  return young.map((p, i) => ({
    playerId: p.id, name: p.name,
    attr: ['Passing', 'Finishing', 'Stamina', 'Positioning', 'Dribbling', 'Strength'][i % 6],
    before: p.ovr - 4 - (i % 3), after: p.ovr - 2 - (i % 2), date: `${10 + i} Dec 2025`,
  }));
}

function seedReports() {
  return [
    { id: 1, text: 'Tactical familiarity improved after 4-3-3 sessions', type: 'positive', date: '13 Dec 2025' },
    { id: 2, text: "Villanueva's finishing has improved this week", type: 'positive', date: '13 Dec 2025' },
    { id: 3, text: 'Squad fatigue rising after back-to-back high-intensity weeks', type: 'negative', date: '12 Dec 2025' },
  ];
}

export function TrainingProvider({ children }) {
  const { careerSquad: roster } = useDatabase();
  const playerState = usePlayerState();
  const { staffList } = useStaffData();
  const [delegation, setDelegation] = useState('Manual');
  const [schedule, setSchedule] = useState(BASE_SCHEDULE);
  const [individualPlans, setIndividualPlans] = useState({});
  const [playerTraining, setPlayerTraining] = useState(() => seedPlayerTraining(roster));
  const [developmentLog, setDevelopmentLog] = useState(() => seedDevelopmentLog(roster));
  const [reports, setReports] = useState(seedReports);

  const coachForType = useCallback((type) => {
    const category = SESSION_COACH_CATEGORY[type] || 'Coaches';
    const candidates = staffList.filter(s => s.dept === 'Coaching' && s.category === category);
    return candidates.sort((a,b)=>(b.rating||3)-(a.rating||3))[0] || staffList.find(s=>s.dept==='Coaching') || null;
  }, [staffList]);

  const applyDayTraining = useCallback((dateLabel) => {
    const date = new Date(dateLabel);
    const scheduleIndex = Number.isNaN(date.getTime()) ? 0 : (date.getDay() + 1) % 7;
    const day = schedule[scheduleIndex] || schedule[0];
    if (!day) return null;
    const coach = coachForType(day.type);
    const intensity = day.type === 'Recovery' || day.type === 'Rest' ? 30 : day.type === 'Fitness' ? 82 : 65;
    const focus = SESSION_DEFAULT_FOCUS[day.type] || FOCUS_OPTIONS[0];
    const individualFocuses = Object.fromEntries(roster.map(p => [p.id, individualPlans[p.id]?.focuses?.[0] || '']));
    playerState.applyTrainingSession(day.type, intensity, focus, { coachName: coach?.name, coachRating: coach?.rating || 3, roleFocus: ROLE_FOCUS, individualFocuses });
    const created = [];
    roster.slice(0, 12).forEach(p => {
      const plan = individualPlans[p.id];
      const planFocus = plan?.focuses?.[0] || focus;
      created.push({ playerId:p.id, name:p.name, attr:planFocus, before:Math.round(Number(p.attributes?.[planFocus.toLowerCase().replace(/ /g,'_')] || p.ovr || p.ca || 0)), after:Math.round(Number(p.attributes?.[planFocus.toLowerCase().replace(/ /g,'_')] || p.ovr || p.ca || 0) + 0.1), date:dateLabel, session:day.type, coach:coach?.name || 'Coaching Staff' });
    });
    setDevelopmentLog(prev=>[...created,...prev].slice(0,30));
    return { ...day, coach:coach?.name || 'Coaching Staff', focus };
  }, [schedule, coachForType, playerState, roster, individualPlans]);

  const setDaySession = useCallback((dayIndex, type, detail) => {
    setSchedule(s => s.map((d, i) => i === dayIndex ? { ...d, type, detail: detail ?? d.detail } : d));
  }, []);

  // Automatic delegation: bias the week toward tactical/set-piece work as
  // the next match approaches, and toward recovery/fitness further out.
  const applyAutoSchedule = useCallback((daysToMatch) => {
    setSchedule(s => s.map((d, i) => {
      const distance = daysToMatch - i;
      if (distance <= 1) return { ...d, type: 'Match Preparation', detail: 'Set Pieces & Opposition Shape' };
      if (distance <= 2) return { ...d, type: 'Tactical', detail: 'Team Shape & Pressing Triggers' };
      if (distance >= 5) return { ...d, type: 'Recovery', detail: 'Low Intensity' };
      return { ...d, type: i % 2 === 0 ? 'Possession' : 'Fitness', detail: i % 2 === 0 ? 'Passing Patterns' : 'Endurance' };
    }));
  }, []);

  const setPlan = useCallback((playerId, plan) => {
    setIndividualPlans(p => ({ ...p, [playerId]: plan }));
  }, []);

  const reduceWorkload = useCallback((playerId) => {
    setPlayerTraining(pt => ({ ...pt, [playerId]: { ...pt[playerId], workload: Math.max(20, pt[playerId].workload - 20) } }));
  }, []);

  const addReport = useCallback((text, type) => {
    setReports(r => [{ id: Date.now(), text, type, date: 'Today' }, ...r].slice(0, 12));
  }, []);

  const overloaded = useMemo(() => roster.filter(p => (playerTraining[p.id]?.workload ?? 0) >= 80), [playerTraining]);

  const youthPlayers = useMemo(() => roster.filter(p => p.playTime === 'Youth' || p.playTime === 'Prospect' || p.age <= 20).map(p => ({
    ...p, progress: Math.min(99, 40 + (p.ovr - 60) * 2 + (p.id % 10)),
    readyForFirstTeam: p.ovr >= 78 && p.fit >= 88,
  })), []);

  const trainingEffectiveness = useMemo(() => {
    const avgSharp = Math.round(roster.reduce((a, p) => a + (playerTraining[p.id]?.sharpness ?? 80), 0) / roster.length);
    const avgWorkload = Math.round(roster.reduce((a, p) => a + (playerTraining[p.id]?.workload ?? 50), 0) / roster.length);
    return Math.max(40, Math.min(99, Math.round(avgSharp - Math.max(0, avgWorkload - 65) * 0.5)));
  }, [playerTraining]);

  const value = {
    delegation, setDelegation, schedule, setSchedule, setDaySession, applyAutoSchedule,
    individualPlans, setPlan, FOCUS_OPTIONS,
    playerTraining, reduceWorkload, overloaded,
    developmentLog, reports, addReport, applyDayTraining, coachForType,
    youthPlayers, trainingEffectiveness,
  };

  return <TrainingCtx.Provider value={value}>{children}</TrainingCtx.Provider>;
}

export function useTrainingData() {
  const ctx = useContext(TrainingCtx);
  if (!ctx) throw new Error('useTrainingData must be used within a TrainingProvider');
  return ctx;
}
