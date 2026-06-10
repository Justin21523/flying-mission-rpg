import type { SourceConfidence } from '../sourceConfidence';

// A playable flying character. Two forms (vehicle/robot) — the transformation between them is a core
// pillar. Abilities are child-friendly rescue helpers (no combat, no weapons).
export type CharacterForm = 'plane' | 'robot';
export const CHARACTER_FORMS: readonly CharacterForm[] = ['plane', 'robot'];

// Child-friendly, non-combat helper kinds — broad enough to cover the seed roster's card abilities
// (boost / lift / repair / patrol / sound / acrobatic / drill …). No weapons, ever.
export type AbilityKind =
  | 'boost'
  | 'lift'
  | 'scan'
  | 'tow'
  | 'repair'
  | 'light'
  | 'signal'
  | 'sound'
  | 'acrobatic'
  | 'drill'
  | 'patrol';
export const ABILITY_KINDS: readonly AbilityKind[] = [
  'boost',
  'lift',
  'scan',
  'tow',
  'repair',
  'light',
  'signal',
  'sound',
  'acrobatic',
  'drill',
  'patrol',
];

export interface CharacterAbility {
  id: string;
  nameZhTW: string;
  kind: AbilityKind;
  description: string;
}

// 1..10 design scales — drive flight handling + Mission Control's recommendation hints.
export interface CharacterStats {
  flightSpeed: number;
  agility: number; // turn responsiveness
  controlDifficulty: number; // 1 easy .. 10 hard
  durability: number;
}

export interface CharacterDefinition {
  id: string;
  codename: string; // original codename — never an IP name
  nameZhTW: string; // player-facing display
  role: string;
  description: string;
  sourceConfidence: SourceConfidence;
  color: string; // hex — placeholder mesh + UI tint
  defaultForm: CharacterForm;
  stats: CharacterStats;
  abilities: CharacterAbility[];
  missionSuitability: string[]; // MissionType ids this character suits
  transformationId?: string; // TransformationDefinition id
  cardImage?: string; // reference card filename in src/assets/cards (display wired in Batch 2)
  modelPlanePath?: string; // swappable GLTF (placeholders for now)
  modelRobotPath?: string;
  homeBaseLocationId?: string;
}
