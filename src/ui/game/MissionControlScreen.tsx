import { useEffect, useMemo, useState } from 'react';
import { ScreenFrame, Btn, panel, chip } from './screenChrome';
import { WorldMapPanel } from './WorldMapPanel';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { isMissionAvailable } from '../../game/missions/missionAvailability';
import { pickTestMissionId } from '../../game/game/missionSelection';
import { playUiSound } from '../../game/audio/uiSound';

// MISSION_CONTROL — hi-tech console: world map (left) + mission notifications (right). Selecting a
// mission advances to the briefing (GameDirector reacts to mission:selected). Data is read live from the
// editable stores, so Edit Mode changes reflect immediately.
export const MissionControlScreen = () => {
  const missions = useEditorMissionStore((s) => s.items);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [featuredId, setFeaturedId] = useState<string | null>(null);

  const visible = useMemo(
    () => missions.filter((m) => isMissionAvailable(m) && (!activeLocationId || m.locationId === activeLocationId)),
    [missions, activeLocationId],
  );

  const accept = (id: string) => useMissionStore.getState().selectMission(id); // → MISSION_BRIEFING

  const regenerate = () => {
    const id = pickTestMissionId(missions, featuredId ?? undefined);
    setFeaturedId(id);
    const m = id ? missions.find((x) => x.id === id) : undefined;
    if (m) setActiveLocationId(m.locationId);
    playUiSound('select');
  };

  // Enter accepts the featured mission (keyboard flow). Calls the store directly to avoid a closure dep.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && featuredId) useMissionStore.getState().selectMission(featuredId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [featuredId]);

  return (
    <ScreenFrame title="Mission Control" subtitle="dispatch">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <WorldMapPanel activeLocationId={activeLocationId} onPick={setActiveLocationId} />

        <div className={`flex min-h-0 flex-col ${panel} p-3`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-sky-200">
              Mission Notifications
              {activeLocationId && <span className="text-slate-400"> · {getEditorLocation(activeLocationId)?.name ?? ''}</span>}
            </h2>
            <Btn tone="ghost" onClick={regenerate}>
              🎲 Regenerate test mission
            </Btn>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {visible.length === 0 && <div className="text-xs text-slate-500">No missions at this location.</div>}
            {visible.map((m) => {
              const loc = getEditorLocation(m.locationId);
              const featured = m.id === featuredId;
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-3 ${featured ? 'border-amber-400/60 bg-amber-500/5' : 'border-slate-700 bg-slate-900/50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-100">{m.name}</span>
                    <span className={`${chip} border-slate-600 text-slate-300`}>{m.type}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-slate-400">
                    <span>📍 {loc?.name ?? m.locationId}</span>
                    <span>· Difficulty {m.difficulty}</span>
                    <span>· Weather {m.weather}</span>
                    {m.recommendedAbility && <span>· Ability {m.recommendedAbility}</span>}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Recommended: {m.recommendedCharacterIds.map((id) => getEditorCharacter(id)?.name ?? id).join(', ') || '—'}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">{m.summary}</p>
                  <div className="mt-2 flex justify-end">
                    <Btn tone="primary" onClick={() => accept(m.id)}>
                      Accept Mission
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
};
