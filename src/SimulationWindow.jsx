import React, { useState, useRef, useEffect } from 'react';
import {
  Timer, CalendarDays, SkipForward, Palmtree, X, Pause, Play,
  Newspaper, FileText, ShieldCheck, Activity, Smile, WalletCards, Banknote,
} from 'lucide-react';
import './simulation.css';
import { useSimulation } from './store/SimulationContext.jsx';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useTransfersData } from './store/TransfersContext.jsx';
import { useCommunicationData } from './store/CommunicationContext.jsx';
import { useFinanceData } from './store/FinanceContext.jsx';
import { usePlayerState } from './store/PlayerStateContext.jsx';
import { players as roster } from './data/roster.js';

const DURATIONS = [
  ['day', 'Next Day', CalendarDays, 'Advance 1 day'],
  ['match', 'Next Match', SkipForward, 'Go to next match'],
  ['week', 'Next Week', CalendarDays, 'Advance 7 days'],
  ['vacation', 'Vacation', Palmtree, 'Select return date'],
];

// One simulated "day" advances at this pace so the window visibly plays out
// rather than resolving instantly — the whole point of this screen existing.
const TICK_MS = 700;

function shortName(club) { return club.length > 12 ? club.split(' ').map(w => w[0]).join('') : club; }

export default function SimulationWindow({ goTo }) {
  const sim = useSimulation();
  const { league, simulateMatchday } = useCompetitionData();
  const transfers = useTransfersData();
  const { addMessage, addNews } = useCommunicationData();
  const finance = useFinanceData();
  const playerState = usePlayerState();

  const [mode, setMode] = useState(null); // null | 'day' | 'match' | 'week' | 'vacation'
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [daysTarget, setDaysTarget] = useState(0);
  const [daysDone, setDaysDone] = useState(0);
  const [vacationWeeks, setVacationWeeks] = useState(2);
  const [vacationPicking, setVacationPicking] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]); // this round's results, grouped
  const [events, setEvents] = useState([]); // Current Events feed
  const [decision, setDecision] = useState(null); // pending decision blocking non-vacation runs
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);

  function logEvent(entry) {
    setEvents(evs => [{ time: sim.timeLabel, ...entry }, ...evs].slice(0, 40));
  }

  function playOneRound() {
    // Resolves the whole division's round via the real match engine
    // (CompetitionContext.simulateMatchday already builds real XIs and runs
    // the actual simulator for our fixture and a batch of others).
    const result = simulateMatchday();
    if (!result) return;
    const grouped = league.table
      .filter(r => r.club === result.home || r.club === result.away)
      .map(r => r.club);
    setLiveMatches(prev => [{
      comp: 'Premier League', home: result.home, away: result.away,
      homeGoals: result.homeGoals, awayGoals: result.awayGoals,
    }, ...prev].slice(0, 12));
    logEvent({ type: 'goal', title: result.usWon ? 'FULL TIME — WIN' : 'FULL TIME', body: `${result.home} ${result.homeGoals} - ${result.awayGoals} ${result.away}` });
    addNews({ category: 'Match Result', bucket: 'Football News', crest: result.home, headline: `${result.home} ${result.homeGoals}-${result.awayGoals} ${result.away}`, body: `Full time in the Premier League.` });

    // This round included our own fixture — record matchday income exactly
    // like a manually-played match would, so vacations don't silently skip
    // real financial consequences.
    const weAreHome = result.home === 'Man Utd';
    const won = result.usWon;
    const base = weAreHome ? 2_400_000 + Math.round(Math.random() * 1_600_000) : 350_000 + Math.round(Math.random() * 250_000);
    finance.addTransaction(
      weAreHome ? `Matchday Revenue vs ${result.away}` : `Away Day Share — ${result.home}`,
      won ? Math.round(base * 1.15) : base, 'Matchday Revenue',
    );
  }

  function maybeRaiseDecision() {
    // Real decision source: an incoming transfer bid for one of our players
    // that hasn't been responded to yet.
    const pending = transfers.incomingOffers.find(o => o.status === 'Pending');
    if (pending && Math.random() < 0.35) return { kind: 'offer', offer: pending };
    return null;
  }

  function resolveDecisionAuto(d) {
    // Vacation mode: the assistant manager decides on your behalf.
    if (d.kind === 'offer') {
      const accept = d.offer.fee > 40_000_000 || Math.random() < 0.4;
      transfers.respondIncoming(d.offer.id, accept ? 'accept' : 'reject');
      logEvent({ type: 'transfer', title: 'Assistant Manager', body: `${accept ? 'Accepted' : 'Rejected'} ${d.offer.fromClub}'s €${Math.round(d.offer.fee / 1e6)}M bid for ${d.offer.playerName}.` });
    }
  }

  function stepOneDay() {
    const prevDate = sim.now;
    sim.advanceClockOneDay();
    sim.setLastSavedAt(new Date().toLocaleTimeString().slice(0, 5));
    setDaysDone(d => d + 1);

    // Player live-state recovery/injury-clearance ticks forward exactly
    // once per simulated day, keyed to the date the clock is advancing to.
    const newDate = new Date(prevDate); newDate.setDate(newDate.getDate() + 1);
    const newlyInjured = playerState.advanceDay(newDate.toDateString());
    newlyInjured.forEach(inj => {
      addNews({ category: 'Injury', bucket: 'Club News', crest: 'Man Utd', headline: `${inj.name} injured in training — ${inj.type}`, body: `Expected back around ${inj.expectedReturn}.` });
      logEvent({ type: 'info', title: 'Injury', body: `${inj.name} picks up a knock (${inj.type}).` });
    });
    if (prevDate && newDate.getMonth() !== prevDate.getMonth()) {
      const monthLabel = newDate.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
      playerState.applyMonthlyDevelopment(monthLabel);
      const potm = playerState.recordPlayerOfMonthAward(monthLabel);
      if (potm) {
        addNews({ category: 'Awards', bucket: 'Football News', crest: 'Man Utd', headline: `${potm.name} named Player of the Month`, body: `Averaged a ${potm.avgRating} rating in ${monthLabel.split(' ')[0]}.` });
        logEvent({ type: 'info', title: 'Award', body: `${potm.name} wins Player of the Month.` });
      }
    }

    // Background world — routine club life continues every simulated day.
    const routineRoll = Math.random();
    if (routineRoll > 0.7) {
      addMessage({ subject: 'Training Report', preview: 'First-team training completed — fitness levels trending upward.', tag: 'Staff', kind: 'staff', sender: 'Coaching Staff' });
      logEvent({ type: 'info', title: 'Training', body: 'First-team session completed at Carrington.' });
    }
    // AI managers actually making moves — a real, occasional consequence
    // in the wider transfer market, not just decorative news headlines.
    if (Math.random() < 0.04) {
      const moved = transfers.simulateAITransferActivity();
      if (moved) logEvent({ type: 'transfer', title: 'Transfer News', body: `${moved.name}: ${moved.from} → ${moved.to}.` });
    }

    const arrivingAtMatch = sim.daysUntilMatch <= 1;
    if (arrivingAtMatch) {
      if (mode === 'vacation') {
        playOneRound();
        sim.setDaysUntilMatch(3 + Math.floor(Math.random() * 3));
      } else {
        sim.setPhase('matchday');
        stopRun(true);
        return;
      }
    } else {
      sim.setDaysUntilMatch(d => Math.max(0, d - 1));
    }

    if (mode !== 'vacation') {
      const d = maybeRaiseDecision();
      if (d) { setDecision(d); pauseRun(); return; }
    } else {
      const d = maybeRaiseDecision();
      if (d) resolveDecisionAuto(d);
    }
  }

  function tick() {
    stepOneDay();
  }

  function startRun(selectedMode) {
    setMode(selectedMode);
    setEvents([]); setLiveMatches([]); setFinished(false); setDaysDone(0);
    if (selectedMode === 'vacation') {
      setDaysTarget(vacationWeeks * 7);
    } else if (selectedMode === 'day') {
      setDaysTarget(1);
    } else if (selectedMode === 'week') {
      setDaysTarget(7);
    } else {
      setDaysTarget(60); // 'match' — open-ended, stops itself at matchday
    }
    setRunning(true);
    setPaused(false);
  }

  function pauseRun() { setPaused(true); }
  function resumeRun() { setPaused(false); }
  function stopRun(reachedMatchday = false) {
    setRunning(false);
    setPaused(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setFinished(true);
    if (reachedMatchday) logEvent({ type: 'info', title: 'Match Day', body: 'Your next fixture has arrived — head to Tactics or kick off when ready.' });
  }
  function closeWindow() {
    setRunning(false); setMode(null); setFinished(false); setDecision(null);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    sim.closeSimWindow();
    // If the run stopped because our own fixture has arrived, go straight
    // into the Matchday hub rather than dropping back to whatever screen
    // was open when Continue was first pressed.
    if (sim.phase === 'matchday') goTo?.('Matchday');
  }

  useEffect(() => {
    if (!running || paused || decision) return;
    timerRef.current = setInterval(() => {
      tick();
    }, TICK_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // `transfers` is intentionally included: without it, the interval's
    // closure keeps a stale snapshot of incomingOffers, so an
    // already-resolved decision (e.g. an accepted bid) could be "found"
    // and resolved again on the next tick instead of seeing its updated
    // status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, decision, mode, daysTarget, transfers, league, finance, playerState]);

  useEffect(() => {
    if (running && !paused && !decision && daysDone >= daysTarget && daysTarget > 0) {
      stopRun(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysDone]);

  function decideOffer(action) {
    transfers.respondIncoming(decision.offer.id, action);
    logEvent({ type: 'transfer', title: 'Decision Made', body: `You ${action}ed ${decision.offer.fromClub}'s bid for ${decision.offer.playerName}.` });
    setDecision(null);
    resumeRun();
  }

  const avgFitness = Math.round(roster.filter(p => p.playTime !== 'Youth').reduce((a, p) => a + p.fit, 0) / roster.filter(p => p.playTime !== 'Youth').length);
  const nextFixture = league.fixtures[0];
  const progressPct = daysTarget > 0 ? Math.min(100, Math.round((daysDone / daysTarget) * 100)) : 0;

  const groupedLive = liveMatches.reduce((acc, m) => { (acc[m.comp] = acc[m.comp] || []).push(m); return acc; }, {});

  if (!sim.simWindowOpen) return null;

  return <div className="sim-backdrop">
    <div className="sim-window">
      <div className="sim-header">
        <span className="sim-header-icon"><Timer size={22} color="#fff" /></span>
        <div className="sim-header-text">
          <h2>{running ? 'SIMULATION IN PROGRESS' : finished ? 'SIMULATION COMPLETE' : 'SIMULATION CENTRE'}</h2>
          <p>{running ? 'The world keeps moving. Matches are being played, transfers are happening, and your club is evolving.' : finished ? 'Here\u2019s what happened while you were away.' : 'Choose how far to advance — nothing happens until you pick a duration.'}</p>
        </div>
        <div className="sim-header-date"><b>{sim.dateLabel}</b><span>{sim.timeLabel}</span></div>
        <div className={`sim-status-badge ${running && !paused ? 'live' : ''}`}>
          {running && !paused ? <><i className="spin" /> Simulating…</> : paused ? 'Paused' : finished ? 'Stopped' : 'Ready'}
        </div>
        <button className="sim-close" onClick={closeWindow}><X size={18} /></button>
      </div>

      <div className="sim-duration-row">
        {DURATIONS.map(([key, label, Icon, sub]) => key === 'vacation'
          ? <div className="sim-vacation-wrap" key={key}>
              <button className={`sim-duration-btn ${mode === key && running ? 'active' : ''}`} onClick={() => setVacationPicking(v => !v)} disabled={running}>
                <Icon size={18} /><div><b>{label}</b><small>{sub}</small></div>
              </button>
              {vacationPicking && <div className="sim-vacation-picker">
                <span>Return in</span>
                <select value={vacationWeeks} onChange={e => setVacationWeeks(Number(e.target.value))}>
                  {[1, 2, 4, 8, 12].map(w => <option key={w} value={w}>{w} week{w > 1 ? 's' : ''}</option>)}
                </select>
                <button className="sim-duration-btn confirm" onClick={() => { setVacationPicking(false); startRun('vacation'); }}>Start Vacation</button>
              </div>}
            </div>
          : <button key={key} className={`sim-duration-btn ${mode === key && running ? 'active' : ''}`} disabled={running} onClick={() => startRun(key)}>
              <Icon size={18} /><div><b>{label}</b><small>{sub}</small></div>
            </button>)}
      </div>

      {decision && <div className="sim-decision-banner">
        <b>🔴 DECISION REQUIRED</b>
        <p>{decision.offer.fromClub} have offered €{Math.round(decision.offer.fee / 1e6)}M for {decision.offer.playerName}.</p>
        <div className="sim-decision-actions">
          <button onClick={() => decideOffer('reject')}>Reject</button>
          <button onClick={() => decideOffer('counter')}>Counter</button>
          <button className="accept" onClick={() => decideOffer('accept')}>Accept</button>
        </div>
      </div>}

      <div className="sim-grid">
        <section className="sim-panel">
          <h3><ShieldCheck size={16} /> Live Matches<small>Live matches and results from around the world</small></h3>
          <div className="sim-panel-body">
            {Object.keys(groupedLive).length === 0 && <p className="muted-sub">No matches played yet this session.</p>}
            {Object.entries(groupedLive).map(([comp, matches]) => <div key={comp} className="sim-league-block">
              <div className="sim-league-name">{comp}</div>
              {matches.map((m, i) => <div className="sim-match-row" key={i}>
                <span>{m.home}</span><b>{m.homeGoals} - {m.awayGoals}</b><span>{m.away}</span><em>FT</em>
              </div>)}
            </div>)}
          </div>
        </section>

        <section className="sim-panel">
          <h3><Activity size={16} /> Current Events{running && !paused && <span className="live-dot">LIVE</span>}</h3>
          <div className="sim-panel-body">
            {events.length === 0 && <p className="muted-sub">Events will appear here as the simulation runs.</p>}
            {events.map((e, i) => <div className="sim-event-row" key={i}>
              <span className="sim-event-time">{e.time}</span>
              <div><b>{e.title}</b><small>{e.body}</small></div>
            </div>)}
          </div>
        </section>

        <section className="sim-panel">
          <h3><Newspaper size={16} /> News Feed</h3>
          <div className="sim-panel-body">
            {transfers.news.slice(0, 6).map((n, i) => <div className="sim-news-row" key={i}>
              <small>{n.time}</small><span>{n.text}</span>
            </div>)}
          </div>
        </section>
      </div>

      <div className="sim-club-status">
        <div><Activity size={15} /><div><span>Squad Fitness</span><b>{avgFitness}%</b></div></div>
        <div><Smile size={15} /><div><span>Team Morale</span><b>Good</b></div></div>
        <div><WalletCards size={15} /><div><span>Transfer Budget</span><b>{transfers.formatEURShort(transfers.budget.available)}</b></div></div>
        <div><Banknote size={15} /><div><span>Wage Budget (p/w)</span><b>£{transfers.budget.wageAvailable.toLocaleString()}</b></div></div>
        <div><CalendarDays size={15} /><div><span>Next Match</span><b>{nextFixture ? (nextFixture.home === 'Man Utd' ? nextFixture.away : nextFixture.home) : '—'}</b></div></div>
      </div>

      <div className="sim-footer">
        {running ? <>
          <div className="sim-progress-track"><i style={{ width: `${progressPct}%` }} /></div>
          <span className="sim-progress-label">{paused ? 'Paused' : `Simulating… (${daysDone}/${daysTarget} days)`}</span>
          {paused
            ? <button className="sim-pause-btn" onClick={resumeRun}><Play size={15} /> Resume</button>
            : <button className="sim-pause-btn" onClick={pauseRun}><Pause size={15} /> Pause</button>}
        </> : <>
          <span className="sim-progress-label">{finished ? `Simulation finished — ${daysDone} day${daysDone !== 1 ? 's' : ''} advanced.` : 'Select a duration above to begin.'}</span>
          {finished && <button className="sim-pause-btn accept" onClick={closeWindow}>Return to Club</button>}
        </>}
      </div>
    </div>
  </div>;
}
