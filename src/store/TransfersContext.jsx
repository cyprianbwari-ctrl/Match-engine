import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { players as worldPlayers } from '../data/worldData.js';
import { players as roster } from '../data/roster.js';
import { useFinanceData } from './FinanceContext.jsx';

const TransfersCtx = createContext(null);

// A handful of our own players are shown as available/listed in the market
// too (Man Utd sell/loan players out, not just buy) — sourced straight from
// the real squad roster so the numbers stay consistent with Squad/Tactics.
const OWN_LISTED_IDS = [12, 10, 11]; // Bayındır, Garnacho, Højlund — squad depth pieces, not first-choice

function moneyToNumber(v) {
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return String(v).includes('M') ? n * 1_000_000 : n;
}
function formatEUR(n) {
  return '€' + Math.round(n).toLocaleString('en-GB');
}
function formatEURShort(n) {
  if (n >= 1_000_000) return '€' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  return '€' + Math.round(n / 1000) + 'k';
}

// Deterministic pseudo-randomness so a given player's preference/interest
// don't reshuffle every render.
function seeded(id, salt = 0) {
  const x = Math.sin(id * 999 + salt * 37.7) * 10000;
  return x - Math.floor(x);
}

function statusFor(p, isOwn) {
  if (isOwn) return 'Listed';
  if (p.availability === 'Transfer Listed') return 'Listed';
  if (p.availability === 'Not for Sale') return seeded(p.id, 1) > 0.7 ? 'Interested' : 'Not Interested';
  return seeded(p.id, 2) > 0.4 ? 'Available' : 'Interested';
}
// Loan approaches are only realistic for a player who is unhappy at their
// club, or whose club has already loan-listed them — not just any player
// you fancy borrowing.
function loanEligibility(id) {
  const unhappy = seeded(id, 30) > 0.78;
  const loanListedByClub = seeded(id, 31) > 0.85;
  return { unhappy, loanListedByClub };
}

const RIVAL_CLUBS = ['Chelsea', 'PSG', 'Bayern Munich', 'Real Madrid', 'Liverpool', 'Arsenal', 'Barcelona', 'Newcastle'];

function buildMarket() {
  const external = worldPlayers
    .filter(p => p.club !== 'Man Utd')
    .map(p => {
      const value = moneyToNumber(p.value);
      const asking = Math.round(value * (1.08 + seeded(p.id) * 0.28));
      const preference = Math.round(30 + seeded(p.id, 3) * 60);
      const interestCount = 1 + Math.floor(seeded(p.id, 4) * 3);
      const interest = RIVAL_CLUBS.filter((_, i) => seeded(p.id, 10 + i) > 0.55).slice(0, interestCount)
        .map((club, i) => ({ club, level: ['Low', 'Medium', 'High'][Math.floor(seeded(p.id, 20 + i) * 3)] }));
      const { unhappy, loanListedByClub } = loanEligibility(p.id);
      return {
        id: p.id, name: p.name, nat: p.nat, club: p.club, league: p.league, pos: p.pos,
        age: p.age, ovr: p.rating, pot: p.potential, value, asking, preference,
        contractExpiry: p.contractExpiry, status: statusFor(p, false), interest, isOwn: false,
        wage: p.wage, tacticalRole: p.tacticalRole, keyAttributes: p.keyAttributes,
        career: p.career, recentResults: p.recentResults, reputation: p.reputation, country: p.country,
        unhappy, loanListedByClub,
      };
    });

  const own = roster.filter(p => OWN_LISTED_IDS.includes(p.id)).map(p => {
    const value = (p.ovr - 40) * 1_500_000;
    return {
      id: `own-${p.id}`, rosterId: p.id, name: p.name, nat: p.nat, club: 'Man Utd', league: 'Premier League',
      pos: p.displayPos, age: p.age, ovr: p.ovr, pot: Math.min(96, p.ovr + 4), value,
      asking: Math.round(value * 1.15), preference: 100,
      contractExpiry: `30 Jun ${2026 + (p.id % 3)}`, status: 'Listed', interest: RIVAL_CLUBS.slice(0, 2).map((c,i)=>({club:c,level:i===0?'Medium':'Low'})),
      isOwn: true, wage: p.wage, tacticalRole: p.playTime, keyAttributes: { Fitness: p.fit, Form: Math.round((p.form?.[p.form.length-1]||7)*10) },
      career: [], recentResults: [], reputation: 'Squad Player', country: p.nat,
    };
  });

  return [...external, ...own];
}

