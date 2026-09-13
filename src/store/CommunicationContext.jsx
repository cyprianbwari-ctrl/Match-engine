import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { initialInboxMessages, calendarDays, calendarEventsByDay, newsItems as seedNewsItems } from '../data/communicationData.js';

const CommCtx = createContext(null);

export function CommunicationProvider({ children }) {
  const [messages, setMessages] = useState(initialInboxMessages);
  const [newsItems, setNewsItems] = useState(seedNewsItems);
  const [selectedDay, setSelectedDay] = useState(calendarDays[0].key);
  const [dayOffset, setDayOffset] = useState(0);

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
      id: Date.now() + Math.random(), sender: 'Staff', kind: 'staff', tag: 'Staff', time: 'Just now', date: 'Today', unread: true,
      subject: msg.subject, preview: msg.preview, body: msg.body || msg.preview, actions: msg.actions || ['View'], link: msg.link || { screen: 'Training' },
      ...msg,
    }, ...ms]);
  }, []);

  const addNews = useCallback((item) => {
    setNewsItems(n => [{
      id: `news-${Date.now()}-${Math.random()}`, time: 'Just now', ...item,
    }, ...n]);
  }, []);

  const unreadCount = useMemo(() => messages.filter(m => m.unread).length, [messages]);

  const visibleDays = useMemo(() => calendarDays.slice(dayOffset, dayOffset + 5), [dayOffset]);
  const shiftDays = useCallback((delta) => {
    setDayOffset(o => Math.max(0, Math.min(calendarDays.length - 5, o + delta)));
  }, []);

  const eventsForSelectedDay = calendarEventsByDay[selectedDay] || [];

  const value = {
    messages, markRead, markAllRead, removeMessage, addMessage, unreadCount,
    calendarDays, visibleDays, selectedDay, setSelectedDay, shiftDays,
    eventsForSelectedDay, newsItems, addNews,
  };

  return <CommCtx.Provider value={value}>{children}</CommCtx.Provider>;
}

export function useCommunicationData() {
  const ctx = useContext(CommCtx);
  if (!ctx) throw new Error('useCommunicationData must be used within a CommunicationProvider');
  return ctx;
}
