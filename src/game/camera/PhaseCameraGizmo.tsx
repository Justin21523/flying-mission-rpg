import { useRef, useState } from 'react';
import { TransformControls, Line } from '@react-three/drei';
import type { Group } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import { useEditorCameraStore } from '../../stores/game/editorCameraStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { DEFAULT_PHASE_CAMERA, cameraOffsetFromConfig, cameraConfigFromView } from '../../types/game/cameraConfig';
import { gizmoState } from '../edit/gizmoState';

// 🎥 Camera tab → 🎮 Gizmo: a draggable camera proxy that authors a phase's FollowCamera framing by EYE. The
// proxy sits at anchor(=look target at [0, targetHeight, 0]) + cameraOffsetFromConfig(cfg); dragging it
// re-derives distance/yaw/pitch (cameraConfigFromView) into editorCameraStore[phase] — the orbit-gizmo
// equivalent of "📸 Capture view". Shown only while you're IN the phase being edited (jump there to test).
// Edit-only; mounted in the FollowCamera scenes (BaseScene / DestinationScene).
export const PhaseCameraGizmo = () => {
  const editingPhase = useEditorCameraStore((s) => s.editingPhase);
  const cfg = useEditorCameraStore((s) => (editingPhase ? s.byPhase[editingPhase] : undefined));
  const phase = useGameStore((s) => s.phase);
  const [obj, setObj] = useState<Group | null>(null);
  const ctrlRef = useRef<TransformControlsImpl | null>(null);

  if (!editingPhase || editingPhase !== phase) return null;
  const c = cfg ?? DEFAULT_PHASE_CAMERA;
  const off = cameraOffsetFromConfig(c);
  const pos: [number, number, number] = [off[0], c.targetHeight + off[1], off[2]];

  const apply = () => {
    if (!obj) return;
    const next = cameraConfigFromView({ x: obj.position.x, y: obj.position.y, z: obj.position.z }, { x: 0, y: c.targetHeight, z: 0 }, c.fov);
    // keep the authored look-target height + fov; only the eye (distance/yaw/pitch) comes from the drag.
    useEditorCameraStore.getState().setPhase(editingPhase, { ...next, fov: c.fov, targetHeight: c.targetHeight });
  };

  return (
    <>
      {/* look-target marker (the followed subject stand-in) */}
      <mesh position={[0, c.targetHeight, 0]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <group ref={setObj} position={pos}>
        {/* camera proxy body */}
        <mesh>
          <boxGeometry args={[0.5, 0.4, 0.7]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.22, 0.4, 12]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
        {/* orbit handle line back to the look target */}
        <Line points={[[0, 0, 0], [-off[0], -off[1], -off[2]]]} color="#fbbf24" lineWidth={1} dashed dashScale={4} />
      </group>
      {obj && (
        <TransformControls
          ref={(ct) => {
            const ctrl = (ct as unknown as TransformControlsImpl) ?? null;
            if (ctrl) { ctrlRef.current = ctrl; gizmoState.controls = ctrl; }
            else { if (gizmoState.controls === ctrlRef.current) gizmoState.controls = null; ctrlRef.current = null; }
          }}
          object={obj}
          mode="translate"
          onObjectChange={apply}
        />
      )}
    </>
  );
};
