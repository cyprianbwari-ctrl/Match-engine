import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useDatabase } from './DatabaseContext.jsx';
import { useManagerData } from './ManagerContext.jsx';
import { useStaffData } from './StaffContext.jsx';
import { getCareerClubId, getCareerClubName } from '../engine/clubIdentity.js';

const FinanceCtx = createContext(null);
const money = v => { if (typeof v === 'number') return v; const s=String(v??'').replace(/[^0-9.]/g,''); const n=Number(s)||0; return /m/i.test(v)?n*1e6:/k/i.test(v)?n*1e3:n; };

function deriveClubFinance(club, roster, staffList) {
  const rawReputation = Number(club?.reputation)||50;
  const reputation = Math.max(1, rawReputation > 100 ? rawReputation / 100 : rawReputation);
  const attendance = Math.max(5000, Number(club?.attendanceAvg || club?.raw?.attendance_avg)||12000);
  const squadWages = roster.reduce((a,p)=>a+money(p.wage),0);
  const staffWages = staffList.reduce((a,s)=>a+Number(s.wage||0),0);
  const weeklyWages = squadWages + staffWages;
  const annualWages = weeklyWages * 52;
  const sponsorshipAnnual = Math.round((reputation * 70000 + attendance * 180) / 50000) * 50000;
  const broadcastingAnnual = Math.round((reputation * 110000 + attendance * 75) / 50000) * 50000;
  const matchdayAnnual = Math.round(attendance * 32 * 24 / 50000) * 50000;
  const operatingAnnual = Math.round((annualWages * 0.18 + attendance * 30) / 50000) * 50000;
  const reserve = Math.max(5_000_000, Math.round((sponsorshipAnnual + broadcastingAnnual + matchdayAnnual - annualWages - operatingAnnual) * 0.65));
  const transferBudget = Math.max(1_000_000, Math.round((reserve * 0.42) / 100000) * 100000);
  const wageBudget = Math.max(weeklyWages * 1.1, 250_000);
  const sponsors = [
    { name:'Principal Sponsor', annualValue:Math.round(sponsorshipAnnual*0.48), expires:'Season End' },
    { name:'Technical Partner', annualValue:Math.round(sponsorshipAnnual*0.31), expires:'Season End' },
    { name:'Commercial Partners', annualValue:Math.round(sponsorshipAnnual*0.21), expires:'Season End' },
  ];
  return { startingBalance:reserve, transferBudget, wageBudget, sponsorshipAnnual, broadcastingAnnual, matchdayAnnual, operatingAnnual, weeklyWages, annualWages, sponsors };
}

function openingTransactions(model) {
  return [
    {id:'opening-sponsorship',date:'Season Start',label:'Sponsorship Contracts',category:'Sponsorships',amount:model.sponsorshipAnnual,status:'Contracted'},
    {id:'opening-broadcast',date:'Season Start',label:'Broadcasting Rights',category:'Broadcasting Rights',amount:model.broadcastingAnnual,status:'Contracted'},
    {id:'opening-matchday',date:'Season Start',label:'Projected Matchday Revenue',category:'Matchday Revenue',amount:model.matchdayAnnual,status:'Projected'},
    {id:'opening-wages',date:'Season Start',label:'Annual Wage Commitment',category:'Player Wages',amount:-model.annualWages,status:'Committed'},
    {id:'opening-operating',date:'Season Start',label:'Operating Cost Provision',category:'Operating Costs',amount:-model.operatingAnnual,status:'Committed'},
  ];
}

