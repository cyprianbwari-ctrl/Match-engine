# FAMILY 26 — Debug Fix Package — 19 Sep 2026

This package contains the current working debug corrections requested for the Club Brugge career.

## Corrected
- Home/competition fixture ordering now puts the career manager's next fixture first.
- Match setup uses the career club's actual home/away orientation.
- Match formation state receives the selected formation correctly.
- Squad overview uses the career club instead of the legacy Newcastle seed.
- Duplicate Squad Overview component render removed.
- Database player-to-club squad joins normalize numeric UID values such as `260676.0`.
- `club_squads` is treated as the authoritative player/club relationship.
- Squad potential uses database PA and never displays a potential below OVR.
- Squad market value is derived when the source database has no market-value field, preventing the £0 total.
- Squad value calculations use the canonical numeric `valueNumber`.

## Verification note
The supplied project dependencies contain Windows Rolldown native bindings. The current Linux execution environment does not contain the Linux Rolldown native binding, so a local production Vite build could not be completed in this environment. The source corrections are included in this package; run `npm install` and `npm run build` on the development machine before deployment.

## No further gameplay systems were intentionally changed for this debug package.

## Follow-up corrections — 20 Sep 2026
- New careers no longer inherit Newcastle United / Sporting CP manager history.
- Starting a new career resets previous clubs and achievements and creates the career-history entry for the selected club.
- Communications now personalize seeded club-specific inbox/news/calendar content to the selected career club and replace legacy Manchester United/Newcastle/Old Trafford/Carrington/Ten Hag references.
- Removed the “BIGGER STRONGER TOGETHER” slogan from the web app UI, including the header/stadium instances, so it cannot overlap navigation.
