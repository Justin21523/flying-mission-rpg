import { describe, it, expect, beforeEach } from 'vitest';
import { getAudioManager } from './AudioManager';
import { useAudioStore } from '../../stores/audioStore';
import type { AudioCueDef } from '../../types/audioTypes';

const FALLBACK_CUE: AudioCueDef = { id: 'test.fallback', bus: 'ui', volume: 1, loop: false, fallbackSfx: 'ui' };
const SILENT_CUE: AudioCueDef = { id: 'test.silent', bus: 'ui', volume: 1, loop: false }; // no asset, no fallback
const LOOP_CUE: AudioCueDef = { id: 'test.loop', bus: 'flight', volume: 1, loop: true };
const MISSING_ASSET_CUE: AudioCueDef = { id: 'test.missing', bus: 'sfx', volume: 1, loop: false, assetId: 'does-not-exist.mp3', fallbackSfx: 'ui' };

beforeEach(() => {
  useAudioStore.getState().reset();
  const mgr = getAudioManager();
  mgr.syncFromStore();
  mgr.clearPlayHistory();
  mgr.registerCue(FALLBACK_CUE);
  mgr.registerCue(SILENT_CUE);
  mgr.registerCue(LOOP_CUE);
  mgr.registerCue(MISSING_ASSET_CUE);
});

describe('AudioManager bus volumes', () => {
  it('reads bus volume from the store after sync', () => {
    const mgr = getAudioManager();
    useAudioStore.getState().setMasterVolume(0.5);
    mgr.syncFromStore();
    expect(mgr.getBusVolume('master')).toBeCloseTo(0.5);
  });
});

describe('AudioManager.play', () => {
  it('triggers a cue with a synth fallback (no audio files needed)', () => {
    expect(getAudioManager().play('test.fallback')).toBe(true);
  });
  it('returns false for a cue with neither asset nor fallback', () => {
    expect(getAudioManager().play('test.silent')).toBe(false);
  });
  it('returns false for an unknown cue', () => {
    expect(getAudioManager().play('nope')).toBe(false);
  });
  it('does not play when muted (master gain 0)', () => {
    const mgr = getAudioManager();
    useAudioStore.getState().toggleMuteAll();
    mgr.syncFromStore();
    expect(mgr.play('test.fallback')).toBe(false);
  });
  it('does not throw on a missing audio asset', () => {
    expect(() => getAudioManager().play('test.missing')).not.toThrow();
  });
});

describe('AudioManager loops', () => {
  it('playLoop returns a handle and stop removes it from the playing count', () => {
    const mgr = getAudioManager();
    const before = mgr.playingCount();
    const h = mgr.playLoop('test.loop');
    expect(h).not.toBeNull();
    expect(mgr.playingCount()).toBe(before + 1);
    h?.stop();
    expect(mgr.playingCount()).toBe(before);
  });
  it('stopAll clears active loops', () => {
    const mgr = getAudioManager();
    mgr.playLoop('test.loop');
    mgr.playLoop('test.loop');
    mgr.stopAll();
    expect(mgr.playingCount()).toBe(0);
  });
});
