import { describe, it, expect } from 'vitest';
import { updateSegment, duplicateSegment, removeSegment, replaceSegment } from './routeSegments';
import type { RouteSegment } from '../../../types/game/flight';

const seg = (over: Partial<RouteSegment> = {}): RouteSegment => ({ id: 's1', kind: 'cloud', startU: 0.2, endU: 0.6, ...over });

describe('routeSegments', () => {
  it('clamps startU/endU into 0..1', () => {
    const r = updateSegment(seg(), { startU: -3, endU: 9 });
    expect(r.startU).toBe(0);
    expect(r.endU).toBe(1);
  });

  it('keeps startU < endU when startU is pushed past endU', () => {
    const r = updateSegment(seg({ endU: 0.5 }), { startU: 0.8 });
    expect(r.startU).toBeLessThan(r.endU);
    expect(r.endU).toBe(0.5);
  });

  it('keeps startU < endU when endU is pulled below startU', () => {
    const r = updateSegment(seg({ startU: 0.5 }), { endU: 0.2 });
    expect(r.endU).toBeGreaterThan(r.startU);
    expect(r.startU).toBe(0.5);
  });

  it('passes through unrelated fields', () => {
    const r = updateSegment(seg(), { kind: 'weather', cloudDensity: 2 });
    expect(r.kind).toBe('weather');
    expect(r.cloudDensity).toBe(2);
  });

  it('duplicateSegment makes a fresh id, same content', () => {
    const d = duplicateSegment(seg());
    expect(d.id).not.toBe('s1');
    expect(d.kind).toBe('cloud');
    expect(d.startU).toBe(0.2);
  });

  it('removeSegment drops by id', () => {
    expect(removeSegment([seg(), seg({ id: 's2' })], 's1').map((s) => s.id)).toEqual(['s2']);
  });

  it('replaceSegment updates the matching id with clamping', () => {
    const out = replaceSegment([seg(), seg({ id: 's2' })], 's2', { endU: 5 });
    expect(out.find((s) => s.id === 's2')?.endU).toBe(1);
    expect(out.find((s) => s.id === 's1')?.endU).toBe(0.6);
  });
});
