export type SourceConfidence =
  | 'OfficialConfirmed'
  | 'EpisodeObserved'
  | 'CrossSourceConfirmed'
  | 'SecondarySource'
  | 'FanCompiled'
  | 'Unverified'
  | 'GameAdaptation';

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
}
