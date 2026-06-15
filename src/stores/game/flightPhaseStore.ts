import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  FlightCameraKeyframe, FlightPathNode, FlightPhaseConfig, FlightTimelineEvent,
} from '../../types/game/flightPhase';
import { FLIGHT_PHASE_SEED } from '../../data/game/flightPhase';
import { syncPhaseDerived, getNodeTimes } from '../../game/flight/flightPhaseRuntime';

// Authoritative Flight Phase store — the SINGLE source of truth for the base-exterior fly-around / orbit
// phase. Edit Mode panels, 3D node/camera gizmos, the preview controller AND play all read/write here, so
// edit / preview / play can never diverge. localStorage-backed; every mutation recomputes derived totals
// (distance/duration) via syncPhaseDerived so the seconds timeline stays correct.
interface FlightPhaseStoreState {
  phases: FlightPhaseConfig[];
  activePhaseId: string;
  setActivePhase: (phaseId: string) => void;
  updatePhase: (phaseId: string, patch: Partial<FlightPhaseConfig>) => void;
  // nodes
  updateNode: (phaseId: string, nodeId: string, patch: Partial<FlightPathNode>) => void;
  moveNode: (phaseId: string, nodeId: string, position: [number, number, number]) => void;
  addNode: (phaseId: string) => string | null;
  insertNodeBetween: (phaseId: string, index: number) => string | null;
  duplicateNode: (phaseId: string, nodeId: string) => string | null;
  removeNode: (phaseId: string, nodeId: string) => void;
  reorderNode: (phaseId: string, nodeId: string, dir: -1 | 1) => void;
  // camera keyframes
  addCameraKey: (phaseId: string, time: number) => string | null;
  addCameraKeyForNode: (phaseId: string, nodeId: string) => string | null;
  updateCameraKey: (phaseId: string, keyframeId: string, patch: Partial<FlightCameraKeyframe>) => void;
  removeCameraKey: (phaseId: string, keyframeId: string) => void;
  // events
  addEvent: (phaseId: string, time: number) => string | null;
  updateEvent: (phaseId: string, eventId: string, patch: Partial<FlightTimelineEvent>) => void;
  removeEvent: (phaseId: string, eventId: string) => void;
  // path-level
  recalc: (phaseId: string) => void;
  smooth: (phaseId: string) => void;
  resetPhase: (phaseId: string) => void;
  importState: (data: { phases?: FlightPhaseConfig[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'aero-flight-phase-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p: string) => `${p}_${nanoid(6)}`;
const seed = (): FlightPhaseConfig[] => FLIGHT_PHASE_SEED.map((p) => syncPhaseDerived(clone(p)));

function persist(phases: FlightPhaseConfig[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ phases })); } catch { /* ignore */ }
}
// Debounced persistence — a gizmo drag fires ~60 store writes/sec; writing localStorage every frame causes
// visible jank (and makes the panel numbers feel "unstable"). Coalesce them; the in-memory store stays live.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(phases: FlightPhaseConfig[]): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => { persistTimer = null; persist(phases); }, 200);
}
function load(): FlightPhaseConfig[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.phases) && p.phases.length) {
        const have = new Set(p.phases.map((x: FlightPhaseConfig) => x.phaseId));
        // Merge any NEW seed phases (e.g. aerial/return added in round 3) so they appear without a reset.
        const merged = [...p.phases, ...FLIGHT_PHASE_SEED.filter((s) => !have.has(s.phaseId)).map((s) => clone(s))];
        return merged.map((x: FlightPhaseConfig) => syncPhaseDerived(x));
      }
    }
  } catch { /* ignore */ }
  return seed();
}

const newNode = (position: [number, number, number], name: string): FlightPathNode => ({
  nodeId: uid('node'), nodeName: name, position, rotation: [0, 0, 0], speed: 24, waitTime: 0,
  bankingAngle: 0, influenceRadius: 8, flightPose: 'level', eventIds: [],
});

