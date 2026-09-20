# FAMILY 26 — Owner Pass 6–9

Implemented only the next four owner-level areas after the 1–5 pass.

## 6. Connect every management system
Added `GameIntegrationContext.jsx`, a shared integration layer that observes simulation, finance, transfers, training, competitions, world state, manager state and career records. Cross-system changes are recorded in the common career ledger and exposed through a connection health model.

## 7. Finish the manager experience
Expanded `ManagerContext` from a read-only seeded profile into an editable career profile. Manager name, coaching style and tactical style can be updated and are now included in save snapshots. Active-league data is also part of the manager profile foundation.

## 8. Mobile-first UI pass
Added safer mobile sizing, touch targets, safe-area handling, responsive panels and improved portrait/landscape behaviour without changing the match-only lock rule.

## 9. Integration/consistency pass
Added a visible Connected Game Systems panel in Settings so the manager can see whether the core systems are connected to the shared career state. Save snapshots now preserve the expanded manager profile.

No work from a later owner area was intentionally added.
