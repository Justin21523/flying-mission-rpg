import { create } from 'zustand';
import type { PathFollowerDef } from '../types/pathFollower';
import { getFollowerState, dropFollowerState } from '../game/path/followerRuntime';

// Phase F+ — RUNTIME ephemeral path-followers spawned by traffic-incident scenarios (a scenario's vehicles are
// real moving Phase E followers, not static props). setVehicleState scales their speed (breakdown/stopped → 0).
// Cleared per-instance on scenario resolve. Distinct from the authored editorPathFollowerStore.
export interface EphemeralFollower extends PathFollowerDef { instanceId: string; baseSpeed: number }

const STATE_FACTOR: Record<string, number> = { normal: 1, distracted: 0.4, brakeFailure: 1.4, breakdown: 0, overheat: 0.15, stopped: 0 };

interface IncidentFollowerState {
  followers: EphemeralFollower[];
  add: (instanceId: string, def: PathFollowerDef, startU: number) => void;
  setVehicleState: (instanceId: string, index: number, vehicleState: string) => void;
  removeForInstance: (instanceId: string) => void;
}

export const useIncidentFollowerStore = create<IncidentFollowerState>((set, get) => ({
  followers: [],
  add: (instanceId, def, startU) => {
    const f: EphemeralFollower = { ...def, instanceId, baseSpeed: def.speed };
    set({ followers: [...get().followers, f] });
    // Seed its runtime progress at the scene (so it appears at the incident, not the path start).
    const st = getFollowerState(f);
    if (st.u.length > 0) st.u[0] = startU;
  },
  setVehicleState: (instanceId, index, vehicleState) => {
    const list = get().followers.filter((f) => f.instanceId === instanceId);
    const target = list[index];
    if (!target) return;
    const factor = STATE_FACTOR[vehicleState] ?? 1;
    set({ followers: get().followers.map((f) => (f.id === target.id ? { ...f, speed: f.baseSpeed * factor } : f)) });
  },
  removeForInstance: (instanceId) => {
    for (const f of get().followers) if (f.instanceId === instanceId) dropFollowerState(f.id);
    set({ followers: get().followers.filter((f) => f.instanceId !== instanceId) });
  },
}));

export function getIncidentFollowers(): EphemeralFollower[] { return useIncidentFollowerStore.getState().followers; }
export function countIncidentFollowers(instanceId: string): number {
  return useIncidentFollowerStore.getState().followers.filter((f) => f.instanceId === instanceId).length;
}
