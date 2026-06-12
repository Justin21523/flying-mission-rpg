import { inp, Field } from '../editorShared';
import { useEditorFlightPolishStore } from '../../../stores/game/editorFlightPolishStore';
import { validateFlightPolish } from '../../../game/flight/effects/flightPolishSchema';
import type { FlightPolishPreset } from '../../../types/game/flightPolish';

// Batch 12 — 🛩✨ Flight Polish editor. Tunes speed-line / engine-trail / cloud-break / color-grade per
// route mood (sunny / storm / sunset). The flight effect controller reads the active preset by route sky.
export const FlightPolishEditorTab = () => {
  const items = useEditorFlightPolishStore((s) => s.items);
  const update = useEditorFlightPolishStore.getState().update;
  const setSpeed = (p: FlightPolishPreset, patch: Partial<FlightPolishPreset['speedLine']>) => update(p.id, { speedLine: { ...p.speedLine, ...patch } });
  const setBreak = (p: FlightPolishPreset, patch: Partial<FlightPolishPreset['cloudBreak']>) => update(p.id, { cloudBreak: { ...p.cloudBreak, ...patch } });

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="text-[11px] text-slate-400">Per route-mood look. Picked automatically from the active route's sky preset (clear/cloudy → sunny, sunset → sunset, night/storm → storm).</div>
      {items.map((p) => {
        const v = validateFlightPolish(p);
        return (
          <div key={p.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-slate-100">{p.label} <span className="text-slate-500">({p.id})</span></span>
              {!v.ok && <span className="text-[10px] text-rose-400">⚠ {v.errors[0]}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Speed line color"><input className={inp} value={p.speedLine.color} onChange={(e) => setSpeed(p, { color: e.target.value })} /></Field>
              <Field label="Speed line count"><input type="number" className={inp} value={p.speedLine.lineCount} onChange={(e) => setSpeed(p, { lineCount: Number(e.target.value) || 0 })} /></Field>
              <Field label="Speed line opacity"><input type="number" step={0.05} min={0} max={1} className={inp} value={p.speedLine.opacity} onChange={(e) => setSpeed(p, { opacity: Number(e.target.value) || 0 })} /></Field>
              <Field label="Boost ×"><input type="number" step={0.1} className={inp} value={p.speedLine.boostMultiplier} onChange={(e) => setSpeed(p, { boostMultiplier: Number(e.target.value) || 0 })} /></Field>
              <Field label="Engine trail color"><input className={inp} value={p.engineTrail.color} onChange={(e) => update(p.id, { engineTrail: { ...p.engineTrail, color: e.target.value } })} /></Field>
              <Field label="Cloud-break particles"><input type="number" className={inp} value={p.cloudBreak.particleCount} onChange={(e) => setBreak(p, { particleCount: Number(e.target.value) || 0 })} /></Field>
              <Field label="Color grade tint"><input className={inp} value={p.colorGradeTint} onChange={(e) => update(p.id, { colorGradeTint: e.target.value })} /></Field>
              <Field label="Cloud density ×"><input type="number" step={0.1} className={inp} value={p.cloudDensityMultiplier} onChange={(e) => update(p.id, { cloudDensityMultiplier: Number(e.target.value) || 0 })} /></Field>
              <Field label="Weather transition (s)"><input type="number" step={0.5} className={inp} value={p.weatherTransitionSpeed} onChange={(e) => update(p.id, { weatherTransitionSpeed: Number(e.target.value) || 0 })} /></Field>
              <Field label="Landmark distance"><input type="number" className={inp} value={p.landmarkVisibilityDistance} onChange={(e) => update(p.id, { landmarkVisibilityDistance: Number(e.target.value) || 1 })} /></Field>
            </div>
          </div>
        );
      })}
    </div>
  );
};
