import { describe, it, expect } from 'vitest';
import { trackForPhase, ambientForPhase } from './MusicDirector';

describe('trackForPhase', () => {
  it('maps menu / hangar / flight / destination / results / pause', () => {
    expect(trackForPhase('MISSION_CONTROL')).toBe('menu');
    expect(trackForPhase('HANGAR')).toBe('hangar');
    expect(trackForPhase('WORLD_FLIGHT')).toBe('flight');
    expect(trackForPhase('TRANSFORMATION')).toBe('flight');
    expect(trackForPhase('MISSION_GAMEPLAY')).toBe('destination');
    expect(trackForPhase('MISSION_RESULTS')).toBe('results');
    expect(trackForPhase('PAUSED')).toBe('pause');
  });
  it('returns null for ERROR (silence)', () => {
    expect(trackForPhase('ERROR')).toBeNull();
  });
});

describe('ambientForPhase', () => {
  it('uses wind in flight, storm/night by weather', () => {
    expect(ambientForPhase('WORLD_FLIGHT')).toBe('wind');
    expect(ambientForPhase('WORLD_FLIGHT', 'storm')).toBe('storm');
    expect(ambientForPhase('WORLD_FLIGHT', 'night')).toBe('night');
  });
  it('uses city in destination and null elsewhere', () => {
    expect(ambientForPhase('MISSION_GAMEPLAY')).toBe('city');
    expect(ambientForPhase('MISSION_CONTROL')).toBeNull();
  });
});
