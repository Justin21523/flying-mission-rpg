import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MOUSE, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useTerrainBrushStore } from '../../stores/terrainBrushStore';
import { editorSpawn } from '../../stores/sceneEditStore';
import { cameraFocus } from '../edit/cameraFocus';
import { useGameStore } from '../../stores/game/useGameStore';
import { getPhaseCamera } from '../../stores/game/editorCameraStore';
import { editCameraHandle } from './editCameraHandle';
import type { PerspectiveCamera } from 'three';

const _focusOff = new Vector3();
const FOCUS_MIN_DIST = 10; // never zoom closer than this on a framed focus (no over-zoom)

// Rebuilt simple third-person follow camera.
//
// PLAY MODE: a plain orbit-follow. The camera always sits behind+above the player at a
// user-controlled angle and looks at the player. The angle ONLY changes when the user drags
// the mouse (or zooms with the wheel) — there is deliberately NO auto-spring toward the
// player's facing, because that created a feedback loop with camera-relative movement and
// made the camera look like it was "moving on its own". The player moves; the camera follows.
//
// EDIT MODE: the kit's OrbitControls drives the camera (free orbit/pan/zoom) so the transform
// gizmo works exactly as in the rest of the kit. We only mirror the orbit target into
// editorSpawn so the Add-Model palette drops new objects at the camera focus.

const LOOK_SENSITIVITY = 0.0032;
const DEG2RAD = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// Pitch range: PITCH_MIN ≈ near-horizon (look across the world), PITCH_MAX ≈ near top-down.
const PITCH_MIN = 0.12;
const PITCH_MAX = 1.5;
// Rotation/zoom smoothing rate — higher = snappier, lower = floatier (frame-rate independent via delta).
const CAM_SMOOTH = 14;
// Play-mode wheel-zoom range — very close right up to far-out (big maps).
const CAM_MIN_DIST = 1.2;
const CAM_MAX_DIST = 600;
// Canonical orbit reset, re-applied on every area travel / portal / teleport so you ALWAYS arrive facing the
// same direction (the camera angle never varies just because you moved to another place).
const DEFAULT_YAW = Math.PI;   // behind the player
const DEFAULT_PITCH = 0.9;     // 0 = horizon, ~1.5 = top-down-ish

