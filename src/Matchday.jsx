import React, { useState } from 'react';
import {
  Trophy, Cloud, Clock3, Users, Crosshair, Search, FileText, Map as MapIcon,
  MessageSquare, Flag, Target, Check, ChevronRight, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import './matchday.css';
import { useCompetitionData } from './store/CompetitionContext.jsx';
import { useTacticsData } from './store/TacticsContext.jsx';
import { useSimulation } from './store/SimulationContext.jsx';
import { useDatabase } from './store/DatabaseContext.jsx';
import { fixtureDetail } from './data/fixtureDetail.js';
import TacticsScreen from './Tactics.jsx';

const TABS = ['Matchday', 'Team Selection', 'Tactics', 'Opponent Analysis', 'Match Preview', 'Match Plan'];

// Lightweight opponent scouting profile — generated from what's already
// known about the fixture rather than a full separate scouting database.
function opponentProfile(oppName) {
  const seed = oppName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (n, salt = 0) => Math.abs(Math.sin(seed + salt)) * n;
  const formations = ['4-2-3-1', '4-3-3', '3-5-2', '4-4-2'];
  const mentalities = ['Balanced', 'Positive', 'Cautious', 'Attacking'];
  const styles = ['Possession', 'Counter-Attack', 'Direct', 'Gegenpress'];
  return {
    formation: formations[Math.floor(rand(4)) % 4],
    mentality: mentalities[Math.floor(rand(4, 1)) % 4],
    style: styles[Math.floor(rand(4, 2)) % 4],
    threats: ['Left wing pace and dribbling', 'Clinical finishing from the front line', 'Midfield control through the No.8'],
    weaknesses: ['Space behind the full-backs', 'Vulnerable at set pieces', 'Inconsistent away form'],
  };
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}


export default function MatchdayScreen({ setActive }) {
  const db = useDatabase();
  const { careerSquad: roster } = db;
  const [tab, setTab] = useState('Matchday');
  const { league } = useCompetitionData();
  const { formation, startXI, slots, assignment } = useTacticsData();
  const sim = useSimulation();

  const fixture = league.fixtures[0];
  const currentClubName = db.careerClub?.name || 'Unassigned Club';
  const usRow = league.table.find(r => r.us);
  const oppName = fixture ? (fixture.home === currentClubName ? fixture.away : fixture.home) : 'Opponent';
  const oppRow = league.table.find(r => r.club === oppName);
  const weAreHome = fixture ? fixture.home === currentClubName : true;
  const opp = opponentProfile(oppName);
  const fixDetail = fixtureDetail(fixture, weAreHome);

  const bench = roster.filter(p => !startXI.some(s => s.id === p.id) && p.playTime !== 'Youth').sort((a, b) => b.ovr - a.ovr).slice(0, 5);
  const reserves = roster.filter(p => !startXI.some(s => s.id === p.id) && !bench.some(b => b.id === p.id) && p.playTime !== 'Youth').slice(0, 5);

  const lastMeetings = [
    { home: oppName, away: currentClubName, score: '1 - 2', date: 'Apr 2025' },
    { home: currentClubName, away: oppName, score: '2 - 0', date: 'Dec 2024' },
    { home: oppName, away: currentClubName, score: '1 - 1', date: 'May 2024' },
    { home: currentClubName, away: oppName, score: '1 - 1', date: 'Nov 2023' },
    { home: oppName, away: currentClubName, score: '0 - 2', date: 'Mar 2023' },
  ];

  return <div className="mday-page">
    <div className="mday-banner">
      <div className="mday-banner-top">
        <span className="mday-tag">MATCHDAY</span>
        <span className="mday-comp">{league.name} · Matchday {league.table.reduce((a, r) => a + r.p, 0) > 0 ? Math.max(...league.table.map(r => r.p)) : 5}</span>
      </div>
      <div className="mday-versus">
        <div className="mday-team"><div className="crest-sq">{currentClubName.slice(0,3).toUpperCase()}</div><b>{currentClubName.toUpperCase()}</b><span>{usRow ? `${ordinal(usRow.pos)} · ${usRow.pts} pts` : ''}</span></div>
        <div className="mday-vs"><b>VS</b><small>{fixture?.time || '17:30'}</small></div>
        <div className="mday-team"><div className="crest-sq brighton">{oppName.split(' ').map(w=>w[0]).join('').slice(0,3)}</div><b>{oppName.toUpperCase()}</b><span>{oppRow ? `${ordinal(oppRow.pos)} · ${oppRow.pts} pts` : ''}</span></div>
      </div>
      <div className="mday-sub">{fixDetail.venue} · {fixture?.date === 'Today' ? 'Today' : fixture?.date}</div>
    </div>

    <div className="mday-tabs">{TABS.map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>

    {tab === 'Matchday' && <>
      <div className="mday-grid">
        <section className="mday-panel">
          <h3><Users size={15} /> Team Selection</h3>
          <p className="muted-sub">{formation} · {startXI.length} starters confirmed</p>
          <div className="mday-mini-list">
            {startXI.slice(0, 6).map(p => <div className="mday-mini-row" key={p.id}><span>{p.pos}</span><b>{p.name}</b></div>)}
            <p className="muted-sub" style={{ marginTop: 6 }}>+{Math.max(0, startXI.length - 6)} more — full lineup in Team Selection</p>
          </div>
          <button className="mday-link-btn" onClick={() => setTab('Team Selection')}>Open Team Selection <ChevronRight size={13} /></button>
        </section>

        <section className="mday-panel">
          <h3><Search size={15} /> Opponent Analysis</h3>
          <div className="mday-mini-row"><span>Formation</span><b>{opp.formation}</b></div>
          <div className="mday-mini-row"><span>Mentality</span><b>{opp.mentality}</b></div>
          <div className="mday-mini-row"><span>Style</span><b>{opp.style}</b></div>
          <p className="mday-label" style={{ marginTop: 8 }}>Key Threats</p>
          {opp.threats.slice(0, 2).map(t => <p className="mday-bullet" key={t}>{t}</p>)}
          <button className="mday-link-btn" onClick={() => setTab('Opponent Analysis')}>View Full Analysis <ChevronRight size={13} /></button>
        </section>

        <section className="mday-panel">
          <h3><FileText size={15} /> Match Information</h3>
          <div className="mday-mini-row"><Trophy size={13} /><span>{league.name}</span></div>
          <div className="mday-mini-row"><Clock3 size={13} /><span>{fixture?.date === 'Today' ? 'Today' : fixture?.date}, {fixture?.time}</span></div>
          <div className="mday-mini-row"><Cloud size={13} /><span>{fixDetail.venue} · {fixDetail.weather}</span></div>
          <div className="mday-mini-row"><span>Attendance</span><b>{fixDetail.attendance.toLocaleString()} / {fixDetail.capacity.toLocaleString()}</b></div>
          <div className="mday-mini-row"><span>Referee</span><b>{fixDetail.referee}</b></div>
          <p className="mday-label" style={{ marginTop: 10 }}>Last 5 Meetings</p>
          {lastMeetings.map((m, i) => <div className="mday-meeting-row" key={i}><span>{m.home}</span><b>{m.score}</b><span>{m.away}</span></div>)}
        </section>
      </div>

      <section className="mday-panel mday-preview">
        <h3><MessageSquare size={15} /> Match Preview</h3>
        <p>A tough test in this fixture. {oppName} are in {oppRow && usRow && oppRow.pts > usRow.pts ? 'good' : 'mixed'} form and will look to exploit our defensive gaps. We need to be disciplined, control the midfield and make the most of our chances.</p>
        <button className="mday-start-btn" onClick={() => { sim.lockForMatch(); setActive('Match'); }}><ShieldCheck size={16} /> Start Match <small>(Match Engine)</small></button>
      </section>
    </>}

    {tab === 'Team Selection' && <div className="mday-embed"><TacticsScreen setActive={setActive} initialTab="Formation" embedded /></div>}
    {tab === 'Tactics' && <div className="mday-embed"><TacticsScreen setActive={setActive} initialTab="Team Instructions" embedded /></div>}
    {tab === 'Match Plan' && <div className="mday-embed"><TacticsScreen setActive={setActive} initialTab="Match Plan" embedded /></div>}

    {tab === 'Opponent Analysis' && <div className="mday-grid">
      <section className="mday-panel">
        <h3><Crosshair size={15} /> Formation & Style</h3>
        <div className="mday-mini-row"><span>Formation</span><b>{opp.formation}</b></div>
        <div className="mday-mini-row"><span>Mentality</span><b>{opp.mentality}</b></div>
        <div className="mday-mini-row"><span>Style</span><b>{opp.style}</b></div>
      </section>
      <section className="mday-panel">
        <h3><TriangleAlert size={15} color="#ffb84d" /> Key Threats</h3>
        {opp.threats.map(t => <p className="mday-bullet" key={t}>{t}</p>)}
        <h3 style={{ marginTop: 12 }}><Target size={15} color="#3ddc84" /> Weaknesses</h3>
        {opp.weaknesses.map(t => <p className="mday-bullet" key={t}>{t}</p>)}
      </section>
    </div>}

    {tab === 'Match Preview' && <section className="mday-panel mday-preview">
      <h3><MessageSquare size={15} /> Match Preview</h3>
      <p>A tough test in this fixture. {oppName} are in good form and will look to exploit our defensive gaps. We need to be disciplined, control the midfield and make the most of our chances.</p>
      <p className="mday-label">Last 5 Meetings</p>
      {lastMeetings.map((m, i) => <div className="mday-meeting-row" key={i}><span>{m.home}</span><b>{m.score}</b><span>{m.away}</span></div>)}
    </section>}

    <div className="mday-footer">
      <button className="mday-foot-btn"><MessageSquare size={15} /> Team Talk</button>
      <button className="mday-foot-btn"><Flag size={15} /> Set Pieces</button>
      <button className="mday-foot-btn"><Target size={15} /> Opposition Instructions</button>
      <button className="mday-confirm-btn"><Check size={15} /> Confirm Lineup</button>
    </div>
  </div>;
}
