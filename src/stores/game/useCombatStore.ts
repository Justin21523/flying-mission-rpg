import { create } from 'zustand';
import type { CombatStats, DamageResult, ActiveDefenseState } from '../../types/game/combat';

// Combat Runtime state store. Holds player vitals, cooldowns, debug flags, and the last damage results for
// the HUD. The CombatDirector / SkillRuntime own the logic and write here through actions; React UI only
// reads + toggles debug. Active effect instances are tracked here too so the effect layer can render them.

export interface ActiveEffectInstance {
  instanceId: string;
  effectDefId: string;
  skillInstanceId: string;
  // World placement captured at cast time.
  x: number; y: number; z: number;
  headingRad: number;
  startedAtMs: number;
}

export type CombatDebugFlag = 'godMode' | 'ignoreEnergyCost' | 'ignoreCooldown' | 'showHitVolumes' | 'showDamageNumbers';

interface CombatState {
  playerStatsByCharacterId: Record<string, CombatStats>;
  activeCombatantId?: string;

  activeCooldowns: Record<string, number>; // skillId → perf-time (ms) the cooldown ends
  activeEffects: ActiveEffectInstance[];
  activeDefenseByCharacterId: Record<string, ActiveDefenseState>;

  godMode: boolean;
  ignoreEnergyCost: boolean;
  ignoreCooldown: boolean;
  showHitVolumes: boolean;
  showDamageNumbers: boolean;

  lastDamageResults: DamageResult[];

  // actions
  setActiveCombatant: (id: string | undefined) => void;
  setCombatStats: (characterId: string, stats: CombatStats) => void;
  updateCombatStats: (characterId: string, partial: Partial<CombatStats>) => void;
  startCooldown: (skillId: string, untilMs: number) => void;
  setDefense: (characterId: string, state: ActiveDefenseState) => void;
  pushDamageResult: (result: DamageResult) => void;
  addEffect: (effect: ActiveEffectInstance) => void;
  removeEffect: (instanceId: string) => void;
  setDebugFlag: (flag: CombatDebugFlag, value: boolean) => void;
  setGodMode: (enabled: boolean) => void;
  resetCombat: () => void;
}

const DAMAGE_LOG_CAP = 6;

export const useCombatStore = create<CombatState>((set) => ({
  playerStatsByCharacterId: {},
  activeCombatantId: undefined,
  activeCooldowns: {},
  activeEffects: [],
  activeDefenseByCharacterId: {},
  // God mode default ON (testing build) — player invincible + free skills. Toggle in the God Mode panel.
  godMode: true,
  ignoreEnergyCost: true,
  ignoreCooldown: true,
  showHitVolumes: false,
  showDamageNumbers: true,
  lastDamageResults: [],

  setActiveCombatant: (activeCombatantId) => set({ activeCombatantId }),

  setCombatStats: (characterId, stats) =>
    set((s) => ({ playerStatsByCharacterId: { ...s.playerStatsByCharacterId, [characterId]: stats } })),

  updateCombatStats: (characterId, partial) =>
    set((s) => {
      const cur = s.playerStatsByCharacterId[characterId];
      if (!cur) return s;
      return { playerStatsByCharacterId: { ...s.playerStatsByCharacterId, [characterId]: { ...cur, ...partial } } };
    }),

  startCooldown: (skillId, untilMs) => set((s) => ({ activeCooldowns: { ...s.activeCooldowns, [skillId]: untilMs } })),

  setDefense: (characterId, state) => set((s) => ({ activeDefenseByCharacterId: { ...s.activeDefenseByCharacterId, [characterId]: state } })),

  pushDamageResult: (result) => set((s) => ({ lastDamageResults: [result, ...s.lastDamageResults].slice(0, DAMAGE_LOG_CAP) })),

  addEffect: (effect) => set((s) => ({ activeEffects: [...s.activeEffects, effect] })),
  removeEffect: (instanceId) => set((s) => ({ activeEffects: s.activeEffects.filter((e) => e.instanceId !== instanceId) })),

  setDebugFlag: (flag, value) => set({ [flag]: value } as Pick<CombatState, CombatDebugFlag>),
  setGodMode: (enabled) => set({ godMode: enabled }),

  resetCombat: () => set({ activeCooldowns: {}, activeEffects: [], activeDefenseByCharacterId: {}, lastDamageResults: [], playerStatsByCharacterId: {}, activeCombatantId: undefined }),
}));
