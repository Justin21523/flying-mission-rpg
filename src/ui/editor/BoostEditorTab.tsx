import { useEditorBoostStore } from '../../stores/editorBoostStore';
import { Field, inp, lbl, Check } from './editorShared';
import { ModelPicker } from './ModelPicker';

// ⭐ Boost tab — edit ground-pickup scatter + the boost meter + super-boost mode. Auto-saves; applies live.
export const BoostEditorTab = () => {
  const s = useEditorBoostStore();
  const set = s.set;
  return (
    <div className="space-y-3 text-xs">
      <section className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
        <div className={lbl}>Ground pickups</div>
        <Field label="pickup model (empty = glowing orb)">
          <ModelPicker value={s.pickupModelAssetId || undefined} onChange={(v) => set({ pickupModelAssetId: v ?? '' })} allowNone noneLabel="(glowing orb)" />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="value / pickup"><input type="number" min={1} value={s.pickupValue} onChange={(e) => set({ pickupValue: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
          <Field label="count / area"><input type="number" min={0} value={s.pickupCount} onChange={(e) => set({ pickupCount: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
          <Field label="scatter spread"><input type="number" min={2} value={s.pickupSpread} onChange={(e) => set({ pickupSpread: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
        <div className={lbl}>Boost meter + super mode</div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="meter max"><input type="number" min={1} value={s.meterMax} onChange={(e) => set({ meterMax: parseFloat(e.target.value) || 1 })} className={inp} /></Field>
          <Field label="super speed ×"><input type="number" step={0.1} min={1} value={s.superSpeedMult} onChange={(e) => set({ superSpeedMult: parseFloat(e.target.value) || 1 })} className={inp} /></Field>
          <Field label="super duration (s)"><input type="number" step={0.5} min={1} value={s.superDurationSec} onChange={(e) => set({ superDurationSec: parseFloat(e.target.value) || 1 })} className={inp} /></Field>
          <div className="flex items-end"><Check label="super flies" checked={s.superFlies} onChange={(v) => set({ superFlies: v })} /></div>
          <Field label="afterimage interval (s)"><input type="number" step={0.02} min={0.02} value={s.afterimageIntervalSec} onChange={(e) => set({ afterimageIntervalSec: parseFloat(e.target.value) || 0.08 })} className={inp} /></Field>
          <Field label="afterimage life (s)"><input type="number" step={0.1} min={0.1} value={s.afterimageLifeSec} onChange={(e) => set({ afterimageLifeSec: parseFloat(e.target.value) || 0.5 })} className={inp} /></Field>
        </div>
        <button onClick={() => s.reset()} className="rounded border border-slate-600 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">↺ Reset defaults</button>
      </section>
      <p className="text-[10px] text-slate-500">玩法:撿地上的道具 → meter 滿 → 按 R 啟動超級加速(飛行 + 分身殘影)。</p>
    </div>
  );
};
