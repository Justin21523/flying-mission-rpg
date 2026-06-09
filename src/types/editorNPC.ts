import type { Vec3 } from '../game/edit/sceneEditMerge';
import type { TimeOfDay } from './randomEvent';

// Kit — NPC archetype (drives the default role label, the stub colour, and the palette). Generic set
// (the yokai-specific 'yokaiFriend' archetype was dropped).
export type NpcType =
  | 'guide'
  | 'researcher'
  | 'teacher'
  | 'student'
  | 'shopkeeper'
  | 'vendor'
  | 'trainer'
  | 'questGiver'
  | 'guard'
  | 'officer'
  | 'medic'
  | 'engineer'
  | 'chef'
  | 'performer'
  | 'child'
  | 'elder'
  | 'traveler'
  | 'mysterious'
  | 'activityHost';

export const NPC_TYPES: NpcType[] = [
  'guide', 'researcher', 'teacher', 'student', 'shopkeeper', 'vendor', 'trainer',
  'questGiver', 'guard', 'officer', 'medic', 'engineer', 'chef', 'performer',
  'child', 'elder', 'traveler', 'mysterious', 'activityHost',
];

export const NPC_TYPE_LABEL: Record<NpcType, string> = {
  guide: 'Guide', researcher: 'Researcher', teacher: 'Teacher', student: 'Student',
  shopkeeper: 'Shopkeeper', vendor: 'Vendor', trainer: 'Trainer', questGiver: 'Quest Giver', guard: 'Guard',
  officer: 'Officer', medic: 'Medic', engineer: 'Engineer', chef: 'Chef', performer: 'Performer',
  child: 'Child', elder: 'Elder', traveler: 'Traveler', mysterious: 'Mysterious', activityHost: 'Activity Host',
};

export const NPC_TYPE_COLOR: Record<NpcType, string> = {
  guide: '#38bdf8', researcher: '#a78bfa', teacher: '#f59e0b', student: '#fbbf24',
  shopkeeper: '#34d399', vendor: '#2dd4bf', trainer: '#ef4444', questGiver: '#facc15', guard: '#94a3b8',
  officer: '#60a5fa', medic: '#f472b6', engineer: '#fb923c', chef: '#f87171', performer: '#e879f9',
  child: '#fcd34d', elder: '#cbd5e1', traveler: '#fb923c', mysterious: '#6366f1', activityHost: '#22d3ee',
};

export const NPC_TYPE_DEFAULT_ROLE: Record<NpcType, string> = {
  guide: 'Guide', researcher: 'Researcher', teacher: 'Teacher', student: 'Student',
  shopkeeper: 'Shopkeeper', vendor: 'Vendor', trainer: 'Trainer', questGiver: 'Quest Giver', guard: 'Guard',
  officer: 'Patrol Officer', medic: 'Medic', engineer: 'Engineer', chef: 'Chef', performer: 'Street Performer',
  child: 'Townsfolk Child', elder: 'Town Elder', traveler: 'Traveler', mysterious: 'Mysterious Figure', activityHost: 'Activity Host',
};

// An NPC created in Editor Mode. Fully data-driven: placed/moved like any editable object, resolved into
// an NpcProfile at runtime by getNpcProfile so the existing interaction + dialogue pipeline treats it
// like a seed NPC. Persists to its own store; a linked dialogueTreeId points at an editor-authored tree.
export interface EditorNpc {
  id: string;
  code?: string;                 // unique human-readable code (validation key)
  areaId: string;                // placement area
  position: Vec3;
  rotation?: Vec3;               // radians
  scale?: number;                // uniform scale
  displayName: string;
  npcType?: NpcType;             // archetype (drives colour + default role)
  role: string;
  description?: string;          // editor note / flavor
  dialogueTreeId: string | null;
  relatedQuestIds: string[];
  startsQuestIds?: string[];     // quests this NPC offers on interaction
  completesQuestIds?: string[];  // quests this NPC accepts turn-in for
  scheduleProfileId?: string | null;
  behaviorProfileId?: string | null;
  shopId?: string | null;
  sells?: { itemId: string; price: number }[];   // vendor: items for sale (coins) → opens a shop on interact
  hostsActivityId?: string | null;               // host: starts this mini-game / hunt on interact
  modelAssetId: string | null;   // when set, a GLB replaces the capsule stub
  animation?: string;            // named animation clip for the GLB
  interactionLabel: string;      // proximity prompt, e.g. 'Talk to Mina'
  color: string;
  tags: string[];
  // ── Movement (editable in the NPC tab) ──────────────────────────────────────
  movement?: NpcMovement;        // how the NPC moves in Play Mode (default 'static')
  patrolWaypoints?: Vec3[];      // closed loop for 'patrol' (last → first; no dead-end)
  schedulePositions?: Partial<Record<TimeOfDay, Vec3>>; // per-phase target for 'schedule'
  paths?: NpcPath[];             // 'paths' mode: weighted set; a random one is walked each trip
  guardLeash?: number;           // 'guard' mode: chase the player within this range, else return home
  moveSpeed?: number;            // world units / sec (default 1.6)
  wanderRadius?: number;         // roam radius for 'wander' (default 12)
  animations?: import('./character').AnimRule[]; // custom animation rules (same system as the player)
}

// One waypoint on a path — optional per-segment speed (units/s, toward this point) + wait (s) on arrival.
export interface PathPoint { pos: Vec3; speed?: number; wait?: number }
export type PathMode = 'loop' | 'pingpong' | 'once';
export const PATH_MODES: PathMode[] = ['loop', 'pingpong', 'once'];
export interface NpcPath {
  id: string;
  name: string;
  weight: number;     // relative probability of being chosen for a trip
  mode: PathMode;     // loop = cycle, pingpong = 來回, once = walk then re-roll a new path
  points: PathPoint[];
}

export type NpcMovement = 'static' | 'patrol' | 'schedule' | 'wander' | 'paths' | 'guard';
export const NPC_MOVEMENT: NpcMovement[] = ['static', 'patrol', 'schedule', 'wander', 'paths', 'guard'];

let npcCodeSeq = 0;
export function makeNpcCode(npcType: NpcType = 'student'): string {
  npcCodeSeq += 1;
  return `NPC_${npcType.toUpperCase()}_${Date.now().toString(36).slice(-4)}${npcCodeSeq}`;
}

export function createDefaultEditorNpc(id: string, areaId: string, position: Vec3): EditorNpc {
  const npcType: NpcType = 'student';
  return {
    id, code: makeNpcCode(npcType), areaId, position, rotation: [0, 0, 0], scale: 1,
    displayName: 'New NPC', npcType, role: '', description: '', dialogueTreeId: null,
    relatedQuestIds: [], startsQuestIds: [], completesQuestIds: [],
    scheduleProfileId: null, behaviorProfileId: null, shopId: null,
    modelAssetId: null, interactionLabel: 'Talk', color: NPC_TYPE_COLOR[npcType], tags: [],
    movement: 'static', patrolWaypoints: [], schedulePositions: {}, moveSpeed: 1.6,
  };
}
