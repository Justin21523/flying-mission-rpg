import { useEffect, useMemo, useRef } from 'react';
import { Line, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { useFlightPhaseStore } from '../../stores/game/flightPhaseStore';
import { useFlightTimelineStore } from '../../stores/game/flightTimelineStore';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { samplePathPolyline, evaluateFlightState } from './flightPhaseRuntime';
import type { FlightCameraKeyframe, FlightPathNode, FlightPhaseConfig } from '../../types/game/flightPhase';
import type { Vec3Tuple } from '../../types/path';

// Edit-Mode 3D gizmos for the active Flight Phase: the path curve line; a draggable handle per node (move →
// flightPhaseStore.moveNode → curve rebuilds live) with name + order label, influence-radius ring, speed-hint
// ring, direction arrow, event badge; bezier curve handles for the selected node; a camera-path line + per-
// keyframe draggable proxies (with a draggable lookAt-target handle for the selected one); a moving playhead.
// Node drags reuse the kit's DataBackedPlacement (select + shift-multiselect + batch drag). Selection mirrors
// into flightTimelineStore so the editor panels track the same node/keyframe.
const NODE_KEY = (pathId: string, nodeId: string) => `${pathId}#fnode#${nodeId}`;
const HIN_KEY = (pathId: string, nodeId: string) => `${pathId}#fhin#${nodeId}`;
const HOUT_KEY = (pathId: string, nodeId: string) => `${pathId}#fhout#${nodeId}`;
const CAM_KEY = (phaseId: string, id: string) => `${phaseId}#fcam#${id}`;
const LOOK_KEY = (phaseId: string, id: string) => `${phaseId}#flook#${id}`;

const _a = new Vector3();
const _b = new Vector3();
const add = (p: Vec3Tuple, d: Vec3Tuple): Vec3Tuple => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
const sub = (p: Vec3Tuple, q: Vec3Tuple): Vec3Tuple => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];

