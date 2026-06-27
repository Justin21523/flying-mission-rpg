import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runAbilitySmokeTest } from '../../game/qa/AbilitySmokeTest';
import { runCombatSmokeTest } from '../../game/qa/CombatSmokeTest';

describe('CombatAbilitySmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('confirms combat and ability smoke checks pass', () => {
    const checks = [...runCombatSmokeTest(), ...runAbilitySmokeTest()];
    expect(checks.filter((check) => check.status === 'fail')).toEqual([]);
  });
});
