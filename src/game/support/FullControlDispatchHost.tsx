import { useEffect } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { completeFullControlArrival } from './FullControlDispatchService';
import { applyContribution } from './supportContribution';

// Post-13 — bridges a full-control support dispatch through the loop and, on arrival at the destination's
// MISSION_GAMEPLAY, has the dispatched character make a REAL contribution (completes one suited objective)
// before returning control to the origin character as an active companion.
export const FullControlDispatchHost = () => {
  const phase = useGameStore((s) => s.phase);
  const fullControl = useSupportRuntimeStore((s) => s.fullControl);

  useEffect(() => {
    if (!fullControl || fullControl.returning) return;
    // After the support character lands + greets, step into mission gameplay so it can contribute.
    if (phase === 'NPC_GREETING') { useGameStore.getState().requestTransition('MISSION_GAMEPLAY'); return; }
    if (phase === 'MISSION_GAMEPLAY') {
      const store = useSupportRuntimeStore.getState();
      const result = applyContribution(fullControl);
      store.setFullControl({ ...fullControl, returning: true, originMissionRuntime: result?.runtime ?? fullControl.originMissionRuntime });
      if (result) store.pushToast(fullControl.dispatchCharacterId, result.label);
      completeFullControlArrival(); // restores origin scene + makes the support char an active companion
      if (result) useSupportRuntimeStore.getState().updatePresence(fullControl.dispatchCharacterId, { missionContribution: result.label });
    }
  }, [phase, fullControl]);

  return null;
};
