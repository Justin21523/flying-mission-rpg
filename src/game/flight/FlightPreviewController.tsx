import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../path/pathCurve';
import { sampleNodeParams } from './pathNodeParams';
import { useFlightPreviewStore, flightPreviewHandle } from '../../stores/game/flightPreviewStore';
import { focusCameraOn } from '../edit/cameraFocus';
import { characterModelForForm } from '../destination/characterModel';
import type { AnimState } from '../anim/animRunner';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';

// EDIT-ONLY flight timeline preview — flies a preview craft along the scene's path at the store's u (0..1),
// scrub/play from the 🛩 Flight → Flight Preview panel. Mirrors RouteFollower's curve+bank math but is driven
// by the preview store, not input/the FSM. "Follow" rides the edit orbit target along (still user-rotatable).
const _pos = new Vector3();
const _tan = new Vector3();
const _look = new Vector3();
const DEG2RAD = Math.PI / 180;

export const FlightPreviewController = ({ pathId, craftScale, craftYaw }: { pathId: string; craftScale: number; craftYaw: number }) => {
  const craft = useRef<Group>(null);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const animState = useRef<AnimState>({ flying: true, moving: true, form: 'vehicle', speed: 0.5 });
  const getAnimState = useCallback(() => animState.current, []);

  useFrame((_, dtRaw) => {
    const c = craft.current;
    if (!c) return;
    const dt = Math.min(dtRaw, 0.05);
    useFlightPreviewStore.getState().advance(dt);
    const u = useFlightPreviewStore.getState().u;
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc) return;
    samplePos(cc.curve, u, _pos);
    sampleTangent(cc.curve, u, _tan);
    const np = sampleNodeParams(def, u);
    c.position.copy(_pos);
    _look.copy(_pos).sub(_tan); // non-camera lookAt points +Z at target → aim behind so −Z = forward
    c.lookAt(_look);
    if (np.bankDeg) c.rotateZ(np.bankDeg * DEG2RAD);
    flightPreviewHandle.u = u;
    flightPreviewHandle.altitude = _pos.y;
    flightPreviewHandle.pathSpeed = (cc.length || 0) * useFlightPreviewStore.getState().speed;
    if (useFlightPreviewStore.getState().follow) focusCameraOn(_pos.x, _pos.y, _pos.z);
  });

  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  const modelId = characterModelForForm(character, 'plane');
  return (
    <group ref={craft}>
      <group rotation={[0, craftYaw * DEG2RAD, 0]} scale={craftScale}>
        {modelId ? <AnimatedGlbModel assetId={modelId} animation={character?.flightAnimation} rules={character?.animationRules} getAnimState={getAnimState} fallback={fallback} noCull /> : fallback}
      </group>
    </group>
  );
};
