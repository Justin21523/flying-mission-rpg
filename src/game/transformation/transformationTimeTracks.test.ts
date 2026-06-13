import { describe, expect, it } from 'vitest';
import { makeTimeline } from './testFixture';
import {
  applyTransformationTimeTracks,
  evaluateTimeTrack,
  keyForTimeTrackTarget,
  removeTimeKeyframeAt,
  removeTimeTrack,
  targetFromTransformationKey,
  timeTrackIdForTarget,
  upsertTimeKeyframe,
} from './transformationTimeTracks';
import { transformPartKey } from './transformPartKey';
import type { TransformationTimeTrackTarget } from '../../types/game/transformation';

describe('transformation time tracks', () => {
  it('stores independent current-time keyframes for the same target', () => {
    const target: TransformationTimeTrackTarget = { kind: 'part', partKey: 'wing_left' };
    const tracks = upsertTimeKeyframe(undefined, target, 5, { position: [1, 0, 0] });
    const next = upsertTimeKeyframe(tracks, target, 5.5, { position: [2, 0, 0] });

    const track = next[0];
    expect(track?.id).toBe(timeTrackIdForTarget(target));
    expect(track?.keyframes.map((frame) => frame.time)).toEqual([5, 5.5]);
    expect(evaluateTimeTrack(track, 5)?.position).toEqual([1, 0, 0]);
    expect(evaluateTimeTrack(track, 5.5)?.position).toEqual([2, 0, 0]);
  });

  it('interpolates linearly by default and supports hold tracks', () => {
    const target: TransformationTimeTrackTarget = { kind: 'root' };
    const tracks = upsertTimeKeyframe(
      upsertTimeKeyframe(undefined, target, 5, { position: [0, 0, 0] }),
      target,
      5.5,
      { position: [1, 0, 0] },
    );
    expect(evaluateTimeTrack(tracks[0], 5.25)?.position?.[0]).toBeCloseTo(0.52);
    const hold = { ...tracks[0]!, interpolation: 'hold' as const };
    expect(evaluateTimeTrack(hold, 5.25)?.position?.[0]).toBeCloseTo(0);
  });

  it('keeps target identity independent from the timeline id', () => {
    const def = makeTimeline();
    const key = transformPartKey(def.id, 'wing_left');
    const target = targetFromTransformationKey(def, key);
    expect(target).toEqual({ kind: 'part', partKey: 'wing_left' });
    expect(target && keyForTimeTrackTarget('xf_copy', target)).toContain('xf_copy__wing_left');
  });

  it('applies track overlays to legacy timeline data without mutating the source', () => {
    const def = makeTimeline({
      timeTracks: upsertTimeKeyframe(undefined, { kind: 'part', partKey: 'wing_left' }, 5, {
        position: [3, 2, 1],
        rotation: [0, 30, 0],
        scale: 1.5,
      }),
    });
    const applied = applyTransformationTimeTracks(def, 5);
    expect(applied.parts[0]?.basePosition).toEqual([3, 2, 1]);
    expect(applied.parts[0]?.baseRotation).toEqual([0, 30, 0]);
    expect(applied.parts[0]?.baseScale).toBe(1.5);
    expect(def.parts[0]?.basePosition).toEqual([0, 0, 0]);
  });

  it('applies current-time keyframes to camera-shot stages', () => {
    const def = makeTimeline({
      stages: [
        {
          id: 'stage_cam',
          type: 'camera-shot',
          startTime: 0,
          duration: 1,
          enabled: true,
          params: { cameraShotType: 'orbit', distance: 5, height: 2, angle: 0, fov: 50 },
        },
      ],
      timeTracks: [
        ...upsertTimeKeyframe(undefined, { kind: 'camera-shot', shotId: 'stage_cam' }, 5, { position: [8, 4, 0] }),
        ...upsertTimeKeyframe(undefined, { kind: 'camera-look', shotId: 'stage_cam' }, 5, { position: [0, 1.5, 0] }),
      ],
    });
    const applied = applyTransformationTimeTracks(def, 5);
    const stage = applied.stages[0];
    expect(stage?.params.distance).toBeCloseTo(8, 1);
    expect(stage?.params.height).toBeCloseTo(4, 1);
    expect(stage?.params.angle).toBeCloseTo(90, 1);
    expect(stage?.params.lookAtOffset).toEqual([0, 1.5, 0]);
  });

  it('removes a keyframe or a full track', () => {
    const target: TransformationTimeTrackTarget = { kind: 'root' };
    const tracks = upsertTimeKeyframe(
      upsertTimeKeyframe(undefined, target, 5, { position: [0, 0, 0] }),
      target,
      5.5,
      { position: [1, 0, 0] },
    );
    const oneLeft = removeTimeKeyframeAt(tracks, target, 5);
    expect(oneLeft[0]?.keyframes.map((frame) => frame.time)).toEqual([5.5]);
    expect(removeTimeTrack(oneLeft, target)).toEqual([]);
  });
});
