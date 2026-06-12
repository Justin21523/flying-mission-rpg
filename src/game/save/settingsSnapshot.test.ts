import { describe, it, expect } from 'vitest';
import { captureSettingsSnapshot, applySettingsSnapshot } from './settingsSnapshot';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';

describe('settings snapshot capture/apply', () => {
  it('round-trips quality tier + audio volume through the stores', () => {
    useGraphicsSettingsStore.getState().setTier('high');
    useAudioStore.getState().setMasterVolume(0.3);

    const snap = captureSettingsSnapshot();
    expect(snap.qualityTier).toBe('high');
    expect(snap.audio.masterVolume).toBeCloseTo(0.3);

    // Change away, then apply the snapshot — stores should return to the captured values.
    useGraphicsSettingsStore.getState().setTier('low');
    useAudioStore.getState().setMasterVolume(0.9);
    applySettingsSnapshot(snap);

    expect(useGraphicsSettingsStore.getState().tier).toBe('high');
    expect(useAudioStore.getState().masterVolume).toBeCloseTo(0.3);
  });
});
