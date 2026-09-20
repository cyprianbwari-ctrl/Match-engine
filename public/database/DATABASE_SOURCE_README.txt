FAMILY 26 — FMM26 database export, MEN'S DATA ONLY
Filtered from FAMILY26_database_2620_export.zip on 2026-09-15.

WHAT WAS REMOVED:
- competitions.csv: 132 rows dropped (is_women = True)
- clubs.csv: 3,947 rows dropped (gender = 1)
- club_squads.csv: 12,193 rows dropped (squad entries at a women's club)
- players.csv: 8,846 rows dropped (players whose squad membership traces to a women's club)

UNCHANGED (no gender dimension in this data):
- nations.csv
- stadiums.csv
- starting_contracts_raw.csv (raw/undecoded contract records)

METHOD NOTE:
players.csv's own club_id column doesn't reliably match clubs.csv's club_uid
in this decoded export (only partial overlap), so player removal instead went
through club_squads.csv, which links player_uid -> club_uid cleanly (>99% match)
and gave a trustworthy path to each player's club gender. About 8,600 players
in the original file aren't linked to any club_squads row at all (likely
free agents / unattached records) — these were kept as-is since there's no
reliable signal to classify them.
