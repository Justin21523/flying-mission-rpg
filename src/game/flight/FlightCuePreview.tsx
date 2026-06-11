import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { useEditorFlightCueStore, getFlightCues } from '../../stores/game/editorFlightCueStore';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos } from '../path/pathCurve';
import { resolveFlightCues } from './flightCueRunner';
import { flightCueHandle } from './flightCueHandle';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import type { FlightCue } from '../../types/game/flightCue';

// EDIT-ONLY driver for the flight cue timeline. Each frame it resolves the cues at the preview's u and writes
// flightCueHandle (camera override + active animation) + tints the scene background for environment cues; it
// also renders draggable event-cue markers along the route. Mounted in the flight scenes (edit). When not
// previewing it clears the camera override so the normal flight framing returns. Never affects play.
const _scratch = new Vector3();

const EventMarker = ({ pathId, cue, base }: { pathId: string; cue: FlightCue; base: [number, number, number] }) => {
  const off = cue.eventOffset ?? [0, 0, 0];
  const pos: [number, number, number] = [base[0] + off[0], base[1] + off[1], base[2] + off[2]];
  const asset = cue.eventAssetId ? getModelAsset(cue.eventAssetId) : undefined;
  const onMove = (p: [number, number, number]) => {
    useEditorFlightCueStore.getState().update(pathId, cue.id, { eventOffset: [p[0] - base[0], p[1] - base[1], p[2] - base[2]] });
  };
  return (
    <DataBackedPlacement objKey={`${pathId}#cue#${cue.id}`} position={pos} onMove={onMove} color="#f59e0b">
      {asset ? (
        <NormalizedGlbModel assetId={cue.eventAssetId!} target={(cue.eventScale ?? 1) * 1.5} />
      ) : (
        <mesh>
          <octahedronGeometry args={[0.4 * (cue.eventScale ?? 1), 0]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      )}
      <Html center distanceFactor={14} position={[0, 0.7, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 text-[9px] text-amber-200">{cue.label || 'event'} · u{Math.round(cue.atU * 100)}</div>
      </Html>
    </DataBackedPlacement>
  );
};

export const FlightCuePreview = ({ pathId }: { pathId: string }) => {
  const cues = useEditorFlightCueStore((s) => s.byPath[pathId]);
  const bg = useRef(new Color());
  const prevBg = useRef<Color | null | undefined>(undefined);

  // Restore the original scene background on unmount (we may override it for environment cues).
  useEffect(() => () => { flightCueHandle.camActive = false; }, []);

  useFrame((state) => {
    const ps = useFlightPreviewStore.getState();
    const previewing = ps.playing || ps.u > 0.001;
    if (!previewing) { flightCueHandle.camActive = false; flightCueHandle.animClip = ''; ps.setActiveCueClip(''); return; }
    const r = resolveFlightCues(getFlightCues(pathId), ps.u);
    if (r.camera) {
      flightCueHandle.camActive = true;
      flightCueHandle.distance = r.camera.distance;
      flightCueHandle.height = r.camera.height;
      flightCueHandle.angleDeg = r.camera.angleDeg;
      flightCueHandle.fov = r.camera.fov;
    } else {
      flightCueHandle.camActive = false;
    }
    if (r.animation) { flightCueHandle.animClip = r.animation.clipName; flightCueHandle.animSpeed = r.animation.clipSpeed; flightCueHandle.bankDeg = r.animation.bankDeg; }
    else { flightCueHandle.animClip = ''; }
    ps.setActiveCueClip(r.animation?.clipName ?? '');
    // environment tint — solid background colour from the active environment cue (a clear "it changed here").
    if (prevBg.current === undefined) prevBg.current = (state.scene.background as Color | null) ?? null;
    if (r.environment?.skyTop) { bg.current.set(r.environment.skyTop); state.scene.background = bg.current; }
    else if (prevBg.current !== undefined) { state.scene.background = prevBg.current; }
  });

  const markers = useMemo(() => {
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc || !cues) return [];
    return cues.filter((c) => c.type === 'event').map((c) => {
      samplePos(cc.curve, Math.max(0, Math.min(1, c.atU)), _scratch);
      return { cue: c, base: [_scratch.x, _scratch.y, _scratch.z] as [number, number, number] };
    });
  }, [pathId, cues]);

  return <>{markers.map(({ cue, base }) => <EventMarker key={cue.id} pathId={pathId} cue={cue} base={base} />)}</>;
};
