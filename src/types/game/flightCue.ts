// Flight cue timeline — the transformation-style, scrubbable timeline for the two flight legs (base
// fly-around + world flight). Each cue is keyed by path progress u∈[0,1] (the same axis the Flight Preview
// scrubs) and carries one of four authoring intents that PLAY BACK in the edit preview: a cinematic camera
// frame, a character action/animation, an event/prop appearance, or an environment/property change.
// Edit/preview-only — it never touches the play flight controllers or the FSM (flight feel is a core pillar).

export type FlightCueType = 'camera' | 'animation' | 'event' | 'environment';
export const FLIGHT_CUE_TYPES: readonly FlightCueType[] = ['camera', 'animation', 'event', 'environment'];

export interface FlightCue {
  id: string;
  type: FlightCueType;
  atU: number; // 0..1 along the path (the timeline axis)
  label?: string;

  // ── camera (cinematic frame around the craft; interpolated between camera cues) ──
  camDistance?: number;
  camHeight?: number;
  camAngleDeg?: number; // orbit yaw offset around the craft (0 = straight behind)
  camFov?: number;

  // ── animation / action (applied from this u until the next animation cue) ──
  clipName?: string; // animation clip to play on the craft
  clipSpeed?: number;
  bankDeg?: number; // extra visual roll
  speedMul?: number; // preview playback speed scale hint

  // ── event / prop (a model/marker that appears at this point on the route) ──
  eventAssetId?: string; // model-library id (empty = a plain marker)
  eventOffset?: [number, number, number]; // world offset from the craft position at atU
  eventScale?: number;

  // ── environment / property (applied from this u until the next environment cue) ──
  skyTop?: string;
  skyBottom?: string;
  fogDensity?: number; // 0..1 preview haze
  cloudHint?: number; // 0..1 author intent (shown as an indicator; play clouds stay system-driven)
}

export const DEFAULT_FLIGHT_CUE: Record<FlightCueType, Partial<FlightCue>> = {
  camera: { camDistance: 12, camHeight: 4, camAngleDeg: 0, camFov: 55 },
  animation: { clipName: '', clipSpeed: 1, bankDeg: 0, speedMul: 1 },
  event: { eventOffset: [0, 0, 0], eventScale: 1 },
  environment: { skyTop: '#4a90d9', skyBottom: '#d6ecff', fogDensity: 0, cloudHint: 0.4 },
};
