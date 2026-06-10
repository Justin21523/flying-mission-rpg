// Tunable flight-handling parameters — editable in Edit Mode (🛩 Flight tab) so the feel can be dialed
// without code. Per-character stats (flightSpeed / agility / controlDifficulty) further scale these at
// runtime. Flight feel is a core pillar — keep it smooth.
export type FlightMode = 'simple' | 'advanced';
export const FLIGHT_MODES: readonly FlightMode[] = ['simple', 'advanced'];

export interface FlightTuning {
  maxSpeed: number; // units/sec at full throttle (base; ×character flightSpeed)
  cruiseSpeed: number; // auto-forward speed with no throttle input
  stallSpeed: number; // below this the craft sinks (lose lift)
  throttleAccel: number; // speed gained per second at full throttle
  brakeDecel: number; // speed lost per second braking
  pitchRate: number; // rad/sec (base; ×character agility)
  yawRate: number;
  rollRate: number;
  turnSmooth: number; // angular-velocity smoothing (higher = snappier, lower = floatier)
  autoLevel: number; // 0..1 auto roll/pitch leveling when no input (simple mode uses more)
  fovBase: number; // camera FOV (deg) at low speed
  fovMax: number; // camera FOV (deg) at max speed
  camDistance: number; // 3rd-person follow distance
  camHeight: number; // follow height above the craft
  camPullback: number; // extra distance while accelerating
  rollFollow: number; // 0..1 how much the camera follows the craft roll (comfort mode halves it)
  boundaryRadius: number; // soft fly-around boundary from the base centre (auto re-centre beyond it)
  worldCloudCount: number; // world-flight: number of recycled cloud puffs in the floor below
  worldEventMaxActive: number; // world-flight: max concurrent flight events
  worldEventSpawnGap: number; // world-flight: min seconds between event spawns
}
