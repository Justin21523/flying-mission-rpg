import { useEffect } from 'react';
import { setupPoliQuestRewards } from './PoliQuestRewardHandler';
import { useToolStore } from '../../stores/toolStore';

// Non-visual component mounted once in App.tsx.
// Wires up seam #2: POLI quest reward handler + starter tool unlocks.
export const PoliSystemBoot = () => {
  useEffect(() => {
    setupPoliQuestRewards();
    useToolStore.getState().initStarterTools();
  }, []);
  return null;
};
