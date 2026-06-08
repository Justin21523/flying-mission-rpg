import { useEffect } from 'react';
import { setupPoliQuestRewards } from './PoliQuestRewardHandler';
import { useToolStore } from '../../stores/toolStore';
import { seedPoliWorld } from './seedPoliWorld';

// Non-visual component mounted once in App.tsx.
// Wires up seam #2: POLI quest reward handler + starter tool unlocks, and seeds the editable world
// (residents as Edit-Mode NPCs + per-area landmarks) once.
export const PoliSystemBoot = () => {
  useEffect(() => {
    setupPoliQuestRewards();
    useToolStore.getState().initStarterTools();
    seedPoliWorld();
  }, []);
  return null;
};
