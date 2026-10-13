import test from 'node:test';
import assert from 'node:assert/strict';
import { springStep, rubberBand, lerpAngle } from '../src/motion.js';
import { kissSlots, pickKissSlot } from '../src/kisses.js';
import { generateGalaxy } from '../src/galaxy.js';
import { heartPoint } from '../src/heart.js';

test('the moon swings past home once, then always comes back', () => {
  const position = { x: 2.2, y: 0.4, z: 0 }, velocity = { x: 0, y: 0, z: 0 }, home = { x: 0, y: 0, z: 0 };
  let crossed = false;
  for (let i = 0; i < 240; i++) {
    springStep(position, velocity, home, 1 / 60);
    if (position.x < 0) crossed = true;
  }
  assert.ok(crossed, 'underdamped: it overshoots a little');
  assert.ok(Math.hypot(position.x, position.y, position.z) < 0.035, 'settled within 4 seconds');
});

test('pulling is elastic and bounded', () => {
  assert.ok(rubberBand(0.5, 2.3) < 0.5);
  assert.ok(rubberBand(10, 2.3) < 2.3);
  assert.ok(rubberBand(2, 2.3) > rubberBand(1, 2.3));
  assert.ok(Math.abs(lerpAngle(3.1, -3.1, 0.5) - Math.PI) < 0.05, 'turns the short way round');
});

test('kiss places sit on the heart without overlapping', () => {
  const pts = Array.from({ length: 2001 }, (_, i) => heartPoint((i / 2000) * Math.PI * 2));
  const halfWidth = (y) => Math.max(...pts.filter((p, i) => i < 2000 && (p.y - y) * (pts[i + 1].y - y) <= 0).map((p) => Math.abs(p.x)));
  kissSlots.forEach((a, i) => {
    assert.ok(Math.abs(a.x) + 0.17 < halfWidth(a.y), `slot ${i} inside the heart`);
    kissSlots.forEach((b, j) => {
      if (j > i) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 0.4, `slots ${i} and ${j} apart`);
    });
  });
});

test('kisses fill free places near the touch, then replace the oldest', () => {
  assert.equal(pickKissSlot([], null), 0);
  assert.equal(pickKissSlot([0], { x: 0.5, y: 0.4 }), 2);
  assert.equal(pickKissSlot([0, 2], { x: 0.5, y: 0.4 }), 1);
  assert.equal(pickKissSlot([3, 1, 0, 2, 4, 5], { x: 0, y: 0 }), 3);
});

test('the galaxy is deterministic and finite', () => {
  const a = generateGalaxy({ count: 500, seed: 3 }), b = generateGalaxy({ count: 500, seed: 3 });
  assert.deepEqual(a.positions, b.positions);
  assert.equal(a.positions.length, 1500);
  assert.ok([...a.positions, ...a.colors, ...a.scales].every(Number.isFinite));
});
