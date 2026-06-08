import type { SourceConfidence } from './character';

export type ToolId =
  | 'fire_hose'
  | 'stretcher'
  | 'traffic_cone'
  | 'rescue_rope'
  | 'signal_scanner'
  | 'megaphone';

export interface ToolBonus {
  incidentId: string;
  actionBonus?: number;  // extra progress per press in action stages
  timeBonus?: number;    // extra seconds added to stage time limit
  radiusBonus?: number;  // extra waypoint detection radius
}

export interface ToolDefinition {
  id: ToolId;
  name: string;              // English display name
  nameZhTW?: string;         // Chinese reference (not displayed in game)
  description: string;       // English description
  icon: string;
  unlockTrustWithJin: number; // 0 = no trust gate
  unlockLevel: number;
  incidentBonus?: ToolBonus;
  prerequisites?: string[];  // tool ids that must be unlocked first (skill-tree edges)
  maxUpgrade?: number;       // upgrade tiers available (0 = none)
  upgradeBonusPerLevel?: number; // multiplier added per upgrade level to incidentBonus (e.g. 0.25)
  sourceConfidence: SourceConfidence;
}
