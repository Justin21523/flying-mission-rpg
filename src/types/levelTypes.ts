export type LevelLayoutType = 'linear-segments' | 'hub-and-spokes' | 'arena-chain' | 'semi-open' | 'boss-arena';

export interface LevelSpawnRegionDefinition {
  id: string;
  segmentId: string;
  label: string;
  center: [number, number, number];
  radius: number;
  allowedEncounterTypes?: string[];
  tags?: string[];
}

export interface LevelObjectiveMarkerDefinition {
  id: string;
  segmentId: string;
  objectiveId?: string;
  label: string;
  markerType?: string;
  position: [number, number, number];
  radius: number;
}

export interface LevelCameraHintDefinition {
  id: string;
  segmentId: string;
  focus: [number, number, number];
  distance?: number;
  priority?: number;
}

export type LevelLayoutDefinition = {
  id: string;
  stageId: string;
  name: string;
  layoutType: LevelLayoutType;
  segmentIds: string[];
  startSegmentId: string;
  finalSegmentIds: string[];
  navigation: {
    allowBacktracking: boolean;
    showMinimap: boolean;
    showPathGuide: boolean;
    lockSegmentUntilComplete: boolean;
  };
  spawnRegions: LevelSpawnRegionDefinition[];
  objectiveMarkers: LevelObjectiveMarkerDefinition[];
  cameraHints?: LevelCameraHintDefinition[];
  editorMeta?: {
    notes?: string;
  };
};

export interface LevelSegmentDefinition {
  id: string;
  layoutId: string;
  missionZoneSegmentId?: string;
  name: string;
  order: number;
  segmentType?: string;
  bounds?: { center: [number, number, number]; size: [number, number, number] };
  entryMarkerId?: string;
  exitMarkerIds?: string[];
  themeTag?: string;
  description?: string;
}
