import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Quaternion, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { useEditorFlightCueStore, getFlightCues } from '../../stores/game/editorFlightCueStore';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../path/pathCurve';
import { resolveFlightCues } from './flightCueRunner';
import { flightCueHandle } from './flightCueHandle';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import type { FlightCue } from '../../types/game/flightCue';
import { sampleUForDirection, type FlightLegDirection } from './flightLeg';

// EDIT-ONLY driver for the flight cue timeline. Each frame it resolves the cues at the preview's u and writes
// flightCueHandle (camera override + active animation) + tints the scene background for environment cues; it
// also renders draggable event-cue markers along the route. Mounted in the flight scenes (edit). When not
// previewing it clears the camera override so the normal flight framing returns. Never affects play.
const _scratch = new Vector3();
const DEG = Math.PI / 180;
// temps for resolving the craft transform at a cue's u (matching the controllers' lookAt(pos − tangent)).
const _ctObj = new Object3D();
const _ctPos = new Vector3();
const _ctTan = new Vector3();
const _ctLook = new Vector3();
const _ctLocal = new Vector3();
const _ctQuatInv = new Quaternion();

interface CraftXform { pos: Vector3; quat: Quaternion }
function craftXformAt(curve: Parameters<typeof samplePos>[0], u: number, direction: FlightLegDirection): CraftXform {
  const uu = Math.max(0, Math.min(1, u));
  samplePos(curve, uu, _ctPos);
  sampleTangent(curve, uu, _ctTan);
  if (direction === 'reverse') _ctTan.multiplyScalar(-1);
  _ctObj.position.copy(_ctPos);
  _ctObj.lookAt(_ctLook.copy(_ctPos).sub(_ctTan)); // +Z → (pos−tan) ⇒ −Z = forward (same as the craft)
  return { pos: _ctPos.clone(), quat: _ctObj.quaternion.clone() };
}

// Draggable eye anchor for a camera cue: sits at the framing's eye relative to the craft at that u; dragging
// re-derives distance / height / orbit-angle (inverse of FlightCamera's offset) and bakes them into the cue.
const CameraAnchor = ({ cueKey, cue, xform }: { cueKey: string; cue: FlightCue; xform: CraftXform }) => {
  const dist = cue.camDistance ?? 12;
  const height = cue.camHeight ?? 4;
  const a = (cue.camAngleDeg ?? 0) * DEG;
  const eye = new Vector3(dist * Math.sin(a), height, dist * Math.cos(a)).applyQuaternion(xform.quat).add(xform.pos);
  const onMove = (p: [number, number, number]) => {
    _ctLocal.set(p[0] - xform.pos.x, p[1] - xform.pos.y, p[2] - xform.pos.z).applyQuaternion(_ctQuatInv.copy(xform.quat).invert());
    const r = (n: number) => Math.round(n * 100) / 100;
    useEditorFlightCueStore.getState().update(cueKey, cue.id, {
      camDistance: r(Math.hypot(_ctLocal.x, _ctLocal.z)),
      camHeight: r(_ctLocal.y),
      camAngleDeg: r(Math.atan2(_ctLocal.x, _ctLocal.z) / DEG),
    });
  };
  return (
    <DataBackedPlacement objKey={`${cueKey}#camcue#${cue.id}`} position={[eye.x, eye.y, eye.z]} onMove={onMove} onDelete={() => useEditorFlightCueStore.getState().remove(cueKey, cue.id)} color="#a855f7">
      <mesh><boxGeometry args={[0.5, 0.4, 0.7]} /><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} /></mesh>
      <Html center distanceFactor={14} position={[0, 0.7, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 text-[9px] text-violet-200">{cue.label || 'camera'} · u{Math.round(cue.atU * 100)}</div>
      </Html>
    </DataBackedPlacement>
  );
};

const EventMarker = ({ cueKey, cue, base }: { cueKey: string; cue: FlightCue; base: [number, number, number] }) => {
  const off = cue.eventOffset ?? [0, 0, 0];
  const pos: [number, number, number] = [base[0] + off[0], base[1] + off[1], base[2] + off[2]];
  const asset = cue.eventAssetId ? getModelAsset(cue.eventAssetId) : undefined;
  const onMove = (p: [number, number, number]) => {
    useEditorFlightCueStore.getState().update(cueKey, cue.id, { eventOffset: [p[0] - base[0], p[1] - base[1], p[2] - base[2]] });
  };
  return (
    <DataBackedPlacement objKey={`${cueKey}#cue#${cue.id}`} position={pos} onMove={onMove} onDelete={() => useEditorFlightCueStore.getState().remove(cueKey, cue.id)} color="#f59e0b">
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

export const FlightCuePreview = ({ pathId, cueKey = pathId, direction = 'forward' }: { pathId: string; cueKey?: string; direction?: FlightLegDirection }) => {
  const cues = useEditorFlightCueStore((s) => s.byPath[cueKey]);

  useEffect(() => () => { flightCueHandle.camActive = false; useFlightPreviewStore.getState().setActiveEnv(null); }, []);

  useFrame(() => {
    const ps = useFlightPreviewStore.getState();
    const previewing = ps.playing || ps.u > 0.001;
    if (!previewing) { flightCueHandle.camActive = false; flightCueHandle.animClip = ''; ps.setActiveCueClip(''); ps.setActiveEnv(null); return; }
    const r = resolveFlightCues(getFlightCues(cueKey), ps.u);
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
    ps.setActiveEnv(r.environment); // real sky + cloud density (WorldSkyAmbience / CloudField read this)
  });

  const { markers, camAnchors } = useMemo(() => {
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc || !cues) return { markers: [], camAnchors: [] as { cue: FlightCue; xform: CraftXform }[] };
    const markers = cues.filter((c) => c.type === 'event').map((c) => {
      samplePos(cc.curve, sampleUForDirection(c.atU, direction), _scratch);
      return { cue: c, base: [_scratch.x, _scratch.y, _scratch.z] as [number, number, number] };
    });
    const camAnchors = cues.filter((c) => c.type === 'camera').map((c) => ({ cue: c, xform: craftXformAt(cc.curve, sampleUForDirection(c.atU, direction), direction) }));
    return { markers, camAnchors };
  }, [pathId, cues, direction]);

  return (
    <>
      {markers.map(({ cue, base }) => <EventMarker key={cue.id} cueKey={cueKey} cue={cue} base={base} />)}
      {camAnchors.map(({ cue, xform }) => <CameraAnchor key={cue.id} cueKey={cueKey} cue={cue} xform={xform} />)}
    </>
  );
};
