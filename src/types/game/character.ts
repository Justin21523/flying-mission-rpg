import type { SourceConfidence } from '../sourceConfidence';
import type { WeatherKind } from './flight';
import type { AnimRule } from '../character'; // reuse the POLI animation-rule engine (animRunner.pickLoopRule)

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
  name: string;
  kind: AbilityKind;
  description: string;
}

export type GroundExtraAbilityKind = 'scan_pulse' | 'hover_pop' | 'rescue_magnet';
export const GROUND_EXTRA_ABILITY_KINDS: readonly GroundExtraAbilityKind[] = ['scan_pulse', 'hover_pop', 'rescue_magnet'];

export interface GroundCloudRallyConfig {
  name: string;
  keyCode: string;
  durationSec: number;
  cooldownSec: number;
  radius: number;
  strength: number;
  cloudColor: string;
  rippleColor: string;
  energizedDurationSec: number;
  energizedSpeedMultiplier: number;
  randomAnimationIntervalSec: number;
  energizedAnimationClips: string[];
}

export interface GroundRescueSurgeConfig {
  name: string;
  keyCode: string;
  durationSec: number;
  cooldownSec: number;
  speed: number;
  afterimageIntervalSec: number;
  afterimageLifeSec: number;
  afterimageOpacity: number;
  afterimageColor: string;
  lockDirection: boolean;
}

export interface GroundExtraAbilitySlot {
  id: string;
  name: string;
  kind: GroundExtraAbilityKind;
  keyCode: string;
  color: string;
  durationSec: number;
  cooldownSec: number;
  radius: number;
  strength: number;
}

export interface GroundAbilityConfig {
  cloudRally: GroundCloudRallyConfig;
  rescueSurge: GroundRescueSurgeConfig;
  extraSlots: GroundExtraAbilitySlot[];
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
  name: string; // player-facing display
  role: string;
  description: string;
  sourceConfidence: SourceConfidence;
  color: string; // hex — placeholder mesh + UI tint
  defaultForm: CharacterForm;
  stats: CharacterStats;
  abilities: CharacterAbility[];
  missionSuitability: string[]; // MissionType ids this character suits
  transformationId?: string; // TransformationDefinition id
  cardImage?: string; // reference card filename in src/assets/cards (Character Select art)
  modelAssetId?: string; // kit model-library id — the ROBOT / ground model (e.g. 'super-wings/Jett+...')
  planeModelAssetId?: string; // optional separate PLANE/vehicle model used in flight (falls back to modelAssetId)
  modelScale?: number; // authored ground/destination model scale (Edit-Mode editable; unset = seed default).
  // Custom animation rules (reuse POLI AnimRule + animRunner.pickLoopRule): "which clip plays when"
  // (idle/moving/flying/vehicle/robot/ability/celebrate/key…). Drives every presenter when non-empty.
  animationRules?: AnimRule[];
  homeBaseLocationId?: string;
  // ── animation (clip names from the model's GLB; advanced trigger→clip rules live in 🎬 Model Studio) ──
  idleAnimation?: string; // clip played in previews / on the ground (empty = first clip)
  flightAnimation?: string; // clip played while flying (empty = first clip / Model-Studio rules)
  transformAnimation?: string; // clip played during transformation (Batch 6)
  groundAbility?: GroundAbilityConfig;
  // ── flavour / extra properties ──
  catchphrase?: string;
  preferredWeather?: WeatherKind;
}
