import { describe, it, expect, beforeEach } from 'vitest';
import { resolveInteraction, canTransition, type ObstacleProgress } from './ObstacleInteractionController';
import { validateObstacle } from './obstacleValidation';
import * as Director from './ObstacleDirector';
import { useEditorObstacleStore } from '../../stores/game/editorObstacleStore';
import { useObstacleStore, liveObstacles } from '../../stores/game/obstacleStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { SEED_OBSTACLES } from '../../data/obstacles/obstacleDefinitions';

const wall = SEED_OBSTACLES.find((o) => o.id === 'cracked_wall_01')!;
const device = SEED_OBSTACLES.find((o) => o.id === 'corrupted_device_01')!;

beforeEach(() => {
  useEditorObstacleStore.getState().importState({ items: SEED_OBSTACLES });
  useObstacleStore.getState().reset();
  useCombatTargetStore.getState().reset();
});

describe('ObstacleInteractionController', () => {
  const prog = (over: Partial<ObstacleProgress> = {}): ObstacleProgress => ({ state: 'active', hp: 120, maxHp: 120, shield: 0, interactCount: 0, repairAmount: 0, ...over });

  it('repairs the device once the repair threshold is met', () => {
    expect(resolveInteraction(device, prog({ repairAmount: 50 }), 'repair')).toBeNull();
    expect(resolveInteraction(device, prog({ repairAmount: 100 }), 'repair')?.resultState).toBe('repaired');
  });

  it('rejects an illegal transition', () => {
    expect(canTransition(device, 'repaired', 'active', 'interact')).toBe(false);
    expect(canTransition(wall, 'active', 'destroyed', 'damage')).toBe(true);
  });
});

describe('ObstacleDirector', () => {
  it('loads a damageable obstacle with a combat target proxy and destroys it when hp hits 0', () => {
    Director.loadForSegment('seg_cargo_street');
    const obs = liveObstacles.find((o) => o.id === 'cracked_wall_01')!;
    expect(obs).toBeTruthy();
    const proxy = liveTargets.find((t) => t.id === obs.targetId)!;
    expect(proxy.isObstacle).toBe(true);
    proxy.hp = 0; proxy.shield = 0;
    Director.update();
    expect(Director.isDestroyed('cracked_wall_01')).toBe(true);
    Director.cleanup();
  });

  it('repairs the corrupted device via the director', () => {
    Director.loadForSegment('seg_repair_plaza');
    expect(Director.repair('corrupted_device_01', 100)).toBe(true);
    expect(Director.isRepaired('corrupted_device_01')).toBe(true);
    Director.cleanup();
  });
});

describe('validateObstacle', () => {
  it('accepts the seeds', () => {
    for (const o of SEED_OBSTACLES) expect(validateObstacle(o).ok, o.id).toBe(true);
  });
});
