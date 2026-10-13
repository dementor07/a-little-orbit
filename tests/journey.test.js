import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourney, sampleKey, timelines } from '../src/journey.js';
import { ease, logLerp, smoothstep } from '../src/ease.js';
import { codaFor, moonAge, moonLit } from '../src/moonphase.js';

const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('easings start at 0 and end at 1', () => {
  for (const [name, fn] of Object.entries(ease)) {
    assert.ok(close(fn(0), 0), `${name}(0)`);
    assert.ok(close(fn(1), 1), `${name}(1)`);
  }
  assert.ok(close(logLerp(7, 1, 0), 7) && close(logLerp(7, 1, 1), 1));
  assert.equal(smoothstep(0, 1, -1), 0);
  assert.equal(smoothstep(0, 1, 2), 1);
});

// Each journey must land exactly where the destination scene rests, so nothing pops.
const landings = {
  liftoff: { solarZoom: 1, solarLift: 0, home: 0, space: 1, sun: 1, band: 0.45, lights: 1 },
  pullout: { galaxy: 1, galaxyScale: 1, galaxyOrient: 1, galaxyLock: 0, dots: 1, dotsAnchor: 1, usTag: 0, band: 0, sun: 0, space: 0, lights: 0 },
  rushHome: { galaxy: 0, dots: 0, home: 1, flame: 1, cakeShow: 1, cakeTilt: 0, moonShow: 1 },
  finale: { charm: 1, web: 0, dots: 0, home: 1, moonShow: 1, cakeSink: 0, veil: 0, galaxy: 0, usTag: 0 },
};
for (const [name, expected] of Object.entries(landings)) {
  test(`${name} lands on its resting values`, () => {
    const timeline = timelines[name];
    for (const [key, value] of Object.entries(expected)) {
      const end = sampleKey(timeline, key, timeline.duration);
      assert.ok(end !== undefined, `${name} has a ${key} track`);
      assert.ok(close(end, value, 1e-9), `${name}.${key} ends at ${end}, expected ${value}`);
    }
  });
}

test('tracks are well formed and inside their timeline', () => {
  for (const [name, timeline] of Object.entries(timelines)) {
    for (const track of timeline.tracks) {
      assert.ok(track.t1 >= track.t0, `${name}.${track.key} has t1 >= t0`);
      assert.ok(track.t1 <= timeline.duration + 1e-9, `${name}.${track.key} ends inside the timeline`);
      assert.ok(ease[track.curve], `${name}.${track.key} uses a known curve`);
      if (track.log) assert.ok(track.from > 0 && track.to > 0, `${name}.${track.key} log track is positive`);
    }
  }
});

test('beats fire once, in order, and the journey ends', () => {
  const journey = createJourney();
  const heard = [];
  journey.onBeat((name, timeline) => heard.push(`${timeline}:${name}`));
  journey.play('finale');
  for (let i = 0; i < 2000 && journey.busy; i++) journey.update(1 / 60);
  assert.equal(journey.busy, false);
  assert.deepEqual(heard, timelines.finale.beats.map((b) => `finale:${b.name}`));
});

test('a tap hurries the journey but never skips it', () => {
  const journey = createJourney();
  journey.play('pullout');
  journey.update(1);
  journey.hurry();
  journey.update(0.5);
  assert.ok(close(journey.time, 1 + 0.5 * 3.5));
  assert.ok(journey.busy);
});

test('reduced motion turns every journey into a short crossfade', () => {
  const journey = createJourney({ reduced: true });
  journey.play('finale');
  let elapsed = 0;
  while (journey.busy && elapsed < 5) {
    journey.update(1 / 60);
    elapsed += 1 / 60;
  }
  assert.ok(elapsed <= 0.62, `finished in ${elapsed.toFixed(2)} s`);
});

test('the coda only says "look up tonight" when it is true', () => {
  const birthdayEvening = new Date(Date.UTC(2026, 9, 14, 14, 30));
  assert.match(codaFor(birthdayEvening)[0], /^Look up tonight/);
  assert.ok(moonAge(birthdayEvening) > 3 && moonAge(birthdayEvening) < 5, 'a young waxing Moon');
  assert.ok(moonLit(birthdayEvening) > 0.08 && moonLit(birthdayEvening) < 0.3, 'a thin crescent');
  assert.match(codaFor(new Date(Date.UTC(2026, 11, 1)))[0], /^Same moon, wherever you are/);
  assert.match(codaFor(new Date(Date.UTC(2026, 9, 25)))[0], /^Same moon, wherever you are/);
});
