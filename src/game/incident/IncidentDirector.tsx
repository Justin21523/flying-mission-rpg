import { useEffect, useRef } from 'react';
import { useEditorRandomEventStore } from '../../stores/editorRandomEventStore';
import { spawnRandomIncident } from './spawnIncident';

// Random incident director. Mounted once (outside the Canvas) in App. Every `intervalSec` it spawns a
// weighted-random eligible incident (capped at `maxConcurrent`). Fully driven by editorRandomEventStore.
export const IncidentDirector = () => {
  const elapsed = useRef(0);
  useEffect(() => {
    const tick = () => {
      const cfg = useEditorRandomEventStore.getState();
      if (!cfg.enabled) { elapsed.current = 0; return; }
      elapsed.current += 1;
      if (elapsed.current >= cfg.intervalSec) {
        elapsed.current = 0;
        spawnRandomIncident();
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
};
