import { useFlightPhaseHudStore, NOTICE_TONE } from '../../stores/game/flightPhaseHudStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { playTimelineSound } from '../audio/playTimelineSound';
import type { FlightTimelineEvent } from '../../types/game/flightPhase';
import type { GamePhase } from '../../types/game/state';

// Fire a single Flight Phase timeline event. In Edit preview only the visible/HUD effects run; in Play the
// nextPhase event also advances the FSM. Kept separate from the runtime component so Fast Refresh stays happy.
export function fireFlightEvent(e: FlightTimelineEvent, play: boolean): void {
  const hud = useFlightPhaseHudStore.getState();
  const tone = NOTICE_TONE[e.eventType];
  // A sound is orthogonal to the event type — any event can carry one. The runtime already edge-triggers this
  // (forward-only, triggerOnce-aware) in BOTH edit preview and play, so preview/play parity comes for free.
  if (e.soundId) playTimelineSound(e.soundId);
  switch (e.eventType) {
    case 'missionBriefing':
    case 'dialogue':
    case 'airWarning':
    case 'basePanorama':
      if (tone) hud.showNotice(typeof e.payload.text === 'string' ? (e.payload.text as string) : labelFor(e), tone);
      break;
    case 'boostFx': hud.pulseBoost(); break;
    case 'trailFx': hud.pulseTrail(); break;
    case 'nextPhase':
      if (play && typeof e.payload.phase === 'string') useGameStore.getState().jumpTo(e.payload.phase as GamePhase);
      break;
    default: break; // cameraSwitch handled by keyframes; animation/speedChange/turn driven by nodes
  }
}

function labelFor(e: FlightTimelineEvent): string {
  switch (e.eventType) {
    case 'basePanorama': return 'Base panorama';
    case 'airWarning': return 'Caution — traffic ahead';
    default: return e.eventType;
  }
}
