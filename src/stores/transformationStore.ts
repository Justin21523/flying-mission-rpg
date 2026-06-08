import { create } from 'zustand';

export type TransformMode = 'robot' | 'vehicle';

interface TransformationState {
  mode: TransformMode;
  isTransforming: boolean;
  playerFacingAngle: number;    // world-space yaw the player is facing (radians)
  isPlayerMoving: boolean;      // true when horizontal speed > 0.3 m/s
  requestTransform: () => void;
  setFacingAngle: (angle: number, moving: boolean) => void;
}

export const useTransformationStore = create<TransformationState>((set, get) => ({
  // Default = vehicle → shows the Poli car model; pressing T transforms to robot (transformer).
  mode: 'vehicle',
  isTransforming: false,
  playerFacingAngle: Math.PI,
  isPlayerMoving: false,
  requestTransform: () => {
    if (get().isTransforming) return;
    const next = get().mode === 'robot' ? 'vehicle' : 'robot';
    set({ mode: next, isTransforming: true });
    setTimeout(() => set({ isTransforming: false }), 500);
  },
  setFacingAngle: (angle, moving) => set({ playerFacingAngle: angle, isPlayerMoving: moving }),
}));
