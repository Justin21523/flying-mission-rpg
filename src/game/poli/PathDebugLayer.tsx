import { Line, Text } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
import { useEditorPathStore } from '../../stores/editorPathStore';
import { debugPoints } from '../path/pathCurve';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import type { PathDefinition } from '../../types/path';
import { visiblePathDefinitions } from './pathDebugVisibility';

// POLI (Phase B) — debug rendering for curve-based paths. Edit Mode: matching paths draw as a bright
// CatmullRom line with a draggable handle per node (drag → updatePathNode → the cached curve rebuilds, so the
// line follows live); entry nodes are tinted green. Play Mode: lines render only when PATH_DEBUG is on (a
// testing aid). Sibling layer in AreaRenderer (kit seam #1). Full node authoring (add/remove/tangents) = Phase D.
const PATH_DEBUG = true; // show path lines in Play Mode too (flip off once authoring lands)

const PathLine = ({ def, color }: { def: PathDefinition; color: string }) => {
  const pts = debugPoints(def);
  if (pts.length < 2) return null;
  return <Line points={pts} color={color} lineWidth={3} depthTest={false} transparent opacity={0.9} />;
};

const PathNodes = ({ def }: { def: PathDefinition }) => {
  const updatePathNode = useEditorPathStore((s) => s.updatePathNode);
  const nodes = def.nodes ?? [];
  return (
    <>
      {nodes.map((n, i) => {
        const isEntry = def.entryNodeIds.includes(n.id);
        const isExit = def.exitNodeIds.includes(n.id);
        const color = isEntry ? '#34d399' : isExit ? '#f97316' : '#22d3ee';
        return (
          <DataBackedPlacement
            key={`${def.id}#${n.id}`}
            objKey={`${def.id}#node#${n.id}`}
            position={n.position}
            color={color}
            onMove={(p) => updatePathNode(def.id, n.id, p)}
            onDelete={() => useEditorPathStore.getState().removeNode(def.id, n.id)}
          >
            <mesh position={[0, 0.4, 0]} renderOrder={998} onUpdate={(self) => { const mm = self.material as { depthTest?: boolean }; mm.depthTest = false; }}>
              <sphereGeometry args={[0.7, 14, 12]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} depthTest={false} />
            </mesh>
            {/* numbered handle (1-based) like the road editor, so the order is obvious */}
            <Text position={[0, 1.0, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000" raycast={() => null} depthOffset={-10}>
              {`${i + 1}`}
            </Text>
          </DataBackedPlacement>
        );
      })}
    </>
  );
};

export const PathDebugLayer = ({ areaId, pathId }: { areaId: string; pathId?: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const paths = visiblePathDefinitions(useEditorPathStore((s) => s.paths), areaId, pathId);
  if (paths.length === 0) return null;
  if (!editMode && !PATH_DEBUG) return null;

  return (
    <>
      {paths.map((def) => (
        <group key={def.id}>
          <PathLine def={def} color={def.id.includes('curve') ? '#f59e0b' : '#a855f7'} />
          {editMode && <PathNodes def={def} />}
        </group>
      ))}
    </>
  );
};
