import React from 'react';

export default function ConfirmScreen({ draft, onBack, onStart }) {
  const club = draft.club;
  const initials = club ? (club.code || club.shortName || club.name).slice(0, 4).toUpperCase() : '';

  return (
    <div className="ob-body">
      <div className="ob-confirm-wrap">
        <div className="ob-confirm-card">
          <div className="ob-confirm-crest">{initials}</div>
          <h1 className="ob-h1">Ready to begin?</h1>
          <div className="ob-sub">Here's your career, before it starts.</div>

          <div className="ob-confirm-summary">
            <div className="ob-detail-row"><span>Manager</span><span>{draft.name}</span></div>
            <div className="ob-detail-row"><span>Nationality</span><span>{draft.nationality}</span></div>
            <div className="ob-detail-row"><span>Coaching style</span><span>{draft.coachingStyle}</span></div>
            <div className="ob-detail-row"><span>Club</span><span>{club ? club.name : 'Not selected'}</span></div>
            <div className="ob-detail-row"><span>Division</span><span>{draft.division ? draft.division.name : '—'}</span></div>
          </div>

          <div className="ob-actions" style={{ justifyContent: 'center' }}>
            <button className="ob-btn-secondary" onClick={onBack}>Back</button>
            <button className="ob-btn-primary" onClick={onStart} disabled={!club}>Start Career</button>
          </div>
        </div>
      </div>
    </div>
  );
}
