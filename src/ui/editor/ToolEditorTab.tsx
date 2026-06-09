import { useEditorToolStore } from '../../stores/editorToolStore';
import { Field, inp, lbl } from './editorShared';
import type { ToolDefinition } from '../../types/tool';
import { TOOL_CATEGORIES } from '../../types/tool';

// 🛠 Tools tab — edit rescue tools + the skill tree (prerequisites) + per-tool upgrade level.
// A tool can't be unlocked in-game until all its prerequisites are unlocked. Auto-saves.
export const ToolEditorTab = () => {
  const tools = useEditorToolStore((s) => s.tools);
  const upgrades = useEditorToolStore((s) => s.upgrades);
  const selectedId = useEditorToolStore((s) => s.selectedId);
  const st = useEditorToolStore.getState();
  const sel = tools.find((t) => t.id === selectedId) ?? null;
  const set = (patch: Partial<ToolDefinition>) => { if (sel) st.updateTool(sel.id, patch); };

  // Tree validation: missing prereqs + simple cycle check.
  const ids = new Set<string>(tools.map((t) => t.id));
  const issues: string[] = [];
  for (const t of tools) for (const p of t.prerequisites ?? []) if (!ids.has(p)) issues.push(`${t.name}: missing prereq "${p}"`);
  const inCycle = (start: string): boolean => {
    const seen = new Set<string>(); const stack = [start];
    while (stack.length) { const cur = stack.pop()!; for (const p of tools.find((t) => t.id === cur)?.prerequisites ?? []) { if (p === start) return true; if (!seen.has(p)) { seen.add(p); stack.push(p); } } }
    return false;
  };
  for (const t of tools) if (inCycle(t.id)) { issues.push(`${t.name}: prerequisite cycle`); break; }

  return (
    <div className="flex h-full gap-3 text-xs">
      <div className="w-44 shrink-0 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between"><span className={lbl}>Tools ({tools.length})</span>
          <button onClick={() => st.addTool()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕</button></div>
        {tools.map((t) => (
          <button key={t.id} onClick={() => st.selectTool(t.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${selectedId === t.id ? 'bg-violet-700/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>
            <span>{t.icon}</span><span className="flex-1 truncate">{t.name}</span>
            <span className="text-[9px] text-slate-500">L{t.unlockLevel}{(upgrades[t.id] ?? 0) > 0 ? ` ·+${upgrades[t.id]}` : ''}</span>
          </button>
        ))}
        {issues.length > 0 && (
          <div className="rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1 text-[10px] text-amber-200">
            {issues.map((i, k) => <div key={k}>⚠ {i}</div>)}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!sel ? <div className="pt-4 text-slate-500">Select or add a tool.</div> : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-100">{sel.icon} {sel.name}</div>
              <button onClick={() => st.removeTool(sel.id)} className="rounded border border-red-700/50 bg-red-700/15 px-2 py-1 text-[10px] text-red-200">🗑 Del</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="name"><input value={sel.name} onChange={(e) => set({ name: e.target.value })} className={inp} /></Field>
              <Field label="icon"><input value={sel.icon} onChange={(e) => set({ icon: e.target.value })} className={inp} /></Field>
              <Field label="unlock level"><input type="number" min={1} value={sel.unlockLevel} onChange={(e) => set({ unlockLevel: parseInt(e.target.value, 10) || 1 })} className={inp} /></Field>
              <Field label="unlock trust (Jin)"><input type="number" min={0} value={sel.unlockTrustWithJin} onChange={(e) => set({ unlockTrustWithJin: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
            </div>
            <Field label="description"><input value={sel.description} onChange={(e) => set({ description: e.target.value })} className={inp} /></Field>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
              <Field label="category">
                <select value={sel.category ?? 'utility'} onChange={(e) => set({ category: e.target.value as typeof sel.category })} className={inp}>
                  {TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="stage affinity">
                <select value={sel.stageAffinity ?? 'any'} onChange={(e) => set({ stageAffinity: e.target.value as typeof sel.stageAffinity })} className={inp}>
                  {['any', 'action', 'waypoints'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="cooldown (s)"><input type="number" step={0.5} value={sel.cooldownSec ?? 0} onChange={(e) => set({ cooldownSec: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="use duration (s)"><input type="number" step={0.5} value={sel.useDurationSec ?? 0} onChange={(e) => set({ useDurationSec: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="VFX colour">
                <input type="color" value={sel.vfxColor ?? '#38bdf8'} onChange={(e) => set({ vfxColor: e.target.value })} className="h-7 w-12 cursor-pointer rounded border-0 bg-transparent" />
              </Field>
              <Field label="synergy tools">
                <div className="flex flex-wrap gap-1">
                  {tools.filter((t) => t.id !== sel.id).map((t) => {
                    const on = (sel.synergyToolIds ?? []).includes(t.id);
                    return <button key={t.id} onClick={() => { const cur = sel.synergyToolIds ?? []; set({ synergyToolIds: on ? cur.filter((x) => x !== t.id) : [...cur, t.id] }); }} className={`rounded px-1.5 py-0.5 text-[10px] ${on ? 'bg-violet-600/50 text-violet-50' : 'bg-slate-800 text-slate-400'}`}>{on ? '✓ ' : ''}{t.name}</button>;
                  })}
                </div>
              </Field>
            </div>

            <Field label="Prerequisites (skill tree — unlock these first)">
              <div className="flex flex-wrap gap-1">
                {tools.filter((t) => t.id !== sel.id).map((t) => {
                  const on = (sel.prerequisites ?? []).includes(t.id);
                  return (
                    <button key={t.id} onClick={() => {
                      const cur = sel.prerequisites ?? [];
                      set({ prerequisites: on ? cur.filter((p) => p !== t.id) : [...cur, t.id] });
                    }} className={`rounded px-2 py-0.5 text-[10px] ${on ? 'bg-violet-600/50 text-violet-50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      {on ? '✓ ' : ''}{t.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="max upgrade"><input type="number" min={0} value={sel.maxUpgrade ?? 0} onChange={(e) => set({ maxUpgrade: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
              <Field label="bonus / upgrade lvl"><input type="number" step={0.05} value={sel.upgradeBonusPerLevel ?? 0} onChange={(e) => set({ upgradeBonusPerLevel: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            </div>
            <Field label={`current upgrade level (0–${sel.maxUpgrade ?? 0})`}>
              <input type="number" min={0} max={sel.maxUpgrade ?? 0} value={upgrades[sel.id] ?? 0}
                onChange={(e) => st.setUpgrade(sel.id, Math.min(sel.maxUpgrade ?? 0, parseInt(e.target.value, 10) || 0))} className={inp} />
            </Field>

            <div className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
              <div className={lbl}>Incident bonus</div>
              <Field label="incident id"><input value={sel.incidentBonus?.incidentId ?? ''} onChange={(e) => set({ incidentBonus: { incidentId: e.target.value, actionBonus: sel.incidentBonus?.actionBonus, timeBonus: sel.incidentBonus?.timeBonus, radiusBonus: sel.incidentBonus?.radiusBonus } })} className={inp} /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="action+"><input type="number" step={0.05} value={sel.incidentBonus?.actionBonus ?? 0} onChange={(e) => set({ incidentBonus: { incidentId: sel.incidentBonus?.incidentId ?? '', actionBonus: parseFloat(e.target.value) || 0, timeBonus: sel.incidentBonus?.timeBonus, radiusBonus: sel.incidentBonus?.radiusBonus } })} className={inp} /></Field>
                <Field label="time+"><input type="number" step={0.5} value={sel.incidentBonus?.timeBonus ?? 0} onChange={(e) => set({ incidentBonus: { incidentId: sel.incidentBonus?.incidentId ?? '', actionBonus: sel.incidentBonus?.actionBonus, timeBonus: parseFloat(e.target.value) || 0, radiusBonus: sel.incidentBonus?.radiusBonus } })} className={inp} /></Field>
                <Field label="radius+"><input type="number" step={0.5} value={sel.incidentBonus?.radiusBonus ?? 0} onChange={(e) => set({ incidentBonus: { incidentId: sel.incidentBonus?.incidentId ?? '', actionBonus: sel.incidentBonus?.actionBonus, timeBonus: sel.incidentBonus?.timeBonus, radiusBonus: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
