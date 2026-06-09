import { useState } from 'react';
import { useToolStore } from '../stores/toolStore';
import { useRescueOperationStore } from '../stores/rescueOperationStore';
import { getEditorTool } from '../stores/editorToolStore';
import type { ToolCategory, ToolId } from '../types/tool';

// Shows 3 equipped tool slots in the top-right corner (below WorldClockHUD).
// Clicking a filled slot unequips; clicking an empty slot opens the tool picker.

const MAX_SLOTS = 3;
// Category colour coding (surfaced in the loadout so the tool's category is meaningful at a glance).
const CATEGORY_COLOR: Record<ToolCategory, string> = {
  water: '#38bdf8', rescue: '#f97316', signal: '#a855f7', medical: '#ef4444', utility: '#94a3b8',
};
const catColor = (c?: ToolCategory) => CATEGORY_COLOR[c ?? 'utility'];

function ToolSlot({ slotIndex }: { slotIndex: number }) {
  const equipped = useToolStore((s) => s.equippedTools);
  const unequipTool = useToolStore((s) => s.unequipTool);
  const isRescueActive = useRescueOperationStore((s) => s.isActive);
  const incidentId = useRescueOperationStore((s) => s.incidentId);

  const toolId = equipped[slotIndex] as ToolId | undefined;
  const def = toolId ? getEditorTool(toolId) : undefined;

  // Highlight if this tool has a bonus for the current active incident.
  const isRelevant =
    def?.incidentBonus && isRescueActive && incidentId === def.incidentBonus.incidentId;

  if (!def) {
    return (
      <div
        className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 border-dashed"
        style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#6b7280' }}
      >
        <span className="text-xl">+</span>
        <span className="text-[9px]">empty</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => unequipTool(toolId!)}
      title={`${def.name} · ${def.category ?? 'utility'}\n${def.description}\nClick to unequip`}
      className="relative flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 transition-all"
      style={{
        borderColor: isRelevant ? '#f97316' : 'rgba(255,255,255,0.2)',
        background: isRelevant ? 'rgba(249,115,22,0.25)' : 'rgba(0,0,0,0.45)',
        boxShadow: isRelevant ? '0 0 8px rgba(249,115,22,0.6)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span className="text-2xl leading-none">{def.icon}</span>
      <span className="mt-0.5 max-w-[52px] truncate text-center text-[9px] font-semibold text-white leading-tight">
        {def.name}
      </span>
      {/* category colour bar */}
      <span className="absolute inset-x-1 bottom-0.5 h-1 rounded-full" style={{ background: catColor(def.category) }} title={def.category ?? 'utility'} />
    </button>
  );
}

function ToolPicker({ onClose }: { onClose: () => void }) {
  const unlockedTools = useToolStore((s) => s.unlockedTools);
  const equippedTools = useToolStore((s) => s.equippedTools);
  const equipTool = useToolStore((s) => s.equipTool);

  return (
    <div
      className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-slate-700 p-3 shadow-2xl"
      style={{ background: 'rgba(15,15,25,0.97)', zIndex: 210 }}
    >
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Select Tool</div>
      {unlockedTools.length === 0 && (
        <div className="text-xs text-slate-500">No tools unlocked yet.<br />Talk to Jin to unlock tools.</div>
      )}
      {unlockedTools.map((id) => {
        const def = getEditorTool(id);
        if (!def) return null;
        const isEquipped = equippedTools.includes(id);
        const isFull = equippedTools.length >= 3 && !isEquipped;
        return (
          <button
            key={id}
            disabled={isFull && !isEquipped}
            onClick={() => { if (!isEquipped) { equipTool(id); onClose(); } }}
            className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-800 disabled:opacity-40"
            style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}
          >
            <span className="text-base">{def.icon}</span>
            <div>
              <div className="flex items-center gap-1 font-semibold text-white">
                <span className="h-2 w-2 rounded-full" style={{ background: catColor(def.category) }} title={def.category ?? 'utility'} />
                {def.name}
              </div>
              <div className="text-slate-400 text-[10px] leading-tight truncate max-w-[150px]">{def.description}</div>
            </div>
            {isEquipped && <span className="ml-auto text-green-400 text-[10px]">✓</span>}
          </button>
        );
      })}
      <button onClick={onClose} className="mt-2 w-full rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-800">
        Close
      </button>
    </div>
  );
}

export const ToolBeltHud = () => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const equippedCount = useToolStore((s) => s.equippedTools.length);

  return (
    <div
      className="pointer-events-auto fixed right-4 top-20 flex flex-col items-end gap-1 select-none"
      style={{ zIndex: 200 }}
    >
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 pr-1">
        🛠 Tool Belt
      </div>
      <div className="relative flex gap-1.5">
        {Array.from({ length: MAX_SLOTS }, (_, i) => (
          <ToolSlot key={i} slotIndex={i} />
        ))}
        {equippedCount < MAX_SLOTS && (
          <button
            onClick={() => setPickerOpen((p) => !p)}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white text-xs"
            title="Add tool"
          >
            ⋮
          </button>
        )}
        {pickerOpen && <ToolPicker onClose={() => setPickerOpen(false)} />}
      </div>
    </div>
  );
};
