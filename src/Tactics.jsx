import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair, Sparkles, Target, Zap, Users, Search, Check, Play, RotateCcw,
  Save, ChevronDown, X, Timer, Maximize2, BarChart3, ClipboardList, Pause,
  Link2, Plus, Trash2, Bot, TriangleAlert, ShieldAlert, UserCheck, Settings,
  Pencil, Flag, Map, Gauge, Filter, ArrowRightLeft,
} from "lucide-react";
import { players as roster, roles, duties, compat, fitTier } from "./data/roster.js";
import { FORMATIONS, FORMATION_NAMES } from "./tactics/formations.js";
import {
  MENTALITIES, IN_POSSESSION, TRANSITION, OUT_OF_POSSESSION,
  PRESSING_TRIGGERS, PRESSING_ZONES, PRESSING_INITIATORS,
  PLAYER_INSTRUCTIONS, SITUATIONS,
} from "./tactics/instructions.js";
import { autoAssign, familiarity, assistantInsights } from "./tactics/logic.js";
import { useWorldData } from "./store/WorldContext.jsx";
import { useTacticsData } from "./store/TacticsContext.jsx";
import { mapRosterPlayer } from "./data/homeData.js";
import { usePlayerState } from "./store/PlayerStateContext.jsx";
import "./tactics.css";

