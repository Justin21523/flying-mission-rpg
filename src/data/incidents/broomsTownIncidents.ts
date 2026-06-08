import type { IncidentDefinition } from '../../types/incident';

// POLI RPG — Brooms Town incident definitions.
// All three are GameAdaptation (no official incident scenarios from the show; designed for playability).
// Trust reward flags use the same 'trust:{charId}:{amount}' encoding as quest rewards.
export const POLI_INCIDENTS: IncidentDefinition[] = [
  {
    id: 'incident_harbor_fire',
    type: 'fire',
    titleZhTW: '港口小火災',
    descriptionZhTW: '港口倉庫冒出火煙！需要馬上控制火勢。',
    spawnAreaId: 'harbor_front',
    markerPosition: [5, 1, -5],
    stages: [
      {
        id: 'stage_connect_hose',
        type: 'action',
        titleZhTW: '接上水管！',
        descriptionZhTW: '快速按下 [E] 把滅火水管接到消防栓！',
        actionCount: 10,
        timeLimitSeconds: 20,
        retryHintZhTW: '再試一次！按快一點！',
      },
    ],
    safetyLesson: {
      titleZhTW: '火災安全',
      lessonZhTW: '火災現場讓專業人員處理，自己要馬上遠離危險區域！',
    },
    reward: { exp: 100, flags: ['trust:harbor_worker:10'] },
    sourceConfidence: 'GameAdaptation',
  },
  {
    id: 'incident_lost_child',
    type: 'lost_person',
    titleZhTW: '森林走失的小朋友',
    descriptionZhTW: '有一個小朋友在森林邊緣迷路了！到附近搜尋吧。',
    spawnAreaId: 'forest_edge',
    markerPosition: [-2, 1, -2],
    stages: [
      {
        id: 'stage_search_waypoints',
        type: 'waypoints',
        titleZhTW: '搜尋小朋友！',
        descriptionZhTW: '走到地圖上標示的三個搜尋地點，尋找小朋友的蹤跡。',
        waypointPositions: [
          [4, 1, 3],
          [-5, 1, 6],
          [1, 1, 9],
        ],
        retryHintZhTW: '繼續找！還有地點還沒搜尋到。',
      },
    ],
    safetyLesson: {
      titleZhTW: '森林安全',
      lessonZhTW: '走進森林一定要告訴大人，永遠不要獨自行動！',
    },
    reward: { exp: 120, flags: ['trust:teacher_mi:10'] },
    sourceConfidence: 'GameAdaptation',
  },
  {
    id: 'incident_construction_hazard',
    type: 'road_hazard',
    titleZhTW: '工地緊急疏散',
    descriptionZhTW: '工地有危險狀況！必須立刻疏散附近的人員。',
    spawnAreaId: 'construction_site',
    markerPosition: [-3, 1, 4],
    stages: [
      {
        id: 'stage_evacuate',
        type: 'action',
        titleZhTW: '疏散人群！',
        descriptionZhTW: '快速按下 [E] 指揮工地人員撤離危險區域！',
        actionCount: 8,
        timeLimitSeconds: 15,
        retryHintZhTW: '繼續疏散！還有人在危險區域！',
      },
    ],
    safetyLesson: {
      titleZhTW: '工地安全',
      lessonZhTW: '工地有警示標誌代表有危險，一定要繞道，不能靠近！',
    },
    reward: { exp: 100, flags: ['trust:site_foreman:10'] },
    sourceConfidence: 'GameAdaptation',
  },
];
