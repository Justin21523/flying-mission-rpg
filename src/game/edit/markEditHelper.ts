import type { Object3D } from 'three';

// Mark a mesh (esp. a troika <Text>) so EditableObject's selection-tint traversal SKIPS it. Cloning troika's
// derived material — which the tint does to every child mesh on select — corrupts it and crashes the render
// loop ("baseMaterial.addEventListener is not a function"). Use as a ref on any <Text> placed inside an
// EditableObject: <Text ref={markEditHelper} …/>.
export const markEditHelper = (o: Object3D | null) => { if (o) o.userData.__editHelper = true; };
