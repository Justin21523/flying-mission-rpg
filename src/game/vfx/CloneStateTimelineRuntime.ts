import type { CloneStateKeyframe, CloneState, CloneType, ClonePoseModelSet } from '../../types/cloneAbilityTypes';
import { resolveClonePose } from './ClonePoseModelPresets';

// Clone state timeline (Batch F.7). A clone ability is NOT a static ghost — it runs through spawn → pose-switch
// → action → dissolve → cleanup over its lifetime. The cinematic runtime has no keyframe engine (timeline
// keyframes are data-only), so the VISUAL is realised by CloneEffectDirector authoring staggered model layers
// from this schedule. This module is the single source of truth for that schedule (used by the builder,
// validation, and the debug timeline preview).

// The "action" state per clone type (the beat where the clone does its job).
const ACTION_STATE: Record<CloneType, Extract<CloneState, 'attack' | 'defend' | 'support' | 'scan'>> = {
  'attack-double': 'attack',
  'defense-double': 'defend',
  'support-double': 'support',
  'ultimate-double': 'attack',
};

export const REQUIRED_CLONE_STATES: readonly CloneState[] = ['spawn', 'pose-switch', 'dissolve', 'cleanup'];

// Build the default 5-beat timeline for a clone: spawn(idle) → pose-switch(action) → action → dissolve → cleanup.
export function defaultCloneTimeline(cloneType: CloneType, poseSet: ClonePoseModelSet, durationSeconds: number): CloneStateKeyframe[] {
  const action = ACTION_STATE[cloneType];
  const poseForAction =
    cloneType === 'defense-double' ? 'defense'
    : cloneType === 'support-double' ? 'support'
    : cloneType === 'ultimate-double' ? 'ultimate'
    : 'action';
  const d = Math.max(0.4, durationSeconds);
  return [
    { time: 0, state: 'spawn', poseModelId: resolveClonePose(poseSet, 'idle') },
    { time: +(d * 0.3).toFixed(3), state: 'pose-switch', poseModelId: resolveClonePose(poseSet, poseForAction) },
    { time: +(d * 0.4).toFixed(3), state: action, poseModelId: resolveClonePose(poseSet, poseForAction) },
    { time: +(d * 0.7).toFixed(3), state: 'dissolve', poseModelId: resolveClonePose(poseSet, 'dissolve') },
    { time: +d.toFixed(3), state: 'cleanup' },
  ];
}

// True if a timeline covers the required beats (spawn, pose-switch, an action beat, dissolve, cleanup).
export function timelineHasRequiredStates(timeline: CloneStateKeyframe[]): boolean {
  const states = new Set(timeline.map((k) => k.state));
  const hasAction = states.has('attack') || states.has('defend') || states.has('support') || states.has('scan') || states.has('explode');
  return REQUIRED_CLONE_STATES.every((s) => states.has(s)) && hasAction;
}

// The pose-bearing keyframes in time order (used by the effect builder to author one model layer per pose beat).
export function poseKeyframes(timeline: CloneStateKeyframe[]): CloneStateKeyframe[] {
  return timeline.filter((k) => k.poseModelId).sort((a, b) => a.time - b.time);
}
