import { describe, it, expect } from 'vitest';
import {
  evaluateFlightState, resolveCameraAtTime, resolveEventsAtTime, activeEventsAtTime,
  recalcPathDerived, smoothPath, timeToU, getTotalDuration, flightSteerOffset,
} from './flightPhaseRuntime';
import type { FlightCameraKeyframe, FlightPathConfig, FlightTimelineEvent } from '../../types/game/flightPhase';
import { BASE_ORBIT_PHASE } from '../../data/game/flightPhase';

const straight = (overrides: Partial<FlightPathConfig> = {}): FlightPathConfig => ({
  pathId: `t_${Math.random().toString(36).slice(2)}`,
  pathName: 'straight',
  curveType: 'catmullRom',
  closedLoop: false,
  previewResolution: 32,
  totalDistance: 0,
  totalDuration: 0,
  nodes: [
    { nodeId: 'a', nodeName: 'A', position: [0, 0, 0], rotation: [0, 0, 0], speed: 10, waitTime: 0, bankingAngle: 0, flightPose: 'level', eventIds: [] },
    { nodeId: 'b', nodeName: 'B', position: [0, 0, 100], rotation: [0, 0, 0], speed: 10, waitTime: 0, bankingAngle: 0, flightPose: 'level', eventIds: [] },
  ],
  ...overrides,
});

describe('flightPhaseRuntime timing', () => {
  it('derives total duration from length / speed (≈10s for 100 units at 10 u/s)', () => {
    const p = recalcPathDerived(straight());
    expect(p.totalDistance).toBeGreaterThan(95);
    expect(p.totalDistance).toBeLessThan(110);
    expect(p.totalDuration).toBeGreaterThan(9);
    expect(p.totalDuration).toBeLessThan(12);
  });

  it('adds node waitTime to the timeline', () => {
    const noWait = getTotalDuration(straight());
    const withWait = getTotalDuration(straight({
      pathId: 'wait_test',
      nodes: [
        { nodeId: 'a', nodeName: 'A', position: [0, 0, 0], rotation: [0, 0, 0], speed: 10, waitTime: 0, bankingAngle: 0, flightPose: 'level', eventIds: [] },
        { nodeId: 'b', nodeName: 'B', position: [0, 0, 100], rotation: [0, 0, 0], speed: 10, waitTime: 3, bankingAngle: 0, flightPose: 'level', eventIds: [] },
      ],
    }));
    expect(withWait - noWait).toBeGreaterThan(2.5);
    expect(withWait - noWait).toBeLessThan(3.5);
  });

  it('timeToU is monotonic non-decreasing in time', () => {
    const p = straight();
    let prev = -1;
    for (let t = 0; t <= 12; t += 0.25) {
      const { u } = timeToU(p, t);
      expect(u).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = u;
    }
  });
});

describe('flightPhaseRuntime flight state', () => {
  it('produces different craft state at t=5 vs t=5.5 (non-integer scrub works)', () => {
    const p = recalcPathDerived(BASE_ORBIT_PHASE.path);
    const s5 = evaluateFlightState(p, 5);
    const s55 = evaluateFlightState(p, 5.5);
    const moved = Math.hypot(
      s5.position[0] - s55.position[0],
      s5.position[1] - s55.position[1],
      s5.position[2] - s55.position[2],
    );
    expect(moved).toBeGreaterThan(0.1);
  });

  it('moves forward along the straight path over time', () => {
    const p = straight();
    expect(evaluateFlightState(p, 0).position[2]).toBeLessThan(evaluateFlightState(p, 5).position[2]);
    expect(evaluateFlightState(p, 5).position[2]).toBeLessThan(evaluateFlightState(p, 9.5).position[2]);
  });

  it('returns a normalized quaternion', () => {
    const s = evaluateFlightState(straight(), 5);
    const [x, y, z, w] = s.quaternion;
    expect(Math.abs(Math.hypot(x, y, z, w) - 1)).toBeLessThan(1e-3);
  });
});

