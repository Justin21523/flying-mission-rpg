import { getLlmConfig } from '../../stores/llmConfigStore';

// Provider abstraction (Batch 11). The ONLY shipped provider is local llama.cpp serving Qwen2.5-14B-Instruct via
// its OpenAI-compatible HTTP server; the interface keeps it swappable. Used only to generate flavour TEXT.
export interface LlmMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface LlmChatOpts { temperature?: number; maxTokens?: number; json?: boolean; signal?: AbortSignal }
export interface LlmProvider { readonly id: string; chat(messages: LlmMessage[], opts?: LlmChatOpts): Promise<string> }

interface ChatResponse { choices?: { message?: { content?: string } }[] }

class LlamaCppProvider implements LlmProvider {
  readonly id = 'llama.cpp';
  async chat(messages: LlmMessage[], opts: LlmChatOpts = {}): Promise<string> {
    const cfg = getLlmConfig();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
    try {
      const res = await fetch(`${cfg.endpoint.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: opts.signal ?? ctrl.signal,
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: opts.temperature ?? cfg.temperature,
          max_tokens: opts.maxTokens ?? cfg.maxTokens,
          stream: false,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      if (!res.ok) throw new Error(`llama.cpp HTTP ${res.status}`);
      const data = (await res.json()) as ChatResponse;
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('llama.cpp: no message content');
      return content;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const llamaCppProvider: LlmProvider = new LlamaCppProvider();
export function getActiveProvider(): LlmProvider { return llamaCppProvider; }

// Quick connectivity check for the 🤖 LLM tab's "Test connection" button.
export async function pingLlm(): Promise<{ ok: boolean; message: string; ms?: number }> {
  const start = performance.now();
  try {
    const text = await getActiveProvider().chat([{ role: 'user', content: 'Reply with the single word: ok' }], { maxTokens: 8, temperature: 0 });
    return { ok: true, message: text.trim().slice(0, 80) || 'ok', ms: Math.round(performance.now() - start) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'failed' };
  }
}
