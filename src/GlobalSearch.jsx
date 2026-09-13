import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search as SearchIcon, X, UserRound, Shield, Users, Trophy, Globe2,
  Newspaper, Mail, ChevronRight
} from 'lucide-react';
import './search.css';
import { players as roster } from './data/roster.js';
import { mapRosterPlayer } from './data/homeData.js';
import { useWorldData } from './store/WorldContext.jsx';
import { useStaffData } from './store/StaffContext.jsx';
import { useCommunicationData } from './store/CommunicationContext.jsx';

const COMPETITION_INDEX = [
  { name: 'Premier League', screen: 'Competitions', tab: 'league' },
  { name: 'UEFA Champions League', screen: 'Competitions', tab: 'continental' },
  { name: 'UEFA Europa League', screen: 'Competitions', tab: 'continental' },
  { name: 'UEFA Conference League', screen: 'Competitions', tab: 'continental' },
  { name: 'Emirates FA Cup', screen: 'Competitions', tab: 'cups' },
  { name: 'Carabao Cup', screen: 'Competitions', tab: 'cups' },
];

function Avatar({ name, size = 30 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return <span className="gs-avatar" style={{ width: size, height: size, fontSize: size * 0.32, background: `radial-gradient(circle at 32% 28%, hsl(${hue} 70% 45%), hsl(${hue} 60% 20%) 70%, #05070f 130%)` }}>{initials}</span>;
}

export default function GlobalSearch({ open, onClose, navigateTo }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const { players: worldPlayers, setSelectedId, setProfileOpen, openProfileFor, leagues } = useWorldData();
  const { staffList } = useStaffData();
  const { messages, newsItems } = useCommunicationData();

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); else setQuery(''); }, [open]);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;
    const ownPlayers = roster.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5)
      .map(p => ({ key: `own-${p.id}`, label: p.name, sub: `${p.displayPos} · Man Utd`, action: () => openProfileFor(mapRosterPlayer(p)) }));
    const rivalPlayers = worldPlayers.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5)
      .map(p => ({ key: `world-${p.id}`, label: p.name, sub: `${p.pos} · ${p.club}`, action: () => { setSelectedId(p.id); setProfileOpen(true); } }));
    const players = [...ownPlayers, ...rivalPlayers].slice(0, 6);

    const clubNames = new Set(['Man Utd', ...worldPlayers.map(p => p.club)]);
    const clubs = [...clubNames].filter(c => c.toLowerCase().includes(q)).slice(0, 5)
      .map(c => ({ key: `club-${c}`, label: c, sub: c === 'Man Utd' ? 'Your club' : 'Club', action: () => navigateTo(c === 'Man Utd' ? 'Club Dashboard' : 'World', c === 'Man Utd' ? 'info' : 'ranking') }));

    const staff = staffList.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, 5)
      .map(s => ({ key: `staff-${s.id}`, label: s.name, sub: s.category, action: () => navigateTo('Staff') }));

    const competitions = COMPETITION_INDEX.filter(c => c.name.toLowerCase().includes(q))
      .map(c => ({ key: `comp-${c.name}`, label: c.name, sub: 'Competition', action: () => navigateTo(c.screen, c.tab) }));

    const countriesLeagues = leagues.filter(l => l.league.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)).slice(0, 5)
      .map(l => ({ key: `league-${l.league}`, label: l.league, sub: l.country, action: () => navigateTo('World', 'info') }));

    const news = newsItems.filter(n => n.headline.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)).slice(0, 4)
      .map(n => ({ key: `news-${n.id}`, label: n.headline, sub: n.category, action: () => navigateTo(n.link?.screen || 'Communications', 'news') }));

    const msgs = messages.filter(m => m.subject.toLowerCase().includes(q) || m.preview.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q)).slice(0, 4)
      .map(m => ({ key: `msg-${m.id}`, label: m.subject, sub: `${m.sender} · ${m.tag}`, action: () => navigateTo(m.link?.screen || 'Communications', 'inbox') }));

    return [
      { label: 'Players', icon: UserRound, color: '#8a6bff', items: players },
      { label: 'Clubs', icon: Shield, color: '#ff8a5c', items: clubs },
      { label: 'Staff', icon: Users, color: '#4d9dff', items: staff },
      { label: 'Competitions', icon: Trophy, color: '#ffd76b', items: competitions },
      { label: 'Countries & Leagues', icon: Globe2, color: '#3ddc84', items: countriesLeagues },
      { label: 'News', icon: Newspaper, color: '#b06bff', items: news },
      { label: 'Messages', icon: Mail, color: '#26c1a4', items: msgs },
    ].filter(g => g.items.length > 0);
  }, [q, worldPlayers, staffList, leagues, newsItems, messages]);

  if (!open) return null;

  const runAndClose = (action) => { action(); onClose(); };

  return <div className="gs-backdrop" onClick={onClose}>
    <div className="gs-modal" onClick={e => e.stopPropagation()}>
      <div className="gs-input-row">
        <SearchIcon size={18} color="#8f9abb" />
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search players, clubs, staff, competitions, news..." />
        <button className="gs-close" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="gs-body">
        {!q && <p className="gs-hint">Search for anything — a player, a club, a competition, a piece of news — and jump straight to it. This never creates a new page, it just opens the existing one.</p>}
        {q && !results && <p className="gs-hint">Type to search...</p>}
        {q && results && results.length === 0 && <p className="gs-hint">No matches for "{query}".</p>}
        {results?.map(group => <div className="gs-group" key={group.label}>
          <div className="gs-group-head"><group.icon size={13} color={group.color} />{group.label}</div>
          {group.items.map(item => <button className="gs-item" key={item.key} onClick={() => runAndClose(item.action)}>
            <div><b>{item.label}</b><span>{item.sub}</span></div>
            <ChevronRight size={14} />
          </button>)}
        </div>)}
      </div>
    </div>
  </div>;
}
