import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { usePlayerStore } from '../../stores/playerStore';
import { editorSpawn } from '../../stores/sceneEditStore';
import { getKitArea } from '../../data/areas';
import { BIOME_THEMES } from '../../data/environmentThemes';
import { TEXTURE_SETS } from '../../game/world/textureLibrary';
import { defaultNormalizeFor } from '../../game/world/normalizeDefault';
import { DISTRICT_CATEGORIES, DISTRICT_CATEGORY_LABEL, EDGE_DIRS } from '../../types/world';
import type { DistrictCategory } from '../../types/world';
import { Field, inp, lbl } from './editorShared';
import { ModelPicker } from './ModelPicker';
import { useState } from 'react';

const BIOME_KEYS = Object.keys(BIOME_THEMES);
const camXZ = (): [number, number, number] => [Math.round(editorSpawn.x * 100) / 100, 0, Math.round(editorSpawn.z * 100) / 100];

// 🗺 World tab — manage districts → areas → layout presets. Districts group areas; each area has multiple
// swappable layout presets (placed models + paved ground). Everything auto-saves and applies live.
export const WorldEditorTab = () => {
  const w = useEditorWorldStore();
  const selectedDistrict = w.districts.find((d) => d.id === w.selectedDistrictId) ?? null;
  const areasInDistrict = selectedDistrict ? w.areas.filter((a) => a.districtId === selectedDistrict.id) : [];
  const selectedArea = w.areas.find((a) => a.id === w.selectedAreaId) ?? null;

  return (
    <div className="flex h-full flex-col gap-2 text-xs">
      {/* Global travel mode */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <label className="flex items-center gap-1 text-[11px] text-slate-300"><input type="checkbox" checked={w.useEdgeWalk} onChange={(e) => w.setEdgeWalk(e.target.checked)} className="accent-emerald-500" />🚶 Edge-walk travel (no portals)</label>
        <label className="flex items-center gap-1 text-[11px] text-slate-300"><input type="checkbox" checked={w.fadeEnabled} onChange={(e) => w.setFadeEnabled(e.target.checked)} className="accent-sky-500" />🌫 Fade transition</label>
      </div>
      <div className="flex min-h-0 flex-1 gap-3">
      {/* Districts + areas column */}
      <div className="w-52 shrink-0 space-y-3 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between"><span className={lbl}>Districts ({w.districts.length})</span>
            <button onClick={() => w.addDistrict()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕</button></div>
          {w.districts.map((d) => (
            <button key={d.id} onClick={() => w.selectDistrict(d.id)} className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${w.selectedDistrictId === d.id ? 'bg-violet-700/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span className="flex-1 truncate">{d.name}</span>
              <span className="text-[9px] text-slate-500">{DISTRICT_CATEGORY_LABEL[d.category]}</span>
            </button>
          ))}
        </div>

        {selectedDistrict && (
          <div className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <Field label="district name"><input value={selectedDistrict.name} onChange={(e) => w.updateDistrict(selectedDistrict.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="category">
              <select value={selectedDistrict.category} onChange={(e) => w.updateDistrict(selectedDistrict.id, { category: e.target.value as DistrictCategory })} className={inp}>
                {DISTRICT_CATEGORIES.map((c) => <option key={c} value={c}>{DISTRICT_CATEGORY_LABEL[c]}</option>)}
              </select>
            </Field>
            <button onClick={() => w.removeDistrict(selectedDistrict.id)} className="rounded border border-red-700/50 bg-red-700/15 px-2 py-1 text-[10px] text-red-200">🗑 delete district</button>

            <div className="flex items-center justify-between pt-1"><span className={lbl}>Areas ({areasInDistrict.length})</span>
              <button onClick={() => w.addArea(selectedDistrict.id)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕</button></div>
            {areasInDistrict.map((a) => (
              <div key={a.id} className={`flex items-center gap-1 rounded px-1.5 py-1 ${w.selectedAreaId === a.id ? 'bg-violet-700/30' : 'hover:bg-slate-800'}`}>
                <button onClick={() => w.selectArea(a.id)} className="flex-1 truncate text-left text-slate-200">{a.name}</button>
                <button onClick={() => { const sp = getKitArea(a.id)?.spawnPoint ?? { x: 0, y: 3, z: 0 }; usePlayerStore.getState().travelToArea(a.id, sp); }} title="Travel here" className="rounded px-1 text-[10px] text-sky-300 hover:bg-slate-700">▶</button>
                <button onClick={() => w.removeArea(a.id)} className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-700">🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected area: properties + layouts */}
      <div className="flex-1 overflow-y-auto">
        {!selectedArea ? <div className="pt-4 text-slate-500">Select a district, then an area.</div> : (
          <div className="space-y-3">
            <AreaProps key={selectedArea.id} areaId={selectedArea.id} />
            <LayoutsPanel key={`layouts-${selectedArea.id}`} areaId={selectedArea.id} />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

const AreaProps = ({ areaId }: { areaId: string }) => {
  const w = useEditorWorldStore();
  const area = w.areas.find((a) => a.id === areaId)!;
  const areaOptions = w.areas.filter((a) => a.id !== areaId).map((a) => ({ id: a.id, label: a.name }));
  return (
    <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
      <div className="text-sm font-bold text-slate-100">📍 {area.name}</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="area name"><input value={area.name} onChange={(e) => w.updateArea(areaId, { name: e.target.value })} className={inp} /></Field>
        <Field label="biome">
          <select value={area.biome ?? area.ambientTheme ?? ''} onChange={(e) => w.updateArea(areaId, { biome: e.target.value })} className={inp}>
            <option value="">(inferred)</option>
            {BIOME_KEYS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="map size (half-extent)">
          <input type="number" min={10} step={5} value={area.size ?? 40} onChange={(e) => w.updateArea(areaId, { size: parseFloat(e.target.value) || 40 })} className={inp} />
        </Field>
      </div>
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
        <div className={lbl}>Edge neighbours (walk off an edge to travel)</div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {EDGE_DIRS.map((dir) => (
            <Field key={dir} label={dir}>
              <select value={area.edges?.[dir] ?? ''} onChange={(e) => w.setAreaEdge(areaId, dir, e.target.value || undefined)} className={inp}>
                <option value="">(walled)</option>
                {areaOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-slate-500">N=−z · S=+z · E=+x · W=−x · 對向會自動互連</p>
      </div>
    </div>
  );
};

const LayoutsPanel = ({ areaId }: { areaId: string }) => {
  const presets = useEditorLayoutStore((s) => s.presets[areaId]) ?? [];
  const activeId = useEditorLayoutStore((s) => s.activePresetId[areaId]);
  const st = useEditorLayoutStore.getState();
  const active = presets.find((p) => p.id === activeId) ?? presets[0] ?? null;
  const [pick, setPick] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
      <div className="flex items-center justify-between">
        <span className={lbl}>Layout presets ({presets.length})</span>
        <div className="flex gap-1">
          <button onClick={() => st.addPreset(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">➕ new</button>
          <button onClick={() => st.saveCurrentAsPreset(areaId, `Layout ${presets.length + 1}`)} className="rounded bg-sky-700/30 px-2 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700/50">💾 save current</button>
        </div>
      </div>
      {presets.map((p) => (
        <div key={p.id} className={`flex items-center gap-1 rounded px-1.5 py-1 ${active?.id === p.id ? 'bg-violet-700/25' : 'hover:bg-slate-800'}`}>
          <button onClick={() => st.switchPreset(areaId, p.id)} title="Make active" className={`text-[11px] ${active?.id === p.id ? 'text-emerald-300' : 'text-slate-500'}`}>{active?.id === p.id ? '✓' : '○'}</button>
          <input value={p.name} onChange={(e) => st.renamePreset(areaId, p.id, e.target.value)} className={`flex-1 ${inp}`} />
          <span className="text-[9px] text-slate-500">{p.pieces.length}pcs</span>
          <button onClick={() => st.duplicatePreset(areaId, p.id)} title="Duplicate" className="rounded px-1 text-[10px] text-slate-300 hover:bg-slate-700">⧉</button>
          <button onClick={() => st.deletePreset(areaId, p.id)} title="Delete" className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-700">🗑</button>
        </div>
      ))}
      {presets.length === 0 && <div className="text-[11px] text-slate-500">No presets yet — ➕ new or 💾 save current.</div>}

      {active && (
        <div className="space-y-2 border-t border-slate-700/50 pt-2">
          <div className="text-[11px] font-semibold text-slate-300">Active: {active.name}</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ground texture">
              <select value={active.groundTextureKey ?? ''} onChange={(e) => st.setPresetGround(areaId, active.id, e.target.value || undefined, active.groundRepeat)} className={inp}>
                <option value="">(area default)</option>
                {TEXTURE_SETS.filter((s) => s.albedoKey).map((s) => <option key={s.id} value={s.albedoKey}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="ground tiling">
              <input type="number" min={1} value={active.groundRepeat ?? 24} onChange={(e) => st.setPresetGround(areaId, active.id, active.groundTextureKey, parseInt(e.target.value, 10) || 24)} className={inp} />
            </Field>
          </div>

          <div className="flex items-end gap-1.5">
            <div className="flex-1"><Field label="add model (placed at camera)"><ModelPicker value={pick} onChange={setPick} allowNone noneLabel="(choose model)" /></Field></div>
            <button disabled={!pick} onClick={() => { if (pick) { st.addPiece(areaId, pick, camXZ()); setPick(undefined); } }} className="rounded bg-emerald-700/40 px-2 py-1 text-[11px] text-emerald-100 disabled:opacity-40">➕ at cam</button>
          </div>

          <div className="max-h-44 space-y-1 overflow-y-auto">
            {active.pieces.map((pc) => (
              <div key={pc.id} className="flex items-center gap-1.5 rounded bg-slate-800/60 px-1.5 py-1">
                <span className="flex-1 truncate text-[10px] text-slate-300" title={pc.assetId}>{pc.assetId.split('/').pop()}</span>
                <label className="flex items-center gap-1 text-[9px] text-slate-500">size
                  <input type="number" step={0.5} value={pc.normalize ?? defaultNormalizeFor(pc.assetId)} onChange={(e) => st.updatePiece(areaId, pc.id, { normalize: parseFloat(e.target.value) || 0 })} className="w-12 rounded bg-slate-900 px-1 py-0.5 text-slate-100" />
                </label>
                <select value={pc.collision ?? 'trimesh'} onChange={(e) => st.updatePiece(areaId, pc.id, { collision: e.target.value as typeof pc.collision })} title="Physics collider" className="rounded bg-slate-900 px-1 py-0.5 text-[9px] text-slate-100">
                  <option value="trimesh">trimesh</option>
                  <option value="hull">hull</option>
                  <option value="cuboid">cuboid</option>
                  <option value="none">none</option>
                </select>
                <button onClick={() => st.removePiece(areaId, pc.id)} className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-700">🗑</button>
              </div>
            ))}
            {active.pieces.length === 0 && <div className="text-[10px] text-slate-500">No models in this layout — add one above.</div>}
          </div>
        </div>
      )}
    </div>
  );
};
