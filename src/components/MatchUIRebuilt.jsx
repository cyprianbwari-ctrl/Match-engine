import React, { useState } from "react";
import "../match.css";

export default function MatchUIRebuilt({
  homeName = "HOME", awayName = "AWAY",
  homeScore = 0, awayScore = 0, clock = "00:00",
  paused = false, speed = 1, onPause, onSpeed,
  onTactics, onInstructions, onSubs, stats = {}
}) {
  const [panel, setPanel] = useState(null);
  const statEntries = [
    ["Possession", stats.possession ?? "50% – 50%"],
    ["Shots", stats.shots ?? "0 – 0"],
    ["On target", stats.onTarget ?? "0 – 0"],
    ["xG", stats.xg ?? "0.00 – 0.00"],
    ["Passes", stats.passes ?? "0 – 0"],
    ["Tackles", stats.tackles ?? "0 – 0"],
    ["Corners", stats.corners ?? "0 – 0"],
    ["Fouls", stats.fouls ?? "0 – 0"],
  ];

  return (
    <div className="match-ui-v2">
      <div className="scoreboard" aria-label="Match score">
        <div className="teams">
          <span>{homeName}</span>
          <span className="score">{homeScore} — {awayScore}</span>
          <span>{awayName}</span>
        </div>
        <div className="clock">{clock}{paused ? " • PAUSED" : ""}</div>
      </div>

      {panel && (
        <div className="panel">
          <h3>{panel === "stats" ? "Match Statistics" : panel}</h3>
          {panel === "stats" && (
            <div className="stats-grid">
              {statEntries.map(([k,v]) => <div className="stat" key={k}><strong>{k}</strong><div>{v}</div></div>)}
            </div>
          )}
          {panel !== "stats" && <div>Use the manager controls to apply this command to the live match.</div>}
        </div>
      )}

      <div className="match-dock">
        <button onClick={onPause}>{paused ? "Resume" : "Pause"}</button>
        <div className="speed">
          {[1,2,4,8].map(s => <button key={s} className={speed===s ? "active" : ""} onClick={() => onSpeed?.(s)}>{s}×</button>)}
        </div>
        <button onClick={() => setPanel(panel==="Tactics" ? null : "Tactics")} onDoubleClick={onTactics}>Tactics</button>
        <button onClick={onInstructions}>Instructions</button>
        <button onClick={onSubs}>Subs</button>
        <button onClick={() => setPanel(panel==="stats" ? null : "stats")}>Stats</button>
      </div>
    </div>
  );
}
