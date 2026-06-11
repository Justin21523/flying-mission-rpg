import type { SourceConfidence } from '../sourceConfidence';
import type { NpcType, NpcMovement } from '../editorNPC';
import type { TimeOfDay } from '../randomEvent';
import type { AnimRule } from '../character';

// A resident at a destination who gives a mission a reason + basic interaction (PDF: NPCs only supply
// the why/what, never the core loop). Dialogue trees reuse the inherited POLI dialogue engine. Placement
// is part of the definition (gizmo-draggable in the destination scene; no separate placement store).
export type NpcInitialState = 'idle' | 'waving' | 'waiting' | 'worried';
export const NPC_INITIAL_STATES: readonly NpcInitialState[] = ['idle', 'waving', 'waiting', 'worried'];

// The movement modes the game NPC runtime supports (subset of the POLI NpcMovement union).
export const NPC_MOVEMENT_MODES: readonly NpcMovement[] = ['static', 'patrol', 'wander', 'schedule'];

export interface NPCDefinition {
  id: string;
  codename: string;
  name: string;
  sourceConfidence: SourceConfidence;
  locationId: string;
  role: string;
  description: string;
  color: string; // hex — placeholder mesh + UI tint
  npcType?: NpcType; // archetype (drives default role + tint, like the POLI editor)
  tags?: string[];
  modelAssetId?: string; // optional GLB (empty = placeholder mesh)
  interactionLabel?: string; // proximity prompt (default 'Talk')
  // ── dialogue (reuse the POLI dialogue engine) ──
  dialogueTreeId?: string; // primary tree (mirrors dialogueTreeIds[0] for back-compat)
  dialogueTreeIds?: string[]; // all trees this NPC owns — condition-gated, priority order
  // ── mission links ──
  missionId?: string; // legacy single link (kept)
  startsMissionIds?: string[]; // missions this NPC offers
  completesMissionIds?: string[]; // missions this NPC accepts turn-in for
  // ── destination placement + interaction (Batch 7) ──
  position?: [number, number, number]; // in the destination layout (gizmo-draggable)
  rotationY?: number; // degrees
  interactionRadius?: number; // [E] range (default 4)
  initialState?: NpcInitialState;
  // ── movement (Play Mode) — mirrors the POLI EditorNpc options ──
  movement?: NpcMovement; // default 'static'
  patrolWaypoints?: [number, number, number][]; // closed loop for 'patrol'
  wanderRadius?: number; // roam radius for 'wander' (default 8)
  moveSpeed?: number; // world units / sec (default 1.6)
  schedulePositions?: Partial<Record<TimeOfDay, [number, number, number]>>; // per time-of-day target
  // ── animation rules (same engine as the player/character) ──
  animations?: AnimRule[];
}
