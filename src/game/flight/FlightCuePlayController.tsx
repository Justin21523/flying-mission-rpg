import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
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
import { sampleUForDirection, type FlightLegDirection } from './flightLeg';

// PLAY-side driver for the flight cue timeline (the edit-side twin is FlightCuePreview). Each frame it resolves
// the cues at the REAL route progress (flightHandle.routeU, written by RouteFollower / FlightController) and:
//  • camera  → flightCueHandle (FlightCamera applies the override) — only when camera cues exist, so the
//    default flight framing is untouched otherwise (flight feel pillar);
//  • action  → flightPreviewStore.activeCueClip (the flight craft renderers play it);
//  • environment → a scene background tint;
//  • event   → authored models placed along the route (rendered below, no gizmo in play).
const _scratch = new Vector3();

export const FlightCuePlayController = ({ pathId, cueKey = pathId, direction = 'forward' }: { pathId: string; cueKey?: string; direction?: FlightLegDirection }) => {
  const cues = useEditorFlightCueStore((s) => s.byPath[cueKey]);

  useEffect(() => () => { flightCueHandle.camActive = false; const ps = useFlightPreviewStore.getState(); ps.setActiveCueClip(''); ps.setActiveEnv(null); }, []);

  useFrame(() => {
    const r = resolveFlightCues(getFlightCues(cueKey), flightHandle.routeU);
    if (r.camera) {
      flightCueHandle.camActive = true;
      flightCueHandle.distance = r.camera.distance;
      flightCueHandle.height = r.camera.height;
      flightCueHandle.angleDeg = r.camera.angleDeg;
      flightCueHandle.fov = r.camera.fov;
    } else {
      flightCueHandle.camActive = false;
    }
    const ps = useFlightPreviewStore.getState();
    ps.setActiveCueClip(r.animation?.clipName ?? '');
    ps.setActiveEnv(r.environment); // real sky + cloud density (WorldSkyAmbience / CloudField read this)
  });

  const props = useMemo(() => {
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc || !cues) return [] as { cue: FlightCue; pos: [number, number, number] }[];
    return cues.filter((c) => c.type === 'event' && c.eventAssetId && getModelAsset(c.eventAssetId)).map((c) => {
      samplePos(cc.curve, sampleUForDirection(c.atU, direction), _scratch);
      const off = c.eventOffset ?? [0, 0, 0];
      return { cue: c, pos: [_scratch.x + off[0], _scratch.y + off[1], _scratch.z + off[2]] as [number, number, number] };
    });
  }, [pathId, cues, direction]);

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
