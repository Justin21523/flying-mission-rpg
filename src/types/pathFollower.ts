// Phase E — NPCs / vehicles that drive the curve-based PathDefinition system (additive to the waypoint
// TrafficLayer/RoadPath, which keeps working). A PathFollowerDef is pure authoring data; runtime progress lives
// in followerRuntime (non-reactive). The AI (pathFollowerAI) gives each one an obstacle sensor + spacing +
// incident reaction + reroute.
export type PathFollowerKind = 'npc' | 'vehicle';
export const PATH_FOLLOWER_KINDS: PathFollowerKind[] = ['npc', 'vehicle'];

export interface PathFollowerDef {
  id: string;
  name: string;
  areaId: string;
  kind: PathFollowerKind;
  pathId: string;            // the curve PathDefinition (editorPathStore) this follower rides
  count: number;             // copies spaced evenly along the path (a convoy)
  speed: number;             // cruise speed (world units / s)
  lookAhead: number;         // obstacle-sensor distance ahead (m)
  minGap: number;            // follow distance kept behind the follower ahead (m)
  modelAssetId?: string;
  color?: string;
  scale?: number;
  size?: [number, number, number]; // capsule-fallback body extents (x used as radius, y as height)
  yieldToIncidents: boolean; // slow / stop near an active incident on the path
  canReroute: boolean;       // take a PathBranchRule when reaching a branch node / when blocked
  loop: boolean;             // wrap to the start at the path end (continuous traffic) vs hold at the end
  enabled: boolean;
}
