import { create } from 'zustand';
import { playSfx } from '../game/audio/sfx';
import { CORE_TEAM } from '../data/characters/coreTeam';
import { applyAbility } from '../game/player/abilityEffects';
import type { AbilityType } from '../types/character';

// What the Q handler passes in — the active character's (merged) ability data.
export interface AbilityInput {
  color: string;
  type?: AbilityType;
  radius?: number;
  duration?: number;
  strength?: number;
  cooldownSec?: number;
}

// Playable main characters = any CORE_TEAM entry that has BOTH a vehicle and a robot model (so it can
// transform). Data-driven so adding a character + its two GLBs to CORE_TEAM makes it cycle with C and
// appear in the POLI tab automatically — no enum edits. charId is a free string (a CORE_TEAM id).
export type PoliCharId = string;
export type PoliForm = 'vehicle' | 'robot';
export const POLI_ROSTER: PoliCharId[] = CORE_TEAM
  .filter((c) => c.modelVehiclePath && c.modelRobotPath)
  .map((c) => c.id);

interface TransformState {
  charId: PoliCharId;   // which main character the player currently is
  form: PoliForm;       // car/vehicle (default) or robot (transformer)
  flying: boolean;      // flight mode (F) — only meaningful for characters whose data canFly
  pulseId: number;      // increments on every transform → triggers the smoke burst
  animStart: number;    // performance.now()/1000 when the last transform began (cover/reveal window)
  abilityPulseId: number; // increments on each ability use → triggers AbilityFx
  abilityColor: string;   // colour of the most-recent ability VFX
  abilityType: AbilityType; // type of the most-recent ability (drives AbilityFx shape)
  abilityCooldownUntil: number; // perf.now()/1000 until which Q is on cooldown
  toggleForm: () => void;     // T — flip vehicle⇄robot
  cycleCharacter: () => void; // C — next character in the roster (keeps the current form)
  setFlying: (b: boolean) => void;
  toggleFlight: () => void;   // F (caller checks canFly)
  triggerAbility: (ability: AbilityInput) => boolean; // Q — returns false if on cooldown
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export const useTransformStore = create<TransformState>((set, get) => {
  // Start a transform: bump the pulse (smoke) and record the time (cover window).
  const pulse = (patch: Partial<TransformState>) => {
    playSfx('transform');
    set({ ...patch, pulseId: get().pulseId + 1, animStart: now() });
  };

  return {
    charId: 'poli',
    form: 'vehicle',
    flying: false,
    pulseId: 0,
    animStart: 0,
    abilityPulseId: 0,
    abilityColor: '#3b82f6',
    abilityType: 'scan_pulse',
    abilityCooldownUntil: 0,
    toggleForm: () => pulse({ form: get().form === 'vehicle' ? 'robot' : 'vehicle' }),
    cycleCharacter: () => {
      const i = POLI_ROSTER.indexOf(get().charId);
      // Switching character ends flight (the new one re-enables it with F if it canFly).
      pulse({ charId: POLI_ROSTER[(i + 1) % POLI_ROSTER.length], flying: false });
    },
    setFlying: (b) => set({ flying: b }),
    toggleFlight: () => set({ flying: !get().flying }),
    triggerAbility: (ability) => {
      if (now() < get().abilityCooldownUntil) return false; // still cooling down
      const type = ability.type ?? 'speed_boost';
      playSfx('ability');
      set({
        abilityColor: ability.color,
        abilityType: type,
        abilityPulseId: get().abilityPulseId + 1,
        abilityCooldownUntil: now() + (ability.cooldownSec ?? 5),
      });
      applyAbility({ type, radius: ability.radius ?? 8, duration: ability.duration ?? 3, strength: ability.strength ?? 1.8 });
      return true;
    },
  };
});
