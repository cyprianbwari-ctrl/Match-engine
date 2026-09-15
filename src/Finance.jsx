import React, {useMemo, useState} from "react";
import {
  Coins, TrendingUp, TrendingDown, WalletCards, BriefcaseBusiness, Users, Trophy,
  Handshake, Landmark, BarChart3, Receipt, ArrowUpRight, ArrowDownRight,
  ChevronRight, ChevronDown, FileText, ShieldCheck, CircleDollarSign, Building2,
  Banknote, Percent, CalendarDays, Search, X
} from "lucide-react";
import "./finance.css";
import { useTransfersData } from "./store/TransfersContext.jsx";
import { useFinanceData } from "./store/FinanceContext.jsx";
import { useStaffData } from "./store/StaffContext.jsx";
import { players as roster } from "./data/roster.js";

function wageNum(w){ const n=Number(String(w).replace(/[^0-9]/g,'')); return String(w).includes('k')?n*1000:n; }
function moneyStr(n){ return `£${Math.round(n).toLocaleString('en-GB')}`; }
// One real sponsor book shared by every panel that mentions sponsors —
// the original mock quoted different figures for the same deals depending
// on which tab you were looking at.
const SPONSOR_DEALS = [
  ["Adidas","£12,000,000","30 Jun 2027"],["TeamViewer","£10,500,000","30 Jun 2026"],
  ["DXC Technology","£8,500,000","30 Jun 2027"],["Chevrolet","£6,200,000","30 Jun 2026"],
  ["Snapdragon","£4,100,000","30 Jun 2027"],
];
const SPONSOR_TOTAL = SPONSOR_DEALS.reduce((a,[,v])=>a+wageNum(v),0);
// Real per-player wage/contract data (roster.js) blended with real staff
// wages (StaffContext) — this is what feeds Wage Structure and the
// Contracts tab everywhere, instead of separate hand-typed numbers.
function useWageBill(){
  const { staffList } = useStaffData();
  return useMemo(()=>{
    const firstTeam = roster.filter(p=>p.playTime!=='Youth');
    const youth = roster.filter(p=>p.playTime==='Youth');
    const firstTeamWeekly = firstTeam.reduce((a,p)=>a+wageNum(p.wage),0);
    const youthWeekly = youth.reduce((a,p)=>a+wageNum(p.wage),0);
    const staffWeekly = staffList.reduce((a,s)=>a+(s.wage||0),0);
    const totalWeekly = firstTeamWeekly+youthWeekly+staffWeekly;
    return { firstTeamWeekly, youthWeekly, staffWeekly, totalWeekly, totalAnnual: totalWeekly*52, firstTeam, youth, staffList };
  },[staffList]);
}
// Baseline season model + whatever has actually happened in the ledger —
// keeps the breakdown feeling like a full season's book from turn one,
// while still moving for real as you play.
function useCategoryBreakdown(baseline, sign){
  const { transactions } = useFinanceData();
  return useMemo(()=>{
    const merged = {};
    baseline.forEach(([name,,v])=>{ merged[name]=wageNum(v); });
    transactions.filter(t=> sign==='income' ? t.amount>0 : t.amount<0).forEach(t=>{
      merged[t.category]=(merged[t.category]||0)+Math.abs(t.amount);
    });
    const total = Object.values(merged).reduce((a,b)=>a+b,0)||1;
    return Object.entries(merged).map(([name,amount])=>({name,amount,pct:Math.round(amount/total*1000)/10})).sort((a,b)=>b.amount-a.amount);
  },[transactions, baseline, sign]);
}

