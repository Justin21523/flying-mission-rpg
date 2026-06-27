import { SEED_NPCS } from '../../data/game/npcs';
import { SEED_STAGES } from '../../data/campaigns/stageDefinitions';
import { RESCUE_VANGUARD_UNLOCK_RULES } from '../../data/campaigns/stageUnlockRules';
import { SEED_QUESTS } from '../../data/quests';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';
import { FULL_ENEMY_ROSTER_ADDITIONS } from '../../data/enemies/fullEnemyRoster';
import { STAGE_ENEMY_SPAWN_GROUPS } from '../../data/encounters/stageEnemyPacks';
import { SEED_BOSSES } from '../../data/bosses/bossDefinitions';
import { EXTRA_BOSSES } from '../../data/bosses/extraZoneBosses';
import { SEED_INCIDENT_TEMPLATES } from '../../data/incidents/incidentTemplates';
import { SEED_ZONE_PROPS } from '../../data/game/zoneProps';
import { SEED_MISSION_ZONES, SEED_ZONE_SEGMENTS } from '../../data/game/advancedMissionZones';
import { AFFIX_IDS } from '../../data/combat/eliteAffixes';
import { getModelAsset } from '../../data/modelLibrary';

// World-build content-integrity validator (pure; unit-tested). Guards every cross-reference the world content
// depends on so a typo in a seed file can't silently break a flow (rescue, branching, spawns, bosses, incidents,
// models). Returns a flat list of problems; the test asserts it is empty.
export function validateWorldContent(): string[] {
  const errors: string[] = [];
  const stageIds = new Set(SEED_STAGES.map((s) => s.id));
  const questIds = new Set(SEED_QUESTS.map((q) => q.id));
  const enemyIds = new Set([...SEED_ENEMIES, ...FULL_ENEMY_ROSTER_ADDITIONS].map((e) => e.id));
  const templateIds = new Set(SEED_INCIDENT_TEMPLATES.map((t) => t.id));

  // Hub residents: rescue + side-quest links resolve.
  for (const n of SEED_NPCS) {
    if (!n.hubResident) continue;
    if (n.rescuedByStageId && !stageIds.has(n.rescuedByStageId)) errors.push(`NPC ${n.id}: rescuedByStageId '${n.rescuedByStageId}' is not a real stage`);
    if (n.hubSideQuestId && !questIds.has(n.hubSideQuestId)) errors.push(`NPC ${n.id}: hubSideQuestId '${n.hubSideQuestId}' is not a real quest`);
    if (n.modelAssetId && !getModelAsset(n.modelAssetId)) errors.push(`NPC ${n.id}: modelAssetId '${n.modelAssetId}' does not resolve`);
  }

  // Stage unlock graph (both the per-stage list and the campaign rules) targets real stages.
  for (const s of SEED_STAGES) {
    for (const id of s.unlocksOnClear.stageIds ?? []) {
      if (!stageIds.has(id)) errors.push(`Stage ${s.id}: unlocksOnClear '${id}' is not a real stage`);
    }
  }
  for (const r of RESCUE_VANGUARD_UNLOCK_RULES) {
    if (r.type === 'clear-stage') {
      if (!stageIds.has(r.stageId)) errors.push(`Unlock rule: clear-stage '${r.stageId}' is not a real stage`);
      for (const id of r.unlockStageIds) if (!stageIds.has(id)) errors.push(`Unlock rule from ${r.stageId}: '${id}' is not a real stage`);
    }
    if (r.type === 'start-unlocked' && !stageIds.has(r.stageId)) errors.push(`Unlock rule: start-unlocked '${r.stageId}' is not a real stage`);
  }

  // Spawn groups reference real enemies.
  for (const g of STAGE_ENEMY_SPAWN_GROUPS) {
    for (const e of g.enemies) if (!enemyIds.has(e.enemyDefinitionId)) errors.push(`Spawn group ${g.id}: enemy '${e.enemyDefinitionId}' is not defined`);
  }

  // Bosses: intro/enrage well-formed + summon waves reference real enemies; models resolve.
  for (const b of [...SEED_BOSSES, ...EXTRA_BOSSES]) {
    if (b.intro && (!b.intro.title || b.intro.durationSeconds <= 0)) errors.push(`Boss ${b.id}: intro must have a title + positive duration`);
    if (b.enrage && (b.enrage.afterSeconds <= 0 || b.enrage.damageMultiplier < 1)) errors.push(`Boss ${b.id}: enrage afterSeconds>0 + damageMultiplier>=1`);
    if (b.visual?.modelPresetId && !getModelAsset(b.visual.modelPresetId)) errors.push(`Boss ${b.id}: modelPresetId '${b.visual.modelPresetId}' does not resolve`);
    // Wave 1 — signature mechanic: a healer ref (if set) resolves to a real enemy; interval is non-negative.
    const m = b.signatureMechanic;
    if (m) {
      if (m.enemyRef && !enemyIds.has(m.enemyRef)) errors.push(`Boss ${b.id}: signature enemyRef '${m.enemyRef}' is not a defined enemy`);
      if ((m.config?.intervalSeconds ?? 0) < 0) errors.push(`Boss ${b.id}: signature intervalSeconds must be >= 0`);
    }
  }

  // Wave 1 — any spawn-group elite-affix policy references real affix ids.
  const affixIds = new Set<string>(AFFIX_IDS);
  for (const g of STAGE_ENEMY_SPAWN_GROUPS) {
    for (const a of g.affixPolicy?.allowedAffixIds ?? []) if (!affixIds.has(a)) errors.push(`Spawn group ${g.id}: affix '${a}' is not a defined affix`);
  }

  // New enemies' models resolve.
  for (const e of SEED_ENEMIES) {
    if (e.modelAssetId && !getModelAsset(e.modelAssetId)) errors.push(`Enemy ${e.id}: modelAssetId '${e.modelAssetId}' does not resolve`);
  }

  // Incident template references on zone segments resolve (W1 Signal Yard hook).
  for (const id of ['tmpl_mechanical_failure']) {
    if (!templateIds.has(id)) errors.push(`Incident template '${id}' referenced by a segment is not defined`);
  }

  // World-build W2 — zone props: model resolves, zone exists, segment (if set) exists.
  const zoneIds = new Set(SEED_MISSION_ZONES.map((z) => z.id));
  const segmentIds = new Set(SEED_ZONE_SEGMENTS.map((s) => s.id));
  for (const prop of SEED_ZONE_PROPS) {
    if (!getModelAsset(prop.modelAssetId)) errors.push(`Zone prop ${prop.id}: modelAssetId '${prop.modelAssetId}' does not resolve`);
    if (!zoneIds.has(prop.zoneId)) errors.push(`Zone prop ${prop.id}: zoneId '${prop.zoneId}' is not a real zone`);
    if (prop.segmentId && !segmentIds.has(prop.segmentId)) errors.push(`Zone prop ${prop.id}: segmentId '${prop.segmentId}' is not a real segment`);
  }

  // World-build W2 — every segment incident hook / template reference resolves to a real template.
  for (const seg of SEED_ZONE_SEGMENTS) {
    const refs = [...(seg.incidentTemplateIds ?? []), ...(seg.aiIncidentHooks?.onSegmentEnter ?? []), ...(seg.aiIncidentHooks?.onZoneStart ?? [])];
    for (const id of refs) if (!templateIds.has(id)) errors.push(`Segment ${seg.id}: incident template '${id}' is not defined`);
  }

  return errors;
}