export const useFlightPhaseStore = create<FlightPhaseStoreState>((set, get) => {
  const initial = load();
  // Apply a path mutation to one phase, recompute derived totals, persist.
  const mutate = (phaseId: string, fn: (p: FlightPhaseConfig) => FlightPhaseConfig) => {
    const phases = get().phases.map((p) => (p.phaseId === phaseId ? syncPhaseDerived(fn(p)) : p));
    set({ phases }); schedulePersist(phases);
  };
  const withNodes = (p: FlightPhaseConfig, nodes: FlightPathNode[]): FlightPhaseConfig => ({ ...p, path: { ...p.path, nodes } });
  return {
    phases: initial,
    activePhaseId: initial[0]?.phaseId ?? '',
    setActivePhase: (activePhaseId) => set({ activePhaseId }),
    updatePhase: (phaseId, patch) => mutate(phaseId, (p) => ({ ...p, ...patch, path: patch.path ? { ...p.path, ...patch.path } : p.path })),

    updateNode: (phaseId, nodeId, patch) =>
      mutate(phaseId, (p) => withNodes(p, p.path.nodes.map((n) => (n.nodeId === nodeId ? { ...n, ...patch } : n)))),
    moveNode: (phaseId, nodeId, position) =>
      mutate(phaseId, (p) => withNodes(p, p.path.nodes.map((n) => (n.nodeId === nodeId ? { ...n, position } : n)))),
    addNode: (phaseId) => {
      let id: string | null = null;
      mutate(phaseId, (p) => {
        const nodes = p.path.nodes;
        const last = nodes[nodes.length - 1]?.position ?? [0, 24, 0];
        const n = newNode([last[0] + 8, last[1], last[2] - 8], `Node_${nodes.length + 1}`);
        id = n.nodeId;
        return withNodes(p, [...nodes, n]);
      });
      return id;
    },
    insertNodeBetween: (phaseId, index) => {
      let id: string | null = null;
      mutate(phaseId, (p) => {
        const nodes = p.path.nodes;
        const a = nodes[index]?.position ?? [0, 24, 0];
        const b = nodes[index + 1]?.position ?? [a[0], a[1], a[2] - 8];
        const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        const n = newNode(mid, `Node_mid`);
        id = n.nodeId;
        const next = nodes.slice(); next.splice(index + 1, 0, n);
        return withNodes(p, next);
      });
      return id;
    },
    duplicateNode: (phaseId, nodeId) => {
      let id: string | null = null;
      mutate(phaseId, (p) => {
        const nodes = p.path.nodes;
        const i = nodes.findIndex((n) => n.nodeId === nodeId);
        if (i < 0) return p;
        const src = nodes[i];
        const copy: FlightPathNode = { ...clone(src), nodeId: uid('node'), nodeName: `${src.nodeName}_copy`, position: [src.position[0] + 4, src.position[1], src.position[2] + 4] };
        id = copy.nodeId;
        const next = nodes.slice(); next.splice(i + 1, 0, copy);
        return withNodes(p, next);
      });
      return id;
    },
    removeNode: (phaseId, nodeId) =>
      mutate(phaseId, (p) => (p.path.nodes.length <= 2 ? p : withNodes(p, p.path.nodes.filter((n) => n.nodeId !== nodeId)))),
    reorderNode: (phaseId, nodeId, dir) =>
      mutate(phaseId, (p) => {
        const nodes = p.path.nodes.slice();
        const i = nodes.findIndex((n) => n.nodeId === nodeId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= nodes.length) return p;
        [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
        return withNodes(p, nodes);
      }),

    addCameraKey: (phaseId, time) => {
      let id: string | null = null;
      mutate(phaseId, (p) => {
        const k: FlightCameraKeyframe = { keyframeId: uid('cam'), time: Math.max(0, time), cameraMode: 'follow', position: [0, 30, 70], rotation: [0, 0, 0], fov: 52, transitionType: 'easeInOut', followTargetId: 'craft', distance: 12, height: 5, damping: 0.4, followOffset: [0, 0, 0] };
        id = k.keyframeId;
        return { ...p, cameraKeyframes: [...p.cameraKeyframes, k].sort((a, b) => a.time - b.time) };
      });
      return id;
    },
    // Create a camera keyframe OWNED by a node, at the node's arrival time (lookAtNode shot looking at the node).
    addCameraKeyForNode: (phaseId, nodeId) => {
      let id: string | null = null;
      mutate(phaseId, (p) => {
        if (p.cameraKeyframes.some((k) => k.nodeId === nodeId)) return p; // one camera per node
        const idx = p.path.nodes.findIndex((n) => n.nodeId === nodeId);
        const node = p.path.nodes[idx];
        if (!node) return p;
        const time = getNodeTimes(p.path)[idx] ?? 0;
        const np = node.position;
        const k: FlightCameraKeyframe = {
          keyframeId: uid('cam'), nodeId, time, cameraMode: 'lookAtNode',
          position: [np[0] + 8, np[1] + 6, np[2] + 12], rotation: [0, 0, 0], lookAtTarget: [...np] as [number, number, number],
          fov: 52, transitionType: 'easeInOut', distance: 12, height: 5, damping: 0.4, followOffset: [0, 0, 0],
        };
        id = k.keyframeId;
        return { ...p, cameraKeyframes: [...p.cameraKeyframes, k].sort((a, b) => a.time - b.time) };
      });
      return id;
    },
    updateCameraKey: (phaseId, keyframeId, patch) =>
      mutate(phaseId, (p) => ({ ...p, cameraKeyframes: p.cameraKeyframes.map((k) => (k.keyframeId === keyframeId ? { ...k, ...patch } : k)).sort((a, b) => a.time - b.time) })),
    removeCameraKey: (phaseId, keyframeId) =>
      mutate(phaseId, (p) => ({ ...p, cameraKeyframes: p.cameraKeyframes.filter((k) => k.keyframeId !== keyframeId) })),

    addEvent: (phaseId, time) => {
      let id: string | null = null;
      mutate(phaseId, (p) => {
        const e: FlightTimelineEvent = { eventId: uid('ev'), time: Math.max(0, time), eventType: 'dialogue', payload: {}, previewEnabled: true, triggerOnce: true, enabled: true };
        id = e.eventId;
        return { ...p, events: [...p.events, e].sort((a, b) => a.time - b.time) };
      });
      return id;
    },
    updateEvent: (phaseId, eventId, patch) =>
      mutate(phaseId, (p) => ({ ...p, events: p.events.map((e) => (e.eventId === eventId ? { ...e, ...patch } : e)).sort((a, b) => a.time - b.time) })),
    removeEvent: (phaseId, eventId) =>
      mutate(phaseId, (p) => ({ ...p, events: p.events.filter((e) => e.eventId !== eventId) })),

    recalc: (phaseId) => mutate(phaseId, (p) => p),
    smooth: (phaseId) => mutate(phaseId, (p) => ({ ...p, path: { ...p.path, nodes: p.path.nodes.map((n) => ({ ...n, handleIn: undefined, handleOut: undefined })) } })),
    resetPhase: (phaseId) => {
      const seedPhase = FLIGHT_PHASE_SEED.find((s) => s.phaseId === phaseId);
      if (seedPhase) mutate(phaseId, () => clone(seedPhase));
    },
    importState: (data) => { const phases = Array.isArray(data.phases) && data.phases.length ? data.phases.map((p) => syncPhaseDerived(p)) : get().phases; set({ phases }); persist(phases); },
    reset: () => { const phases = seed(); set({ phases, activePhaseId: phases[0]?.phaseId ?? '' }); persist(phases); },
  };
});

export function getFlightPhase(phaseId: string): FlightPhaseConfig | undefined {
  return useFlightPhaseStore.getState().phases.find((p) => p.phaseId === phaseId);
}
export function getActiveFlightPhase(): FlightPhaseConfig | undefined {
  const s = useFlightPhaseStore.getState();
  return s.phases.find((p) => p.phaseId === s.activePhaseId) ?? s.phases[0];
}

export function getPhaseForGamePhase(gamePhase: string): FlightPhaseConfig | undefined {
  return useFlightPhaseStore.getState().phases.find((p) => p.gamePhase === gamePhase);
}

// Bind the editor/runtime to the Flight Phase that owns this FSM phase (called by each flight scene on mount).
export function setActivePhaseForGamePhase(gamePhase: string): void {
  const s = useFlightPhaseStore.getState();
  const match = s.phases.find((p) => p.gamePhase === gamePhase);
  if (match && s.activePhaseId !== match.phaseId) s.setActivePhase(match.phaseId);
}

// The camera keyframe a node owns (if any) — the node-camera panel + gizmos bind to it.
export function cameraKeyframeForNode(phase: FlightPhaseConfig | undefined, nodeId: string): FlightCameraKeyframe | undefined {
  return phase?.cameraKeyframes.find((k) => k.nodeId === nodeId);
}

// Module-level clipboard for Copy/Paste camera settings between nodes (shot params only, not id/time/node).
type CameraClip = Omit<FlightCameraKeyframe, 'keyframeId' | 'time' | 'nodeId'>;
let cameraClipboard: CameraClip | null = null;
export function copyCameraSettings(k: FlightCameraKeyframe): void {
  const rest = { ...k } as Partial<FlightCameraKeyframe>;
  delete rest.keyframeId; delete rest.time; delete rest.nodeId;
  cameraClipboard = rest as CameraClip;
}
export function getCameraClipboard(): CameraClip | null { return cameraClipboard; }
