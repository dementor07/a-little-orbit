// Easing curves and small helpers shared by the journey between scales. DOM-free and tested.

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Arrivals decelerate hard (expo-out); settles are gentle (quint-out); travel is symmetric.
export const ease = {
  linear: (x) => x,
  arrive: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  settle: (x) => 1 - Math.pow(1 - x, 5),
  travel: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  travelShort: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  leave: (x) => x * x * x,
};

// Scales are multiplicative, so they are interpolated in log space.
export const logLerp = (a, b, t) => a * Math.pow(b / a, t);
