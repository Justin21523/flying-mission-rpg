import type { EditorNpc, NpcMovement } from '../../types/editorNPC';
import { NPC_MOVEMENT } from '../../types/editorNPC';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useModelAnimations } from '../../game/world/useModelAnimations';
import { AnimRuleList } from './AnimRuleList';
import { inp, lbl } from './editorShared';

const MOVE_LABEL: Record<NpcMovement, string> = { static: 'Static', patrol: 'Patrol loop', schedule: 'Time-of-day', wander: 'Wander (AI roam)' };

// POLI — animation-rule + AI-movement editing for an NPC selected via the in-scene gizmo (EditModeInspector).
// Mirrors the 🧑 NPC tab's controls so you can author rules right where you clicked the NPC. Additive — looks
// the NPC up by id from editorNpcStore; renders nothing if the selection is not an authored NPC.
export const NpcSelectionExtras = ({ npcId }: { npcId: string }) => {
  const npc = useEditorNpcStore((s) => s.addedNpcs.find((n) => n.id === npcId));
  const updateNpc = useEditorNpcStore((s) => s.updateNpc);
  const clips = useModelAnimations(npc?.modelAssetId ?? undefined);
  if (!npc) return null;
  const set = (patch: Partial<EditorNpc>) => updateNpc(npc.id, patch);
  const mode = npc.movement ?? 'static';
  return (
    <div className="space-y-2 border-t border-slate-800 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-slate-400">AI movement
          <select value={mode} onChange={(e) => set({ movement: e.target.value as NpcMovement })} className={inp}>
            {NPC_MOVEMENT.map((m) => <option key={m} value={m}>{MOVE_LABEL[m]}</option>)}
          </select>
        </label>
        <label className="text-[10px] text-slate-400">moveSpeed
          <input type="number" step={0.1} min={0.1} value={npc.moveSpeed ?? 1.6} onChange={(e) => set({ moveSpeed: parseFloat(e.target.value) || 0.1 })} className={inp} />
        </label>
      </div>
      {mode === 'wander' && (
        <label className="block text-[10px] text-slate-400">wanderRadius
          <input type="number" step={1} min={1} value={npc.wanderRadius ?? 12} onChange={(e) => set({ wanderRadius: parseFloat(e.target.value) || 1 })} className={inp} />
        </label>
      )}
      {npc.modelAssetId
        ? <AnimRuleList rules={npc.animations ?? []} clips={clips} onChange={(next) => set({ animations: next })} />
        : <div className={`${lbl} text-slate-500`}>Assign a 3D model in the 🧑 NPC tab to author animation rules.</div>}
    </div>
  );
};
