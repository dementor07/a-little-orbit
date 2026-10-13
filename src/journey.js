import { clamp01, ease, logLerp } from "./ease.js";

// The camera's journey between scales, written as data: each timeline is a set of tracks
// (a value moving from -> to between t0 and t1 with an easing) and named beats.
// The runner is pure, so the whole choreography can be tested without a browser.

const T = (key, from, to, t0, t1, curve = "travel", log = false) => ({ key, from, to, t0, t1, curve, log });

export const timelines = {
  // Leaving the air: a huge Earth fills the lower frame like a horizon, then falls away into a globe.
  liftoff: {
    duration: 2.4,
    tracks: [
      T("solarZoom", 7, 1, 0, 1.8, "arrive", true),
      T("solarLift", -4.6, 0, 0, 1.8, "arrive"),
      T("home", 1, 0, 0.1, 1.2),
      T("space", 0, 1, 0.2, 1.6),
      T("sun", 0, 1, 0.5, 1.7),
      T("band", 0, 0.45, 0.6, 2.2),
      T("lights", 0, 1, 0, 1.4),
    ],
    beats: [{ at: 2.4, name: "arrive" }],
  },
  // The Pale Blue Dot: Earth and Moon shrink to two dots; the Milky Way band you saw from
  // inside turns into the galaxy you are leaving, and "us" lands on its spur.
  pullout: {
    duration: 6.3,
    tracks: [
      T("solarZoom", 1, 1.03, 0, 0.2, "settle", true),
      T("solarZoom", 1.03, 0.07, 0.2, 2.3, "travel", true),
      T("dots", 0, 1, 1.6, 2.1),
      T("dotsAnchor", 0, 0, 0, 0.1, "linear"),
      T("dotsAnchor", 0, 1, 4.6, 5.8),
      T("usTag", 0, 1, 2.4, 2.7),
      T("usTag", 1, 0, 5.7, 6.2),
      T("band", 0.45, 0.65, 0.2, 2.1),
      T("band", 0.65, 0, 3.3, 4.7),
      T("sun", 1, 0, 2.6, 4.4),
      T("space", 1, 0, 3.2, 4.8),
      T("galaxy", 0, 1, 2.9, 4.3),
      T("galaxyOrient", 0, 1, 3.1, 5.6),
      T("galaxyScale", 6, 1, 2.9, 5.8, "travel", true),
      T("galaxyLock", 1, 0, 4.6, 5.9),
      T("lights", 1, 0, 4.0, 5.5),
      T("moonShow", 1, 1, 0, 2.0, "linear"),
      T("moonShow", 1, 0, 2.0, 2.3),
    ],
    beats: [
      { at: 2.2, name: "heartbeat" },
      { at: 6.3, name: "arrive" },
    ],
  },
  // The rush home is about five times faster than the trip out. The two dots slide together
  // and become the candle flame.
  rushHome: {
    duration: 2.6,
    tracks: [
      T("galaxyScale", 1, 7, 0.15, 1.2, "travelShort", true),
      T("galaxy", 1, 0, 0.2, 1.0),
      T("dots", 1, 1, 0, 1.15, "linear"),
      T("dots", 1, 0, 1.15, 1.4),
      T("dotsAnchor", 1, 2, 0.35, 1.1, "travelShort"),
      T("dotsSep", 1, 0, 1.0, 1.3, "settle"),
      T("home", 0, 1, 0.6, 1.5),
      T("moonShow", 0, 1, 1.1, 1.8),
      T("flame", 0, 1, 1.1, 1.5, "arrive"),
      T("cakeShow", 0, 1, 1.0, 1.4, "arrive"),
      T("cakeTilt", 1, 0, 1.2, 2.2, "travelShort"),
    ],
    beats: [{ at: 2.6, name: "arrive" }],
  },
  // Her wish rides out to the edge of everything, and then everything comes home to her.
  finale: {
    duration: 16.4,
    tracks: [
      T("dotsAnchor", 2, 3, 0.4, 1.4, "arrive"),
      T("dots", 0, 1, 0.2, 0.6),
      T("dotsSep", 0, 0, 0, 1.4, "linear"),
      T("cakeSink", 0, 1, 0.5, 1.4, "leave"),
      T("home", 1, 0, 0.5, 1.6),
      T("moonShow", 1, 0, 0.5, 1.2),
      T("dotsSep", 0, 1, 1.4, 1.75, "settle"),
      T("galaxy", 0, 1, 1.7, 2.4),
      T("galaxyOrient", 1, 1, 0, 0.1, "linear"),
      T("galaxyLock", 1, 1, 0, 0.1, "linear"),
      T("galaxyScale", 7, 1, 1.7, 2.9, "arrive", true),
      T("galaxyScale", 1, 0.05, 3.4, 5.6, "travel", true),
      T("galaxy", 1, 0, 4.4, 5.4),
      T("web", 0, 1, 4.2, 5.6),
      T("webGather", 0, 1, 4.2, 5.8, "travel"),
      T("dotsAnchor", 3, 4, 4.6, 5.6),
      T("usTag", 0, 1, 5.9, 6.2),
      T("usTag", 1, 0, 7.0, 7.4),
      T("webHeart", 0, 1, 7.0, 9.6),
      T("webFlow", 0, 1, 10.8, 13.0, "travel"),
      T("veil", 0, 1, 12.6, 13.2),
      T("veil", 1, 0, 13.2, 13.9),
      T("charm", 0, 1, 12.8, 13.4, "arrive"),
      T("web", 1, 0, 13.0, 13.6),
      T("dots", 1, 0, 12.9, 13.3),
      T("cakeSink", 1, 0, 13.0, 14.2, "arrive"),
      T("home", 0, 1, 13.0, 14.0),
      T("moonShow", 0, 1, 13.2, 14.0),
    ],
    beats: [
      { at: 0.05, name: "blown" },
      { at: 5.0, name: "silence" },
      { at: 7.0, name: "line" },
      { at: 13.3, name: "celebrate" },
      { at: 14.4, name: "home" },
      { at: 15.6, name: "kiss" },
    ],
  },
};

