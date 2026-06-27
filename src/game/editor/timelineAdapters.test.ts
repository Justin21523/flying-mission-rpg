import { describe, expect, it } from 'vitest';
import { rekeyEffect, rekeyEffects, rekeyFlightEvent, rekeyFlightCameraKey, rekeySkillEvent } from './timelineAdapters';
import { createDefaultEffectConfig } from '../transformation/effects/createEffect';
import type { FlightTimelineEvent, FlightCameraKeyframe } from '../../types/game/flightPhase';
import type { SkillTimelineEvent } from '../../types/game/combat';

describe('timelineAdapters — transformation re-keying', () => {
  it('gives a fresh effectId but preserves every other field', () => {
    const e = { ...createDefaultEffectConfig('clone_burst_effect', 1.5, 2), effectName: 'My FX', color: '#abcdef' };
    const out = rekeyEffect(e);
    expect(out.effectId).not.toBe(e.effectId);
    expect(out.effectName).toBe('My FX');
    expect(out.startTime).toBe(1.5);
    expect(out.layerOrder).toBe(2);
    expect(out.color).toBe('#abcdef');
    expect(out.effectType).toBe(e.effectType);
  });

  it('re-keys a list so every id is unique', () => {
    const list = [createDefaultEffectConfig('clone_burst_effect'), createDefaultEffectConfig('starburst_effect')];
    const out = rekeyEffects(list);
    const ids = new Set([...list, ...out].map((e) => e.effectId));
    expect(ids.size).toBe(4); // 2 originals + 2 fresh, all distinct
  });
});

describe('timelineAdapters — flight re-keying', () => {
  it('rekeyFlightEvent gives a fresh ev_ id and preserves other fields', () => {
    const e: FlightTimelineEvent = { eventId: 'ev_old', time: 3.2, eventType: 'dialogue', payload: { text: 'hi' }, soundId: 'boost', previewEnabled: true, triggerOnce: true, enabled: true };
    const out = rekeyFlightEvent(e);
    expect(out.eventId).not.toBe('ev_old');
    expect(out.eventId.startsWith('ev_')).toBe(true);
    expect(out.time).toBe(3.2);
    expect(out.eventType).toBe('dialogue');
    expect(out.soundId).toBe('boost');
    expect(out.payload).toEqual({ text: 'hi' });
  });

  it('rekeyFlightCameraKey gives a fresh cam_ id, CLEARS nodeId, preserves shot fields', () => {
    const k: FlightCameraKeyframe = { keyframeId: 'cam_old', time: 1, nodeId: 'node_7', position: [1, 2, 3], rotation: [0, 0, 0], fov: 55, transitionType: 'easeInOut', followTargetId: 'craft' };
    const out = rekeyFlightCameraKey(k);
    expect(out.keyframeId).not.toBe('cam_old');
    expect(out.keyframeId.startsWith('cam_')).toBe(true);
    expect(out.nodeId).toBeUndefined(); // never double-binds a node
    expect(out.position).toEqual([1, 2, 3]);
    expect(out.fov).toBe(55);
    expect(out.followTargetId).toBe('craft');
  });

  it('rekeySkillEvent gives a fresh sev_ id and preserves other fields', () => {
    const e: SkillTimelineEvent = { eventId: 'sev_old', name: 'Boom', timeSeconds: 0.4, kind: 'effect', effectDefinitionId: 'fx_1', enabled: true };
    const out = rekeySkillEvent(e);
    expect(out.eventId).not.toBe('sev_old');
    expect(out.eventId.startsWith('sev_')).toBe(true);
    expect(out.name).toBe('Boom');
    expect(out.timeSeconds).toBe(0.4);
    expect(out.kind).toBe('effect');
    expect(out.effectDefinitionId).toBe('fx_1');
  });
});