const SQUARE_TYPES = ["Defensive Square", "Midfield Square", "Custom"];
const RELATIONS = ["Supports", "Covers", "Presses", "Holds Position", "Moves Into Zone", "Creates Overload"];
const TACTICAL_DELEGATION_LEVELS = ["Manual", "Assisted", "Automatic"];
const TABS = [
  ["Formation", Crosshair], ["Player & Roles", UserCheck], ["Team Instructions", Settings],
  ["Player Instructions", Pencil], ["Set Pieces", Flag], ["Match Plan", Map], ["Tactical Analysis", Gauge],
];
const DUTY_ABBR = { Attack: "At", Support: "Su", Defend: "De" };
const SLOT_BUCKET = { GK: "GK", DL: "DEF", DR: "DEF", DC: "DEF", DM: "MID", MC: "MID", AMC: "MID", AML: "ATT", AMR: "ATT", ST: "ATT" };
const BUCKET_ORDER = ["GK", "DEF", "MID", "ATT"];
const BUCKET_LABEL = { GK: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", ATT: "Attackers" };
const TEMPO_LABELS = ["Slow", "Normal", "Fast"];
const WIDTH_LABELS = ["Narrow", "Balanced", "Wide"];
const firstTeamPool = roster.filter(p => p.playTime !== "Youth");

function labelFromValue(v) { return v <= 33 ? 0 : v <= 66 ? 1 : 2; }
function valueFromLabelIndex(i) { return [20, 50, 85][i]; }

export default function TacticsScreen({ setActive, initialTab, embedded }) {
  const {
    formation, setFormation, assignment, setAssignment, roleAssignment, setRoleAssignment,
    dutyAssignment, setDutyAssignment, playerInstructions, setPlayerInstructions,
    squares, setSquares, teamInstructions, setTeamInstructions, pressing, setPressing,
    tacticalDelegation, setTacticalDelegation, appliedFixKeys, setAppliedFixKeys,
    autoLog, setAutoLog, presets, setPresets, situationPreset, setSituationPreset,
    setPieces, setSetPieces, startXI, slots,
  } = useTacticsData();
  const { mergePlayer } = usePlayerState();
  const [tab, setTab] = useState(initialTab || "Formation");
  const [tacticName, setTacticName] = useState("Main System");
  const [formationNotice, setFormationNotice] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [draggingSlotId, setDraggingSlotId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [saved, setSaved] = useState(false);
  const pitchRef = useRef(null);
  const { openProfileFor } = useWorldData();

  const isFirstRun = useRef(true);
  useEffect(() => {
    const next = autoAssign(slots, startXI);
    setAssignment(next);
    setOverrides({});
    const nextRoles = {}, nextDuties = {};
    let changedCount = 0;
    slots.forEach(slot => {
      const p = startXI.find(pl => pl.id === next[slot.id]);
      nextRoles[slot.id] = (roles[slot.code] || ["CM"])[0];
      if (p && (roles[slot.code] || []).includes(p.role)) nextRoles[slot.id] = p.role;
      else if (p) changedCount++;
      nextDuties[slot.id] = "Support";
    });
    setRoleAssignment(nextRoles);
    setDutyAssignment(nextDuties);
    if (!isFirstRun.current && changedCount > 0) {
      setFormationNotice(`Formation changed to ${formation} — ${changedCount} player${changedCount > 1 ? 's' : ''} had their role adjusted to fit the new shape. Compatible roles were preserved where possible.`);
    }
    isFirstRun.current = false;
    setSelectedSlotId(slots[0]?.id ?? null);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation]);

  function getPos(slot) { return overrides[slot.id] || { x: slot.x, y: slot.y }; }
  function playerFor(slot) { return firstTeamPool.find(p => p.id === assignment[slot.id]); }
  function swapSlots(a, b) { setAssignment(prev => ({ ...prev, [a]: prev[b], [b]: prev[a] })); }
  function selectSlot(slotId, e) {
    e?.preventDefault();
    if (selectedSlotId && selectedSlotId !== slotId && e?.shiftKey) swapSlots(selectedSlotId, slotId);
    setSelectedSlotId(slotId);
  }

  // Drag & drop: bench -> slot, slot -> slot (swap), slot -> bench (bench it)
  function dragBenchStart(e, playerId) { e.dataTransfer.setData("text/plain", `bench:${playerId}`); }
  function dragSlotStart(e, slotId) { e.dataTransfer.setData("text/plain", `slot:${slotId}`); }
  function allowDrop(e) { e.preventDefault(); }
  function dropOnSlot(e, targetSlotId) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("bench:")) {
      const playerId = Number(data.slice(6));
      setAssignment(prev => ({ ...prev, [targetSlotId]: playerId }));
    } else if (data.startsWith("slot:")) {
      swapSlots(data.slice(5), targetSlotId);
    }
    setSelectedSlotId(targetSlotId);
  }
  function dropOnBench(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("slot:")) {
      const fromSlotId = data.slice(5);
      setAssignment(prev => { const next = { ...prev }; delete next[fromSlotId]; return next; });
    }
  }
  function assignToBestSlot(player) {
    const bucket = player.bucket;
    const candidateSlots = slots.filter(s => SLOT_BUCKET[s.code] === bucket);
    if (!candidateSlots.length) return;
    const empty = candidateSlots.find(s => !assignment[s.id]);
    const target = empty || candidateSlots[0];
    setAssignment(prev => ({ ...prev, [target.id]: player.id }));
    setSelectedSlotId(target.id);
  }

  const selectedSlot = slots.find(s => s.id === selectedSlotId);
  const selectedPlayer = selectedSlot ? playerFor(selectedSlot) : null;

  function togglePlayerInstruction(slotId, item) {
    setPlayerInstructions(prev => {
      const cur = new Set(prev[slotId] || []);
      cur.has(item) ? cur.delete(item) : cur.add(item);
      return { ...prev, [slotId]: cur };
    });
  }
  function toggleTransition(key) { setTeamInstructions(ti => ({ ...ti, transition: { ...ti.transition, [key]: !ti.transition[key] } })); }
  function toggleOop(key) { setTeamInstructions(ti => ({ ...ti, [key]: !ti[key] })); }

  function applyFix(fix, key) {
    if (!fix) return;
    if (fix.field === "pressing.intensity") setPressing(p => ({ ...p, intensity: Math.max(0, Math.min(100, p.intensity + fix.delta)) }));
    else if (fix.field === "teamInstructions.defensiveLine") setTeamInstructions(ti => ({ ...ti, defensiveLine: Math.max(0, Math.min(100, ti.defensiveLine + fix.delta)) }));
    setAppliedFixKeys(s => new Set(s).add(key));
  }

  function addSquare(a, b, type, relation) {
    if (!a || !b || a === b) return;
    setSquares(s => [...s, { id: `sq${Date.now()}`, a, b, type, relation }]);
  }
  function removeSquare(id) { setSquares(s => s.filter(x => x.id !== id)); }

  function savePreset() {
    const name = window.prompt("Name this tactical preset:", tacticName || `${formation} preset`);
    if (!name) return;
    setPresets(p => [...p.filter(x => x.name !== name), { name, formation, teamInstructions, pressing }]);
    setSaved(true);
  }
  function loadPreset(name) {
    const preset = presets.find(p => p.name === name);
    if (!preset) return;
    setTacticName(preset.name);
    setTeamInstructions(preset.teamInstructions);
    setPressing(preset.pressing);
    if (preset.formation !== formation) setFormation(preset.formation);
  }
  function deletePreset(name) {
    setPresets(p => p.filter(x => x.name !== name));
    setSituationPreset(sp => { const next = { ...sp }; Object.keys(next).forEach(k => { if (next[k] === name) next[k] = null; }); return next; });
  }

  const fam = useMemo(() => familiarity({ formation, slots, assignment, roster: startXI, roleAssignment, squares }), [formation, slots, assignment, roleAssignment, squares]);
  const avgFit = Math.round(startXI.reduce((a, p) => a + p.fit, 0) / startXI.length);
  const insights = useMemo(() => assistantInsights({ roster: startXI, assignment, pressing, teamInstructions, avgFit }), [assignment, pressing, teamInstructions, avgFit]);

  const captain = [...firstTeamPool].filter(p => p.bucket !== "GK").sort((a, b) => b.ovr - a.ovr).find(p => p.playTime === "Key Player") || firstTeamPool[0];
  const benchPlayers = firstTeamPool.filter(p => !Object.values(assignment).includes(p.id)).map(mergePlayer);

  return <div className="tac-page">
    {!embedded && <div className="tac-head"><span className="tac-head-icon"><Crosshair size={22} color="#06210a" /></span><h1>TACTICS</h1></div>}
    {!embedded && <div className="tac-tabs">{TABS.map(([t, Icon]) => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}><Icon size={14} />{t}</button>)}</div>}

    {formationNotice && <div className="formation-notice">
      <TriangleAlert size={15} /><span>{formationNotice}</span>
      <button onClick={() => setFormationNotice(null)}><X size={14} /></button>
    </div>}

    {tab === "Formation" && <FormationTab
      formation={formation} setFormation={setFormation} tacticName={tacticName} setTacticName={setTacticName}
      onSave={savePreset} saved={saved} presets={presets} onLoad={loadPreset}
      teamInstructions={teamInstructions} setTeamInstructions={setTeamInstructions}
      slots={slots} getPos={getPos} playerFor={playerFor} selectedSlotId={selectedSlotId} onSelectSlot={selectSlot}
      dutyAssignment={dutyAssignment}
      fam={fam} captain={captain} pitchRef={pitchRef}
      dragBenchStart={dragBenchStart} dragSlotStart={dragSlotStart} allowDrop={allowDrop} dropOnSlot={dropOnSlot} dropOnBench={dropOnBench}
      benchPlayers={benchPlayers} assignToBestSlot={assignToBestSlot}
    />}

    {tab === "Player & Roles" && <div className="grid">
      <PlayerList slots={slots} assignment={assignment} playerFor={playerFor} selectedSlotId={selectedSlotId} setSelectedSlotId={setSelectedSlotId} />
      <RolePanel mode="roles" slot={selectedSlot} player={selectedPlayer} roleAssignment={roleAssignment} setRoleAssignment={setRoleAssignment}
        dutyAssignment={dutyAssignment} setDutyAssignment={setDutyAssignment}
        instructions={selectedSlot ? (playerInstructions[selectedSlot.id] || new Set()) : new Set()}
        toggleInstruction={item => selectedSlot && togglePlayerInstruction(selectedSlot.id, item)}
        onViewProfile={p => openProfileFor(mapRosterPlayer(p), 'Tactics')} goTo={setActive} />
      <SquareSystemForm slots={slots} playerFor={playerFor} onAdd={addSquare} squares={squares} onRemove={removeSquare} />
    </div>}

    {tab === "Team Instructions" && <TeamInstructionsPanel
      teamInstructions={teamInstructions} setTeamInstructions={setTeamInstructions}
      toggleTransition={toggleTransition} toggleOop={toggleOop} pressing={pressing} setPressing={setPressing}
    />}

    {tab === "Player Instructions" && <div className="grid">
      <PlayerList slots={slots} assignment={assignment} playerFor={playerFor} selectedSlotId={selectedSlotId} setSelectedSlotId={setSelectedSlotId} />
      <RolePanel mode="instructions" slot={selectedSlot} player={selectedPlayer} roleAssignment={roleAssignment} setRoleAssignment={setRoleAssignment}
        dutyAssignment={dutyAssignment} setDutyAssignment={setDutyAssignment}
        instructions={selectedSlot ? (playerInstructions[selectedSlot.id] || new Set()) : new Set()}
        toggleInstruction={item => selectedSlot && togglePlayerInstruction(selectedSlot.id, item)}
        onViewProfile={p => openProfileFor(mapRosterPlayer(p), 'Tactics')} goTo={setActive} />
    </div>}

    {tab === "Set Pieces" && <SetPiecesPanel startXI={firstTeamPool.filter(p => Object.values(assignment).includes(p.id))} setPieces={setPieces} setSetPieces={setSetPieces} />}

    {tab === "Match Plan" && <MatchPlanTab
      presets={presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset}
      situationPreset={situationPreset} setSituationPreset={setSituationPreset}
      formation={formation} activePreset={presets.find(p => p.formation === formation)?.name}
    />}

    {tab === "Tactical Analysis" && <AnalysisPanel
      fam={fam} tacticalDelegation={tacticalDelegation} setTacticalDelegation={setTacticalDelegation}
      insights={insights} applyFix={applyFix} appliedFixKeys={appliedFixKeys} autoLog={autoLog}
    />}
  </div>;
}