// Reduced motion keeps the story but trades travel for short crossfades.
const REDUCED_DURATION = 0.6;

export function sampleTrack(track, t) {
  const span = Math.max(1e-6, track.t1 - track.t0);
  const x = ease[track.curve](clamp01((t - track.t0) / span));
  return track.log ? logLerp(track.from, track.to, x) : track.from + (track.to - track.from) * x;
}

// Value of `key` at time t: the latest track that has started wins; before any track starts,
// the first track's starting value holds.
export function sampleKey(timeline, key, t) {
  const tracks = timeline.tracks.filter((track) => track.key === key);
  if (!tracks.length) return undefined;
  let active = tracks[0];
  for (const track of tracks) if (t >= track.t0) active = track;
  return sampleTrack(active, t);
}

export function createJourney({ reduced = false } = {}) {
  let current = null,
    name = "",
    t = 0,
    speed = 1,
    fired = new Set(),
    listeners = [];
  return {
    get busy() {
      return Boolean(current);
    },
    get name() {
      return name;
    },
    get time() {
      return t;
    },
    setReduced(value) {
      reduced = value;
    },
    has(key) {
      return Boolean(current && current.tracks.some((track) => track.key === key));
    },
    value(key) {
      return current ? sampleKey(current, key, t) : undefined;
    },
    // With reduced motion, things that move or scale jump straight to where they land.
    endValue(key) {
      return current ? sampleKey(current, key, current.duration) : undefined;
    },
    onBeat(fn) {
      listeners.push(fn);
    },
    play(timelineName) {
      current = timelines[timelineName];
      name = timelineName;
      t = 0;
      fired = new Set();
      speed = reduced ? current.duration / REDUCED_DURATION : 1;
    },
    // A tap during travel hurries the journey along, never jumps it.
    hurry() {
      if (current && !reduced) speed = Math.max(speed, 3.5);
    },
    stop() {
      current = null;
      name = "";
    },
    update(dt) {
      if (!current) return;
      t += dt * speed;
      for (const beat of current.beats) {
        if (t >= beat.at && !fired.has(beat.name)) {
          fired.add(beat.name);
          listeners.forEach((fn) => fn(beat.name, name));
        }
      }
      if (t >= current.duration) {
        t = current.duration;
        current = null;
        name = "";
      }
    },
  };
}
