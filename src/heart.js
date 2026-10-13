// A symmetric heart in uniform world units, never stretched to the screen ratio.
export function heartPoint(t) {
  return {
    x: Math.sin(t) ** 3,
    y:
      ((13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t) +
        2.54) /
        14.46) *
      0.88,
  };
}
