# FAMILY 26 — Tactical Shape + Career Club + Active Leagues

## 5. Deeper tactical positional behaviour
The match engine now derives positional anchors from role, width, compactness, mentality and defensive line.
Pressing uses role-aware triggers and intensity. Forward runs are role/attribute driven and no longer use
random lane offsets. The same tactical context therefore changes the visible team shape in the 3D match.

## 6. Authoritative current club
A career club identity helper resolves `currentClubId` from the manager profile and canonical database,
with a stable slug fallback. Live match, simulation, competition and transfer logic use that identity instead
of treating Manchester United as the player's permanent club. Legacy historical datasets may still contain
Manchester United as historical seed content; they are not used as the career identity.

## 7. Five active leagues
The career policy defines 20 selectable countries and requires exactly five. The selected five are now
exposed as an authoritative runtime policy and gate career match generation, transfer visibility, competition
progression and career manager movement. AI/background activity can still exist outside the selected set.

No roadmap item after these changes is included.
