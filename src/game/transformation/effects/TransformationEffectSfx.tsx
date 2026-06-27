import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { txFrame, transformationHandle } from '../transformationRuntime';
import { playTimelineSound } from '../../audio/playTimelineSound';

// Plays each effect's `soundId` once, edge-triggered when the playhead crosses the effect's start time (forward
// only — scrubbing back never fires). Routing (synth SfxName vs '.'-cue id) lives in the shared playTimelineSound.
// One host for all effects (v1 + v2 share the unified `effects`).
export const TransformationEffectSfx = () => {
  const prev = useRef(0);
  useFrame(() => {
    const effects = txFrame.def?.effects;
    const cur = transformationHandle.time;
    if (effects && cur > prev.current && cur - prev.current < 0.5) { // continuous forward step (not a big jump)
      for (const e of effects) {
        if (!e.enabled || !e.soundId) continue;
        const s = e.startTime + (e.delay || 0);
        if (prev.current < s && s <= cur) playTimelineSound(e.soundId);
      }
    }
    prev.current = cur;
  });
  return null;
};
