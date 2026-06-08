import { useEffect } from 'react';
import { setupPoliQuestRewards } from './PoliQuestRewardHandler';

// Non-visual component mounted once in App.tsx alongside QuestTrackerController.
// Wires up seam #2: the POLI quest reward handler that grants trust on quest completion.
export const PoliSystemBoot = () => {
  useEffect(() => {
    setupPoliQuestRewards();
  }, []);
  return null;
};
