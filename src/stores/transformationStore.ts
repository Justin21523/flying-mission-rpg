import { create } from 'zustand';

export type TransformMode = 'robot' | 'vehicle';

interface TransformationState {
  mode: TransformMode;
  isTransforming: boolean;
  requestTransform: () => void;
}

export const useTransformationStore = create<TransformationState>((set, get) => ({
  mode: 'robot',
  isTransforming: false,
  requestTransform: () => {
    if (get().isTransforming) return;
    const next = get().mode === 'robot' ? 'vehicle' : 'robot';
    set({ mode: next, isTransforming: true });
    setTimeout(() => set({ isTransforming: false }), 500);
  },
}));
