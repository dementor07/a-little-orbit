// Small, DOM-free motion helpers shared by the orbit moment and its tests.

// One semi-implicit spring step. Underdamped on purpose: the moon swings past home once before settling.
export function springStep(position, velocity, target, dt, stiffness = 22, damping = 3) {
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let s = 0; s < steps; s++) {
    for (const axis of ["x", "y", "z"]) {
      const force =
        stiffness * (target[axis] - position[axis]) - damping * velocity[axis];
      velocity[axis] += force * h;
      position[axis] += velocity[axis] * h;
    }
  }
}

// Pulling gets harder the further you go, and never passes the limit.
export function rubberBand(distance, limit) {
  return limit * Math.tanh(distance / limit);
}

export function lerpAngle(from, to, amount) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * amount;
}
