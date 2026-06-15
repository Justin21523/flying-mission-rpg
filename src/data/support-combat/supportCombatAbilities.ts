import type { SupportCombatAbilityDefinition } from '../../types/game/supportCombat';

// MVP support-combat abilities (Batch E) — keyed to the four playable heroes acting as support:
//   Jett  → Strike    Donnie → Repair + Break    Paul → Shield + Taunt    Chase → Scan
// Each ability is data-driven and routes its `effects[]` through the existing combat/obstacle/zone seams
// (SupportAbilityRuntime). Model-first visuals come from SEED_SUPPORT_EFFECTS + a `characters/*` GLB for
// the decoy / strike silhouette (model id verified by the suite's model-existence check).

const DECOY_MODEL = 'characters/Carey drone 3d model';

export const SEED_SUPPORT_ABILITIES: SupportCombatAbilityDefinition[] = [
  // ── Jett — Strike Support (range attack, remote-capable) ──
  {
    id: 'support_strike_jett',
    supportCharacterId: 'char_jett',
    name: 'Rescue Strike Run',
    supportType: 'strike-support',
    triggerMode: 'manual-target',
    targeting: { targetType: 'enemy-group', rangeShape: 'sphere', maxRange: 32, radius: 6, targetPriority: 'highest-threat' },
    resourceCost: { supportEnergy: 30 },
    cooldownSeconds: 10,
    castDelaySeconds: 0.8,
    effects: [
      { id: 'strike_dmg', effectType: 'damage', amount: 26, damageType: 'impact', attackTags: ['air-support', 'support-strike'], modelFirstEffect: { effectDefinitionId: 'fx_strike_ring', attachTo: 'target' }, spawnModelAssetId: DECOY_MODEL },
      { id: 'strike_marker', effectType: 'debug-log', modelFirstEffect: { effectDefinitionId: 'fx_strike_marker', attachTo: 'world-position' } },
      { id: 'strike_cond', effectType: 'condition-progress', linkedZoneConditionId: undefined },
    ],
    validZoneSegmentTypes: ['combat-placeholder', 'exploration', 'rescue', 'repair', 'incident'],
    requiresSupportStatus: 'any',
    editorMeta: { displayName: 'Rescue Strike Run', themeColor: '#e8442c', difficulty: 'normal' },
    enabled: true,
  },

  // ── Donnie — Repair Support (device repair + small player heal) ──
  {
    id: 'support_repair_donnie',
    supportCharacterId: 'char_donnie',
    name: 'Engineer Repair Drop',
    supportType: 'repair-support',
    triggerMode: 'manual-target',
    targeting: { targetType: 'device', rangeShape: 'single', maxRange: 14, targetPriority: 'objective-linked' },
    resourceCost: { supportEnergy: 30 },
    cooldownSeconds: 8,
    castDelaySeconds: 0.4,
    effects: [
      { id: 'repair_device', effectType: 'repair', amount: 100, linkedObstacleState: 'repaired', modelFirstEffect: { effectDefinitionId: 'fx_repair_beam_support', attachTo: 'target' } },
      { id: 'repair_node', effectType: 'debug-log', modelFirstEffect: { effectDefinitionId: 'fx_repair_node', attachTo: 'target' } },
      { id: 'repair_heal', effectType: 'heal', amount: 25, modelFirstEffect: { effectDefinitionId: 'fx_repair_node', attachTo: 'player' } },
    ],
    validZoneSegmentTypes: ['repair', 'supply', 'rescue', 'incident'],
    validTargetTags: ['device', 'obstacle', 'corrupted-device'],
    requiresSupportStatus: 'any',
    editorMeta: { displayName: 'Engineer Repair Drop', themeColor: '#f5b21e', difficulty: 'easy' },
    enabled: true,
  },

  // ── Donnie — Break Support (shield/obstacle break) ──
  {
    id: 'support_break_donnie',
    supportCharacterId: 'char_donnie',
    name: 'Heavy Breaker Drop',
    supportType: 'break-support',
    triggerMode: 'manual-target',
    targeting: { targetType: 'obstacle', rangeShape: 'single', maxRange: 12, targetPriority: 'shielded' },
    resourceCost: { supportEnergy: 26 },
    cooldownSeconds: 9,
    castDelaySeconds: 0.5,
    effects: [
      { id: 'break_hit', effectType: 'shield-break', amount: 140, damageType: 'shield-break', attackTags: ['shield-break', 'heavy-impact', 'drill', 'engineering'], modelFirstEffect: { effectDefinitionId: 'fx_break_drill', attachTo: 'target' } },
    ],
    validZoneSegmentTypes: ['repair', 'combat-placeholder', 'incident'],
    validTargetTags: ['obstacle', 'enemy', 'energy-barrier', 'cracked-wall', 'shield'],
    requiresSupportStatus: 'any',
    editorMeta: { displayName: 'Heavy Breaker Drop', themeColor: '#f59e0b', difficulty: 'normal' },
    enabled: true,
  },

  // ── Paul — Shield Support (damage-reduction dome + projectile block) ──
  {
    id: 'support_shield_paul',
    supportCharacterId: 'char_paul',
    name: 'Guardian Shield Dome',
    supportType: 'shield-support',
    triggerMode: 'manual-target',
    targeting: { targetType: 'player', rangeShape: 'sphere', maxRange: 16, radius: 5 },
    resourceCost: { supportEnergy: 25 },
    cooldownSeconds: 12,
    durationSeconds: 6,
    effects: [
      { id: 'shield_dome', effectType: 'shield', amount: 0.5, durationSeconds: 6, projectileBlockCount: 5, modelFirstEffect: { effectDefinitionId: 'fx_shield_dome', attachTo: 'player' } },
      { id: 'shield_panels', effectType: 'debug-log', modelFirstEffect: { effectDefinitionId: 'fx_shield_panels', attachTo: 'player' } },
    ],
    validZoneSegmentTypes: ['combat-placeholder', 'repair', 'rescue', 'supply', 'incident'],
    requiresSupportStatus: 'any',
    editorMeta: { displayName: 'Guardian Shield Dome', themeColor: '#3b82f6', difficulty: 'easy' },
    enabled: true,
  },

  // ── Paul — Taunt / Decoy Support (real enemy redirect) ──
  {
    id: 'support_taunt_paul',
    supportCharacterId: 'char_paul',
    name: 'Decoy Beacon',
    supportType: 'taunt-support',
    triggerMode: 'manual-target',
    targeting: { targetType: 'area', rangeShape: 'sphere', maxRange: 16, radius: 8 },
    resourceCost: { supportEnergy: 22 },
    cooldownSeconds: 11,
    durationSeconds: 5,
    effects: [
      { id: 'taunt_decoy', effectType: 'taunt', amount: 60, durationSeconds: 5, modelFirstEffect: { effectDefinitionId: 'fx_decoy_hologram', attachTo: 'world-position' }, spawnModelAssetId: DECOY_MODEL },
    ],
    validZoneSegmentTypes: ['combat-placeholder', 'repair', 'rescue', 'incident'],
    requiresSupportStatus: 'any',
    editorMeta: { displayName: 'Decoy Beacon', themeColor: '#2b4c8c', difficulty: 'normal' },
    enabled: true,
  },

  // ── Chase — Scan Support (weakpoint reveal, remote-capable) ──
  {
    id: 'support_scan_chase',
    supportCharacterId: 'char_chase',
    name: 'Recon Weakpoint Scan',
    supportType: 'scan-support',
    triggerMode: 'manual-target',
    targeting: { targetType: 'enemy', rangeShape: 'cone', maxRange: 18, radius: 11, angleDegrees: 70, targetPriority: 'shielded' },
    resourceCost: { supportEnergy: 18 },
    cooldownSeconds: 6,
    durationSeconds: 8,
    effects: [
      { id: 'scan_reveal', effectType: 'scan', durationSeconds: 8, attackTags: ['scan', 'reveal', 'weakpoint'], targetStateTagsToAdd: ['scanned', 'weakpoint-exposed'], modelFirstEffect: { effectDefinitionId: 'fx_scan_dome', attachTo: 'world-position' } },
      { id: 'scan_mark', effectType: 'debug-log', modelFirstEffect: { effectDefinitionId: 'fx_weakpoint_marker', attachTo: 'target' } },
    ],
    validZoneSegmentTypes: ['combat-placeholder', 'exploration', 'repair', 'rescue', 'incident', 'elite-placeholder', 'boss-placeholder'],
    requiresSupportStatus: 'any',
    editorMeta: { displayName: 'Recon Weakpoint Scan', themeColor: '#60a5fa', difficulty: 'easy' },
    enabled: true,
  },
];

export const MVP_SUPPORT_CHARACTER_IDS = ['char_jett', 'char_donnie', 'char_paul', 'char_chase'] as const;

// supportType → may be cast while only at remote tier (no physics presence needed).
export const REMOTE_CAPABLE_SUPPORT_TYPES: ReadonlySet<string> = new Set(['strike-support', 'scan-support']);
