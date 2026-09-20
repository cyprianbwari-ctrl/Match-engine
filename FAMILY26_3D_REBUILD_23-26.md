# FAMILY 26 — Roadmap 23–26

## 23 — Save/load architecture
Versioned career saves (`career-v2`), complete-state snapshots, six slots, autosave/recovery, and portable JSON export/import.

## 24 — Career records and long-term hooks
A persistent career ledger records matches, transfers, negotiations, training, finance activity and world days. It also provides records and achievement storage for player/club/manager milestones.

## 25 — One connected game
A shared CareerRecords layer observes the same simulation, finance, transfer, training and competition state, so activity is recorded as one career timeline rather than isolated page state.

## 26 — Integration foundation
The connected layer is mounted above the existing providers without replacing the authoritative simulation. Rendering remains presentation-only; save data now includes the connected career ledger.

No #27 work is included.
