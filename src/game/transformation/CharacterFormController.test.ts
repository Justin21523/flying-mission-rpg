import { describe, it, expect } from 'vitest';
import { CharacterFormController } from './CharacterFormController';

describe('CharacterFormController', () => {
  it('begins in plane form with plane controller/collider active', () => {
    const c = new CharacterFormController();
    expect(c.getCurrentForm()).toBe('plane');
    expect(c.planeControllerActive).toBe(true);
    expect(c.robotControllerActive).toBe(false);
  });

  it('beginTransform → transforming and stops plane input', () => {
    const c = new CharacterFormController();
    c.beginTransform();
    expect(c.getCurrentForm()).toBe('transforming');
    expect(c.planeControllerActive).toBe(false);
  });

  it('switchToRobotForm disables plane + enables robot (controller + collider)', () => {
    const c = new CharacterFormController();
    c.beginTransform();
    c.switchToRobotForm();
    expect(c.getCurrentForm()).toBe('robot');
    expect(c.planeControllerActive).toBe(false);
    expect(c.robotControllerActive).toBe(true);
    expect(c.planeColliderActive).toBe(false);
    expect(c.robotColliderActive).toBe(true);
    expect(c.modelVisible.robot).toBe(true);
    expect(c.modelVisible.plane).toBe(false);
  });

  it('never has two controllers or two colliders active at once', () => {
    const c = new CharacterFormController();
    expect(c.hasControllerConflict()).toBe(false);
    expect(c.hasColliderConflict()).toBe(false);
    c.beginTransform();
    c.switchToRobotForm();
    expect(c.hasControllerConflict()).toBe(false);
    expect(c.hasColliderConflict()).toBe(false);
  });

  it('reset returns to plane form', () => {
    const c = new CharacterFormController();
    c.beginTransform();
    c.switchToRobotForm();
    c.reset();
    expect(c.getCurrentForm()).toBe('plane');
    expect(c.planeControllerActive).toBe(true);
    expect(c.robotColliderActive).toBe(false);
  });
});
