import { z } from 'zod';
import { generateJson } from './generateJson';
import type { LlmMessage } from './llmProvider';

// LLM-generated single dialogue LINE (flavour only — the dialogue tree's structure/effects/conditions are
// authored, never produced by the LLM). zod-validated; falls back to the existing line when offline/disabled.
const LineSchema = z.object({ text: z.string().min(1).max(220) });

export async function generateNpcLine(speaker: string, intent: string, fallbackText: string): Promise<string> {
  const messages: LlmMessage[] = [
    {
      role: 'system',
      content:
        'You write ONE short, warm, child-friendly, NON-COMBAT line of NPC dialogue for a kids rescue game about ' +
        'friendly flying robots. One or two sentences, English, no scary themes. Return ONLY JSON: {"text": string}.',
    },
    { role: 'user', content: `Speaker: ${speaker || 'Resident'}\nWhat they should convey: ${intent || fallbackText}\nWrite their line.` },
  ];
  const { value } = await generateJson(messages, LineSchema, () => ({ text: fallbackText }), { maxTokens: 120 });
  return value.text.trim() || fallbackText;
}
