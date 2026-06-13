import { describe, expect, it } from 'vitest';
import {
  applyCameraTimeTrack,
  applyCraftTimeTrack,
  evaluateFlightTimeTrack,
  removeFlightTimeKeyframeAt,
  removeFlightTimeTrack,
  upsertFlightTimeKeyframe,
} from './flightTimeTracks';

describe('flightTimeTracks', () => {
  it('upserts and interpolates craft transform keyframes on route progress u', () => {
    let tracks = upsertFlightTimeKeyframe(undefined, { kind: 'craft' }, 0.25, {
      position: [0, 1, 2],
      rotation: [0, 10, 0],
      scale: 2,
    });
    tracks = upsertFlightTimeKeyframe(tracks, { kind: 'craft' }, 0.75, {
      position: [10, 1, 2],
      rotation: [0, 30, 0],
      scale: 4,
    });

    const transform = applyCraftTimeTrack({ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }, tracks, 0.5);
    expect(transform.position[0]).toBeCloseTo(5);
    expect(transform.rotation[1]).toBeCloseTo(20);
    expect(transform.scale).toBeCloseTo(3);
  });

  it('applies camera config tracks without changing missing fields', () => {
    const tracks = upsertFlightTimeKeyframe(undefined, { kind: 'camera' }, 0.4, { distance: 8, angleDeg: 45 });
    const camera = applyCameraTimeTrack({ distance: 2, height: 1, angleDeg: 0 }, tracks, 0.4);
    expect(camera).toEqual({ distance: 8, height: 1, angleDeg: 45 });
  });

  it('removes a single keyframe or an entire target track', () => {
    let tracks = upsertFlightTimeKeyframe(undefined, { kind: 'craft' }, 0.2, { scale: 2 });
    tracks = upsertFlightTimeKeyframe(tracks, { kind: 'craft' }, 0.4, { scale: 4 });
    tracks = removeFlightTimeKeyframeAt(tracks, { kind: 'craft' }, 0.2);

    expect(evaluateFlightTimeTrack(tracks[0], 0.2)?.scale).toBe(4);
    expect(removeFlightTimeTrack(tracks, { kind: 'craft' })).toEqual([]);
  });
});

