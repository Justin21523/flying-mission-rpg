import { describe, it, expect, beforeEach } from 'vitest';
import { validateKit, validateCombo, validateSocketConfig } from './CharacterSkillValidation';
import { detectCombo } from './CharacterComboController';
import { resolveSocketOffset } from './CharacterSocketResolver';
import { routeKeyToSlot } from './CharacterSkillInputRouter';
import { applyUtilityFromCast } from './CharacterUtilityResolver';
import { SEED_CHARACTER_KITS, MVP_KIT_CHARACTER_IDS } from '../../data/character-skills/characterCombatKits';
import { SEED_KIT_SKILLS } from '../../data/character-skills/kitSkills';
import { SEED_KIT_EFFECTS } from '../../data/character-skills/characterSkillEffects';
import { MODEL_ASSETS } from '../../data/modelLibrary';
import type { ComboCast } from '../../stores/game/useCharacterSkillStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useEditorObstacleStore } from '../../stores/game/editorObstacleStore';
import { useObstacleStore } from '../../stores/game/obstacleStore';
import * as ObstacleDirector from '../obstacles/ObstacleDirector';
import { SEED_OBSTACLES } from '../../data/obstacles/obstacleDefinitions';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';

const skillIds = new Set([...SEED_KIT_SKILLS.map((s) => s.id)]);
const skillExists = (id: string) => skillIds.has(id);

describe('MVP character kits', () => {
  it('has a kit for each of the 4 heroes with basic + defense + a model-first effect', () => {
    expect(MVP_KIT_CHARACTER_IDS).toEqual(['char_jett', 'char_donnie', 'char_paul', 'char_chase']);
    for (const kit of SEED_CHARACTER_KITS) {
      expect(validateKit(kit, skillExists).ok, kit.characterId).toBe(true);
      expect(kit.defaultSkillIds.basic).toBeTruthy();
      expect(kit.defaultSkillIds.defense).toBeTruthy();
      // every slot skill exists, and basic has an effect (model-first)
      const basic = SEED_KIT_SKILLS.find((s) => s.id === kit.defaultSkillIds.basic)!;
      expect(basic.effectDefinitionId, `${kit.characterId} basic effect`).toBeTruthy();
    }
  });

  it('every kit effect + model assetId resolves', () => {
    const effectIds = new Set(SEED_KIT_EFFECTS.map((e) => e.id));
    for (const s of SEED_KIT_SKILLS) if (s.effectDefinitionId) expect(effectIds.has(s.effectDefinitionId) || s.effectDefinitionId.startsWith('fx_'), s.id).toBe(true);
    const models = new Set<string>();
    for (const s of SEED_KIT_SKILLS) for (const m of [s.modelPrefabId, s.projectile?.modelAssetId, s.summon?.modelAssetId, s.terrain?.modelAssetId]) if (m) models.add(m);
    const missing = [...models].filter((m) => !MODEL_ASSETS[m]);
    expect(missing, `missing: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('CharacterComboController', () => {
  const combos = SEED_CHARACTER_KITS.find((k) => k.characterId === 'char_chase')!.combos!;
  it('fires Scan → Pulse within the gap', () => {
    const buf: ComboCast[] = [{ skillId: 'chase_kit_scan', t: 0 }, { skillId: 'chase_kit_basic', t: 0.5 }];
    expect(detectCombo(buf, combos)?.id).toBe('chase_combo_scan_shot');
  });
  it('does not fire when the gap is exceeded', () => {
    const buf: ComboCast[] = [{ skillId: 'chase_kit_scan', t: 0 }, { skillId: 'chase_kit_basic', t: 5 }];
    expect(detectCombo(buf, combos)).toBeNull();
  });
  it('does not fire on the wrong sequence', () => {
    const buf: ComboCast[] = [{ skillId: 'chase_kit_basic', t: 0 }, { skillId: 'chase_kit_basic', t: 0.3 }];
    expect(detectCombo(buf, combos)).toBeNull();
  });
});

describe('input router + sockets + validation', () => {
  it('routes keys to named slots', () => {
    expect(routeKeyToSlot('KeyZ')).toBe('basic');
    expect(routeKeyToSlot('KeyX')).toBe('special1');
    expect(routeKeyToSlot('KeyN')).toBe('utility');
    expect(routeKeyToSlot('KeyP')).toBeUndefined();
  });
  it('resolves a socket fallback offset', () => {
    const cfg = SEED_CHARACTER_KITS.find((k) => k.characterId === 'char_donnie')!.modelSocketConfig!;
    expect(resolveSocketOffset(cfg, 'tool-arm').offset).toEqual([0.7, 1, 0.6]);
    expect(resolveSocketOffset(cfg, 'nonexistent').offset).toEqual([0, 1, 0]);
  });
  it('validates combos + socket configs', () => {
    expect(validateCombo({ id: 'c', characterId: 'x', name: 'c', inputSequence: [], maxInputGapSeconds: 1, resultSkillId: 'nope' }, () => false).ok).toBe(false);
    expect(validateSocketConfig({ characterId: 'x', sockets: [{ socketName: '', fallbackOffset: [0, 0, 0] }] }).ok).toBe(false);
  });
});

describe('CharacterUtilityResolver', () => {
  beforeEach(() => {
    useCombatTargetStore.getState().reset();
    useEditorObstacleStore.getState().importState({ items: SEED_OBSTACLES, seeded: true });
    useObstacleStore.getState().reset();
    useAdvancedMissionZoneStore.setState({ clearedAreaIds: [] });
  });

  it('Chase scan marks hit targets scanned', () => {
    useCombatTargetStore.getState().spawn({ id: 'e1', definitionId: 'd', hp: 50, maxHp: 50, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true });
    const scan = SEED_KIT_SKILLS.find((s) => s.id === 'chase_kit_scan')!;
    applyUtilityFromCast(scan, ['e1']);
    expect(liveTargets.find((t) => t.id === 'e1')!.scanned).toBe(true);
  });

  it('Donnie repair beam repairs a hit Corrupted Device', () => {
    ObstacleDirector.loadForSegment('seg_repair_plaza');
    const repair = SEED_KIT_SKILLS.find((s) => s.id === 'donnie_kit_repair')!;
    // The corrupted device has no damageable proxy, so register an obstacle-typed hit target mapped to it.
    useCombatTargetStore.getState().spawn({ id: 'obsT', definitionId: 'x', hp: 1, maxHp: 1, shield: 0, maxShield: 0, x: -6, y: 0, z: -26, defeatedAt: 0, isObstacle: true, obstacleId: 'corrupted_device_01' });
    applyUtilityFromCast(repair, ['obsT']);
    expect(ObstacleDirector.isRepaired('corrupted_device_01')).toBe(true);
    ObstacleDirector.cleanup();
  });

  it('Jett speed-gate signals a zone area clear', () => {
    const speed = SEED_KIT_SKILLS.find((s) => s.id === 'jett_kit_speed')!;
    const out = applyUtilityFromCast(speed, []);
    expect(out.speedGate).toBe(true);
    expect(useAdvancedMissionZoneStore.getState().clearedAreaIds).toContain('speed_gate');
  });
});