export function FinanceProvider({ children }) {
  const db = useDatabase();
  const manager = useManagerData();
  const { staffList } = useStaffData();
  const currentClubId = getCareerClubId(manager.profile, db);
  const currentClubName = getCareerClubName(manager.profile, db);
  const roster = db.careerSquad || [];
  const club = db.clubs.find(c=>String(c.id)===String(currentClubId) || String(c.uid)===String(currentClubId) || String(c.name).toLowerCase()===String(currentClubName).toLowerCase()) || {name:currentClubName};
  const model = useMemo(()=>deriveClubFinance(club,roster,staffList),[club,roster,staffList]);
  const clubKey = String(club.id || currentClubName);
  const [balance,setBalance] = useState(model.startingBalance);
  const [transactions,setTransactions] = useState(()=>openingTransactions(model));
  const [budgets,setBudgets] = useState(()=>({transfer:model.transferBudget,wagesWeekly:model.wageBudget,facilities:Math.round(model.operatingAnnual*.28),youth:Math.round(model.operatingAnnual*.18)}));
  const [transactionSequence,setTransactionSequence] = useState(0);
  const [boardExpectations,setBoardExpectations] = useState({financial:'Maintain a sustainable operating balance',transfer:'Improve squad depth within budget',wageControl:'Keep wage growth sustainable'});

  useEffect(()=>{
    setBalance(model.startingBalance);
    setTransactions(openingTransactions(model));
    setBudgets({transfer:model.transferBudget,wagesWeekly:model.wageBudget,facilities:Math.round(model.operatingAnnual*.28),youth:Math.round(model.operatingAnnual*.18)});
    setTransactionSequence(0);
  },[clubKey]);

  const setBudget = useCallback((key,value)=>setBudgets(b=>({...b,[key]:Math.max(0,Number(value)||0)})),[]);
  const addTransaction = useCallback((label,amount,category,meta={})=>{
    setTransactionSequence(n=>n+1);
    setBalance(b=>b+Number(amount||0));
    setTransactions(ts=>[{id:`tx-${Date.now()}-${ts.length}`,date:'Today',label,category,amount:Number(amount||0),status:'Completed',...meta},...ts].slice(0,250));
  },[]);

  const ledgerIncome = useMemo(()=>transactions.filter(t=>t.amount>0).reduce((a,t)=>a+t.amount,0),[transactions]);
  const ledgerExpenses = useMemo(()=>transactions.filter(t=>t.amount<0).reduce((a,t)=>a+Math.abs(t.amount),0),[transactions]);
  const netProfit = ledgerIncome-ledgerExpenses;
  const financialStatus = balance > model.startingBalance*.55 ? 'Healthy' : balance > model.startingBalance*.22 ? 'Caution' : 'Concerning';
  const statusColor = financialStatus==='Healthy'?'#3ddc84':financialStatus==='Caution'?'#f2c94c':'#ef4f4f';
  const availableTransferBudget = Math.max(0,budgets.transfer - transactions.filter(t=>t.category==='Transfers' && t.amount<0).reduce((a,t)=>a+Math.abs(t.amount),0));
  const value = useMemo(()=>({
    clubId:currentClubId,clubName:currentClubName,club,model,balance,transactions,addTransaction,
    totalIncome:ledgerIncome,totalExpenses:ledgerExpenses,netProfit,financialStatus,statusColor,
    budgets:{...budgets,available:availableTransferBudget},setBudget,boardExpectations,setBoardExpectations,
    sponsors:model.sponsors,broadcasting:model.broadcastingAnnual,matchday:model.matchdayAnnual,operatingCosts:model.operatingAnnual,
    wageBill:model.weeklyWages,getSnapshot:()=>({clubId:currentClubId,balance,transactions,budgets,boardExpectations}),
    restoreSnapshot:s=>{if(!s)return;if(s.balance!==undefined)setBalance(s.balance);if(s.transactions)setTransactions(s.transactions);if(s.budgets)setBudgets(s.budgets);if(s.boardExpectations)setBoardExpectations(s.boardExpectations);},
  }),[currentClubId,currentClubName,club,model,balance,transactions,addTransaction,ledgerIncome,ledgerExpenses,netProfit,financialStatus,statusColor,budgets,setBudget,boardExpectations,availableTransferBudget]);
  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>;
}
export function useFinanceData(){const ctx=useContext(FinanceCtx);if(!ctx)throw new Error('useFinanceData must be used within a FinanceProvider');return ctx;}
