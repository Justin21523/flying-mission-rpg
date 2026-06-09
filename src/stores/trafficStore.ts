import { create } from 'zustand';
import { getEditorVehicles, getEditorSignals, getEditorRoadPath, isRoadClosed, getEmergencyYield, getTrafficIncidentCfg } from './editorTrafficStore';
import { useWorldClockStore } from './worldClockStore';
import { useIncidentStore } from './incidentStore';
import { useRescueOperationStore } from './rescueOperationStore';
import { spawnRandomIncident } from '../game/incident/spawnIncident';

// Accumulator for traffic-triggered incidents (module-level → no re-renders).
let trafficIncidentTimer = 0;
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

// Reads the EDITABLE traffic (editorTrafficStore) each tick, lazily seeding runtime state for any
// vehicle/signal it hasn't seen yet — so adding/editing traffic in the 🚦 tab applies live.
export const useTrafficStore = create<TrafficState>((set, get) => ({
  vehicleProgress: {},
  signalTimers: {},
  signalPhases: {},

  tick: (dt) => {
    // Traffic "AI": vehicles can spontaneously trigger an incident to respond to (opt-in).
    const tcfg = getTrafficIncidentCfg();
    if (tcfg.on) {
      trafficIncidentTimer += dt;
      if (trafficIncidentTimer >= tcfg.everySec) {
        trafficIncidentTimer = 0;
        spawnRandomIncident();
      }
    }
    if (useWorldClockStore.getState().timeOfDay === 'night') return;

    const s = get();
    const vehicles = getEditorVehicles();
    const signals = getEditorSignals();
    const newTimers = { ...s.signalTimers };
    const newPhases = { ...s.signalPhases };
    const newProgress = { ...s.vehicleProgress };

    for (const sig of signals) {
      if (newTimers[sig.id] === undefined) { newTimers[sig.id] = sig.initialTimer; newPhases[sig.id] = sig.initialPhase; }
      newTimers[sig.id] += dt;
      const result = nextPhase(newPhases[sig.id], newTimers[sig.id], sig);
      newPhases[sig.id] = result.phase;
      if (result.timer !== newTimers[sig.id]) newTimers[sig.id] = result.timer;
    }

    // Emergency yield: when enabled and a rescue/incident is active, traffic slows to a crawl.
    const yieldOn = getEmergencyYield();
    const rescueActive = useRescueOperationStore.getState().isActive;

    for (const v of vehicles) {
      if (newProgress[v.id] === undefined) newProgress[v.id] = v.initialProgress;
      // Road closure → vehicles hold (a simple reroute: they don't advance along a closed road).
      if (isRoadClosed(v.pathId)) continue;
      const path = getEditorRoadPath(v.pathId);
      if (!path || path.totalLength === 0) continue;

      const signal = signals.find((sig) => sig.pathId === v.pathId);
      if (signal && newPhases[signal.id] !== 'green') {
        const ahead = (signal.progressOnPath - newProgress[v.id] + 1) % 1;
        if (ahead < 0.06) continue; // hold at stop line
      }

      // Slow down for an active emergency in this vehicle's area (yield to rescue vehicles).
      let speedScale = 1;
      if (yieldOn && (rescueActive || useIncidentStore.getState().getActiveForArea(v.areaId).length > 0)) {
        speedScale = 0.3;
      }
      newProgress[v.id] = (newProgress[v.id] + (v.speed * speedScale * dt) / path.totalLength) % 1;
    }

    set({ vehicleProgress: newProgress, signalTimers: newTimers, signalPhases: newPhases });
  },

  getVehicleWorldPos: (vehicleId) => {
    const v = getEditorVehicles().find((d) => d.id === vehicleId);
    if (!v) return [0, 0, 0];
    const path = getEditorRoadPath(v.pathId);
    if (!path) return [0, 0, 0];
    return getPathPosition(path, get().vehicleProgress[vehicleId] ?? 0);
  },

  getVehicleHeading: (vehicleId) => {
    const v = getEditorVehicles().find((d) => d.id === vehicleId);
    if (!v) return 0;
    const path = getEditorRoadPath(v.pathId);
    if (!path) return 0;
    return getPathHeading(path, get().vehicleProgress[vehicleId] ?? 0);
  },

  getSignalPhase: (signalId) => get().signalPhases[signalId] ?? 'green',
}));
