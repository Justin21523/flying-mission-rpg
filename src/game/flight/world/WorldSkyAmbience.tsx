import { Sky } from '@react-three/drei';

// Open-sky ambience for the high-altitude world flight. The ground-area DynamicAmbience uses a short fog
// range that whites out everything at altitude — instead we paint a real blue Sky dome with bright lights
// and only a very FAR, soft fog, so the route reads clearly: open blue sky above, the character visible in
// the centre, and the cloud floor (CloudField) below. No copyrighted art — drei's procedural Sky.
export const WorldSkyAmbience = () => (
  <>
    <color attach="background" args={['#7fb8ee']} />
    {/* far, soft haze so distant clouds fade gently but the route stays clear (not a whiteout) */}
    <fog attach="fog" args={['#cfe7ff', 2200, 9000]} />
    <Sky sunPosition={[120, 80, 80]} turbidity={5} rayleigh={1.1} mieCoefficient={0.005} mieDirectionalG={0.8} />
    <ambientLight intensity={0.75} />
    <hemisphereLight color="#cfe8ff" groundColor="#9fb6c9" intensity={0.7} />
    <directionalLight position={[80, 130, 50]} intensity={1.15} />
  </>
);
