import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import * as BossDirector from '../../game/bosses/BossDirector';
import * as Weakpoint from '../../game/bosses/BossWeakpointController';
import { useBossStore } from '../../stores/game/useBossStore';
import { buildBossHudViewModel } from '../../ui/boss/BossHudViewModel';

describe('BossHudViewModel', () => {
  beforeEach(() => {
    seedGameContent();
    BossDirector.cleanup();
  });

  it('builds data-driven phase objective and weakpoint state for the boss demo', () => {
    BossDirector.startBoss('harbor_core_sentinel');
    const runtime = useBossStore.getState().runtime!;
    const vm = buildBossHudViewModel(runtime);

    expect(vm.bossName).toBe('Harbor Core Sentinel');
    expect(vm.phaseProgressLabel).toBe('Phase 1/3');
    expect(vm.phaseObjective).toContain('Scan or break the shield');
    expect(vm.counterplay).toContain('Scan');
    expect(vm.weakpoints).toContainEqual(expect.objectContaining({ id: 'wp_core', state: 'hidden' }));
  });

  it('surfaces exposed weakpoints for readable HUD chips', () => {
    BossDirector.startBoss('harbor_core_sentinel');
    Weakpoint.exposeWeakpoint('wp_core', 10);
    const vm = buildBossHudViewModel(useBossStore.getState().runtime!);

    expect(vm.weakpoints).toContainEqual(expect.objectContaining({ id: 'wp_core', state: 'exposed' }));
  });
});
