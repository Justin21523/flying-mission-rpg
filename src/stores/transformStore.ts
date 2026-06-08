import { create } from 'zustand';

// The 4 playable main characters (each has a vehicle + robot model in CORE_TEAM).
export type PoliCharId = 'poli' | 'roy' | 'helly' | 'amber';
export type PoliForm = 'vehicle' | 'robot';
export const POLI_ROSTER: PoliCharId[] = ['poli', 'roy', 'helly', 'amber'];

interface TransformState {
  charId: PoliCharId;   // which main character the player currently is
  form: PoliForm;       // car/vehicle (default) or robot (transformer)
  flying: boolean;      // flight mode (F) — only meaningful for characters whose data canFly
  pulseId: number;      // increments on every transform → triggers the smoke burst
  animStart: number;    // performance.now()/1000 when the last transform began (cover/reveal window)
  toggleForm: () => void;     // T — flip vehicle⇄robot
  cycleCharacter: () => void; // C — next character in the roster (keeps the current form)
  setFlying: (b: boolean) => void;
  toggleFlight: () => void;   // F (caller checks canFly)
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export const useTransformStore = create<TransformState>((set, get) => {
  // Start a transform: bump the pulse (smoke) and record the time (cover window).
  const pulse = (patch: Partial<TransformState>) =>
    set({ ...patch, pulseId: get().pulseId + 1, animStart: now() });

  return {
    charId: 'poli',
    form: 'vehicle',
    flying: false,
    pulseId: 0,
    animStart: 0,
    toggleForm: () => pulse({ form: get().form === 'vehicle' ? 'robot' : 'vehicle' }),
    cycleCharacter: () => {
      const i = POLI_ROSTER.indexOf(get().charId);
      // Switching character ends flight (the new one re-enables it with F if it canFly).
      pulse({ charId: POLI_ROSTER[(i + 1) % POLI_ROSTER.length], flying: false });
    },
    setFlying: (b) => set({ flying: b }),
    toggleFlight: () => set({ flying: !get().flying }),
  };
});
