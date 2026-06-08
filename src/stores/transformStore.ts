import { create } from 'zustand';

// Poli's two forms. 'car' is the default (police car); 'robot' is the transformer. Toggled with T.
export type PoliForm = 'car' | 'robot';

interface TransformState {
  form: PoliForm;
  toggle: () => void;
  setForm: (f: PoliForm) => void;
}

export const useTransformStore = create<TransformState>((set, get) => ({
  form: 'car',
  toggle: () => set({ form: get().form === 'car' ? 'robot' : 'car' }),
  setForm: (f) => set({ form: f }),
}));