describe('flightPhaseRuntime camera', () => {
  const keys: FlightCameraKeyframe[] = [
    { keyframeId: 'k0', time: 0, position: [0, 0, 0], rotation: [0, 0, 0], fov: 40, transitionType: 'linear' },
    { keyframeId: 'k1', time: 10, position: [10, 0, 0], rotation: [0, 0, 0], fov: 60, transitionType: 'linear' },
  ];

  it('interpolates position + fov at a fractional time', () => {
    const cam = resolveCameraAtTime(keys, 5.5);
    expect(cam).not.toBeNull();
    expect(cam!.position[0]).toBeCloseTo(5.5, 1);
    expect(cam!.fov).toBeCloseTo(51, 0);
  });

  it('clamps before first / after last keyframe', () => {
    expect(resolveCameraAtTime(keys, -2)!.fov).toBe(40);
    expect(resolveCameraAtTime(keys, 99)!.fov).toBe(60);
  });

  it('returns null with no keyframes', () => {
    expect(resolveCameraAtTime([], 5)).toBeNull();
  });

  it('carries the dominant keyframe camera mode + spanProgress (incl. fractional 5.5s)', () => {
    const modal: FlightCameraKeyframe[] = [
      { keyframeId: 'm0', time: 0, cameraMode: 'orbit', orbitRadius: 8, position: [0, 0, 0], rotation: [0, 0, 0], fov: 50, transitionType: 'linear' },
      { keyframeId: 'm1', time: 10, cameraMode: 'follow', position: [0, 0, 0], rotation: [0, 0, 0], fov: 50, transitionType: 'linear' },
    ];
    expect(resolveCameraAtTime(modal, 2)!.cameraMode).toBe('orbit'); // dominant = first half
    expect(resolveCameraAtTime(modal, 8)!.cameraMode).toBe('follow'); // dominant = second half
    expect(resolveCameraAtTime(modal, 5.5)!.spanProgress).toBeCloseTo(0.55, 2);
  });

  it('derives mode from followTargetId for legacy keyframes', () => {
    expect(resolveCameraAtTime([{ keyframeId: 'c', time: 0, position: [0, 0, 0], rotation: [0, 0, 0], fov: 50, transitionType: 'linear', followTargetId: 'craft' }], 0)!.cameraMode).toBe('follow');
    expect(resolveCameraAtTime([{ keyframeId: 'f', time: 0, position: [0, 0, 0], rotation: [0, 0, 0], fov: 50, transitionType: 'linear' }], 0)!.cameraMode).toBe('fixed');
  });
});

describe('flightPhaseRuntime events', () => {
  const events: FlightTimelineEvent[] = [
    { eventId: 'e1', time: 2, eventType: 'dialogue', payload: {}, previewEnabled: true, triggerOnce: true, enabled: true },
    { eventId: 'e2', time: 5, eventType: 'boostFx', payload: {}, previewEnabled: false, triggerOnce: true, enabled: true },
    { eventId: 'e3', time: 8, eventType: 'nextPhase', payload: {}, previewEnabled: true, triggerOnce: true, enabled: false },
  ];

  it('fires only events crossed in (prevTime, time]', () => {
    const fired = resolveEventsAtTime(events, 6, 1).map((e) => e.eventId);
    expect(fired).toContain('e1');
    expect(fired).toContain('e2');
    expect(fired).not.toContain('e3'); // disabled
  });

  it('respects previewEnabled in preview mode', () => {
    const fired = resolveEventsAtTime(events, 6, 1, true).map((e) => e.eventId);
    expect(fired).toContain('e1');
    expect(fired).not.toContain('e2'); // previewEnabled false
  });

  it('activeEventsAtTime highlights events near a scrub time', () => {
    expect(activeEventsAtTime(events, 2.05, 0.2).map((e) => e.eventId)).toEqual(['e1']);
  });
});

describe('flightPhaseRuntime steering', () => {
  const corridor = straight({
    pathId: 'steer_test',
    nodes: [
      { nodeId: 'a', nodeName: 'A', position: [0, 0, 0], rotation: [0, 0, 0], speed: 10, waitTime: 0, bankingAngle: 0, influenceRadius: 5, flightPose: 'level', eventIds: [] },
      { nodeId: 'b', nodeName: 'B', position: [0, 0, 100], rotation: [0, 0, 0], speed: 10, waitTime: 0, bankingAngle: 0, influenceRadius: 5, flightPose: 'level', eventIds: [] },
    ],
  });

  it('clamps the combined steer offset to influenceRadius', () => {
    const off = flightSteerOffset(corridor, 5, 1, 1); // max lateral + vertical
    expect(Math.hypot(off[0], off[1], off[2])).toBeLessThanOrEqual(5 + 1e-6);
  });

  it('steers laterally (perpendicular to a +Z path → along X)', () => {
    const off = flightSteerOffset(corridor, 5, 1, 0);
    expect(Math.abs(off[0])).toBeGreaterThan(1);
    expect(Math.abs(off[2])).toBeLessThan(1e-3);
  });
});

describe('flightPhaseRuntime smoothing', () => {
  it('drops bezier handles', () => {
    const withHandles = straight({
      pathId: 'smooth_test',
      curveType: 'bezier',
      nodes: straight().nodes.map((n) => ({ ...n, handleOut: [1, 1, 1] as [number, number, number] })),
    });
    const smoothed = smoothPath(withHandles);
    expect(smoothed.nodes.every((n) => n.handleIn === undefined && n.handleOut === undefined)).toBe(true);
  });
});