export const FollowCamera = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  // Do NOT subscribe to player position — that changes every frame and would re-render this
  // component (and OrbitControls) every frame inside the R3F loop, causing jank/apparent freezes.
  // Read it via getState() inside useFrame instead.
  const editMode = useUiStore((s) => s.editMode);
  const terrainTool = useTerrainBrushStore((s) => s.tool);
  const terrainShiftHeld = useTerrainBrushStore((s) => s.shiftHeld);
  const gl = useThree((s) => s.gl);

  // Play-mode orbit state (refs → no re-render, no per-frame allocation). The *Target refs are what the
  // mouse drives; the plain refs ease toward them each frame so rotation/zoom feel smooth, not jumpy.
  const yaw = useRef(DEFAULT_YAW);   // start behind the player (looking down +Z toward them)
  const pitch = useRef(DEFAULT_PITCH);
  const dist = useRef(9);
  const yawTarget = useRef(DEFAULT_YAW);
  const pitchTarget = useRef(DEFAULT_PITCH);
  const distTarget = useRef(9);
  const dragging = useRef(false);
  const target = useRef(new Vector3());
  const lastFocus = useRef(0); // last consumed cameraFocus.fireId (edit-mode "jump to object")
  // Per-phase authored framing (🎥 Camera): targetHeight + fov used by the play follow; snapped on phase
  // change. Phases without an authored config keep the persistent defaults (no reset on travel).
  const targetHeight = useRef(1.0);
  const fovTarget = useRef(50);
  const prevPhase = useRef('');

  // NOTE: the orbit angle is NOT reset on travel — yaw/pitch are persistent refs (this component never
  // remounts), so the camera facing carries over UNCHANGED across area changes / portals / teleports. The
  // player must arrive facing exactly the way they were before, never snapped to a different direction.

  // Mouse-drag to orbit + wheel to zoom — play mode only.
  useEffect(() => {
    const dom = gl.domElement;
    const onDown = () => { if (!useUiStore.getState().editMode) dragging.current = true; };
    const onUp = () => { dragging.current = false; };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || useUiStore.getState().editMode) return;
      // Drag right → camera looks right, drag up → camera looks up (per preference).
      yawTarget.current -= e.movementX * LOOK_SENSITIVITY;
      pitchTarget.current = clamp(pitchTarget.current + e.movementY * LOOK_SENSITIVITY, PITCH_MIN, PITCH_MAX);
    };
    const onWheel = (e: WheelEvent) => {
      if (useUiStore.getState().editMode) return;
      // Distance-proportional zoom step → smooth control across a very wide range (close-up to far-out).
      distTarget.current = clamp(distTarget.current * (1 + e.deltaY * 0.0012), CAM_MIN_DIST, CAM_MAX_DIST);
    };
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    dom.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (editMode) {
      // OrbitControls owns the camera; mirror its focus for the Add-Model palette + honour 🎯 focus requests.
      const c = controlsRef.current;
      if (c) {
        // Editor "jump to object": pan the target (and camera) to the request. With a frame radius, reframe to
        // a sensible distance (clamped to a minimum) so node Focus never over-zooms; without one, keep the
        // current view offset (angle + zoom).
        if (cameraFocus.fireId !== lastFocus.current) {
          lastFocus.current = cameraFocus.fireId;
          _focusOff.copy(state.camera.position).sub(c.target);
          if (cameraFocus.radius > 0) {
            const want = Math.max(FOCUS_MIN_DIST, cameraFocus.radius * 2.2);
            if (_focusOff.lengthSq() < 1e-4) _focusOff.set(0.6, 0.8, 1);
            _focusOff.setLength(want);
          }
          c.target.set(cameraFocus.x, cameraFocus.y, cameraFocus.z);
          state.camera.position.copy(c.target).add(_focusOff);
          c.update();
        }
        editorSpawn.x = c.target.x; editorSpawn.y = c.target.y; editorSpawn.z = c.target.z;
        // Mirror the live edit view for the 🎥 Camera "Capture current view" button.
        editCameraHandle.camX = state.camera.position.x; editCameraHandle.camY = state.camera.position.y; editCameraHandle.camZ = state.camera.position.z;
        editCameraHandle.targetX = c.target.x; editCameraHandle.targetY = c.target.y; editCameraHandle.targetZ = c.target.z;
      }
      return;
    }
    const playerPosition = usePlayerStore.getState().position;
    if (!playerPosition) return;

    // Apply the phase's authored framing on phase change (snap so it doesn't ease from the old view);
    // phases without a config keep the persistent yaw/pitch/dist + default height/fov.
    const phase = useGameStore.getState().phase;
    if (phase !== prevPhase.current) {
      prevPhase.current = phase;
      const cfg = getPhaseCamera(phase);
      if (cfg) {
        yawTarget.current = yaw.current = cfg.yawDeg * DEG2RAD;
        pitchTarget.current = pitch.current = clamp(cfg.pitchDeg * DEG2RAD, 0.04, Math.PI - 0.04);
        distTarget.current = dist.current = cfg.distance;
        targetHeight.current = cfg.targetHeight;
        fovTarget.current = cfg.fov;
      } else {
        targetHeight.current = 1.0;
        fovTarget.current = 50;
      }
    }

    // Ease the live yaw/pitch/distance toward their drag targets (frame-rate independent) → smooth orbit/zoom.
    const a = 1 - Math.exp(-CAM_SMOOTH * delta);
    yaw.current += (yawTarget.current - yaw.current) * a;
    pitch.current += (pitchTarget.current - pitch.current) * a;
    dist.current += (distTarget.current - dist.current) * a;

    // Follow: orbit around the player's chest at the user's chosen yaw/pitch/distance.
    const t = target.current;
    t.set(playerPosition.x, playerPosition.y + targetHeight.current, playerPosition.z);
    const sp = Math.sin(pitch.current);
    const cp = Math.cos(pitch.current);
    const r = dist.current;
    state.camera.position.set(
      t.x + r * sp * Math.sin(yaw.current),
      t.y + r * cp,
      t.z + r * sp * Math.cos(yaw.current),
    );
    state.camera.lookAt(t);
    // Ease the FOV toward the phase's authored value.
    const cam = state.camera as PerspectiveCamera;
    if (Math.abs(cam.fov - fovTarget.current) > 0.01) { cam.fov += (fovTarget.current - cam.fov) * a; cam.updateProjectionMatrix(); }
    // Keep OrbitControls' target on the player so switching to Edit Mode (F1) keeps the view
    // centred on the player instead of snapping to the world origin (then you can see + click it).
    const c = controlsRef.current;
    if (c) c.target.copy(t);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      // Only active in Edit Mode; in play mode the follow logic above drives the camera.
      enabled={editMode}
      enablePan={editMode}
      enableRotate={!(editMode && terrainTool !== 'none') || terrainShiftHeld}
      minDistance={0.5}
      maxDistance={Infinity}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI}
      mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
      enableDamping
      dampingFactor={0.1}
    />
  );
};
