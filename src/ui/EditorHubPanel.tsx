import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../stores/uiStore';
import { EnvironmentEditorPanel } from './editor/EnvironmentEditorPanel';
import { NpcEditorTab } from './editor/NpcEditorTab';
import { QuestEditorTab } from './editor/QuestEditorTab';
import { TriggerEditorTab } from './editor/TriggerEditorTab';
import { ProjectTab } from './editor/ProjectTab';
import { DebugTab } from './editor/DebugTab';
import { EncounterEditorTab } from './editor/EncounterEditorTab';
import { ActivityEditorTab } from './editor/ActivityEditorTab';
import { PoliCharacterEditorTab } from './editor/PoliCharacterEditorTab';
import { LandmarkEditorTab } from './editor/LandmarkEditorTab';
import { IncidentEditorTab } from './editor/IncidentEditorTab';
import { TrafficEditorTab } from './editor/TrafficEditorTab';
import { ToolEditorTab } from './editor/ToolEditorTab';
import { WorldEditorTab } from './editor/WorldEditorTab';
import { LicenseEditorTab } from './editor/LicenseEditorTab';
import { ResearchEditorTab } from './editor/ResearchEditorTab';
import { SaveSlotsPanel } from './play/SaveSlotsPanel';
import { DomainFileRow } from './editor/DomainFileRow';
import { getDomain } from '../game/editor/editorContentRegistry';
import { useSceneEditStore } from '../stores/sceneEditStore';
import { useEditorPoliCharacterStore } from '../stores/editorPoliCharacterStore';

// Assets is a SEPARATE panel (left-centre) — not a hub tab — to match the original layout.
type Tab = 'debug' | 'trigger' | 'encounter' | 'project' | 'npc' | 'quest' | 'minigame' | 'environment' | 'poli' | 'landmark' | 'incident' | 'traffic' | 'tools' | 'world' | 'license' | 'research' | 'save';
const TABS: { id: Tab; label: string }[] = [
  { id: 'debug', label: '🧪 Debug' },
  { id: 'trigger', label: '⚡ Triggers' },
  { id: 'encounter', label: '⚔ Encounters' },
  { id: 'project', label: '📦 Project' },
  { id: 'npc', label: '🧑 NPC / Dialogue' },
  { id: 'quest', label: '📜 Quest / Item' },
  { id: 'minigame', label: '🎮 Mini-games' },
  { id: 'environment', label: '🌤 Environment' },
  { id: 'poli', label: '🤖 POLI' },
  { id: 'landmark', label: '🗺 Landmarks' },
  { id: 'incident', label: '🚨 Incidents' },
  { id: 'traffic', label: '🚦 Traffic' },
  { id: 'tools', label: '🛠 Tools' },
  { id: 'world', label: '🗺 World' },
  { id: 'license', label: '🎖 License' },
  { id: 'research', label: '🔬 Research' },
  { id: 'save', label: '💾 Save' },
];

// Which content domain(s) each tab can export/import as JSON (⬇ current · 📋 example · ⬆ replace). Tabs not
// listed (project/save) manage their own IO. Multiple ids = that tab edits more than one domain.
const TAB_DOMAINS: Partial<Record<Tab, string[]>> = {
  debug: ['progression', 'relationships', 'settings'],
  trigger: ['editorTrigger'],
  encounter: ['editorEncounter'],
  npc: ['editorNpc'],
  quest: ['editorQuest'],
  minigame: ['editorActivity'],
  environment: ['editorEnvironment', 'editorCollectible'],
  poli: ['editorPoliCharacter', 'editorBoost'],
  landmark: ['editorLandmark'],
  incident: ['editorIncident', 'editorRandomEvent'],
  traffic: ['editorTraffic'],
  tools: ['editorTool'],
  world: ['editorWorld', 'editorLayout'],
  license: ['editorLicense'],
  research: ['editorResearch'],
};

// Collapsible JSON import/export strip shown atop a content tab (per-domain rows). Lets the user download
// the current content / an annotated example, or upload a JSON to replace it (great for ChatGPT-authored data).
const TabJsonStrip = ({ tab }: { tab: Tab }) => {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ids = TAB_DOMAINS[tab];
  if (!ids || ids.length === 0) return null;
  const domains = ids.map(getDomain).filter((d): d is NonNullable<typeof d> => !!d);
  if (domains.length === 0) return null;
  return (
    <div className="mb-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left text-[11px] font-semibold text-sky-200">
        <span>{open ? '▾' : '▸'}</span> 🧩 JSON import / export
        <span className="ml-auto text-[10px] font-normal text-slate-500">⬇ current · 📋 example · ⬆ replace</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {domains.map((d) => <DomainFileRow key={d.id} domain={d} onMsg={setMsg} />)}
          <p className="text-[10px] leading-relaxed text-slate-500">📋 gives an example with a <code>_reference</code> list of valid ids (models/areas/tools…) so an external tool knows the schema. Upload a wrapped domain file or just the bare <code>data</code> object.</p>
          {msg && <p className="rounded bg-slate-800/60 px-2 py-1 text-[10px] text-slate-300">{msg}</p>}
        </div>
      )}
    </div>
  );
};

