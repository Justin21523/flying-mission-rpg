// Batch 12 — tiny shared controls for the Settings tabs (consistent look, no new dependency).

export const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-2 py-0.5 text-slate-300">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-cyan-500" />
  </label>
);

export const Slider = ({ label, value, min, max, step, onChange, disabled }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; disabled?: boolean }) => (
  <label className="flex flex-col gap-0.5 py-0.5">
    <span className="text-slate-400">{label}: {Math.round(value * 100) / 100}</span>
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(parseFloat(e.target.value))} className="accent-cyan-500 disabled:opacity-40" />
  </label>
);

export const Choice = <T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) => (
  <label className="flex flex-col gap-0.5 py-0.5">
    <span className="text-slate-400">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className="rounded bg-slate-800 px-2 py-1 text-slate-100">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);
