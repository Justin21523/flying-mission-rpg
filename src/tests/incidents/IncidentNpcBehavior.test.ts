import { describe, it, expect, beforeEach } from 'vitest';
import { tickNpcBehavior } from '../../game/incidents/IncidentNpcBehaviorController';
import { useIncidentNpcStateStore } from '../../stores/useIncidentNpcStateStore';
import { robotHandle } from '../../game/destination/robotHandle';
import type { IncidentPlan } from '../../types/aiIncidentTypes';

const PLAN = { affectedArea: { areaId: 'incident_area_main', center: [0, 0, 0], radius: 8 } } as unknown as IncidentPlan;
const dist = (p: [number, number, number]) => Math.hypot(p[0], p[2]);

describe('IncidentNpcBehaviorController (Batch H)', () => {
  // Keep the player far (in XZ) by default so behavior tests aren't perturbed by the rescue-proximity rule.
  beforeEach(() => { useIncidentNpcStateStore.getState().clearAll(); robotHandle.pos.set(100, 0, 100); });

  it('a panicked NPC flees away from the danger centre', () => {
    useIncidentNpcStateStore.getState().setNpc('n1', { state: 'panicked', position: [3, 0, 0] });
    for (let i = 0; i < 5; i++) tickNpcBehavior(PLAN, 0.1, i * 100);
    expect(dist(useIncidentNpcStateStore.getState().npcs.n1.position)).toBeGreaterThan(3);
  });

  it('an evacuating NPC moves to safety and becomes safe', () => {
    useIncidentNpcStateStore.getState().setNpc('n2', { state: 'evacuating', position: [3, 0, 0] });
    for (let i = 0; i < 60; i++) tickNpcBehavior(PLAN, 0.1, i * 100);
    expect(useIncidentNpcStateStore.getState().npcs.n2.state).toBe('safe');
  });

  it('player proximity rescues a trapped NPC (trapped → waiting → evacuating)', () => {
    useIncidentNpcStateStore.getState().setNpc('n3', { state: 'trapped', position: [5, 0, 5] });
    robotHandle.pos.set(5, 0, 5);
    tickNpcBehavior(PLAN, 0.1, 0);
    expect(useIncidentNpcStateStore.getState().npcs.n3.state).toBe('waiting-rescue');
    tickNpcBehavior(PLAN, 0.1, 100);
    expect(useIncidentNpcStateStore.getState().npcs.n3.state).toBe('evacuating');
  });

  it('panic spreads to a nearby waiting NPC over time', () => {
    // A trapped source stays put (a reliable fear source); the neighbour panics after the threshold.
    useIncidentNpcStateStore.getState().setNpc('src', { state: 'trapped', position: [1, 0, 0] });
    useIncidentNpcStateStore.getState().setNpc('nb', { state: 'waiting-rescue', position: [2, 0, 0] });
    for (let i = 0; i < 25; i++) tickNpcBehavior(PLAN, 0.1, i * 100);
    expect(useIncidentNpcStateStore.getState().npcs.nb.state).toBe('panicked');
  });
});
