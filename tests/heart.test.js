import test from 'node:test';
import assert from 'node:assert/strict';
import { heartPoint } from '../src/heart.js';

test('the heart has mirrored lobes and a centred bottom tip', () => {
  for(let i=0;i<=1000;i++) {
    const t=i/1000*Math.PI;
    const left=heartPoint(t),right=heartPoint(Math.PI*2-t);
    assert.ok(Math.abs(left.x+right.x)<1e-10,'horizontal symmetry');
    assert.ok(Math.abs(left.y-right.y)<1e-10,'vertical symmetry');
    assert.ok(Number.isFinite(left.x)&&Number.isFinite(left.y));
  }
  assert.ok(Math.abs(heartPoint(Math.PI).x)<1e-10);
  assert.ok(heartPoint(Math.PI).y<heartPoint(0).y);
});

test('the heart outline closes without a seam',()=>{
  const first=heartPoint(0),last=heartPoint(Math.PI*2);
  assert.ok(Math.hypot(first.x-last.x,first.y-last.y)<1e-10);
});
