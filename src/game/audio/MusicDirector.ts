import { gameEventBus } from '../core/EventBus';
import { setTrack, setAmbient } from './proceduralAudio';
import { useGameStore } from '../../stores/game/useGameStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { getEditorRoute } from '../../stores/game/editorRouteStore';
import type { GamePhase } from '../../types/game/state';
import type { MusicTrackId } from '../../data/audio/musicTracks';
import type { AmbientLayerId } from '../../data/audio/ambientLayers';

// Batch 12.1 — maps the game phase to a procedural BGM track + ambient bed and crossfades on transition.
// Pure mappers are exported for testing; installMusicDirector wires the gameEventBus and applies the current
// phase immediately.

const MENU_PHASES = new Set<GamePhase>(['BOOT', 'MISSION_CONTROL', 'MISSION_BRIEFING', 'CHARACTER_SELECTION']);
const HANGAR_PHASES = new Set<GamePhase>(['HANGAR', 'PLATFORM_ALIGNMENT', 'LAUNCH_PREPARATION', 'HANGAR_RETURN']);
const FLIGHT_PHASES = new Set<GamePhase>(['LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT', 'WORLD_FLIGHT', 'DESTINATION_APPROACH', 'RETURN_FLIGHT', 'BASE_APPROACH', 'TRANSFORMATION', 'RETURN_TRANSFORMATION']);
const DEST_PHASES = new Set<GamePhase>(['DESCENT', 'LANDING', 'NPC_GREETING', 'MISSION_GAMEPLAY', 'SUPPORT_SELECTION', 'MISSION_COMPLETE']);

export function trackForPhase(phase: GamePhase): MusicTrackId | null {
  if (phase === 'PAUSED') return 'pause';
  if (phase === 'MISSION_RESULTS') return 'results';
  if (MENU_PHASES.has(phase)) return 'menu';
  if (HANGAR_PHASES.has(phase)) return 'hangar';
  if (FLIGHT_PHASES.has(phase)) return 'flight';
  if (DEST_PHASES.has(phase)) return 'destination';
  return null; // ERROR etc. → silence
}

export function ambientForPhase(phase: GamePhase, routeWeather?: string): AmbientLayerId | null {
  if (FLIGHT_PHASES.has(phase)) {
    if (routeWeather === 'storm' || routeWeather === 'rainstorm') return 'storm';
    if (routeWeather === 'night') return 'night';
    return 'wind';
  }
  if (DEST_PHASES.has(phase)) return 'city';
  return null;
}

function apply(phase: GamePhase): void {
  setTrack(trackForPhase(phase));
  const routeId = useFlightStore.getState().currentRouteId;
  const weather = routeId ? getEditorRoute(routeId)?.editorEnvironment?.weather ?? getEditorRoute(routeId)?.weather : undefined;
  setAmbient(ambientForPhase(phase, weather));
}

/** Subscribe phase changes → BGM/ambient. Returns an unsubscribe cleanup. */
export function installMusicDirector(): () => void {
  apply(useGameStore.getState().phase);
  return gameEventBus.on('phase:changed', ({ to }) => apply(to));
}
