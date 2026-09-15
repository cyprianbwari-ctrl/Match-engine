import { stepMatch, simulateInstant, resolveDecision, substitutePlayer } from './matchSimulator.js';

let state = null;
let timer = null;
let running = false;
let speed = 4;

const SPEED_MS = { 1: 220, 2: 150, 3: 100, 4: 70, 5: 45, 6: 25 };

function snapshot() {
  if (!state) return;
  postMessage({ type: 'snapshot', state });
}

function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function startLoop() {
  stopLoop();
  if (!running || !state) return;
  timer = setInterval(() => {
    if (!state || state.finished || state.pendingDecision) return;
    state = stepMatch(state, 7);
    snapshot();
    if (state.finished || state.pendingDecision) {
      running = false;
      stopLoop();
    }
  }, SPEED_MS[speed] || SPEED_MS[4]);
}

self.onmessage = (event) => {
  const msg = event.data || {};
  switch (msg.type) {
    case 'init':
      running = false;
      stopLoop();
      state = msg.state;
      speed = msg.speed || 4;
      snapshot();
      break;
    case 'start':
      running = true;
      speed = msg.speed || speed;
      startLoop();
      break;
    case 'stop':
      running = false;
      stopLoop();
      break;
    case 'speed':
      speed = msg.speed || speed;
      if (running) startLoop();
      break;
    case 'step':
      if (state && !state.finished && !state.pendingDecision) {
        const count = Math.max(1, msg.count || 1);
        for (let i = 0; i < count && !state.finished && !state.pendingDecision; i++) state = stepMatch(state, 7);
        snapshot();
      }
      break;
    case 'quickSim':
      if (state) {
        running = false;
        stopLoop();
        state = simulateInstant(state);
        snapshot();
      }
      break;
    case 'decision':
      if (state) { state = resolveDecision(state, msg.key); snapshot(); }
      break;
    case 'tactics':
      if (state && !state.finished) {
        if (msg.side === 'home') state.homeTactics = { ...state.homeTactics, ...msg.tactics };
        else state.awayTactics = { ...state.awayTactics, ...msg.tactics };
        snapshot();
      }
      break;
    case 'substitute':
      if (state && msg.side === 'home') {
        state.homeXI = substitutePlayer(state.homeXI, msg.outId, msg.inPlayer);
        snapshot();
      }
      break;
    default:
      break;
  }
};
