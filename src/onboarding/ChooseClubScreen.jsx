import React, { useMemo, useState } from 'react';
import { useDatabase } from '../store/DatabaseContext.jsx';
import { getNationId, getDivisionsForNation, getClubsForDivision, reputationStars, divisionShortLabel } from '../engine/leaguePyramid.js';
import { computeBoardExpectation } from '../engine/careerClub.js';

function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

function boardExpectationFor(division, club, clubsInDivision) {
  const rankInDivision = clubsInDivision.findIndex(c => c.id === club.id) + 1;
  return computeBoardExpectation(rankInDivision, clubsInDivision.length, division.level).label;
}

function estimateBudget(club, division) {
  // No transfer-budget field in the source data — derive a plausible figure
  // from reputation and tier, rather than inventing one number. Reputation
  // alone isn't enough: a relegated club keeps a high historical reputation
  // score, but its real budget drops sharply outside the top flight.
  const level = division?.level ?? 0;
  const tierDivisor = [40, 220, 900, 3500][level] ?? 6000;
  const millions = Math.max(1, Math.round(club.reputation / tierDivisor));
  return `£${millions.toLocaleString()},000,000`;
}

export default function ChooseClubScreen({ draft, onChange, onBack, onContinue }) {
  const db = useDatabase();
  const [country, setCountry] = useState(draft.activeLeagues[0] || 'England');
  const [divisionId, setDivisionId] = useState(null);
  const [search, setSearch] = useState('');

  const nationId = useMemo(() => getNationId(db.nations, country), [db.nations, country]);
  const divisions = useMemo(() => getDivisionsForNation(db.competitions, nationId), [db.competitions, nationId]);
  const activeDivision = useMemo(
    () => divisions.find(d => d.id === divisionId) || divisions[0] || null,
    [divisions, divisionId]
  );
  const clubsInDivision = useMemo(
    () => activeDivision ? getClubsForDivision(db.clubs, activeDivision) : [],
    [db.clubs, activeDivision]
  );
  const visibleClubs = useMemo(
    () => search.trim()
      ? clubsInDivision.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()))
      : clubsInDivision,
    [clubsInDivision, search]
  );

  const selectedClub = draft.club;

  const handlePickCountry = (c) => { setCountry(c); setDivisionId(null); };
  const handlePickClub = (club) => onChange({ ...draft, club, division: activeDivision });

  if (db.loading) {
    return <div className="ob-empty-state" style={{ margin: 'auto' }}>Loading the database…</div>;
  }

  return (
    <div className="ob-club-body">
      <div className="ob-club-rail">
        <div>
          <div className="ob-rail-label">Active Leagues</div>
          <div className="ob-rail-note">Every league below has its own full pyramid, not just the top flight.</div>
          {draft.activeLeagues.map(c => {
            const nid = getNationId(db.nations, c);
            const tierCount = getDivisionsForNation(db.competitions, nid).length;
            return (
              <button key={c} className={`ob-rail-btn ${c === country ? 'active' : ''}`} onClick={() => handlePickCountry(c)}>
                {c} <span className="ob-rail-count">{tierCount} tier{tierCount === 1 ? '' : 's'}</span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="ob-rail-label">Division &middot; {country}</div>
          {divisions.map(d => {
            const count = getClubsForDivision(db.clubs, d).length;
            return (
              <button
                key={d.id}
                className={`ob-rail-btn ${activeDivision?.id === d.id ? 'active' : ''}`}
                onClick={() => setDivisionId(d.id)}
              >
                {d.name} <span className="ob-rail-count">{count}</span>
              </button>
            );
          })}
          <div className="ob-rail-note" style={{ marginTop: 10 }}>
            Start anywhere in the pyramid — win promotion to climb toward the top flight.
          </div>
        </div>
      </div>

      <div className="ob-club-main">
        <div className="ob-club-head">
          <div>
            <h1 className="ob-h1">Choose your club</h1>
            <div className="ob-sub">{country} &middot; {activeDivision ? activeDivision.name : '—'} &middot; {visibleClubs.length} clubs</div>
          </div>
          <input
            className="ob-search" type="text" placeholder="Search clubs..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {visibleClubs.length === 0 && <div className="ob-empty-state">No clubs match that search.</div>}

        <div className="ob-club-grid">
          {visibleClubs.map(club => {
            const isSelected = selectedClub?.id === club.id;
            const initials = (club.code || club.shortName || club.name).slice(0, 4).toUpperCase();
            return (
              <button
                key={club.id}
                className={`ob-club-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handlePickClub(club)}
              >
                {isSelected && (
                  <div className="ob-club-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="#071006" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="ob-club-top">
                  <div className="ob-club-crest">{initials}</div>
                  <div>
                    <div className="ob-club-name">{club.shortName || club.name}</div>
                    <div className="ob-club-meta">{club.name}</div>
                  </div>
                </div>
                <div className="ob-club-stats">
                  <span>Rep&nbsp;{stars(reputationStars(club.reputation))}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ob-club-detail">
        {!selectedClub ? (
          <div className="ob-empty-state" style={{ margin: 'auto' }}>Pick a club to see its details.</div>
        ) : (
          <>
            <div className="ob-detail-head">
              <div className="ob-detail-crest">{(selectedClub.code || selectedClub.shortName || selectedClub.name).slice(0, 4).toUpperCase()}</div>
              <div>
                <div className="ob-detail-name">{selectedClub.name}</div>
                <div className="ob-detail-meta">{draft.division?.name} &middot; {country}</div>
              </div>
            </div>

            {draft.division && divisions.length > 1 && (
              <div className="ob-pyramid">
                <div className="ob-pyramid-title">Path to the top flight</div>
                <div className="ob-pyramid-track">
                  {divisions.map((d, i) => (
                    <React.Fragment key={d.id}>
                      {i > 0 && <div className="ob-pyramid-line" />}
                      <div className={`ob-pyramid-node ${d.id === draft.division.id ? 'current' : ''}`}>
                        <div className={`ob-pyramid-dot ${d.id === draft.division.id ? 'current' : ''}`} />
                        <span>{divisionShortLabel(d.level)}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="ob-pyramid-note">
                  {draft.division.level === 0
                    ? 'You start in the top flight already.'
                    : 'Finish top of your division, or win the play-offs, to earn promotion at the end of the season.'}
                </div>
              </div>
            )}

            <div className="ob-detail-rows">
              <div className="ob-detail-row"><span>Transfer budget</span><span>{estimateBudget(selectedClub, draft.division)}</span></div>
              <div className="ob-detail-row"><span>Board expectation</span><span>{boardExpectationFor(draft.division || { level: 0 }, selectedClub, clubsInDivision)}</span></div>
              <div className="ob-detail-row"><span>Squad reputation</span><span>{stars(reputationStars(selectedClub.reputation))}</span></div>
            </div>

            <div className="ob-detail-actions">
              <button className="ob-btn-primary" onClick={onContinue}>Continue with {selectedClub.shortName || selectedClub.name}</button>
              <button className="ob-btn-secondary" onClick={onBack}>Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
