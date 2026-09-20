# FAMILY 26 — Exact UI starter

This is the first coded UI pass based on the approved screenshots:
- Dark navy/black dashboard
- Purple + lime-green visual system
- Fixed desktop manager header and left navigation
- Tactics/Formation screen as the primary screen
- Square System + formation selector
- Central 2D tactical pitch
- Real-club/player labels using Manchester United as the starting example
- Player roles, duties, instructions and fit ratings
- Text + 2D match engine indicator (explicitly no 3D)
- Simulation control state
- Save tactic interaction
- Formation and player selection interactions

## Run
Requires Node.js 20.19+ for the current Vite major.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build
```bash
npm run build
npm run preview
```

This uses Vite + React; Vite's current documentation recommends `npm create vite@latest` for scaffolding and supports React/JSX directly.

## 3D Player Renderer v3
The match window now renders the players through a dependency-free WebGL layer with volumetric geometry, lighting, depth, player-specific proportions and action-driven animation poses. The DOM layer is retained only for click targets and selected-player labels.


## Injected men's database
This build includes the FAMILY26_mens_only decoded export under `public/database/` and loads it at runtime as the authoritative database. The database contains players, clubs, competitions, stadiums, club-squad links, nations, and starting-contract raw records.


## Deterministic simulation
Gameplay randomness uses a persisted career seed and derived day/match seeds. `Math.random()` has been removed from gameplay code so the same career state and match seed can be replayed reproducibly. See `FAMILY26_DETERMINISTIC_RNG.md`.
