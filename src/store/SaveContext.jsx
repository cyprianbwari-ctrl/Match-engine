import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { useSimulation } from './SimulationContext.jsx';
import { useFinanceData } from './FinanceContext.jsx';
import { useTransfersData } from './TransfersContext.jsx';
import { useCompetitionData } from './CompetitionContext.jsx';
import { useTacticsData } from './TacticsContext.jsx';
import { useCommunicationData } from './CommunicationContext.jsx';
import { useStaffData } from './StaffContext.jsx';
import { useWorldData } from './WorldContext.jsx';
import { usePlayerState } from './PlayerStateContext.jsx';
import { useManagerData } from './ManagerContext.jsx';
import { useClubState } from './ClubStateContext.jsx';
import { useCareerRecords } from './CareerRecordsContext.jsx';
import { buildSaveEnvelope, cloudReadyPayload, writeLocalSave, readLocalSave, deleteLocalSave, SAVE_SCHEMA } from '../engine/saveArchitecture.js';

const SaveCtx = createContext(null);
export const AUTOSAVE_KEY = 'family26_autosave';
export const SLOT_PREFIX = 'family26_slot_';
export const SLOT_COUNT = 6;

function safeParse(raw) { try { return JSON.parse(raw); } catch { return null; } }

export function SaveProvider({ children }) {
  const sim = useSimulation();
  const finance = useFinanceData();
  const transfers = useTransfersData();
  const competition = useCompetitionData();
  const tactics = useTacticsData();
  const communication = useCommunicationData();
  const staff = useStaffData();
  const world = useWorldData();
  const playerState = usePlayerState();
  const manager = useManagerData();
  const clubState = useClubState();
  const records = useCareerRecords();

  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [lastSaveReason, setLastSaveReason] = useState(null);
  const [recovery, setRecovery] = useState(null); // { savedAt, dateLabel } | null — set once on mount

  // One-time check at boot: is there a session that never got a clean
  // manual/auto save acknowledged? We treat any existing autosave found at
  // mount as a recoverable session, since a browser can't reliably tell
  // "crashed" apart from "closed normally".
  useEffect(() => {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    const snap = safeParse(raw);
    if (snap) setRecovery({ savedAt: snap.savedAt, dateLabel: snap.career?.simulation?.now ? new Date(snap.career.simulation.now).toDateString() : null });
    else void readLocalSave('autosave').then(idbSnap => {
      if (idbSnap) setRecovery({ savedAt: idbSnap.savedAt, dateLabel: idbSnap.career?.simulation?.now ? new Date(idbSnap.career.simulation.now).toDateString() : null });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collect = useCallback(() => {
    const career = {
      schemaVersion: 3,
      game: { name: 'FAMILY 26', saveFormat: 'career-v3' },
      manager: manager.profile || {},
      simulation: sim.getSnapshot(),
      finance: finance.getSnapshot(),
      transfers: transfers.getSnapshot(),
      competition: competition.getSnapshot(),
      tactics: tactics.getSnapshot(),
      communication: communication.getSnapshot(),
      staff: staff.getSnapshot(),
      world: world.getSnapshot(),
      playerState: playerState.getSnapshot(),
      managerState: manager.getSnapshot(),
      clubState: clubState.getSnapshot(),
      careerRecords: records.getSnapshot(),
    };
    return buildSaveEnvelope({
      career,
      world: { competition: career.competition, world: career.world, players: career.playerState },
      database: { source: 'family26-canonical-men-db-v2', careerSeed: manager.profile?.careerSeed || null },
    });
  }, [sim, finance, transfers, competition, tactics, communication, staff, world, playerState, manager, clubState, records]);

  const apply = useCallback((input) => {
    if (!input) return;
    const snap = input.career || input;
    sim.restoreSnapshot(snap.simulation);
    finance.restoreSnapshot(snap.finance);
    transfers.restoreSnapshot(snap.transfers);
    competition.restoreSnapshot(snap.competition);
    tactics.restoreSnapshot(snap.tactics);
    communication.restoreSnapshot(snap.communication);
    staff.restoreSnapshot(snap.staff);
    world.restoreSnapshot(snap.world);
    playerState.restoreSnapshot(snap.playerState);
    manager.restoreSnapshot(snap.managerState);
    clubState.restoreSnapshot(snap.clubState);
    records.restoreSnapshot(snap.careerRecords);
  }, [sim, finance, transfers, competition, tactics, communication, staff, world, playerState, manager, clubState, records]);

  const autoSave = useCallback((reason = 'Auto-save') => {
    try {
      const snap = collect();
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snap));
      void writeLocalSave('autosave', snap).catch(() => {});
      setLastSavedAt(new Date());
      setLastSaveReason(reason);
    } catch (e) { console.warn('Auto-save failed', e); }
  }, [collect]);

  const saveToSlot = useCallback((idx) => {
    try {
      const snap = collect();
      localStorage.setItem(SLOT_PREFIX + idx, JSON.stringify(snap));
      void writeLocalSave(`slot-${idx}`, snap).catch(() => {});
      setLastSavedAt(new Date());
      setLastSaveReason('Manual save');
      return true;
    } catch (e) { console.warn('Manual save failed', e); return false; }
  }, [collect]);

  const loadFromSlot = useCallback(async (idx) => {
    let snap = safeParse(localStorage.getItem(SLOT_PREFIX + idx));
    if (!snap) snap = await readLocalSave(`slot-${idx}`).catch(() => null);
    if (!snap) return false;
    apply(snap);
    return true;
  }, [apply]);

  const deleteSlot = useCallback((idx) => {
    localStorage.removeItem(SLOT_PREFIX + idx);
    void deleteLocalSave(`slot-${idx}`).catch(() => {});
  }, []);

  const getSlots = useCallback(() => Array.from({ length: SLOT_COUNT }).map((_, i) => {
    const snap = safeParse(localStorage.getItem(SLOT_PREFIX + i));
    if (!snap) return { index: i, empty: true };
    const club = snap.career?.manager?.currentClub || snap.career?.manager?.club || 'Current Club';
    return {
      index: i, empty: false, savedAt: snap.savedAt,
      dateLabel: snap.career?.simulation?.now ? new Date(snap.career.simulation.now).toDateString() : '—',
      club,
      managerName: snap.career?.manager?.name || 'Manager',
      crestInitials: club.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(),
    };
  }), []);

  const recoverSession = useCallback(() => {
    const snap = safeParse(localStorage.getItem(AUTOSAVE_KEY));
    if (snap) apply(snap);
    else void readLocalSave('autosave').then(idbSnap => { if (idbSnap) apply(idbSnap); }).catch(() => {});
    setRecovery(null);
  }, [apply]);

  const discardRecovery = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
    void deleteLocalSave('autosave').catch(() => {});
    setRecovery(null);
  }, []);

  // The actual auto-save trigger list from the spec — every one of these is
  // a real, distinct moment, not a generic timer. Each entry only changes
  // when that specific thing happens, so this fires exactly at those points
  // and nowhere else.
  const triggers = {
    matchLock: sim.matchLocked,
    transferCount: transfers.history.length,
    negotiationCount: transfers.negotiations.length,
    dayLabel: sim.now ? sim.now.toDateString() : null,
    simPhase: sim.phase,
  };
  const triggerKey = JSON.stringify(triggers);
  const prevTriggerRef = useRef(null);
  useEffect(() => {
    if (prevTriggerRef.current === null) { prevTriggerRef.current = triggerKey; return; } // skip initial mount
    if (prevTriggerRef.current !== triggerKey) {
      const prev = safeParse(prevTriggerRef.current) || {};
      const next = triggers;
      let reason = 'Auto-save';
      if (prev.matchLock !== next.matchLock) reason = next.matchLock ? 'Pre-Match Save' : 'Post-Match Auto-save';
      else if (prev.transferCount !== next.transferCount) reason = 'Transfer Completed';
      else if (prev.negotiationCount !== next.negotiationCount) reason = 'Negotiation Update';
      else if (prev.dayLabel !== next.dayLabel) reason = 'End of Day';
      else if (prev.simPhase !== next.simPhase) reason = 'Simulation Update';
      prevTriggerRef.current = triggerKey;
      autoSave(reason);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  const exportSave = useCallback(() => JSON.stringify(collect(), null, 2), [collect]);
  const exportCloudSave = useCallback(() => JSON.stringify(cloudReadyPayload(collect()), null, 2), [collect]);
  const importSave = useCallback((raw) => { try { const snap = typeof raw === 'string' ? JSON.parse(raw) : raw; apply(snap); return true; } catch (e) { console.warn('Import failed', e); return false; } }, [apply]);

  const value = {
    lastSavedAt, lastSaveReason, autoSave,
    saveToSlot, loadFromSlot, deleteSlot, getSlots,
    recovery, recoverSession, discardRecovery,
    SLOT_COUNT, exportSave, exportCloudSave, importSave, schemaVersion: 3, saveSchema: SAVE_SCHEMA,
  };

  return <SaveCtx.Provider value={value}>{children}</SaveCtx.Provider>;
}

export function useSaveData() {
  const ctx = useContext(SaveCtx);
  if (!ctx) throw new Error('useSaveData must be used within a SaveProvider');
  return ctx;
}
