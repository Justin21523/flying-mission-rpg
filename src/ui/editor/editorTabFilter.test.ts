import { describe, it, expect } from 'vitest';
import { filterEditorTabs } from './editorTabFilter';

const TABS = [
  { id: 'gcam', label: '🎥 Camera', category: 'Aero' },
  { id: 'gflight', label: '✈ Flight', category: 'Aero' },
  { id: 'npc', label: '🧑 Dialogue NPCs', category: 'Logic' },
  { id: 'poli', label: '🤖 POLI Characters', category: 'Legacy', legacy: true },
];

describe('filterEditorTabs', () => {
  it('empty / whitespace query → []', () => {
    expect(filterEditorTabs(TABS, '', true)).toEqual([]);
    expect(filterEditorTabs(TABS, '   ', true)).toEqual([]);
  });
  it('matches by label substring (case-insensitive)', () => {
    expect(filterEditorTabs(TABS, 'cam', false).map((t) => t.id)).toEqual(['gcam']);
    expect(filterEditorTabs(TABS, 'DIALOGUE', false).map((t) => t.id)).toEqual(['npc']);
  });
  it('matches by category', () => {
    expect(filterEditorTabs(TABS, 'aero', false).map((t) => t.id)).toEqual(['gcam', 'gflight']);
  });
  it('hides legacy unless showLegacy', () => {
    expect(filterEditorTabs(TABS, 'poli', false)).toEqual([]);
    expect(filterEditorTabs(TABS, 'poli', true).map((t) => t.id)).toEqual(['poli']);
  });
});
