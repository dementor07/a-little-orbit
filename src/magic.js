import * as THREE from "three";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";
import { heartPoint } from "./heart.js";
import { kissSlots, pickKissSlot } from "./kisses.js";

// A small, fixed pool keeps all touch magic bounded on mobile GPUs.
export function createMagic({ scene, camera, host, moon, flame }) {
  let alive = true,
    finale = false,
    finaleMix = 0,
    kissAge = 10,
    smokeAge = 10,
    smokeClock = 0,
    texture;
  let cursor = 0,
    trailClock = 0;
  const heart = new THREE.Group();
  heart.visible = false;
  scene.add(heart);
  const shape = new THREE.Shape();
  for (let i = 0; i <= 160; i++) {
    const p = heartPoint((i / 160) * Math.PI * 2);
    if (!i) shape.moveTo(p.x, p.y);
    else shape.lineTo(p.x, p.y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.13,
    bevelSize: 0.09,
    bevelSegments: 4,
    steps: 1,
  });
  geometry.center();
  geometry.computeBoundingBox();
  const heartMaterial = new THREE.MeshPhysicalMaterial({
    color: "#bc7b78",
    metalness: 0.32,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.22,
  });
  const charm = new THREE.Mesh(geometry, heartMaterial);
  heart.add(charm);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.105, 0.018, 8, 32),
    new THREE.MeshStandardMaterial({
      color: "#ddc77f",
      metalness: 0.65,
      roughness: 0.28,
    }),
  );
  ring.position.set(0, 0.55, 0);
  heart.add(ring);
  const touch = new THREE.Mesh(
    new THREE.SphereGeometry(1.03, 24, 16),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  touch.scale.z = 0.3;
  heart.add(touch);
  const kissMaterial = new THREE.MeshBasicMaterial({
    color: "#a9676d",
    opacity: 0.82,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  new THREE.TextureLoader().load(
    `${import.meta.env.BASE_URL}assets/kiss.webp`,
    (map) => {
      if (!alive) {
        map.dispose();
        return;
      }
      map.colorSpace = THREE.SRGBColorSpace;
      texture = map;
      kissMaterial.map = map;
      kissMaterial.needsUpdate = true;
    },
    undefined,
    () => {},
  );
  const marks = [],
    occupied = [];
  const heartTarget = new THREE.Vector3(),
    wick = new THREE.Vector3();
  const warmLight = new THREE.PointLight(0xffcc9d, 0, 4);
  warmLight.position.set(0, 0.8, 1.5);
  scene.add(warmLight);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d"),
    gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.15, "rgba(255,255,255,.7)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(canvas);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#e6be8b",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.set(3.7, 3.7, 1);
  heart.add(glow);
  glow.position.z = -0.3;
  const capacity = 128,
    positions = new Float32Array(capacity * 3),
    colors = new Float32Array(capacity * 3),
    velocity = new Float32Array(capacity * 3),
    ages = new Float32Array(capacity).fill(10),
    lifetimes = new Float32Array(capacity),
    base = new Float32Array(capacity * 3),
    gravity = new Float32Array(capacity);
  positions.fill(1000);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  dustGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      map: glowTexture,
      vertexColors: true,
      size: 0.1,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  dust.frustumCulled = false;
  scene.add(dust);
  const tints = {
    gold: [1, 0.8, 0.42],
    rose: [1, 0.55, 0.55],
    smoke: [0.36, 0.38, 0.42],
  };
  function emit(origin, count = 9, kind = "gold") {
    const smoke = kind === "smoke";
    for (let j = 0; j < count; j++) {
      const i = cursor++ % capacity,
        k = i * 3,
        a = Math.random() * Math.PI * 2,
        speed = smoke ? 0.06 : 0.3 + Math.random() * 0.55;
      positions[k] = origin.x;
      positions[k + 1] = origin.y;
      positions[k + 2] = origin.z;
      velocity[k] = Math.cos(a) * speed;
      velocity[k + 1] = smoke ? 0.32 + Math.random() * 0.18 : 0.35 + Math.random() * 0.6;
      velocity[k + 2] = Math.sin(a) * speed * 0.5;
      ages[i] = 0;
      lifetimes[i] = smoke ? 1.6 + Math.random() * 0.8 : 0.8 + Math.random() * 0.8;
      gravity[i] = smoke ? -0.05 : 0.15;
      base.set(tints[kind] || tints.gold, k);
      colors.set(base.subarray(k, k + 3), k);
    }
  }
  // A small heart outline that blooms and fades, for reunions.
  const pops = [0, 1].map(() => {
    const points = [];
    for (let i = 0; i < 96; i++) {
      const p = heartPoint((i / 96) * Math.PI * 2);
      points.push(new THREE.Vector3(p.x, p.y, 0));
    }
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#eab0a8",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    line.visible = false;
    scene.add(line);
    return { line, age: 5 };
  });
  let popCursor = 0;
  function heartPop(origin) {
    const pop = pops[popCursor++ % pops.length];
    pop.age = 0;
    pop.line.position.copy(origin);
  }
  const wishPositions = new Float32Array(36),
    wishGeometry = new THREE.BufferGeometry();
  wishGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(wishPositions, 3),
  );
  const wishDust = new THREE.Points(
    wishGeometry,
    new THREE.PointsMaterial({
      map: glowTexture,
      color: "#ffda87",
      size: 0.1,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  wishDust.frustumCulled = false;
  scene.add(wishDust);
  const shooting = [];
  for (let i = 0; i < 3; i++) {
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(6), 3),
    );
    const line = new THREE.Line(
      buffer,
      new THREE.LineBasicMaterial({
        color: "#ead38e",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    line.frustumCulled = false;
    scene.add(line);
    shooting.push({
      line,
      age: 5,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
    });
  }
  let shotCursor = 0;
  function shoot(origin) {
    const shot = shooting[shotCursor++ % 3];
    shot.age = 0;
    shot.start.copy(origin || moon.position);
    shot.end.copy(shot.start).add(new THREE.Vector3(-4.4, -2.2, 0.6));
  }
  function project(nx, ny, z) {
    const p = new THREE.Vector3(nx * 2 - 1, 1 - ny * 2, 0.5).unproject(camera),
      dir = p.sub(camera.position).normalize();
    return camera.position
      .clone()
      .addScaledVector(dir, (z - camera.position.z) / dir.z);
  }
  function resize() {
    heartTarget.copy(project(0.5, host.clientHeight < 520 ? 0.41 : 0.37, 1));
    heart.position.copy(heartTarget);
  }
  const point = new THREE.Vector3(),
    orientation = new THREE.Euler(),
    quaternion = new THREE.Quaternion();
  function sendKiss(hitPoint) {
    if (!finale) return;
    kissAge = 0;
    heart.updateWorldMatrix(true, true);
    const touch = hitPoint ? charm.worldToLocal(hitPoint.clone()) : null;
    const index = pickKissSlot(occupied, touch),
      slot = kissSlots[index],
      taken = occupied.indexOf(index);
    if (taken >= 0) {
      occupied.splice(taken, 1);
      const [old] = marks.splice(taken, 1);
      old.removeFromParent();
      old.geometry.dispose();
    }
    point.set(slot.x, slot.y, geometry.boundingBox.max.z + 0.01);
    charm.localToWorld(point);
    charm.getWorldQuaternion(quaternion);
    orientation.setFromQuaternion(quaternion);
    orientation.z += slot.angle;
    if (texture) {
      const decalGeometry = new DecalGeometry(
        charm,
        point.clone(),
        orientation,
        new THREE.Vector3(0.33, 0.33, 0.65),
      );
      decalGeometry.applyMatrix4(charm.matrixWorld.clone().invert());
      const mark = new THREE.Mesh(decalGeometry, kissMaterial);
      charm.add(mark);
      marks.push(mark);
      occupied.push(index);
    }
    emit(point, 18, "rose");
  }
  function clearMarks() {
    occupied.length = 0;
    marks.splice(0).forEach((mark) => {
      mark.removeFromParent();
      mark.geometry.dispose();
    });
  }
  return {
    heart,
    glowTexture,
    emit,
    heartPop,
    resize,
    setFinale(value) {
      finale = value;
      heart.visible = value;
      if (value) smokeAge = 0;
      if (!value) {
        finaleMix = 0;
        kissAge = 10;
        clearMarks();
      }
    },
    sendKiss,
    shoot,
    trail(origin) {
      if (trailClock > 0.045) {
        emit(origin, 1);
        trailClock = 0;
      }
    },
    star(origin) {
      emit(origin, 12);
    },
    update(dt, t, reduced, wishProgress, rotation) {
      trailClock += dt;
      kissAge += dt;
      finaleMix = reduced
        ? finale
          ? 1
          : 0
        : THREE.MathUtils.damp(finaleMix, finale ? 1 : 0, 5, dt);
      const beat = reduced
        ? 0
        : Math.exp(-Math.pow((kissAge - 0.12) / 0.09, 2)) * 0.12 +
          Math.exp(-Math.pow((kissAge - 0.36) / 0.11, 2)) * 0.065;
      heart.scale.setScalar(Math.max(0.001, 0.66 * finaleMix * (1 + beat)));
      // The wish rises out of the candle and becomes the heart.
      flame.getWorldPosition(wick);
      heart.position.lerpVectors(wick, heartTarget, 1 - Math.pow(1 - finaleMix, 3));
      smokeAge += dt;
      smokeClock += dt;
      if (finale && smokeAge < 2.4 && smokeClock > 0.07 && !reduced) {
        smokeClock = 0;
        emit(wick.setY(wick.y - 0.12), 1, "smoke");
      }
      pops.forEach((pop) => {
        pop.age += dt;
        const u = pop.age / 1.3;
        pop.line.visible = u < 1 && !reduced;
        if (!pop.line.visible) return;
        pop.line.scale.setScalar(0.06 + (1 - Math.pow(1 - u, 3)) * 0.3);
        pop.line.position.y += dt * 0.22;
        pop.line.material.opacity = Math.sin(Math.PI * Math.min(1, u * 1.6)) * 0.95 * (1 - u * 0.4);
      });
      heart.rotation.y = THREE.MathUtils.damp(
        heart.rotation.y,
        rotation.kissY || 0,
        6,
        dt,
      );
      heart.rotation.x = THREE.MathUtils.damp(
        heart.rotation.x,
        rotation.kissX || 0,
        6,
        dt,
      );
      if (!reduced) heart.rotation.z = Math.sin(t * 0.65) * 0.035;
      glow.material.opacity = finaleMix * (0.07 + beat * 0.3);
      warmLight.intensity = finaleMix * (0.7 + beat * 6);
      for (let i = 0; i < capacity; i++) {
        if (ages[i] >= lifetimes[i]) continue;
        ages[i] += dt;
        const k = i * 3,
          fade = Math.max(0, 1 - ages[i] / lifetimes[i]);
        if (!reduced) {
          positions[k] += velocity[k] * dt;
          positions[k + 1] += velocity[k + 1] * dt;
          positions[k + 2] += velocity[k + 2] * dt;
          velocity[k + 1] -= gravity[i] * dt;
        }
        colors[k] = base[k] * fade;
        colors[k + 1] = base[k + 1] * fade * fade;
        colors[k + 2] = base[k + 2] * fade * fade;
        if (reduced || fade === 0) positions[k + 2] = 1000;
      }
      dustGeometry.attributes.position.needsUpdate = true;
      dustGeometry.attributes.color.needsUpdate = true;
      wishDust.visible = wishProgress > 0 && !reduced;
      wishDust.material.opacity = wishProgress * 0.8;
      if (wishDust.visible) {
        flame.getWorldPosition(point);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + t * 3.7,
            r = (0.22 + i * 0.018) * (1 - wishProgress * 0.65);
          wishPositions[i * 3] = point.x + Math.cos(a) * r;
          wishPositions[i * 3 + 1] =
            point.y - 0.5 * (1 - wishProgress) + Math.sin(a) * r * 0.45;
          wishPositions[i * 3 + 2] = point.z + Math.sin(a) * r;
        }
        wishGeometry.attributes.position.needsUpdate = true;
      }
      shooting.forEach((shot) => {
        shot.age += dt;
        const u = shot.age / 1.35;
        shot.line.visible = u < 1 && !reduced;
        if (!shot.line.visible) return;
        const front = shot.start.clone().lerp(shot.end, u),
          back = shot.start.clone().lerp(shot.end, Math.max(0, u - 0.13)),
          attribute = shot.line.geometry.attributes.position;
        attribute.setXYZ(0, back.x, back.y, back.z);
        attribute.setXYZ(1, front.x, front.y, front.z);
        attribute.needsUpdate = true;
        shot.line.material.opacity = Math.sin(Math.PI * u) * 0.8;
      });
    },
    dispose() {
      alive = false;
      texture?.dispose();
      glowTexture.dispose();
      clearMarks();
      pops.forEach((pop) => {
        pop.line.geometry.dispose();
        pop.line.material.dispose();
      });
      kissMaterial.dispose();
    },
  };
}
