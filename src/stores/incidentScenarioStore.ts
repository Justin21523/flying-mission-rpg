import { create } from 'zustand';

// Phase F — RUNTIME state for staged traffic-incident scenario instances (not persisted). The director starts /
// advances / ends instances; TrafficIncidentLayer subscribes to render their spawned entities. (Authoring data
// lives in editorTrafficScenarioStore.)
export type ScenarioEntityKind = 'vehicle' | 'obstacle' | 'hazard';
export interface SpawnedEntity {
  id: string;
  kind: ScenarioEntityKind;
  position: [number, number, number];
  color: string;
  label: string;
  state?: string; // setVehicleState tag (breakdown/overheat/…)
}
export interface ScenarioInstance {
  instanceId: string;
  scenarioId: string;
  name: string;
  areaId: string;
  pathId: string;
  position: [number, number, number];
  startTime: number;       // seconds (performance.now/1000)
  ranSteps: number[];      // timeline step indices already executed
  entities: SpawnedEntity[];
  blockedPaths: string[];
  rescueStarted?: boolean;  // K2: the on-scene rescue mini-game has been handed off (awaiting completion)
}

interface IncidentScenarioState {
  instances: ScenarioInstance[];
  start: (instance: ScenarioInstance) => void;
  update: (instanceId: string, patch: Partial<ScenarioInstance>) => void;
  addEntity: (instanceId: string, e: SpawnedEntity) => void;
  end: (instanceId: string) => void;
}

export const useIncidentScenarioStore = create<IncidentScenarioState>((set, get) => ({
  instances: [],
  start: (instance) => set({ instances: [...get().instances, instance] }),
  update: (instanceId, patch) => set({ instances: get().instances.map((x) => (x.instanceId === instanceId ? { ...x, ...patch } : x)) }),
  addEntity: (instanceId, e) => set({ instances: get().instances.map((x) => (x.instanceId === instanceId ? { ...x, entities: [...x.entities, e] } : x)) }),
  end: (instanceId) => set({ instances: get().instances.filter((x) => x.instanceId !== instanceId) }),
}));

export function getScenarioInstances(): ScenarioInstance[] { return useIncidentScenarioStore.getState().instances; }
export function countActive(scenarioId: string): number { return useIncidentScenarioStore.getState().instances.filter((x) => x.scenarioId === scenarioId).length; }
