import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { switchControlToCharacter } from '../../game/characters/control/ControlOwnershipService';
import type { CompanionAiState } from '../../types/game/support';

// Friendly label for what an AI companion is doing right now.
const ACTIVITY: Partial<Record<CompanionAiState, string>> = {
  'assist-objective': '🔧 working',
  'move-to-point': '→ to task',
  'follow-player': 'following',
  standby: 'standby',
  idle: 'idle',
};

export const MultiCharacterHud = () => {
  const ownership = useSupportRuntimeStore((s) => s.ownership);
  const presences = useSupportRuntimeStore((s) => s.presences);
  const lastAssistText = useSupportRuntimeStore((s) => s.lastAssistText);
  if (presences.length === 0 && !ownership.controlledCharacterId) return null;
  return (
    <div className="pointer-events-auto fixed left-3 bottom-24 z-[60] w-72 rounded-xl border border-violet-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-bold text-violet-200">Team</span>
        <span className="font-mono text-[10px] text-slate-400">Input: {ownership.inputOwnerId ?? '-'}</span>
      </div>
      {ownership.controlledCharacterId && (
        <div className="mb-1 text-emerald-200">Controlled: {getEditorCharacter(ownership.controlledCharacterId)?.name ?? ownership.controlledCharacterId}</div>
      )}
      <div className="space-y-1">
        {presences.map((p) => (
          <button key={p.characterId} onClick={() => switchControlToCharacter(p.characterId)} className="flex w-full justify-between gap-2 rounded bg-slate-900/70 px-2 py-1 text-left hover:bg-slate-800">
            <span className="truncate">{getEditorCharacter(p.characterId)?.name ?? p.characterId}</span>
            <span className="font-mono text-[10px] text-sky-200">{p.tier} · {ACTIVITY[p.aiState] ?? p.aiState}</span>
          </button>
        ))}
      </div>
      {lastAssistText && <div className="mt-1 rounded bg-sky-900/40 px-2 py-1 text-[10px] text-sky-100">{lastAssistText}</div>}
      <div className="mt-1 text-[10px] text-slate-500">Tab: support · V: switch control · click a teammate to take over.</div>
    </div>
  );
};
