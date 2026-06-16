import { describe, it, expect } from 'vitest';
import { defaultCloneTimeline, timelineHasRequiredStates, poseKeyframes } from '../../game/vfx/CloneStateTimelineRuntime';
import { clonePoseModelSet } from '../../game/vfx/ClonePoseModelPresets';
import { CLONE_TYPES } from '../../types/cloneAbilityTypes';

describe('CloneStateTimelineRuntime (Batch F.7)', () => {
  it('builds a complete spawn → pose-switch → action → dissolve → cleanup timeline for every clone type', () => {
    const set = clonePoseModelSet('char_jett', 'attack-double');
    for (const ct of CLONE_TYPES) {
      const tl = defaultCloneTimeline(ct, set, 1.2);
      expect(timelineHasRequiredStates(tl), ct).toBe(true);
      const states = tl.map((k) => k.state);
      expect(states[0]).toBe('spawn');
      expect(states).toContain('pose-switch');
      expect(states).toContain('dissolve');
      expect(states[states.length - 1]).toBe('cleanup');
    }
  });

  it('the clone visibly SWITCHES pose (spawn pose differs from the action pose when poses exist)', () => {
    const set = clonePoseModelSet('char_jerome', 'attack-double'); // Jerome has 11 poses → distinct
    const tl = defaultCloneTimeline('attack-double', set, 1.2);
    const spawn = tl.find((k) => k.state === 'spawn')?.poseModelId;
    const action = tl.find((k) => k.state === 'pose-switch')?.poseModelId;
    expect(spawn).toBeTruthy();
    expect(action).toBeTruthy();
    expect(action).not.toBe(spawn);
  });

  it('poseKeyframes returns the pose-bearing frames in time order', () => {
    const set = clonePoseModelSet('char_chase', 'support-double');
    const tl = defaultCloneTimeline('support-double', set, 1.4);
    const poses = poseKeyframes(tl);
    expect(poses.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < poses.length; i++) expect(poses[i].time).toBeGreaterThanOrEqual(poses[i - 1].time);
    expect(poses.every((k) => !!k.poseModelId)).toBe(true);
  });

  it('a timeline missing pose-switch / dissolve fails the required-states check', () => {
    expect(timelineHasRequiredStates([{ time: 0, state: 'spawn' }, { time: 1, state: 'cleanup' }])).toBe(false);
  });
});
