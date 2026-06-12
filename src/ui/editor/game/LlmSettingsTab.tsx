import { inp, lbl, Field, Check } from '../editorShared';
import { useLlmConfigStore } from '../../../stores/llmConfigStore';
import { pingLlm } from '../../../game/llm/llmProvider';

// 🤖 LLM — configure the LOCAL llama.cpp server (Qwen2.5-14B-Instruct). The LLM only generates flavour TEXT
// (mission name/summary/objective lines, dialogue), validated by zod, and never controls game rules. Offline /
// disabled → everything falls back to templates, so the game is always playable.
export const LlmSettingsTab = () => {
  const config = useLlmConfigStore((s) => s.config);
  const lastTest = useLlmConfigStore((s) => s.lastTest);
  const testing = useLlmConfigStore((s) => s.testing);
  const update = useLlmConfigStore((s) => s.update);

  const test = async () => {
    const store = useLlmConfigStore.getState();
    store.setTesting(true);
    store.setLastTest(null);
    const r = await pingLlm();
    store.setLastTest(r);
    store.setTesting(false);
  };

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="rounded border border-sky-900/50 bg-sky-950/30 p-2 text-[11px] text-slate-300">
        Local <span className="font-semibold text-sky-200">llama.cpp</span> + <span className="font-semibold text-sky-200">Qwen2.5-14B-Instruct</span>.
        Generates flavour text only (mission / dialogue) — <span className="text-amber-200">never game rules</span>; validated by zod, with template fallback when offline.
      </div>

      <Check label="Enable LLM text" checked={config.enabled} onChange={(v) => update({ enabled: v })} />

      <div className="grid grid-cols-2 gap-2">
        <Field label="Provider">
          <select className={inp} value={config.providerId} onChange={(e) => update({ providerId: e.target.value as typeof config.providerId })}>
            <option value="llamacpp">llama.cpp (local server)</option>
            <option value="mock">mock (offline, dev/test)</option>
          </select>
        </Field>
        <Field label="Endpoint"><input className={inp} value={config.endpoint} onChange={(e) => update({ endpoint: e.target.value })} /></Field>
        <Field label="Model"><input className={inp} value={config.model} onChange={(e) => update({ model: e.target.value })} /></Field>
        <Field label="Temperature"><input type="number" step={0.1} min={0} max={2} className={inp} value={config.temperature} onChange={(e) => update({ temperature: Number(e.target.value) || 0 })} /></Field>
        <Field label="Max tokens"><input type="number" step={50} min={32} className={inp} value={config.maxTokens} onChange={(e) => update({ maxTokens: Math.max(32, Number(e.target.value) || 0) })} /></Field>
        <Field label="Timeout (ms)"><input type="number" step={500} min={1000} className={inp} value={config.timeoutMs} onChange={(e) => update({ timeoutMs: Math.max(1000, Number(e.target.value) || 0) })} /></Field>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={test} disabled={testing} className="rounded bg-sky-700 px-3 py-1 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-40">
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {lastTest && (
          <span className={`text-[11px] ${lastTest.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
            {lastTest.ok ? `✓ OK${lastTest.ms != null ? ` (${lastTest.ms}ms)` : ''} · “${lastTest.message}”` : `✗ ${lastTest.message}`}
          </span>
        )}
      </div>
      <div className={`${lbl} text-slate-500`}>Start: llama-server -m qwen2.5-14b-instruct.gguf --port 8080 (or set the endpoint above).</div>
    </div>
  );
};
