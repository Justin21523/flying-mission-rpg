import { useRescueLicenseStore, getCurrentLicenseTier } from '../../stores/rescueLicenseStore';
import { Field, inp, lbl } from './editorShared';

// 🎖 License tab — edit rescue-license tiers (icon/name/thresholds) + the live rescues-completed counter.
export const LicenseEditorTab = () => {
  const rescues = useRescueLicenseStore((s) => s.rescuesCompleted);
  const tiers = useRescueLicenseStore((s) => s.tiers);
  const st = useRescueLicenseStore.getState();
  const current = getCurrentLicenseTier();

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
        <span className="text-lg">{current?.icon}</span>
        <span className="font-semibold text-amber-100">{current?.name ?? '—'}</span>
        <label className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">rescues
          <input type="number" min={0} value={rescues} onChange={(e) => st.setRescues(parseInt(e.target.value, 10) || 0)} className="w-16 rounded bg-slate-800 px-1.5 py-1 text-slate-100" />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className={lbl}>Tiers ({tiers.length})</span>
        <button onClick={() => st.addTier()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ tier</button>
      </div>

      {tiers.map((t, i) => (
        <div key={t.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <input value={t.icon} onChange={(e) => st.updateTier(t.id, { icon: e.target.value })} className="w-10 rounded bg-slate-800 px-1.5 py-1 text-center text-slate-100" />
            <input value={t.name} onChange={(e) => st.updateTier(t.id, { name: e.target.value })} className={`flex-1 ${inp}`} />
            <button disabled={i === 0} onClick={() => st.moveTier(t.id, -1)} className="rounded px-1 text-slate-400 hover:bg-slate-800 disabled:opacity-30">↑</button>
            <button disabled={i === tiers.length - 1} onClick={() => st.moveTier(t.id, 1)} className="rounded px-1 text-slate-400 hover:bg-slate-800 disabled:opacity-30">↓</button>
            <button onClick={() => st.removeTier(t.id)} className="rounded px-1 text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="rescues required"><input type="number" min={0} value={t.requiredRescues} onChange={(e) => st.updateTier(t.id, { requiredRescues: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
            <Field label="exp required"><input type="number" min={0} value={t.requiredExp} onChange={(e) => st.updateTier(t.id, { requiredExp: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
          </div>
        </div>
      ))}
    </div>
  );
};
