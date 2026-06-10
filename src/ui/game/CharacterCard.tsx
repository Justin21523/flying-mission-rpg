import type { CharacterDefinition } from '../../types/game/character';
import { cardImageUrl } from './cardImages';
import { playUiSound } from '../../game/audio/uiSound';

// One character card — shows the FULL card art (object-contain, portrait) so nothing is cropped, plus a
// compact name/role footer. Stats live in the detail panel. Falls back to a colour block if art is absent.
export const CharacterCard = ({
  character,
  selected,
  recommended,
  onClick,
}: {
  character: CharacterDefinition;
  selected: boolean;
  recommended: boolean;
  onClick: () => void;
}) => {
  const img = cardImageUrl(character.cardImage);
  return (
    <button
      onMouseEnter={() => playUiSound('hover')}
      onClick={() => {
        playUiSound('select');
        onClick();
      }}
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl border bg-slate-900/70 text-left transition ${
        selected ? 'border-sky-400 ring-2 ring-sky-400/60' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {recommended && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-900">
          Recommended
        </span>
      )}
      {/* Portrait card art shown in full (object-contain) on a dark mat. */}
      <div className="flex aspect-[2/3] w-full items-center justify-center bg-slate-950/60 p-1" style={img ? undefined : { background: character.color }}>
        {img ? (
          <img src={img} alt={character.codename} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-2xl font-black text-white/85">{character.codename}</div>
        )}
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/50" style={{ background: character.color }} />
        <span className="truncate text-sm font-black text-slate-100">{character.name}</span>
        <span className="ml-auto truncate text-[10px] text-slate-400">{character.role}</span>
      </div>
    </button>
  );
};
