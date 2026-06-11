import { describe, it, expect } from 'vitest';
import { worldFlightSceneLayers } from './worldFlightSceneLayers';

describe('worldFlightSceneLayers', () => {
  it('edit mode is a clean authoring view (no clouds/speed/events/gallery; route+craft+gizmos on)', () => {
    const l = worldFlightSceneLayers(true);
    expect(l.clouds).toBe(false);
    expect(l.speed).toBe(false);
    expect(l.events).toBe(false);
    expect(l.eventPreview).toBe(false);
    expect(l.routeFollower).toBe(false);
    expect(l.ambience).toBe('edit');
    expect(l.pathDebug).toBe(true);
    expect(l.editableCraft).toBe(true);
    expect(l.sceneGizmo).toBe(true);
  });

  it('play mode keeps the rich flight visuals and hides edit-only layers', () => {
    const l = worldFlightSceneLayers(false);
    expect(l.clouds).toBe(true);
    expect(l.speed).toBe(true);
    expect(l.events).toBe(true);
    expect(l.routeFollower).toBe(true);
    expect(l.ambience).toBe('play');
    expect(l.editableCraft).toBe(false);
    expect(l.sceneGizmo).toBe(false);
    expect(l.pathDebug).toBe(false);
  });
});
