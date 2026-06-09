import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import type { Landmark } from '../../stores/editorLandmarkStore';
import { useEditorQuestStore } from '../../stores/editorQuestStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { RESIDENTS } from '../../data/characters/residents';
import { BROOMS_TOWN_SCHEDULES } from '../../data/schedules/broomsTownSchedules';
import { BROOMS_TOWN_AREAS } from '../../data/poli/broomsTownAreas';
import { BROOMS_TOWN_SIDE_QUESTS } from '../../data/quests/broomsTownSideQuests';
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
  // Always-run, fully idempotent content seeds (safe for existing saves that already passed SEED_FLAG):
  //   • merge any incident definitions added to the data file but missing from the editor store
  //   • seed the three resident side-quests + their giver NPCs (by stable quest id / giver name)
  useEditorIncidentStore.getState().mergeMissingFromSeed();
  seedSideQuests();
  seedResidentModels();

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

// Resident → GLB model (from public/models/npcs). Applied idempotently every boot so existing saves get
// real models too; only sets it when the NPC has none, so user edits (NPC tab) are never overwritten.
const RESIDENT_MODELS: Record<string, string> = {
  mayor_lee: 'npcs/rescue+dispatcher+3d+model',
  teacher_mi: 'npcs/3d+cartoon+student+npc',
  dr_kim: 'npcs/stylized+nurse+3d+model',
  harbor_worker: 'npcs/3d+construction+worker',
  site_foreman: 'npcs/cartoon+miner+3d+model',
};
function seedResidentModels(): void {
  const npcStore = useEditorNpcStore.getState();
  for (const r of RESIDENTS) {
    const model = RESIDENT_MODELS[r.id];
    if (!model) continue;
    const npc = npcStore.addedNpcs.find((n) => n.displayName === r.name);
    if (npc && !npc.modelAssetId) useEditorNpcStore.getState().updateNpc(npc.id, { modelAssetId: model });
  }
}

// Idempotent: seed each side-quest + its giver NPC only if the quest id is not already present.
// The giver NPC is created first (so we can bind startsQuestIds/completesQuestIds), then the quest is
// upserted with startingNPCId pointing back at the giver. Re-running is a no-op once seeded.
function seedSideQuests(): void {
  const questStore = useEditorQuestStore.getState();
  const npcStore = useEditorNpcStore.getState();
  for (const g of BROOMS_TOWN_SIDE_QUESTS) {
    if (questStore.quests.some((q) => q.id === g.quest.id)) continue;

    // Reuse an existing giver NPC with the same display name, else create one.
    let giverId = npcStore.addedNpcs.find((n) => n.displayName === g.name)?.id;
    if (!giverId) {
      giverId = useEditorNpcStore.getState().addNpc(g.areaId, [g.position[0], 0, g.position[2]]);
      useEditorNpcStore.getState().updateNpc(giverId, {
        displayName: g.name,
        role: g.role,
        description: g.description,
        color: g.color,
        interactionLabel: `Talk to ${g.name}`,
        movement: 'static',
        moveSpeed: 1.4,
        ...(g.modelAssetId ? { modelAssetId: g.modelAssetId } : {}),
      });
    }
    // Bind the giver to offer + accept turn-in of this quest.
    useEditorNpcStore.getState().updateNpc(giverId, {
      startsQuestIds: [g.quest.id],
      completesQuestIds: [g.quest.id],
    });
    useEditorQuestStore.getState().upsertQuest({ ...g.quest, startingNPCId: giverId });
  }
}
