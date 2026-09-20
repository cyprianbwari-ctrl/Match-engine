import React, { useMemo, useState } from "react";
import {
  Handshake, RefreshCw, Target, FileText, Repeat2, ClipboardList, Search, ChevronDown,
  SlidersHorizontal, Star, Plus, Minus, ArrowRight, X, Check, Newspaper, WalletCards,
  TrendingUp, UserRound, Trash2, ArrowLeftRight, Info,
} from "lucide-react";
import "./transfers.css";
import { useTransfersData, formatEURShort } from "./store/TransfersContext.jsx";
import { useWorldData } from "./store/WorldContext.jsx";
import { useDatabase } from "./store/DatabaseContext.jsx";

const TABS = [
  ["Market", "Transfer Market", RefreshCw],
  ["Targets", "My Targets", Target],
  ["Negotiations", "Negotiations", Handshake],
  ["Offers", "Offers", FileText],
  ["Loans", "Loans", Repeat2],
  ["History", "Transfer History", ClipboardList],
];

const STATUS_CLASS = { Listed: "st-listed", Available: "st-available", Interested: "st-interested", "Not Interested": "st-notint", Negotiable: "st-negotiable" };

function Avatar({ name, size = 40 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className="tr-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>;
}
function ClubCrest({ club, size = 26 }) {
  const initials = club.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className="tr-crest" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</span>;
}
function InterestLevel({ level }) {
  return <em className={`int-lvl ${level.toLowerCase()}`}>{level}</em>;
}

// ================= MARKET =================

function MarketTab({ market, selected, setSelected }) {
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState("All");
  const [ageMax, setAgeMax] = useState("All");
  const [ovrMin, setOvrMin] = useState(70);
  const [league, setLeague] = useState("All");
  const [moreOpen, setMoreOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const positions = ["All", ...new Set(market.map(p => p.pos))];
  const leagues = ["All", ...new Set(market.map(p => p.league))];

  const filtered = useMemo(() => market.filter(p =>
    (!query || `${p.name} ${p.club} ${p.country || ""}`.toLowerCase().includes(query.toLowerCase())) &&
    (pos === "All" || p.pos === pos) &&
    (ageMax === "All" || p.age <= Number(ageMax)) &&
    (p.ovr >= ovrMin) &&
    (league === "All" || p.league === league) &&
    (statusFilter === "All" || p.status === statusFilter)
  ), [market, query, pos, ageMax, ovrMin, league, statusFilter]);

  return <>
    <div className="tr-filters">
      <div className="tr-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search player, club or nationality..." /></div>
      <label className="tr-field"><span>Position</span><select value={pos} onChange={e => setPos(e.target.value)}>{positions.map(p => <option key={p}>{p}</option>)}</select></label>
      <label className="tr-field"><span>Age</span><select value={ageMax} onChange={e => setAgeMax(e.target.value)}><option>All</option>{[21, 24, 27, 30, 34].map(a => <option key={a} value={a}>Under {a}</option>)}</select></label>
      <label className="tr-field"><span>Overall</span><select value={ovrMin} onChange={e => setOvrMin(Number(e.target.value))}>{[0, 60, 70, 75, 80, 85].map(v => <option key={v} value={v}>{v === 0 ? "All" : `Min ${v}`}</option>)}</select></label>
      <label className="tr-field"><span>League</span><select value={league} onChange={e => setLeague(e.target.value)}>{leagues.map(l => <option key={l}>{l}</option>)}</select></label>
      <button className="tr-more-btn" onClick={() => setMoreOpen(o => !o)}><SlidersHorizontal size={14} />More Filters<ChevronDown size={13} /></button>
    </div>
    {moreOpen && <div className="tr-more-pills">
      {["All", "Listed", "Available", "Interested", "Not Interested"].map(s => <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>{s}</button>)}
    </div>}

    <div className="tr-grid">
      <section className="tr-panel tr-table-panel">
        <div className="tr-table-head">
          <span>Player</span><span>Club</span><span>Pos</span><span>Age</span><span>OVR</span><span>Pot</span>
          <span>Value</span><span>Asking Price</span><span>Contract</span><span>Pref</span><span>Status</span>
        </div>
        <div className="tr-table-body">
          {filtered.map(p => <button key={p.id} className={`tr-row ${selected?.id === p.id ? "sel" : ""}`} onClick={() => setSelected(p)}>
            <span className="tr-name-cell"><Avatar name={p.name} /><div><b>{p.name}</b><small>{p.nat}</small></div></span>
            <span className="tr-club-cell"><ClubCrest club={p.club} /><small>{p.club}</small></span>
            <span>{p.pos}</span>
            <span>{p.age}</span>
            <b className="badge ovr">{p.ovr}</b>
            <b className="badge pot">{p.pot}</b>
            <span>{formatEURShort(p.value)}</span>
            <span>{formatEURShort(p.asking)}</span>
            <span className="tr-contract">{p.contractExpiry}</span>
            <span className="tr-pref"><div className="pref-track"><i style={{ width: `${p.preference}%` }} /></div><small>{p.preference}%</small></span>
            <span className={`status-pill ${STATUS_CLASS[p.status] || "st-available"}`}>{p.status}</span>
          </button>)}
          {filtered.length === 0 && <p className="muted-sub" style={{ padding: 16 }}>No players match these filters.</p>}
        </div>
      </section>

      {selected && <PlayerSidePanel player={selected} />}
    </div>
  </>;
}

function PlayerSidePanel({ player }) {
  const { addTarget, makeOffer, formatEURShort } = useTransfersData();
  const { openProfileFor, } = useWorldData();
  const [tab, setTab] = useState("Overview");
  const stars = Math.round(player.ovr / 20);

  return <aside className="tr-side">
    <div className="tr-side-head">
      <div className="tr-side-photo"><Avatar name={player.name} size={64} /></div>
      <div className="tr-side-id">
        <h3>{player.name}</h3>
        <span className="tr-side-club"><ClubCrest club={player.club} size={18} />{player.club}</span>
        <small>{player.pos} · {player.age} years old</small>
      </div>
    </div>
    <div className="tr-side-rating"><b className="badge ovr big">{player.ovr}</b><div className="stars-row">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={14} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "" : "off"} />)}</div></div>

    <div className="tr-side-tabs">{["Overview", "Attributes", "Transfer", "Reports"].map(t => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>

    {tab === "Overview" && <div className="tr-side-body">
      <div className="tr-side-row"><span>Market Value</span><b>{formatEURShort(player.value)}</b></div>
      <div className="tr-side-row"><span>Asking Price</span><b>{formatEURShort(player.asking)}</b></div>
      <div className="tr-side-row"><span>Contract Ends</span><b>{player.contractExpiry}</b></div>
      <div className="tr-side-block">
        <span>Player Preference</span>
        <div className="pref-track big"><i style={{ width: `${player.preference}%` }} /></div>
        <b>{player.preference}%</b>
      </div>
      <div className="tr-side-block">
        <span>Current Interest</span>
        {player.interest.length === 0 && <p className="muted-sub">No other clubs monitoring this player.</p>}
        {player.interest.map(it => <div className="tr-interest-row" key={it.club}><ClubCrest club={it.club} size={22} /><b>{it.club}</b><InterestLevel level={it.level} /></div>)}
      </div>
    </div>}
    {tab === "Attributes" && <div className="tr-side-body">
      {Object.entries(player.keyAttributes || {}).map(([k, v]) => <div className="attr-row" key={k}><span>{k}</span><div className="attr-track"><i style={{ width: `${v}%` }} /></div><b>{v}</b></div>)}
    </div>}
    {tab === "Transfer" && <div className="tr-side-body">
      <div className="tr-side-row"><span>Tactical Role</span><b>{player.tacticalRole}</b></div>
      <div className="tr-side-row"><span>Reputation</span><b>{player.reputation}</b></div>
      <div className="tr-side-row"><span>Wage</span><b>{player.wage}</b></div>
      <p className="muted-sub">{player.club} {player.status === "Listed" ? "have listed this player for transfer." : player.status === "Not Interested" ? "are not currently open to offers." : "may be open to a sale at the right price."}</p>
    </div>}
    {tab === "Reports" && <div className="tr-side-body"><p className="muted-sub">No scout reports filed yet for {player.name}. Send a scout from the Scouting tab to build a full report.</p></div>}

    <div className="tr-side-actions">
      <button className="tr-btn" onClick={() => openProfileFor({ ...player, rating: player.ovr, value: formatEURShort(player.value) }, 'Transfers')}><UserRound size={15} />View Profile</button>
      <button className="tr-btn primary" onClick={() => { addTarget(player.id); makeOffer(player.id, Math.round(player.asking * 0.9)); }}><Handshake size={15} />Make Offer</button>
    </div>
  </aside>;
}

// ================= MY TARGETS =================

function TargetsTab({ market, goToNegotiations }) {
  const { targetIds, removeTarget, interestStars, setStars, makeOffer } = useTransfersData();
  const targets = targetIds.map(id => market.find(p => p.id === id)).filter(Boolean);
  return <div className="tr-targets-grid">
    {targets.length === 0 && <p className="muted-sub" style={{ padding: 20 }}>No transfer targets yet. Add players from the Transfer Market or Scouting.</p>}
    {targets.map(p => {
      const stars = interestStars[p.id] || 3;
      return <section className="tr-panel target-card" key={p.id}>
        <div className="target-head"><Avatar name={p.name} size={46} /><div><h3>{p.name}</h3><small>{p.club} · {p.pos} · {p.ovr} OVR</small></div>
          <button className="icon-btn" onClick={() => removeTarget(p.id)}><Trash2 size={15} /></button></div>
        <div className="target-stats">
          <div><span>Market Value</span><b>{formatEURShort(p.value)}</b></div>
          <div><span>Asking Price</span><b>{formatEURShort(p.asking)}</b></div>
          <div><span>Preference</span><b>{p.preference}%</b></div>
        </div>
        <div className="target-your-interest">
          <span>Your Interest</span>
          <div className="stars-row edit">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={16} fill={i < stars ? "currentColor" : "none"} onClick={() => setStars(p.id, i + 1)} />)}</div>
        </div>
        {p.interest.length > 0 && <div className="target-others">
          <span>Other Interest</span>
          {p.interest.map(it => <div key={it.club} className="tr-interest-row"><b>{it.club}</b><InterestLevel level={it.level} /></div>)}
        </div>}
        <div className="target-actions">
          <button className="tr-btn" onClick={() => makeOffer(p.id, Math.round(p.asking * 0.9))}>Make Offer</button>
          <button className="tr-btn" onClick={goToNegotiations}>View Negotiation</button>
        </div>
      </section>;
    })}
  </div>;
}

