import type { TrafficSignalDef } from '../../types/traffic';

// POLI RPG — Brooms Town traffic signal definitions.
// Signals are staggered (initialTimer offset) so they're not in sync.
// GameAdaptation: no official town layout; signal positions designed for playability.
export const TRAFFIC_SIGNALS: TrafficSignalDef[] = [
  {
    id: 'signal_main_road_center',
    areaId: 'main_road',
    position: [0, 0, 1],
    pathId: 'path_main_road',
    progressOnPath: 0.15,
    initialPhase: 'green',
    initialTimer: 0,
    greenSeconds: 8,
    yellowSeconds: 2,
    redSeconds: 8,
  },
  {
    id: 'signal_harbor_gate',
    areaId: 'harbor_front',
    position: [1, 0, -1],
    pathId: 'path_harbor',
    progressOnPath: 0.15,
    initialPhase: 'green',
    initialTimer: 5,
    greenSeconds: 8,
    yellowSeconds: 2,
    redSeconds: 8,
  },
];
