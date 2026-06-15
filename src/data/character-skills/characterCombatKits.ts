import type { CharacterCombatKitDefinition, ComboSkillDefinition, CharacterModelSocketConfig } from '../../types/game/characterKit';

// MVP combat kits (Batch D-kits) for the 4 core rescue heroes. defaultSkillIds reference the kit skills
// (kitSkills.ts); combos + sockets are inline. Kits take precedence over the generic per-character skills.

const SOCKETS = (characterId: string, extra: CharacterModelSocketConfig['sockets']): CharacterModelSocketConfig => ({
  characterId,
  sockets: [
    { socketName: 'root', fallbackOffset: [0, 0, 0] },
    { socketName: 'chest-core', fallbackOffset: [0, 1.2, 0.3] },
    ...extra,
  ],
});

const JETT_COMBOS: ComboSkillDefinition[] = [
  { id: 'jett_combo_dash_rush', characterId: 'char_jett', name: 'Dash → Rush', inputSequence: ['jett_kit_basic', 'jett_kit_rush'], maxInputGapSeconds: 0.8, resultSkillId: 'jett_kit_rush', bonusEffects: { damageMultiplier: 1.4, forceCrit: true } },
  { id: 'jett_combo_evade_counter', characterId: 'char_jett', name: 'Evade → Counter', inputSequence: ['jett_kit_evade', 'jett_kit_basic'], maxInputGapSeconds: 1, requiredPreviousSkillId: 'jett_kit_evade', resultSkillId: 'jett_kit_basic', bonusEffects: { damageMultiplier: 1.6, forceCrit: true } },
];
const DONNIE_COMBOS: ComboSkillDefinition[] = [
  { id: 'donnie_combo_cover_smash', characterId: 'char_donnie', name: 'Cover → Smash', inputSequence: ['donnie_kit_cover', 'donnie_kit_basic'], maxInputGapSeconds: 1, resultSkillId: 'donnie_kit_overclock', bonusEffects: { addAttackTags: ['heavy-impact'] } },
  { id: 'donnie_combo_repair_overclock', characterId: 'char_donnie', name: 'Repair → Overclock', inputSequence: ['donnie_kit_repair', 'donnie_kit_basic'], maxInputGapSeconds: 1, requiredPreviousSkillId: 'donnie_kit_repair', resultSkillId: 'donnie_kit_overclock', bonusEffects: { damageMultiplier: 1.5 } },
];
const PAUL_COMBOS: ComboSkillDefinition[] = [
  { id: 'paul_combo_cuff_break', characterId: 'char_paul', name: 'Cuff → Baton Break', inputSequence: ['paul_kit_cuff', 'paul_kit_basic'], maxInputGapSeconds: 1, requiredPreviousSkillId: 'paul_kit_cuff', resultSkillId: 'paul_kit_basic', bonusEffects: { damageMultiplier: 1.5, addAttackTags: ['stagger'] } },
  { id: 'paul_combo_block_push', characterId: 'char_paul', name: 'Shield → Push', inputSequence: ['paul_kit_shield', 'paul_kit_barrier'], maxInputGapSeconds: 1.2, resultSkillId: 'paul_kit_barrier', bonusEffects: { energyRefund: 10 } },
];
const CHASE_COMBOS: ComboSkillDefinition[] = [
  { id: 'chase_combo_scan_shot', characterId: 'char_chase', name: 'Scan → Pulse', inputSequence: ['chase_kit_scan', 'chase_kit_basic'], maxInputGapSeconds: 1, requiredPreviousSkillId: 'chase_kit_scan', resultSkillId: 'chase_kit_basic', bonusEffects: { damageMultiplier: 1.8, forceCrit: true } },
  { id: 'chase_combo_decoy_grid', characterId: 'char_chase', name: 'Decoy → Grid', inputSequence: ['chase_kit_decoy', 'chase_kit_grid'], maxInputGapSeconds: 1.5, resultSkillId: 'chase_kit_grid', bonusEffects: { damageMultiplier: 1.4 } },
];

