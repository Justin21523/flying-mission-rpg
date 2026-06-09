import type { SourceConfidence } from './character';

export type IncidentType =
  | 'fire'
  | 'lost_person'
  | 'road_hazard'
  | 'fallen_cargo'
  | 'flat_tire'
  | 'fallen_tree'
  | 'lost_pet'
  | 'broken_signal'
  | 'road_water';
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
  // Gameplay tuning (all optional / editable via dropdowns in the 🚨 Incidents tab).
  difficulty?: number;        // 1–5
  cooldownSec?: number;       // min seconds before this can spawn again after resolving
  spawnTimeOfDay?: string;    // 'any' | 'dawn' | 'day' | 'evening' | 'night'
  spawnWeather?: string;      // 'any' | 'clear' | 'rain' | 'fog' | 'storm'
  requiredRescues?: number;   // license gate: rescues completed before this can appear
  requiredToolId?: string;    // tool that must be unlocked first
  rewardResearchPoints?: number; // research points granted on success
  victimCount?: number;       // residents/vehicles involved (flavour)
  targetNpcId?: string;       // the NPC/subject to rescue (dropdown)
  responderCharId?: string;   // recommended POLI character for this incident (dropdown)
}
