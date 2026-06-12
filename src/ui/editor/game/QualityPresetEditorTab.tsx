import { inp, lbl, Field, Check } from '../editorShared';
import { useEditorQualityStore } from '../../../stores/game/editorQualityStore';
import { validateQualityPreset } from '../../../game/performance/qualityPresetSchema';
import type { QualityPreset, EffectQuality, CloudQuality } from '../../../types/game/quality';
import { EFFECT_QUALITIES, CLOUD_QUALITIES, VALID_SHADOW_MAP_SIZES } from '../../../types/game/quality';

// Batch 12 — ⚙ Quality editor. Tunes the low/medium/high/ultra preset budgets (effects, shadows, character
// AI limits). The QualityPresetController reads these; invalid presets show an error here and fall back at
// runtime. Character/AI limits here feed the Batch-8 support limits (single owner).
export const QualityPresetEditorTab = () => {
  const items = useEditorQualityStore((s) => s.items);
  const update = useEditorQualityStore.getState().update;
  const num = (id: string, key: keyof QualityPreset, v: string) => update(id, { [key]: Number(v) || 0 } as Partial<QualityPreset>);

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="text-[11px] text-slate-400">Tune each quality tier. Character/AI limits drive the multi-character (Batch 8) limits when the tier is active.</div>
      {items.map((p) => {
        const v = validateQualityPreset(p);
        return (
          <div key={p.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-slate-100">{p.label} <span className="text-slate-500">({p.id})</span></span>
              {!v.ok && <span className="text-[10px] text-rose-400">⚠ {v.errors[0]}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Shadow map">
                <select className={inp} value={p.shadowMapSize} onChange={(e) => num(p.id, 'shadowMapSize', e.target.value)}>
                  {VALID_SHADOW_MAP_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Pool budget ×"><input type="number" step={0.1} className={inp} value={p.objectPoolBudgetMultiplier} onChange={(e) => num(p.id, 'objectPoolBudgetMultiplier', e.target.value)} /></Field>
              <Field label="Particles">
                <select className={inp} value={p.particleQuality} onChange={(e) => update(p.id, { particleQuality: e.target.value as EffectQuality })}>{EFFECT_QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}</select>
              </Field>
              <Field label="Clouds">
                <select className={inp} value={p.cloudQuality} onChange={(e) => update(p.id, { cloudQuality: e.target.value as CloudQuality })}>{CLOUD_QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}</select>
              </Field>
              <Field label="Max active"><input type="number" className={inp} value={p.maxActiveCharacters} onChange={(e) => num(p.id, 'maxActiveCharacters', e.target.value)} /></Field>
              <Field label="Max standby"><input type="number" className={inp} value={p.maxStandbyCharacters} onChange={(e) => num(p.id, 'maxStandbyCharacters', e.target.value)} /></Field>
              <Field label="AI tick active"><input type="number" className={inp} value={p.aiTickRateActive} onChange={(e) => num(p.id, 'aiTickRateActive', e.target.value)} /></Field>
              <Field label="AI tick standby"><input type="number" className={inp} value={p.aiTickRateStandby} onChange={(e) => num(p.id, 'aiTickRateStandby', e.target.value)} /></Field>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-3">
              <Check label="Shadows" checked={p.shadowsEnabled} onChange={(c) => update(p.id, { shadowsEnabled: c })} />
              <Check label="Post-processing" checked={p.postprocessingEnabled} onChange={(c) => update(p.id, { postprocessingEnabled: c })} />
              <Check label="Bloom" checked={p.bloomEnabled} onChange={(c) => update(p.id, { bloomEnabled: c })} />
              <Check label="Color grading" checked={p.colorGradingEnabled} onChange={(c) => update(p.id, { colorGradingEnabled: c })} />
              <Check label="Speed lines" checked={p.speedLinesEnabled} onChange={(c) => update(p.id, { speedLinesEnabled: c })} />
              <Check label="Air distortion" checked={p.airDistortionEnabled} onChange={(c) => update(p.id, { airDistortionEnabled: c })} />
              <Check label="Dynamic FOV" checked={p.dynamicFovEnabled} onChange={(c) => update(p.id, { dynamicFovEnabled: c })} />
              <Check label="Camera shake" checked={p.cameraShakeEnabled} onChange={(c) => update(p.id, { cameraShakeEnabled: c })} />
            </div>
          </div>
        );
      })}
      <div className={`${lbl} text-slate-500`}>Reset from the Project tab to restore seed values.</div>
    </div>
  );
};
