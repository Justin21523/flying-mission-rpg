import type { SourceConfidence } from '../sourceConfidence';

// A resident at a destination who gives a mission a reason + basic interaction (PDF: NPCs only supply
// the why/what, never the core loop). Dialogue trees reuse the inherited POLI dialogue engine. Placement
// is part of the definition (gizmo-draggable in the destination scene; no separate placement store).
export type NpcInitialState = 'idle' | 'waving' | 'waiting' | 'worried';
export const NPC_INITIAL_STATES: readonly NpcInitialState[] = ['idle', 'waving', 'waiting', 'worried'];

export interface NPCDefinition {
  id: string;
  codename: string;
  name: string;
  sourceConfidence: SourceConfidence;
  locationId: string;
  role: string;
  description: string;
  color: string; // hex — placeholder mesh + UI tint
  modelAssetId?: string; // optional GLB (empty = placeholder mesh)
  dialogueTreeId?: string;
  missionId?: string;
  // ── destination placement + interaction (Batch 7) ──
  position?: [number, number, number]; // in the destination layout (gizmo-draggable)
  rotationY?: number; // degrees
  interactionRadius?: number; // [E] range (default 4)
  initialState?: NpcInitialState;
}
