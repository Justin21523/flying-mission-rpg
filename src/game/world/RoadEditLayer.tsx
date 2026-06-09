import { useEffect, useRef, useState } from 'react';
import { Line, Text, TransformControls } from '@react-three/drei';
import type { Mesh, Object3D } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { useEditorTrafficStore, type EditorRoad } from '../../stores/editorTrafficStore';

// POLI — Edit-Mode road authoring. Every road in the area is drawn as a bright route line through its
// waypoints (closed loop when road.closed) with a numbered handle at each node. Clicking a handle selects it
// (editorTrafficStore.nodeSel) and a translate gizmo attaches; dragging writes straight back to the road
// waypoints, so the line, the tiled road models and the circulating vehicles all update live. Edit mode only.

const ROAD_COLORS = ['#f59e0b', '#22d3ee', '#a855f7', '#34d399', '#f472b6', '#60a5fa'];

const NodeHandle = ({ road, index, color, selected, onAttach }: {
  road: EditorRoad; index: number; color: string; selected: boolean; onAttach: (o: Object3D | null) => void;
}) => {
  const ref = useRef<Mesh>(null);
  const wp = road.waypoints[index];
  // Register this handle as the gizmo target whenever it is the selected node (click- or tab-driven).
  useEffect(() => { if (selected) onAttach(ref.current); }, [selected, onAttach]);
  return (
    <mesh
      ref={ref}
      position={wp}
      onClick={(e) => { e.stopPropagation(); useEditorTrafficStore.getState().selectRoadNode(road.id, index); }}
    >
      <sphereGeometry args={[selected ? 0.6 : 0.42, 16, 16]} />
      <meshBasicMaterial color={selected ? '#ffffff' : color} depthTest={false} transparent opacity={0.95} />
      <Text position={[0, 0.9, 0]} fontSize={0.5} color={color} anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000" depthOffset={-10}>
        {`${index + 1}`}
      </Text>
    </mesh>
  );
};

const RoadEntity = ({ road, color, onAttach }: { road: EditorRoad; color: string; onAttach: (o: Object3D | null) => void }) => {
  const nodeSel = useEditorTrafficStore((s) => s.nodeSel);
  const pts = road.waypoints.map((w) => [w[0], w[1] + 0.05, w[2]] as [number, number, number]);
  const linePts = road.closed === false ? pts : [...pts, pts[0]]; // default: closed loop
  return (
    <group>
      {linePts.length >= 2 && <Line points={linePts} color={color} lineWidth={3} dashed={false} depthTest={false} transparent opacity={0.9} />}
      {road.waypoints.map((_, i) => (
        <NodeHandle key={i} road={road} index={i} color={color} selected={nodeSel?.roadId === road.id && nodeSel.index === i} onAttach={onAttach} />
      ))}
    </group>
  );
};

export const RoadEditLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const roads = useEditorTrafficStore((s) => s.roads).filter((r) => r.areaId === areaId);
  const nodeSel = useEditorTrafficStore((s) => s.nodeSel);
  const [selObj, setSelObj] = useState<Object3D | null>(null);

  if (!editMode || roads.length === 0) return null;
  return (
    <>
      {roads.map((road, i) => (
        <RoadEntity key={road.id} road={road} color={ROAD_COLORS[i % ROAD_COLORS.length]} onAttach={setSelObj} />
      ))}
      {nodeSel && selObj && (
        <TransformControls
          object={selObj}
          mode="translate"
          onObjectChange={() => {
            if (!selObj) return;
            useEditorTrafficStore.getState().updateRoadWaypoint(nodeSel.roadId, nodeSel.index, [selObj.position.x, selObj.position.y, selObj.position.z]);
          }}
        />
      )}
    </>
  );
};
