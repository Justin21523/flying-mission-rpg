import { describe, it, expect } from 'vitest';
import { resolveFlightCues } from './flightCueRunner';
import type { FlightCue } from '../../types/game/flightCue';

const cue = (p: Partial<FlightCue> & Pick<FlightCue, 'id' | 'type' | 'atU'>): FlightCue => p as FlightCue;

describe('resolveFlightCues', () => {
  it('interpolates the camera between two camera cues', () => {
    const cues = [
      cue({ id: 'a', type: 'camera', atU: 0, camDistance: 10, camHeight: 2, camAngleDeg: 0, camFov: 50 }),
      cue({ id: 'b', type: 'camera', atU: 1, camDistance: 20, camHeight: 6, camAngleDeg: 90, camFov: 70 }),
    ];
    const mid = resolveFlightCues(cues, 0.5).camera!;
    expect(mid.distance).toBeCloseTo(15);
    expect(mid.height).toBeCloseTo(4);
    expect(mid.angleDeg).toBeCloseTo(45);
    expect(mid.fov).toBeCloseTo(60);
  });

  it('eases the camera move into the destination cue', () => {
    const cues = [
      cue({ id: 'a', type: 'camera', atU: 0, camDistance: 0 }),
      cue({ id: 'b', type: 'camera', atU: 1, camDistance: 10, easing: 'easeIn' }),
    ];
    // easeIn(0.5) = 0.25 → distance = 2.5 (vs 5 for linear)
    expect(resolveFlightCues(cues, 0.5).camera!.distance).toBeCloseTo(2.5);
  });

  it('holds the nearest camera before the first / after the last cue', () => {
    const cues = [cue({ id: 'a', type: 'camera', atU: 0.4, camDistance: 8 })];
    expect(resolveFlightCues(cues, 0).camera!.distance).toBe(8);
    expect(resolveFlightCues(cues, 1).camera!.distance).toBe(8);
  });

  it('animation/environment use the last cue at or before u (null before the first)', () => {
    const cues = [
      cue({ id: 'a', type: 'animation', atU: 0.3, clipName: 'Fly' }),
      cue({ id: 'b', type: 'animation', atU: 0.7, clipName: 'Loop' }),
      cue({ id: 'e', type: 'environment', atU: 0.5, fogDensity: 0.5 }),
    ];
    expect(resolveFlightCues(cues, 0.1).animation).toBeNull();
    expect(resolveFlightCues(cues, 0.4).animation!.clipName).toBe('Fly');
    expect(resolveFlightCues(cues, 0.9).animation!.clipName).toBe('Loop');
    expect(resolveFlightCues(cues, 0.4).environment).toBeNull();
    expect(resolveFlightCues(cues, 0.6).environment!.fogDensity).toBe(0.5);
  });

  it('marks events firing within the window', () => {
    const cues = [cue({ id: 'ev', type: 'event', atU: 0.5 })];
    const r = resolveFlightCues(cues, 0.5);
    expect(r.events).toHaveLength(1);
    expect(r.activeEventIds).toEqual(['ev']);
    expect(resolveFlightCues(cues, 0.9).activeEventIds).toEqual([]);
  });

  it('no cues → all null/empty', () => {
    const r = resolveFlightCues([], 0.5);
    expect(r.camera).toBeNull();
    expect(r.animation).toBeNull();
    expect(r.environment).toBeNull();
    expect(r.events).toEqual([]);
  });
});
