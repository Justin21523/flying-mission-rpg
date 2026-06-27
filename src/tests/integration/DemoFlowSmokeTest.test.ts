import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runDemoFlowSmokeTest } from '../../game/qa/DemoFlowSmokeTest';

describe('DemoFlowSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('runs the core demo flow through Stage 2 unlock', () => {
    const checks = runDemoFlowSmokeTest();
    expect(checks.every((check) => check.status === 'pass')).toBe(true);
  });
});