// ================= NEGOTIATIONS =================

function NegotiationCard({ neg, player }) {
  const { counterOffer, withdrawNegotiation, completeTransfer, formatEURShort } = useTransfersData();
  const [counter, setCounter] = useState(neg.yourOffer);
  const [personalStage, setPersonalStage] = useState(false);
  const [wage, setWage] = useState(180000);
  const [years, setYears] = useState(4);

  if (neg.status === "Completed") return null;

  return <section className="tr-panel neg-card">
    <div className="neg-head"><Avatar name={player.name} /><div><h3>{player.name.toUpperCase()} — {player.club.toUpperCase()}</h3><small>{player.pos} · {player.ovr} OVR</small></div>
      <span className={`status-pill ${neg.status === "Club Agreed" ? "st-listed" : neg.status === "Withdrawn" || neg.status === "Rejected" ? "st-notint" : "st-negotiable"}`}>{neg.status}</span></div>
    <div className="neg-figures">
      <div><span>{player.club} asking</span><b>{formatEURShort(player.asking)}</b></div>
      <div><span>Your latest offer</span><b>{formatEURShort(neg.yourOffer)}</b></div>
      <div><span>Club response</span><b>{formatEURShort(neg.clubOffer)}</b></div>
    </div>
    <p className="neg-quote">{neg.quote}</p>

    {neg.status === "Negotiating" && !personalStage && <>
      <div className="neg-adjust"><span>Counter Offer</span>
        <div className="number-control"><button onClick={() => setCounter(c => Math.max(0, c - 2_000_000))}><Minus size={14} /></button><b>{formatEURShort(counter)}</b><button onClick={() => setCounter(c => c + 2_000_000)}><Plus size={14} /></button></div>
      </div>
      <div className="neg-actions">
        <button className="tr-btn" onClick={() => withdrawNegotiation(neg.id)}>Withdraw</button>
        <button className="tr-btn primary" onClick={() => counterOffer(neg.id, counter)}>Counter Offer</button>
        <button className="tr-btn green" onClick={() => counterOffer(neg.id, neg.clubOffer)}>Accept ({formatEURShort(neg.clubOffer)})</button>
      </div>
    </>}

    {(neg.status === "Club Agreed" && !personalStage) && <div className="neg-actions">
      <p className="muted-sub" style={{ flex: "1 0 100%" }}>Club-to-club fee agreed at {formatEURShort(neg.clubOffer)}. Now negotiate personal terms with the player.</p>
      <button className="tr-btn primary" onClick={() => setPersonalStage(true)}>Negotiate Personal Terms <ArrowRight size={15} /></button>
      <button className="tr-btn" onClick={() => withdrawNegotiation(neg.id)}>Withdraw</button>
    </div>}

    {personalStage && <div className="personal-terms">
      <h4>Personal Terms</h4>
      <label className="field-label">Weekly Wage</label>
      <div className="number-control"><button onClick={() => setWage(w => Math.max(0, w - 10000))}><Minus size={14} /></button><b>£{wage.toLocaleString()} p/w</b><button onClick={() => setWage(w => w + 10000)}><Plus size={14} /></button></div>
      <label className="field-label">Contract Length</label>
      <select value={years} onChange={e => setYears(+e.target.value)}>{[3, 4, 5, 6].map(y => <option key={y} value={y}>{y} years</option>)}</select>
      <button className="tr-btn green wide" onClick={() => completeTransfer(neg.id, { wage, years })}><Check size={15} />Agree Terms → Medical → Complete</button>
    </div>}
  </section>;
}

