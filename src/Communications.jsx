import React, { useState } from 'react';
import {
  MessageSquare, Mail, CalendarDays, Newspaper, ChevronLeft, ChevronRight,
  Mic, Users, FileText, Phone, Check, X, Reply as ReplyIcon, UserRound,
  ArrowLeftRight, Shield, Coins, Search as SearchIcon, Trophy, Heart, Repeat2,
  MessageCircle, Send, Globe2
} from 'lucide-react';
import './communications.css';
import { useCommunicationData } from './store/CommunicationContext.jsx';
import { TAG_COLORS } from './data/communicationData.js';

// ---------- Shared bits ----------

function TagPill({ tag }) {
  const c = TAG_COLORS[tag] || '#8f9abb';
  return <span className="tag-pill" style={{ color: c, borderColor: `${c}88`, background: `${c}22` }}>{tag}</span>;
}

function PersonAvatar({ name, kind }) {
  const palette = { player: '#8a6bff', staff: '#4d9dff', club: '#e8b23d', medical: '#ff5d5d', scouting: '#b06bff', board: '#e8b23d', media: '#4da6ff', competition: '#26c1a4', youth: '#ff6bcf' };
  const color = palette[kind] || '#3a4570';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <span className="person-avatar" style={{ background: `radial-gradient(circle at 32% 28%, ${color}dd, ${color}88 60%, #05070f 130%)` }}>{initials}</span>;
}

const CAL_ICONS = { mic: Mic, users: Users, file: FileText, phone: Phone };

// ================= INBOX =================

