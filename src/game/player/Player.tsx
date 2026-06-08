import { useEffect, useRef, useState } from 'react';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useTransformationStore } from '../../stores/transformationStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { applyMovement } from './MovementStateMachine';
import { TransformationController } from './TransformationController';

export const Player = () => {
  const body = useRef<RapierRigidBody>(null);
  const editMode = useUiStore((s) => s.editMode);
  const poliSelected = useEditorPoliCharacterStore((s) => s.selectedId === 'poli');
  const setPosition = usePlayerStore((s) => s.setPosition);
  const spawnRequest = usePlayerStore((s) => s.spawnRequest);
  const clearSpawnRequest = usePlayerStore((s) => s.clearSpawnRequest);
  const currentAreaId = usePlayerStore((s) => s.currentAreaId);
  const setSpawnOverride = usePlayerStore((s) => s.setSpawnOverride);
  const requestTransform = useTransformationStore((s) => s.requestTransform);
  const keys = useRef<Record<string, boolean>>({});
  const headingRef = useRef(0);
  const { camera } = useThree();

  // Edit-mode move gizmo: a world-space proxy the gizmo drags; on change we teleport the body.
  // Held in state (not just a ref) so the render-time TransformControls object prop is valid.
  const proxyRef = useRef<Group | null>(null);
  const draggingRef = useRef(false);
  const [proxy, setProxy] = useState<Group | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && !e.repeat) { requestTransform(); return; }
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [requestTransform]);

  // Teleport on spawn request (area travel).
  useEffect(() => {
    if (spawnRequest && body.current) {
      body.current.setTranslation(spawnRequest, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      clearSpawnRequest();
    }
  }, [spawnRequest, clearSpawnRequest]);

  // On mount / area change, honour a saved Edit-Mode spawn override for this area (persisted),
  // so a player position set while editing applies in Play Mode and survives reload.
  useEffect(() => {
    const ov = usePlayerStore.getState().spawnOverrides[currentAreaId];
    if (ov && body.current) {
      body.current.setTranslation(ov, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [currentAreaId]);

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    setPosition({ x: p.x, y: p.y, z: p.z });

    if (editMode) {
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // Keep the move-gizmo proxy on the player while not actively dragging it.
      if (proxyRef.current && !draggingRef.current) {
        proxyRef.current.position.set(p.x, p.y, p.z);
      }
      return;
    }

    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const { mode } = useTransformationStore.getState();
    applyMovement(b, keys.current, camera, mode, headingRef);
  });

  // Drag → teleport the physics body to the proxy's position.
  const onGizmoChange = () => {
    const g = proxyRef.current;
    const b = body.current;
    if (!g || !b) return;
    b.setTranslation({ x: g.position.x, y: g.position.y, z: g.position.z }, true);
    b.setLinvel({ x: 0, y: 0, z: 0 }, true);
  };

  return (
    <>
      <RigidBody ref={body} type="dynamic" colliders={false} lockRotations canSleep={false} position={[0, 2, 0]}>
        <CapsuleCollider args={[0.5, 0.5]} />
        <TransformationController headingRef={headingRef} />
      </RigidBody>

      {/* World-space proxy + translate gizmo (Edit Mode, when the player is selected). */}
      <group ref={(g) => { proxyRef.current = g; setProxy(g); }} />
      {editMode && poliSelected && proxy && (
        <TransformControls
          object={proxy}
          mode="translate"
          onMouseDown={() => { draggingRef.current = true; }}
          onMouseUp={() => {
            draggingRef.current = false;
            const g = proxyRef.current;
            if (g) setSpawnOverride(currentAreaId, { x: g.position.x, y: g.position.y, z: g.position.z });
          }}
          onObjectChange={onGizmoChange}
        />
      )}
    </>
  );
};
