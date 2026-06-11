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
  worldMagnetRadius: number; // world-flight: pickups within this of the craft curve toward it (0 = off)
  comboWindowSec: number; // world-flight: max seconds between pickups to keep the combo going
  boostSpeedMul: number; // world-flight: speed multiplier while a boost pickup is active
  boostDurationSec: number; // world-flight: how long a boost pickup lasts
  goldenChance: number; // world-flight: 0..1 chance a reward pickup spawns golden (big reward)
  goldenMultiplier: number; // world-flight: reward × for a golden pickup
  worldCraftYawDeg: number; // craft model facing offset (deg) — dial so the nose points along travel
  worldSteerRange: number; // world-flight: max lateral offset from the route centreline (A/D)
  worldVertRange: number; // world-flight: max vertical offset from the route (↑/↓)
  worldSteerSmooth: number; // world-flight: bank ease (higher = snappier)
  worldBankDeg: number; // world-flight: bank-into-turn roll (deg) for the A/D feel
  worldSteerSpeed: number; // world-flight: lateral drift speed while holding A/D (units/sec)
  worldVertSpeed: number; // world-flight: climb/descend speed while holding Space/Shift (units/sec)
  worldCloudScale: number; // world-flight: cloud-puff size multiplier
  worldFlightDurationSec: number; // world-flight: end-to-end flight time (unified across routes)
  launchDurationSec: number; // launch tunnel: sprint duration before BASE_FLY_AROUND
  launchTunnelLength: number; // launch tunnel: visual tunnel length (matches the sprint distance)
  worldCraftScale: number; // extra craft scale during flight (on top of the Model Studio scale)
  worldCraftOffset: [number, number, number]; // craft placement offset from the route start (edit-authored)
  worldCamDistance: number; // WORLD_FLIGHT-only camera distance (very close → the craft reads big)
  worldCamHeight: number; // WORLD_FLIGHT-only camera height
  // ── BASE fly-around (LAUNCH_TUNNEL / BASE_FLY_AROUND / CLOUD_ASCENT) — independent of the world leg ──
  flyAroundCamDistance: number; // base-loop camera distance
  flyAroundCamHeight: number; // base-loop camera height
  flyAroundCraftScale: number; // base-loop craft scale
  flyAroundCraftYawDeg: number; // base-loop craft facing offset
  flyAroundCraftOffset: [number, number, number]; // base-loop craft placement offset from the path start
}
