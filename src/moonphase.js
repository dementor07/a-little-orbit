// The real Moon on her birthday evening, for the closing whisper. Pure and tested.
const SYNODIC = 29.530589;
// New Moon of 10 Oct 2026, 15:50 UTC.
const NEW_MOON = Date.UTC(2026, 9, 10, 15, 50);
const BIRTHDAY = Date.UTC(2026, 9, 14, 12, 0);

export function moonAge(date) {
  const days = (date.getTime() - NEW_MOON) / 864e5;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}

export function moonLit(date) {
  return (1 - Math.cos((2 * Math.PI * moonAge(date)) / SYNODIC)) / 2;
}

// "Look up tonight" only when it is true: within three days of her birthday, Moon waxing.
export function codaFor(date) {
  const near = Math.abs(date.getTime() - BIRTHDAY) <= 3 * 864e5;
  const waxing = moonAge(date) < SYNODIC / 2;
  return near && waxing
    ? ["Look up tonight. Same moon,", "still coming back to you."]
    : ["Same moon, wherever you are.", "Still coming back to you."];
}
