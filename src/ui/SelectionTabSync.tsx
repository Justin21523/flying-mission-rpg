import { useEffect, useRef } from 'react';
import { useSceneEditStore } from '../stores/sceneEditStore';
import { useWorldSelectStore } from '../stores/worldSelectStore';
import { useUiStore } from '../stores/uiStore';
import { tabForObjectKey } from '../game/editor/tabForObjectKey';

// Edit-Mode helper: when a 3D object is selected (kit sceneEditStore OR a path node via worldSelectStore),
// open the Editor Hub on that object's tab. Fires only when the selected KEY changes (ref-guarded), so it
// never fights the user's manual tab navigation. Renders nothing.
export const SelectionTabSync = () => {
  const sceneKey = useSceneEditStore((s) => s.selectedKey);
  const nodeKey = useWorldSelectStore((s) => s.selectedKey);
  const last = useRef<string | null>(null);

  useEffect(() => {
    const key = sceneKey ?? nodeKey;
    if (!key || key === last.current) { last.current = key; return; }
    last.current = key;
    if (key.endsWith('#npc#poli')) return; // the player handle has its own POLI snap
    const tab = tabForObjectKey(key);
    if (!tab) return;
    useUiStore.getState().setEditorHubTab(tab);
    if (!useUiStore.getState().editorHubOpen) useUiStore.setState({ editorHubOpen: true });
  }, [sceneKey, nodeKey]);

  return null;
};
