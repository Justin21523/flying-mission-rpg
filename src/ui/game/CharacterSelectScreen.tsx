import { useEffect, useMemo, useState } from 'react';
import { ScreenFrame, Btn, panel, StatBar } from './screenChrome';
import { CharacterCard } from './CharacterCard';
import { CharacterPreview3D } from './CharacterPreview3D';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { isCharacterRecommended } from '../../game/game/missionSelection';
import type { CharacterForm } from '../../types/game/character';

// CHARACTER_SELECTION — card grid + detail panel with a primitive 3D preview and plane/robot toggle.
// 選擇 updates useCharacterStore; 確認出動 → HANGAR. Recommended characters (for the current mission) badged.
export const CharacterSelectScreen = () => {
  const characters = useEditorCharacterStore((s) => s.items);
  const selectedId = useCharacterStore((s) => s.selectedCharacterId);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const requestTransition = useGameStore((s) => s.requestTransition);
  const missionId = useMissionStore((s) => s.currentMissionId);
  const mission = missionId ? getEditorMission(missionId) ?? null : null;
  // Default to robot form so the character's transformer model shows immediately.
  const [form, setForm] = useState<CharacterForm>('robot');

  const selected = useMemo(() => characters.find((c) => c.id === selectedId) ?? null, [characters, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && selectedId) requestTransition('HANGAR');
      else if (e.code === 'Escape') requestTransition('MISSION_BRIEFING');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestTransition, selectedId]);

  return (
    <ScreenFrame title="Character Selection" subtitle="dispatch crew">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid min-h-0 auto-rows-min grid-cols-2 gap-4 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              selected={c.id === selectedId}
              recommended={isCharacterRecommended(c, mission)}
              onClick={() => {
                selectCharacter(c.id);
                setForm('robot'); // show the transformer model on select
              }}
            />
          ))}
        </div>

        <div className={`flex min-h-0 flex-col ${panel} p-4`}>
          {selected ? (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-black text-slate-100">
                  {selected.name} <span className="text-xs text-slate-400">{selected.role}</span>
                </h2>
                <span className="h-4 w-4 rounded-full ring-2 ring-white/50" style={{ background: selected.color }} />
              </div>

              <div className="my-3 h-56 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60">
                <CharacterPreview3D color={selected.color} form={form} modelAssetId={selected.modelAssetId} animation={selected.idleAnimation} />
              </div>

              <div className="mb-2 flex gap-1.5">
                {(['plane', 'robot'] as CharacterForm[]).map((f) => (
                  <Btn key={f} tone={form === f ? 'primary' : 'ghost'} onClick={() => setForm(f)}>
                    {f === 'plane' ? '✈ Plane' : '🤖 Robot'}
                  </Btn>
                ))}
              </div>

              <div className="space-y-1">
                <StatBar label="Flight speed" value={selected.stats.flightSpeed} color={selected.color} />
                <StatBar label="Agility" value={selected.stats.agility} color="#34d399" />
                <StatBar label="Control difficulty" value={selected.stats.controlDifficulty} color="#f59e0b" />
                <StatBar label="Durability" value={selected.stats.durability} color="#a78bfa" />
              </div>
              <div className="mt-2 text-xs text-slate-300">
                Abilities: {selected.abilities.map((a) => a.name).join(', ') || '—'}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Suitability: {selected.missionSuitability.join(', ') || '—'}</div>

              <div className="mt-auto flex justify-between pt-3">
                <Btn tone="ghost" sound="back" onClick={() => requestTransition('MISSION_BRIEFING')}>
                  ← Back to briefing
                </Btn>
                <Btn tone="primary" sound="launch" disabled={!selectedId} onClick={() => requestTransition('HANGAR')}>
                  Confirm Dispatch →
                </Btn>
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-sm text-slate-400">
              Select a character
              <br />
              to view details and dispatch.
            </div>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
};
