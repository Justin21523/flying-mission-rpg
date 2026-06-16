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
import { validateBoss } from '../../game/bosses/BossValidation';
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

describe('Glitch Hive Tyrant (Batch I 2nd boss)', () => {
  it('the boss content validates', () => {
    const boss = SEED_BOSSES.find((b) => b.id === 'glitch_hive_tyrant')!;
    const lk = {
      arenaExists: (id: string) => SEED_BOSS_ARENAS.some((a) => a.id === id),
      phaseExists: (id: string) => SEED_BOSS_PHASES.some((p) => p.id === id),
      weakpointExists: (id: string) => SEED_BOSS_WEAKPOINTS.some((w) => w.id === id),
      attackExists: (id: string) => SEED_BOSS_ATTACK_PATTERNS.some((a) => a.id === id),
      waveExists: (id: string) => SEED_BOSS_SUMMON_WAVES.some((w) => w.id === id),
    };
    const r = validateBoss(boss, lk);
    expect(r.ok, r.errors.join(', ')).toBe(true);
  });

  it('runs phase 1 → 2 → 3 → defeated and records the zone condition', () => {
    BossDirector.startBoss('glitch_hive_tyrant');
    let rt = useBossStore.getState().runtime!;
    expect(rt.status).toBe('active');
    expect(rt.activePhaseId).toBe('phase_glitch_p1');

    const wpNode = liveTargets.find((t) => t.bossWeakpointId === 'wp_hive_node');
    expect(wpNode).toBeTruthy();
    BossDirector.debugExposeWeakpoint('wp_hive_node');
    wpNode!.hp = 0;
    BossDirector.update();
    rt = useBossStore.getState().runtime!;
    expect(rt.destroyedWeakpointIds).toContain('wp_hive_node');
    expect(rt.activePhaseId).toBe('phase_glitch_p2');

    const wave = liveTargets.filter((t) => t.spawnGroupId === 'glitch_hive_wave_01');
    expect(wave.length).toBeGreaterThan(0);
    for (const e of wave) e.defeatedAt = 1;
    BossDirector.update();
    rt = useBossStore.getState().runtime!;
    expect(rt.clearedSummonWaveIds).toContain('wave_glitch_summon');
    expect(rt.activePhaseId).toBe('phase_glitch_p3');

    const wpCore = liveTargets.find((t) => t.bossWeakpointId === 'wp_hive_core');
    expect(wpCore).toBeTruthy();
    wpCore!.hp = 0;
    BossDirector.update();
    rt = useBossStore.getState().runtime!;
    expect(rt.status).toBe('defeated');
    expect(useAdvancedMissionZoneStore.getState().defeatedBossIds).toContain('glitch_hive_tyrant');
  });
});
