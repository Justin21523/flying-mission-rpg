import { create } from 'zustand';
import type { RunnerSnapshot } from './TransformationTimelineRunner';
import type { ModelSlot, TransformationDefinition } from '../../types/game/transformation';

export interface TransformationGhostActor {
  modelId: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

export type TransformationGhostActorKey = ModelSlot | 'activeRef';
export type TransformationGhostActors = Partial<Record<TransformationGhostActorKey, TransformationGhostActor>>;

// Bumped by the director/preview-driver ONLY when the active-effect id-set changes (sparse), so the effects
// layer re-renders to mount/unmount effect children without per-frame React churn.
export const useTxVersion = create<{ v: number; sig: string; bump: (sig: string) => void }>((set) => ({
  v: 0,
  sig: '',
  bump: (sig) => set((s) => (sig === s.sig ? s : { v: s.v + 1, sig })),
}));

// Non-reactive bridge between the director/preview-driver (writer) and the presenter / backdrop / camera /
// effects (readers), plus a polled handle for the HUD + debug panel. Avoids per-frame store writes.
export const txFrame: {
  snapshot: RunnerSnapshot | null;
  def: TransformationDefinition | null;
  charModelId?: string; // the character's GLB shown as the "robot" reveal
  ghostScale: number; // current character/root × robot-slot scale for transformation clone effects
  ghostActors: TransformationGhostActors; // visible actor world transforms used by clone-overlay effects
  showcaseYaw: number; // player-controlled rotation during the interactive showcase
} = { snapshot: null, def: null, ghostScale: 1, ghostActors: {}, showcaseYaw: 0 };

export interface TransformationHandle {
  timelineId: string;
  characterId: string;
  mode: string;
  time: number;
  duration: number;
  progress: number;
  phase: string;
  stageLabel: string;
  form: string;
  planeCtrl: boolean;
  robotCtrl: boolean;
  planeCol: boolean;
  robotCol: boolean;
  effects: number;
}
export const transformationHandle: TransformationHandle = {
  timelineId: '', characterId: '', mode: 'full', time: 0, duration: 0, progress: 0, phase: 'playing',
  stageLabel: '—', form: 'plane', planeCtrl: true, robotCtrl: false, planeCol: true, robotCol: false, effects: 0,
};

export function resetTransformationRuntime(): void {
  txFrame.snapshot = null;
  txFrame.def = null;
  txFrame.charModelId = undefined;
  txFrame.ghostScale = 1;
  txFrame.ghostActors = {};
  txFrame.showcaseYaw = 0;
}
