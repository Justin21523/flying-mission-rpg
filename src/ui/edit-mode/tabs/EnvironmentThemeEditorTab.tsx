import { useState } from 'react';
import { previewEnvironmentTheme } from '../../../game/environments/EnvironmentThemeDirector';
import { useEnvironmentThemeStore } from '../../../stores/useEnvironmentEditorStore';
import { applyEnvironmentTheme } from '../../../game/environment/applyEnvironmentTheme';
import type { EnvironmentThemeDefinition } from '../../../types/environmentThemeTypes';
import { Field, inp, lbl } from '../../editor/editorShared';

// 🌦 Stage Environment — edit the EnvironmentTheme library (Batch J fleshed this out from a preview-only stub).
// A segment references a theme by id (🎯 Mission Zone tab → Environment theme); on segment-enter the theme is
// applied live (sky/fog/lighting + ground override) and is fully restorable in Edit Mode. "Apply now" writes it
// to the live area so you can tune it against the running scene.
const SKY_PRESETS: EnvironmentThemeDefinition['sky']['preset'][] = ['day', 'sunset', 'night', 'storm', 'indoor', 'custom'];
const WEATHER_TYPES: NonNullable<EnvironmentThemeDefinition['weather']>['type'][] = ['none', 'rain', 'wind', 'dust', 'smoke', 'storm'];
const num = (v: string) => parseFloat(v) || 0;

export const EnvironmentThemeEditorTab = () => {
  const themes = useEnvironmentThemeStore((s) => s.items);
  const update = useEnvironmentThemeStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(themes[0]?.id ?? null);
  const t = themes.find((x) => x.id === sel) ?? null;

  return (
    <div className="space-y-3 text-xs">
      <div className={lbl}>Environment themes · {themes.length}</div>
      <div className="flex flex-wrap gap-1">
        {themes.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[11px] ${x.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.name}</button>
        ))}
      </div>

      {t && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Sky preset">
              <select value={t.sky.preset} onChange={(e) => update(t.id, { sky: { ...t.sky, preset: e.target.value as EnvironmentThemeDefinition['sky']['preset'] } })} className={inp}>
                {SKY_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Sky color"><input type="color" value={t.sky.color ?? '#88bbee'} onChange={(e) => update(t.id, { sky: { ...t.sky, color: e.target.value } })} className="h-7 w-16 rounded bg-slate-800" /></Field>
            <Field label="Ambient intensity"><input type="number" step={0.05} value={t.lighting.ambientIntensity} onChange={(e) => update(t.id, { lighting: { ...t.lighting, ambientIntensity: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Directional intensity"><input type="number" step={0.05} value={t.lighting.directionalIntensity} onChange={(e) => update(t.id, { lighting: { ...t.lighting, directionalIntensity: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Weather">
              <select value={t.weather?.type ?? 'none'} onChange={(e) => update(t.id, { weather: { type: e.target.value as NonNullable<EnvironmentThemeDefinition['weather']>['type'], intensity: t.weather?.intensity ?? 0.5 } })} className={inp}>
                {WEATHER_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label="Weather intensity"><input type="number" step={0.05} value={t.weather?.intensity ?? 0} onChange={(e) => update(t.id, { weather: { type: t.weather?.type ?? 'none', intensity: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Fog enabled"><input type="checkbox" checked={t.fog?.enabled ?? false} onChange={(e) => update(t.id, { fog: { enabled: e.target.checked, color: t.fog?.color ?? '#a8c4dd', density: t.fog?.density ?? 0.04, heightFog: t.fog?.heightFog } })} /></Field>
            <Field label="Fog color"><input type="color" value={t.fog?.color ?? '#a8c4dd'} onChange={(e) => update(t.id, { fog: { enabled: t.fog?.enabled ?? true, color: e.target.value, density: t.fog?.density ?? 0.04, heightFog: t.fog?.heightFog } })} className="h-7 w-16 rounded bg-slate-800" /></Field>
            <Field label="Fog density"><input type="number" step={0.005} value={t.fog?.density ?? 0} onChange={(e) => update(t.id, { fog: { enabled: t.fog?.enabled ?? true, color: t.fog?.color ?? '#a8c4dd', density: num(e.target.value), heightFog: t.fog?.heightFog } })} className={inp} /></Field>
          </div>
          <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
            <button onClick={() => previewEnvironmentTheme(t.id)} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">👁 Preview</button>
            <button onClick={() => applyEnvironmentTheme(t.id)} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">✓ Apply now (live area)</button>
            <span className="ml-auto self-center text-[10px] text-slate-500">id: {t.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};
