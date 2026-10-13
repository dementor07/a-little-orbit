// Places for kisses on the heart charm's face, in the charm's local units.
// They are spaced so imprints sit side by side instead of piling into one blot.
export const kissSlots = [
  { x: 0, y: 0.05, angle: -0.07 },
  { x: -0.45, y: 0.38, angle: -0.21 },
  { x: 0.45, y: 0.4, angle: 0.24 },
  { x: -0.32, y: -0.22, angle: 0.17 },
  { x: 0.31, y: -0.24, angle: -0.17 },
  { x: 0, y: -0.5, angle: 0.07 },
];

// `occupied` lists slot indices oldest first. A touched kiss goes to the nearest free place;
// once every place is taken, the oldest kiss makes room for the new one.
export function pickKissSlot(occupied, point, slots = kissSlots) {
  const free = slots.map((_, i) => i).filter((i) => !occupied.includes(i));
  const choices = free.length ? free : [occupied[0]];
  if (!point) return choices[0];
  const distance = (i) => Math.hypot(slots[i].x - point.x, slots[i].y - point.y);
  return choices.reduce((best, i) => (distance(i) < distance(best) ? i : best));
}
