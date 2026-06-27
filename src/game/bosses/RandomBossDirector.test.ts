import { describe, it, expect, beforeEach } from 'vitest';
import * as RandomBoss from './RandomBossDirector';
import * as BossDirector from './BossDirector';
import { useBossStore } from '../../stores/game/useBossStore';
import {
  useBossDefinitionStore, useBossPhaseStore, useBossWeakpointStore, useBossAttackStore, useBossArenaStore, useBossSummonWaveStore,
} from '../../stores/game/useBossEditorStore';
import { useEditorRandomBossPoolStore } from '../../stores/game/editorCombatStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useCombatTargetStore, liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { useEnvironmentThemeStore } from '../../stores/useEnvironmentEditorStore';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { MissionZoneDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';
import type { EnvironmentThemeDefinition } from '../../types/environmentThemeTypes';
import type { RandomBossPoolDefinition } from '../../types/game/randomBoss';
import { SEED_BOSSES } from '../../data/bosses/bossDefinitions';
import { SEED_BOSS_PHASES } from '../../data/bosses/bossPhaseDefinitions';
import { SEED_BOSS_WEAKPOINTS } from '../../data/bosses/bossWeakpointDefinitions';
import { SEED_BOSS_ATTACK_PATTERNS } from '../../data/bosses/bossAttackPatterns';
import { SEED_BOSS_ARENAS } from '../../data/bosses/bossArenaDefinitions';
import { SEED_BOSS_SUMMON_WAVES } from '../../data/bosses/bossSummonWaves';

const ZONE: MissionZoneDefinition = {
  id: 'tz_random', locationId: 'loc_test', name: 'Test Zone', segmentIds: ['tseg_combat'],
  startSegmentId: 'tseg_combat', finalSegmentIds: [], zoneMode: 'linear', allowBacktracking: false,
  enabled: true, randomBossPoolId: 'tpool',
};
const COMBAT_SEG: ZoneSegmentDefinition = {
  id: 'tseg_combat', zoneId: 'tz_random', name: 'Combat', order: 1, segmentType: 'combat-placeholder',
  entryConditions: [{ id: 'a', type: 'always' }], completionConditions: [{ id: 'c', type: 'debug-complete' }],
  nextSegmentIds: [], markers: [], enabled: true,
};
const POOL: RandomBossPoolDefinition = {
  id: 'tpool', name: 'Test Pool', enabled: true,
  candidates: [{ bossId: 'harbor_core_sentinel', weight: 1 }],
  threat: { perKill: 50, perSecond: 0, threshold: 100, cooldownSeconds: 5, maxPerZone: 1 },
};

function spawnDefeatedEnemy(id: string): void {
  const t: CombatTarget = { id, definitionId: 'd', hp: 0, maxHp: 10, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 1, isEnemy: true };
  liveTargets.push(t);
}

beforeEach(() => {
  useBossDefinitionStore.getState().importState({ items: SEED_BOSSES, seeded: true });
  useBossPhaseStore.getState().importState({ items: SEED_BOSS_PHASES, seeded: true });
  useBossWeakpointStore.getState().importState({ items: SEED_BOSS_WEAKPOINTS, seeded: true });
  useBossAttackStore.getState().importState({ items: SEED_BOSS_ATTACK_PATTERNS, seeded: true });
  useBossArenaStore.getState().importState({ items: SEED_BOSS_ARENAS, seeded: true });
  useBossSummonWaveStore.getState().importState({ items: SEED_BOSS_SUMMON_WAVES, seeded: true });
  useEditorMissionZoneStore.getState().importState({ items: [ZONE] });
  useEditorZoneSegmentStore.getState().importState({ items: [COMBAT_SEG] });
  useEditorRandomBossPoolStore.getState().importState({ items: [POOL] });
  useCombatTargetStore.getState().reset();
  BossDirector.cleanup();
  useAdvancedMissionZoneStore.getState().startZone('tz_random', 'tseg_combat', ['tseg_combat']);
  RandomBoss.resetRandomBoss('tz_random');
});

