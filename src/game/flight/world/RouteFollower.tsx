import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { getFlightTuning } from '../../../stores/game/editorFlightStore';
import { getPath } from '../../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../../path/pathCurve';
import { getActivePathId } from './worldRoute';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import { flightHandle } from '../flightHandle';

// The craft cruises FORWARD along the active route's 航道 (editorPathStore path) — it always flies ahead
// (never reverses); W boosts, S eases off. lookAt aligns the craft's −z to the route tangent, so the
// FlightCamera trails behind and the world streams backward past it. The model is wrapped in a π-yaw group
// so its nose points along travel (GLB models face +z by default → otherwise it looks like flying backward).
const _pos = new Vector3();
const _tan = new Vector3();
const _look = new Vector3();

export const RouteFollower = () => {
  const craft = useRef<Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const u = useRef(0);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const pathId = getActivePathId();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
    };
  }, []);

  useEffect(() => {
    u.current = 0;
    flightHandle.routeU = 0;
    useWorldFlightRuntimeStore.getState().reset();
  }, []);

  useFrame((_, dtRaw) => {
    const c = craft.current;
    if (!c) return;
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc) return;
    const dt = Math.min(dtRaw, 0.05);
    const tuning = getFlightTuning();
    const speedMult = character ? character.stats.flightSpeed / 6 : 1;
    const k = keys.current;
    // Always cruise forward — W boosts, S eases off (never reverses).
    const boost = k['KeyW'] ? 1.7 : k['KeyS'] ? 0.45 : 1;
    const pathSpeed = tuning.cruiseSpeed * speedMult * boost;
    u.current = Math.min(1, u.current + (pathSpeed * dt) / Math.max(1, cc.length));

    samplePos(cc.curve, u.current, _pos);
    sampleTangent(cc.curve, u.current, _tan);
    flightHandle.pos.copy(_pos);
    c.position.copy(_pos);
    _look.copy(_pos).add(_tan);
    c.lookAt(_look);
    flightHandle.quat.copy(c.quaternion);
    flightHandle.speed = pathSpeed;
    flightHandle.altitude = _pos.y;
    flightHandle.routeU = u.current;
    flightHandle.throttle = k['KeyW'] ? 1 : k['KeyS'] ? -1 : 0;

    if (u.current >= 0.999 && !useWorldFlightRuntimeStore.getState().arrived) {
      useWorldFlightRuntimeStore.getState().setArrived(true);
    }
  });

  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <group ref={craft}>
      {/* π-yaw so the model's +z nose points along −z travel (camera trails behind it). */}
      <group rotation={[0, Math.PI, 0]}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} /> : fallback}
      </group>
    </group>
  );
};
