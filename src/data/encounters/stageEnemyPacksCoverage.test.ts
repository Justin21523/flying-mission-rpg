import { describe, it, expect } from 'vitest';
import { STAGE_ENEMY_SPAWN_GROUPS } from './stageEnemyPacks';

// Content-fill — assert zones 2–10 actually use Wave 1 affixes + Wave 2 squad AI.
describe('stage spawn-group coverage', () => {
  it('every multi-enemy group gained an affix policy', () => {
    const multi = STAGE_ENEMY_SPAWN_GROUPS.filter((g) => g.enemies.reduce((s, e) => s + e.count, 0) >= 2);
    expect(multi.length).toBeGreaterThan(10);
    for (const g of multi) {
      expect(g.affixPolicy, g.id).toBeTruthy();
      expect(g.affixPolicy!.allowedAffixIds.length).toBeGreaterThan(0);
    }
  });

  it('affix density escalates with campaign depth', () => {
    const downtown = STAGE_ENEMY_SPAWN_GROUPS.find((g) => g.zoneId === 'zone_downtown_traffic_collapse' && g.affixPolicy)!;
    const finale = STAGE_ENEMY_SPAWN_GROUPS.find((g) => g.zoneId === 'zone_rescue_vanguard_finale' && g.affixPolicy)!;
    expect(finale.affixPolicy!.chancePerEnemy).toBeGreaterThan(downtown.affixPolicy!.chancePerEnemy);
  });

  it('mixed groups get squad roles; healers are tagged stay-back', () => {
    const healerGroup = STAGE_ENEMY_SPAWN_GROUPS.find((g) => g.squadPolicy && g.enemies.some((e) => e.enemyDefinitionId === 'repair_wisp'));
    expect(healerGroup, 'a healer squad group exists').toBeTruthy();
    const healerRole = healerGroup!.squadPolicy!.roles!.find((r) => r.enemyDefinitionId === 'repair_wisp');
    expect(healerRole?.role).toBe('healer-stay-back');
  });
});
