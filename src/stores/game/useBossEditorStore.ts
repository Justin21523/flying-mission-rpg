import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type {
  BossDefinition, BossPhaseDefinition, BossWeakpointDefinition, BossAttackPatternDefinition,
  BossArenaDefinition, BossSummonWaveDefinition, EliteEncounterDefinition,
} from '../../types/game/boss';
import { SEED_BOSSES } from '../../data/bosses/bossDefinitions';
import { SEED_BOSS_PHASES } from '../../data/bosses/bossPhaseDefinitions';
import { SEED_BOSS_WEAKPOINTS } from '../../data/bosses/bossWeakpointDefinitions';
import { SEED_BOSS_ATTACK_PATTERNS } from '../../data/bosses/bossAttackPatterns';
import { SEED_BOSS_ARENAS } from '../../data/bosses/bossArenaDefinitions';
import { SEED_BOSS_SUMMON_WAVES } from '../../data/bosses/bossSummonWaves';
import { SEED_ELITE_ENCOUNTERS } from '../../data/bosses/eliteEncounterDefinitions';
import { EXTRA_BOSSES, EXTRA_BOSS_PHASES, EXTRA_BOSS_WEAKPOINTS, EXTRA_BOSS_ATTACKS, EXTRA_BOSS_ARENAS, EXTRA_BOSS_SUMMON_WAVES } from '../../data/bosses/extraZoneBosses';

// Editable boss content (👹 Boss tab) — six createEditorCollections seeded from data/bosses/*. Seed-merged
// at boot. Read by the boss runtime via the accessors below. Batch K appends the 7 per-zone signature bosses
// (EXTRA_*) — additive ids, so mergeMissingFromSeed reaches existing saves with no version bump.
export const useBossDefinitionStore = createEditorCollection<BossDefinition>({ storageKey: 'aero-rescue-editor-boss-def-v1', seed: [...SEED_BOSSES, ...EXTRA_BOSSES], makeId: () => `boss_${nanoid(6)}`, seedVersion: 'worldbuild-w1' });
export const useBossPhaseStore = createEditorCollection<BossPhaseDefinition>({ storageKey: 'aero-rescue-editor-boss-phase-v1', seed: [...SEED_BOSS_PHASES, ...EXTRA_BOSS_PHASES], makeId: () => `bphase_${nanoid(6)}` });
export const useBossWeakpointStore = createEditorCollection<BossWeakpointDefinition>({ storageKey: 'aero-rescue-editor-boss-weakpoint-v1', seed: [...SEED_BOSS_WEAKPOINTS, ...EXTRA_BOSS_WEAKPOINTS], makeId: () => `wp_${nanoid(6)}` });
export const useBossAttackStore = createEditorCollection<BossAttackPatternDefinition>({ storageKey: 'aero-rescue-editor-boss-attack-v1', seed: [...SEED_BOSS_ATTACK_PATTERNS, ...EXTRA_BOSS_ATTACKS], makeId: () => `atk_${nanoid(6)}` });
export const useBossArenaStore = createEditorCollection<BossArenaDefinition>({ storageKey: 'aero-rescue-editor-boss-arena-v1', seed: [...SEED_BOSS_ARENAS, ...EXTRA_BOSS_ARENAS], makeId: () => `arena_${nanoid(6)}` });
export const useBossSummonWaveStore = createEditorCollection<BossSummonWaveDefinition>({ storageKey: 'aero-rescue-editor-boss-wave-v1', seed: [...SEED_BOSS_SUMMON_WAVES, ...EXTRA_BOSS_SUMMON_WAVES], makeId: () => `wave_${nanoid(6)}` });
export const useEliteEncounterStore = createEditorCollection<EliteEncounterDefinition>({ storageKey: 'aero-rescue-editor-boss-elite-v1', seed: SEED_ELITE_ENCOUNTERS, makeId: () => `elite_${nanoid(6)}` });

export const getBoss = (id: string | undefined): BossDefinition | undefined => (id ? useBossDefinitionStore.getState().items.find((b) => b.id === id) : undefined);
export const getBossForSegment = (segmentId: string): BossDefinition | undefined => useBossDefinitionStore.getState().items.find((b) => b.segmentId === segmentId && b.enabled !== false);
export const getBossPhase = (id: string | undefined): BossPhaseDefinition | undefined => (id ? useBossPhaseStore.getState().items.find((p) => p.id === id) : undefined);
export const getBossPhasesFor = (bossId: string): BossPhaseDefinition[] => useBossPhaseStore.getState().items.filter((p) => p.bossId === bossId).sort((a, b) => a.phaseIndex - b.phaseIndex);
export const getWeakpoint = (id: string | undefined): BossWeakpointDefinition | undefined => (id ? useBossWeakpointStore.getState().items.find((w) => w.id === id) : undefined);
export const getWeakpointsFor = (bossId: string): BossWeakpointDefinition[] => useBossWeakpointStore.getState().items.filter((w) => w.bossId === bossId);
export const getAttackPattern = (id: string | undefined): BossAttackPatternDefinition | undefined => (id ? useBossAttackStore.getState().items.find((a) => a.id === id) : undefined);
export const getArena = (id: string | undefined): BossArenaDefinition | undefined => (id ? useBossArenaStore.getState().items.find((a) => a.id === id) : undefined);
export const getSummonWave = (id: string | undefined): BossSummonWaveDefinition | undefined => (id ? useBossSummonWaveStore.getState().items.find((w) => w.id === id) : undefined);
export const getElite = (id: string | undefined): EliteEncounterDefinition | undefined => (id ? useEliteEncounterStore.getState().items.find((e) => e.id === id) : undefined);
