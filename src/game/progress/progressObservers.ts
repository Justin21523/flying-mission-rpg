import { gameEventBus } from '../core/EventBus';
import { phaserBridge } from '../phaser/phaserBridge';
import { ProgressTracker } from './ProgressTracker';
import { StatsTracker } from './StatsTracker';
import { UnlockManager } from './UnlockManager';
import { captureSettingsSnapshot } from '../save/settingsSnapshot';
import { useSaveStore } from '../../stores/useSaveStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { useSettingsStore } from '../../stores/game/useSettingsStore';

// Batch 13 — event-driven progress/stats wiring (keeps gameplay files untouched). Subscribes the game event
// bus, the Phaser bridge, and the settings stores; records into the save (debounce-persisted). Also mirrors
// the live settings into the save snapshot on change (one direction: store → snapshot). Returns a cleanup.

export function installProgressObservers(): () => void {
  const offs: Array<() => void> = [];

  offs.push(gameEventBus.on('phase:changed', ({ from, to }) => {
    if (to === 'WORLD_FLIGHT' && from !== 'WORLD_FLIGHT') StatsTracker.flightStarted();
    if (to === 'DESTINATION_APPROACH' && from === 'WORLD_FLIGHT') StatsTracker.flightCompleted();
    if (to === 'TRANSFORMATION' || to === 'RETURN_TRANSFORMATION') {
      StatsTracker.transformationPlayed();
      const cid = useCharacterStore.getState().selectedCharacterId;
      const ch = cid ? getEditorCharacter(cid) : undefined;
      if (ch?.transformationId) ProgressTracker.markTransformationWatched(ch.transformationId);
    }
    if (to === 'LANDING') {
      const ev = useDestinationRuntimeStore.getState().evaluation;
      if (ev && !ev.safe) StatsTracker.roughLanding(); else StatsTracker.safeLanding();
    }
    if (to === 'MISSION_COMPLETE') {
      const mid = useMissionStore.getState().currentMissionId;
      if (mid) ProgressTracker.markMissionCompleted(mid);
      StatsTracker.missionCompleted();
      UnlockManager.unlockNextLocation();
      UnlockManager.unlockNextRoute();
    }
    useSaveStore.getState().setLastSession({
      lastGamePhase: to,
      lastMissionId: useMissionStore.getState().currentMissionId ?? undefined,
      lastCharacterId: useCharacterStore.getState().selectedCharacterId ?? undefined,
    });
  }));

  offs.push(gameEventBus.on('support:arrived', () => StatsTracker.supportCall()));
  offs.push(phaserBridge.subscribe((evt) => { if (evt.type === 'mini-game-success') StatsTracker.phaserCompleted(); }));

  // Mirror live settings into the save snapshot whenever any settings store changes (store = source of truth).
  const mirror = (): void => useSaveStore.getState().setSettingsSnapshot(captureSettingsSnapshot());
  offs.push(useGraphicsSettingsStore.subscribe(mirror));
  offs.push(useAudioStore.subscribe(mirror));
  offs.push(useFlightRuntimeStore.subscribe(mirror));
  offs.push(useSettingsStore.subscribe(mirror));

  // Play time accumulation (every 5s while not paused; debounce-persisted, never per-frame).
  const interval = setInterval(() => { if (!useGameStore.getState().paused) StatsTracker.addPlayTime(5); }, 5000);

  return () => { offs.forEach((o) => o()); clearInterval(interval); };
}
