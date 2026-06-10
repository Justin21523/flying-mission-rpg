import { ScreenFrame, Btn, panel } from './screenChrome';
import { CharacterPreview3D } from './CharacterPreview3D';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';

// HANGAR — placeholder until Batch 3 builds the real 3D hangar / ground movement / lift platform.
// Confirms the dispatch picks; the dev "return" uses a jump (HANGAR→MISSION_CONTROL isn't a normal move).
export const HangarPlaceholderScreen = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const missionId = useMissionStore((s) => s.currentMissionId);
  const jumpTo = useGameStore((s) => s.jumpTo);
  const ch = charId ? getEditorCharacter(charId) : undefined;
  const m = missionId ? getEditorMission(missionId) : undefined;

  return (
    <ScreenFrame title="Hangar" subtitle="3D hangar arrives in Batch 3">
      <div className={`mx-auto max-w-lg ${panel} p-6 text-center`}>
        {ch ? (
          <div className="mx-auto h-56 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60">
            <CharacterPreview3D color={ch.color} form="robot" modelAssetId={ch.modelAssetId} />
          </div>
        ) : (
          <div className="text-5xl">🛬</div>
        )}
        <h2 className="mt-3 text-lg font-bold text-slate-100">Entered the hangar</h2>
        <p className="mt-2 text-sm text-slate-300">
          Mission: {m?.name ?? '—'}
          <br />
          Character: {ch?.name ?? '—'}
        </p>
        <p className="mt-3 text-xs text-slate-500">Next: ground movement → lift platform → launch (Batch 3-4).</p>
        <div className="mt-5">
          <Btn tone="ghost" sound="back" onClick={() => jumpTo('MISSION_CONTROL')}>
            ↩ Back to Mission Control (dev)
          </Btn>
        </div>
      </div>
    </ScreenFrame>
  );
};
