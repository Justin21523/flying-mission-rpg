import { describe, it, expect } from 'vitest';
import { validateMissionZone } from './zoneValidation';
import type { MissionZoneDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

const seg = (id: string, patch: Partial<ZoneSegmentDefinition> = {}): ZoneSegmentDefinition => ({
  id,
  zoneId: 'z1',
  name: id,
  order: 1,
  segmentType: 'exploration',
  entryConditions: [{ id: `${id}_e`, type: 'always' }],
  completionConditions: [{ id: `${id}_c`, type: 'debug-complete' }],
  nextSegmentIds: [],
  markers: [],
  enabled: true,
  ...patch,
});

const zone = (patch: Partial<MissionZoneDefinition> = {}): MissionZoneDefinition => ({
  id: 'z1',
  locationId: 'loc_test',
  name: 'Zone',
  segmentIds: ['a', 'b'],
  startSegmentId: 'a',
  finalSegmentIds: ['b'],
  zoneMode: 'semi-linear',
  allowBacktracking: true,
  enabled: true,
  ...patch,
});

describe('validateMissionZone', () => {
  it('passes a well-formed zone', () => {
    const segments = [seg('a', { nextSegmentIds: ['b'] }), seg('b', { final: true, order: 2 })];
    const res = validateMissionZone(zone(), segments);
    expect(res.ok).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('fails when startSegmentId does not exist', () => {
    const segments = [seg('a', { nextSegmentIds: ['b'] }), seg('b', { order: 2 })];
    const res = validateMissionZone(zone({ startSegmentId: 'missing' }), segments);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('startSegmentId'))).toBe(true);
  });

  it('fails when finalSegmentIds reference a missing segment', () => {
    const segments = [seg('a', { nextSegmentIds: ['b'] }), seg('b', { order: 2 })];
    const res = validateMissionZone(zone({ finalSegmentIds: ['nope'] }), segments);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('finalSegmentIds'))).toBe(true);
  });

  it('fails when segmentIds reference a missing segment', () => {
    const segments = [seg('a', { nextSegmentIds: ['b'] }), seg('b', { order: 2 })];
    const res = validateMissionZone(zone({ segmentIds: ['a', 'b', 'ghost'] }), segments);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('ghost'))).toBe(true);
  });

  it('fails when a segment has no completion conditions', () => {
    const segments = [seg('a', { nextSegmentIds: ['b'], completionConditions: [] }), seg('b', { order: 2 })];
    const res = validateMissionZone(zone(), segments);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('no completion conditions'))).toBe(true);
  });

  it('fails when a reach-marker condition references a missing marker', () => {
    const segments = [
      seg('a', { nextSegmentIds: ['b'], completionConditions: [{ id: 'rc', type: 'reach-marker', markerId: 'absent', radius: 3 }] }),
      seg('b', { order: 2 }),
    ];
    const res = validateMissionZone(zone(), segments);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('missing marker'))).toBe(true);
  });

  it('warns when a linear zone has multiple next segments', () => {
    const segments = [seg('a', { nextSegmentIds: ['b', 'c'] }), seg('b', { order: 2 }), seg('c', { order: 3 })];
    const res = validateMissionZone(zone({ zoneMode: 'linear', segmentIds: ['a', 'b', 'c'] }), segments);
    expect(res.warnings.some((w) => w.includes('Linear zone'))).toBe(true);
  });
});
