import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Vector3 } from 'three';
import { useEditorFlightCueStore, getFlightCues } from '../../stores/game/editorFlightCueStore';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos } from '../path/pathCurve';
import { resolveFlightCues } from './flightCueRunner';
import { flightCueHandle } from './flightCueHandle';
import { flightHandle } from './flightHandle';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import type { FlightCue } from '../../types/game/flightCue';

// PLAY-side driver for the flight cue timeline (the edit-side twin is FlightCuePreview). Each frame it resolves
// the cues at the REAL route progress (flightHandle.routeU, written by RouteFollower / FlightController) and:
//  • camera  → flightCueHandle (FlightCamera applies the override) — only when camera cues exist, so the
//    default flight framing is untouched otherwise (flight feel pillar);
//  • action  → flightPreviewStore.activeCueClip (the flight craft renderers play it);
//  • environment → a scene background tint;
//  • event   → authored models placed along the route (rendered below, no gizmo in play).
const _scratch = new Vector3();

export const FlightCuePlayController = ({ pathId }: { pathId: string }) => {
  const cues = useEditorFlightCueStore((s) => s.byPath[pathId]);
  const bg = useRef(new Color());
  const prevBg = useRef<Color | null | undefined>(undefined);

  useEffect(() => () => { flightCueHandle.camActive = false; useFlightPreviewStore.getState().setActiveCueClip(''); }, []);

  useFrame((state) => {
    const r = resolveFlightCues(getFlightCues(pathId), flightHandle.routeU);
    if (r.camera) {
      flightCueHandle.camActive = true;
      flightCueHandle.distance = r.camera.distance;
      flightCueHandle.height = r.camera.height;
      flightCueHandle.angleDeg = r.camera.angleDeg;
      flightCueHandle.fov = r.camera.fov;
    } else {
      flightCueHandle.camActive = false;
    }
    useFlightPreviewStore.getState().setActiveCueClip(r.animation?.clipName ?? '');
    if (prevBg.current === undefined) prevBg.current = (state.scene.background as Color | null) ?? null;
    if (r.environment?.skyTop) { bg.current.set(r.environment.skyTop); state.scene.background = bg.current; }
    else if (prevBg.current !== undefined) { state.scene.background = prevBg.current; }
  });

  const props = useMemo(() => {
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc || !cues) return [] as { cue: FlightCue; pos: [number, number, number] }[];
    return cues.filter((c) => c.type === 'event' && c.eventAssetId && getModelAsset(c.eventAssetId)).map((c) => {
      samplePos(cc.curve, Math.max(0, Math.min(1, c.atU)), _scratch);
      const off = c.eventOffset ?? [0, 0, 0];
      return { cue: c, pos: [_scratch.x + off[0], _scratch.y + off[1], _scratch.z + off[2]] as [number, number, number] };
    });
  }, [pathId, cues]);

  return (
    <>
      {props.map(({ cue, pos }) => (
        <group key={cue.id} position={pos}>
          <NormalizedGlbModel assetId={cue.eventAssetId!} target={(cue.eventScale ?? 1) * 1.5} />
        </group>
      ))}
    </>
  );
};
