import { useCallback, useEffect, useRef, useState } from 'react';

export function useMatchEngine(initialState, { speed = 4, onSnapshot } = {}) {
  const workerRef = useRef(null);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const worker = new Worker(new URL('./matchEngine.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data?.type !== 'snapshot') return;
      setState(event.data.state);
      onSnapshot?.(event.data.state);
    };
    worker.postMessage({ type: 'init', state: initialState, speed });
    return () => { worker.postMessage({ type: 'stop' }); worker.terminate(); workerRef.current = null; };
  // Initial state is intentionally used only to initialize the worker.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback((message) => workerRef.current?.postMessage(message), []);
  const start = useCallback(() => send({ type: 'start', speed }), [send, speed]);
  const stop = useCallback(() => send({ type: 'stop' }), [send]);
  const setSpeed = useCallback((nextSpeed) => send({ type: 'speed', speed: nextSpeed }), [send]);
  const step = useCallback((count = 1) => send({ type: 'step', count }), [send]);
  const quickSim = useCallback(() => send({ type: 'quickSim' }), [send]);
  const decision = useCallback((key) => send({ type: 'decision', key }), [send]);
  const updateTactics = useCallback((side, tactics) => send({ type: 'tactics', side, tactics }), [send]);
  const substitute = useCallback((side, outId, inPlayer) => send({ type: 'substitute', side, outId, inPlayer }), [send]);

  return { state, setState, start, stop, setSpeed, step, quickSim, decision, updateTactics, substitute };
}