describe('RandomBossDirector — threat gauge', () => {
  it('air-drops a random boss once the gauge crosses the threshold (2 kills × 50 = 100)', () => {
    spawnDefeatedEnemy('e1');
    spawnDefeatedEnemy('e2');
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(1);
    expect(useBossStore.getState().runtime?.status).toBe('active');
  });

  it('does not drop before the threshold is reached', () => {
    spawnDefeatedEnemy('e1'); // 50 < 100
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(0);
    expect(useBossStore.getState().runtime).toBeFalsy();
  });

  it('counts each defeated enemy only once', () => {
    spawnDefeatedEnemy('e1');
    RandomBoss.update(0); // gauge 50
    RandomBoss.update(0); // same enemy — still 50, no drop
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(0);
  });

  it('respects the per-zone cap (does not drop a second boss after the first is defeated)', () => {
    spawnDefeatedEnemy('e1'); spawnDefeatedEnemy('e2');
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(1);
    BossDirector.defeatBoss(); // clear the active boss
    spawnDefeatedEnemy('e3'); spawnDefeatedEnemy('e4');
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(1); // capped at maxPerZone = 1
  });

  it('does nothing when the zone has no random boss pool', () => {
    useEditorMissionZoneStore.getState().importState({ items: [{ ...ZONE, randomBossPoolId: undefined }] });
    RandomBoss.resetRandomBoss('tz_random');
    spawnDefeatedEnemy('e1'); spawnDefeatedEnemy('e2');
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(0);
    expect(useBossStore.getState().runtime).toBeFalsy();
  });

  it('pauses accrual during a scripted boss segment', () => {
    useEditorZoneSegmentStore.getState().importState({ items: [{ ...COMBAT_SEG, segmentType: 'boss' }] });
    spawnDefeatedEnemy('e1'); spawnDefeatedEnemy('e2');
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(0);
  });
});

describe('RandomBossDirector — dramatic boss environment swap', () => {
  const DAY: EnvironmentThemeDefinition = { id: 'env_seg_day', name: 'Seg Day', themeType: 'sunny-harbor', sky: { preset: 'day' }, lighting: { ambientIntensity: 0.8, directionalIntensity: 1.1 }, ground: { materialPresetId: 'a' }, propSetIds: [], hazardPresetIds: [] };
  const NIGHT: EnvironmentThemeDefinition = { id: 'env_boss_night', name: 'Boss Night', themeType: 'night-city', sky: { preset: 'night', color: '#101a2e' }, lighting: { ambientIntensity: 0.3, directionalIntensity: 0.5 }, ground: { materialPresetId: 'b' }, propSetIds: [], hazardPresetIds: [] };

  beforeEach(() => {
    useEnvironmentThemeStore.getState().importState({ items: [DAY, NIGHT] });
    useEditorEnvironmentStore.getState().reset();
    // Segment carries its own theme; pool swaps to the dramatic night theme during the fight.
    useEditorZoneSegmentStore.getState().importState({ items: [{ ...COMBAT_SEG, environmentThemeId: 'env_seg_day' }] });
    useEditorRandomBossPoolStore.getState().importState({ items: [{ ...POOL, bossEnvironmentThemeId: 'env_boss_night' }] });
    RandomBoss.resetRandomBoss('tz_random');
  });

  it('applies the dramatic theme on drop and restores the segment theme on defeat', () => {
    const area = usePlayerStore.getState().currentAreaId;
    spawnDefeatedEnemy('e1'); spawnDefeatedEnemy('e2');
    RandomBoss.update(0);
    expect(RandomBoss.getRandomBossRuntime().drops).toBe(1);
    // Night boss theme → gradient background while the boss is alive.
    expect(useEditorEnvironmentStore.getState().overrides[area]?.backgroundMode).toBe('gradient');

    BossDirector.defeatBoss();
    RandomBoss.update(0);
    // Segment day theme restored → sky background.
    expect(useEditorEnvironmentStore.getState().overrides[area]?.backgroundMode).toBe('sky');
  });
});
