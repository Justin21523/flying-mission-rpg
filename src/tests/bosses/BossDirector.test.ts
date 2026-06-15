import { describe, it, expect, beforeEach } from 'vitest';
import * as BossDirector from '../../game/bosses/BossDirector';
import { useBossStore } from '../../stores/game/useBossStore';
import {
  useBossDefinitionStore, useBossPhaseStore, useBossWeakpointStore, useBossAttackStore, useBossArenaStore, useBossSummonWaveStore,
} from '../../stores/game/useBossEditorStore';
import { useEditorEnemyStore, useEditorSpawnGroupStore } from '../../stores/game/editorCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { resetSpawnDirector } from '../../game/combat/enemySpawnDirector';
import { SEED_BOSSES } from '../../data/bosses/bossDefinitions';
import { SEED_BOSS_PHASES } from '../../data/bosses/bossPhaseDefinitions';
import { SEED_BOSS_WEAKPOINTS } from '../../data/bosses/bossWeakpointDefinitions';
import { SEED_BOSS_ATTACK_PATTERNS } from '../../data/bosses/bossAttackPatterns';
import { SEED_BOSS_ARENAS } from '../../data/bosses/bossArenaDefinitions';
import { SEED_BOSS_SUMMON_WAVES } from '../../data/bosses/bossSummonWaves';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';
import { SEED_ENEMY_SPAWN_GROUPS } from '../../data/combat/enemySpawnGroups';

beforeEach(() => {
  useBossDefinitionStore.getState().importState({ items: SEED_BOSSES, seeded: true });
  useBossPhaseStore.getState().importState({ items: SEED_BOSS_PHASES, seeded: true });
  useBossWeakpointStore.getState().importState({ items: SEED_BOSS_WEAKPOINTS, seeded: true });
  useBossAttackStore.getState().importState({ items: SEED_BOSS_ATTACK_PATTERNS, seeded: true });
  useBossArenaStore.getState().importState({ items: SEED_BOSS_ARENAS, seeded: true });
  useBossSummonWaveStore.getState().importState({ items: SEED_BOSS_SUMMON_WAVES, seeded: true });
  useEditorEnemyStore.getState().importState({ items: SEED_ENEMIES, seeded: true });
  useEditorSpawnGroupStore.getState().importState({ items: SEED_ENEMY_SPAWN_GROUPS, seeded: true });
  useCombatTargetStore.getState().reset();
  useAdvancedMissionZoneStore.setState({ defeatedBossIds: [], completedBossPhaseIds: [], destroyedBossWeakpointIds: [], clearedBossWaveIds: [], usedSupportAbilityIds: [] });
  resetSpawnDirector();
  BossDirector.cleanup();
});

describe('BossDirector — full Harbor Core Sentinel flow', () => {
  it('runs phase 1 → 2 → 3 → defeated and records the zone condition', () => {
    BossDirector.startBoss('harbor_core_sentinel');
    let rt = useBossStore.getState().runtime!;
    expect(rt.status).toBe('active');
    expect(rt.activePhaseId).toBe('phase_harbor_p1');

    // Phase 1: expose + destroy the shield core.
    const wpCore = liveTargets.find((t) => t.bossWeakpointId === 'wp_core');
    expect(wpCore).toBeTruthy();
    BossDirector.debugExposeWeakpoint('wp_core');
    wpCore!.hp = 0;
    BossDirector.update();
    rt = useBossStore.getState().runtime!;
    expect(rt.destroyedWeakpointIds).toContain('wp_core');
    expect(rt.activePhaseId).toBe('phase_harbor_p2');

    // Phase 2: clear the summoned wave.
    const waveEnemies = liveTargets.filter((t) => t.spawnGroupId === 'harbor_core_wave_01');
    expect(waveEnemies.length).toBeGreaterThan(0);
    for (const e of waveEnemies) e.defeatedAt = 1;
    BossDirector.update();
    rt = useBossStore.getState().runtime!;
    expect(rt.clearedSummonWaveIds).toContain('wave_harbor_summon');
    expect(rt.activePhaseId).toBe('phase_harbor_p3');

    // Phase 3: destroy the overload core (final).
    const wpOverload = liveTargets.find((t) => t.bossWeakpointId === 'wp_overload');
    expect(wpOverload).toBeTruthy();
    wpOverload!.hp = 0;
    BossDirector.update();
    rt = useBossStore.getState().runtime!;
    expect(rt.status).toBe('defeated');
    expect(useAdvancedMissionZoneStore.getState().defeatedBossIds).toContain('harbor_core_sentinel');
  });

  it('defeats the boss when its HP reaches zero', () => {
    BossDirector.startBoss('harbor_core_sentinel');
    BossDirector.debugForcePhase('phase_harbor_p3'); // non-invulnerable phase
    BossDirector.debugDamageBoss(99999);
    BossDirector.update();
    expect(useBossStore.getState().runtime!.status).toBe('defeated');
  });
});