export const SEED_CHARACTER_KITS: CharacterCombatKitDefinition[] = [
  {
    id: 'char_jett', characterId: 'char_jett', displayName: 'Jett', roleTypes: ['speed', 'rescue'],
    defaultSkillIds: { basic: 'jett_kit_basic', special1: 'jett_kit_rush', special2: 'jett_kit_missile', aoe: 'jett_kit_cyclone', defense: 'jett_kit_evade', utility: 'jett_kit_speed', ultimatePlaceholder: 'jett_kit_ultimate' },
    comboSkillIds: JETT_COMBOS.map((c) => c.id), combos: JETT_COMBOS,
    stageUtilityRules: [{ id: 'jett_u_speed', utilityType: 'speed-gate', validTargetTags: ['speed-gate', 'reach-marker'], requiredSkillTags: ['speed-gate'], effect: 'reveal-marker', value: 1 }],
    modelSocketConfig: SOCKETS('char_jett', [{ socketName: 'wing-left', fallbackOffset: [-0.8, 1, 0.2] }, { socketName: 'wing-right', fallbackOffset: [0.8, 1, 0.2] }, { socketName: 'thruster-left', fallbackOffset: [-0.4, 0.6, -0.8] }]),
    recommendedAgainst: { enemyTypes: ['pulse-turret'], zoneSegmentTypes: ['exploration'] }, weakAgainst: { enemyTypes: ['shield-carrier'], obstacleTypes: ['cracked-wall'], notes: 'Weak vs heavy armour / walls.' },
    editorMeta: { themeColor: '#e8442c', difficulty: 'easy' },
  },
  {
    id: 'char_donnie', characterId: 'char_donnie', displayName: 'Donnie', roleTypes: ['engineering', 'repair', 'utility'],
    defaultSkillIds: { basic: 'donnie_kit_basic', special1: 'donnie_kit_repair', special2: 'donnie_kit_cover', aoe: 'donnie_kit_matrix', defense: 'donnie_kit_barricade', utility: 'donnie_kit_overclock', ultimatePlaceholder: 'donnie_kit_ultimate' },
    comboSkillIds: DONNIE_COMBOS.map((c) => c.id), combos: DONNIE_COMBOS,
    stageUtilityRules: [
      { id: 'donnie_u_repair', utilityType: 'repair-device', validTargetTags: ['repair'], requiredSkillTags: ['repair'], effect: 'repair-object', value: 100 },
      { id: 'donnie_u_wall', utilityType: 'clear-obstacle', validTargetTags: ['heavy-impact'], effect: 'change-obstacle-state' },
    ],
    modelSocketConfig: SOCKETS('char_donnie', [{ socketName: 'tool-arm', fallbackOffset: [0.7, 1, 0.6] }]),
    recommendedAgainst: { obstacleTypes: ['cracked-wall', 'corrupted-device'] }, weakAgainst: { enemyTypes: ['crusher-drone'], notes: 'Weak vs fast enemies.' },
    editorMeta: { themeColor: '#f5b21e', difficulty: 'normal' },
  },
  {
    id: 'char_paul', characterId: 'char_paul', displayName: 'Paul', roleTypes: ['defense', 'control'],
    defaultSkillIds: { basic: 'paul_kit_basic', special1: 'paul_kit_cuff', special2: 'paul_kit_barrier', aoe: 'paul_kit_order', defense: 'paul_kit_shield', utility: 'paul_kit_protect', ultimatePlaceholder: 'paul_kit_ultimate' },
    comboSkillIds: PAUL_COMBOS.map((c) => c.id), combos: PAUL_COMBOS,
    stageUtilityRules: [{ id: 'paul_u_protect', utilityType: 'protect-npc', validTargetTags: ['protect'], effect: 'debug-log' }],
    modelSocketConfig: SOCKETS('char_paul', [{ socketName: 'shield-front', fallbackOffset: [0, 1, 1] }, { socketName: 'hand-right', fallbackOffset: [0.6, 1, 0.4] }]),
    recommendedAgainst: { enemyTypes: ['pulse-turret', 'crusher-drone'] }, weakAgainst: { obstacleTypes: ['cracked-wall'], notes: 'Low burst / break.' },
    editorMeta: { themeColor: '#2b4c8c', difficulty: 'normal' },
  },
  {
    id: 'char_chase', characterId: 'char_chase', displayName: 'Chase', roleTypes: ['scanner', 'precision', 'stealth'],
    defaultSkillIds: { basic: 'chase_kit_basic', special1: 'chase_kit_scan', special2: 'chase_kit_decoy', aoe: 'chase_kit_grid', defense: 'chase_kit_cloak', utility: 'chase_kit_trapscan', ultimatePlaceholder: 'chase_kit_ultimate' },
    comboSkillIds: CHASE_COMBOS.map((c) => c.id), combos: CHASE_COMBOS,
    stageUtilityRules: [{ id: 'chase_u_scan', utilityType: 'scan-weakpoint', validTargetTags: ['scan'], requiredSkillTags: ['scan'], effect: 'reveal-marker' }],
    modelSocketConfig: SOCKETS('char_chase', [{ socketName: 'scanner-head', fallbackOffset: [0, 1.6, 0.4] }]),
    recommendedAgainst: { enemyTypes: ['shield-carrier'] }, weakAgainst: { enemyTypes: ['crusher-drone'], notes: 'Weak when swarmed up close.' },
    editorMeta: { themeColor: '#3b4a78', difficulty: 'hard' },
  },
];

export const MVP_KIT_CHARACTER_IDS = SEED_CHARACTER_KITS.map((k) => k.characterId);
