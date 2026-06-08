import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { MOUSE, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useTerrainBrushStore } from '../../stores/terrainBrushStore';
import { useTransformationStore } from '../../stores/transformationStore';
import { editorSpawn } from '../../stores/sceneEditStore';

const LOOK_SENSITIVITY = 0.0025;

export const FollowCamera = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const editMode = useUiStore((state) => state.editMode);
  const terrainTool = useTerrainBrushStore((state) => state.tool);
  const terrainShiftHeld = useTerrainBrushStore((state) => state.shiftHeld);
  const gl = useThree((state) => state.gl);

  // Pointer-lock double-click mode (unchanged from kit).
  const [pointerLook, setPointerLook] = useState(false);
  const shiftPan = useRef(false);
  const yaw = useRef(0);
  const pitch = useRef(1.0);
  const dist = useRef(8);
  const tmpTarget = useRef(new Vector3());

  // Play-mode drag: mouse-drag to orbit without pointer lock.
  const isDragging = useRef(false);

  // Pointer-lock setup (unchanged from kit).
  useEffect(() => {
    const dom = gl.domElement;
    const onDblClick = () => {
      if (document.pointerLockElement === dom) {
        document.exitPointerLock();
      } else {
        const c = controlsRef.current;
        if (c) {
          yaw.current = c.getAzimuthalAngle();
          pitch.current = c.getPolarAngle();
          dist.current = c.getDistance();
        }
        void dom.requestPointerLock?.();
      }
    };
    const onLockChange = () => setPointerLook(document.pointerLockElement === dom);
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom) return;
      yaw.current -= e.movementX * LOOK_SENSITIVITY;
      pitch.current = Math.max(0.2, Math.min(Math.PI - 0.2, pitch.current + e.movementY * LOOK_SENSITIVITY));
    };
    const onShift = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftPan.current = e.type === 'keydown'; };
    dom.addEventListener('dblclick', onDblClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onShift);
    window.addEventListener('keyup', onShift);
    return () => {
      dom.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onShift);
      window.removeEventListener('keyup', onShift);
    };
  }, [gl]);

  // Play-mode drag: rotate camera by dragging canvas; scroll wheel adjusts distance.
  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (editMode || pointerLook) return;
      isDragging.current = true;
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || editMode || pointerLook) return;
      yaw.current -= e.movementX * LOOK_SENSITIVITY;
      pitch.current = Math.max(0.2, Math.min(Math.PI / 2.2, pitch.current + e.movementY * LOOK_SENSITIVITY));
    };
    const onPointerUp = () => { isDragging.current = false; };
    const onWheel = (e: WheelEvent) => {
      if (editMode || pointerLook) return;
      dist.current = Math.max(5, Math.min(16, dist.current + e.deltaY * 0.01));
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl, editMode, pointerLook]);

  useFrame((state) => {
    const c = controlsRef.current;
    if (!c) return;

    c.mouseButtons.LEFT = editMode && shiftPan.current ? MOUSE.PAN : MOUSE.ROTATE;

    if (pointerLook) {
      // Pointer-lock path: unchanged from kit.
      const t = tmpTarget.current;
      if (editMode) {
        t.set(editorSpawn.x, editorSpawn.y, editorSpawn.z);
      } else if (playerPosition) {
        t.set(playerPosition.x, playerPosition.y + 1, playerPosition.z);
      } else {
        t.copy(c.target);
      }
      c.target.copy(t);
      const sinP = Math.sin(pitch.current);
      const r = dist.current;
      state.camera.position.set(
        t.x + r * sinP * Math.sin(yaw.current),
        t.y + r * Math.cos(pitch.current),
        t.z + r * sinP * Math.cos(yaw.current),
      );
      state.camera.lookAt(t);
      if (editMode) { editorSpawn.x = t.x; editorSpawn.y = t.y; editorSpawn.z = t.z; }
      return;
    }

    if (editMode) {
      editorSpawn.x = c.target.x;
      editorSpawn.y = c.target.y;
      editorSpawn.z = c.target.z;
      return;
    }

    if (!playerPosition) return;

    // Third-person spring camera: orbit target = player head; yaw springs behind
    // player when moving, hand-drag temporarily overrides the spring.
    const t = tmpTarget.current;
    t.set(playerPosition.x, playerPosition.y + 1, playerPosition.z);
    c.target.copy(t);

    const { playerFacingAngle, isPlayerMoving } = useTransformationStore.getState();
    const targetYaw = playerFacingAngle + Math.PI;
    if (isPlayerMoving && !isDragging.current) {
      // Shortest-arc lerp — prevents 360° spin when angle crosses ±π.
      let delta = targetYaw - yaw.current;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      yaw.current += delta * 0.07;
    }

    const sinP = Math.sin(pitch.current);
    const r = dist.current;
    state.camera.position.set(
      t.x + r * sinP * Math.sin(yaw.current),
      t.y + r * Math.cos(pitch.current),
      t.z + r * sinP * Math.cos(yaw.current),
    );
    state.camera.lookAt(t);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      // In play mode the camera is driven manually; OrbitControls only active in edit/pointer-lock.
      enabled={editMode || pointerLook}
      minPolarAngle={0.2}
      maxPolarAngle={editMode ? Math.PI : Math.PI / 2.2}
      minDistance={editMode ? 0.5 : 5}
      maxDistance={editMode ? Infinity : 16}
      enablePan={editMode}
      enableRotate={!(editMode && terrainTool !== 'none') || terrainShiftHeld}
      mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
      enableDamping
      dampingFactor={0.1}
    />
  );
};
