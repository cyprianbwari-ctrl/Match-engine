import React, { useState, useMemo } from 'react';
import { useDatabase } from '../store/DatabaseContext.jsx';
import { getNationId, getDivisionsForNation } from '../engine/leaguePyramid.js';

const ATTRIBUTE_FIELDS = [
  ['attacking', 'Attacking'],
  ['defending', 'Defending'],
  ['tactical', 'Tactical Knowledge'],
  ['manManagement', 'Man Management'],
  ['fitness', 'Fitness Coaching'],
  ['youthDevelopment', 'Youth Development'],
];

const MIN_ATTR = 20;
const MAX_ATTR = 99;

const COACHING_STYLES = ['Possession-Based', 'Direct & Physical', 'High Press', 'Counter-Attacking'];
const TACTICAL_STYLES = ['Attacking Full-Backs', 'Defensive Solidity', 'Fluid Positional Play', 'Rigid Structure'];
const NATIONALITIES = [
  ['🏴', 'England'], ['🇪🇸', 'Spain'], ['🇩🇪', 'Germany'], ['🇮🇹', 'Italy'], ['🇫🇷', 'France'],
];

function randomAttributeSet(budget) {
  // Spread the fixed budget across six attributes with some variance, clamped to range.
  const keys = ATTRIBUTE_FIELDS.map(([k]) => k);
  const weights = keys.map(() => 0.6 + Math.random() * 0.8);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => Math.round((w / weightSum) * budget));
  const result = {};
  keys.forEach((k, i) => { result[k] = Math.min(MAX_ATTR, Math.max(MIN_ATTR, raw[i])); });
  return result;
}

