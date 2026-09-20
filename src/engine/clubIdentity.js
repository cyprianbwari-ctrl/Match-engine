/**
 * FAMILY 26 — authoritative career club identity.
 * UI labels are derived from the career profile + canonical database.
 */
export function clubKey(name = "") {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getCareerClubId(profile = {}, db = null) {
  const clubs = db?.clubs || db?.index?.clubs || [];
  if (profile.currentClubId != null) {
    const direct = clubs.find(c => String(c.id) === String(profile.currentClubId) || String(c.uid) === String(profile.currentClubId));
    if (direct) return String(direct.id);
  }
  const name = profile.currentClub || "";
  const hit = clubs.find(c => String(c.name || c.club || "").toLowerCase() === name.toLowerCase() || clubKey(c.name || c.club) === clubKey(profile.currentClubId || ""));
  return hit?.id != null ? String(hit.id) : String(profile.currentClubId ?? clubKey(name));
}

export function getCareerClubName(profile = {}, db = null) {
  const id = getCareerClubId(profile, db);
  const clubs = db?.clubs || db?.index?.clubs || [];
  const hit = clubs.find(c => String(c.id) === String(id) || clubKey(c.name || c.club) === String(id));
  return hit?.name || hit?.club || profile.currentClub || "Unassigned Club";
}

export function isCareerClub(profile, db, club) {
  const id = getCareerClubId(profile, db);
  return String(id) === String(club?.id) || clubKey(getCareerClubName(profile, db)) === clubKey(club?.name || club?.club || club);
}
