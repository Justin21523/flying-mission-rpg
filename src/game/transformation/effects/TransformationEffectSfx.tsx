import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { txFrame, transformationHandle } from '../transformationRuntime';
import { getAudioManager } from '../../audio/AudioManager';
import { playSfx, type SfxName } from '../../audio/sfx';

// Plays each effect's `soundId` once, edge-triggered when the playhead crosses the effect's start time (forward
// only — scrubbing back never fires). Synth SfxName (e.g. 'transform') is guaranteed audible; an id with a '.'
// is treated as an audio cue id ('fx.boost'). One host for all effects (v1 + v2 share the unified `effects`).
function playEffectSound(soundId: string): void {
  if (soundId.includes('.')) getAudioManager().play(soundId);
  else playSfx(soundId as SfxName);
}

export const TransformationEffectSfx = () => {
  const prev = useRef(0);
  useFrame(() => {
    const effects = txFrame.def?.effects;
    const cur = transformationHandle.time;
    if (effects && cur > prev.current && cur - prev.current < 0.5) { // continuous forward step (not a big jump)
      for (const e of effects) {
        if (!e.enabled || !e.soundId) continue;
        const s = e.startTime + (e.delay || 0);
        if (prev.current < s && s <= cur) playEffectSound(e.soundId);
      }
    }
    prev.current = cur;
  });
  return null;
};