function InboxRow({ msg, expanded, onToggle, onAction, replyOpen, onSendReply }) {
  const [draft, setDraft] = useState('');
  return <div className={`inbox-row ${msg.unread ? 'unread' : ''} ${expanded ? 'expanded' : ''}`}>
    <button className="inbox-row-head" onClick={onToggle}>
      <PersonAvatar name={msg.sender} kind={msg.kind} />
      <div className="inbox-row-main">
        <div className="irm-top"><b>{msg.sender}</b><span className="irm-time">{msg.time}</span></div>
        <div className="irm-subject">{msg.subject}</div>
        <div className="irm-preview">{msg.preview}</div>
      </div>
      <TagPill tag={msg.tag} />
    </button>
    {expanded && <div className="inbox-expanded">
      <p>{msg.body}</p>
      <div className="inbox-actions">
        {msg.actions.map(a => <button key={a} className={`ia-btn ${a === 'Accept' ? 'accept' : a === 'Reject' ? 'reject' : ''}`} onClick={() => onAction(a)}>
          {a === 'Accept' ? <Check size={13} /> : a === 'Reject' ? <X size={13} /> : a === 'Reply' ? <ReplyIcon size={13} /> : <ChevronRight size={13} />} {a}
        </button>)}
      </div>
      {replyOpen && <form className="reply-box" onSubmit={e => { e.preventDefault(); if (draft.trim()) { onSendReply(draft.trim()); setDraft(''); } }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Reply to ${msg.sender}...`} autoFocus />
        <button type="submit"><Send size={14} /></button>
      </form>}
    </div>}
  </div>;
}

function Inbox({ goTo }) {
  const { messages, markRead, markAllRead, removeMessage, unreadCount } = useCommunicationData();
  const [openId, setOpenId] = useState(null);
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [toast, setToast] = useState('');

  const toggle = (msg) => {
    setOpenId(id => id === msg.id ? null : msg.id);
    if (msg.unread) markRead(msg.id);
    setReplyOpenId(null);
  };

  const handleAction = (msg, action) => {
    if (action === 'Reply') { setReplyOpenId(msg.id); return; }
    if (action === 'Accept') { setToast(`Accepted: ${msg.subject}`); removeMessage(msg.id); setOpenId(null); return; }
    if (action === 'Reject') { setToast(`Declined: ${msg.subject}`); removeMessage(msg.id); setOpenId(null); return; }
    if (action === 'Delegate') { setToast(`Delegated to Assistant Manager: ${msg.subject}`); return; }
    if (msg.link) goTo(msg.link.screen);
  };

  return <section className="comm-card inbox-card">
    <div className="comm-card-head">
      <h3>Inbox</h3>{unreadCount > 0 && <span className="new-pill">{unreadCount} new</span>}
      <button className="link-btn" onClick={markAllRead}>Mark all as read</button>
    </div>
    <div className="inbox-list">
      {messages.map(msg => <InboxRow key={msg.id} msg={msg} expanded={openId === msg.id}
        onToggle={() => toggle(msg)} onAction={(a) => handleAction(msg, a)}
        replyOpen={replyOpenId === msg.id}
        onSendReply={(text) => { setToast(`Reply sent to ${msg.sender}`); setReplyOpenId(null); markRead(msg.id); }} />)}
      {messages.length === 0 && <p className="muted-sub" style={{ padding: 12 }}>Inbox zero — nothing needs your attention right now.</p>}
    </div>
    {toast && <div className="comm-toast">{toast}<X size={12} onClick={() => setToast('')} /></div>}
  </section>;
}

// ================= CALENDAR =================

function CalendarPanel({ goTo, setTab }) {
  const { visibleDays, selectedDay, setSelectedDay, shiftDays, eventsForSelectedDay } = useCommunicationData();
  const [toast, setToast] = useState('');

  const quickActions = [
    ['Reply to message', Mail, () => setTab('inbox')],
    ['View staff', Users, () => goTo('Staff')],
    ['View player', UserRound, () => goTo('Squad')],
    ['View transfer', ArrowLeftRight, () => goTo('Transfers')],
    ['View competition', Trophy, () => goTo('Competitions')],
    ['Delegate to assistant', Shield, () => setToast('Assistant Manager will now handle this communication.')],
  ];

  return <section className="comm-card calendar-card">
    <div className="comm-card-head"><CalendarDays size={18} color="#8a6bff" /><h3>Communications Calendar</h3><button className="link-btn">View all</button></div>
    <div className="day-strip">
      <button className="day-nav" onClick={() => shiftDays(-1)}><ChevronLeft size={16} /></button>
      {visibleDays.map(d => <button key={d.key} className={`day-chip ${selectedDay === d.key ? 'active' : ''}`} onClick={() => setSelectedDay(d.key)}>
        <b>{d.dom}</b><span>{d.dow}</span>
      </button>)}
      <button className="day-nav" onClick={() => shiftDays(1)}><ChevronRight size={16} /></button>
    </div>
    <div className="cal-events">
      {eventsForSelectedDay.length === 0 && <p className="muted-sub" style={{ padding: '10px 4px' }}>No communications scheduled for this day.</p>}
      {eventsForSelectedDay.map((ev, i) => {
        const Icon = CAL_ICONS[ev.icon] || Users;
        const c = TAG_COLORS[ev.tag] || '#8f9abb';
        return <div className="cal-event-row" key={i}>
          <span className="cal-event-icon" style={{ background: `linear-gradient(150deg, ${c}33, #0a0e22)`, borderColor: `${c}88` }}><Icon size={16} color={c} /></span>
          <div><b>{ev.time}</b><strong>{ev.title}</strong><span>{ev.place}</span></div>
          <TagPill tag={ev.tag} />
        </div>;
      })}
    </div>
    <div className="quick-actions-block">
      <div className="panel-label">Quick Actions</div>
      <div className="qa-grid">{quickActions.map(([label, Icon, fn]) => <button key={label} className="qa-btn" onClick={fn}><Icon size={15} />{label}</button>)}</div>
    </div>
    {toast && <div className="comm-toast">{toast}<X size={12} onClick={() => setToast('')} /></div>}
  </section>;
}

// ================= NEWS / MESSAGES =================

const NEWS_CAT_COLOR = { 'Club News': '#ff8a5c', 'Transfer News': '#3ddc84', 'Football News': '#4da6ff', 'Media': '#b06bff', 'Competition': '#3ddc84', 'Fans': '#3ddc84' };
const NEWS_CREST_COLOR = { 'Man Utd': '#DA291C', 'Real Madrid': '#FEBE10', 'Man City': '#6CABDD', 'UCL': '#1a1a2e', 'Fans': '#3a4570' };

function NewsCrest({ name }) {
  if (name === 'UCL') return <span className="news-crest" style={{ background: 'linear-gradient(150deg,#2a2a55,#0a0e22)' }}><Trophy size={18} color="#c9d3f0" /></span>;
  if (name === 'Fans') return <span className="news-crest" style={{ background: 'linear-gradient(150deg,#2a3560,#0a0e22)' }}><Users size={18} color="#c9d3f0" /></span>;
  const color = NEWS_CREST_COLOR[name] || '#3a4570';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <span className="news-crest" style={{ background: `radial-gradient(circle at 32% 28%, ${color}dd, ${color}88 60%, #05070f 130%)` }}>{initials}</span>;
}

function NewsCard({ item, onOpen }) {
  const color = NEWS_CAT_COLOR[item.category] || '#8f9abb';
  return <button className="news-card" onClick={onOpen}>
    <NewsCrest name={item.crest} />
    <div className="news-body">
      <span className="news-cat" style={{ color }}>{item.category}{item.tweet && <em className="news-handle">{item.handle}</em>}</span>
      <b>{item.headline}</b>
      <p>{item.body}</p>
      {item.tweet ? <div className="tweet-engagement">
        <span><MessageCircle size={12} />{item.engagement.replies}</span>
        <span><Repeat2 size={12} />{item.engagement.retweets}</span>
        <span><Heart size={12} />{item.engagement.likes}</span>
      </div> : <span className="news-time">{item.time}</span>}
    </div>
  </button>;
}

function News({ goTo }) {
  const { newsItems } = useCommunicationData();
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Club News', 'Football News', 'Media'];
  const filtered = filter === 'All' ? newsItems : newsItems.filter(n => n.bucket === filter);

  return <section className="comm-card news-card-panel">
    <div className="comm-card-head"><h3>News / Messages</h3><button className="link-btn">View all</button></div>
    <div className="news-filters">{filters.map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
    <div className="news-list">
      {filtered.map(item => <NewsCard key={item.id} item={item} onOpen={() => item.link && goTo(item.link.screen)} />)}
      {filtered.length === 0 && <p className="muted-sub" style={{ padding: 12 }}>No stories in this category right now.</p>}
    </div>
  </section>;
}

// ================= ROOT =================

const TABS = [['inbox', 'Inbox', Mail], ['calendar', 'Calendar', CalendarDays], ['news', 'News / Messages', Newspaper]];

export default function CommunicationsScreen({ setActive, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'inbox');
  const goTo = (screen) => { if (screen === 'Communications') return; setActive(screen); };

  return <div className="comm-page">
    <div className="comm-header">
      <span className="comm-header-icon"><MessageSquare size={22} /></span>
      <div><h1>Communications</h1><span>Your inbox, schedule and the latest news from around the football world.</span></div>
    </div>
    <div className="comm-tabs">
      {TABS.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={16} />{label}</button>)}
    </div>
    <div className="comm-columns">
      {tab === 'inbox' && <>
        <Inbox goTo={goTo} />
        <CalendarPanel goTo={goTo} setTab={setTab} />
        <News goTo={goTo} />
      </>}
      {tab === 'calendar' && <>
        <CalendarPanel goTo={goTo} setTab={setTab} />
        <Inbox goTo={goTo} />
        <News goTo={goTo} />
      </>}
      {tab === 'news' && <>
        <News goTo={goTo} />
        <Inbox goTo={goTo} />
        <CalendarPanel goTo={goTo} setTab={setTab} />
      </>}
    </div>
  </div>;
}
