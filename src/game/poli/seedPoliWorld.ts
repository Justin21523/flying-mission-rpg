import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import type { Landmark } from '../../stores/editorLandmarkStore';
import { RESIDENTS } from '../../data/characters/residents';
import { BROOMS_TOWN_SCHEDULES } from '../../data/schedules/broomsTownSchedules';
import { BROOMS_TOWN_AREAS } from '../../data/poli/broomsTownAreas';
import type { Vec3 } from '../edit/sceneEditMerge';

// One-time, idempotent seed so the Brooms Town world starts populated AND fully editable:
//   • the hardcoded residents become editable Edit-Mode NPCs (NPC tab) at their home-area position,
//     keeping their existing dialogue tree; the user then tunes movement/schedule per NPC.
//   • each area gets one landmark stub (🗺 Landmarks tab) so every area is recognisable.
// Guarded by a localStorage flag so it never duplicates or fights user edits.

const SEED_FLAG = 'r3f-rpg-builder-poli-world-seed-v1';

function homePosition(charId: string, areaId: string): Vec3 {
  const sched = BROOMS_TOWN_SCHEDULES.find((s) => s.characterId === charId);
  return (sched?.positions[areaId] as Vec3 | undefined) ?? [0, 0, 3];
}

export function seedPoliWorld(): void {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
  } catch { /* ignore */ }

  // 1) Residents → editable NPCs (skip if an NPC for that resident already exists by displayName).
  const npcStore = useEditorNpcStore.getState();
  const existingNames = new Set(npcStore.addedNpcs.map((n) => n.displayName));
  for (const r of RESIDENTS) {
    if (existingNames.has(r.name)) continue;
    const pos = homePosition(r.id, r.homeAreaId);
    const id = useEditorNpcStore.getState().addNpc(r.homeAreaId, pos);
    useEditorNpcStore.getState().updateNpc(id, {
      displayName: r.name,
      role: r.role,
      description: r.description,
      color: r.color,
      interactionLabel: `Talk to ${r.name}`,
      dialogueTreeId: r.dialogueTreeId || null, // existing POLI dialogue (merged at runtime)
      movement: 'static',
      moveSpeed: 1.6,
    });
  }

  // 2) One landmark per area (if the landmark store hasn't been seeded yet).
  if (!useEditorLandmarkStore.getState().seeded) {
    const stamp = Date.now().toString(36);
    const landmarks: Landmark[] = BROOMS_TOWN_AREAS.map((a, i) => ({
      id: `lmk_seed_${stamp}_${i}`,
      areaId: a.id,
      name: `${a.name} Landmark`,
      position: [0, 0, 6] as Vec3,
      modelAssetId: null,
    }));
    useEditorLandmarkStore.getState().markSeeded(landmarks);
  }

  try { localStorage.setItem(SEED_FLAG, '1'); } catch { /* ignore */ }
}
