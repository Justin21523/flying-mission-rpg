import { useEffect } from 'react';
import { setupPoliQuestRewards } from './PoliQuestRewardHandler';
import { useToolStore } from '../../stores/toolStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { seedPoliWorld } from './seedPoliWorld';
import { seedWorld } from './seedWorld';
import { bootReactionEngine } from '../collision/reactionEngine';

// Non-visual component mounted once in App.tsx.
// Wires up seam #2: POLI quest reward handler + starter tool unlocks, and seeds the editable world
// (residents as Edit-Mode NPCs + per-area landmarks) once.
export const PoliSystemBoot = () => {
  useEffect(() => {
    setupPoliQuestRewards();
    useToolStore.getState().initStarterTools();
    useEditorIncidentStore.getState().mergeMissingFromSeed(); // backfill new seed incidents into old saves
    seedPoliWorld();
    seedWorld();
    bootReactionEngine(); // Phase C — collision reaction rules live in Play Mode
  }, []);
  return null;
};
