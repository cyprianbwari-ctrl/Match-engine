import React, { useState } from 'react';
import { Save, Cloud, RefreshCw, Trash2, Check, Settings as SettingsIcon, ShieldCheck, Star, Award } from 'lucide-react';
import './settings.css';
import { useSaveData } from './store/SaveContext.jsx';
import { useSimulation } from './store/SimulationContext.jsx';
import { useManagerData } from './store/ManagerContext.jsx';

export default function SettingsScreen({ setActive }) {
  const save = useSaveData();
  const sim = useSimulation();
  const manager = useManagerData();
  const [slots, setSlots] = useState(save.getSlots());
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [flash, setFlash] = useState('');

  const refresh = () => setSlots(save.getSlots());

  const doSave = (idx) => {
    save.saveToSlot(idx);
    refresh();
    setFlash(`Saved to Slot ${idx + 1}`);
    setTimeout(() => setFlash(''), 2000);
  };
  const doLoad = (idx) => {
    if (save.loadFromSlot(idx)) {
      setFlash(`Loaded Slot ${idx + 1}`);
      setTimeout(() => setFlash(''), 2000);
    }
  };
  const doDelete = (idx) => {
    save.deleteSlot(idx);
    refresh();
    setConfirmSlot(null);
  };

  return <div className="settings-page">
    <div className="settings-head"><span className="settings-head-icon"><SettingsIcon size={22} color="#06210a" /></span>
      <div><h1>SETTINGS</h1><span>Save system, preferences and career management</span></div></div>

    <section className="settings-panel">
      <h3><Cloud size={16} /> Auto-Save</h3>
      <div className="autosave-row">
        <div className="autosave-status"><i className="autosave-dot" /> Auto-save enabled</div>
        <div className="autosave-last">Last saved: {save.lastSavedAt ? save.lastSavedAt.toLocaleString() : 'Not yet this session'}{save.lastSaveReason ? ` · ${save.lastSaveReason}` : ''}</div>
      </div>
      <p className="muted-sub">FAMILY 26 automatically saves your career after matches, transfers, negotiations, contract signings, simulated days, and before/after vacations — you never need to press anything for this to happen.</p>
    </section>

    <section className="settings-panel">
      <div className="settings-panel-head"><h3><Save size={16} /> Save Game</h3><button className="settings-refresh" onClick={refresh}><RefreshCw size={13} /> Refresh</button></div>
      {flash && <div className="save-flash"><Check size={13} /> {flash}</div>}
      <div className="save-slots-grid">
        {slots.map(s => <div className="save-slot" key={s.index}>
          <div className="save-slot-head"><b>Save Slot {s.index + 1}</b>{!s.empty && <button className="slot-delete" onClick={() => setConfirmSlot(s.index)}><Trash2 size={13} /></button>}</div>
          {s.empty
            ? <p className="muted-sub">Empty</p>
            : <div className="slot-details">
                <span>{s.club}</span>
                <span>{s.dateLabel}</span>
                <small>Saved {new Date(s.savedAt).toLocaleString()}</small>
              </div>}
          {confirmSlot === s.index
            ? <div className="slot-confirm"><span>Delete this save?</span><button onClick={() => doDelete(s.index)}>Yes</button><button onClick={() => setConfirmSlot(null)}>Cancel</button></div>
            : <div className="slot-actions">
                <button className="slot-save-btn" onClick={() => doSave(s.index)}>{s.empty ? 'Save' : 'Overwrite'}</button>
                {!s.empty && <button className="slot-load-btn" onClick={() => doLoad(s.index)}>Load</button>}
              </div>}
        </div>)}
      </div>
    </section>

    <section className="settings-panel">
      <h3><ShieldCheck size={16} /> Manager Profile</h3>
      <div className="mgr-head">
        <div className="mgr-avatar">{manager.profile.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
        <div className="mgr-id">
          <h4>{manager.profile.name} <span>{manager.profile.nationality}</span></h4>
          <span className="muted-sub">{manager.profile.coachingStyle} · {manager.profile.tacticalStyle}</span>
          <span className="muted-sub">Born {manager.profile.dob} · {manager.profile.experience} years' experience</span>
        </div>
        <div className="mgr-reputation">
          <b>{Math.round(manager.reputation)}</b>
          <span>{manager.reputationTier}</span>
          <div className="rep-bar"><i style={{ width: `${manager.reputation}%` }} /></div>
        </div>
      </div>
      <div className="mgr-attrs">
        {Object.entries(manager.profile.attributes).map(([k, v]) => <div key={k}><span>{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</span><div className="attr-track"><i style={{ width: `${v}%` }} /></div><b>{v}</b></div>)}
      </div>
      <div className="mgr-cols">
        <div>
          <h4><Award size={13} /> Career History</h4>
          {manager.careerHistory.slice().reverse().slice(0, 6).map((h, i) => <div className="mgr-history-row" key={i}><span>{h.date}</span><b>{h.event}</b><small>{h.club}</small></div>)}
        </div>
        <div>
          <h4><Star size={13} /> Previous Clubs</h4>
          {manager.profile.previousClubs.length === 0 && <p className="muted-sub">This is your first managerial role.</p>}
          {manager.profile.previousClubs.map((c, i) => <div className="mgr-history-row" key={i}><span>{c.period}</span><b>{c.club}</b><small>{c.result}</small></div>)}
          <h4 style={{ marginTop: 10 }}>Achievements</h4>
          {manager.profile.achievements.length === 0 && <p className="muted-sub">No trophies yet at {manager.profile.currentClub} — start building your legacy.</p>}
        </div>
      </div>
    </section>

    <section className="settings-panel">
      <h3><ShieldCheck size={16} /> Career Info</h3>
      <div className="career-info-grid">
        <div><span>Manager</span><b>{manager.profile.name}</b></div>
        <div><span>Club</span><b>{manager.profile.currentClub}</b></div>
        <div><span>Current Date</span><b>{sim.dateLabel}</b></div>
        <div><span>Status</span><b>{sim.matchLocked ? 'Match In Progress' : sim.gameStatus?.label || 'Active'}</b></div>
      </div>
    </section>
  </div>;
}
