import { describe, it, expect, beforeEach } from 'vitest';
import { useDevStore } from './devStore';

describe('devStore', () => {
  beforeEach(() => useDevStore.setState({ sceneMode: 'greybox' }));

  it('defaults to the grey-box base scene', () => {
    expect(useDevStore.getState().sceneMode).toBe('greybox');
  });

  it('switches scene mode via the action', () => {
    useDevStore.getState().setSceneMode('world');
    expect(useDevStore.getState().sceneMode).toBe('world');
  });
});
