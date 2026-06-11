import type { DestinationPart } from '../../types/game/destination';
import type { NPCDefinition } from '../../types/game/npc';
import type { MissionObjective } from '../../types/game/mission';

// Pure validation (no zod — matches the repo). Returns human-readable errors ([] = valid). Shown inline in
// the 🏙 / 🧑 / 🎯 tabs; the runtime/director skip invalid data instead of crashing.

export function validateDestinationLayout(parts: DestinationPart[], npcDialogueIds?: ReadonlySet<string>): string[] {
  const e: string[] = [];
  const ids = new Set<string>();
  for (const p of parts) {
    if (!p.id?.trim()) e.push('A part has an empty id.');
    else if (ids.has(p.id)) e.push(`Duplicate part id "${p.id}".`);
    else ids.add(p.id);
  }
  const enabled = parts.filter((p) => p.enabled);
  if (!enabled.some((p) => p.kind === 'landing_zone')) e.push('Layout needs at least one enabled landing_zone.');
  if (!enabled.some((p) => p.kind === 'safe_zone')) e.push('Layout needs at least one enabled safe_zone.');
  for (const p of enabled) {
    if ((p.kind === 'landing_zone' || p.kind === 'safe_zone' || p.kind === 'dropoff_zone') && !((p.radius ?? 0) > 0))
      e.push(`${p.kind} "${p.id}" needs a radius > 0.`);
    if (p.kind === 'boundary' && (p.size[0] <= 0 || p.size[2] <= 0)) e.push(`Boundary "${p.id}" has an invalid size.`);
  }
  void npcDialogueIds;
  return e;
}

export function validateDestinationNpc(npc: NPCDefinition, knownTreeIds?: ReadonlySet<string>): string[] {
  const e: string[] = [];
  if (!npc.id?.trim()) e.push('NPC id is empty.');
  if (!npc.name?.trim()) e.push('NPC name is empty.');
  if (npc.position && !((npc.interactionRadius ?? 4) > 0)) e.push(`NPC "${npc.id}": interactionRadius must be > 0.`);
  if (npc.dialogueTreeId && knownTreeIds && !knownTreeIds.has(npc.dialogueTreeId))
    e.push(`NPC "${npc.id}": unknown dialogue tree "${npc.dialogueTreeId}".`);
  return e;
}

export function validateObjective(o: MissionObjective, partIds: ReadonlySet<string>): string[] {
  const e: string[] = [];
  if (!o.id?.trim()) e.push('Objective id is empty.');
  if (!o.description?.trim()) e.push(`Objective "${o.id}": description is empty.`);
  for (const t of o.targetObjectIds ?? []) if (!partIds.has(t)) e.push(`Objective "${o.id}": unknown target object "${t}".`);
  if (o.kind === 'carry') {
    if (!o.targetObjectIds?.length) e.push(`Carry objective "${o.id}" needs a carry item (targetObjectIds).`);
    if (!o.dropoffZoneId) e.push(`Carry objective "${o.id}" needs a dropoffZoneId.`);
    else if (!partIds.has(o.dropoffZoneId)) e.push(`Carry objective "${o.id}": unknown dropoff zone "${o.dropoffZoneId}".`);
  }
  if (o.kind === 'find' && !o.targetObjectIds?.length) e.push(`Find objective "${o.id}" needs a lost item (targetObjectIds).`);
  if (o.kind === 'activate') {
    if (!o.targetObjectIds?.length) e.push(`Repair objective "${o.id}" needs a device (targetObjectIds).`);
    if (!o.miniGameId) e.push(`Repair objective "${o.id}" needs a miniGameId.`);
  }
  return e;
}
