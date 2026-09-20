import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { initialInboxMessages, calendarDays, calendarEventsByDay, newsItems as seedNewsItems } from '../data/communicationData.js';
import { useManagerData } from './ManagerContext.jsx';
import { useDatabase } from './DatabaseContext.jsx';

const CommCtx = createContext(null);

export function CommunicationProvider({ children }) {
  const manager = useManagerData();
  const db = useDatabase();
  const careerClub = db.careerClub;
  const clubName = careerClub?.name || manager.profile.currentClub || 'Current Club';
  const stadium = careerClub ? db.stadiums.find(s => String(s.stadiumId) === String(careerClub.stadiumId)) : null;
  const clubGround = stadium?.name || `${clubName} Stadium`;
  const trainingGround = `${clubName} Training Centre`;

  const personalize = useCallback((value) => String(value ?? '')
    .replaceAll('Newcastle United', clubName)
    .replaceAll('Manchester United', clubName)
    .replaceAll('Old Trafford', clubGround)
    .replaceAll('Carrington', trainingGround)
    .replaceAll('Erik ten Hag', 'Assistant Manager')
    .replaceAll('@NUFC_Okafor', '@ClubNews')
    .replaceAll('@RedArmyDaily', '@ClubSupporters')
    .replaceAll('United fans', `${clubName} supporters`)
    .replaceAll('Jayden Okafor', 'First-team player')
    .replaceAll('Tyrell Osei', 'a first-team player')
    .replaceAll('Ibrahim Koné', 'a first-team player'), [clubName, clubGround, trainingGround]);

  const personalizeObject = useCallback((obj) => {
    if (Array.isArray(obj)) return obj.map(personalizeObject);
    if (!obj || typeof obj !== 'object') return personalize(obj);
    return Object.fromEntries(Object.entries(obj).map(([k,v]) => [k, typeof v === 'object' ? personalizeObject(v) : personalize(v)]));
  }, [personalize]);

  const [messages, setMessages] = useState(() => personalizeObject(initialInboxMessages));
  const [newsItems, setNewsItems] = useState(() => personalizeObject(seedNewsItems));
  const [selectedDay, setSelectedDay] = useState(calendarDays[0].key);
  const [dayOffset, setDayOffset] = useState(0);
  useEffect(() => {
    setMessages(personalizeObject(initialInboxMessages));
    setNewsItems(personalizeObject(seedNewsItems));
  }, [clubName, clubGround, trainingGround, personalizeObject]);

  const markRead = useCallback((id) => {
    setMessages(ms => ms.map(m => m.id === id ? { ...m, unread: false } : m));
  }, []);

  const markAllRead = useCallback(() => {
    setMessages(ms => ms.map(m => ({ ...m, unread: false })));
  }, []);

  const removeMessage = useCallback((id) => {
    setMessages(ms => ms.filter(m => m.id !== id));
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages(ms => [{
      id: `msg-${ms.length + 1}`, sender: 'Staff', kind: 'staff', tag: 'Staff', time: 'Just now', date: 'Today', unread: true,
      subject: msg.subject, preview: msg.preview, body: msg.body || msg.preview, actions: msg.actions || ['View'], link: msg.link || { screen: 'Training' },
      ...msg,
    }, ...ms]);
  }, []);

  const addNews = useCallback((item) => {
    setNewsItems(n => [{
      id: `news-${n.length + 1}`, time: 'Just now', ...item,
    }, ...n]);
  }, []);

  const unreadCount = useMemo(() => messages.filter(m => m.unread).length, [messages]);

  const visibleDays = useMemo(() => calendarDays.slice(dayOffset, dayOffset + 5), [dayOffset]);
  const shiftDays = useCallback((delta) => {
    setDayOffset(o => Math.max(0, Math.min(calendarDays.length - 5, o + delta)));
  }, []);

  const eventsForSelectedDay = useMemo(() => personalizeObject(calendarEventsByDay[selectedDay] || []), [selectedDay, personalizeObject]);

  const value = {
    messages, markRead, markAllRead, removeMessage, addMessage, unreadCount,
    calendarDays, visibleDays, selectedDay, setSelectedDay, shiftDays,
    eventsForSelectedDay, newsItems, addNews,
    getSnapshot: () => ({ messages, newsItems }),
    restoreSnapshot: (s) => {
      if (!s) return;
      if (s.messages) setMessages(s.messages);
      if (s.newsItems) setNewsItems(s.newsItems);
    },
  };

  return <CommCtx.Provider value={value}>{children}</CommCtx.Provider>;
}

export function useCommunicationData() {
  const ctx = useContext(CommCtx);
  if (!ctx) throw new Error('useCommunicationData must be used within a CommunicationProvider');
  return ctx;
}
