import { useJinResearchStore } from '../../stores/jinResearchStore';
import { getEditorTools } from '../../stores/editorToolStore';
import { Field, inp, lbl, Check, useAreaOptions } from './editorShared';
import { IdMultiPicker } from './idPickers';
import { RESEARCH_CATEGORIES } from '../../data/progression/researchProjects';
import { ABILITY_TYPES } from '../../types/character';

// 🔬 Research tab — edit Jin's research projects (cost / unlocked tool / prerequisites) + the live points.
export const ResearchEditorTab = () => {
  const points = useJinResearchStore((s) => s.researchPoints);
  const completed = useJinResearchStore((s) => s.completed);
  const projects = useJinResearchStore((s) => s.projects);
  const st = useJinResearchStore.getState();
  const tools = getEditorTools();
  const areaOptions = useAreaOptions();
  const projectOptions = projects.map((p) => ({ id: p.id, label: p.name }));

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
        <span className="font-semibold text-emerald-200">🔬 Research points</span>
        <input type="number" min={0} value={points} onChange={(e) => st.setPoints(parseInt(e.target.value, 10) || 0)} className="ml-auto w-20 rounded bg-slate-800 px-1.5 py-1 text-slate-100" />
      </div>

      <div className="flex items-center justify-between">
        <span className={lbl}>Projects ({projects.length})</span>
        <button onClick={() => st.addProject()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ project</button>
      </div>

      {projects.map((p) => (
        <div key={p.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <input value={p.name} onChange={(e) => st.updateProject(p.id, { name: e.target.value })} className={`flex-1 ${inp}`} />
            {completed.includes(p.id) && <span className="text-[10px] text-emerald-300">✓ done</span>}
            <button onClick={() => st.removeProject(p.id)} className="rounded px-1 text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <Field label="description"><input value={p.description} onChange={(e) => st.updateProject(p.id, { description: e.target.value })} className={inp} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="cost (points)"><input type="number" min={0} value={p.cost} onChange={(e) => st.updateProject(p.id, { cost: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
            <Field label="unlocks tool">
              <select value={p.unlocksToolId} onChange={(e) => st.updateProject(p.id, { unlocksToolId: e.target.value })} className={inp}>
                <option value="">(none)</option>
                {tools.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="category">
              <select value={p.category ?? 'tools'} onChange={(e) => st.updateProject(p.id, { category: e.target.value as typeof p.category })} className={inp}>
                {RESEARCH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="tier"><input type="number" min={1} max={5} value={p.tier ?? 1} onChange={(e) => st.updateProject(p.id, { tier: parseInt(e.target.value, 10) || 1 })} className={inp} /></Field>
            <Field label="unlocks ability">
              <select value={p.unlocksAbilityType ?? ''} onChange={(e) => st.updateProject(p.id, { unlocksAbilityType: e.target.value || undefined })} className={inp}>
                <option value="">(none)</option>{ABILITY_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="unlocks area">
              <select value={p.unlocksAreaId ?? ''} onChange={(e) => st.updateProject(p.id, { unlocksAreaId: e.target.value || undefined })} className={inp}>
                <option value="">(none)</option>{areaOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="reward description"><input value={p.rewardDescription ?? ''} onChange={(e) => st.updateProject(p.id, { rewardDescription: e.target.value })} className={inp} /></Field>
          <Check label="repeatable" checked={!!p.repeatable} onChange={(v) => st.updateProject(p.id, { repeatable: v })} />
          <Field label="prerequisite projects">
            <IdMultiPicker ids={p.prerequisiteProjectIds} onChange={(v) => st.updateProject(p.id, { prerequisiteProjectIds: v })} options={projectOptions.filter((o) => o.id !== p.id)} addLabel="+ prereq…" />
          </Field>
        </div>
      ))}
    </div>
  );
};
