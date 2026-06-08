import type { IncidentDefinition } from '../../types/incident';

// POLI RPG — Brooms Town incident definitions.
// All three are GameAdaptation (no official incident scenarios from the show; designed for playability).
// Trust reward flags use the 'trust:{charId}:{amount}' encoding shared with quest rewards.
export const POLI_INCIDENTS: IncidentDefinition[] = [
  {
    id: 'incident_harbor_fire',
    type: 'fire',
    title: 'Harbor Fire!',
    description: 'Smoke is rising from the harbor warehouse — contain the fire fast!',
    spawnAreaId: 'harbor_front',
    markerPosition: [5, 1, -5],
    stages: [
      {
        id: 'stage_connect_hose',
        type: 'action',
        title: 'Connect the Hose!',
        description: 'Press [E] rapidly to connect the fire hose to the hydrant!',
        actionCount: 10,
        timeLimitSeconds: 20,
        retryHint: 'Try again — press [E] faster!',
      },
    ],
    safetyLesson: {
      title: 'Fire Safety',
      lesson: 'Leave fire zones to the professionals. Move to safety and call for help right away!',
    },
    reward: { exp: 100, flags: ['trust:harbor_worker:10'] },
    sourceConfidence: 'GameAdaptation',
  },
  {
    id: 'incident_lost_child',
    type: 'lost_person',
    title: 'Lost Child in the Forest',
    description: 'A child went missing near the forest edge — search the area!',
    spawnAreaId: 'forest_edge',
    markerPosition: [-2, 1, -2],
    stages: [
      {
        id: 'stage_search_waypoints',
        type: 'waypoints',
        title: 'Search the Area!',
        description: 'Visit all three marked search points to find the missing child.',
        waypointPositions: [
          [4, 1, 3],
          [-5, 1, 6],
          [1, 1, 9],
        ],
        retryHint: 'Keep searching! Some locations have not been checked yet.',
      },
    ],
    safetyLesson: {
      title: 'Forest Safety',
      lesson: 'Always tell an adult before entering a forest. Never explore alone!',
    },
    reward: { exp: 120, flags: ['trust:teacher_mi:10'] },
    sourceConfidence: 'GameAdaptation',
  },
  {
    id: 'incident_construction_hazard',
    type: 'road_hazard',
    title: 'Construction Site Evacuation',
    description: 'A hazard has been detected at the construction site — evacuate everyone now!',
    spawnAreaId: 'construction_site',
    markerPosition: [-3, 1, 4],
    stages: [
      {
        id: 'stage_evacuate',
        type: 'action',
        title: 'Evacuate Workers!',
        description: 'Press [E] rapidly to direct workers away from the danger zone!',
        actionCount: 8,
        timeLimitSeconds: 15,
        retryHint: 'Keep going — more workers are still in the danger zone!',
      },
    ],
    safetyLesson: {
      title: 'Construction Site Safety',
      lesson: 'Warning signs mean danger. Always take the long way around — never enter a restricted zone!',
    },
    reward: { exp: 100, flags: ['trust:site_foreman:10'] },
    sourceConfidence: 'GameAdaptation',
  },
];
