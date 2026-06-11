// R super-speed mode (toggle). A plain mutable singleton (like dashImpulse) so the controller writes it on a
// key press and the afterimage layer reads it inside its own useFrame WITHOUT subscribing (no re-renders).
// While active: the robot keeps surging forward along its heading (A/D steer it, Shift goes faster) and the
// ground afterimage layer streams translucent clone ghosts.
export const superBoost = {
  active: false,
};

export const SUPER_BOOST_SPEED = 22; // sustained forward speed (m/s) while boosting
export const SUPER_BOOST_TURN = 2.6; // steering rate (rad/s) from A/D while boosting
export const SUPER_BOOST_MULT = 2.2; // playerMotion.superMult applied so normal WASD is also fast while boosting