function NegotiationsTab({ market }) {
  const { negotiations } = useTransfersData();
  const active = negotiations.filter(n => n.status !== "Completed");
  return <div className="tr-neg-list">
    {active.length === 0 && <p className="muted-sub" style={{ padding: 20 }}>No active negotiations. Make an offer from the Transfer Market to start one.</p>}
    {active.map(n => {
      const player = market.find(p => p.id === n.playerId);
      if (!player) return null;
      return <NegotiationCard key={n.id} neg={n} player={player} />;
    })}
  </div>;
}

// ================= OFFERS =================

function OffersTab({ market }) {
  const { incomingOffers, respondIncoming, negotiations, formatEURShort } = useTransfersData();
  const outgoing = negotiations;
  return <div className="offers-grid">
    <section className="tr-panel">
      <h3><FileText size={16} /> Incoming — Offers For Your Players</h3>
      {incomingOffers.map(o => <div className="offer-row" key={o.id}>
        <ClubCrest club={o.fromClub} /><div><b>{o.fromClub} → Newcastle United</b><small>{o.playerName}</small></div>
        <strong>{formatEURShort(o.fee)}</strong>
        {o.status === "Pending" ? <div className="offer-actions">
          <button onClick={() => respondIncoming(o.id, "reject")}>Reject</button>
          <button onClick={() => respondIncoming(o.id, "counter")}>Counter</button>
          <button className="accept" onClick={() => respondIncoming(o.id, "accept")}>Accept</button>
        </div> : <span className={`status-pill ${o.status === "Accepted" ? "st-listed" : "st-notint"}`}>{o.status}</span>}
      </div>)}
      {incomingOffers.length === 0 && <p className="muted-sub">No incoming offers right now.</p>}
    </section>
    <section className="tr-panel">
      <h3><ArrowLeftRight size={16} /> Outgoing — Your Bids</h3>
      {outgoing.map(n => {
        const player = market.find(p => p.id === n.playerId);
        if (!player) return null;
        return <div className="offer-row" key={n.id}>
          <ClubCrest club={player.club} /><div><b>Newcastle United → {player.club}</b><small>{player.name}</small></div>
          <strong>{formatEURShort(n.yourOffer)}</strong>
          <span className={`status-pill ${n.status === "Completed" ? "st-listed" : n.status === "Withdrawn" || n.status === "Rejected" ? "st-notint" : "st-negotiable"}`}>{n.status}</span>
        </div>;
      })}
      {outgoing.length === 0 && <p className="muted-sub">You haven't made any bids yet.</p>}
    </section>
  </div>;
}

// ================= LOANS =================

function LoansTab({ ownPlayers }) {
  const { loansOut, toggleLoanListed, loansIn } = useTransfersData();
  return <div className="offers-grid">
    <section className="tr-panel">
      <h3><Repeat2 size={16} /> Loan Out — Your Squad</h3>
      <p className="muted-sub">Toggle a fringe player to make them available for loan enquiries this window.</p>
      {ownPlayers.map(p => {
        const listed = loansOut.some(x => x.rosterId === p.id);
        return <div className="loan-row" key={p.id}>
          <Avatar name={p.name} size={34} /><div><b>{p.name}</b><small>{p.displayPos} · {p.ovr} OVR</small></div>
          <button className={`loan-toggle ${listed ? "on" : ""}`} onClick={() => toggleLoanListed(p)}>{listed ? "Listed" : "List for Loan"}</button>
        </div>;
      })}
    </section>
    <section className="tr-panel">
      <h3><TrendingUp size={16} /> Loan In — Available Now</h3>
      {loansIn.map(p => <div className="loan-in-card" key={p.id}>
        <div className="target-head"><Avatar name={p.name} size={40} /><div><b>{p.name}</b><small>{p.club} · {p.pos} · {p.ovr} OVR</small></div></div>
        <div className="target-stats">
          <div><span>Loan Fee</span><b>{formatEURShort(p.fee)}</b></div>
          <div><span>Wage Share</span><b>{p.wageShare}%</b></div>
          <div><span>Duration</span><b>{p.duration}</b></div>
        </div>
        <p className="muted-sub">Purchase option: {p.purchaseOption}</p>
        <button className="tr-btn primary wide">Enquire About Loan</button>
      </div>)}
    </section>
  </div>;
}

// ================= HISTORY =================

function HistoryTab() {
  const { history, formatEURShort } = useTransfersData();
  return <section className="tr-panel">
    <div className="hist-head"><span>Player</span><span>From</span><span>To</span><span>Fee</span><span>Wage</span><span>Date</span></div>
    {history.length === 0 && <p className="muted-sub" style={{ padding: 16 }}>No completed transfers yet this window.</p>}
    {history.map(h => <div className="hist-row" key={h.id}>
      <b>{h.name}</b><span>{h.from}</span><span>{h.to}</span><span>{formatEURShort(h.fee)}</span><span>£{(h.wage||0).toLocaleString()}/w</span><span>{h.date}</span>
    </div>)}
  </section>;
}

// ================= BOTTOM PANELS (Market tab only) =================

function BottomPanels({ market, setSelected, setTab }) {
  const { budget, negotiations, news } = useTransfersData();
  const usagePct = Math.round(100 - (budget.available / budget.total) * 100);
  const activeNegs = negotiations.filter(n => n.status !== "Completed").slice(0, 4);
  return <div className="tr-bottom-grid">
    <section className="tr-panel budget-panel">
      <h3><WalletCards size={16} /> Transfer Budget</h3>
      <div className="budget-row">
        <div className="budget-figures">
          <b>{formatEURShort(budget.available)}</b><span>Available for transfers</span>
          <b className="wage-line">€{Math.round(budget.wageAvailable).toLocaleString()}/week</b><span>Wage budget (available)</span>
        </div>
        <div className="budget-gauge">
          <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" className="gauge-bg" /><circle cx="50" cy="50" r="42" className="gauge-fg" strokeDasharray={`${usagePct * 2.64} 264`} /></svg>
          <div className="gauge-label"><b>{usagePct}%</b></div>
        </div>
      </div>
      <small className="muted-sub"><Info size={11} /> Budget usage</small>
    </section>
    <section className="tr-panel">
      <div className="panel-head-row"><h3><Handshake size={16} /> Active Negotiations</h3><button className="view-all" onClick={() => setTab("Negotiations")}>View All <ArrowRight size={13} /></button></div>
      {activeNegs.length === 0 && <p className="muted-sub">No active negotiations.</p>}
      {activeNegs.map(n => {
        const p = market.find(x => x.id === n.playerId);
        if (!p) return null;
        return <div className="mini-neg-row" key={n.id} onClick={() => { setSelected(p); }}>
          <Avatar name={p.name} size={30} /><b>{p.name}</b><span className="mini-club">{p.club}</span>
          <span className="mini-fee">{formatEURShort(n.yourOffer)} → {formatEURShort(n.clubOffer)}</span>
          <span className={`status-pill ${n.status === "Club Agreed" ? "st-listed" : "st-negotiable"}`}>{n.status === "Club Agreed" ? "Agreed" : "Negotiating"}</span>
        </div>;
      })}
    </section>
    <section className="tr-panel">
      <div className="panel-head-row"><h3><Newspaper size={16} /> Recent Transfer News</h3><button className="view-all">View All <ArrowRight size={13} /></button></div>
      {news.slice(0, 5).map((n, i) => <div className="news-row" key={i}><small>{n.time}</small><span>{n.text}</span></div>)}
    </section>
  </div>;
}

// ================= ROOT =================

export default function TransfersScreen({ setActive }) {
  const { careerSquad: rosterPlayers } = useDatabase();
  const { market, signings } = useTransfersData();
  const [tab, setTab] = useState("Market");
  const [selected, setSelected] = useState(market[0]);

  const ownPlayers = useMemo(() => rosterPlayers.filter(p => p.playTime !== "Youth"), []);

  return <div className="transfers-page">
    <div className="tr-head"><span className="tr-head-icon"><Handshake size={22} color="#06210a" /></span>
      <div><h1>TRANSFERS</h1><span>Search, scout, bid and negotiate transfers</span></div></div>

    <div className="tr-tabs">{TABS.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={14} />{label}</button>)}</div>

    {tab === "Market" && <>
      <MarketTab market={market} selected={selected} setSelected={setSelected} />
      <BottomPanels market={market} setSelected={setSelected} setTab={setTab} />
    </>}
    {tab === "Targets" && <TargetsTab market={market} goToNegotiations={() => setTab("Negotiations")} />}
    {tab === "Negotiations" && <NegotiationsTab market={market} />}
    {tab === "Offers" && <OffersTab market={market} />}
    {tab === "Loans" && <LoansTab ownPlayers={ownPlayers} />}
    {tab === "History" && <HistoryTab />}
  </div>;
}
