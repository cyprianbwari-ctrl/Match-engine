import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { evaluateManager, chooseTransferTargets } from '../engine/aiManagerEngine.js';
import { useDatabase } from './DatabaseContext.jsx';

const AIManagersCtx = createContext(null);

const SEED_MANAGERS = [
  { id:'ai-ars', name:'Julien Vasseur', club:'Arsenal', style:'Possession', intensity:'High', formation:'4-3-3', philosophy:'Control & Press', transferPhilosophy:'Balanced', riskTolerance:62, reputation:88 },
  { id:'ai-liv', name:'Magnus Lindqvist', club:'Liverpool', style:'Possession', intensity:'High', formation:'4-2-3-1', philosophy:'Vertical Possession', transferPhilosophy:'Balanced', riskTolerance:60, reputation:86 },
  { id:'ai-che', name:'Davide Conti', club:'Chelsea', style:'Possession', intensity:'Medium', formation:'4-2-3-1', philosophy:'Build From Back', transferPhilosophy:'Youth', riskTolerance:52, reputation:79 },
  { id:'ai-mci', name:'Tomas Vidović', club:'Man City', style:'Positional', intensity:'High', formation:'4-3-3', philosophy:'Positional Play', transferPhilosophy:'Balanced', riskTolerance:58, reputation:96 },
  { id:'ai-avl', name:'Callum Bretherton', club:'Aston Villa', style:'Transition', intensity:'High', formation:'4-3-3', philosophy:'Aggressive Transition', transferPhilosophy:'Experience', riskTolerance:68, reputation:82 },
  { id:'ai-bha', name:'Anton Reyes', club:'Brighton', style:'Flexible', intensity:'Medium', formation:'4-2-3-1', philosophy:'Dynamic Press', transferPhilosophy:'Youth', riskTolerance:65, reputation:76 },
];

function seeded(n, salt=0) {
  const x = Math.sin((n + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function AIManagersProvider({ children }) {
  const db = useDatabase();
  const [managers, setManagers] = useState(SEED_MANAGERS);
  const [managerPlans, setManagerPlans] = useState({});
  const [worldEvents, setWorldEvents] = useState([]);

  const simulateDay = useCallback(({ dayIndex = 0 } = {}) => {
    setManagers(ms => ms.map((m, i) => {
      const drift = seeded(dayIndex + i, 4) > 0.82 ? (seeded(dayIndex + i, 5) > 0.5 ? 1 : -1) : 0;
      return { ...m, reputation: Math.max(50, Math.min(99, m.reputation + drift)) };
    }));
    if (seeded(dayIndex, 11) > 0.72) {
      const m = managers[Math.floor(seeded(dayIndex, 12) * managers.length)];
      if (m) setWorldEvents(e => [{ id:`ai-${Date.now()}`, text:`${m.name} adjusts ${m.club}'s tactical plan ahead of the next fixture.`, type:'tactical' }, ...e].slice(0, 20));
    }
  }, [managers]);

  const makeDecision = useCallback((managerId, context = {}) => {
    const manager = managers.find(m => m.id === managerId);
    if (!manager) return null;
    return evaluateManager(manager, context).action;
  }, [managers]);


  const runTransferPlanning = useCallback((managerId, budget=0) => {
    const manager = managers.find(m=>m.id===managerId);
    if(!manager) return [];
    const targets = chooseTransferTargets(manager, db.players.filter(p=>p.club!==manager.club).slice(0,500), budget);
    setManagerPlans(plans=>({...plans,[managerId]:{updatedAt:Date.now(),targets:targets.map(p=>({id:p.id,name:p.name,club:p.club,position:p.position,rating:p.ca,value:p.value}))}}));
    return targets;
  },[managers,db.players]);

  const value = useMemo(() => ({ managers, worldEvents, managerPlans, simulateDay, makeDecision, runTransferPlanning, getSnapshot:()=>({ managers, worldEvents, managerPlans }), restoreSnapshot:(s)=>{ if(s?.managers) setManagers(s.managers); if(s?.worldEvents) setWorldEvents(s.worldEvents); if(s?.managerPlans) setManagerPlans(s.managerPlans); } }), [managers, worldEvents, managerPlans, simulateDay, makeDecision, runTransferPlanning]);
  return <AIManagersCtx.Provider value={value}>{children}</AIManagersCtx.Provider>;
}

export function useAIManagers() {
  const ctx = useContext(AIManagersCtx);
  if (!ctx) throw new Error('useAIManagers must be used within an AIManagersProvider');
  return ctx;
}
