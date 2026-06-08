import { create } from 'zustand';
import { POLI_VEHICLES } from '../data/traffic/broomsTownVehicles';
import { TRAFFIC_SIGNALS } from '../data/traffic/broomsTownSignals';
import { POLI_ROADS } from '../data/traffic/broomsTownRoads';
import { computeRoadPath } from '../types/traffic';
import type { VehicleDefinition, TrafficSignalDef, RoadPath, Crosswalk } from '../types/traffic';

// Editable traffic (🚦 Traffic tab): vehicles, signals, roads (waypoint loops), pedestrian crosswalks, plus
// per-road closure + a global emergency-yield flag. Seeded from the built-in data; CRUD + per-id field edits;
// auto-persisted. Runtime (trafficStore, TrafficLayer) reads these via the accessors. Roads are stored as
// id/areaId/waypoints (+ optional closed) and the RoadPath (with lengths) is recomputed on demand.
export interface EditorRoad { id: string; areaId: string; waypoints: [number, number, number][]; closed?: boolean }

interface EditorTrafficState {
  vehicles: VehicleDefinition[];
  signals: TrafficSignalDef[];
  roads: EditorRoad[];
  crosswalks: Crosswalk[];
  emergencyYield: boolean; // vehicles slow when an incident/rescue is active in the area
  addVehicle: (areaId: string) => void;
  updateVehicle: (id: string, patch: Partial<VehicleDefinition>) => void;
  removeVehicle: (id: string) => void;
  addSignal: (areaId: string) => void;
  updateSignal: (id: string, patch: Partial<TrafficSignalDef>) => void;
  removeSignal: (id: string) => void;
  addRoad: (areaId: string) => void;
  updateRoadWaypoint: (id: string, index: number, pos: [number, number, number]) => void;
  addRoadWaypoint: (id: string, pos: [number, number, number]) => void;
  removeRoadWaypoint: (id: string, index: number) => void;
  setRoadClosed: (id: string, closed: boolean) => void;
  removeRoad: (id: string) => void;
  addCrosswalk: (areaId: string, position: [number, number, number]) => void;
  updateCrosswalk: (id: string, patch: Partial<Crosswalk>) => void;
  removeCrosswalk: (id: string) => void;
  setEmergencyYield: (b: boolean) => void;
  importState: (data: { vehicles?: VehicleDefinition[]; signals?: TrafficSignalDef[]; roads?: EditorRoad[]; crosswalks?: Crosswalk[]; emergencyYield?: boolean }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-traffic-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(s: Pick<EditorTrafficState, 'vehicles' | 'signals' | 'roads' | 'crosswalks' | 'emergencyYield'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ vehicles: s.vehicles, signals: s.signals, roads: s.roads, crosswalks: s.crosswalks, emergencyYield: s.emergencyYield })); } catch { /* ignore */ }
}
function seedRoads(): EditorRoad[] {
  return POLI_ROADS.map((r) => ({ id: r.id, areaId: r.areaId, waypoints: clone(r.waypoints) }));
}
function load(): Pick<EditorTrafficState, 'vehicles' | 'signals' | 'roads' | 'crosswalks' | 'emergencyYield'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        vehicles: Array.isArray(p.vehicles) ? p.vehicles : clone(POLI_VEHICLES),
        signals: Array.isArray(p.signals) ? p.signals : clone(TRAFFIC_SIGNALS),
        roads: Array.isArray(p.roads) ? p.roads : seedRoads(),
        crosswalks: Array.isArray(p.crosswalks) ? p.crosswalks : [],
        emergencyYield: typeof p.emergencyYield === 'boolean' ? p.emergencyYield : true,
      };
    }
  } catch { /* ignore */ }
  return { vehicles: clone(POLI_VEHICLES), signals: clone(TRAFFIC_SIGNALS), roads: seedRoads(), crosswalks: [], emergencyYield: true };
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export const useEditorTrafficStore = create<EditorTrafficState>((set, get) => {
  const save = () => persist(get());
  return {
    ...load(),
    addVehicle: (areaId) => {
      const road = get().roads.find((r) => r.areaId === areaId);
      const v: VehicleDefinition = { id: uid('vehicle'), name: 'New Vehicle', areaId, pathId: road?.id ?? '', speed: 3, initialProgress: 0, color: '#2255cc', bodySize: [1.4, 0.7, 2.4], sourceConfidence: 'GameAdaptation' };
      set({ vehicles: [...get().vehicles, v] }); save();
    },
    updateVehicle: (id, patch) => { set({ vehicles: get().vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }); save(); },
    removeVehicle: (id) => { set({ vehicles: get().vehicles.filter((v) => v.id !== id) }); save(); },
    addSignal: (areaId) => {
      const road = get().roads.find((r) => r.areaId === areaId);
      const s: TrafficSignalDef = { id: uid('signal'), areaId, position: [0, 0, 0], pathId: road?.id ?? '', progressOnPath: 0.5, initialPhase: 'green', initialTimer: 0, greenSeconds: 8, yellowSeconds: 2, redSeconds: 8 };
      set({ signals: [...get().signals, s] }); save();
    },
    updateSignal: (id, patch) => { set({ signals: get().signals.map((x) => (x.id === id ? { ...x, ...patch } : x)) }); save(); },
    removeSignal: (id) => { set({ signals: get().signals.filter((x) => x.id !== id) }); save(); },
    addRoad: (areaId) => { set({ roads: [...get().roads, { id: uid('path'), areaId, waypoints: [[3, 0.5, 3], [3, 0.5, -3], [-3, 0.5, -3], [-3, 0.5, 3]] }] }); save(); },
    updateRoadWaypoint: (id, index, pos) => { set({ roads: get().roads.map((r) => (r.id === id ? { ...r, waypoints: r.waypoints.map((w, i) => (i === index ? pos : w)) } : r)) }); save(); },
    addRoadWaypoint: (id, pos) => { set({ roads: get().roads.map((r) => (r.id === id ? { ...r, waypoints: [...r.waypoints, pos] } : r)) }); save(); },
    removeRoadWaypoint: (id, index) => { set({ roads: get().roads.map((r) => (r.id === id ? { ...r, waypoints: r.waypoints.filter((_, i) => i !== index) } : r)) }); save(); },
    setRoadClosed: (id, closed) => { set({ roads: get().roads.map((r) => (r.id === id ? { ...r, closed } : r)) }); save(); },
    removeRoad: (id) => { set({ roads: get().roads.filter((r) => r.id !== id) }); save(); },
    addCrosswalk: (areaId, position) => {
      const c: Crosswalk = { id: uid('xwalk'), areaId, position, length: 6, axis: 'x' };
      set({ crosswalks: [...get().crosswalks, c] }); save();
    },
    updateCrosswalk: (id, patch) => { set({ crosswalks: get().crosswalks.map((c) => (c.id === id ? { ...c, ...patch } : c)) }); save(); },
    removeCrosswalk: (id) => { set({ crosswalks: get().crosswalks.filter((c) => c.id !== id) }); save(); },
    setEmergencyYield: (b) => { set({ emergencyYield: b }); save(); },
    importState: (data) => {
      set({
        vehicles: Array.isArray(data.vehicles) ? data.vehicles : get().vehicles,
        signals: Array.isArray(data.signals) ? data.signals : get().signals,
        roads: Array.isArray(data.roads) ? data.roads : get().roads,
        crosswalks: Array.isArray(data.crosswalks) ? data.crosswalks : get().crosswalks,
        emergencyYield: typeof data.emergencyYield === 'boolean' ? data.emergencyYield : get().emergencyYield,
      });
      save();
    },
    reset: () => { set({ vehicles: clone(POLI_VEHICLES), signals: clone(TRAFFIC_SIGNALS), roads: seedRoads(), crosswalks: [], emergencyYield: true }); save(); },
  };
});

// Accessors for the runtime (non-hook).
export function getEditorVehicles(): VehicleDefinition[] { return useEditorTrafficStore.getState().vehicles; }
export function getEditorSignals(): TrafficSignalDef[] { return useEditorTrafficStore.getState().signals; }
export function getEditorRoadPath(id: string): RoadPath | undefined {
  const r = useEditorTrafficStore.getState().roads.find((x) => x.id === id);
  return r ? computeRoadPath(r.id, r.areaId, r.waypoints) : undefined;
}
export function isRoadClosed(id: string): boolean {
  return useEditorTrafficStore.getState().roads.find((x) => x.id === id)?.closed ?? false;
}
export function getEmergencyYield(): boolean {
  return useEditorTrafficStore.getState().emergencyYield;
}
export function getEditorCrosswalks(): Crosswalk[] {
  return useEditorTrafficStore.getState().crosswalks;
}
