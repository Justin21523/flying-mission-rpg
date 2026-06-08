import type { Quest } from '../../types/quest';

// POLI Brooms Town side-quests. Source confidence noted per POLI RPG rules.
// Rewards encode trust gains as 'trust:{charId}:{amount}' flags, parsed by PoliQuestRewardHandler.
export const POLI_QUESTS: Quest[] = [
  // ── Quest 1 — GameAdaptation ─────────────────────────────────────────────
  {
    id: 'quest_lost_toolbox',
    title: "The Lost Toolbox",
    description: "The Site Foreman lost his toolbox on a delivery route. Search Harbor Front and Forest Edge, then report back.",
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'site_foreman',
    objectives: [
      {
        id: 'obj_check_harbor',
        description: '前往港口搜索工具箱',
        isCompleted: false,
        track: { type: 'visitArea', targetId: 'harbor_front' },
      },
      {
        id: 'obj_check_forest',
        description: '前往森林邊緣搜索',
        isCompleted: false,
        track: { type: 'visitArea', targetId: 'forest_edge' },
      },
      {
        id: 'obj_report_back',
        description: '向工地主任報告結果',
        isCompleted: false,
      },
    ],
    reward: { exp: 80, flags: ['trust:site_foreman:15', 'toolbox_done'] },
  },

  // ── Quest 2 — SecondarySource ──────────────────────────────────────────────
  {
    id: 'quest_town_patrol',
    title: "Mayor's Town Patrol",
    description: "Mayor Lee wants Poli to scout the outer districts and report on their condition.",
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'mayor_lee',
    objectives: [
      {
        id: 'obj_visit_harbor',
        description: '巡察港口',
        isCompleted: false,
        track: { type: 'visitArea', targetId: 'harbor_front' },
      },
      {
        id: 'obj_visit_construction',
        description: '巡察工地',
        isCompleted: false,
        track: { type: 'visitArea', targetId: 'construction_site' },
      },
      {
        id: 'obj_visit_forest',
        description: '巡察森林邊緣',
        isCompleted: false,
        track: { type: 'visitArea', targetId: 'forest_edge' },
      },
      {
        id: 'obj_report_mayor',
        description: '向市長回報巡察結果',
        isCompleted: false,
      },
    ],
    reward: { exp: 120, flags: ['trust:mayor_lee:20', 'patrol_done'] },
  },

  // ── Quest 3 — SecondarySource ──────────────────────────────────────────────
  {
    id: 'quest_house_calls',
    title: "Dr. Kim's House Calls",
    description: "Dr. Kim needs Poli to deliver health checkup forms to Teacher Mi and the harbor staff.",
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'dr_kim',
    objectives: [
      {
        id: 'obj_visit_teacher',
        description: '探訪米老師（和她說話）',
        isCompleted: false,
        track: { type: 'talkToNPC', targetId: 'teacher_mi' },
      },
      {
        id: 'obj_visit_harbor',
        description: '前往港口探訪港務員',
        isCompleted: false,
        track: { type: 'visitArea', targetId: 'harbor_front' },
      },
      {
        id: 'obj_return_dr',
        description: '回報給金醫生',
        isCompleted: false,
      },
    ],
    reward: { exp: 100, flags: ['trust:dr_kim:15', 'health_check_done'] },
  },
];
