import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  initialStaff, candidatePool, initialScoutAssignments, initialInbox,
  DESIRED_HEADCOUNT, TRAINING_GROUPS, TRAINING_AREAS, MEDICAL_RESPONSIBILITIES
} from '../data/staffData.js';

const StaffCtx = createContext(null);
const STAGES = ['Search', 'Shortlist', 'Interview', 'Negotiate', 'Hire'];

function candidateToStaff(cand, nextId) {
  return {
    id: nextId, name: cand.name, dept: cand.staffType, category: cand.category, role: cand.category, title: cand.category,
    nat: cand.nat, age: cand.age, contract: '30 Jun 2027', rating: Math.min(5, 2.5 + cand.reputation * 0.5), color: 'gold',
    club: 'Manchester United', status: 'Active', wage: cand.wageDemand, workload: 20, attributes: cand.attributes, assignment: null
  };
}

export function StaffProvider({ children }) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [candidates, setCandidates] = useState(candidatePool);
  const [scoutAssignments, setScoutAssignments] = useState(initialScoutAssignments);
  const [inbox, setInbox] = useState(initialInbox);
  const [delegation, setDelegation] = useState({ recruitment: 'MANUAL', assignments: 'MANUAL' });
  const nextIdRef = React.useRef(1000);

  const pushInbox = useCallback((entry) => {
    const id = ++nextIdRef.current;
    setInbox(ib => [{ id, status: 'pending', ...entry }, ...ib]);
  }, []);

  const vacancies = useMemo(() => {
    const counts = {};
    staffList.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(DESIRED_HEADCOUNT)
      .map(([category, desired]) => ({ category, desired, employed: counts[category] || 0, open: Math.max(0, desired - (counts[category] || 0)) }))
      .filter(v => v.open > 0);
  }, [staffList]);

  const advanceCandidate = useCallback((id) => {
    setCandidates(cs => cs.map(c => {
      if (c.id !== id || c.stage === 'Hire') return c;
      const idx = STAGES.indexOf(c.stage);
      return { ...c, stage: STAGES[Math.min(idx + 1, STAGES.length - 1)] };
    }));
  }, []);

  const rejectCandidate = useCallback((id) => {
    setCandidates(cs => cs.filter(c => c.id !== id));
  }, []);

  const hireCandidate = useCallback((id) => {
    setCandidates(cs => {
      const found = cs.find(c => c.id === id);
      if (!found) return cs;
      nextIdRef.current += 1;
      const newStaff = candidateToStaff(found, nextIdRef.current);
      setStaffList(sl => [...sl, newStaff]);
      pushInbox({ kind: 'hire', text: `${found.name} has signed as ${found.category}.`, status: 'approved' });
      return cs.filter(c => c.id !== id);
    });
  }, [pushInbox]);

  const assignStaff = useCallback((id, assignment) => {
    setStaffList(sl => sl.map(s => s.id === id ? { ...s, assignment } : s));
  }, []);

  const addScoutAssignment = useCallback((assignment) => {
    const id = ++nextIdRef.current;
    setScoutAssignments(a => [{ id, status: 'In Progress', daysLeft: assignment.duration, ...assignment }, ...a]);
  }, []);

  const updateScoutAssignmentStatus = useCallback((id, status) => {
    setScoutAssignments(a => a.map(x => x.id === id ? { ...x, status } : x));
  }, []);

  const resolveInbox = useCallback((id, decision, onApprove) => {
    setInbox(ib => ib.map(x => x.id === id ? { ...x, status: decision } : x));
    if (decision === 'approved' && onApprove) onApprove();
  }, []);

  const toggleDelegation = useCallback((key) => {
    setDelegation(d => {
      const next = { ...d, [key]: d[key] === 'MANUAL' ? 'ASSISTANT' : 'MANUAL' };
      if (next[key] === 'ASSISTANT' && key === 'recruitment') {
        pushInbox({ kind: 'delegation', text: 'Recruitment delegated to the Assistant Manager. Candidates will be found and negotiated automatically — final hires still need your approval below.', status: 'info' });
        setCandidates(cs => cs.map(c => {
          if (c.stage === 'Search' || c.stage === 'Shortlist') {
            nextIdRef.current += 1;
            pushInbox({ kind: 'hire-approval', text: `Assistant Manager recommends hiring ${c.name} (${c.category}) — negotiated at £${c.wageDemand.toLocaleString()}/wk.`, status: 'pending', candidateId: c.id });
            return { ...c, stage: 'Negotiate' };
          }
          return c;
        }));
      }
      if (next[key] === 'ASSISTANT' && key === 'assignments') {
        pushInbox({ kind: 'delegation', text: 'Staff assignments delegated to the Assistant Manager. You\'ll be warned if any workload becomes excessive.', status: 'info' });
        setStaffList(sl => sl.map(s => {
          if (s.assignment) return s;
          if (s.dept === 'Coaching' && s.category !== 'Manager') return { ...s, assignment: { group: TRAINING_GROUPS[s.id % TRAINING_GROUPS.length], area: TRAINING_AREAS[s.id % TRAINING_AREAS.length] } };
          if (s.dept === 'Medical') return { ...s, assignment: { responsibility: MEDICAL_RESPONSIBILITIES[s.id % MEDICAL_RESPONSIBILITIES.length] } };
          return s;
        }));
        const overloaded = staffList.filter(s => s.workload > 80);
        overloaded.forEach(s => pushInbox({ kind: 'workload', text: `${s.name} (${s.category}) is carrying an excessive workload (${s.workload}%). Consider hiring support.`, status: 'pending' }));
      }
      return next;
    });
  }, [pushInbox, staffList]);

  const value = useMemo(() => ({
    staffList, candidates, scoutAssignments, inbox, delegation, vacancies,
    advanceCandidate, rejectCandidate, hireCandidate, assignStaff,
    addScoutAssignment, updateScoutAssignmentStatus, resolveInbox, toggleDelegation
  }), [staffList, candidates, scoutAssignments, inbox, delegation, vacancies, advanceCandidate, rejectCandidate, hireCandidate, assignStaff, addScoutAssignment, updateScoutAssignmentStatus, resolveInbox, toggleDelegation]);

  return <StaffCtx.Provider value={value}>{children}</StaffCtx.Provider>;
}

export function useStaffData() {
  const ctx = useContext(StaffCtx);
  if (!ctx) throw new Error('useStaffData must be used within a StaffProvider');
  return ctx;
}
