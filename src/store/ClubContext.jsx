import React, { createContext, useContext, useState, useCallback } from 'react';
import { notificationCategories } from '../data/clubData.js';

const ClubCtx = createContext(null);

export function ClubProvider({ children }) {
  const [extraDelegation, setExtraDelegation] = useState({ training: 'MANUAL', scouting: 'MANUAL', transfers: 'MANUAL', tactical: 'MANUAL' });
  const [general, setGeneral] = useState({ nicknameDisplay: true, language: 'English', density: 'Comfortable', currency: '£' });
  const [notifications, setNotifications] = useState(Object.fromEntries(notificationCategories.map(c => [c, true])));
  const [simulation, setSimulation] = useState({ speed: 'Normal', highlights: 'Key Highlights', pauseOnInjury: true, pauseOnRedCard: true });
  const [saveCloud, setSaveCloud] = useState({ autosave: true, frequency: 'Every Match', cloudSync: true });
  const [display, setDisplay] = useState({ nameFormat: 'Full Name', showFlags: true, accent: 'Purple' });

  const toggleExtraDelegation = useCallback((key) => {
    setExtraDelegation(d => ({ ...d, [key]: d[key] === 'MANUAL' ? 'ASSISTANT' : 'MANUAL' }));
  }, []);
  const toggleNotification = useCallback((cat) => {
    setNotifications(n => ({ ...n, [cat]: !n[cat] }));
  }, []);

  const value = {
    extraDelegation, toggleExtraDelegation,
    general, setGeneral,
    notifications, toggleNotification,
    simulation, setSimulation,
    saveCloud, setSaveCloud,
    display, setDisplay,
  };

  return <ClubCtx.Provider value={value}>{children}</ClubCtx.Provider>;
}

export function useClubData() {
  const ctx = useContext(ClubCtx);
  if (!ctx) throw new Error('useClubData must be used within a ClubProvider');
  return ctx;
}
