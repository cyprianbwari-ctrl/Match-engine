import React from 'react';
import { useSaveData } from '../store/SaveContext.jsx';

export default function StartScreen({ onNewCareer, onContinueSlot, onSettings }) {
  const save = useSaveData();
  const slots = save.getSlots();
  const filled = slots.filter(s => !s.empty);

  return (
    <div className="ob-body">
      <div className="ob-start-left">
        <div>
          <div className="ob-title">FAMILY<br /><span>26</span></div>
          <div className="ob-tagline">Every dugout. Every division. One career.</div>
        </div>

        <div className="ob-menu">
          <button className="ob-menu-btn primary" onClick={onNewCareer}>New Career</button>
          <button
            className="ob-menu-btn"
            onClick={() => filled[0] && onContinueSlot(filled[0].index)}
            disabled={filled.length === 0}
            style={filled.length === 0 ? { opacity: 0.4, cursor: 'default' } : undefined}
          >
            Continue Career
            <span className="ob-menu-badge">{filled.length} save{filled.length === 1 ? '' : 's'}</span>
          </button>
          <button className="ob-menu-btn ghost" onClick={onSettings}>Settings</button>
          <button className="ob-menu-btn ghost">Credits</button>
        </div>

        <div className="ob-footer-note">v1.13 &middot; FAMILY26_mens_only database</div>
      </div>

      <div className="ob-start-right">
        <div className="ob-slots">
          <div className="ob-slots-title">Continue where you left off</div>
          {slots.map(s => (
            <button
              key={s.index}
              className={`ob-slot ${s.empty ? 'empty' : ''}`}
              onClick={() => !s.empty && onContinueSlot(s.index)}
            >
              <div className="ob-slot-crest">{s.empty ? '' : s.crestInitials}</div>
              <div className="ob-slot-info">
                <div className="ob-slot-name">{s.empty ? 'Empty Slot' : `${s.managerName} · ${s.club}`}</div>
                <div className="ob-slot-meta">{s.empty ? 'Start a new career here' : s.dateLabel}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
