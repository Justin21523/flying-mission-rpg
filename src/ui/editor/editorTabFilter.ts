// Pure Editor-Hub tab search (used by EditorHubPanel's search box). Case-insensitive match on label OR
// category, across ALL categories; legacy tabs are excluded unless showLegacy. Empty/whitespace query → [].
export interface FilterableTab {
  label: string;
  category: string;
  legacy?: boolean;
}

export function filterEditorTabs<T extends FilterableTab>(tabs: readonly T[], query: string, showLegacy: boolean): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return tabs.filter((t) => {
    if (t.legacy && !showLegacy) return false;
    return t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });
}
