import { useGameStore } from '../../stores/game/useGameStore';
import { gameEventBus } from './EventBus';

// Thin orchestrator: boots the FSM and wires a few cross-system reactions over the EventBus. It owns no
// state — it only nudges stores. Kept minimal this batch (the full loop wiring grows with later batches).
let booted = false;
let disposers: (() => void)[] = [];

export const GameDirector = {
  boot(): void {
    if (booted) return;
    booted = true;

    // Leave BOOT for the mission control console as soon as the app is up.
    useGameStore.getState().requestTransition('MISSION_CONTROL');

    // Selecting a mission while at the console opens its briefing.
    disposers.push(
      gameEventBus.on('mission:selected', () => {
        if (useGameStore.getState().phase === 'MISSION_CONTROL') {
          useGameStore.getState().requestTransition('MISSION_BRIEFING');
        }
      }),
    );
  },

  shutdown(): void {
    disposers.forEach((d) => d());
    disposers = [];
    booted = false;
  },
};
