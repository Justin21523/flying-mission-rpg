import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { RESIDENTS } from '../../data/characters/residents';
import { getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { Field, inp, lbl } from './editorShared';
import { MODEL_ASSET_LIST } from '../../data/modelLibrary';
import type { CharacterDefinition } from '../../types/character';
import { ABILITY_TYPES } from '../../types/character';

// All POLI characters — player (poli) included since their model path can be overridden.
const ALL_CHARS: CharacterDefinition[] = [...CORE_TEAM, ...RESIDENTS];

// Auto-discovered models grouped by category for the picker dropdowns.
const MODELS_BY_CATEGORY: Record<string, { path: string; label: string }[]> = (() => {
  const g: Record<string, { path: string; label: string }[]> = {};
  for (const a of MODEL_ASSET_LIST) (g[a.category] ??= []).push({ path: a.path, label: a.label });
  return g;
})();

// Dropdown of every discovered GLB (+ "None → capsule") with a custom-path fallback field.
// onChange writes the runtime path string straight into the override.
const ModelPicker = ({ value, onChange }: { value: string; onChange: (v: string | undefined) => void }) => {
  const known = MODEL_ASSET_LIST.some((a) => a.path === value);
  return (
    <div className="flex flex-col gap-1">
      <select
        className={inp}
        value={known ? value : value ? '__custom__' : ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' ) onChange(undefined);          // capsule
          else if (v !== '__custom__') onChange(v);     // picked a discovered model
        }}
      >
        <option value="">— None (capsule) —</option>
        {Object.entries(MODELS_BY_CATEGORY).map(([cat, items]) => (
          <optgroup key={cat} label={cat}>
            {items.map((m) => <option key={m.path} value={m.path}>{m.label}</option>)}
          </optgroup>
        ))}
        {value && !known && <option value="__custom__">(custom path below)</option>}
      </select>
      <input
        className={inp + ' text-[10px]'}
        value={value}
        placeholder="or a custom /models/... path"
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
};

export const PoliCharacterEditorTab = () => {
  const overrides = useEditorPoliCharacterStore((s) => s.overrides);
  const setOverride = useEditorPoliCharacterStore((s) => s.setOverride);
  const clearOverride = useEditorPoliCharacterStore((s) => s.clearOverride);
  // Selection priority: an NPC clicked in 3D (kit sceneEditStore, key areaId#npc#charId) wins;
  // otherwise the POLI data-panel selection (set by the list, or by clicking the player in 3D).
  const storeSel = useEditorPoliCharacterStore((s) => s.selectedId);
  const setSelId = useEditorPoliCharacterStore((s) => s.selectPoli);
  const sceneKey = useSceneEditStore((s) => s.selectedKey);
  const npcCharId = sceneKey && sceneKey.split('#')[1] === 'npc' ? sceneKey.split('#')[2] : null;
  const selId = npcCharId ?? storeSel;

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
              <Field label="Robot / NPC Model (none = capsule)">
                <ModelPicker
                  value={sel.modelRobotPath ?? ''}
                  onChange={(v) => set({ modelRobotPath: v })}
                />
              </Field>

              <Field label="Vehicle Model (none = capsule)">
                <ModelPicker
                  value={sel.modelVehiclePath ?? ''}
                  onChange={(v) => set({ modelVehiclePath: v })}
                />
              </Field>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Car height">
                  <input type="number" step={0.1} min={0.1} className={inp} value={sel.vehicleHeight ?? 1.4}
                    onChange={(e) => set({ vehicleHeight: parseFloat(e.target.value) || 0.1 })} />
                </Field>
                <Field label="Robot height">
                  <input type="number" step={0.1} min={0.1} className={inp} value={sel.robotHeight ?? 1.9}
                    onChange={(e) => set({ robotHeight: parseFloat(e.target.value) || 0.1 })} />
                </Field>
                <Field label="Y offset">
                  <input type="number" step={0.05} className={inp} value={sel.modelYOffset ?? 0}
                    onChange={(e) => set({ modelYOffset: parseFloat(e.target.value) || 0 })} />
                </Field>
              </div>

              <Field label="Can Fly (F to fly, e.g. Helly)">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!sel.canFly}
                    onChange={(e) => set({ canFly: e.target.checked })}
                  />
                  <span className="text-[11px]">{sel.canFly ? 'Can enter flight mode' : 'Grounded'}</span>
                </label>
              </Field>

              {sel.canFly && (
                <>
                  <Field label="Rotor Offset — Vehicle form (x / y / z)">
                    <div className="flex gap-1">
                      {([0, 1, 2] as const).map((i) => {
                        const cur = sel.rotorOffset ?? [0, 1.25, 0];
                        return (
                          <input
                            key={i}
                            type="number"
                            step="0.05"
                            className={inp + ' w-0 flex-1 text-center'}
                            value={cur[i]}
                            onChange={(e) => {
                              const next = [...cur] as [number, number, number];
                              next[i] = parseFloat(e.target.value) || 0;
                              set({ rotorOffset: next });
                            }}
                          />
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Rotor Offset — Robot form (x / y / z)">
                    <div className="flex gap-1">
                      {([0, 1, 2] as const).map((i) => {
                        const cur = sel.rotorOffsetRobot ?? [0, 2.0, 0];
                        return (
                          <input
                            key={i}
                            type="number"
                            step="0.05"
                            className={inp + ' w-0 flex-1 text-center'}
                            value={cur[i]}
                            onChange={(e) => {
                              const next = [...cur] as [number, number, number];
                              next[i] = parseFloat(e.target.value) || 0;
                              set({ rotorOffsetRobot: next });
                            }}
                          />
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Rotor Scale">
                    <input
                      type="number"
                      step="0.05"
                      className={inp}
                      value={sel.rotorScale ?? 1}
                      onChange={(e) => set({ rotorScale: parseFloat(e.target.value) || 0.01 })}
                    />
                  </Field>
                </>
              )}

              <Field label="Ability Name (Q)">
                <input
                  className={inp}
                  value={sel.abilityName ?? ''}
                  placeholder="e.g. Water Spray"
                  onChange={(e) => set({ abilityName: e.target.value })}
                />
              </Field>
              <Field label="Ability Colour">
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={sel.abilityColor ?? sel.color}
                    onChange={(e) => set({ abilityColor: e.target.value })}
                    className="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    className={inp + ' flex-1'}
                    value={sel.abilityColor ?? ''}
                    placeholder="defaults to character colour"
                    onChange={(e) => set({ abilityColor: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Ability Type (Q effect)">
                <select className={inp} value={sel.abilityType ?? 'speed_boost'} onChange={(e) => set({ abilityType: e.target.value as typeof sel.abilityType })}>
                  {ABILITY_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Ability radius"><input type="number" step={1} className={inp} value={sel.abilityRadius ?? 8} onChange={(e) => set({ abilityRadius: parseFloat(e.target.value) || 0 })} /></Field>
                <Field label="Ability duration (s)"><input type="number" step={0.5} className={inp} value={sel.abilityDuration ?? 3} onChange={(e) => set({ abilityDuration: parseFloat(e.target.value) || 0 })} /></Field>
                <Field label="Ability strength"><input type="number" step={0.5} className={inp} value={sel.abilityStrength ?? 1} onChange={(e) => set({ abilityStrength: parseFloat(e.target.value) || 0 })} /></Field>
                <Field label="Cooldown (s)"><input type="number" step={0.5} className={inp} value={sel.abilityCooldownSec ?? 5} onChange={(e) => set({ abilityCooldownSec: parseFloat(e.target.value) || 0 })} /></Field>
              </div>

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
