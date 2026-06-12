import { useState } from 'react';
import { inp, lbl, Field } from '../editorShared';
import { MISSION_TYPES, type MissionType } from '../../../types/game/mission';
import { MISSION_TEMPLATES } from '../../../data/game/missionTemplates';
import { collectMissionPools } from '../../../game/missions/missionPools';
import { generateMissions, type GenerateResult } from '../../../game/missions/missionGenerator';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { enhanceMissionText } from '../../../game/llm/missionText';
import { useLlmConfigStore } from '../../../stores/llmConfigStore';

// 🎲 Mission Generator — the rule-based generator UI. A fixed seed + count + type filter deterministically
// produces validated, playable missions from the templates and the live pools (locations / NPCs / routes /
// characters / destination parts). Preview, then Add them into the editable Missions store (then tune in the
// 🎯 Missions / 🧪 Mission Studio tabs). They show up in Mission Control automatically.
export const MissionGeneratorTab = () => {
  const missionCount = useEditorMissionStore((s) => s.items.length);
  const [seed, setSeed] = useState('daily-001');
  const [count, setCount] = useState(4);
  const [types, setTypes] = useState<MissionType[]>([...MISSION_TYPES]);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [useLlm, setUseLlm] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const llmEnabled = useLlmConfigStore((s) => s.config.enabled);

  const toggleType = (t: MissionType) => setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const generate = async () => {
    const pools = collectMissionPools();
    const res = generateMissions({ seed, count, types: types.length ? types : undefined }, MISSION_TEMPLATES, pools);
    if (useLlm && llmEnabled && res.missions.length > 0) {
      setEnhancing(true);
      setResult(res); // show template text immediately, then re-skin
      try {
        const missions = await Promise.all(res.missions.map((m) => enhanceMissionText(m)));
        setResult({ ...res, missions });
      } finally {
        setEnhancing(false);
      }
    } else {
      setResult(res);
    }
  };

  const addAll = () => {
    if (!result) return;
    const store = useEditorMissionStore.getState();
    for (const m of result.missions) store.upsert(m);
  };

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="text-[11px] text-slate-400">
        Deterministic from the seed (same seed → same missions). Generated missions are validated against the live
        destination parts, then added to the editable Missions store.
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Seed"><input className={inp} value={seed} onChange={(e) => setSeed(e.target.value)} /></Field>
        <Field label="Count"><input type="number" min={1} max={20} className={inp} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></Field>
      </div>

      <div>
        <div className={lbl}>Types</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {MISSION_TYPES.map((t) => (
            <button key={t} onClick={() => toggleType(t)} className={`rounded-full border px-2 py-0.5 text-[11px] ${types.includes(t) ? 'border-sky-400 bg-sky-500/15 text-sky-100' : 'border-slate-600 text-slate-400'}`}>{t}</button>
          ))}
        </div>
      </div>

      <label className={`flex items-center gap-2 text-[11px] ${llmEnabled ? 'text-slate-200' : 'text-slate-500'}`}>
        <input type="checkbox" checked={useLlm && llmEnabled} disabled={!llmEnabled} onChange={(e) => setUseLlm(e.target.checked)} />
        ✨ LLM text — re-skin name / summary / objective wording (structure unchanged)
        {!llmEnabled && <span className="text-slate-600">· enable in 🤖 LLM</span>}
      </label>

      <div className="flex gap-2">
        <button onClick={generate} disabled={enhancing} className="rounded bg-sky-700 px-3 py-1 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-40">
          {enhancing ? '✨ Enhancing…' : '🎲 Generate'}
        </button>
        <button onClick={addAll} disabled={!result || result.missions.length === 0 || enhancing} className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40">
          ＋ Add {result?.missions.length ?? 0} to missions
        </button>
        <span className="ml-auto self-center text-[10px] text-slate-500">{missionCount} missions total</span>
      </div>

      {result && (
        <div className="flex flex-col gap-2">
          <div className={lbl}>Preview — {result.missions.length} valid · {result.rejected.length} rejected</div>
          <div className="flex max-h-[40vh] flex-col gap-1 overflow-auto">
            {result.missions.map((m) => (
              <div key={m.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{m.name}</span>
                  <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-300">{m.type} · {m.difficulty}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{m.summary}</div>
                <div className="mt-0.5 text-[10px] text-slate-500">{m.objectives.length} objective(s) · 🪙 {m.rewards?.find((r) => r.type === 'coins')?.amount ?? 0}</div>
              </div>
            ))}
            {result.rejected.map((r, i) => (
              <div key={`rej-${i}`} className="rounded border border-rose-800/50 bg-rose-950/30 p-1.5 text-[10px] text-rose-300">✗ {r.reason}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
