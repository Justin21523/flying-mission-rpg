import type { ZodType } from 'zod';
import { getLlmConfig } from '../../stores/llmConfigStore';
import { getActiveProvider, type LlmMessage } from './llmProvider';

// Constrained-generation core: ask the LLM for JSON, validate with zod, and on ANY problem (disabled, offline,
// timeout, bad JSON, schema mismatch) fall back to the template value. Never throws, never blocks the game.
export interface GenerateResult<T> { value: T; source: 'llm' | 'fallback' }

// Pull a JSON object out of an LLM reply (handles ```json fences / surrounding prose).
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object in reply');
  return JSON.parse(body.slice(start, end + 1));
}

export async function generateJson<T>(
  messages: LlmMessage[],
  schema: ZodType<T>,
  fallback: () => T,
  opts?: { temperature?: number; maxTokens?: number },
): Promise<GenerateResult<T>> {
  if (!getLlmConfig().enabled) return { value: fallback(), source: 'fallback' };
  try {
    const raw = await getActiveProvider().chat(messages, { json: true, temperature: opts?.temperature, maxTokens: opts?.maxTokens });
    return { value: schema.parse(extractJson(raw)), source: 'llm' };
  } catch {
    return { value: fallback(), source: 'fallback' };
  }
}
