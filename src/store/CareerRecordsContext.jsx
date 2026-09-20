import React,{createContext,useContext,useEffect,useMemo,useState,useCallback} from 'react';
import {useFinanceData} from './FinanceContext.jsx';
import {useTransfersData} from './TransfersContext.jsx';
import {useCompetitionData} from './CompetitionContext.jsx';
import {useTrainingData} from './TrainingContext.jsx';
import {usePlayerState} from './PlayerStateContext.jsx';
import {useSimulation} from './SimulationContext.jsx';

const Ctx=createContext(null);
const KEY='family26_career_records_v1';
const empty={version:1,events:[],records:{wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,cleanSheets:0,biggestWin:0},awards:[],achievements:[],seasons:[]};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||empty}catch{return empty}};
const push=(a,e)=>[...a,{id:`ev-${a.length + 1}`,at:new Date().toISOString(),...e}].slice(-500);
export function CareerRecordsProvider({children}){
 const finance=useFinanceData(), transfers=useTransfersData(), competition=useCompetitionData(), training=useTrainingData(), players=usePlayerState(), sim=useSimulation();
 const [data,setData]=useState(read);
 const [last,setLast]=useState(null);
 const snapshot=useMemo(()=>({version:1,...data}),[data]);
 const addEvent=useCallback((type,payload={})=>setData(d=>{const next={...d,events:push(d.events,{type,...payload})}; setLast(next.events.at(-1)); return next}),[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(data))},[data]);
 // Cross-system activity detector: it deliberately observes state, rather than letting
 // presentation screens manufacture history. This is the common career ledger.
 const [prev,setPrev]=useState(null);
 useEffect(()=>{
   const s={balance:finance.balance,tx:finance.transactions.length,transfers:transfers.history?.length||0,neg:transfers.negotiations?.length||0,training:training.history?.length||0,day:sim.dateLabel,phase:sim.phase};
   if(!prev){setPrev(s);return}
   const changes=[];
   if(s.tx>prev.tx) changes.push({type:'finance',label:'Financial transaction recorded'});
   if(s.transfers>prev.transfers) changes.push({type:'transfer',label:'Transfer activity completed'});
   if(s.neg>prev.neg) changes.push({type:'negotiation',label:'Transfer negotiation updated'});
   if(s.training>prev.training) changes.push({type:'training',label:'Training session completed'});
   if(s.day!==prev.day) changes.push({type:'world-day',label:'New football day'});
   changes.forEach(e=>addEvent(e.type,e)); setPrev(s);
 },[finance.balance,finance.transactions.length,transfers.history?.length,transfers.negotiations?.length,training.history?.length,sim.dateLabel,sim.phase,prev,addEvent]);
 const recordMatch=useCallback(({homeGoals=0,awayGoals=0,home='Newcastle',away='Opponent'}={})=>{
   const usHome=home==='Newcastle'; const gf=usHome?homeGoals:awayGoals,ga=usHome?awayGoals:homeGoals;
   setData(d=>{const r={...d.records}; if(gf>ga)r.wins++;else if(gf===ga)r.draws++;else r.losses++;r.goalsFor+=gf;r.goalsAgainst+=ga;if(ga===0)r.cleanSheets++;r.biggestWin=Math.max(r.biggestWin,gf-ga);return {...d,records:r,events:push(d.events,{type:'match',home,away,homeGoals,awayGoals})}});
 },[]);
 const unlock=useCallback((id,label,detail='')=>setData(d=>d.achievements.some(a=>a.id===id)?d:{...d,achievements:[...d.achievements,{id,label,detail,at:new Date().toISOString()}]}),[]);
 const restore=useCallback(s=>{if(s)setData({...empty,...s})},[]);
 const clear=useCallback(()=>setData(empty),[]);
 const value={data,last,addEvent,recordMatch,unlock,getSnapshot:()=>snapshot,restoreSnapshot:restore,resetRecords:clear,storageKey:KEY};
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useCareerRecords=()=>{const c=useContext(Ctx);if(!c)throw Error('useCareerRecords must be used within CareerRecordsProvider');return c};
