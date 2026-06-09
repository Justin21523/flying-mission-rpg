export type SourceConfidence =
  | 'OfficialConfirmed'
  | 'EpisodeObserved'
  | 'CrossSourceConfirmed'
  | 'SecondarySource'
  | 'FanCompiled'
  | 'Unverified'
  | 'GameAdaptation';

// Built-in, child-friendly rescue abilities (no combat). speed_boost is a self speed buff; the others are
// radial "pulses" (FX + gameplay hook: attract pickups, refill the boost meter, or reveal on the radar).
export type AbilityType = 'water_spray' | 'wind_gust' | 'heal_aura' | 'scan_pulse' | 'speed_boost';
export const ABILITY_TYPES: AbilityType[] = ['water_spray', 'wind_gust', 'heal_aura', 'scan_pulse', 'speed_boost'];

export interface CharacterDefinition {
  id: string;
  name: string;
  nameZhTW: string;
  role: string;
  description: string;
  sourceConfidence: SourceConfidence;
  homeAreaId: string;
  color: string;           // hex — used for capsule placeholder and UI
  dialogueTreeId: string;
  modelRobotPath?: string;   // GLB for robot / humanoid NPC form
  modelVehiclePath?: string; // GLB for vehicle form
  canFly?: boolean;          // playable: can enter flight mode (F) — e.g. Helly the helicopter
  rotorOffset?: [number, number, number];      // flight rotor offset in VEHICLE form (editable)
  rotorOffsetRobot?: [number, number, number]; // flight rotor offset in ROBOT form (editable)
  rotorScale?: number;       // uniform scale of the flight rotor (editable in POLI tab)
  abilityName?: string;      // playable special ability (Q) name (editable)
  abilityColor?: string;     // ability VFX colour, hex; defaults to the character colour (editable)
  abilityType?: AbilityType; // which built-in ability the character uses on Q (editable)
  abilityRadius?: number;    // effect radius (world units) — editable
  abilityDuration?: number;  // effect duration (seconds) — editable
  abilityStrength?: number;  // effect strength (e.g. speed multiplier / pull force) — editable
  abilityCooldownSec?: number; // seconds between uses — editable
  // Per-character super-boost (meter-full → R). Falls back to the global ⭐ Boost config when unset.
  superSpeedMult?: number;     // movement multiplier while super
  superDurationSec?: number;   // how long super lasts
  superFlies?: boolean;        // super also forces flight
  afterimageColor?: string;    // colour of the afterimage (分身) trail
  vehicleHeight?: number;    // normalize target height of the vehicle/car model (editable, default 1.4)
  robotHeight?: number;      // normalize target height of the robot model (editable, default 1.9)
  modelYOffset?: number;     // extra vertical nudge applied to the model (editable, default 0)
}
