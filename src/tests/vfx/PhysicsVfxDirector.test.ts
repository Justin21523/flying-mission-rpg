import { describe, it, expect, beforeEach } from 'vitest';
import { spawn, update, cleanupAll, livePhysicsObjects, physicsActiveCount } from '../../game/vfx/physics/PhysicsVfxDirector';
import { makeBall } from '../../game/vfx/physics/PhysicsBallRuntime';
import { makeAssemblyPanels } from '../../game/vfx/physics/PhysicsPanelRuntime';
import { makeRubble } from '../../game/vfx/physics/PhysicsRubbleRuntime';

const origin = { x: 0, y: 2, z: 0, dirX: 1, dirZ: 0 };

describe('PhysicsVfxDirector', () => {
  beforeEach(() => cleanupAll());

  it('spawns the requested object count + tracks the pool', () => {
    spawn(makeRubble('todd_rubble', '#aa8855', 12), origin);
    expect(livePhysicsObjects).toHaveLength(12);
    expect(physicsActiveCount()).toBe(12);
  });

  it('Flip ball bounces off the ground (restitution flips vy positive)', () => {
    spawn(makeBall('flip_ball', '#ff8800', 1), origin);
    const ball = livePhysicsObjects[0];
    ball.y = 0.05;
    ball.vy = -8;
    update(0.1);
    expect(ball.vy).toBeGreaterThan(0);
    expect(ball.y).toBeGreaterThanOrEqual(0);
  });

  it('Donnie build-cover spawns assemble-behavior panels that ease toward center', () => {
    spawn(makeAssemblyPanels('donnie_panels', '#ffaa33', 6), { x: 0, y: 0, z: 0, dirX: 1, dirZ: 0 });
    const panel = livePhysicsObjects[0];
    expect(panel.behavior).toBe('assemble');
    const dist0 = Math.hypot(panel.x - panel.cx, panel.z - panel.cz);
    for (let i = 0; i < 10; i++) update(0.05);
    const dist1 = Math.hypot(panel.x - panel.cx, panel.z - panel.cz);
    expect(dist1).toBeLessThan(dist0);
  });

  it('cleanupAll clears live objects + the pool', () => {
    spawn(makeRubble('r', '#fff', 8), origin);
    expect(livePhysicsObjects.length).toBeGreaterThan(0);
    cleanupAll();
    expect(livePhysicsObjects).toHaveLength(0);
    expect(physicsActiveCount()).toBe(0);
  });

  it('refuses to spawn beyond the pool cap', () => {
    expect(spawn(makeRubble('huge', '#fff', 999), origin)).toBe(false);
    expect(livePhysicsObjects).toHaveLength(0);
  });
});
