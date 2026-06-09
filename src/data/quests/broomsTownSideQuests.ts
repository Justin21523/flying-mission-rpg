import type { EditorQuest, EditorObjective } from '../../types/editorQuest';

// POLI RPG — three resident side-quests, authored as editable EditorQuests so they appear in the
// 📜 Quest tab and the 🧑 NPC tab (givers) and can be retuned freely. GameAdaptation: episode-flavoured
// resident chores, designed for playability — not lifted from canon. Each is givable + turn-in by its
// giver NPC (the seed wires startsQuestIds + completesQuestIds to the quest id).

// A giver to seed as an editable NPC. The quest's startingNPCId is filled in with the generated NPC id.
export interface SideQuestGiver {
  /** Stable seed key so re-seeding is idempotent by name. */
  name: string;
  role: string;
  description: string;
  color: string;
  areaId: string;
  position: [number, number, number];
  modelAssetId?: string; // optional GLB model (model-library id) for the giver NPC
  quest: EditorQuest;
}

const obj = (id: string, type: EditorObjective['type'], targetId: string, description: string): EditorObjective => ({
  id, type, targetId, description, requiredCount: 1,
});

export const BROOMS_TOWN_SIDE_QUESTS: SideQuestGiver[] = [
  {
    name: 'Cleany',
    role: 'Street Sweeper',
    description: 'Keeps Brooms Town tidy and cheerful — always sweeping up after a busy day.',
    color: '#38bdf8',
    areaId: 'main_road',
    position: [3, 0, 4],
    quest: {
      id: 'quest_cleany_sweep',
      code: 'SQ_CLEANY_SWEEP',
      title: "Cleany's Road Sweep",
      description: 'Cleany needs a hand checking the busiest streets for litter and hazards.',
      category: 'side',
      recommendedLevel: 1,
      prerequisiteQuestIds: [],
      relatedAreaIds: ['main_road', 'central_plaza', 'harbor_front'],
      relatedNPCIds: [],
      objectives: [
        obj('obj_sweep_road', 'visitArea', 'main_road', 'Sweep the Main Road'),
        obj('obj_sweep_plaza', 'visitArea', 'central_plaza', 'Check the Central Plaza'),
        obj('obj_sweep_harbor', 'visitArea', 'harbor_front', 'Tidy up the Harbor Front'),
      ],
      rewards: [
        { id: 'rwd_cleany_exp', type: 'exp', amount: 90 },
      ],
      unlocksAreaIds: [],
      unlocksQuestIds: [],
      setsWorldFlags: ['quest_cleany_sweep_done'],
      tags: ['poli', 'resident', 'chore'],
      isEnabled: true,
    },
  },
  {
    name: 'Posty',
    role: 'Mail Carrier',
    description: 'Brooms Town’s reliable mail carrier, zipping letters across every district.',
    color: '#f59e0b',
    areaId: 'central_plaza',
    position: [-3, 0, 4],
    quest: {
      id: 'quest_posty_mail',
      code: 'SQ_POSTY_MAIL',
      title: "Posty's Mail Run",
      description: 'Posty has a full mailbag — help deliver to every district before sundown.',
      category: 'side',
      recommendedLevel: 1,
      prerequisiteQuestIds: [],
      relatedAreaIds: ['central_plaza', 'school_district', 'rescue_hq'],
      relatedNPCIds: [],
      objectives: [
        obj('obj_mail_school', 'visitArea', 'school_district', 'Deliver mail to the School District'),
        obj('obj_mail_hq', 'visitArea', 'rescue_hq', 'Deliver mail to Rescue HQ'),
        obj('obj_mail_plaza', 'visitArea', 'central_plaza', 'Return to the Central Plaza'),
      ],
      rewards: [
        { id: 'rwd_posty_exp', type: 'exp', amount: 100 },
      ],
      unlocksAreaIds: [],
      unlocksQuestIds: [],
      setsWorldFlags: ['quest_posty_mail_done'],
      tags: ['poli', 'resident', 'chore'],
      isEnabled: true,
    },
  },
  {
    name: 'School B',
    role: 'School Bus',
    description: 'The friendly school bus who carries the children safely to and from class.',
    color: '#facc15',
    areaId: 'school_district',
    position: [0, 0, 5],
    quest: {
      id: 'quest_schoolb_pickup',
      code: 'SQ_SCHOOLB_PICKUP',
      title: 'School B Safe Pickup',
      description: 'School B needs an escort to pick the children up and bring them home safely.',
      category: 'side',
      recommendedLevel: 1,
      prerequisiteQuestIds: [],
      relatedAreaIds: ['school_district', 'central_plaza'],
      relatedNPCIds: [],
      objectives: [
        obj('obj_pickup_school', 'visitArea', 'school_district', 'Meet School B at the School District'),
        obj('obj_pickup_plaza', 'visitArea', 'central_plaza', 'Escort the children through the Plaza'),
        obj('obj_pickup_return', 'reachLocation', 'school_district', 'Bring everyone safely back to school'),
      ],
      rewards: [
        { id: 'rwd_schoolb_exp', type: 'exp', amount: 110 },
        { id: 'rwd_schoolb_trust', type: 'worldFlag', targetId: 'trust:teacher_mi:10' },
      ],
      unlocksAreaIds: [],
      unlocksQuestIds: [],
      setsWorldFlags: ['quest_schoolb_pickup_done'],
      tags: ['poli', 'resident', 'safety'],
      isEnabled: true,
    },
  },
  {
    name: 'Nurse Annie',
    role: 'Clinic Nurse',
    description: 'Dr. Kim’s helpful clinic nurse — always rushing medicine where it’s needed.',
    color: '#f472b6',
    areaId: 'central_plaza',
    position: [4, 0, -3],
    modelAssetId: 'npcs/stylized+nurse+3d+model',
    quest: {
      id: 'quest_clinic_supplies',
      code: 'SQ_CLINIC_SUPPLIES',
      title: 'Clinic Supply Run',
      description: 'Nurse Annie needs medicine delivered around town before evening clinic hours.',
      category: 'side',
      recommendedLevel: 1,
      prerequisiteQuestIds: [],
      relatedAreaIds: ['central_plaza', 'school_district', 'charging_station'],
      relatedNPCIds: [],
      objectives: [
        obj('obj_clinic_school', 'visitArea', 'school_district', 'Deliver first-aid kits to the School District'),
        obj('obj_clinic_charge', 'visitArea', 'charging_station', 'Drop off supplies at the Charging Station'),
        obj('obj_clinic_back', 'reachLocation', 'central_plaza', 'Report back to the clinic in the Plaza'),
      ],
      rewards: [
        { id: 'rwd_clinic_exp', type: 'exp', amount: 130 },
        { id: 'rwd_clinic_trust', type: 'worldFlag', targetId: 'trust:dr_kim:15' },
      ],
      unlocksAreaIds: [],
      unlocksQuestIds: [],
      setsWorldFlags: ['quest_clinic_supplies_done'],
      tags: ['poli', 'resident', 'chore'],
      isEnabled: true,
    },
  },
  {
    name: 'Dockmaster Dan',
    role: 'Harbor Dockmaster',
    description: 'Runs the harbor day to day — keeps the docks safe and the cargo moving.',
    color: '#0ea5e9',
    areaId: 'harbor_front',
    position: [-4, 0, 3],
    modelAssetId: 'npcs/rescue+dispatcher+3d+model',
    quest: {
      id: 'quest_harbor_cleanup',
      code: 'SQ_HARBOR_CLEANUP',
      title: 'Harbor Safety Sweep',
      description: 'Dockmaster Dan wants the harbor and beach checked for hazards after the storm.',
      category: 'side',
      recommendedLevel: 1,
      prerequisiteQuestIds: [],
      relatedAreaIds: ['harbor_front', 'coast_beach', 'construction_site'],
      relatedNPCIds: [],
      objectives: [
        obj('obj_harbor_dock', 'visitArea', 'harbor_front', 'Inspect the Harbor Front'),
        obj('obj_harbor_beach', 'visitArea', 'coast_beach', 'Check Sunny Beach for debris'),
        obj('obj_harbor_site', 'reachLocation', 'harbor_front', 'Report the all-clear at the docks'),
      ],
      rewards: [
        { id: 'rwd_harbor_exp', type: 'exp', amount: 120 },
        { id: 'rwd_harbor_trust', type: 'worldFlag', targetId: 'trust:harbor_worker:15' },
      ],
      unlocksAreaIds: [],
      unlocksQuestIds: [],
      setsWorldFlags: ['quest_harbor_cleanup_done'],
      tags: ['poli', 'resident', 'safety'],
      isEnabled: true,
    },
  },
];
