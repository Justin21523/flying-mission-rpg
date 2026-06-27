import { useEffect, useMemo, useState } from 'react';
import { ScreenFrame, Btn, panel, StatBar } from './screenChrome';
import { CharacterCard } from './CharacterCard';
import { CharacterPreview3D } from './CharacterPreview3D';
import { SkillUpgradePanel } from './SkillUpgradePanel';
import { EquipmentModPanel } from './EquipmentModPanel';
import { HangarUpgradePanel } from './HangarUpgradePanel';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { isCharacterRecommended } from '../../game/game/missionSelection';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition, useStageDefinitionStore } from '../../stores/useStageEditorStore';
import { startStage as startStageRuntime } from '../../game/levels/StageRuntimeDirector';
import { useSaveStore } from '../../stores/useSaveStore';
import { ProgressTracker } from '../../game/progress/ProgressTracker';
import { useUiStore } from '../../stores/uiStore';
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
  const activeStageId = useStageProgressionStore((s) => s.activeStageId);
  const activeStage = activeStageId ? getStageDefinition(activeStageId) : undefined;
  // Batch L (A1) — gate cards by the save's unlocked-character set (reactive).
  const unlockedIds = useSaveStore((s) => s.save.progress.unlockedCharacterIds);
  const stages = useStageDefinitionStore((s) => s.items);
  const editMode = useUiStore((s) => s.editMode);
  // Default to robot form so the character's transformer model shows immediately.
  const [form, setForm] = useState<CharacterForm>('robot');

  const isUnlocked = (id: string) => unlockedIds.includes(id);
  // Hint of how to unlock a locked character: the stage whose unlocksOnClear grants it.
  const lockHintFor = useMemo(() => {
    const map: Record<string, string> = {};
    for (const st of stages) for (const cid of st.unlocksOnClear?.characterIds ?? []) map[cid] = `Clear "${st.name}"`;
    return map;
  }, [stages]);

  const selected = useMemo(() => characters.find((c) => c.id === selectedId) ?? null, [characters, selectedId]);

  // Keep selection valid: if nothing selected (or the selected character is locked), pick the first unlocked one.
  useEffect(() => {
    if (selectedId && isUnlocked(selectedId)) return;
    const firstUnlocked = characters.find((c) => isUnlocked(c.id));
    if (firstUnlocked) selectCharacter(firstUnlocked.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, unlockedIds, selectedId]);

  const dispatch = () => {
    if (!selectedId || !isUnlocked(selectedId)) return;
    if (activeStageId) startStageRuntime(activeStageId);
    else requestTransition('HANGAR');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter') dispatch();
      else if (e.code === 'Escape') requestTransition('MISSION_BRIEFING');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStageId, requestTransition, selectedId, unlockedIds]);

  return (
    <ScreenFrame title="Character Selection" subtitle="dispatch crew">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid min-h-0 auto-rows-min grid-cols-2 gap-4 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              selected={c.id === selectedId}
              recommended={activeStage ? activeStage.recommendedCharacterIds.includes(c.id) : isCharacterRecommended(c, mission)}
              locked={!isUnlocked(c.id)}
              lockHint={lockHintFor[c.id] ?? 'Locked'}
              onClick={() => {
                selectCharacter(c.id);
                setForm('robot'); // show the transformer model on select
              }}
            />
          ))}
          {editMode && (
            <button
              onClick={() => { for (const c of characters) ProgressTracker.markCharacterUnlocked(c.id); }}
              className="col-span-full rounded-lg border border-dashed border-amber-500/50 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-500/10"
            >
              🔓 Unlock all characters (dev)
            </button>
          )}
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

              <SkillUpgradePanel characterId={selected.id} editMode={editMode} />
              <EquipmentModPanel characterId={selected.id} />
              <HangarUpgradePanel editMode={editMode} />


              <div className="mt-auto flex justify-between pt-3">
                <Btn tone="ghost" sound="back" onClick={() => requestTransition('MISSION_BRIEFING')}>
                  ← Back to briefing
                </Btn>
                <Btn tone="primary" sound="launch" disabled={!selectedId || !isUnlocked(selectedId)} onClick={dispatch}>
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
