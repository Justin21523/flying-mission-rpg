import { inp, Field } from '../editorShared';
import { useEditorTransformationPolishStore } from '../../../stores/game/editorTransformationPolishStore';
import { validateTransformationPolish } from '../../../game/transformation/polish/transformationPolishSchema';
import { TRANSFORMATION_PARTICLE_STYLES, QUICK_MODE_POLISH_LEVELS, type TransformationParticleStyle, type QuickModePolishLevel } from '../../../types/game/transformationPolish';

// Batch 12 — ✨ Transform Polish editor. Per-character theme color / particle style / quick-mode polish.
// The polish director reads these (falling back to the character's own color), feeding the transformation
// backdrop + effects. Reduce-motion caps quick mode at 'minimal' at runtime regardless of this setting.
export const TransformationPolishEditorTab = () => {
  const items = useEditorTransformationPolishStore((s) => s.items);
  const update = useEditorTransformationPolishStore.getState().update;

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="text-[11px] text-slate-400">Per-character transformation look. Theme color drives the backdrop; particle style is the burst flavour.</div>
      {items.map((p) => {
        const v = validateTransformationPolish(p);
        return (
          <div key={p.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-slate-100">{p.characterId} <span className="text-slate-500">({p.id})</span></span>
              {!v.ok && <span className="text-[10px] text-rose-400">⚠ {v.errors[0]}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Theme color"><input className={inp} value={p.themeColor} onChange={(e) => update(p.id, { themeColor: e.target.value })} /></Field>
              <Field label="Energy ring color"><input className={inp} value={p.energyRingColor} onChange={(e) => update(p.id, { energyRingColor: e.target.value })} /></Field>
              <Field label="Secondary color"><input className={inp} value={p.secondaryColor ?? ''} onChange={(e) => update(p.id, { secondaryColor: e.target.value || undefined })} /></Field>
              <Field label="Backdrop pulse"><input type="number" step={0.1} min={0} max={2} className={inp} value={p.backdropPulseIntensity} onChange={(e) => update(p.id, { backdropPulseIntensity: Number(e.target.value) || 0 })} /></Field>
              <Field label="Particle style">
                <select className={inp} value={p.particleStyle} onChange={(e) => update(p.id, { particleStyle: e.target.value as TransformationParticleStyle })}>
                  {TRANSFORMATION_PARTICLE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Quick-mode polish">
                <select className={inp} value={p.quickModePolishLevel} onChange={(e) => update(p.id, { quickModePolishLevel: e.target.value as QuickModePolishLevel })}>
                  {QUICK_MODE_POLISH_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>
        );
      })}
    </div>
  );
};
