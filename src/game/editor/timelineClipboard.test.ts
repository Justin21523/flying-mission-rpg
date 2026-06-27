import { describe, expect, it, beforeEach } from 'vitest';
import { copyFragment, canPaste, takeFragmentPayload, peekFragment, clearClipboard } from './timelineClipboard';

describe('timelineClipboard', () => {
  beforeEach(() => clearClipboard());

  it('gates paste by kind', () => {
    expect(canPaste('transformation.effect')).toBe(false);
    copyFragment('transformation.effect', { effectId: 'a', x: 1 });
    expect(canPaste('transformation.effect')).toBe(true);
    expect(canPaste('flight.event')).toBe(false);
    expect(takeFragmentPayload('flight.event')).toBeNull();
  });

  it('returns an independent clone on copy and on take', () => {
    const src = { effectId: 'a', nested: { n: 1 } };
    copyFragment('transformation.effect', src);
    src.nested.n = 999; // mutate after copy — clipboard must be unaffected

    const out = takeFragmentPayload<typeof src>('transformation.effect')!;
    expect(out.nested.n).toBe(1);

    out.nested.n = 5; // mutate the taken copy — clipboard must be unaffected
    expect((peekFragment()!.payload as typeof src).nested.n).toBe(1);
  });
});
