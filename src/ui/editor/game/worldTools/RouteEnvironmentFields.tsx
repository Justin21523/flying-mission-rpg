import { WEATHER_KINDS, SKY_PRESETS } from '../../../../types/game/flight';
import type { FlightRoute, RouteEnvironmentOverride } from '../../../../types/game/flight';
import { TextRow, NumRow, SelectRow, ColorRow } from '../CollectionEditor';
import { lbl } from '../../editorShared';

// Per-route sky / fog / cloud-density / weather override (editorEnvironment). The world-flight scene
// recolours live (WorldFlightEnvironment reads sky/fog/light; CloudField reads cloudDensity) for the ACTIVE
// route. weather + backgroundPresetId are authored metadata (no new weather visuals this batch).
export const RouteEnvironmentFields = ({ route, update }: { route: FlightRoute; update: (patch: Partial<FlightRoute>) => void }) => {
  const env: RouteEnvironmentOverride = route.editorEnvironment ?? {};
  const patch = (p: Partial<RouteEnvironmentOverride>) => update({ editorEnvironment: { ...env, ...p } });
  return (
    <div className="space-y-2">
      <div className={lbl}>Route environment</div>
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
      <button onClick={() => update({ editorEnvironment: undefined })} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">↺ Clear override</button>
    </div>
  );
};
