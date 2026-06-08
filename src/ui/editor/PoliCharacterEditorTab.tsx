import { useState } from 'react';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { RESIDENTS } from '../../data/characters/residents';
import { getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { Field, inp, lbl } from './editorShared';
import type { CharacterDefinition } from '../../types/character';

// All POLI characters — player (poli) included since their model path can be overridden.
const ALL_CHARS: CharacterDefinition[] = [...CORE_TEAM, ...RESIDENTS];

export const PoliCharacterEditorTab = () => {
  const overrides = useEditorPoliCharacterStore((s) => s.overrides);
  const setOverride = useEditorPoliCharacterStore((s) => s.setOverride);
  const clearOverride = useEditorPoliCharacterStore((s) => s.clearOverride);
  // List selection: clicking an NPC in the 3D view selects it through the kit's sceneEditStore
  // (objKey areaId#npc#charId). We derive charId from that so the 3D selection and this data
  // panel always agree; a manual list click sets a local fallback selection.
  const [localSel, setLocalSel] = useState<string | null>(null);
  const sceneKey = useSceneEditStore((s) => s.selectedKey);
  const npcCharId = sceneKey && sceneKey.split('#')[1] === 'npc' ? sceneKey.split('#')[2] : null;
  const selId = npcCharId ?? localSel;
  const setSelId = setLocalSel;

  const mergedChars = ALL_CHARS.map(getMergedPoliCharacter);
  const sel = selId ? mergedChars.find((c) => c.id === selId) ?? null : null;
  const hasOverride = selId ? !!overrides[selId] : false;

  const set = (patch: Partial<CharacterDefinition>) => {
    if (!selId) return;
    setOverride(selId, patch);
  };

  return (
    <div className="flex h-full gap-3 text-xs">
      {/* ── Left: character list ── */}
      <div className="w-44 shrink-0 overflow-y-auto">
        <div className={`${lbl} mb-2`}>Characters ({mergedChars.length})</div>
        {mergedChars.map((c) => {
          const modified = !!overrides[c.id];
          return (
            <button
              key={c.id}
              onClick={() => setSelId(c.id)}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-800 ${selId === c.id ? 'bg-violet-700/30 text-violet-100' : 'text-slate-300'}`}
            >
              {/* Color dot */}
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              {modified && <span className="text-[9px] text-amber-400" title="Overridden">✏</span>}
            </button>
          );
        })}
      </div>

      {/* ── Right: inspector ── */}
      <div className="flex-1 overflow-y-auto">
        {!sel ? (
          <div className="text-slate-500 text-xs pt-4">Select a character to inspect or override.</div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-100">{sel.name}</div>
                <div className="text-[10px] text-slate-500">id: {sel.id}</div>
              </div>
              {hasOverride && (
                <button
                  onClick={() => clearOverride(selId!)}
                  className="rounded-lg px-2 py-1 text-[10px] text-amber-400 hover:bg-slate-800"
                  title="Revert to base data defaults"
                >
                  Reset to defaults
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Field label="Robot / NPC Model Path">
                <input
                  className={inp}
                  value={sel.modelRobotPath ?? ''}
                  placeholder="e.g. /models/characters/Poli+transformer+3d+model.glb"
                  onChange={(e) => set({ modelRobotPath: e.target.value || undefined })}
                />
              </Field>

              <Field label="Vehicle Model Path">
                <input
                  className={inp}
                  value={sel.modelVehiclePath ?? ''}
                  placeholder="e.g. /models/characters/Poli car 3d model.glb"
                  onChange={(e) => set({ modelVehiclePath: e.target.value || undefined })}
                />
              </Field>

              <Field label="Display Name (English)">
                <input
                  className={inp}
                  value={sel.name}
                  onChange={(e) => set({ nameZhTW: e.target.value })}
                  placeholder="English name"
                />
              </Field>

              <Field label="Color (hex)">
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={sel.color}
                    onChange={(e) => set({ color: e.target.value })}
                    className="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    className={inp + ' flex-1'}
                    value={sel.color}
                    onChange={(e) => set({ color: e.target.value })}
                  />
                </div>
              </Field>

              <Field label="Home Area ID">
                <input
                  className={inp}
                  value={sel.homeAreaId}
                  onChange={(e) => set({ homeAreaId: e.target.value })}
                />
              </Field>

              <Field label="Description">
                <textarea
                  className={inp + ' min-h-[60px] resize-y'}
                  value={sel.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Field>

              {/* Position is edited in 3D: click the NPC, then use the gizmo or the transform
                  inspector (top-right). It auto-saves to the kit scene-edit store and applies
                  in Play Mode — the same pipeline every other object uses. */}
              <div className="rounded-lg bg-slate-900/40 px-3 py-2 text-[10px] text-slate-500">
                📍 To move this character: click it in the 3D view, then drag the gizmo or edit
                the transform in the top-right inspector. Position auto-saves and syncs to Play Mode.
              </div>

              <div className="mt-2 rounded-lg bg-slate-900/50 px-3 py-2 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Source confidence:</span>{' '}
                {sel.sourceConfidence}
                {hasOverride && (
                  <span className="ml-2 text-amber-400">· Override active — changes saved automatically</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
