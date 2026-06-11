import { useEffect } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { completeFullControlArrival, markFullControlReturning } from './FullControlDispatchService';

export const FullControlDispatchHost = () => {
  const phase = useGameStore((s) => s.phase);
  const fullControl = useSupportRuntimeStore((s) => s.fullControl);

  useEffect(() => {
    if (!fullControl) return;
    if (phase === 'LANDING') markFullControlReturning();
    if (phase === 'NPC_GREETING' && fullControl.returning) useGameStore.getState().requestTransition('MISSION_GAMEPLAY');
    if (phase === 'MISSION_GAMEPLAY' && fullControl.returning) completeFullControlArrival();
  }, [phase, fullControl]);

  return null;
};
