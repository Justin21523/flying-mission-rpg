import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFlightTimelineStore } from '../../stores/game/flightTimelineStore';
import { getActiveFlightPhase } from '../../stores/game/flightPhaseStore';
import { resolveEventsAtTime } from './flightPhaseRuntime';
import { fireFlightEvent } from './flightPhaseEventFire';

// Fires Flight Phase timeline events as the playhead crosses their time. Forward-only during playback; in Edit
// the preview-enabled events fire (so you can rehearse), in Play every enabled event fires for real (briefing /
// dialogue / warning text, boost / trail fx, and nextPhase → jumpTo). Scrubbing does NOT spam events; use the
// panel's "Preview event" to rehearse a single event at a paused time.
export const FlightPhaseEventRuntime = ({ play = false }: { play?: boolean }) => {
  const prev = useRef(0);
  const fired = useRef<Set<string>>(new Set());
  useFrame(() => {
    const tl = useFlightTimelineStore.getState();
    const phase = getActiveFlightPhase();
    if (!phase) return;
    const cur = tl.currentTime;
    if (cur < prev.current - 0.001) fired.current.clear(); // looped / scrubbed / flew back → allow re-fire
    // PLAY: fire as the player's progress advances the timeline (playing flag stays false there). EDIT: only
    // while actually playing back, so scrubbing doesn't spam events.
    if ((play || tl.playing) && cur > prev.current) {
      for (const e of resolveEventsAtTime(phase.events, cur, prev.current, !play)) {
        if (e.triggerOnce && fired.current.has(e.eventId)) continue;
        fired.current.add(e.eventId);
        fireFlightEvent(e, play);
      }
    }
    prev.current = cur;
  });
  return null;
};
