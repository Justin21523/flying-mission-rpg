import type { SourceConfidence } from '../sourceConfidence';

// A resident at a destination who gives a mission a reason + basic interaction (PDF: NPCs only supply
// the why/what, never the core loop). Dialogue trees reuse the inherited dialogue engine.
export interface NPCDefinition {
  id: string;
  codename: string;
  name: string;
  sourceConfidence: SourceConfidence;
  locationId: string;
  role: string;
  description: string;
  color: string; // hex — placeholder mesh + UI tint
  dialogueTreeId?: string;
  missionId?: string;
}
