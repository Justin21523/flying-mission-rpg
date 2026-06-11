import { create } from 'zustand';
import type { GroundCloudRallyConfig, GroundExtraAbilitySlot, GroundRescueSurgeConfig } from '../../types/game/character';
import { DEFAULT_CLOUD_RALLY, DEFAULT_RESCUE_SURGE } from '../../game/destination/groundAbilityConfig';
import type { Vec3Tuple } from '../../types/path';

interface GroundAbilityState {
  cloudPulseId: number;
  cloudStartedAt: number;
  cloudConfig: GroundCloudRallyConfig;
  energizedUntil: number;
  extraPulseId: number;
  extraStartedAt: number;
  extraConfig: GroundExtraAbilitySlot | null;
  surgeStartedAt: number;
  surgeUntil: number;
  surgeDirection: Vec3Tuple;
  surgeConfig: GroundRescueSurgeConfig;
  cooldowns: Record<string, number>;
  triggerCloud: (config: GroundCloudRallyConfig, now: number) => boolean;
  triggerSurge: (config: GroundRescueSurgeConfig, direction: Vec3Tuple, now: number) => boolean;
  triggerExtra: (config: GroundExtraAbilitySlot, now: number) => boolean;
  reset: () => void;
}

const available = (cooldowns: Record<string, number>, code: string, now: number): boolean => now >= (cooldowns[code] ?? 0);

export const useGroundAbilityStore = create<GroundAbilityState>((set, get) => ({
  cloudPulseId: 0,
  cloudStartedAt: -999,
  cloudConfig: DEFAULT_CLOUD_RALLY,
  energizedUntil: 0,
  extraPulseId: 0,
  extraStartedAt: -999,
  extraConfig: null,
  surgeStartedAt: -999,
  surgeUntil: 0,
  surgeDirection: [0, 0, 1],
  surgeConfig: DEFAULT_RESCUE_SURGE,
  cooldowns: {},
  triggerCloud: (config, now) => {
    if (!available(get().cooldowns, config.keyCode, now)) return false;
    set((state) => ({
      cloudPulseId: state.cloudPulseId + 1,
      cloudStartedAt: now,
      cloudConfig: config,
      energizedUntil: Math.max(state.energizedUntil, now + config.energizedDurationSec),
      cooldowns: { ...state.cooldowns, [config.keyCode]: now + config.cooldownSec },
    }));
    return true;
  },
  triggerSurge: (config, direction, now) => {
    if (!available(get().cooldowns, config.keyCode, now)) return false;
    set((state) => ({
      surgeStartedAt: now,
      surgeUntil: now + config.durationSec,
      surgeDirection: direction,
      surgeConfig: config,
      cooldowns: { ...state.cooldowns, [config.keyCode]: now + config.cooldownSec },
    }));
    return true;
  },
  triggerExtra: (config, now) => {
    if (!available(get().cooldowns, config.keyCode, now)) return false;
    set((state) => ({
      extraPulseId: state.extraPulseId + 1,
      extraStartedAt: now,
      extraConfig: config,
      cooldowns: { ...state.cooldowns, [config.keyCode]: now + config.cooldownSec },
    }));
    return true;
  },
  reset: () => set({
    cloudPulseId: 0,
    cloudStartedAt: -999,
    cloudConfig: DEFAULT_CLOUD_RALLY,
    energizedUntil: 0,
    extraPulseId: 0,
    extraStartedAt: -999,
    extraConfig: null,
    surgeStartedAt: -999,
    surgeUntil: 0,
    surgeDirection: [0, 0, 1],
    surgeConfig: DEFAULT_RESCUE_SURGE,
    cooldowns: {},
  }),
}));