const revenue = [
  ["Broadcasting Rights",42.3,"£33,160,000"],["Matchday Revenue",18.7,"£14,660,000"],
  ["Sponsorships",16.8,"£13,190,000"],["Merchandise",9.2,"£7,210,000"],
  ["Competitions",7.6,"£5,960,000"],["Other Income",5.4,"£4,230,000"]
];
const spending = [
  ["Player Wages",48.8,"£42,300,000"],["Staff Wages",9.1,"£7,860,000"],
  ["Transfers",21.6,"£18,750,000"],["Facilities & Stadium",7.4,"£6,420,000"],
  ["Operating Costs",6.5,"£5,610,000"],["Other Expenses",6.7,"£5,800,000"]
];
const contracts = roster.filter(p=>p.playTime!=='Youth').map(p=>{
  const year = Number((String(p.contract).match(/\d{4}/)||[])[0]) || 2027;
  const status = year<=2026 ? "Expiring Soon" : (p.id%7===0 ? "Renewal In Progress" : "Contract Ok");
  return [p.name, p.displayPos, String(p.age), status, `30 ${p.contract}`, `${p.wage}`.replace('/w','/w')];
}).sort((a,b)=> (a[3]==="Expiring Soon"?0:a[3]==="Renewal In Progress"?1:2) - (b[3]==="Expiring Soon"?0:b[3]==="Renewal In Progress"?1:2));
function FinanceTabs({tab,setTab}){
  return <div className="finance-tabs">{[
    ["overview","Overview"],["revenue","Revenue"],["spending","Spending & Budgets"],["contracts","Contracts & Club Finance"]
  ].map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
}
function Ring({value,label="",className=""}){return <div className={`finance-ring ${className}`} style={{"--p":`${value*3.6}deg`}}><div><b>{value}%</b>{label&&<span>{label}</span>}</div></div>}
function Bar({value,max=100}){return <div className="finance-bar"><i style={{width:`${Math.min(100,value/max*100)}%`}}/></div>}
function Money({children,down=false}){return <strong className={down?"money down":"money"}>{children}</strong>}
function Panel({title,icon:Icon,action,onAction,children,className=""}){return <section className={`finance-panel ${className}`}><div className="finance-panel-title"><h2>{Icon&&<Icon/>}{title}</h2>{action&&<button onClick={onAction}>{action}<ChevronRight/></button>}</div>{children}</section>}
function MiniChart({forecast=false}){const vals=forecast?[42,48,57,62,70,76]:[62,72,58,89,112,142,168]; return <div className="mini-chart"><div className="chart-y"><span>£200M</span><span>£150M</span><span>£100M</span><span>£50M</span><span>£0</span></div><div className="chart-area">{vals.map((v,i)=><div className="chart-col" key={i}><i style={{height:`${Math.max(8,v/2)}%`}}/><span>{forecast?["Jan 26","Feb 26","Mar 26","Apr 26","May 26","Jun 26"][i]:["Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25"][i]}</span></div>)}</div></div>}
function RevenueBreakdown(){const rows=useCategoryBreakdown(revenue,'income'); const total=rows.reduce((a,r)=>a+r.amount,0); return <Panel title="Revenue Breakdown" icon={BarChart3}><div className="donut-layout"><div className="donut revenue-donut"><span>£{(total/1000000).toFixed(1)}M<small>Total</small></span></div><div className="legend-list">{rows.map(r=><div key={r.name}><i/ ><span>{r.name}</span><b>{r.pct}%</b><strong>{moneyStr(r.amount)}</strong></div>)}</div></div></Panel>}
function SpendingBreakdown(){const rows=useCategoryBreakdown(spending,'expense'); const total=rows.reduce((a,r)=>a+r.amount,0); return <Panel title="Expenses Breakdown" icon={Receipt}><div className="donut-layout"><div className="donut expense-donut"><span>£{(total/1000000).toFixed(1)}M<small>Total</small></span></div><div className="legend-list">{rows.map(r=><div key={r.name}><i/><span>{r.name}</span><b>{r.pct}%</b><strong>{moneyStr(r.amount)}</strong></div>)}</div></div></Panel>}
function Overview({setActive}){
  const { budget, history } = useTransfersData();
  const fin = useFinanceData();
  const wageBill = useWageBill();
  const spent = budget.total - budget.available;
  const usedPct = Math.round((spent / budget.total) * 100);
  return <div className="finance-content">
  <div className="finance-grid overview-top">
    <Panel title="Club Finances Overview" icon={Coins}><div className="balance-row"><div className="big-balance"><WalletCards/><span>Current Balance</span><Money>£{Math.round(fin.balance).toLocaleString()}</Money><small><i className="status-dot" style={{background:fin.statusColor}}/> {fin.financialStatus}</small></div><div className="finance-summary"><div><span>Total Income</span><Money>£{Math.round(fin.totalIncome).toLocaleString()}</Money></div><div><span>Total Expenses</span><Money down>£{Math.round(fin.totalExpenses).toLocaleString()}</Money></div><div><span>Net Profit/Loss</span><Money down={fin.netProfit<0}>{fin.netProfit<0?"-":"+"}£{Math.round(Math.abs(fin.netProfit)).toLocaleString()}</Money></div></div></div><div className="trend-title"><span>Balance Trend <small>(Last 6 Months)</small></span></div><MiniChart/></Panel>
    <RevenueBreakdown/><SpendingBreakdown/>
  </div>
  <div className="finance-grid overview-middle">
    <Panel title="Transfer Budget" icon={WalletCards}><div className="budget-number"><span>Available Transfer Funds</span><Money>£{Math.round(budget.available).toLocaleString()}</Money></div><Bar value={usedPct}/><div className="two-stat"><span>Spent this window <b>£{Math.round(spent).toLocaleString()}</b></span><span>Remaining <b>£{Math.round(budget.available).toLocaleString()}</b></span></div>{history.length>0 && <p className="muted-sub" style={{fontSize:11,color:'#8f9abb',margin:'8px 0 0'}}>{history.length} signing{history.length>1?'s':''} completed this window.</p>}<button className="purple-action" onClick={()=>setActive('Transfers')}>View Transfer Budget <ChevronRight/></button></Panel>
    <Panel title="Wage Structure" icon={Banknote} action="View Wage Structure"><div className="wage-head"><Ring value={Math.min(100,Math.round(wageBill.totalWeekly/45000))}/><div><span>Total Wage Bill</span><Money>{moneyStr(wageBill.totalWeekly)}/w</Money><small>{wageBill.firstTeam.length} first-team players</small></div></div><div className="wage-lines"><span>First Team <b>{moneyStr(wageBill.firstTeamWeekly)}</b></span><span>U21 Wages <b>{moneyStr(wageBill.youthWeekly)}</b></span><span>Staff Wages <b>{moneyStr(wageBill.staffWeekly)}</b></span><span>Wage Room <b>{moneyStr(wageBill.totalWeekly*1.2)}</b></span></div></Panel>
    <Panel title="Key Contracts" icon={FileText} action="View All"><div className="contract-mini">{contracts.slice(0,5).map(c=><div key={c[0]}><b>{c[0]}</b><span>{c[3]}</span><small>{c[4]}</small><strong>{c[5]}</strong></div>)}</div></Panel>
  </div>
  <div className="finance-grid overview-bottom"><Panel title="Sponsors" icon={Handshake} action="View Sponsors"><div className="sponsor-summary"><div><span>Total Sponsorship Income</span><Money>{moneyStr(SPONSOR_TOTAL)}</Money><small>▲ +20% vs last season</small></div><div><span>Active Deals</span><b>{SPONSOR_DEALS.length}</b><small>1 year 6 months average</small></div></div><div className="sponsor-list">{SPONSOR_DEALS.map(([n,v,d])=><div key={n}><span>{n}</span><b>{v}</b><small>{d}</small></div>)}</div></Panel>
    <Panel title="Board & Club Funds" icon={Landmark} action="View Board Details"><div className="fund-list"><div>Board Investment <Money>£50,000,000</Money><span className="status good">Available</span></div><div>Club Loan <b>£0</b><span className="status">Not needed</span></div><div>Financial Restrictions <b>{fin.financialStatus==='Concerning'?'Board monitoring spending':'None'}</b></div></div></Panel>
    <Panel title="Financial Forecast" icon={BarChart3} action="View Full Forecast"><MiniChart forecast/></Panel>
  </div>
  <Transactions setActive={setActive}/>
 </div>}
function Transactions({setActive}){
  const { transactions } = useFinanceData();
  const goToSource = (t) => {
    if (!setActive) return;
    if (t.category === 'Transfers' || t.category === 'Player Sales') setActive('Transfers');
  };
  return <Panel title="Recent Financial Transactions" icon={Receipt} action="View All"><div className="transaction-table"><div className="t-head"><span>DATE</span><span>DESCRIPTION</span><span>CATEGORY</span><span>AMOUNT</span><span>STATUS</span></div>{transactions.slice(0,12).map(t=><div key={t.id} className={(t.category==='Transfers'||t.category==='Player Sales')?"t-row-clickable":""} onClick={()=>goToSource(t)}><span>{t.date}</span><span>{t.label}</span><span>{t.category}</span><Money down={t.amount<0}>{t.amount<0?"-":"+"}£{Math.abs(t.amount).toLocaleString()}</Money><b className="status good">{t.status}</b></div>)}</div></Panel>;
}
function Revenue({setActive}){
  const rows = useCategoryBreakdown(revenue,'income');
  const total = rows.reduce((a,r)=>a+r.amount,0);
  return <div className="finance-content"><div className="finance-grid revenue-top"><Panel title="Revenue Overview" icon={TrendingUp}><div className="revenue-hero"><div><span>Total Revenue (Season to Date)</span><Money>{moneyStr(total)}</Money><small>▲ +18% vs last season</small></div><div className="last-season"><span>Last Season</span><b>£66,560,000</b></div><Ring value={82}/></div><MiniChart/></Panel><RevenueBreakdown/><Panel title="Revenue Summary" icon={CircleDollarSign}><div className="summary-list"><div>Total Revenue <Money>{moneyStr(total)}</Money></div><div>Last Season <b>£66,560,000</b></div><div>Monthly Average <b>{moneyStr(total/6)}</b></div><div>Highest Month <b>Oct 2025 · £16,800,000</b></div><div>Lowest Month <b>Jul 2025 · £9,420,000</b></div></div><div className="green-callout">Revenue is up by 18%<small>Compared to the same period last season.</small></div></Panel></div>
<div className="revenue-cards">{[["Matchday Revenue","£14,660,000","18.7% of total","Stadium ticketing"],["Broadcasting Revenue","£33,160,000","42.3% of total","Domestic TV rights"],["Sponsorships","£13,190,000","16.8% of total","Kit sponsorship"],["Merchandise","£7,210,000","9.2% of total","Shirt sales"],["Competitions","£5,960,000","7.6% of total","Domestic cups"],["Other Income","£4,230,000","5.4% of total","Advertising"]].map(([n,v,p,s])=>{const match=rows.find(r=>r.name===n||n.includes(r.name)||r.name.includes(n.replace(' Revenue','')));const val=match?moneyStr(match.amount):v;const pct=match?`${match.pct}% of total`:p;return <section className="finance-panel revenue-card" key={n}><h3>{n}</h3><Money>{val}</Money><span>{pct}</span><div className="fake-photo">{s}</div><p>Key source</p><b>{s}</b><button className="purple-action">View Details <ChevronRight/></button></section>;})}</div>
<div className="finance-grid revenue-bottom"><Panel title="Top Revenue Sources" icon={BarChart3}>{rows.map((r,i)=><div className="rank-line" key={r.name}><b>{i+1}</b><span>{r.name}</span><Bar value={r.pct} max={45}/><strong>{moneyStr(r.amount)}</strong></div>)}</Panel><Panel title="Revenue Goals & Targets" icon={Trophy}>{rows.slice(0,5).map(r=><div className="goal-line" key={r.name}><span>{r.name}</span><b>{moneyStr(r.amount)}</b><em>{Math.round(r.pct+50)}%</em><Bar value={r.pct+50}/></div>)}</Panel><Transactions setActive={setActive}/></div>
</div>}
function Spending({setActive}){
  const { budget, history: transferHistory } = useTransfersData();
  const fin = useFinanceData();
  const wageBill = useWageBill();
  const spendRows = useCategoryBreakdown(spending,'expense');
  const spendTotal = spendRows.reduce((a,r)=>a+r.amount,0);
  const spent = budget.total - budget.available;
  const topPlayerEarners = [...roster].sort((a,b)=>wageNum(b.wage)-wageNum(a.wage)).slice(0,5);
  const topStaffEarners = [...wageBill.staffList].sort((a,b)=>(b.wage||0)-(a.wage||0)).slice(0,5);
  return <div className="finance-content"><div className="finance-grid spending-top"><Panel title="Club Spending Overview" icon={Coins}><div className="donut-layout spending-main"><div className="donut spending-donut"><span>£{(spendTotal/1000000).toFixed(2)}M<small>Total Spending</small></span></div><div className="legend-list">{spendRows.map(r=><div key={r.name}><i/><span>{r.name}</span><b>{moneyStr(r.amount)}</b><strong>{r.pct}%</strong></div>)}</div></div></Panel><Panel title="Key Budget Summary" icon={WalletCards}><div className="budget-summary-list"><div>Transfer Budget <Money>£{Math.round(budget.available).toLocaleString()}</Money><span>Available</span></div><div>Wage Budget <Money>{moneyStr(wageBill.totalWeekly)}/w</Money><span>Committed</span></div><div>Remaining Wage Room <Money>£{Math.max(0,Math.round(2_500_000-wageBill.totalWeekly)).toLocaleString()}</Money></div><div>Total Spending (Season) <Money>{moneyStr(spendTotal)}</Money></div><div>Budget Utilisation <Bar value={Math.round((spent/budget.total)*100)}/></div></div></Panel><Panel title="Wage Structure" icon={Banknote} action="View Details"><div className="wage-head"><Ring value={Math.min(100,Math.round(wageBill.totalWeekly/45000))}/><div><span>Total Wage Bill</span><Money>{moneyStr(wageBill.totalWeekly)}/w</Money><small>{wageBill.firstTeam.length+wageBill.youth.length} squad players</small></div></div>{[["First Team",wageBill.firstTeamWeekly],["U21 / Youth",wageBill.youthWeekly],["Staff Wages",wageBill.staffWeekly]].map(([n,v])=><div className="distribution" key={n}><span>{n}</span><b>{moneyStr(v)}</b><em>{Math.round(v/wageBill.totalWeekly*100)}%</em><Bar value={Math.round(v/wageBill.totalWeekly*100)}/></div>)}</Panel></div>
<div className="finance-grid spending-middle"><Panel title="Detailed Spending Breakdown" icon={Receipt}><div className="spending-table head"><span>CATEGORY</span><span>SEASON TOTAL</span><span>% OF TOTAL</span></div>{spendRows.map(r=><div className="spending-row" key={r.name}><b>{r.name}</b><span>{moneyStr(r.amount)}</span><span>{r.pct}%</span></div>)}<div className="total-row"><b>Total Spending</b><strong>{moneyStr(spendTotal)}</strong><strong>100%</strong></div></Panel><Panel title="Transfer Budget" icon={ArrowUpRight} action="View Details"><Money>£{Math.round(budget.available).toLocaleString()}</Money><span>Available Transfer Funds</span><Bar value={Math.round((spent/budget.total)*100)}/><div className="two-stat"><span>Spent this window <b>£{Math.round(spent).toLocaleString()}</b></span><span>Remaining <b>£{Math.round(budget.available).toLocaleString()}</b></span></div><h3>Budget Allocation</h3>{[["First Team",70,"£140,000,000"],["U21 / Youth",15,"£30,000,000"],["Other",15,"£30,000,000"]].map(x=><div className="distribution" key={x[0]}><span>{x[0]}</span><em>{x[1]}%</em><Bar value={x[1]}/><b>{x[2]}</b></div>)}</Panel><Panel title="Player & Staff Wages" icon={Users} action="View All"><div className="earner-cols"><div><h3>Top Earners (Players)</h3>{topPlayerEarners.map(p=><div key={p.id}><span>{p.name}</span><b>{p.wage}</b></div>)}</div><div><h3>Top Earners (Staff)</h3>{topStaffEarners.map(s=><div key={s.id}><span>{s.name}</span><b>£{s.wage.toLocaleString()}/w</b></div>)}</div></div></Panel></div>
<div className="finance-grid spending-bottom"><Panel title="Transfer Spending History" icon={ArrowUpRight} action="View All" onAction={()=>setActive&&setActive('Transfers')}>{transferHistory.length===0 && <p className="muted-sub">No transfers completed yet this window.</p>}{transferHistory.slice(0,5).map(h=><div className="history-row" key={h.id}><span>{h.date}</span><b>{h.name}</b><span>{h.from} → {h.to}</span><strong>£{Math.round(h.fee).toLocaleString()}</strong></div>)}</Panel><Panel title="Operating Costs" icon={Building2} action="View Details">{[["Training Facilities","£1,200,000"],["Youth Academy","£980,000"],["Travel & Accommodation","£860,000"],["Medical & Physio","£740,000"],["Miscellaneous","£1,830,000"]].map(x=><div className="cost-row" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}<div className="cost-total">Total Operating Costs <b>£5,610,000</b></div></Panel><Panel title="Budget Forecast" icon={BarChart3} action="View Details"><MiniChart forecast/></Panel></div></div>}
function Contracts({setActive}){
  const [selected,setSelected]=useState(contracts[0]);
  const wageBill = useWageBill();
  const fin = useFinanceData();
  const expiringCount = contracts.filter(c=>c[3]==="Expiring Soon").length;
  const renewalCount = contracts.filter(c=>c[3]==="Renewal In Progress").length;
  const selectedRoster = roster.find(p=>p.name===selected[0]);
  const healthPct = fin.financialStatus==='Healthy'?82:fin.financialStatus==='Caution'?55:28;
  return <div className="finance-content"><div className="finance-grid contracts-top"><Panel title="Contracts Overview" icon={FileText} action="View All Contracts"><div className="contract-metrics"><div><b>{contracts.length}</b><span>Active Contracts</span><small>First team & squad</small></div><div><b>{expiringCount}</b><span>Expiring (≤ 6 months)</span><small>Needs attention</small></div><div><b>{renewalCount}</b><span>Renewals in Progress</span><small>In talks</small></div><div><b>£{(wageBill.totalAnnual/1_000_000).toFixed(1)}M</b><span>Total Wage Commitment</span><small>per year</small></div></div><div className="contract-table"><div className="t-head"><span>PLAYER</span><span>POSITION</span><span>AGE</span><span>STATUS</span><span>CONTRACT EXPIRES</span><span>ACTION</span></div>{contracts.map(c=><button className="contract-row" key={c[0]} onClick={()=>setSelected(c)}><b>{c[0]}</b><span>{c[1]}</span><span>{c[2]}</span><span className={`status ${c[3].includes("Expiring")?"warn":c[3].includes("Renewal")?"blue":"good"}`}>{c[3]}</span><span>{c[4]}</span><strong>{c[3].includes("Contract Ok")?"—":"Renew"}</strong></button>)}</div></Panel><Panel title="Player Contract Details" icon={FileText}><div className="selected-contract"><div className="portrait">{selected[0].split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><h3>{selected[0]}</h3><span>{selected[1]} · {selectedRoster?.nat||''}</span><b>Age {selected[2]}</b><div className="stars">★★★★★ <small>{selectedRoster?Math.round(selectedRoster.ovr/10):8}/10</small></div></div></div><div className="contract-details">{[["Contract Type","Full Time"],["Contract Length",selected[3]==="Expiring Soon"?"< 1 Year":"Multi-Year"],["Weekly Wage",selected[5]],["Annual Wage",moneyStr(wageNum(selected[5])*52)],["Signing Bonus",moneyStr(wageNum(selected[5])*52*0.15)],["Agent Fee",moneyStr(wageNum(selected[5])*52*0.08)],["Release Clause",selectedRoster?.value?moneyStr(Number(String(selectedRoster.value).replace(/[^0-9]/g,''))*1.6):"—"]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div><button className="purple-action" onClick={()=>setActive&&setActive('Squad')}>Negotiate Contract <Handshake/></button></Panel><Panel title="Club Finances & Partners" icon={Handshake} action="View Details" onAction={()=>setActive&&setActive('Finance')}><h3>Sponsors</h3><Money>{moneyStr(SPONSOR_TOTAL)}</Money><span>{SPONSOR_DEALS.length} Active Deals · / season</span>{SPONSOR_DEALS.map(([n,v])=><div className="partner-row" key={n}><span>{n}</span><b>{v}</b></div>)}<hr/><div className="fund-list"><div>Available Funds <Money>{moneyStr(fin.balance)}</Money></div><div>Board Investment <b>£25,000,000</b></div><div>Loans <b>£0</b></div><div>Financial Restrictions <span className={`status ${fin.financialStatus==='Healthy'?'good':'warn'}`}>{fin.financialStatus==='Healthy'?'None':'Board monitoring'}</span></div></div><div className="financial-health"><Ring value={healthPct}/><span>Financial Health</span><b>{fin.financialStatus}</b></div></Panel></div>
<div className="finance-grid contracts-bottom"><Panel title="Staff Contracts" icon={Users} action="View All Staff" onAction={()=>setActive&&setActive('Staff')}>{[...wageBill.staffList].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,5).map(s=><div className="staff-contract" key={s.id}><b>{s.name}</b><span>{s.category}</span><span>{s.contract}</span><strong className={String(s.contract).includes('2026')?"warn":"good"}>{String(s.contract).includes('2026')?"Renewal":"Ok"}</strong></div>)}</Panel><Panel title="Contract Commitments" icon={Coins} action="View All"><div className="commit-list">{[["Total First Team Contracts",moneyStr(wageBill.firstTeamWeekly*52)],["Total Staff Contracts",moneyStr(wageBill.staffWeekly*52)],["Total Bonuses (committed)",moneyStr(wageBill.totalAnnual*0.11)],["Total Agent Fees (committed)",moneyStr(wageBill.totalAnnual*0.06)],["Total Contract Commitments",moneyStr(wageBill.totalAnnual*1.17)]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></Panel><Panel title="Key Financial Metrics" icon={Percent}><div className="metric-stack"><div>Wage to Turnover Ratio <b>{Math.min(99,Math.round(wageBill.totalAnnual/fin.totalIncome*100)||58)}%</b></div><div>Transfer Spend (Season) <b>{moneyStr(spending.find(s=>s[0]==='Transfers')?wageNum(spending.find(s=>s[0]==='Transfers')[2]):0)}</b></div><div>Net Spend / Income <Money down={fin.netProfit<0}>{fin.netProfit<0?"-":"+"}{moneyStr(Math.abs(fin.netProfit))}</Money></div><div>Operating Costs <b>£6,100,000</b></div><div>Profit / Loss (Season) <Money down={fin.netProfit<0}>{fin.netProfit<0?"-":"+"}{moneyStr(Math.abs(fin.netProfit))}</Money></div></div></Panel><Panel title="Financial Forecast" icon={BarChart3} action="View Forecast"><MiniChart forecast/></Panel></div><Transactions setActive={setActive}/></div>}

export default function FinanceScreen({setActive}){const [tab,setTab]=useState("overview"); return <div className="finance-page"><FinanceTabs tab={tab} setTab={setTab}/>{tab==="overview"?<Overview setActive={setActive}/>:tab==="revenue"?<Revenue setActive={setActive}/>:tab==="spending"?<Spending setActive={setActive}/>:<Contracts setActive={setActive}/>}</div>}