export function TransfersProvider({ children }) {
  const finance = useFinanceData();
  const [market, setMarket] = useState(buildMarket);
  const [budget, setBudget] = useState({ total: 120_000_000, available: 120_000_000, wageAvailable: 320_000 });
  const [targetIds, setTargetIds] = useState([]);
  const [interestStars, setInterestStars] = useState({});
  const [negotiations, setNegotiations] = useState([]);
  const [incomingOffers, setIncomingOffers] = useState([
    { id: 'inc-1', playerName: 'Marcus Rashford', fromClub: 'Chelsea', fee: 65_000_000, status: 'Pending' },
    { id: 'inc-2', playerName: 'Kobbie Mainoo', fromClub: 'PSG', fee: 55_000_000, status: 'Pending' },
  ]);
  const [loansOut, setLoansOut] = useState([]);
  const [loansIn, setLoansIn] = useState([
    { id: 'li-1', name: 'Randal Kolo Muani', club: 'PSG', pos: 'ST', ovr: 82, fee: 4_000_000, wageShare: 60, duration: 'Season-long', purchaseOption: '€45M' },
  ]);
  const [history, setHistory] = useState([]);
  const [signings, setSignings] = useState([]);
  // Shared source of truth for "is this one of OUR players transfer/loan
  // listed" — read by Squad so the status pill stays in sync no matter
  // which screen the change was made from.
  const [transferListedRosterIds, setTransferListedRosterIds] = useState([]);
  const [loanApproaches, setLoanApproaches] = useState([]);
  const [news, setNews] = useState([
    { time: '10:24', text: 'Chelsea have entered the race for Victor Osimhen' },
    { time: '09:17', text: 'PSG are monitoring Rafael Leão\'s situation' },
    { time: 'Yesterday', text: 'Man Utd make initial offer for Florian Wirtz' },
    { time: 'Yesterday', text: 'Liverpool interested in João Neves' },
    { time: '2 days ago', text: 'Newcastle submit bid for Rasmus Højlund' },
  ]);

  const pushNews = useCallback((text) => {
    setNews(n => [{ time: 'Just now', text }, ...n].slice(0, 30));
  }, []);

  const findPlayer = useCallback((id) => market.find(p => p.id === id), [market]);

  const addTarget = useCallback((id) => setTargetIds(ts => ts.includes(id) ? ts : [...ts, id]), []);
  const removeTarget = useCallback((id) => setTargetIds(ts => ts.filter(x => x !== id)), []);
  const setStars = useCallback((id, stars) => setInterestStars(s => ({ ...s, [id]: stars })), []);

  const makeOffer = useCallback((playerId, feeOffer) => {
    const player = findPlayer(playerId);
    if (!player) return;
    addTarget(playerId);
    setNegotiations(negs => {
      const existing = negs.find(n => n.playerId === playerId && n.status !== 'Completed' && n.status !== 'Withdrawn' && n.status !== 'Rejected');
      const gap = player.asking - feeOffer;
      let clubResponse, status, quote;
      if (gap <= 0) { status = 'Club Agreed'; clubResponse = feeOffer; quote = `${player.club} accept your offer.`; }
      else if (gap < player.asking * 0.08) { status = 'Negotiating'; clubResponse = player.asking; quote = `"€${Math.round(player.asking/1e6)}M guaranteed, and we won't go much lower."`; }
      else { status = 'Negotiating'; clubResponse = Math.round(feeOffer + gap * 0.55); quote = `"We value ${player.name.split(' ').slice(-1)[0]} higher than that — try again."`; }
      const entry = { id: existing?.id || `neg-${playerId}-${Date.now()}`, playerId, yourOffer: feeOffer, clubOffer: clubResponse, status, quote, round: (existing?.round || 0) + 1 };
      pushNews(`${status === 'Club Agreed' ? 'Deal agreed' : 'Bid submitted'} for ${player.name} — €${Math.round(feeOffer/1e6)}M`);
      if (existing) return negs.map(n => n.id === existing.id ? entry : n);
      return [entry, ...negs];
    });
  }, [findPlayer, addTarget, pushNews]);

  const counterOffer = useCallback((negId, newFee) => {
    setNegotiations(negs => negs.map(n => {
      if (n.id !== negId) return n;
      const player = findPlayer(n.playerId);
      const gap = player.asking - newFee;
      let status, clubOffer, quote;
      if (gap <= 0) { status = 'Club Agreed'; clubOffer = newFee; quote = `${player.club} accept your revised offer.`; }
      else if (gap < player.asking * 0.05 || n.round >= 3) { status = 'Club Agreed'; clubOffer = Math.round((newFee + player.asking) / 2); quote = `${player.club} accept, meeting in the middle.`; }
      else { status = 'Negotiating'; clubOffer = Math.round(newFee + gap * 0.5); quote = `"Getting closer, but still not enough."`; }
      return { ...n, yourOffer: newFee, clubOffer, status, quote, round: n.round + 1 };
    }));
  }, [findPlayer]);

  const withdrawNegotiation = useCallback((negId) => {
    setNegotiations(negs => negs.map(n => n.id === negId ? { ...n, status: 'Withdrawn' } : n));
  }, []);

  const completeTransfer = useCallback((negId, terms) => {
    setNegotiations(negs => {
      const neg = negs.find(n => n.id === negId);
      if (!neg) return negs;
      const player = findPlayer(neg.playerId);
      setBudget(b => ({ ...b, available: Math.max(0, b.available - neg.clubOffer), wageAvailable: Math.max(0, b.wageAvailable - (terms?.wage || 0)) }));
      finance.addTransaction(`${player.name} signing fee — ${player.club}`, -neg.clubOffer, 'Transfers');
      setHistory(h => [{
        id: `hist-${negId}`, name: player.name, from: player.club, to: 'Man Utd', fee: neg.clubOffer,
        date: 'Today', type: 'Transfer', wage: terms?.wage || 0, years: terms?.years || 4,
      }, ...h]);
      setSignings(s => [...s, { ...player, wage: terms?.wage, years: terms?.years }]);
      pushNews(`${player.name} completes his move to Manchester United`);
      return negs.map(n => n.id === negId ? { ...n, status: 'Completed' } : n);
    });
  }, [findPlayer, pushNews, finance]);

  const respondIncoming = useCallback((offerId, action) => {
    setIncomingOffers(offers => offers.map(o => {
      if (o.id !== offerId) return o;
      if (action === 'accept') {
        setBudget(b => ({ ...b, available: b.available + o.fee }));
        finance.addTransaction(`${o.playerName} sale — ${o.fromClub}`, o.fee, 'Player Sales');
        pushNews(`${o.fromClub} complete the signing of ${o.playerName}`);
        return { ...o, status: 'Accepted' };
      }
      if (action === 'reject') return { ...o, status: 'Rejected' };
      if (action === 'counter') return { ...o, fee: Math.round(o.fee * 1.15), status: 'Countered' };
      return o;
    }));
  }, [pushNews, finance]);

  const toggleLoanListed = useCallback((rosterPlayer) => {
    setLoansOut(lo => {
      const exists = lo.find(x => x.rosterId === rosterPlayer.id);
      if (exists) return lo.filter(x => x.rosterId !== rosterPlayer.id);
      return [...lo, { id: `lo-${rosterPlayer.id}`, rosterId: rosterPlayer.id, name: rosterPlayer.name, pos: rosterPlayer.displayPos, ovr: rosterPlayer.ovr, interestedClubs: [], status: 'Listed' }];
    });
  }, []);

  const toggleTransferListed = useCallback((rosterId, rosterName) => {
    setTransferListedRosterIds(ids => {
      const on = !ids.includes(rosterId);
      pushNews(`${rosterName} ${on ? 'is placed on the transfer list' : 'is taken off the transfer list'}.`);
      return on ? [...ids, rosterId] : ids.filter(x => x !== rosterId);
    });
  }, [pushNews]);

  // "Approach for Transfer" — a softer first contact than a formal Make
  // Offer: it opens a negotiation with a conservative opening bid so the
  // manager can see the club's reaction before committing higher.
  const approachTransfer = useCallback((playerId) => {
    const player = findPlayer(playerId);
    if (!player) return;
    makeOffer(playerId, Math.round(player.asking * 0.82));
    pushNews(`Manchester United make contact with ${player.club} over ${player.name}.`);
  }, [findPlayer, makeOffer, pushNews]);

  // "Approach for Loan" — only realistic when the player is unhappy at
  // their club, or their club has already loan-listed them.
  const approachLoan = useCallback((playerId) => {
    const player = findPlayer(playerId);
    if (!player) return { ok: false, reason: 'Not found' };
    if (!player.unhappy && !player.loanListedByClub) {
      return { ok: false, reason: `${player.club} have no interest in a loan deal for ${player.name} right now.` };
    }
    setLoanApproaches(las => {
      const existing = las.find(l => l.playerId === playerId && l.status === 'Pending');
      if (existing) return las;
      return [{ id: `loanreq-${playerId}-${Date.now()}`, playerId, status: 'Pending' }, ...las];
    });
    pushNews(`Manchester United enquire about a loan move for ${player.name}.`);
    return { ok: true };
  }, [findPlayer, pushNews]);

  // AI managers actually making decisions — a rival club genuinely signs a
  // player from the wider market, changing that player's club for real
  // (so they show up at their new club everywhere from then on), not just
  // a news headline with no consequence behind it.
  const simulateAITransferActivity = useCallback(() => {
    // Compute the move from current market state directly, not inside the
    // setState updater — same timing hazard as the Player of the Month
    // bug: relying on the updater running synchronously before the next
    // line reads the result is not guaranteed.
    const candidates = market.filter(p => !p.isOwn && p.status !== 'Not Interested' && p.interest?.length > 0);
    if (!candidates.length) return null;
    const player = candidates[Math.floor(Math.random() * candidates.length)];
    const buyer = player.interest[Math.floor(Math.random() * player.interest.length)]?.club;
    if (!buyer || buyer === player.club) return null;
    const moved = { name: player.name, from: player.club, to: buyer };
    setMarket(mkt => mkt.map(p => p.id === player.id
      ? { ...p, club: buyer, status: 'Not Interested', interest: [], contractExpiry: p.contractExpiry }
      : p));
    pushNews(`${moved.name} completes a move from ${moved.from} to ${moved.to}.`);
    return moved;
  }, [market, pushNews]);

  const value = useMemo(() => ({
    market, budget, setBudget,
    targetIds, addTarget, removeTarget, interestStars, setStars,
    negotiations, makeOffer, counterOffer, withdrawNegotiation, completeTransfer,
    incomingOffers, respondIncoming,
    loansOut, loansIn, toggleLoanListed,
    transferListedRosterIds, toggleTransferListed,
    loanApproaches, approachTransfer, approachLoan, simulateAITransferActivity,
    history, signings, news, pushNews,
    findPlayer, formatEUR, formatEURShort,
    getSnapshot: () => ({
      budget, targetIds, interestStars, negotiations, incomingOffers, loansOut, loansIn,
      transferListedRosterIds, loanApproaches, history, signings, news,
    }),
    restoreSnapshot: (s) => {
      if (!s) return;
      if (s.budget) setBudget(s.budget);
      if (s.targetIds) setTargetIds(s.targetIds);
      if (s.interestStars) setInterestStars(s.interestStars);
      if (s.negotiations) setNegotiations(s.negotiations);
      if (s.incomingOffers) setIncomingOffers(s.incomingOffers);
      if (s.loansOut) setLoansOut(s.loansOut);
      if (s.loansIn) setLoansIn(s.loansIn);
      if (s.transferListedRosterIds) setTransferListedRosterIds(s.transferListedRosterIds);
      if (s.loanApproaches) setLoanApproaches(s.loanApproaches);
      if (s.history) setHistory(s.history);
      if (s.signings) setSignings(s.signings);
      if (s.news) setNews(s.news);
    },
  }), [market, budget, targetIds, interestStars, negotiations, incomingOffers, loansOut, loansIn,
      transferListedRosterIds, loanApproaches, history, signings, news, findPlayer, toggleTransferListed, approachTransfer, approachLoan, simulateAITransferActivity]);

  return <TransfersCtx.Provider value={value}>{children}</TransfersCtx.Provider>;
}

export function useTransfersData() {
  const ctx = useContext(TransfersCtx);
  if (!ctx) throw new Error('useTransfersData must be used within a TransfersProvider');
  return ctx;
}

export { formatEUR, formatEURShort };