// Kit — the tabbed Editor Hub (opens centred, free-move via the header, free-resize via the CSS handle).
// Translucent so it doesn't block the scene. (The Assets palette is a separate left-centre panel.)
export const EditorHubPanel = () => {
  const close = useUiStore((s) => s.toggleEditorHub);
  const [userTab, setUserTab] = useState<Tab>('debug');
  // Snap to the POLI tab ONLY for the player handle (key '…#npc#poli') or a character picked in the
  // POLI panel — NOT for generic editor NPCs (those belong to the 🧑 NPC tab, which manages its own
  // selection). Clicking any other tab clears these so the snap never locks the hub on POLI.
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const poliSelectedId = useEditorPoliCharacterStore((s) => s.selectedId);
  const selectedIsPlayer = !!selectedKey && selectedKey.endsWith('#npc#poli');
  const tab: Tab = selectedIsPlayer || poliSelectedId ? 'poli' : userTab;
  const setTab = (t: Tab) => {
    setUserTab(t);
    if (t !== 'poli') {
      useEditorPoliCharacterStore.getState().selectPoli(null);
      const k = useSceneEditStore.getState().selectedKey;
      if (k && k.endsWith('#npc#poli')) useSceneEditStore.getState().clearSelection();
    }
  };
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1); // hub zoom (60%–200%)
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => { const d = dragRef.current; if (d) setPos({ x: e.clientX - d.ox, y: e.clientY - d.oy }); };
    const up = () => { dragRef.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);
  const onHeaderDown = (e: React.PointerEvent) => {
    const el = (e.currentTarget as HTMLElement).closest('[data-hub]') as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    dragRef.current = { ox: e.clientX - r.left, oy: e.clientY - r.top };
    if (!pos) setPos({ x: r.left, y: r.top });
  };

  return (
    <div
      data-hub
      style={{
        left: pos ? pos.x : '50%',
        top: pos ? pos.y : '50%',
        transform: pos ? `scale(${scale})` : `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: pos ? 'top left' : 'center',
      }}
      className="pointer-events-auto absolute z-[80] flex h-[80vh] max-h-[96vh] min-h-[18rem] w-[48rem] min-w-[22rem] max-w-[98vw] resize overflow-hidden rounded-2xl border border-violet-700/50 bg-slate-950/75 text-slate-100 shadow-2xl backdrop-blur-md"
    >
      <div className="flex w-44 shrink-0 flex-col border-r border-slate-800/60 bg-slate-900/40 p-2">
        <div className="mb-2 flex items-center justify-between gap-1">
          <span onPointerDown={onHeaderDown} className="cursor-move select-none px-1 pt-1 text-sm font-bold text-violet-100" title="Drag to move">⚙ Hub <span className="text-[9px] font-normal text-slate-500">⠿</span></span>
          <div className="flex items-center gap-0.5 text-slate-400">
            <button onClick={() => setScale((s) => Math.max(0.6, Math.round((s - 0.1) * 100) / 100))} title="Smaller" className="rounded px-1 text-sm hover:bg-slate-800">−</button>
            <span className="w-8 text-center text-[10px] text-slate-500">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2, Math.round((s + 0.1) * 100) / 100))} title="Bigger" className="rounded px-1 text-sm hover:bg-slate-800">+</button>
          </div>
        </div>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`mb-0.5 rounded-lg px-3 py-2 text-left text-xs font-semibold ${tab === t.id ? 'bg-violet-600/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>{t.label}</button>
        ))}
        <div className="mt-auto px-1 pt-2 text-[10px] leading-relaxed text-slate-600">Assets palette is at the left · Inspector top-left. Drop assets into src/assets/ or public/.</div>
      </div>
      <div className="relative min-w-0 flex-1 overflow-auto p-4 pr-10">
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 z-10 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">✕</button>
        <TabJsonStrip tab={tab} />
        {tab === 'debug' ? <DebugTab /> : tab === 'trigger' ? <TriggerEditorTab /> : tab === 'encounter' ? <EncounterEditorTab /> : tab === 'project' ? <ProjectTab /> : tab === 'npc' ? <NpcEditorTab /> : tab === 'quest' ? <QuestEditorTab /> : tab === 'minigame' ? <ActivityEditorTab /> : tab === 'poli' ? <PoliCharacterEditorTab /> : tab === 'landmark' ? <LandmarkEditorTab /> : tab === 'incident' ? <IncidentEditorTab /> : tab === 'traffic' ? <TrafficEditorTab /> : tab === 'tools' ? <ToolEditorTab /> : tab === 'world' ? <WorldEditorTab /> : tab === 'license' ? <LicenseEditorTab /> : tab === 'research' ? <ResearchEditorTab /> : tab === 'save' ? <SaveSlotsPanel /> : <EnvironmentEditorPanel />}
      </div>
    </div>
  );
};
