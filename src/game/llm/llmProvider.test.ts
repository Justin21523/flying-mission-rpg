import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockLlmProvider } from './mockLlmProvider';
import { getActiveProvider, llamaCppProvider } from './llmProvider';
import { generateJson } from './generateJson';
import { useLlmConfigStore } from '../../stores/llmConfigStore';
import { z } from 'zod';

beforeEach(() => useLlmConfigStore.getState().reset());

describe('mockLlmProvider', () => {
  it('returns mission-text-shaped JSON echoing the given objective ids', async () => {
    const out = await mockLlmProvider.chat([{ role: 'user', content: 'Objectives:\n- id "o1" (carry)\n- id "o2" (find)' }], { json: true });
    const parsed = JSON.parse(out) as { name: string; objectives: { id: string }[] };
    expect(parsed.name).toBeTruthy();
    expect(parsed.objectives.map((o) => o.id)).toEqual(['o1', 'o2']);
  });
  it('returns a single-line dialogue shape when no ids are present', async () => {
    const out = await mockLlmProvider.chat([{ role: 'user', content: 'Write their line.' }], { json: true });
    expect((JSON.parse(out) as { text: string }).text).toBeTruthy();
  });
});

describe('getActiveProvider', () => {
  it('switches on providerId', () => {
    useLlmConfigStore.getState().update({ providerId: 'mock' });
    expect(getActiveProvider()).toBe(mockLlmProvider);
    useLlmConfigStore.getState().update({ providerId: 'llamacpp' });
    expect(getActiveProvider()).toBe(llamaCppProvider);
  });
});

describe('generateJson with the mock provider (enabled, offline)', () => {
  it('parses real JSON through the enabled path', async () => {
    useLlmConfigStore.getState().update({ enabled: true, providerId: 'mock' });
    const schema = z.object({ text: z.string() });
    const res = await generateJson([{ role: 'user', content: 'hi' }], schema, () => ({ text: 'fallback' }));
    expect(res.source).toBe('llm');
    expect(res.value.text).toBeTruthy();
  });
});

describe('LlamaCppProvider.chat (fetch-mocked)', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('posts to the OpenAI-compatible endpoint and returns the message content', async () => {
    const fetchMock = vi.fn((url: string) => {
      void url;
      return Promise.resolve({ ok: true, json: async () => ({ choices: [{ message: { content: 'hello' } }] }) } as unknown as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
    const out = await llamaCppProvider.chat([{ role: 'user', content: 'hi' }], { json: true });
    expect(out).toBe('hello');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toContain('/v1/chat/completions');
  });
  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response));
    await expect(llamaCppProvider.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow();
  });
});
