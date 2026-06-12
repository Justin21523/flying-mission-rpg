import { describe, expect, it } from 'vitest';
import { buildAnimationTrackOptions } from './animationTrackOptions';

describe('buildAnimationTrackOptions', () => {
  it('builds stable dropdown options from discovered clips', () => {
    expect(buildAnimationTrackOptions({ clips: ['Idle', 'Fly', 'Idle'] })).toEqual([
      { value: '', label: '(none)' },
      { value: 'Idle', label: 'Idle' },
      { value: 'Fly', label: 'Fly' },
    ]);
  });

  it('preserves a saved clip that is not currently discovered', () => {
    expect(buildAnimationTrackOptions({ clips: ['Idle'], value: 'Wave' })).toContainEqual({
      value: 'Wave',
      label: 'Wave (saved)',
    });
  });

  it('uses a disabled empty state instead of a free-text path', () => {
    expect(buildAnimationTrackOptions({ clips: [] })).toEqual([
      { value: '', label: '(none)' },
      { value: '__no_tracks__', label: '(no tracks detected)', disabled: true },
    ]);
  });

  it('can expose the legacy common fallback as dropdown options', () => {
    const options = buildAnimationTrackOptions({ clips: [], includeCommonFallback: true });
    expect(options.map((option) => option.value)).toEqual(['', 'idle', 'walk', 'run', 'attack', 'wave', 'talk']);
  });
});
