import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair, Sparkles, Target, Zap, Users, Search, Check, Play, RotateCcw,
  Save, ChevronDown, X, Timer, Maximize2, BarChart3, ClipboardList, Pause,
  Link2, Plus, Trash2, Bot, TriangleAlert, ShieldAlert
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
import "./tactics.css";

const SUBTABS = ["Formation", "Players & Roles", "Team Instructions", "Set Pieces", "Opposition"];
const SQUARE_TYPES = ["Defensive Square", "Midfield Square", "Custom"];
const RELATIONS = ["Supports", "Covers", "Presses", "Holds Position", "Moves Into Zone", "Creates Overload"];
const TACTICAL_DELEGATION_LEVELS = ["Manual", "Assisted", "Automatic"];


export default function TacticsScreen({ setActive }) {
  const {
    formation, setFormation, assignment, setAssignment, roleAssignment, setRoleAssignment,
    dutyAssignment, setDutyAssignment, playerInstructions, setPlayerInstructions,
    squares, setSquares, teamInstructions, setTeamInstructions, pressing, setPressing,
    tacticalDelegation, setTacticalDelegation, appliedFixKeys, setAppliedFixKeys,
    autoLog, setAutoLog, presets, setPresets, situationPreset, setSituationPreset,
    setPieces, setSetPieces, oppositionInstructions, setOppositionInstructions,
    startXI, slots,
  } = useTacticsData();
  const [subtab, setSubtab] = useState("Formation");
  const [formationNotice, setFormationNotice] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [draggingSlotId, setDraggingSlotId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [sim, setSim] = useState(0);
  const [paused, setPaused] = useState(false);
  const pitchRef = useRef(null);
  const { openProfileFor } = useWorldData();

  // Re-run auto-assignment (and reset manual drag offsets/role picks) whenever
  // the formation changes, so selecting a formation "immediately arranges the
  // players into the appropriate positions" per spec. Also flags players
  // whose natural role didn't carry over to the new shape.
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

  useEffect(() => {
    if (!sim || paused) return;
    const id = setInterval(() => setSim(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [sim, paused]);

  // Drag-and-drop for player tokens on the pitch.
  useEffect(() => {
    if (!draggingSlotId) return;
    function move(e) {
      const rect = pitchRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      let x = ((cx - rect.left) / rect.width) * 100;
      let y = ((cy - rect.top) / rect.height) * 100;
      x = Math.max(3, Math.min(97, x));
      y = Math.max(3, Math.min(97, y));
      setOverrides(o => ({ ...o, [draggingSlotId]: { x, y } }));
    }
    function up() { setDraggingSlotId(null); }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [draggingSlotId]);

  function getPos(slot) { return overrides[slot.id] || { x: slot.x, y: slot.y }; }
  function playerFor(slot) { return startXI.find(p => p.id === assignment[slot.id]); }
  function swapSlots(a, b) {
    setAssignment(prev => ({ ...prev, [a]: prev[b], [b]: prev[a] }));
  }
  function selectSlot(slotId, e) {
    e?.preventDefault();
    if (selectedSlotId && selectedSlotId !== slotId && e?.shiftKey) {
      swapSlots(selectedSlotId, slotId);
    }
    setSelectedSlotId(slotId);
    setDraggingSlotId(slotId);
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
  function toggleTransition(key) {
    setTeamInstructions(ti => ({ ...ti, transition: { ...ti.transition, [key]: !ti.transition[key] } }));
  }
  function toggleOop(key) {
    setTeamInstructions(ti => ({ ...ti, [key]: !ti[key] }));
  }

  // Assistant Manager: apply a single insight's suggested fix to the live
  // tactic. Used directly (Assisted, via a click) and automatically
  // (Automatic, while a "match" is running).
  function applyFix(fix, key) {
    if (!fix) return;
    if (fix.field === "pressing.intensity") {
      setPressing(p => ({ ...p, intensity: Math.max(0, Math.min(100, p.intensity + fix.delta)) }));
    } else if (fix.field === "teamInstructions.defensiveLine") {
      setTeamInstructions(ti => ({ ...ti, defensiveLine: Math.max(0, Math.min(100, ti.defensiveLine + fix.delta)) }));
    }
    setAppliedFixKeys(s => new Set(s).add(key));
  }

  function addSquare(a, b, type, relation) {
    if (!a || !b || a === b) return;
    setSquares(s => [...s, { id: `sq${Date.now()}`, a, b, type, relation }]);
  }
  function removeSquare(id) { setSquares(s => s.filter(x => x.id !== id)); }

  function savePreset() {
    const name = window.prompt("Name this tactical preset:", `${formation} preset`);
    if (!name) return;
    setPresets(p => [...p.filter(x => x.name !== name), { name, formation, teamInstructions, pressing }]);
  }
  function loadPreset(name) {
    const preset = presets.find(p => p.name === name);
    if (!preset) return;
    setTeamInstructions(preset.teamInstructions);
    setPressing(preset.pressing);
    if (preset.formation !== formation) setFormation(preset.formation);
  }
  function deletePreset(name) {
    setPresets(p => p.filter(x => x.name !== name));
    setSituationPreset(sp => {
      const next = { ...sp };
      Object.keys(next).forEach(k => { if (next[k] === name) next[k] = null; });
      return next;
    });
  }

  const fam = useMemo(() => familiarity({
    formation, slots, assignment, roster: startXI, roleAssignment, squares,
  }), [formation, slots, assignment, roleAssignment, squares]);

  const avgFit = Math.round(startXI.reduce((a, p) => a + p.fit, 0) / startXI.length);
  const insights = useMemo(() => assistantInsights({
    roster: startXI, assignment, pressing, teamInstructions: { ...teamInstructions, mentality: teamInstructions.mentality }, avgFit,
  }), [assignment, pressing, teamInstructions, avgFit]);

  // Automatic tactical delegation: while a "match" is running (sim ticking,
  // not paused), periodically auto-apply the first not-yet-applied fixable
  // insight and log it, simulating the assistant reacting in real time.
  useEffect(() => {
    if (tacticalDelegation !== "Automatic" || !sim || paused) return;
    const pending = insights.find(ins => ins.fix && !appliedFixKeys.has(ins.text));
    if (!pending) return;
    const id = setTimeout(() => {
      applyFix(pending.fix, pending.text);
      setAutoLog(log => [{ time: sim, text: `${pending.fix.label} — ${pending.text}` }, ...log].slice(0, 8));
    }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tacticalDelegation, sim, paused, insights]);

  return <>
    <div className="tabs">
      <button className="active">Tactics</button>
      <button onClick={() => setSubtab("Formation")}>Formation</button>
      <button onClick={() => setSubtab("Players & Roles")}>Player Instructions</button>
      <button onClick={() => setSubtab("Set Pieces")}>Set Pieces</button>
      <button onClick={() => setSubtab("Opposition")}>Opposition Instructions</button>
    </div>

    <div className="workspace-head">
      <div className="formation-select">
        <Crosshair /><b>Square System {formation}</b><ChevronDown size={17} />
        {Object.keys(overrides).length > 0 && <span className="custom-pill">Custom positions</span>}
      </div>
      <button className="green-btn" onClick={() => setSaved(true)}>
        <Save size={16} /> {saved ? "Saved" : "Save Tactic"}
      </button>
      <div className="subtabs">
        {SUBTABS.map(t => <button key={t} className={subtab === t ? "active" : ""} onClick={() => setSubtab(t)}>{t}</button>)}
      </div>
    </div>

    {formationNotice && <div className="formation-notice">
      <TriangleAlert size={15} /><span>{formationNotice}</span>
      <button onClick={() => setFormationNotice(null)}><X size={14} /></button>
    </div>}

    {subtab === "Formation" && <div className="grid">
      <OverviewControls formation={formation} setFormation={setFormation} teamInstructions={teamInstructions} setTeamInstructions={setTeamInstructions} />
      <PitchView
        formation={formation} slots={slots} pitchRef={pitchRef} getPos={getPos}
        playerFor={playerFor} selectedSlotId={selectedSlotId} onSelect={selectSlot} squares={squares}
      />
      <PresetsPanel
        presets={presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset}
        situationPreset={situationPreset} setSituationPreset={setSituationPreset}
        formation={formation} activePreset={presets.find(p => p.formation === formation)?.name}
      />
    </div>}

    {subtab === "Players & Roles" && <div className="grid">
      <PlayersAndRole
        slots={slots} assignment={assignment} playerFor={playerFor} selectedSlotId={selectedSlotId}
        setSelectedSlotId={setSelectedSlotId} selectedSlot={selectedSlot} selectedPlayer={selectedPlayer}
        roleAssignment={roleAssignment} setRoleAssignment={setRoleAssignment}
        dutyAssignment={dutyAssignment} setDutyAssignment={setDutyAssignment}
        playerInstructions={playerInstructions} togglePlayerInstruction={togglePlayerInstruction}
        onViewProfile={p => openProfileFor(mapRosterPlayer(p))} goTo={setActive}
      />
      <SquareSystemForm slots={slots} playerFor={playerFor} onAdd={addSquare} squares={squares} onRemove={removeSquare} />
    </div>}

    {subtab === "Team Instructions" && <TeamInstructionsPanel
      teamInstructions={teamInstructions} setTeamInstructions={setTeamInstructions}
      toggleTransition={toggleTransition} toggleOop={toggleOop}
      pressing={pressing} setPressing={setPressing}
    />}

    {subtab === "Set Pieces" && <SetPiecesPanel
      startXI={startXI} setPieces={setPieces} setSetPieces={setSetPieces}
    />}

    {subtab === "Opposition" && <OppositionPanel
      startXI={startXI} slots={slots} assignment={assignment} playerFor={playerFor}
      oppositionInstructions={oppositionInstructions} setOppositionInstructions={setOppositionInstructions}
      fam={fam} tacticalDelegation={tacticalDelegation} setTacticalDelegation={setTacticalDelegation}
      insights={insights} applyFix={applyFix} appliedFixKeys={appliedFixKeys} autoLog={autoLog}
    />}

    <div className="footer-info">
      <div><ClipboardList /><span><b>Match Preview</b> Man Utd vs Liverpool · Sat, 14 Sep 2025 · 17:30 (Premier League)</span></div>
      <div className="sim-controls">
        <Timer /> {sim ? (paused ? "Match Paused — tactics editable" : `Match Day: ${sim}s running`) : "Ready"}
        {sim > 0 && <button onClick={() => setPaused(p => !p)}>{paused ? <Play size={14} /> : <Pause size={14} />} {paused ? "Resume" : "Pause"}</button>}
        <button onClick={() => { setSim(0); setPaused(false); }}><X size={14} /> Stop</button>
      </div>
    </div>

    <BottomBar onSimulate={() => { setSim(1); setPaused(false); }} pressing={pressing} />
  </>;
}

export function OverviewControls({ formation, setFormation, teamInstructions, setTeamInstructions }) {
  return <div className="left-controls">
    <section className="panel">
      <h3><Sparkles /> Tactical Style</h3><b className="lime">{teamInstructions.mentality}</b>
      <p>Balanced, high pressing with possession focus.</p>
    </section>
    <section className="panel">
      <h3><Crosshair /> Formation</h3>
      <select value={formation} onChange={e => setFormation(e.target.value)}>
        {FORMATION_NAMES.map(x => <option key={x}>{x}</option>)}
      </select>
    </section>
    <section className="panel">
      <h3><Target /> Mentality</h3>
      <select value={teamInstructions.mentality} onChange={e => setTeamInstructions(ti => ({ ...ti, mentality: e.target.value }))}>
        {MENTALITIES.map(m => <option key={m}>{m}</option>)}
      </select>
    </section>
    <section className="panel instruction">
      <h3><Zap />In Possession</h3>
      {IN_POSSESSION.selects.map(s => <div key={s.key}>↗ <span>{teamInstructions[s.key]}</span></div>)}
      <button className="edit" onClick={() => {}}>Edit in Team Instructions →</button>
    </section>
    <section className="panel instruction">
      <h3><Zap />In Transition</h3>
      {Object.entries(teamInstructions.transition).filter(([, v]) => v).map(([k]) => <div key={k}>↗ <span>{TRANSITION.find(t => t.key === k)?.label}</span></div>)}
    </section>
    <section className="panel instruction">
      <h3><Zap />Out Of Possession</h3>
      <div>↗ <span>Defensive Line {teamInstructions.defensiveLine}%</span></div>
      <div>↗ <span>Pressing {teamInstructions.highPress ? "High" : "Standard"}</span></div>
    </section>
  </div>;
}

export function PitchView({ formation, slots, pitchRef, getPos, playerFor, selectedSlotId, onSelect, squares }) {
  return <div className="pitch">
    <div className="pitch-title">
      <span><Sparkles size={16} /> {formation}</span>
      <select defaultValue="Attacking"><option>Attacking</option><option>Balanced</option><option>Defensive</option></select>
    </div>
    <div className="pitch-lines" ref={pitchRef}>
      <div className="half"></div><div className="center-circle"></div><div className="box top"></div><div className="box bottom"></div>
      {squares.length > 0 && <svg className="square-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {squares.map(sq => {
          const slotA = slots.find(s => s.id === sq.a), slotB = slots.find(s => s.id === sq.b);
          if (!slotA || !slotB) return null;
          const a = getPos(slotA), b = getPos(slotB);
          return <g key={sq.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#68ff2e" strokeWidth="0.4" strokeDasharray="1.5,1" />
          </g>;
        })}
      </svg>}
      {slots.map(slot => {
        const p = playerFor(slot);
        const pos = getPos(slot);
        const score = p ? compat(p.pos, slot.code) : 0;
        const tier = fitTier(score);
        return <button key={slot.id}
          onPointerDown={e => onSelect(slot.id, e)}
          className={`player-token fit-${tier} ${selectedSlotId === slot.id ? "selected" : ""}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          title={`${p?.name || "Empty"} — ${slot.label} (shift-click another player to swap)`}>
          <span className="number">{slot.code === "GK" ? 1 : slot.id.replace("s", "")}</span>
          <strong>{p?.name.split(" ").slice(-1)[0] || "—"}</strong>
          <small>{slot.label}</small>
          <b>{p?.rate.toFixed(1) || ""}</b>
        </button>;
      })}
    </div>
    <div className="pitch-footer"><span><Users size={16} /> {slots.length} Slots Filled</span><button><Maximize2 size={16} /></button></div>
  </div>;
}

export function PlayersAndRole({ slots, assignment, playerFor, selectedSlotId, setSelectedSlotId, selectedSlot, selectedPlayer, roleAssignment, setRoleAssignment, dutyAssignment, setDutyAssignment, playerInstructions, togglePlayerInstruction, onViewProfile, goTo }) {
  const [filter, setFilter] = useState("All Positions");
  const filtered = useMemo(() => filter === "All Positions" ? roster : roster.filter(p => p.pos === filter), [filter]);
  return <div className="right-stack">
    <section className="panel available">
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
    </section>
    <RolePanel slot={selectedSlot} player={selectedPlayer} roleAssignment={roleAssignment} setRoleAssignment={setRoleAssignment}
      dutyAssignment={dutyAssignment} setDutyAssignment={setDutyAssignment}
      instructions={selectedSlot ? (playerInstructions[selectedSlot.id] || new Set()) : new Set()}
      toggleInstruction={item => selectedSlot && togglePlayerInstruction(selectedSlot.id, item)}
      onViewProfile={onViewProfile} goTo={goTo} />
  </div>;
}

export function RolePanel({ slot, player, roleAssignment, setRoleAssignment, dutyAssignment, setDutyAssignment, instructions, toggleInstruction, onViewProfile, goTo }) {
  const roleOptions = roles[slot?.code] || ["CM"];
  const role = slot ? (roleAssignment[slot.id] || roleOptions[0]) : "";
  const duty = slot ? (dutyAssignment[slot.id] || "Support") : "";
  const score = player && slot ? compat(player.pos, slot.code) : 0;
  const tier = fitTier(score);
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

export function PresetsPanel({ presets, onSave, onLoad, onDelete, situationPreset, setSituationPreset, formation, activePreset }) {
  return <div className="ti-grid">
    <section className="panel">
      <h3><Save /> Tactical Presets</h3>
      <p>Save the current formation + team instructions as a reusable preset.</p>
      <button className="green-btn" onClick={onSave}><Plus size={16} /> Save Current As Preset</button>
      <div className="preset-list">
        {presets.map(p => <div key={p.name} className="square-row">
          <div><b>{p.name}</b><span>{p.formation}</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onLoad(p.name)}>Load</button>
            <button onClick={() => onDelete(p.name)}><Trash2 size={15} /></button>
          </div>
        </div>)}
      </div>
    </section>
    <section className="panel">
      <h3><Target /> Assign To Situations</h3>
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

// A handful of representative opponent threats — in a full implementation
// these would come from the actual fixture opponent's squad (via World),
// but the current fixture opponent isn't in the World player pool, so we
// use plausible generic threat profiles instead of fabricating fake stats
// for a real club's players.
const OPPOSITION_THREATS = [
  { id: 'rw', label: 'Opposition Right Winger', danger: 'Pace and dribbling in behind the full-back', zone: 'AMR' },
  { id: 'st', label: 'Opposition Striker', danger: 'Movement and finishing in the box', zone: 'ST' },
  { id: 'cm', label: 'Opposition Deep Playmaker', danger: 'Dictates tempo from midfield', zone: 'MC' },
];
const OPPOSITION_OPTIONS = ['No Instruction', 'Tight Mark', 'Press Immediately', 'Force Outside', 'Force Inside', 'Stop Crosses', 'Show Onto Weaker Foot'];

export function OppositionPanel({ startXI, slots, assignment, playerFor, oppositionInstructions, setOppositionInstructions, fam, tacticalDelegation, setTacticalDelegation, insights, applyFix, appliedFixKeys, autoLog }) {
  const responsibleFor = (zone) => {
    const slot = slots.find(s => s.code === zone) || slots.find(s => s.code === 'DC');
    return slot ? playerFor(slot) : null;
  };
  return <div className="ti-grid">
    <section className="panel">
      <h3><ShieldAlert /> Opponent Threats</h3>
      <p>Set specific instructions for the players most likely to hurt you this match. The engine looks up who currently occupies that defensive zone in your Formation to work out who carries the instruction out.</p>
      {OPPOSITION_THREATS.map(t => {
        const responsible = responsibleFor(t.zone);
        const value = oppositionInstructions[t.id] || 'No Instruction';
        return <div className="opposition-row" key={t.id}>
          <div><b>{t.label}</b><span>{t.danger}</span></div>
          <select value={value} onChange={e => setOppositionInstructions(oi => ({ ...oi, [t.id]: e.target.value }))}>
            {OPPOSITION_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <div className="opposition-resp"><span>Responsible:</span><b>{responsible ? responsible.name : "Unassigned"}</b></div>
        </div>;
      })}
      <label className="select-row">Press Their Goalkeeper<select value={oppositionInstructions.gk || 'No'} onChange={e => setOppositionInstructions(oi => ({ ...oi, gk: e.target.value }))}><option>No</option><option>Yes</option></select></label>
    </section>
    <AnalysisPanel fam={fam} tacticalDelegation={tacticalDelegation} setTacticalDelegation={setTacticalDelegation} insights={insights} applyFix={applyFix} appliedFixKeys={appliedFixKeys} autoLog={autoLog} />
  </div>;
}

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
      <h3><Bot /> Assistant Manager — Tactical Delegation</h3>
      <div className="deleg-switch" style={{ marginBottom: 10 }}>
        {TACTICAL_DELEGATION_LEVELS.map(lvl => <button key={lvl} className={tacticalDelegation === lvl ? "active" : ""} onClick={() => setTacticalDelegation(lvl)}>{lvl}</button>)}
      </div>
      <p className="muted-sub">
        {tacticalDelegation === "Manual" && "You make every tactical decision — insights below are informational only."}
        {tacticalDelegation === "Assisted" && "The assistant recommends changes — click Apply on any insight to accept it."}
        {tacticalDelegation === "Automatic" && "The assistant will apply fixable insights on its own while a match is running."}
      </p>
      <div className="insight-list">
        {insights.map((ins, i) => <div className="insight" key={i}>
          <TriangleAlert size={15} /><span>{ins.text}</span>
          {tacticalDelegation === "Assisted" && ins.fix && !appliedFixKeys.has(ins.text) && <button className="apply-btn" onClick={() => applyFix(ins.fix, ins.text)}>Apply</button>}
          {ins.fix && appliedFixKeys.has(ins.text) && <span className="applied-tag"><Check size={12} /> Applied</span>}
        </div>)}
      </div>
      {tacticalDelegation === "Automatic" && autoLog.length > 0 && <>
        <h4 style={{ marginTop: 12 }}>Auto-Adjustments Log</h4>
        <div className="insight-list">{autoLog.map((l, i) => <div className="insight applied" key={i}><Check size={14} /><span>{l.text}</span></div>)}</div>
      </>}
    </section>
  </div>;
}

function BottomBar({ onSimulate, pressing }) {
  return <div className="bottom-bar">
    <div><BarChart3 /><strong>Match Engine</strong><span>Text + 2D (No 3D)</span></div>
    <button className="playbtn" onClick={onSimulate}><Play fill="currentColor" /></button>
    <div className="speed"><button>1x</button><button>2x</button><button className="chosen">4x</button><button>8x</button></div>
    <div className="preset"><span>Pressing Trigger</span><b>{pressing.trigger.split(" · ")[0]}</b></div>
    <button className="save"><Save /> Save</button><button className="reset"><RotateCcw /> Reset</button>
    <div className="analysis"><BarChart3 /><span>Tactical Analysis</span><b>Your tactic is well balanced. Consider more width in attack.</b></div>
  </div>;
}
