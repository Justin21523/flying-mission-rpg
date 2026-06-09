import { create } from 'zustand';
import { playSfx } from '../game/audio/sfx';
import { CORE_TEAM } from '../data/characters/coreTeam';
import { applyAbility } from '../game/player/abilityEffects';
import { applySuperDamage, type DamageRequest } from '../game/combat/applySuperDamage';
import { triggerDash } from '../game/combat/dashImpulse';
import { addPull } from '../game/combat/pullField';
import { spawnSummon } from './summonStore';
import { usePlayerStore } from './playerStore';
import type { AbilityType, SuperKind, SuperMove } from '../types/character';

// DEBUG: when true, the Q ability has NO cooldown — any ability can be used at any time (testing). Set to
// false to restore normal per-ability cooldowns.
export const DEBUG_UNLIMITED_ABILITY = true;

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
  // Super moves (keys 1/2/3) — one pulse id + a payload the SuperAbilityFx reads to draw the right effect.
  superFxPulseId: number;
  superFx: SuperFxPayload | null;
  celebratePulseId: number; // bumped on each yokai defeat → player plays a one-shot 'celebrate' anim
  toggleForm: () => void;     // T — flip vehicle⇄robot
  cycleCharacter: () => void; // C — next character in the roster (keeps the current form)
  setFlying: (b: boolean) => void;
  toggleFlight: () => void;   // F (caller checks canFly)
  triggerAbility: (ability: AbilityInput) => boolean; // Q — returns false if on cooldown
  // Fire a super move from the player at `origin` facing `headingRad`. Returns false if on cooldown.
  triggerSuperMove: (move: SuperMove, origin: { x: number; y: number; z: number }, headingRad: number) => boolean;
  celebrate: () => void; // play a one-shot celebrate anim (called on each yokai defeat)
}

// What SuperAbilityFx reads to draw + place the effect (and what was used to damage yokai this pulse).
export interface SuperFxPayload {
  kind: SuperKind;
  color: string;
  x: number; y: number; z: number;  // player origin
  dirX: number; dirZ: number;       // forward unit direction
  radius: number; range: number; duration: number; count: number;
}

// Per-super cooldown timers (module-level → no re-renders).
const superCdUntil: Record<string, number> = {};

const DASH_SPEED = 26;

// Build a DamageRequest from the cast payload (optionally re-centred / re-aimed).
function reqFrom(p: SuperFxPayload, move: SuperMove, cx = p.x, cz = p.z): DamageRequest {
  return { kind: p.kind, x: cx, y: p.y, z: cz, dirX: p.dirX, dirZ: p.dirZ, damage: move.damage, radius: p.radius, range: p.range, count: p.count };
}

// Per-kind damage dispatch. Instant kinds hit once; dash also lunges the player; boomerang hits out + back.
// Timed/persistent kinds (bomb/spin/blackhole/clone/sentry) are wired in later phases; until then they hit
// once as a plain AoE so the move still does something.
function dispatchSuperDamage(move: SuperMove, p: SuperFxPayload): void {
  switch (p.kind) {
    case 'dash':
      triggerDash(p.dirX, p.dirZ, DASH_SPEED, 0.22);
      applySuperDamage(reqFrom(p, move));
      break;
    case 'boomerang':
      applySuperDamage(reqFrom(p, move));
      window.setTimeout(() => applySuperDamage(reqFrom(p, move)), 450); // return pass
      break;
    case 'bomb': {
      // Lob ahead, explode after a fuse.
      const cx = p.x + p.dirX * p.range * 0.5, cz = p.z + p.dirZ * p.range * 0.5;
      window.setTimeout(() => applySuperDamage(reqFrom(p, move, cx, cz)), 700);
      break;
    }
    case 'spin': {
      // Whirlwind: several ticks over the duration, each centred on the LIVE player position (follows you).
      const ticks = 5, dur = Math.max(0.4, p.duration);
      for (let i = 0; i < ticks; i++) window.setTimeout(() => {
        const pos = usePlayerStore.getState().position;
        if (pos) applySuperDamage(reqFrom(p, move, pos.x, pos.z));
      }, (i / ticks) * dur * 1000);
      break;
    }
    case 'blackhole': {
      // Vortex ahead: pull yokai in + tick damage over the duration.
      const cx = p.x + p.dirX * p.range * 0.5, cz = p.z + p.dirZ * p.range * 0.5;
      addPull(cx, cz, 6, p.duration);
      const ticks = 5, dur = Math.max(0.4, p.duration);
      for (let i = 0; i < ticks; i++) window.setTimeout(() => applySuperDamage(reqFrom(p, move, cx, cz)), (i / ticks) * dur * 1000);
      break;
    }
    case 'clone':
    case 'sentry':
      // Persistent auto-attacker (替身 / drone) — handled by SummonLayer; duration drives its lifetime.
      spawnSummon(p.kind, p.x, p.y, p.z, move.color, move.damage, p.radius, move.duration ?? 6);
      break;
    default:
      applySuperDamage(reqFrom(p, move));
      break;
  }
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
    superFxPulseId: 0,
    superFx: null,
    celebratePulseId: 0,
    toggleForm: () => pulse({ form: get().form === 'vehicle' ? 'robot' : 'vehicle' }),
    cycleCharacter: () => {
      const i = POLI_ROSTER.indexOf(get().charId);
      // Switching character ends flight (the new one re-enables it with F if it canFly).
      pulse({ charId: POLI_ROSTER[(i + 1) % POLI_ROSTER.length], flying: false });
    },
    setFlying: (b) => set({ flying: b }),
    toggleFlight: () => set({ flying: !get().flying }),
    triggerAbility: (ability) => {
      if (!DEBUG_UNLIMITED_ABILITY && now() < get().abilityCooldownUntil) return false; // still cooling down
      const type = ability.type ?? 'speed_boost';
      playSfx('ability');
      set({
        abilityColor: ability.color,
        abilityType: type,
        abilityPulseId: get().abilityPulseId + 1,
        abilityCooldownUntil: DEBUG_UNLIMITED_ABILITY ? 0 : now() + (ability.cooldownSec ?? 5),
      });
      applyAbility({ type, radius: ability.radius ?? 8, duration: ability.duration ?? 3, strength: ability.strength ?? 1.8 });
      return true;
    },
    triggerSuperMove: (move, origin, headingRad) => {
      if (!DEBUG_UNLIMITED_ABILITY && now() < (superCdUntil[move.id] ?? 0)) return false; // cooling down
      superCdUntil[move.id] = DEBUG_UNLIMITED_ABILITY ? 0 : now() + (move.cooldownSec || 4);
      const dirX = Math.sin(headingRad), dirZ = Math.cos(headingRad);
      const payload: SuperFxPayload = {
        kind: move.kind, color: move.color,
        x: origin.x, y: origin.y, z: origin.z, dirX, dirZ,
        radius: move.radius ?? 8, range: move.range ?? 14,
        duration: move.duration ?? 0.8, count: move.count ?? 4,
      };
      playSfx('ability');
      set({ superFx: payload, superFxPulseId: get().superFxPulseId + 1 });
      dispatchSuperDamage(move, payload);
      return true;
    },
    celebrate: () => set({ celebratePulseId: get().celebratePulseId + 1 }),
  };
});