export default function CreateManagerScreen({ draft, onChange, onBack, onContinue }) {
  const db = useDatabase();
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const initialBudget = useMemo(
    () => ATTRIBUTE_FIELDS.reduce((sum, [key]) => sum + (draft.attributes[key] || 0), 0),
    // budget is fixed at whatever the profile started with — only computed once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [budget] = useState(initialBudget);

  const leagueOptions = useMemo(() => {
    if (db.loading) return [];
    // Build this from the canonical database, rather than a small curated
    // country list. A country is selectable when it has at least one men's
    // domestic division in the database.
    return db.nations.map(nation => {
      const label = nation.name;
      const nationId = nation.nation_id ?? nation.nationId ?? getNationId(db.nations, label);
      const divisions = getDivisionsForNation(db.competitions, nationId);
      return { label, nationId, tierCount: divisions.length };
    }).filter(x => x.label && x.tierCount > 0)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [db.loading, db.nations, db.competitions]);

  const toggleActiveLeague = (league) => {
    const selected = draft.activeLeagues || [];
    if (selected.includes(league.label)) {
      onChange({ ...draft, activeLeagues: selected.filter(x => x !== league.label) });
      return;
    }
    if (selected.length >= 5) return;
    onChange({ ...draft, activeLeagues: [...selected, league.label] });
  };

  const spent = ATTRIBUTE_FIELDS.reduce((sum, [key]) => sum + (draft.attributes[key] || 0), 0);
  const remaining = budget - spent;

  const setAttribute = (key, value) => {
    const others = ATTRIBUTE_FIELDS.reduce((sum, [k]) => (k === key ? sum : sum + (draft.attributes[k] || 0)), 0);
    const maxAllowed = Math.min(MAX_ATTR, budget - others);
    const clamped = Math.max(MIN_ATTR, Math.min(value, Math.max(MIN_ATTR, maxAllowed)));
    onChange({ ...draft, attributes: { ...draft.attributes, [key]: clamped } });
  };

  const randomise = () => {
    onChange({ ...draft, attributes: randomAttributeSet(budget) });
  };

  return (
    <div className="ob-form-wrap">
      <div className="ob-form">
        <div>
          <h1 className="ob-h1">Create your manager</h1>
          <div className="ob-sub">This is who you'll be for the next twenty years.</div>
        </div>

        <div className="ob-columns">
          {/* Left: identity */}
          <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="ob-card" style={{ textAlign: 'center' }}>
              <div className="ob-avatar">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6f7aa3" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                </svg>
              </div>
              <button className="ob-photo-btn">Choose Photo</button>
            </div>

            <div className="ob-card">
              <div className="ob-field">
                <label className="ob-field-label" htmlFor="mgr-name">Manager Name</label>
                <input
                  id="mgr-name" className="ob-input" type="text" value={draft.name}
                  onChange={e => onChange({ ...draft, name: e.target.value })}
                />
              </div>

              <div className="ob-row">
                <div className="ob-field">
                  <label className="ob-field-label" htmlFor="mgr-nat">Nationality</label>
                  <select
                    id="mgr-nat" className="ob-select" value={draft.nationality}
                    onChange={e => onChange({ ...draft, nationality: e.target.value })}
                  >
                    {NATIONALITIES.map(([flag, label]) => (
                      <option key={label} value={flag}>{flag} {label}</option>
                    ))}
                  </select>
                </div>
                <div className="ob-field">
                  <label className="ob-field-label" htmlFor="mgr-dob">Date of Birth</label>
                  <input
                    id="mgr-dob" className="ob-input" type="text" value={draft.dob}
                    onChange={e => onChange({ ...draft, dob: e.target.value })}
                  />
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-field-label" htmlFor="mgr-badge">Coaching Badge</label>
                <select
                  id="mgr-badge" className="ob-select" value={draft.badge}
                  onChange={e => onChange({ ...draft, badge: e.target.value })}
                >
                  <option>UEFA Pro Licence</option>
                  <option>UEFA A Licence</option>
                  <option>UEFA B Licence</option>
                  <option>No Formal Badge</option>
                </select>
              </div>
            </div>

            <div className="ob-card ob-active-leagues-card">
              <div className="ob-section-label" style={{ marginBottom: 8 }}>World Setup</div>
              <div className="ob-active-leagues-head">
                <div>
                  <div className="ob-active-leagues-title">Active Leagues</div>
                  <div className="ob-active-leagues-sub">Choose exactly 5 countries to simulate in full detail.</div>
                </div>
                <span className="ob-league-count">{(draft.activeLeagues || []).length}/5</span>
              </div>
              <div className="ob-selected-leagues">
                {(draft.activeLeagues || []).map(league => (
                  <span className="ob-league-chip" key={league}>{league}</span>
                ))}
              </div>
              <button className="ob-league-picker-btn" onClick={() => setShowLeaguePicker(true)}>
                <span>⚙ Select Active Leagues</span>
                <span>›</span>
              </button>
            </div>

            <div className="ob-card">
              <div style={{ fontSize: 12, color: '#9ba5c5', lineHeight: 1.5 }}>
                Starting reputation is set by your background, not chosen directly — it grows from results once your career begins.
              </div>
              <div className="ob-detail-row" style={{ marginTop: 12 }}>
                <span>Starting Tier</span><span>Unproven</span>
              </div>
            </div>
          </div>

          {/* Right: style + attributes */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="ob-card">
              <div className="ob-section-label">Playing Philosophy</div>
              <div className="ob-row">
                <div className="ob-field">
                  <label className="ob-field-label" htmlFor="mgr-coach">Coaching Style</label>
                  <select
                    id="mgr-coach" className="ob-select" value={draft.coachingStyle}
                    onChange={e => onChange({ ...draft, coachingStyle: e.target.value })}
                  >
                    {COACHING_STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="ob-field">
                  <label className="ob-field-label" htmlFor="mgr-tact">Tactical Style</label>
                  <select
                    id="mgr-tact" className="ob-select" value={draft.tacticalStyle}
                    onChange={e => onChange({ ...draft, tacticalStyle: e.target.value })}
                  >
                    {TACTICAL_STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="ob-card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <div className="ob-section-label" style={{ marginBottom: 0 }}>Starting Attributes</div>
                <div className={`ob-points-remaining ${remaining < 0 ? 'over' : ''}`}>{remaining} point{remaining === 1 ? '' : 's'} remaining</div>
              </div>

              {ATTRIBUTE_FIELDS.map(([key, label]) => (
                <div className="ob-slider-row" key={key}>
                  <span className="ob-slider-label">{label}</span>
                  <div className="ob-slider-track">
                    <div className="ob-slider-fill" style={{ width: `${draft.attributes[key]}%` }} />
                    <input
                      className="ob-slider-input" type="range" min={MIN_ATTR} max={MAX_ATTR}
                      value={draft.attributes[key]}
                      onChange={e => setAttribute(key, Number(e.target.value))}
                      aria-label={label}
                    />
                  </div>
                  <span className="ob-slider-value">{draft.attributes[key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ob-actions">
          <button className="ob-btn-secondary" onClick={onBack}>Back</button>
          <button className="ob-btn-secondary" onClick={randomise}>Randomise</button>
          <button
            className="ob-btn-primary"
            onClick={onContinue}
            disabled={!draft.name.trim() || (draft.activeLeagues || []).length !== 5}
          >
            Continue to Choose Club
          </button>
        </div>
      </div>

      {showLeaguePicker && (
        <div className="ob-modal-backdrop" role="dialog" aria-modal="true" aria-label="Select active leagues">
          <div className="ob-league-modal">
            <div className="ob-league-modal-head">
              <div>
                <h2 className="ob-h1">Select Active Leagues</h2>
                <div className="ob-sub">Pick exactly 5 countries. Their leagues will be fully simulated throughout your career.</div>
              </div>
              <button className="ob-modal-close" onClick={() => setShowLeaguePicker(false)} aria-label="Close">×</button>
            </div>

            <div className="ob-league-modal-summary">
              <span>{(draft.activeLeagues || []).length} of 5 selected</span>
              <span className={(draft.activeLeagues || []).length === 5 ? 'ready' : ''}>
                {(draft.activeLeagues || []).length === 5 ? 'Ready' : 'Select 5 leagues'}
              </span>
            </div>

            <div className="ob-league-grid">
              {leagueOptions.map(league => {
                const selected = (draft.activeLeagues || []).includes(league.label);
                const disabled = !selected && (draft.activeLeagues || []).length >= 5;
                return (
                  <button
                    key={league.nationId || league.label}
                    className={`ob-league-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => toggleActiveLeague(league)}
                    disabled={disabled}
                  >
                    <span className="ob-league-check">{selected ? '✓' : ''}</span>
                    <span className="ob-league-name">{league.label}</span>
                    <span className="ob-league-tiers">{league.tierCount} tier{league.tierCount === 1 ? '' : 's'}</span>
                  </button>
                );
              })}
            </div>

            <div className="ob-league-modal-foot">
              <div className="ob-sub">Your selection is locked when the career starts.</div>
              <button
                className="ob-btn-primary"
                onClick={() => setShowLeaguePicker(false)}
                disabled={(draft.activeLeagues || []).length !== 5}
              >
                Confirm 5 Active Leagues
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