// ================= FORMATION TAB (matches approved design) =================

function TeamShapeMini({ tone, spread }) {
  // Small decorative dot-formation preview — green (fluid, in possession)
  // or purple (compact, out of possession).
  const dots = [[50, 12], [22, 30], [78, 30], [38, 46], [62, 46], [50, 32], [15, 62], [40, 66], [60, 66], [85, 62], [50, 84]];
  return <svg viewBox="0 0 100 100" className="shape-mini">
    {dots.map(([x, y], i) => {
      const cx = 50 + (x - 50) * spread, cy = y;
      return <circle key={i} cx={cx} cy={cy} r={4} fill={tone} />;
    })}
  </svg>;
}

function FormationTab({
  formation, setFormation, tacticName, setTacticName, onSave, saved, presets, onLoad,
  teamInstructions, setTeamInstructions, slots, getPos, playerFor, selectedSlotId, onSelectSlot, dutyAssignment,
  fam, captain, pitchRef, dragBenchStart, dragSlotStart, allowDrop, dropOnSlot, dropOnBench,
  benchPlayers, assignToBestSlot,
}) {
  const [shapeIn, setShapeIn] = useState("Fluid");
  const [shapeOut, setShapeOut] = useState("Compact");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [bucketFilter, setBucketFilter] = useState("All");
  const [collapsed, setCollapsed] = useState({});

  const tempoIdx = labelFromValue(teamInstructions.tempo);
  const widthIdx = labelFromValue(teamInstructions.width);

  const filteredBench = benchPlayers.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) && (bucketFilter === "All" || p.bucket === bucketFilter)
  );
  const grouped = BUCKET_ORDER.map(b => ({ bucket: b, rows: filteredBench.filter(p => p.bucket === b) })).filter(g => g.rows.length);

  const subs = [...benchPlayers].sort((a, b) => b.ovr - a.ovr).slice(0, 5);

  return <>
    <div className="tac-toolbar">
      <label className="tac-field"><span>Formation</span>
        <select value={formation} onChange={e => setFormation(e.target.value)}>{FORMATION_NAMES.map(x => <option key={x}>{x}</option>)}</select>
      </label>
      <label className="tac-field grow"><span>Tactic Name</span>
        <div className="tac-name-input"><input value={tacticName} onChange={e => setTacticName(e.target.value)} /><Pencil size={13} /></div>
      </label>
      <button className="tac-btn" onClick={onSave}><Save size={14} />{saved ? "Saved" : "Save Tactic"}</button>
      <div className="tac-btn dropdown-btn"><ArrowRightLeft size={14} />Load Tactic<ChevronDown size={13} />
        <select value="" onChange={e => e.target.value && onLoad(e.target.value)}>
          <option value="">— Choose a saved tactic —</option>
          {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <button className="tac-btn primary" onClick={() => setFormation(formation)}><Plus size={14} />Create New</button>
    </div>

    <div className="tac-grid">
      <div className="tac-left">
        <section className="panel">
          <h3><Users size={15} /> Team Shape</h3>
          <div className="shape-row">
            <div className="shape-col">
              <span className="shape-label">In Possession</span>
              <div className="shape-box"><TeamShapeMini tone="#68ff2e" spread={shapeIn === "Fluid" ? 1.15 : 0.85} /></div>
              <button className="shape-toggle" onClick={() => setShapeIn(s => s === "Fluid" ? "Structured" : "Fluid")}>{shapeIn}</button>
            </div>
            <div className="shape-col">
              <span className="shape-label">Out of Possession</span>
              <div className="shape-box out"><TeamShapeMini tone="#8a6bff" spread={shapeOut === "Compact" ? 0.7 : 1} /></div>
              <button className="shape-toggle" onClick={() => setShapeOut(s => s === "Compact" ? "Aggressive" : "Compact")}>{shapeOut}</button>
            </div>
          </div>
        </section>

        <section className="panel">
          <h3><Settings size={15} /> Quick Settings</h3>
          <label className="select-row">Mentality<select value={teamInstructions.mentality} onChange={e => setTeamInstructions(ti => ({ ...ti, mentality: e.target.value }))}>{MENTALITIES.map(m => <option key={m}>{m}</option>)}</select></label>
          <label className="select-row">Style of Play<select value={teamInstructions.passingStyle} onChange={e => setTeamInstructions(ti => ({ ...ti, passingStyle: e.target.value }))}>{IN_POSSESSION.selects[0].options.map(o => <option key={o}>{o}</option>)}</select></label>
          <label className="select-row">Tempo<select value={tempoIdx} onChange={e => setTeamInstructions(ti => ({ ...ti, tempo: valueFromLabelIndex(Number(e.target.value)) }))}>{TEMPO_LABELS.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></label>
          <label className="select-row">Width<select value={widthIdx} onChange={e => setTeamInstructions(ti => ({ ...ti, width: valueFromLabelIndex(Number(e.target.value)) }))}>{WIDTH_LABELS.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></label>
        </section>

        <section className="panel">
          <h3><Target size={15} /> Player Roles</h3>
          <div className="roles-legend"><span className="dotlg green" />Natural Position</div>
          <div className="roles-legend"><span className="dotlg red" />Untrained Position</div>
        </section>
      </div>

      <div className="tac-center">
        <div className="tac-pitch">
          <div className="tac-pitch-head">
            <span>{formation}</span>
            <button className="tac-arrow"><ChevronDown size={15} style={{ transform: "rotate(-90deg)" }} /></button>
            <div className="tac-fam"><span>Tactical Familiarity</span>
              <div className="tac-fam-bar"><i style={{ width: fam.overall + "%" }} /></div>
              <b>{fam.overall}%</b>
            </div>
          </div>
          <div className="tac-pitch-grass" ref={pitchRef} onDragOver={allowDrop} onDrop={dropOnBench}>
            <div className="half" /><div className="center-circle" /><div className="box top" /><div className="box bottom" />
            {slots.map(slot => {
              const p = playerFor(slot);
              const pos = getPos(slot);
              const score = p ? compat(p.pos, slot.code) : 0;
              const tier = fitTier(score);
              const dotColor = tier === "natural" ? "#68ff2e" : "#ef4f4f";
              const duty = DUTY_ABBR[dutyAssignment[slot.id]] || "Su";
              return <div key={slot.id}
                className={`tac-token ${selectedSlotId === slot.id ? "selected" : ""}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                draggable={!!p}
                onDragStart={e => dragSlotStart(e, slot.id)}
                onDragOver={allowDrop}
                onDrop={e => dropOnSlot(e, slot.id)}
                onClick={() => onSelectSlot(slot.id)}
                title={`${p?.name || "Empty"} — ${slot.label}`}>
                <span className="tac-fit-dot" style={{ background: dotColor }} />
                {p && <b className="tac-ovr">{p.ovr}</b>}
                <span className="tac-avatar">{p ? p.name.split(" ").map(w => w[0]).join("").slice(0, 2) : "—"}</span>
                <strong>{p ? p.name.split(" ").slice(-1)[0] : "Empty"}</strong>
                {p && <small className="tac-duty">{slot.label} | {duty}</small>}
                {p && captain && p.id === captain.id && <em className="tac-captain">C</em>}
              </div>;
            })}
          </div>
        </div>

        <div className="subs-bar">
          <div className="subs-head"><span>Substitutes ({subs.length}/{subs.length})</span></div>
          <div className="subs-row">
            {subs.map(p => <div className="sub-chip" key={p.id} draggable onDragStart={e => dragBenchStart(e, p.id)}>
              <span className="tac-avatar small">{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
              <div><b>{p.name.split(" ").slice(-1)[0]}</b><small>{p.displayPos}</small></div>
              <em className="badge ovr">{p.ovr}</em>
            </div>)}
            {subs.length === 0 && <p className="muted-sub">No players available on the bench.</p>}
          </div>
        </div>
      </div>

      <div className="tac-right">
        <div className="avail-head"><h3>Available Players</h3><button className="filter-btn" onClick={() => setFilterOpen(f => !f)}><Filter size={13} />Filter</button></div>
        {filterOpen && <div className="filter-pills">
          {["All", "GK", "DEF", "MID", "ATT"].map(b => <button key={b} className={bucketFilter === b ? "active" : ""} onClick={() => setBucketFilter(b)}>{b === "All" ? "All" : BUCKET_LABEL[b]}</button>)}
        </div>}
        <div className="avail-search"><Search size={14} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search players..." /></div>
        <div className="avail-list" onDragOver={allowDrop} onDrop={dropOnBench}>
          {grouped.map(g => <div key={g.bucket} className="avail-group">
            <button className="avail-group-head" onClick={() => setCollapsed(c => ({ ...c, [g.bucket]: !c[g.bucket] }))}>
              <span>{BUCKET_LABEL[g.bucket]} ({g.rows.length})</span>
              <ChevronDown size={14} style={{ transform: collapsed[g.bucket] ? "rotate(-90deg)" : "none" }} />
            </button>
            {!collapsed[g.bucket] && g.rows.map(p => <div className={`avail-row${p.isAvailable === false ? ' unavailable' : ''}`} key={p.id} draggable={p.isAvailable !== false} onDragStart={e => p.isAvailable !== false && dragBenchStart(e, p.id)} title={p.injury ? `Injured — ${p.injury.type} (back ${p.injury.expectedReturn})` : p.suspension ? `Suspended — ${p.suspension.reason}` : ''}>
              <span className="tac-avatar small">{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
              <span className={`dotlg tiny ${p.isAvailable === false ? 'red' : 'green'}`} />
              <b className="avail-name">{p.name}</b>
              <span className="avail-pos">{p.displayPos}</span>
              {p.injury ? <em className="avail-flag injured">INJ</em> : p.suspension ? <em className="avail-flag suspended">SUS</em> : <em className="badge ovr">{p.ovr}</em>}
              <button className="avail-add" disabled={p.isAvailable === false} onClick={() => p.isAvailable !== false && assignToBestSlot(p)}><Plus size={13} /></button>
            </div>)}
          </div>)}
          {grouped.length === 0 && <p className="muted-sub" style={{ padding: 10 }}>No players match this search.</p>}
        </div>
      </div>
    </div>

    <div className="dnd-help panel">
      <div className="dnd-help-icon"><ArrowRightLeft size={18} /></div>
      <div><b>Drag & Drop</b><span>Drag a player from the right panel onto the pitch to replace a starter or into a position.</span></div>
    </div>
  </>;
}

// ================= PLAYER & ROLES / PLAYER INSTRUCTIONS =================

function PlayerList({ slots, assignment, playerFor, selectedSlotId, setSelectedSlotId }) {
  const [filter, setFilter] = useState("All Positions");
  const filtered = useMemo(() => filter === "All Positions" ? firstTeamPool : firstTeamPool.filter(p => p.pos === filter), [filter]);
  return <section className="panel available">
    <div className="panel-head"><h3><Users /> Squad</h3>
      <div><select value={filter} onChange={e => setFilter(e.target.value)}><option>All Positions</option>{["GK", "DR", "DL", "DC", "DM", "MC", "AMC", "AML", "AMR", "ST"].map(x => <option key={x}>{x}</option>)}</select><Search size={17} /></div>
    </div>
    <div className="table head"><span>Pos</span><span>Player</span><span>Slot</span><span>Nat</span><span>Fit</span><span>Av R</span></div>
    {filtered.map(p => {
      const slot = slots.find(s => assignment[s.id] === p.id);
      return <button className={`player-row ${selectedSlotId === slot?.id ? "row-selected" : ""}`} key={p.id}
        onClick={() => slot && setSelectedSlotId(slot.id)}>
        <span>{p.pos}</span><strong>{p.name}</strong><span className="role-tag">{slot ? slot.label : "Bench"}</span>
        <span>{p.nat}</span><span className="cyan">{p.fit}%</span><span className="rate">{p.rate.toFixed(1)}</span>
      </button>;
    })}
  </section>;
}

function RolePanel({ mode, slot, player, roleAssignment, setRoleAssignment, dutyAssignment, setDutyAssignment, instructions, toggleInstruction, onViewProfile, goTo }) {
  const roleOptions = roles[slot?.code] || ["CM"];
  const role = slot ? (roleAssignment[slot.id] || roleOptions[0]) : "";
  const duty = slot ? (dutyAssignment[slot.id] || "Support") : "";
  const score = player && slot ? compat(player.pos, slot.code) : 0;
  const tier = fitTier(score);

  if (mode === "instructions") {
    return <section className="panel role-panel">
      <div className="role-top">
        <div className="face">{player?.name?.split(" ").map(x => x[0]).join("").slice(0, 2)}</div>
        <div><h3>{player?.name || "Select a player"}</h3><b className={`fit-label fit-${tier}`}>{slot?.label} · {role} ({duty})</b></div>
      </div>
      <p className="role-desc">Overrides to the team's normal instructions for this player specifically. The Match Engine reads these directly.</p>
      <div className="role-body">
        <div><h4>Player Instructions</h4>{PLAYER_INSTRUCTIONS.map(x => <div className={`check ${instructions.has(x) ? "on" : ""}`} key={x} onClick={() => toggleInstruction(x)}><Check size={15} />{x}<span>{instructions.has(x) ? "✓" : ""}</span></div>)}</div>
        <div><h4>Fine Tuning</h4>
          <label>Focus <input type="range" defaultValue="65" /></label>
          <label>Freedom <input type="range" defaultValue="55" /></label>
          <label>Movement <input type="range" defaultValue="60" /></label>
        </div>
      </div>
    </section>;
  }

  return <section className="panel role-panel">
    <div className="role-top">
      <div className="face">{player?.name?.split(" ").map(x => x[0]).join("").slice(0, 2)}</div>
      <div><h3>{player?.name || "Select a player"}</h3><b className={`fit-label fit-${tier}`}>{slot?.label} · {tier === "natural" ? "Natural Fit" : tier === "playable" ? "Playable" : "Unfamiliar"}</b></div>
      <label>Role<select value={role} onChange={e => slot && setRoleAssignment(r => ({ ...r, [slot.id]: e.target.value }))}>{roleOptions.map(r => <option key={r}>{r}</option>)}</select></label>
      <label>Duty<select value={duty} onChange={e => slot && setDutyAssignment(d => ({ ...d, [slot.id]: e.target.value }))}>{duties.map(d => <option key={d}>{d}</option>)}</select></label>
    </div>
    <p className="role-desc">{role} · {duty} — position → role → duty → instructions configured below override team instructions where relevant.</p>
    {player && <div className="role-links">
      <button className="link-chip" onClick={() => onViewProfile?.(player)}><Users size={13} /> View Player Profile</button>
      <button className="link-chip" onClick={() => goTo?.("Training")}><Timer size={13} /> Train This System</button>
      <button className="link-chip" onClick={() => goTo?.("Scouting")}><Search size={13} /> Scout For This Role</button>
    </div>}
  </section>;
}

function Slider({ label, value, onChange, low, high }) {
  return <label className="slider-row">
    <span>{label}<b>{value}%</b></span>
    <input type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))} />
    <div className="slider-ends"><small>{low}</small><small>{high}</small></div>
  </label>;
}
function ToggleChip({ label, active, onClick }) {
  return <button className={`chip ${active ? "chip-on" : ""}`} onClick={onClick}>{active && <Check size={12} />} {label}</button>;
}

export function TeamInstructionsPanel({ teamInstructions: ti, setTeamInstructions: setTi, toggleTransition, toggleOop, pressing, setPressing }) {
  return <div className="ti-grid">
    <section className="panel">
      <h3><Target /> Mentality</h3>
      <select value={ti.mentality} onChange={e => setTi(t => ({ ...t, mentality: e.target.value }))}>{MENTALITIES.map(m => <option key={m}>{m}</option>)}</select>
    </section>
    <section className="panel">
      <h3><Zap /> In Possession</h3>
      {IN_POSSESSION.sliders.map(s => <Slider key={s.key} label={s.label} low={s.low} high={s.high} value={ti[s.key]} onChange={v => setTi(t => ({ ...t, [s.key]: v }))} />)}
      {IN_POSSESSION.selects.map(s => <label className="select-row" key={s.key}>{s.label}<select value={ti[s.key]} onChange={e => setTi(t => ({ ...t, [s.key]: e.target.value }))}>{s.options.map(o => <option key={o}>{o}</option>)}</select></label>)}
    </section>
    <section className="panel">
      <h3><Zap /> In Transition</h3>
      <div className="chip-row">{TRANSITION.map(t => <ToggleChip key={t.key} label={t.label} active={ti.transition[t.key]} onClick={() => toggleTransition(t.key)} />)}</div>
    </section>
    <section className="panel">
      <h3><Zap /> Out Of Possession</h3>
      {OUT_OF_POSSESSION.sliders.map(s => <Slider key={s.key} label={s.label} low={s.low} high={s.high} value={ti[s.key]} onChange={v => setTi(t => ({ ...t, [s.key]: v }))} />)}
      {OUT_OF_POSSESSION.selects.map(s => <label className="select-row" key={s.key}>{s.label}<select value={ti[s.key]} onChange={e => setTi(t => ({ ...t, [s.key]: e.target.value }))}>{s.options.map(o => <option key={o}>{o}</option>)}</select></label>)}
      <div className="chip-row">{OUT_OF_POSSESSION.toggles.map(t => <ToggleChip key={t.key} label={t.label} active={ti[t.key]} onClick={() => toggleOop(t.key)} />)}</div>
    </section>
    <section className="panel">
      <h3><Crosshair /> Pressing System</h3>
      <label className="select-row">Pressing Trigger<select value={pressing.trigger} onChange={e => setPressing(p => ({ ...p, trigger: e.target.value }))}>{PRESSING_TRIGGERS.map(o => <option key={o}>{o}</option>)}</select></label>
      <Slider label="Pressing Intensity" low="Cautious" high="Aggressive" value={pressing.intensity} onChange={v => setPressing(p => ({ ...p, intensity: v }))} />
      <Slider label="Defensive Compactness" low="Loose" high="Compact" value={pressing.compactness} onChange={v => setPressing(p => ({ ...p, compactness: v }))} />
      <label className="select-row">Pressing Zone<select value={pressing.zone} onChange={e => setPressing(p => ({ ...p, zone: e.target.value }))}>{PRESSING_ZONES.map(o => <option key={o}>{o}</option>)}</select></label>
      <label className="select-row">Who Initiates<select value={pressing.initiator} onChange={e => setPressing(p => ({ ...p, initiator: e.target.value }))}>{PRESSING_INITIATORS.map(o => <option key={o}>{o}</option>)}</select></label>
    </section>
  </div>;
}

export function SquareSystemForm({ slots, playerFor, onAdd, squares, onRemove }) {
  const [a, setA] = useState(slots[1]?.id || "");
  const [b, setB] = useState(slots[2]?.id || "");
  const [type, setType] = useState(SQUARE_TYPES[0]);
  const [relation, setRelation] = useState(RELATIONS[0]);
  return <div className="left-controls">
    <section className="panel">
      <h3><Link2 /> New Relationship</h3>
      <label className="select-row">Player A<select value={a} onChange={e => setA(e.target.value)}>{slots.map(s => <option key={s.id} value={s.id}>{s.label} — {playerFor(s)?.name || "Empty"}</option>)}</select></label>
      <label className="select-row">Player B<select value={b} onChange={e => setB(e.target.value)}>{slots.map(s => <option key={s.id} value={s.id}>{s.label} — {playerFor(s)?.name || "Empty"}</option>)}</select></label>
      <label className="select-row">Type<select value={type} onChange={e => setType(e.target.value)}>{SQUARE_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="select-row">Relationship<select value={relation} onChange={e => setRelation(e.target.value)}>{RELATIONS.map(r => <option key={r}>{r}</option>)}</select></label>
      <button className="green-btn" style={{ marginTop: 10, width: "100%", justifyContent: "center" }} onClick={() => onAdd(a, b, type, relation)}><Plus size={16} /> Add Relationship</button>
    </section>
    <section className="panel">
      <h3><Link2 /> Active Squares</h3>
      {squares.length === 0 && <p>No relationships defined yet.</p>}
      {squares.map(sq => <div key={sq.id} className="square-row">
        <div><b>{sq.type}</b><span>{playerFor(slots.find(s => s.id === sq.a))?.name} ↔ {playerFor(slots.find(s => s.id === sq.b))?.name}</span><small className="lime">{sq.relation}</small></div>
        <button onClick={() => onRemove(sq.id)}><Trash2 size={15} /></button>
      </div>)}
    </section>
  </div>;
}

// ================= MATCH PLAN =================

function MatchPlanTab({ presets, onSave, onLoad, onDelete, situationPreset, setSituationPreset, formation, activePreset }) {
  return <div className="ti-grid">
    <section className="panel">
      <h3><Save /> Tactical Presets</h3>
      <p>Save the current formation + team instructions as a reusable preset, then assign presets to match situations below.</p>
      <button className="green-btn" onClick={onSave}><Plus size={16} /> Save Current As Preset</button>
      <div className="preset-list">
        {presets.map(p => <div key={p.name} className="square-row">
          <div><b>{p.name}</b><span>{p.formation}</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onLoad(p.name)}>Load</button>
            <button onClick={() => onDelete(p.name)}><Trash2 size={15} /></button>
          </div>
        </div>)}
        {presets.length === 0 && <p className="muted-sub">No presets saved yet.</p>}
      </div>
    </section>
    <section className="panel">
      <h3><Target /> Situational Triggers</h3>
      <p className="muted-sub">Assign a saved preset to switch to automatically when a situation is met — e.g. protecting a lead late on, or chasing a goal.</p>
      {SITUATIONS.map(sit => <label className="select-row" key={sit}>{sit}
        <select value={situationPreset[sit] || ""} onChange={e => setSituationPreset(sp => ({ ...sp, [sit]: e.target.value || null }))}>
          <option value="">— None —</option>
          {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </label>)}
      <p>Currently editing: <b className="lime">{formation}</b>{activePreset ? ` (matches preset "${activePreset}")` : ""}</p>
    </section>
  </div>;
}

// ================= SET PIECES =================

const SET_PIECE_ROLES = [
  ['cornerTaker', 'Corner Taker'], ['freeKickTaker', 'Free Kick Taker'],
  ['penaltyTaker', 'Penalty Taker'], ['backupPenaltyTaker', 'Backup Penalty Taker'],
];
const CORNER_TYPES = ['Near Post', 'Far Post', 'Short Corner', 'Target Player'];
const FREEKICK_TYPES = ['Direct', 'Cross', 'Short Routine'];
const DEFENSIVE_CORNER_TYPES = ['Zonal', 'Man Marking', 'Mixed'];
const THROW_IN_STYLES = ['Short', 'Long'];

export function SetPiecesPanel({ startXI, setPieces, setSetPieces }) {
  const set = (k, v) => setSetPieces(sp => ({ ...sp, [k]: v }));
  return <div className="ti-grid">
    <section className="panel">
      <h3><Target /> Attacking Set Pieces</h3>
      {SET_PIECE_ROLES.map(([key, label]) => {
        const currentId = setPieces[key];
        const stillInSquad = currentId && startXI.some(p => p.id === currentId);
        return <div key={key}>
          <label className="select-row">{label}
            <select value={currentId || ""} onChange={e => set(key, e.target.value ? Number(e.target.value) : null)}>
              <option value="">— None Assigned —</option>
              {startXI.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          {currentId && !stillInSquad && <p className="set-piece-warning"><TriangleAlert size={13} /> Set-piece assignment unavailable — new {label.toLowerCase()} required.</p>}
        </div>;
      })}
      <label className="select-row">Corner Type<select value={setPieces.cornerType} onChange={e => set('cornerType', e.target.value)}>{CORNER_TYPES.map(o => <option key={o}>{o}</option>)}</select></label>
      <label className="select-row">Free Kick Type<select value={setPieces.freeKickType} onChange={e => set('freeKickType', e.target.value)}>{FREEKICK_TYPES.map(o => <option key={o}>{o}</option>)}</select></label>
      <label className="select-row">Throw-In Style<select value={setPieces.throwInStyle} onChange={e => set('throwInStyle', e.target.value)}>{THROW_IN_STYLES.map(o => <option key={o}>{o}</option>)}</select></label>
    </section>
    <section className="panel">
      <h3><ShieldAlert /> Defensive Set Pieces</h3>
      <label className="select-row">Defensive Corners<select value={setPieces.defensiveCorner} onChange={e => set('defensiveCorner', e.target.value)}>{DEFENSIVE_CORNER_TYPES.map(o => <option key={o}>{o}</option>)}</select></label>
      <p>Choose how the team defends corners and free kicks. Zonal marking covers areas of the box; man marking assigns a defender to a specific attacker; mixed combines both.</p>
    </section>
  </div>;
}

// ================= TACTICAL ANALYSIS =================

export function AnalysisPanel({ fam, tacticalDelegation, setTacticalDelegation, insights, applyFix, appliedFixKeys, autoLog }) {
  return <div className="ti-grid">
    <section className="panel">
      <h3><BarChart3 /> Tactical Familiarity</h3>
      <div className="fam-overall"><div className="fam-bar-track"><div className="fam-bar-fill" style={{ width: `${fam.overall}%` }} /></div><b>{fam.overall}%</b></div>
      {fam.breakdown.map(b => <div className="fam-row" key={b.label}>
        <span>{b.label}</span>
        <div className="fam-bar-track small"><div className="fam-bar-fill" style={{ width: `${b.value}%` }} /></div>
        <b>{b.value}%</b>
      </div>)}
    </section>
    <section className="panel">
      <h3><Gauge /> Tactical Problems</h3>
      <div className="problem-row"><span className="dotlg red tiny" /> Right side exposed on the counter — RB pushed high with no cover.</div>
      <div className="problem-row"><span className="dotlg yellow tiny" /> Midfield can get overloaded against a back three.</div>
      <div className="problem-row"><span className="dotlg green tiny" /> Left-wing combinations working well — high chance-creation zone.</div>
    </section>
    <section className="panel">
      <h3><Bot /> Assistant Manager — Tactical Delegation</h3>
      <div className="deleg-switch" style={{ marginBottom: 10 }}>
        {TACTICAL_DELEGATION_LEVELS.map(lvl => <button key={lvl} className={tacticalDelegation === lvl ? "active" : ""} onClick={() => setTacticalDelegation(lvl)}>{lvl}</button>)}
      </div>
      <p className="muted-sub">
        {tacticalDelegation === "Manual" && "You make every tactical decision — insights below are informational only."}
        {tacticalDelegation === "Assisted" && "The assistant recommends changes — click Apply on any insight to accept it."}
        {tacticalDelegation === "Automatic" && "The assistant applies fixable insights on its own during a match."}
      </p>
      <div className="insight-list">
        {insights.map((ins, i) => <div className="insight" key={i}>
          <TriangleAlert size={15} /><span>{ins.text}</span>
          {tacticalDelegation === "Assisted" && ins.fix && !appliedFixKeys.has(ins.text) && <button className="apply-btn" onClick={() => applyFix(ins.fix, ins.text)}>Apply</button>}
          {ins.fix && appliedFixKeys.has(ins.text) && <span className="applied-tag"><Check size={12} /> Applied</span>}
        </div>)}
      </div>
      {autoLog.length > 0 && <>
        <h4 style={{ marginTop: 12 }}>Auto-Adjustments Log</h4>
        <div className="insight-list">{autoLog.map((l, i) => <div className="insight applied" key={i}><Check size={14} /><span>{l.text}</span></div>)}</div>
      </>}
    </section>
  </div>;
}
