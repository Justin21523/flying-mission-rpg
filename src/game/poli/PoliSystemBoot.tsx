import { useEffect } from 'react';
import { setupPoliQuestRewards } from './PoliQuestRewardHandler';
import { useToolStore } from '../../stores/toolStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { useEditorPathStore } from '../../stores/editorPathStore';
import { useEditorBoostPadStore } from '../../stores/editorBoostPadStore';
import { useEditorSurfaceStore } from '../../stores/editorSurfaceStore';
import { useEditorPathFollowerStore } from '../../stores/editorPathFollowerStore';
import { useEditorCollisionStore } from '../../stores/editorCollisionStore';
import { useEditorAnimationStore } from '../../stores/editorAnimationStore';
import { useEditorTrafficScenarioStore } from '../../stores/editorTrafficScenarioStore';
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
    // Backfill any new seed content into existing localStorage (adds missing ids only; never overwrites edits),
    // so updated/new seeds appear without a manual Reset.
    useEditorIncidentStore.getState().mergeMissingFromSeed();
    useEditorPathStore.getState().mergeMissingFromSeed();
    useEditorBoostPadStore.getState().mergeMissingFromSeed();
    useEditorSurfaceStore.getState().mergeMissingFromSeed();
    useEditorPathFollowerStore.getState().mergeMissingFromSeed();
    useEditorCollisionStore.getState().mergeMissingFromSeed();
    useEditorAnimationStore.getState().mergeMissingFromSeed();
    useEditorTrafficScenarioStore.getState().mergeMissingFromSeed();
    seedPoliWorld();
    seedWorld();
    bootReactionEngine(); // Phase C — collision reaction rules live in Play Mode
  }, []);
  return null;
};
