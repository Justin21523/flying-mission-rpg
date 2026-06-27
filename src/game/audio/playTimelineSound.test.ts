import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the two audio backends so we can assert ONLY the routing heuristic (no AudioContext needed).
const { playMock, playSfxMock } = vi.hoisted(() => ({ playMock: vi.fn(), playSfxMock: vi.fn() }));
vi.mock('./AudioManager', () => ({ getAudioManager: () => ({ play: playMock }) }));
vi.mock('./sfx', () => ({ playSfx: playSfxMock }));

import { playTimelineSound } from './playTimelineSound';

describe('playTimelineSound', () => {
  beforeEach(() => { playMock.mockClear(); playSfxMock.mockClear(); });

  it("routes a '.'-id to the AudioManager cue player", () => {
    playTimelineSound('fx.boost');
    expect(playMock).toHaveBeenCalledWith('fx.boost');
    expect(playSfxMock).not.toHaveBeenCalled();
  });

  it('routes a bare id to the synth playSfx', () => {
    playTimelineSound('transform');
    expect(playSfxMock).toHaveBeenCalledWith('transform');
    expect(playMock).not.toHaveBeenCalled();
  });

  it('no-ops on empty string', () => {
    playTimelineSound('');
    expect(playMock).not.toHaveBeenCalled();
    expect(playSfxMock).not.toHaveBeenCalled();
  });
});
