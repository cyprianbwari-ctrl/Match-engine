import React,{createContext,useContext,useEffect,useMemo,useRef,useState,useCallback} from 'react';
import {useSimulation} from './SimulationContext.jsx';
import {useFinanceData} from './FinanceContext.jsx';
import {useTransfersData} from './TransfersContext.jsx';
import {useTrainingData} from './TrainingContext.jsx';
import {useCompetitionData} from './CompetitionContext.jsx';
import {useWorldData} from './WorldContext.jsx';
import {useCareerRecords} from './CareerRecordsContext.jsx';
import {useManagerData} from './ManagerContext.jsx';

const C=createContext(null);
export function GameIntegrationProvider({children}){
 const sim=useSimulation(), finance=useFinanceData(), transfers=useTransfersData(), training=useTrainingData(), competition=useCompetitionData(), world=useWorldData(), records=useCareerRecords(), manager=useManagerData();
 const [lastEvent,setLastEvent]=useState(null);
 const prev=useRef(null);
 const emit=useCallback((type,label,detail={})=>{const e={type,label,detail,at:new Date().toISOString()};setLastEvent(e);records.addEvent(type,{label,...detail});},[records]);
 useEffect(()=>{
   const s={day:sim.dateLabel,phase:sim.phase,tx:finance.transactions.length,transfers:transfers.history?.length||0,training:training.reports?.length||0,players:world.players.length,position:competition.league?.table?.find(r=>r.us)?.pos||null};
   if(!prev.current){prev.current=s;return;}
   const p=prev.current;
   if(s.day!==p.day) emit('integration-day','World day advanced',{date:s.day});
   if(s.tx>p.tx) emit('integration-finance','Finance updated',{transactions:s.tx});
   if(s.transfers>p.transfers) emit('integration-transfer','Transfer market updated',{transactions:s.transfers});
   if(s.training>p.training) emit('integration-training','Training report updated',{reports:s.training});
   if(s.position!==p.position) emit('integration-competition','League position changed',{position:s.position});
   prev.current=s;
 },[sim.dateLabel,sim.phase,finance.transactions.length,transfers.history?.length,training.reports?.length,world.players.length,competition.league,emit]);
 const integrity=useMemo(()=>({database:world.players.length>0,simulation:!!sim,transfers:!!transfers.history,training:!!training.playerTraining,finance:!!finance.balance,competition:!!competition.league,manager:!!manager.profile,careerRecords:!!records.data}),[world.players.length,sim,transfers.history,training.playerTraining,finance.balance,competition.league,manager.profile,records.data]);
 const value=useMemo(()=>({lastEvent,emit,integrity,connectedSystems:Object.values(integrity).filter(Boolean).length,totalSystems:Object.keys(integrity).length,getSnapshot:()=>({lastEvent})}),[lastEvent,emit,integrity]);
 return <C.Provider value={value}>{children}</C.Provider>;
}
export const useGameIntegration=()=>{const c=useContext(C);if(!c)throw Error('useGameIntegration must be used within a GameIntegrationProvider');return c};
