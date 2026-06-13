export type FlightTimelineVec3 = [number, number, number];

export type FlightTimelineInterpolation = 'linear' | 'hold';

export type FlightTimelineTarget =
  | { kind: 'craft' }
  | { kind: 'camera' };

export interface FlightTimelineKeyframe {
  u: number;
  position?: FlightTimelineVec3;
  rotation?: FlightTimelineVec3;
  scale?: number;
  distance?: number;
  height?: number;
  angleDeg?: number;
}

export interface FlightTimelineTrack {
  id: string;
  target: FlightTimelineTarget;
  interpolation?: FlightTimelineInterpolation;
  keyframes: FlightTimelineKeyframe[];
}

