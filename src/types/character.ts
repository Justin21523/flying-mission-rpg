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

// Custom animation rules (editable per character in the POLI tab). The player's animation system evaluates
// every rule each frame and plays the highest-priority one whose trigger matches the current state. 'key'
// rules play their clip on a key press (celebrate/dance); 'once' plays through then releases.
export type AnimTrigger = 'always' | 'idle' | 'moving' | 'sprinting' | 'flying' | 'vehicle' | 'robot' | 'ability' | 'key';
export const ANIM_TRIGGERS: AnimTrigger[] = ['always', 'idle', 'moving', 'sprinting', 'flying', 'vehicle', 'robot', 'ability', 'key'];
export interface AnimRule {
  id: string;
  name?: string;         // free custom label for this rule
  clip: string;          // animation clip name in the model (chosen from the model's clips)
  trigger: AnimTrigger;
  speedMin?: number;     // optional horizontal-speed gate (m/s)
  speedMax?: number;
  key?: string;          // KeyboardEvent.code for trigger 'key' (e.g. 'KeyV')
  priority?: number;     // higher wins when multiple rules match (default 0)
  loop?: boolean;        // default true (false / once = play through once)
  once?: boolean;        // play once on trigger, then release back to the matching looping rule
  crossfadeSec?: number; // blend time, default 0.2
}

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
  animations?: AnimRule[];     // custom animation trigger rules (editable in the POLI tab)
  vehicleHeight?: number;    // normalize target height of the vehicle/car model (editable, default 1.4)
  robotHeight?: number;      // normalize target height of the robot model (editable, default 1.9)
  modelYOffset?: number;     // extra vertical nudge applied to the model (editable, default 0)
  modelYawDeg?: number;      // yaw (deg) correcting the model's authored forward axis so it faces forward (editable, default 0)
}
