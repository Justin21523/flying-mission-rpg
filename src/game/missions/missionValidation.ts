import type { MissionDefinition, MissionObjective } from '../../types/game/mission';
import type { DestinationPartKind } from '../../types/game/destination';
import type { MissionPools } from './missionPools';

// The gate that guarantees a (generated or authored) mission is PLAYABLE: every referenced id exists in the
// live pools and each objective is well-formed for its kind. Pure → unit-testable; the generator only emits
// missions that return [] here.

function partIdsOfKinds(pools: MissionPools, kinds: DestinationPartKind[]): Set<string> {
  const set = new Set<string>();
  for (const k of kinds) for (const p of pools.partsByKind[k] ?? []) set.add(p.id);
  return set;
}

function validateObjective(o: MissionObjective, pools: MissionPools, npcIds: Set<string>): string[] {
  const errs: string[] = [];
  if (!o.description?.trim()) errs.push(`objective ${o.id}: empty description`);
  if (!(o.targetCount > 0)) errs.push(`objective ${o.id}: targetCount must be > 0`);
  const targets = o.targetObjectIds ?? [];

  switch (o.kind) {
    case 'carry': {
      const carryIds = partIdsOfKinds(pools, ['carry_item']);
      if (targets.length === 0 || !targets.every((t) => carryIds.has(t))) errs.push(`objective ${o.id}: carry needs valid carry_item target(s)`);
      const dropIds = partIdsOfKinds(pools, ['dropoff_zone']);
      if (!o.dropoffZoneId || !dropIds.has(o.dropoffZoneId)) errs.push(`objective ${o.id}: carry needs a valid dropoff_zone`);
      break;
    }
    case 'find': {
      const lostIds = partIdsOfKinds(pools, ['lost_item', 'carry_item']);
      if (targets.length === 0 || !targets.every((t) => lostIds.has(t))) errs.push(`objective ${o.id}: find needs valid lost_item target(s)`);
      break;
    }
    case 'activate': {
      const devIds = partIdsOfKinds(pools, ['repair_device']);
      if (targets.length === 0 || !targets.every((t) => devIds.has(t))) errs.push(`objective ${o.id}: activate/repair needs a valid repair_device`);
      if (!o.miniGameId || !pools.miniGameIds.includes(o.miniGameId)) errs.push(`objective ${o.id}: activate/repair needs a valid miniGameId`);
      break;
    }
    case 'reach': {
      const markerIds = partIdsOfKinds(pools, ['marker', 'landing_zone', 'safe_zone']);
      if (targets.length === 0 || !targets.every((t) => markerIds.has(t))) errs.push(`objective ${o.id}: reach needs a valid marker target`);
      break;
    }
    case 'talk': {
      if (targets.length === 0 || !targets.every((t) => npcIds.has(t))) errs.push(`objective ${o.id}: talk needs a valid NPC target`);
      break;
    }
    case 'hunt':
      // no destination-part binding needed (the hunt spawns its own yokai); targetCount already checked.
      break;
    default:
      errs.push(`objective ${o.id}: unknown kind`);
  }
  return errs;
}

export function validateMission(m: MissionDefinition, pools: MissionPools): string[] {
  const errs: string[] = [];
  if (!m.name?.trim()) errs.push('mission: empty name');

  const locIds = new Set(pools.locations.map((l) => l.id));
  if (!locIds.has(m.locationId)) errs.push(`mission: unknown locationId ${m.locationId}`);

  const npcIds = new Set(pools.npcs.map((n) => n.id));
  if (m.npcId && !npcIds.has(m.npcId)) errs.push(`mission: unknown npcId ${m.npcId}`);

  const routeIds = new Set(pools.routes.map((r) => r.id));
  if (m.routeId && !routeIds.has(m.routeId)) errs.push(`mission: unknown routeId ${m.routeId}`);

  const charIds = new Set(pools.characters.map((c) => c.id));
  for (const id of m.recommendedCharacterIds) if (!charIds.has(id)) errs.push(`mission: unknown recommended character ${id}`);

  if (m.objectives.length === 0) errs.push('mission: no objectives');
  for (const o of m.objectives) errs.push(...validateObjective(o, pools, npcIds));

  return errs;
}
