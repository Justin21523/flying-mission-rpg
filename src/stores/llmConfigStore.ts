import { create } from 'zustand';

// Local-LLM config (Batch 11). The ONLY provider is local llama.cpp serving Qwen2.5-14B-Instruct via its
// OpenAI-compatible HTTP server. The LLM generates flavour TEXT only (validated by zod, template fallback) and
// never controls game rules. Persisted to localStorage; `lastTest` is transient (the 🤖 LLM tab's status).
export interface LlmConfig {
  enabled: boolean;
  endpoint: string; // llama.cpp server base, e.g. http://localhost:8080
  model: string; // sent as the OpenAI `model` field (llama.cpp serves the loaded GGUF regardless)
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  enabled: false, // off by default → game is fully playable on templates with no server running
  endpoint: 'http://localhost:8080',
  model: 'qwen2.5-14b-instruct',
  temperature: 0.7,
  maxTokens: 400,
  timeoutMs: 12000,
};

export interface LlmTestResult { ok: boolean; message: string; ms?: number }

interface LlmConfigState {
  config: LlmConfig;
  lastTest: LlmTestResult | null;
  testing: boolean;
  update: (patch: Partial<LlmConfig>) => void;
  setLastTest: (r: LlmTestResult | null) => void;
  setTesting: (t: boolean) => void;
  importState: (data: { config?: Partial<LlmConfig> }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'aero-rescue-llm-v1';
function persist(config: LlmConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}
function load(): LlmConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LLM_CONFIG };
    const p = JSON.parse(raw);
    return { ...DEFAULT_LLM_CONFIG, ...(p && typeof p === 'object' ? p : {}) };
  } catch { return { ...DEFAULT_LLM_CONFIG }; }
}

export const useLlmConfigStore = create<LlmConfigState>((set, get) => ({
  config: load(),
  lastTest: null,
  testing: false,
  update: (patch) => { const config = { ...get().config, ...patch }; set({ config }); persist(config); },
  setLastTest: (lastTest) => set({ lastTest }),
  setTesting: (testing) => set({ testing }),
  importState: (data) => { const config = { ...DEFAULT_LLM_CONFIG, ...(data.config ?? {}) }; set({ config }); persist(config); },
  reset: () => { set({ config: { ...DEFAULT_LLM_CONFIG }, lastTest: null }); persist({ ...DEFAULT_LLM_CONFIG }); },
}));

export function getLlmConfig(): LlmConfig { return useLlmConfigStore.getState().config; }
