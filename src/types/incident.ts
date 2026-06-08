import type { SourceConfidence } from './character';

export type IncidentType = 'fire' | 'lost_person' | 'road_hazard';
export type RescueStageType = 'action' | 'waypoints';
export type RescuePipelineStep = 'on_scene' | 'success' | 'debrief' | 'retry';

export interface RescueStage {
  id: string;
  type: RescueStageType;
  title: string;
  description: string;
  actionCount?: number;
  timeLimitSeconds?: number;
  waypointPositions?: [number, number, number][];
  retryHint: string;
}

export interface SafetyLesson {
  title: string;
  lesson: string;
}

export interface IncidentDefinition {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  spawnAreaId: string;
  markerPosition: [number, number, number];
  stages: RescueStage[];
  safetyLesson: SafetyLesson;
  reward: { exp: number; flags?: string[] };
  sourceConfidence: SourceConfidence;
}
