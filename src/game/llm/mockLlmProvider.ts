import type { LlmProvider, LlmMessage, LlmChatOpts } from './llmProvider';

// Post-13 — a deterministic, OFFLINE mock LLM provider. Lets the enabled LLM path run with no server (dev +
// tests) and proves the generateJson → zod → apply pipeline end-to-end without a real model. It echoes a tiny,
// schema-shaped JSON derived from the prompt so missionText / dialogueText parse it successfully.

function lastUser(messages: LlmMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) if (messages[i].role === 'user') return messages[i].content;
  return messages[messages.length - 1]?.content ?? '';
}

// Pull "id "xxx"" tokens out of the mission-text prompt so we can echo valid objective ids back.
function extractIds(text: string): string[] {
  const ids: string[] = [];
  const re = /id "([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) ids.push(m[1]);
  return ids;
}

class MockLlmProvider implements LlmProvider {
  readonly id = 'mock';
  async chat(messages: LlmMessage[], opts: LlmChatOpts = {}): Promise<string> {
    const prompt = lastUser(messages);
    if (!opts.json) return 'ok';
    const ids = extractIds(prompt);
    if (ids.length > 0) {
      // Mission-text shape.
      return JSON.stringify({
        name: 'Sky Helper Run',
        summary: 'A breezy little job — lend a hand and head home safe.',
        objectives: ids.map((id) => ({ id, description: 'Give it a friendly hand.' })),
      });
    }
    // Single-line dialogue shape.
    return JSON.stringify({ text: 'Thanks for coming — you are a big help!' });
  }
}

export const mockLlmProvider: LlmProvider = new MockLlmProvider();
