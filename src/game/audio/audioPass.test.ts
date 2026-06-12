import { describe, it, expect, beforeEach } from 'vitest';
import { getAudioManager } from './AudioManager';
import { setTrack, setAmbient } from './proceduralAudio';
import { validateAudioPreset } from './audioPresetSchema';
import { useAudioStore } from '../../stores/audioStore';
import { useEditorMusicTrackStore } from '../../stores/game/editorMusicStore';
import type { AudioCueDef } from '../../types/audioTypes';

describe('AudioManager same-cue debounce', () => {
  beforeEach(() => {
    useAudioStore.getState().reset();
    const mgr = getAudioManager();
    mgr.syncFromStore();
    mgr.clearPlayHistory();
    mgr.registerCue({ id: 'dbtest', bus: 'ui', volume: 1, loop: false, fallbackSfx: 'ui' } satisfies AudioCueDef);
  });
  it('suppresses a repeat of the same cue inside the debounce window', () => {
    const mgr = getAudioManager();
    expect(mgr.play('dbtest')).toBe(true);
    expect(mgr.play('dbtest')).toBe(false); // immediate repeat → debounced
  });
});

describe('procedural audio (no WebAudio in jsdom)', () => {
  it('setTrack / setAmbient never throw without an AudioContext', () => {
    expect(() => { setTrack('flight'); setAmbient('wind'); setTrack(null); setAmbient(null); }).not.toThrow();
  });
});

describe('audio preset schema — extended fallback palette', () => {
  it('accepts the new gameplay fallback cues', () => {
    const ok = validateAudioPreset({ id: 'p', label: 'P', cues: [
      { id: 'fx.pickup', bus: 'sfx', volume: 0.6, loop: false, fallbackSfx: 'pickup' },
      { id: 'fx.land', bus: 'sfx', volume: 0.7, loop: false, fallbackSfx: 'land' },
    ] });
    expect(ok.ok).toBe(true);
  });
  it('rejects an unknown fallback cue', () => {
    const bad = validateAudioPreset({ id: 'p', label: 'P', cues: [
      { id: 'x', bus: 'sfx', volume: 1, loop: false, fallbackSfx: 'nope' as never },
    ] });
    expect(bad.ok).toBe(false);
  });
});

describe('music track editable params', () => {
  it('exposes seeded tracks the engine reads after merge', () => {
    useEditorMusicTrackStore.getState().mergeMissingFromSeed();
    const flight = useEditorMusicTrackStore.getState().items.find((t) => t.id === 'flight');
    expect(flight).toBeTruthy();
    expect(flight!.tempo).toBeGreaterThan(0);
  });
});
