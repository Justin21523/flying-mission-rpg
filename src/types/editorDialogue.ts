import type { DialogueEffect, DialogueCondition, DialogueEmotion } from './dialogue';

// Kit — editor metadata for authoring dialogue effects/conditions. The runtime unions in dialogue.ts are
// the source of truth; these tables drive the UI and carry per-field kinds so number fields coerce
// correctly. Only the kit's GENERIC effect/condition kinds are listed (no yokai/battle/activity).
export type DialogueEffectType = DialogueEffect['type'];
export type DialogueConditionType = DialogueCondition['type'];

export interface MechField {
  key: string;
  label: string;
  kind: 'string' | 'number';
  optional?: boolean;
}

export const DIALOGUE_EMOTIONS: DialogueEmotion[] = [
  'neutral', 'happy', 'sad', 'angry', 'surprised', 'worried', 'thinking', 'excited',
];

export const DIALOGUE_EFFECT_TYPES: DialogueEffectType[] = [
  'startQuest', 'completeQuest', 'updateObjective', 'completeObjective',
  'addItem', 'giveItem', 'giftItem', 'setWorldFlag', 'startBattle', 'startActivity', 'closeDialogue',
  'increaseTrust', 'startIncident', 'unlockTool',
  'setForm', 'setActiveCharacter', 'spawnRandomIncident',
  'startMission', 'openMiniGame', 'startHunt',
];

export const DIALOGUE_CONDITION_TYPES: DialogueConditionType[] = [
  'hasItem', 'questInProgress', 'questCompleted', 'objectiveCompleted',
  'doorUnlocked', 'worldFlagSet', 'playerLevel', 'trustLevel',
  'toolUnlocked', 'activeCharIs', 'activeFormIs',
];

export const EFFECT_FIELDS: Record<DialogueEffectType, MechField[]> = {
  startQuest: [{ key: 'questId', label: 'questId', kind: 'string' }],
  completeQuest: [{ key: 'questId', label: 'questId', kind: 'string' }],
  updateObjective: [{ key: 'questId', label: 'questId', kind: 'string' }, { key: 'objectiveId', label: 'objectiveId', kind: 'string' }],
  completeObjective: [{ key: 'questId', label: 'questId', kind: 'string' }, { key: 'objectiveId', label: 'objectiveId', kind: 'string' }],
  addItem: [{ key: 'itemId', label: 'itemId', kind: 'string' }, { key: 'quantity', label: 'quantity', kind: 'number', optional: true }],
  giveItem: [{ key: 'itemId', label: 'itemId', kind: 'string' }, { key: 'quantity', label: 'quantity', kind: 'number', optional: true }],
  giftItem: [{ key: 'itemId', label: 'itemId', kind: 'string' }, { key: 'characterId', label: 'characterId', kind: 'string' }],
  setWorldFlag: [{ key: 'flag', label: 'flag', kind: 'string' }],
  startBattle: [{ key: 'encounterId', label: 'encounterId', kind: 'string' }],
  startActivity: [{ key: 'activityId', label: 'activityId', kind: 'string' }],
  closeDialogue: [],
  increaseTrust: [{ key: 'characterId', label: 'characterId', kind: 'string' }, { key: 'amount', label: 'amount', kind: 'number' }],
  startIncident: [{ key: 'incidentId', label: 'Incident ID', kind: 'string' }],
  unlockTool: [{ key: 'toolId', label: 'Tool ID', kind: 'string' }],
  setForm: [{ key: 'form', label: 'form (vehicle/robot)', kind: 'string' }],
  setActiveCharacter: [{ key: 'charId', label: 'charId (poli/roy/helly/amber)', kind: 'string' }],
  spawnRandomIncident: [],
  startMission: [{ key: 'missionId', label: 'missionId', kind: 'string' }],
  openMiniGame: [{ key: 'miniGameId', label: 'miniGameId (e.g. repair_wiring)', kind: 'string' }],
  startHunt: [],
};

export const COND_FIELDS: Record<DialogueConditionType, MechField[]> = {
  hasItem: [{ key: 'targetId', label: 'itemId', kind: 'string' }],
  questInProgress: [{ key: 'targetId', label: 'questId', kind: 'string' }],
  questCompleted: [{ key: 'targetId', label: 'questId', kind: 'string' }],
  objectiveCompleted: [{ key: 'questId', label: 'questId', kind: 'string' }, { key: 'objectiveId', label: 'objectiveId', kind: 'string' }],
  doorUnlocked: [{ key: 'doorId', label: 'doorId', kind: 'string' }],
  worldFlagSet: [{ key: 'flag', label: 'flag', kind: 'string' }],
  playerLevel: [{ key: 'level', label: 'level', kind: 'number' }],
  trustLevel: [{ key: 'characterId', label: 'characterId', kind: 'string' }, { key: 'minTrust', label: 'minTrust', kind: 'number' }],
  toolUnlocked: [{ key: 'toolId', label: 'Tool ID', kind: 'string' }],
  activeCharIs: [{ key: 'charId', label: 'charId', kind: 'string' }],
  activeFormIs: [{ key: 'form', label: 'form (vehicle/robot)', kind: 'string' }],
};

// Build a typed object from string/number field inputs (coerces number fields).
export function buildMech<T extends Record<string, unknown>>(type: string, fields: MechField[], raw: Record<string, string>): T {
  const out: Record<string, unknown> = { type };
  for (const f of fields) {
    const v = raw[f.key];
    if (v === undefined || v === '') {
      if (!f.optional) out[f.key] = f.kind === 'number' ? 0 : '';
      continue;
    }
    out[f.key] = f.kind === 'number' ? (parseFloat(v) || 0) : v;
  }
  return out as T;
}
