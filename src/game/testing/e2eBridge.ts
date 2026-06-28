import { useGameStore } from '../../stores/game/useGameStore';
import type { GamePhase } from '../../types/game/state';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { ProgressTracker } from '../progress/ProgressTracker';
import { debugSaveNow, debugSaveSummary } from '../save/SaveDebugTools';
import type { QualityTier } from '../../types/game/quality';

// Batch 13 — a tiny window bridge for Playwright (and console debugging). Debug/test only: it exposes
// read/write helpers so e2e can drive settings/save without depending on in-game UI that may not be mounted
// in every scene mode. Never used by normal gameplay.
declare global {
  interface Window {
    __aero?: {
      phase: () => string;
      jumpTo: (phase: string) => void; // dev/test only — bypasses FSM validation (mount any screen)
      saveNow: () => boolean;
      saveSummary: () => ReturnType<typeof debugSaveSummary>;
      getQualityTier: () => string;
      setQualityTier: (t: string) => void;
      getMasterVolume: () => number;
      setMasterVolume: (v: number) => void;
      markMissionComplete: (id: string) => void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__aero = {
    phase: () => useGameStore.getState().phase,
    jumpTo: (phase) => useGameStore.getState().jumpTo(phase as GamePhase),
    saveNow: () => debugSaveNow(),
    saveSummary: () => debugSaveSummary(),
    getQualityTier: () => useGraphicsSettingsStore.getState().tier,
    setQualityTier: (t) => useGraphicsSettingsStore.getState().setTier(t as QualityTier),
    getMasterVolume: () => useAudioStore.getState().masterVolume,
    setMasterVolume: (v) => useAudioStore.getState().setMasterVolume(v),
    markMissionComplete: (id) => ProgressTracker.markMissionCompleted(id),
  };
}
