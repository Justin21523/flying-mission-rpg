import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { extractJson, generateJson } from './generateJson';

describe('extractJson', () => {
  it('parses a plain JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('parses a fenced JSON object with surrounding prose', () => {
    expect(extractJson('Here you go:\n```json\n{"a":2,"b":"x"}\n```\nthanks')).toEqual({ a: 2, b: 'x' });
  });
  it('throws when there is no JSON object', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

describe('generateJson', () => {
  it('falls back when the LLM is disabled (default) — never throws, never hits the network', async () => {
    const schema = z.object({ name: z.string() });
    const res = await generateJson([{ role: 'user', content: 'hi' }], schema, () => ({ name: 'fallback' }));
    expect(res.source).toBe('fallback');
    expect(res.value).toEqual({ name: 'fallback' });
  });
});
