import { useState } from 'react';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { WEATHER_KINDS, SKY_PRESETS } from '../../../types/game/flight';
import type { RouteEnvironmentOverride } from '../../../types/game/flight';
import { TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';
import { lbl } from '../editorShared';

// 🌦 Environment — per-route sky / fog / cloud-density / weather override (the editorEnvironment idea). Pick
// a route, edit its environment; the world-flight scene recolours live (WorldFlightEnvironment). Resettable
// by clearing fields. Reuses the route store (no separate store needed).
export const WorldFlightEnvironmentEditorTab = () => {
  const routes = useEditorRouteStore((s) => s.items);
  const update = useEditorRouteStore((s) => s.update);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const route = routes.find((r) => r.id === selectedId) ?? routes[0] ?? null;

  if (!route) return <div className="text-xs text-slate-500">No routes yet (🧭 Routes tab).</div>;
  const env: RouteEnvironmentOverride = route.editorEnvironment ?? {};
  const patch = (p: Partial<RouteEnvironmentOverride>) => update(route.id, { editorEnvironment: { ...env, ...p } });

  return (
    <div className="space-y-3 text-xs">
      <div className={lbl}>Route environment</div>
      <SelectRow label="Route" value={route.id} options={routes.map((r) => ({ value: r.id, label: r.name }))} onChange={setSelectedId} />

      <SelectRow label="Sky preset" value={env.skyPreset ?? ''} options={[{ value: '', label: '(none / manual)' }, ...SKY_PRESETS.map((p) => ({ value: p, label: p }))]} onChange={(v) => patch({ skyPreset: (v || undefined) as RouteEnvironmentOverride['skyPreset'] })} />
      <ColorRow label="Sky top" value={env.skyTop ?? '#3f8fe0'} onChange={(v) => patch({ skyTop: v })} />
      <ColorRow label="Sky bottom" value={env.skyBottom ?? '#cfe7ff'} onChange={(v) => patch({ skyBottom: v })} />
      <ColorRow label="Fog colour" value={env.fogColor ?? '#cfe7ff'} onChange={(v) => patch({ fogColor: v })} />
      <div className="grid grid-cols-2 gap-2">
        <NumRow label="Fog near" value={env.fogNear ?? 0} step={100} min={0} onChange={(v) => patch({ fogNear: v || undefined })} />
        <NumRow label="Fog far (0 = off)" value={env.fogFar ?? 0} step={100} min={0} onChange={(v) => patch({ fogFar: v || undefined })} />
        <NumRow label="Ambient intensity" value={env.ambientIntensity ?? 0.8} step={0.05} min={0} onChange={(v) => patch({ ambientIntensity: v })} />
        <NumRow label="Sun intensity" value={env.sunIntensity ?? 1.15} step={0.05} min={0} onChange={(v) => patch({ sunIntensity: v })} />
      </div>
      <NumRow label="Cloud density ×" value={env.cloudDensity ?? 1} step={0.1} min={0} onChange={(v) => patch({ cloudDensity: v })} />
      <SelectRow label="Weather" value={env.weather ?? ''} options={[{ value: '', label: '(none)' }, ...WEATHER_KINDS.map((w) => ({ value: w, label: w }))]} onChange={(v) => patch({ weather: (v || undefined) as RouteEnvironmentOverride['weather'] })} />
      <TextRow label="Background preset id" value={env.backgroundPresetId ?? ''} onChange={(v) => patch({ backgroundPresetId: v || undefined })} />

      <button
        onClick={() => update(route.id, { editorEnvironment: undefined })}
        className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
      >
        ↺ Clear override
      </button>
    </div>
  );
};
