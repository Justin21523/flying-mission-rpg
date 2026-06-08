import { useState } from 'react';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
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
  const [selId, setSelId] = useState<string | null>(null);

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

              {/* Position override — shown/set when dragging NPC in Edit Mode */}
              {overrides[selId!]?.positionOverride && (
                <Field label="Position Override (x / y / z)">
                  <div className="flex gap-1">
                    {(['x', 'y', 'z'] as const).map((axis, i) => (
                      <input
                        key={axis}
                        type="number"
                        step="0.1"
                        className={inp + ' w-0 flex-1 text-center'}
                        value={overrides[selId!]!.positionOverride![i].toFixed(2)}
                        onChange={(e) => {
                          const pos = [...(overrides[selId!]!.positionOverride ?? [0, 0, 0])] as [number, number, number];
                          pos[i] = parseFloat(e.target.value) || 0;
                          setOverride(selId!, { positionOverride: pos });
                        }}
                      />
                    ))}
                    <button
                      className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-800"
                      onClick={() => {
                        const ov = { ...overrides[selId!] };
                        delete ov.positionOverride;
                        if (Object.keys(ov).length <= 1) clearOverride(selId!);
                        else setOverride(selId!, { positionOverride: undefined });
                      }}
                      title="Clear position override"
                    >✕</button>
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-500">Drag NPC in Edit Mode to set; clear to restore schedule position</div>
                </Field>
              )}

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
