import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getSupportProfileForCharacter } from '../../stores/game/editorSupportStore';
import { requestSupport } from '../../game/support/SupportDispatchDirector';
import { switchControlToCharacter } from '../../game/characters/control/ControlOwnershipService';
import type { SupportDispatchEntry, CharacterPresence } from '../../types/game/support';

export const SupportCharacterCard = ({
  characterId,
  dispatch,
  presence,
}: {
  characterId: string;
  dispatch?: SupportDispatchEntry;
  presence?: CharacterPresence;
}) => {
  const character = getEditorCharacter(characterId);
  const profile = getSupportProfileForCharacter(characterId);
  const status = presence ? presence.tier : dispatch?.status ?? (profile?.canBeDispatched ? 'available' : 'unavailable');
  const eta = dispatch ? `${Math.ceil(dispatch.etaSeconds)}s` : '-';
  const unavailable = !profile?.canBeDispatched || !!dispatch || !!presence;
  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/80 p-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-slate-100">{character?.name ?? characterId}</div>
          <div className="text-[10px] text-slate-400">{character?.role ?? 'Support character'}</div>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-sky-200">{status}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {profile?.abilities.map((a) => <span key={a} className="rounded bg-sky-900/40 px-1.5 py-0.5 text-[10px] text-sky-100">{a}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-slate-400">
        <span>ETA: {eta}</span>
        <span>Mode: {profile?.defaultDispatchMode ?? '-'}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button disabled={unavailable} onClick={() => requestSupport(characterId, 'quick-simulated')} className="rounded bg-emerald-700/35 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-700/55 disabled:opacity-40">
          Quick Dispatch
        </button>
        <button
          disabled={unavailable}
          onClick={() => {
            const result = requestSupport(characterId, 'full-control');
            if (result.ok) switchControlToCharacter(characterId);
          }}
          className="rounded bg-sky-700/35 px-2 py-1 text-[10px] text-sky-100 hover:bg-sky-700/55 disabled:opacity-40"
        >
          Full Control Shell
        </button>
        <button disabled={!presence} onClick={() => switchControlToCharacter(characterId)} className="rounded bg-violet-700/35 px-2 py-1 text-[10px] text-violet-100 hover:bg-violet-700/55 disabled:opacity-40">
          Switch
        </button>
      </div>
    </div>
  );
};
