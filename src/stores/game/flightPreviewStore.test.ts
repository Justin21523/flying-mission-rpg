import { describe, it, expect, beforeEach } from 'vitest';
import { useFlightPreviewStore } from './flightPreviewStore';

describe('flightPreviewStore', () => {
  beforeEach(() => useFlightPreviewStore.setState({ u: 0, playing: false, rangeEnd: null, speed: 0.1, follow: true }));

  it('advance increases u by dt·speed while playing', () => {
    useFlightPreviewStore.getState().play();
    useFlightPreviewStore.getState().advance(1); // +0.1
    expect(useFlightPreviewStore.getState().u).toBeCloseTo(0.1, 5);
  });

  it('advance loops back near 0 past the end', () => {
    useFlightPreviewStore.setState({ u: 0.95, playing: true, rangeEnd: null, speed: 0.1, follow: true });
    useFlightPreviewStore.getState().advance(1); // 0.95 + 0.1 = 1.05 → -1 = 0.05
    expect(useFlightPreviewStore.getState().u).toBeCloseTo(0.05, 5);
  });

  it('advance is a no-op when paused', () => {
    useFlightPreviewStore.setState({ u: 0.3, playing: false, rangeEnd: null, speed: 0.1, follow: true });
    useFlightPreviewStore.getState().advance(1);
    expect(useFlightPreviewStore.getState().u).toBe(0.3);
  });

  it('scrub sets u + clears playing; stop resets to 0', () => {
    useFlightPreviewStore.getState().play();
    useFlightPreviewStore.getState().scrub(0.7);
    expect(useFlightPreviewStore.getState().u).toBe(0.7);
    expect(useFlightPreviewStore.getState().playing).toBe(false);
    useFlightPreviewStore.getState().stop();
    expect(useFlightPreviewStore.getState().u).toBe(0);
  });

  it('plays a bounded u range and stops at the range end', () => {
    useFlightPreviewStore.getState().playRange(0.25, 0.35);
    useFlightPreviewStore.getState().advance(0.5);
    expect(useFlightPreviewStore.getState().u).toBeCloseTo(0.3, 5);
    expect(useFlightPreviewStore.getState().playing).toBe(true);

    useFlightPreviewStore.getState().advance(1);
    expect(useFlightPreviewStore.getState().u).toBeCloseTo(0.35, 5);
    expect(useFlightPreviewStore.getState().playing).toBe(false);
    expect(useFlightPreviewStore.getState().rangeEnd).toBeNull();
  });
});
