import { RigidBody } from '@react-three/rapier';
import { useUiStore } from '../../stores/uiStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import type { BasePart } from '../../types/game/base';

// Renders every editable base-layout part. EDIT MODE: each part is wrapped in the kit's DataBackedPlacement
// so it's click-selectable + gizmo-movable, writing the new position back to the store (numeric fields in
// the 🏗 Base tab + gizmo stay in sync). PLAY MODE: parts render with their collider (reused Rapier
// helpers); the lift platform is owned by LiftPlatform, so it's skipped here in play.

const partKey = (id: string) => `base#${id}`;

// The visual (no placement transform) — a normalised GLB when assetId is set, else a primitive box.
const PartVisual = ({ part }: { part: BasePart }) => {
  if (part.assetId && getModelAsset(part.assetId)) {
    return (
      <group rotation={part.rotation} scale={part.scale}>
        <NormalizedGlbModel assetId={part.assetId} target={part.modelTarget && part.modelTarget > 0 ? part.modelTarget : undefined} />
      </group>
    );
  }
  const emissive = part.kind === 'warning_light' || part.kind === 'base_exit';
  return (
    <group rotation={part.rotation} scale={part.scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={part.size} />
        <meshStandardMaterial
          color={part.color}
          emissive={emissive ? part.color : '#000000'}
          emissiveIntensity={emissive ? 0.6 : 0}
        />
      </mesh>
    </group>
  );
};

export const BaseLayoutLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const parts = useEditorBaseLayoutStore((s) => s.items);
  const update = useEditorBaseLayoutStore((s) => s.update);
  const remove = useEditorBaseLayoutStore((s) => s.remove);

  return (
    <>
      {parts.map((part) => {
        // The lift platform is rendered + animated by LiftPlatform in play mode.
        if (!editMode && part.kind === 'lift_platform') return null;

        if (editMode) {
          return (
            <DataBackedPlacement
              key={part.id}
              objKey={partKey(part.id)}
              position={part.position}
              onMove={(pos) => update(part.id, { position: pos })}
              onDelete={() => remove(part.id)}
              color="#38bdf8"
            >
              <PartVisual part={part} />
            </DataBackedPlacement>
          );
        }

        if (part.collision === 'none') {
          return (
            <group key={part.id} position={part.position}>
              <PartVisual part={part} />
            </group>
          );
        }
        return (
          <RigidBody key={part.id} type="fixed" colliders={part.collision} position={part.position}>
            <PartVisual part={part} />
          </RigidBody>
        );
      })}
    </>
  );
};
