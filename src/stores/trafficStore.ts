import { create } from 'zustand';
import { POLI_ROADS } from '../data/traffic/broomsTownRoads';
import { POLI_VEHICLES } from '../data/traffic/broomsTownVehicles';
import { TRAFFIC_SIGNALS } from '../data/traffic/broomsTownSignals';
import { useWorldClockStore } from './worldClockStore';
import { getPathPosition, getPathHeading } from '../types/traffic';
import type { TrafficPhase } from '../types/traffic';

interface TrafficState {
  vehicleProgress: Record<string, number>;
  signalTimers: Record<string, number>;
  signalPhases: Record<string, TrafficPhase>;

  tick: (dt: number) => void;
  getVehicleWorldPos: (vehicleId: string) => [number, number, number];
  getVehicleHeading: (vehicleId: string) => number;
  getSignalPhase: (signalId: string) => TrafficPhase;
}

function nextPhase(
  phase: TrafficPhase,
  timer: number,
  sig: { greenSeconds: number; yellowSeconds: number; redSeconds: number },
): { phase: TrafficPhase; timer: number } {
  if (phase === 'green' && timer >= sig.greenSeconds) return { phase: 'yellow', timer: 0 };
  if (phase === 'yellow' && timer >= sig.yellowSeconds) return { phase: 'red', timer: 0 };
  if (phase === 'red' && timer >= sig.redSeconds) return { phase: 'green', timer: 0 };
  return { phase, timer };
}

export const useTrafficStore = create<TrafficState>((set, get) => ({
  vehicleProgress: Object.fromEntries(POLI_VEHICLES.map((v) => [v.id, v.initialProgress])),
  signalTimers: Object.fromEntries(TRAFFIC_SIGNALS.map((s) => [s.id, s.initialTimer])),
  signalPhases: Object.fromEntries(TRAFFIC_SIGNALS.map((s) => [s.id, s.initialPhase])),

  tick: (dt) => {
    if (useWorldClockStore.getState().timeOfDay === 'night') return;

    const s = get();
    const newTimers = { ...s.signalTimers };
    const newPhases = { ...s.signalPhases };
    const newProgress = { ...s.vehicleProgress };

    // Advance signal timers + cycle phases
    for (const sig of TRAFFIC_SIGNALS) {
      newTimers[sig.id] += dt;
      const result = nextPhase(newPhases[sig.id], newTimers[sig.id], sig);
      newPhases[sig.id] = result.phase;
      if (result.timer !== newTimers[sig.id]) newTimers[sig.id] = result.timer;
    }

    // Advance vehicle progress
    for (const v of POLI_VEHICLES) {
      const path = POLI_ROADS.find((r) => r.id === v.pathId);
      if (!path || path.totalLength === 0) continue;

      const signal = TRAFFIC_SIGNALS.find((s) => s.pathId === v.pathId);
      if (signal && newPhases[signal.id] !== 'green') {
        const ahead = (signal.progressOnPath - newProgress[v.id] + 1) % 1;
        if (ahead < 0.06) continue; // hold at stop line
      }

      newProgress[v.id] = (newProgress[v.id] + (v.speed * dt) / path.totalLength) % 1;
    }

    set({ vehicleProgress: newProgress, signalTimers: newTimers, signalPhases: newPhases });
  },

  getVehicleWorldPos: (vehicleId) => {
    const v = POLI_VEHICLES.find((d) => d.id === vehicleId);
    if (!v) return [0, 0, 0];
    const path = POLI_ROADS.find((r) => r.id === v.pathId);
    if (!path) return [0, 0, 0];
    return getPathPosition(path, get().vehicleProgress[vehicleId] ?? 0);
  },

  getVehicleHeading: (vehicleId) => {
    const v = POLI_VEHICLES.find((d) => d.id === vehicleId);
    if (!v) return 0;
    const path = POLI_ROADS.find((r) => r.id === v.pathId);
    if (!path) return 0;
    return getPathHeading(path, get().vehicleProgress[vehicleId] ?? 0);
  },

  getSignalPhase: (signalId) => get().signalPhases[signalId] ?? 'green',
}));
