import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runBossLifecycleSmokeTest } from '../../game/qa/BossLifecycleSmokeTest';
import { runEnemyLifecycleSmokeTest } from '../../game/qa/EnemyLifecycleSmokeTest';
import { runObstacleLifecycleSmokeTest } from '../../game/qa/ObstacleLifecycleSmokeTest';

describe('EnemyObstacleBossSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('confirms enemy, obstacle, and boss lifecycle smoke checks pass', () => {
    const checks = [...runEnemyLifecycleSmokeTest(), ...runObstacleLifecycleSmokeTest(), ...runBossLifecycleSmokeTest()];
    expect(checks.filter((check) => check.status === 'fail')).toEqual([]);
  });
});
