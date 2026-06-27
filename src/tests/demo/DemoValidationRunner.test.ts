import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runDemoValidationChecklist } from '../../game/demo/DemoValidationRunner';

describe('DemoValidationRunner', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('passes core demo checklist items and leaves build as external warning', () => {
    const report = runDemoValidationChecklist();
    expect(report.items.find((item) => item.id === 'campaign-map-loads')?.status).toBe('pass');
    expect(report.items.find((item) => item.id === 'stage-1-unlocked')?.status).toBe('pass');
    expect(report.items.find((item) => item.id === 'debug-hidden-in-demo')?.status).toBe('pass');
    expect(report.items.find((item) => item.id === 'build-succeeds')?.status).toBe('warning');
    expect(report.status).toBe('warning');
  });
});
