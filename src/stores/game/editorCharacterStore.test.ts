import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorCharacterStore, getEditorCharacter } from './editorCharacterStore';
import { SEED_CHARACTERS } from '../../data/game/characters';

describe('editorCharacterStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorCharacterStore.getState().reset();
  });

  it('merges seed characters idempotently', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    expect(useEditorCharacterStore.getState().items.length).toBe(SEED_CHARACTERS.length);
    // Running again must not duplicate.
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    expect(useEditorCharacterStore.getState().items.length).toBe(SEED_CHARACTERS.length);
    expect(getEditorCharacter('char_jett')?.codename).toBe('Jett');
  });

  it('does not clobber a user edit on re-merge', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    useEditorCharacterStore.getState().update('char_jett', { name: 'My Jett' });
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    expect(getEditorCharacter('char_jett')?.name).toBe('My Jett');
  });

  it('duplicates with a fresh id', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    const count = useEditorCharacterStore.getState().items.length;
    const id = useEditorCharacterStore.getState().duplicate('char_jett');
    expect(id).toBeTruthy();
    expect(id).not.toBe('char_jett');
    expect(useEditorCharacterStore.getState().items.length).toBe(count + 1);
  });
});
