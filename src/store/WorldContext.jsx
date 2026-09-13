import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { players as seedPlayers, leagues, wonderkids, transferActivity } from '../data/worldData.js';

const WorldCtx = createContext(null);

const POS_BUCKET = { GK: 0, CB: 1, LB: 1, RB: 1, DM: 2, CM: 2, CAM: 3, AM: 3, LW: 4, RW: 4, ST: 5 };
const avgForm = (p) => p.form.reduce((a, b) => a + b, 0) / p.form.length;

export function WorldProvider({ children }) {
  const [players, setPlayers] = useState(seedPlayers);
  const [rankingMode, setRankingMode] = useState('ranking');
  const [rankingScope, setRankingScope] = useState('Top 100');
  const [selectedId, setSelectedId] = useState(seedPlayers[0].id);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shortlist, setShortlist] = useState([]);
  const [scouted, setScouted] = useState([]);
  const [customPlayer, setCustomPlayer] = useState(null);
  const openProfileFor = useCallback((playerObj) => {
    setCustomPlayer(playerObj);
    setProfileOpen(true);
  }, []);
  const closeProfile = useCallback(() => {
    setProfileOpen(false);
    setCustomPlayer(null);
  }, []);
  const closeProfileAware = useCallback((val) => {
    setProfileOpen(val);
    if (!val) setCustomPlayer(null);
  }, []);
  const [filters, setFilters] = useState({
    name: '', position: 'All', club: 'All', country: 'All', league: 'All',
    minRating: 0, minPotential: 0, foot: 'All', availability: 'All',
  });

  const scopeN = { 'Top 10': 10, 'Top 25': 25, 'Top 50': 50, 'Top 100': 999 }[rankingScope];

  const rankedList = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const list = sorted.slice(0, Math.min(scopeN, sorted.length));

    if (rankingMode === 'ranking') return { groups: [{ label: null, rows: list.map((p, i) => ({ ...p, groupRank: i + 1 })) }] };
    if (rankingMode === 'form') {
      const byForm = [...list].sort((a, b) => avgForm(b) - avgForm(a));
      return { groups: [{ label: null, rows: byForm.map((p, i) => ({ ...p, groupRank: i + 1 })) }] };
    }
    if (rankingMode === 'position') {
      const buckets = {};
      list.forEach(p => { const b = POS_BUCKET[p.pos] ?? 6; (buckets[b] ||= []).push(p); });
      const names = { 0: 'Goalkeepers', 1: 'Defenders', 2: 'Defensive/Central Midfielders', 3: 'Attacking Midfielders', 4: 'Wingers', 5: 'Strikers', 6: 'Other' };
      return { groups: Object.keys(buckets).sort().map(k => ({ label: names[k], rows: buckets[k].map((p, i) => ({ ...p, groupRank: i + 1 })) })) };
    }
    if (rankingMode === 'nationality') {
      const byNat = {};
      list.forEach(p => (byNat[p.country] ||= []).push(p));
      return { groups: Object.keys(byNat).sort().map(k => ({ label: k, rows: byNat[k].map((p, i) => ({ ...p, groupRank: i + 1 })) })) };
    }
    if (rankingMode === 'club') {
      const byClub = {};
      list.forEach(p => (byClub[p.club] ||= []).push(p));
      return { groups: Object.keys(byClub).sort().map(k => ({ label: k, rows: byClub[k].map((p, i) => ({ ...p, groupRank: i + 1 })) })) };
    }
    return { groups: [{ label: null, rows: list }] };
  }, [players, rankingMode, scopeN]);

  const selectedPlayer = customPlayer || players.find(p => p.id === selectedId) || players[0];

  const setSelectedId2 = useCallback((id) => {
    setCustomPlayer(null);
    setSelectedId(id);
  }, []);

  const toggleShortlist = useCallback((id) => {
    setShortlist(sl => sl.includes(id) ? sl.filter(x => x !== id) : [...sl, id]);
  }, []);
  const addScout = useCallback((id) => {
    setScouted(sc => sc.includes(id) ? sc : [...sc, id]);
  }, []);

  const searchResults = useMemo(() => {
    return players.filter(p => {
      if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.position !== 'All' && p.pos !== filters.position) return false;
      if (filters.club !== 'All' && p.club !== filters.club) return false;
      if (filters.country !== 'All' && p.country !== filters.country) return false;
      if (filters.league !== 'All' && p.league !== filters.league) return false;
      if (filters.foot !== 'All' && p.preferredFoot !== filters.foot) return false;
      if (filters.availability !== 'All' && p.availability !== filters.availability) return false;
      if (p.rating < filters.minRating) return false;
      if (p.potential < filters.minPotential) return false;
      return true;
    });
  }, [players, filters]);

  const reputationMovers = useMemo(() => {
    const rising = [...players].sort((a, b) => b.change - a.change).slice(0, 5);
    const falling = [...players].sort((a, b) => a.change - b.change).slice(0, 5);
    return { rising, falling };
  }, [players]);

  const availablePlayers = useMemo(() => players.filter(p => p.availability !== 'Not for Sale'), [players]);

  const value = {
    players, rankingMode, setRankingMode, rankingScope, setRankingScope, rankedList,
    selectedId, setSelectedId: setSelectedId2, selectedPlayer, profileOpen, setProfileOpen: closeProfileAware,
    shortlist, toggleShortlist, scouted, addScout, openProfileFor, closeProfile,
    filters, setFilters, searchResults,
    leagues, wonderkids, transferActivity, reputationMovers, availablePlayers,
  };

  return <WorldCtx.Provider value={value}>{children}</WorldCtx.Provider>;
}

export function useWorldData() {
  const ctx = useContext(WorldCtx);
  if (!ctx) throw new Error('useWorldData must be used within a WorldProvider');
  return ctx;
}
