# FAMILY 26 — Roadmap 8–10

## 8 — Complete World Competition Scheduler
- Added `src/engine/worldCompetitionScheduler.js` as the authoritative competition scheduling layer.
- Competition state now follows: Competition → Season → Round → Fixture → Result → Table → Next Fixture.
- Generates complete home/away round-robin seasons for active domestic leagues from the canonical database.
- Resolves the five active leagues selected by the career and advances their scheduled rounds together.
- User fixture lookup is driven by the career club ID rather than a hard-coded club.
- Competition state is included in career save snapshots.

## 9 — Authoritative Club Finance Ledger
- Replaced hard-coded finance seed figures with a club-derived financial model.
- Financial state is derived from the current canonical club, squad wages, staff wages, reputation and attendance data.
- Added one ledger for sponsorships, broadcasting, matchday revenue, wages, transfers and operating costs.
- Finance screens now read their figures from that ledger/model rather than separate UI baselines.
- Transfer budget is now sourced from FinanceContext; TransfersContext no longer owns an independent hard-coded budget.
- Sponsor cards and finance charts use the same finance state.

## 10 — Attribute-Specific Training
- Training sessions now select a coach by staff category.
- Session type determines the primary attribute focus.
- Individual player plans can override the session focus.
- Player role/position influences training relevance.
- Development is scaled by age, potential gap, coach quality, fatigue/workload and role relevance.
- Development is applied to the player's live training attributes and feeds the merged player object used by the game.
- Daily simulation now actually applies the scheduled training session instead of only displaying a schedule.

## Validation
- All JavaScript source files pass `node --check`.
- The authoritative scheduler was tested with multi-league round-robin data.
- Existing deterministic RNG architecture remains intact; no `Math.random()` calls were introduced.
