import { describe, it, expect, beforeEach } from 'vitest';
import { useWorldSelectStore } from './worldSelectStore';

const reset = () => useWorldSelectStore.setState({ selectedKey: null, extraKeys: [], onDelete: null, deleteHandlers: {} });

describe('worldSelectStore multi-select', () => {
  beforeEach(reset);

  it('select sets the primary and clears extras', () => {
    useWorldSelectStore.getState().toggle('a');
    useWorldSelectStore.getState().toggle('b');
    useWorldSelectStore.getState().select('c');
    const s = useWorldSelectStore.getState();
    expect(s.selectedKey).toBe('c');
    expect(s.extraKeys).toEqual([]);
  });

  it('toggle becomes primary when nothing is selected', () => {
    useWorldSelectStore.getState().toggle('a');
    expect(useWorldSelectStore.getState().selectedKey).toBe('a');
    expect(useWorldSelectStore.getState().extraKeys).toEqual([]);
  });

  it('toggle adds extras and removes them', () => {
    const t = useWorldSelectStore.getState().toggle;
    t('a'); t('b'); t('c');
    expect(useWorldSelectStore.getState().extraKeys).toEqual(['b', 'c']);
    t('b');
    expect(useWorldSelectStore.getState().extraKeys).toEqual(['c']);
  });

  it('toggling the primary promotes the first extra', () => {
    const t = useWorldSelectStore.getState().toggle;
    t('a'); t('b'); t('c');
    t('a'); // drop primary 'a'
    const s = useWorldSelectStore.getState();
    expect(s.selectedKey).toBe('b');
    expect(s.extraKeys).toEqual(['c']);
  });

  it('isSelected covers primary and extras', () => {
    const t = useWorldSelectStore.getState().toggle;
    t('a'); t('b');
    const s = useWorldSelectStore.getState();
    expect(s.isSelected('a')).toBe(true);
    expect(s.isSelected('b')).toBe(true);
    expect(s.isSelected('z')).toBe(false);
  });

  it('deleteSelected deletes primary and extras through their handlers', () => {
    const deleted: string[] = [];
    const s = useWorldSelectStore.getState();
    s.select('a', () => deleted.push('a'));
    s.toggle('b', () => deleted.push('b'));
    expect(useWorldSelectStore.getState().deleteSelected()).toBe(true);
    expect(deleted).toEqual(['a', 'b']);
    expect(useWorldSelectStore.getState().selectedKey).toBeNull();
    expect(useWorldSelectStore.getState().extraKeys).toEqual([]);
  });
});
