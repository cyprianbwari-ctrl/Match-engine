import React, { useState } from 'react';
import { useManagerData } from '../store/ManagerContext.jsx';
import { useSaveData } from '../store/SaveContext.jsx';
import StartScreen from './StartScreen.jsx';
import CreateManagerScreen from './CreateManagerScreen.jsx';
import ChooseClubScreen from './ChooseClubScreen.jsx';
import ConfirmScreen from './ConfirmScreen.jsx';
import './onboarding.css';

const STEPS = [
  { key: 'manager', label: 'Manager Profile' },
  { key: 'club', label: 'Choose Club' },
  { key: 'confirm', label: 'Confirm' },
];

function StepHeader({ step, onBack }) {
  return (
    <div className="ob-topbar">
      <div className="ob-brand">FAMILY <span>26</span></div>
      <div className="ob-steps">
        {STEPS.map((s, i) => {
          const stepIndex = STEPS.findIndex(x => x.key === step);
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : '';
          return (
            <React.Fragment key={s.key}>
              {i > 0 && <div className="ob-step-line" />}
              <div className={`ob-step ${state}`}>
                <div className="ob-step-dot">{i + 1}</div>
                <span>{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <button className="ob-back" onClick={onBack}>Back</button>
    </div>
  );
}

export default function OnboardingFlow({ onReady }) {
  const manager = useManagerData();
  const save = useSaveData();
  const [screen, setScreen] = useState('start'); // start | manager | club | confirm
  const [draft, setDraft] = useState(() => ({
    name: manager.profile.name || 'Cyprian',
    nationality: manager.profile.nationality || '🏴',
    dob: manager.profile.dob || '14 Mar 1988',
    badge: 'UEFA Pro Licence',
    coachingStyle: manager.profile.coachingStyle || 'Possession-Based',
    tacticalStyle: manager.profile.tacticalStyle || 'Attacking Full-Backs',
    attributes: { ...manager.profile.attributes },
    // Do not silently assign the traditional five leagues. The player chooses all five.
    activeLeagues: manager.profile.activeLeagues || [],
    club: null,
    division: null,
  }));

  const handleContinueSlot = async (idx) => {
    const ok = await save.loadFromSlot(idx);
    if (ok) onReady();
  };

  const handleStartCareer = () => {
    if (!draft.club) return;
    manager.startNewCareer({
      name: draft.name,
      nationality: draft.nationality,
      dob: draft.dob,
      coachingStyle: draft.coachingStyle,
      tacticalStyle: draft.tacticalStyle,
      attributes: draft.attributes,
      currentClubId: draft.club.id,
      currentClub: draft.club.name,
      activeLeagues: draft.activeLeagues,
    });
    onReady();
  };

  if (screen === 'start') {
    return (
      <div className="ob-screen">
        <StartScreen
          onNewCareer={() => setScreen('manager')}
          onContinueSlot={handleContinueSlot}
          onSettings={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="ob-screen">
      <StepHeader
        step={screen}
        onBack={() => setScreen(screen === 'manager' ? 'start' : screen === 'club' ? 'manager' : 'club')}
      />
      {screen === 'manager' && (
        <CreateManagerScreen
          draft={draft}
          onChange={setDraft}
          onBack={() => setScreen('start')}
          onContinue={() => setScreen('club')}
        />
      )}
      {screen === 'club' && (
        <ChooseClubScreen
          draft={draft}
          onChange={setDraft}
          onBack={() => setScreen('manager')}
          onContinue={() => setScreen('confirm')}
        />
      )}
      {screen === 'confirm' && (
        <ConfirmScreen draft={draft} onBack={() => setScreen('club')} onStart={handleStartCareer} />
      )}
    </div>
  );
}
