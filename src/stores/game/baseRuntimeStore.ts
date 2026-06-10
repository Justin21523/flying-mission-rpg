import { create } from 'zustand';

// Runtime state for the base scene's platform/lift sequence — small flags shared between LiftPlatform
// (writer), BaseVehicle (reads `locked`), and BaseHud (reads hints/countdown). Reset on leaving the base.
export type LiftPhase = 'idle' | 'descending' | 'done';

interface BaseRuntimeState {
  inRange: boolean; // vehicle within the platform trigger volume
  aligned: boolean; // vehicle aligned on the platform centre
  locked: boolean; // vehicle control disabled (locked onto the platform)
  liftPhase: LiftPhase;
  countdown: number; // seconds remaining in the lift sequence (display)
  setProximity: (inRange: boolean, aligned: boolean) => void;
  setLocked: (locked: boolean) => void;
  setLift: (liftPhase: LiftPhase, countdown: number) => void;
  reset: () => void;
}

export const useBaseRuntimeStore = create<BaseRuntimeState>((set) => ({
  inRange: false,
  aligned: false,
  locked: false,
  liftPhase: 'idle',
  countdown: 0,
  setProximity: (inRange, aligned) => set({ inRange, aligned }),
  setLocked: (locked) => set({ locked }),
  setLift: (liftPhase, countdown) => set({ liftPhase, countdown }),
  reset: () => set({ inRange: false, aligned: false, locked: false, liftPhase: 'idle', countdown: 0 }),
}));