const NodeGizmo = ({ phase, node, index }: { phase: FlightPhaseConfig; node: FlightPathNode; index: number }) => {
  const next = phase.path.nodes[(index + 1) % phase.path.nodes.length];
  const arrowYaw = useMemo(() => {
    if (!next) return 0;
    _a.set(...node.position); _b.set(...next.position);
    return Math.atan2(_b.x - _a.x, _b.z - _a.z);
  }, [node.position, next]);
  const isEntry = index === 0;
  const isExit = index === phase.path.nodes.length - 1 && !phase.path.closedLoop;
  const color = isEntry ? '#34d399' : isExit ? '#f97316' : '#22d3ee';
  const hasEvents = node.eventIds.length > 0;
  const influence = node.influenceRadius ?? 8;
  return (
    <DataBackedPlacement
      objKey={NODE_KEY(phase.pathId, node.nodeId)}
      position={node.position}
      color={color}
      onMove={(p) => useFlightPhaseStore.getState().moveNode(phase.phaseId, node.nodeId, p)}
      onDelete={() => useFlightPhaseStore.getState().removeNode(phase.phaseId, node.nodeId)}
    >
      <mesh renderOrder={998} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
        <sphereGeometry args={[0.9, 16, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} depthTest={false} />
      </mesh>
      {/* larger invisible hit sphere so nodes are easy to click even at distance */}
      <mesh>
        <sphereGeometry args={[1.7, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* influence-radius corridor ring (steering allowance) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={996} raycast={() => null} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
        <torusGeometry args={[Math.max(0.5, influence), 0.06, 8, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} depthTest={false} />
      </mesh>
      {/* speed-hint ring (bigger = faster) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={997} raycast={() => null} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
        <torusGeometry args={[1.2 + node.speed * 0.05, 0.09, 8, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthTest={false} />
      </mesh>
      {/* direction arrow toward next node */}
      {next && (
        <mesh rotation={[Math.PI / 2, 0, -arrowYaw]} renderOrder={997} raycast={() => null} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
          <coneGeometry args={[0.5, 1.6, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} depthTest={false} />
        </mesh>
      )}
      {hasEvents && (
        <mesh position={[0, 1.8, 0]} renderOrder={999} raycast={() => null} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
          <octahedronGeometry args={[0.4]} />
          <meshBasicMaterial color="#fbbf24" depthTest={false} />
        </mesh>
      )}
      <Text position={[0, 1.4, 0]} fontSize={0.5} color={color} anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000" raycast={() => null} depthOffset={-10}>
        {`${index + 1} ${node.nodeName}`}
      </Text>
    </DataBackedPlacement>
  );
};

// Bezier handles for the SELECTED node (only meaningful when the path is bezier). Drag → relative offset.
const NodeHandles = ({ phase, node }: { phase: FlightPhaseConfig; node: FlightPathNode }) => {
  if (phase.path.curveType !== 'bezier') return null;
  const handle = (which: 'in' | 'out', rel: Vec3Tuple | undefined) => {
    if (!rel) return null;
    const world = add(node.position, rel);
    const key = which === 'in' ? HIN_KEY(phase.pathId, node.nodeId) : HOUT_KEY(phase.pathId, node.nodeId);
    return (
      <>
        <Line points={[node.position, world]} color="#f0abfc" lineWidth={1.5} depthTest={false} transparent opacity={0.8} />
        <DataBackedPlacement
          objKey={key}
          position={world}
          color="#f0abfc"
          onMove={(p) => useFlightPhaseStore.getState().updateNode(phase.phaseId, node.nodeId, which === 'in' ? { handleIn: sub(p, node.position) } : { handleOut: sub(p, node.position) })}
        >
          <mesh renderOrder={999} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#f0abfc" emissive="#f0abfc" emissiveIntensity={0.6} depthTest={false} />
          </mesh>
        </DataBackedPlacement>
      </>
    );
  };
  return <>{handle('in', node.handleIn)}{handle('out', node.handleOut)}</>;
};

const CameraKeyGizmo = ({ phase, key0 }: { phase: FlightPhaseConfig; key0: FlightCameraKeyframe }) => (
  <DataBackedPlacement
    objKey={CAM_KEY(phase.phaseId, key0.keyframeId)}
    position={key0.position}
    color="#a855f7"
    onMove={(p) => useFlightPhaseStore.getState().updateCameraKey(phase.phaseId, key0.keyframeId, { position: p })}
    onDelete={() => useFlightPhaseStore.getState().removeCameraKey(phase.phaseId, key0.keyframeId)}
  >
    <mesh renderOrder={998} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
      <boxGeometry args={[1.1, 0.8, 1.4]} />
      <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} depthTest={false} />
    </mesh>
    <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]} renderOrder={998} raycast={() => null} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
      <coneGeometry args={[0.7, 1.2, 4]} />
      <meshBasicMaterial color="#c4b5fd" transparent opacity={0.6} depthTest={false} wireframe />
    </mesh>
    <Text position={[0, 1.1, 0]} fontSize={0.45} color="#c4b5fd" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000" raycast={() => null} depthOffset={-10}>
      {`🎥 ${key0.time.toFixed(1)}s`}
    </Text>
  </DataBackedPlacement>
);

// Draggable lookAt-target handle for the SELECTED camera keyframe (+ a line from the camera to the target).
const CameraLookAt = ({ phase, key0 }: { phase: FlightPhaseConfig; key0: FlightCameraKeyframe }) => {
  if (!key0.lookAtTarget) return null;
  return (
    <>
      <Line points={[key0.position, key0.lookAtTarget]} color="#c4b5fd" lineWidth={1.5} depthTest={false} transparent opacity={0.7} dashed dashSize={1.2} gapSize={0.8} />
      <DataBackedPlacement
        objKey={LOOK_KEY(phase.phaseId, key0.keyframeId)}
        position={key0.lookAtTarget}
        color="#7dd3fc"
        onMove={(p) => useFlightPhaseStore.getState().updateCameraKey(phase.phaseId, key0.keyframeId, { lookAtTarget: p })}
      >
        <mesh renderOrder={999} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
          <octahedronGeometry args={[0.55]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#7dd3fc" emissiveIntensity={0.6} depthTest={false} />
        </mesh>
      </DataBackedPlacement>
    </>
  );
};

const Playhead = ({ phase }: { phase: FlightPhaseConfig }) => {
  const dot = useRef<Group>(null);
  useFrame(() => {
    if (!dot.current) return;
    const st = evaluateFlightState(phase.path, useFlightTimelineStore.getState().currentTime);
    dot.current.position.set(...st.position);
  });
  return (
    <group ref={dot}>
      <mesh renderOrder={1000} raycast={() => null} onUpdate={(self) => { (self.material as { depthTest?: boolean }).depthTest = false; }}>
        <sphereGeometry args={[0.6, 16, 14]} />
        <meshBasicMaterial color="#f0abfc" transparent opacity={0.85} depthTest={false} />
      </mesh>
    </group>
  );
};

export const FlightPathGizmoLayer = () => {
  const phase = useFlightPhaseStore((s) => s.phases.find((p) => p.phaseId === s.activePhaseId) ?? s.phases[0]);
  const showPath = useFlightTimelineStore((s) => s.showPathGizmos);
  const showCam = useFlightTimelineStore((s) => s.showCameraGizmos);
  const selectedNodeId = useFlightTimelineStore((s) => s.selectedNodeId);
  const selectedKeyframeId = useFlightTimelineStore((s) => s.selectedKeyframeId);
  const polyline = useMemo(() => (phase ? samplePathPolyline(phase.path, phase.path.previewResolution || 64) : []), [phase]);
  const camPath = useMemo(() => (phase ? [...phase.cameraKeyframes].sort((a, b) => a.time - b.time).map((k) => k.position) : []), [phase]);

  // Mirror node/camera gizmo selection → flightTimelineStore so the panels track the same selection.
  useEffect(() => useWorldSelectStore.subscribe((s) => {
    const key = s.selectedKey;
    const tl = useFlightTimelineStore.getState();
    if (!key) return;
    const nodeM = key.match(/#fnode#(.+)$/);
    const camM = key.match(/#fcam#(.+)$/);
    if (nodeM && tl.selectedNodeId !== nodeM[1]) tl.selectNode(nodeM[1]);
    else if (camM && tl.selectedKeyframeId !== camM[1]) tl.selectKeyframe(camM[1]);
  }), []);

  if (!phase) return null;
  const selNode = phase.path.nodes.find((n) => n.nodeId === selectedNodeId);
  const selKey = phase.cameraKeyframes.find((k) => k.keyframeId === selectedKeyframeId);
  return (
    <group>
      {polyline.length >= 2 && <Line points={polyline} color="#a855f7" lineWidth={3} depthTest={false} transparent opacity={0.9} />}
      {showCam && camPath.length >= 2 && <Line points={camPath} color="#c4b5fd" lineWidth={1.5} depthTest={false} transparent opacity={0.5} dashed dashSize={1.5} gapSize={1} />}
      {showPath && phase.path.nodes.map((n, i) => <NodeGizmo key={n.nodeId} phase={phase} node={n} index={i} />)}
      {showPath && selNode && <NodeHandles phase={phase} node={selNode} />}
      {showCam && phase.cameraKeyframes.map((k) => <CameraKeyGizmo key={k.keyframeId} phase={phase} key0={k} />)}
      {showCam && selKey && <CameraLookAt phase={phase} key0={selKey} />}
      <Playhead phase={phase} />
    </group>
  );
};
