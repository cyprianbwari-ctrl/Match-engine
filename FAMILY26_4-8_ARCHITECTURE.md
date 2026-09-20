# FAMILY 26 — Roadmap 4–8 integration

## 4. AI managers
AI managers now have persistent identities, tactical styles, formations, intensity and reputation. A daily world tick can change reputation and produce tactical world events. The match renderer remains presentation-only; AI decisions belong to the simulation layer.

## 5. Transfer market
The existing transfer context remains the transaction authority. Player preference, club asking price, negotiation rounds, transfer/loan listing, incoming bids and finance transactions stay connected. The market is designed so an accepted deal writes to finance, history and news together.

## 6. Squad / training / scouting
Squad, training and scouting contexts are kept as separate gameplay systems but share player identity. Training tracks sharpness, workload, injury risk, development and youth readiness; these values are intended inputs to selection, scouting reports and match decisions.

## 7. Finance / competitions / communications integration
Financial events are routed through FinanceContext. Transfer activity creates ledger entries and news. CommunicationContext receives world-process messages/news. CompetitionContext owns competition presentation and can be fed match results from the simulation/store.

## 8. UI/UX polish
Added a shared visual quality layer: focus states, subtle interaction motion, active-navigation emphasis, glass-panel consistency and responsive breakpoints. Existing dark navy / purple / lime identity is preserved.

## Data-flow rule
Database → Game World → Simulation → Match State → Frame State → 3D Renderer → UI.
The renderer must never invent football outcomes. Goals, fouls, possession, transfers, finances and competition results are simulation/state concerns.
