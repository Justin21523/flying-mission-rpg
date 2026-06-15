import { describe, it, expect, beforeEach } from 'vitest';
import * as Threat from '../../game/support-combat/SupportThreatController';

describe('SupportThreatController', () => {
  beforeEach(() => Threat.reset());

  it('redirects a taunted enemy to the decoy position', () => {
    Threat.applyTaunt(['e1'], { x: 9, z: -3 }, 5, 60); // no model → no spawn (pure)
    expect(Threat.getDecoyTargetFor('e1')).toEqual({ x: 9, z: -3 });
    expect(Threat.isTaunted('e1')).toBe(true);
  });

  it('leaves un-taunted enemies alone', () => {
    Threat.applyTaunt(['e1'], { x: 1, z: 1 }, 5, 60);
    expect(Threat.getDecoyTargetFor('e2')).toBeUndefined();
  });

  it('reverts after the decoy expires', () => {
    Threat.applyTaunt(['e1'], { x: 2, z: 2 }, 0.001, 60);
    Threat.clearExpired((performance.now() + 5000) / 1000);
    expect(Threat.getDecoyTargetFor('e1')).toBeUndefined();
    expect(Threat.activeDecoys()).toHaveLength(0);
  });

  it('a destroyed decoy clears its overrides', () => {
    const id = Threat.applyTaunt(['e1'], { x: 0, z: 0 }, 5, 10);
    Threat.damageDecoy(id, 20);
    Threat.clearExpired();
    expect(Threat.getDecoyTargetFor('e1')).toBeUndefined();
  });
});
