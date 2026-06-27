// Batch L (meta-progression) — a single, editable upgrade curve shared by every combat skill. A skill's
// current upgrade level (0 = base) indexes into this curve to scale its damage / cooldown / energy. Levels are
// an editor-collection (one item per level) so the whole curve is tunable in the editor. Multipliers are
// ABSOLUTE for that level (level 0 → all 1.0); costPoints is the skill-point cost to advance INTO that level.
export interface SkillUpgradeLevelDefinition {
  id: string;
  level: number; // 1..N
  damageMult: number; // ×base damage at this level
  cooldownMult: number; // ×base cooldown (≤1 = faster)
  energyMult: number; // ×base energy cost (≤1 = cheaper)
  costPoints: number; // skill points to advance from level-1 → level
  editorMeta?: { notes?: string };
}

// Skill points granted per character level gained (level 1 = 0 points; each level-up grants this many).
export const SKILL_POINTS_PER_LEVEL = 2;
