import * as THREE from "three";
import { heartPoint } from "./heart.js";

// Pointer events are picked against the scene geometry, not page-sized buttons.
export function attachInteractions({
  host,
  renderer,
  scene,
  camera,
  envelope,
  cake,
  moon,
  flame,
  makeStar,
  decorations,
  kissHeart,
  effects,
  options,
}) {
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster(),
    ndc = new THREE.Vector2();
  const world = host.parentElement;
  let step = 0,
    done = false,
    gesture = null,
    moonSpin = 0,
    moonImpulse = 0,
    cakeBounce = 0;
  const rotation = {
    envelopeX: -0.11,
    envelopeY: -0.2,
    cakeX: 0.1,
    cakeY: 0,
    kissX: 0,
    kissY: 0,
  };
  const stars = [],
    collected = new Set();
  const constellation = new THREE.Group();
  scene.add(constellation);
  const heartCurve = new (class extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const p = heartPoint(t * Math.PI * 2);
      return target.set(p.x, p.y, 0);
    }
  })();
  const heartMaterial = new THREE.MeshBasicMaterial({
    color: "#ead38e",
    transparent: true,
    opacity: 0.8,
  });
  const heartMesh = new THREE.Mesh(
    new THREE.TubeGeometry(heartCurve, 160, 0.009, 6, true),
    heartMaterial,
  );
  constellation.add(heartMesh);
  const touchMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const heartTouch = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 2.1),
    touchMaterial,
  );
  heartTouch.userData.action = "heart";
  constellation.add(heartTouch);
  const from = [
    [0.27, 0.37],
    [0.73, 0.37],
    [0.19, 0.6],
    [0.81, 0.6],
    [0.5, 0.77],
  ];
  const destinations = [0.2, 0.5, 1, 1.5, 1.8].map((v) =>
    heartPoint(v * Math.PI),
  );
  for (let i = 0; i < 5; i++) {
    const object = makeStar(0.28);
    object.userData.action = "star";
    object.userData.index = i;
    object.material = object.material.clone();
    const touch = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 8),
      touchMaterial,
    );
    touch.userData.action = "star";
    touch.userData.index = i;
    object.add(touch);
    scene.add(object);
    stars.push({
      object,
      origin: new THREE.Vector3(),
      target: new THREE.Vector3(),
      caught: false,
    });
  }
  constellation.visible = false;
  function project(nx, ny, z = 0) {
    const p = new THREE.Vector3(nx * 2 - 1, 1 - ny * 2, 0.5).unproject(camera),
      direction = p.sub(camera.position).normalize();
    return camera.position
      .clone()
      .addScaledVector(direction, (z - camera.position.z) / direction.z);
  }
  function resize() {
    const left = project(0.13, 0.5),
      right = project(0.87, 0.5),
      height = project(0.5, 0.28).distanceTo(project(0.5, 0.78));
    const scale = Math.min(left.distanceTo(right) / 2, height / 1.8);
    constellation.position.copy(project(0.5, 0.54, 0.45));
    constellation.scale.setScalar(scale);
    stars.forEach((s, i) => {
      s.origin.copy(project(...from[i], 0.5));
      s.target
        .set(destinations[i].x, destinations[i].y, 0)
        .multiplyScalar(scale)
        .add(constellation.position);
      if (!s.caught) s.object.position.copy(s.origin);
      else s.object.position.copy(s.target);
    });
  }
  function tag(object, action) {
    object.userData.action = action;
  }
  tag(envelope, "envelope");
  tag(cake, "cake");
  tag(moon, "moon");
  tag(flame, "flame");
  tag(kissHeart, "kiss");
  decorations.forEach((object) => {
    tag(object, "sparkle");
    object.userData.spin = 0;
    const touch = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 8),
      touchMaterial,
    );
    object.add(touch);
  });
  // A generous invisible volume belongs to the flame itself for reliable phone input.
  const flameTouch = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 12),
    touchMaterial,
  );
  flame.add(flameTouch);
  tag(flameTouch, "flame");
  function identify(object) {
    let node = object;
    while (node) {
      if (node.userData.action)
        return { action: node.userData.action, index: node.userData.index };
      node = node.parent;
    }
    return null;
  }
  function pick(event) {
    const r = canvas.getBoundingClientRect();
    ndc.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      1 - ((event.clientY - r.top) / r.height) * 2,
    );
    raycaster.setFromCamera(ndc, camera);
    const objects = [moon, ...decorations.filter((object) => object.visible)];
    if (step === 0) objects.push(envelope);
    if (step === 2) objects.push(cake);
    if (done && kissHeart.visible) objects.push(kissHeart);
    if (step === 3) {
      objects.push(...stars.filter((s) => !s.caught).map((s) => s.object));
      if (collected.size === 5) objects.push(heartTouch);
    }
    for (const hit of raycaster.intersectObjects(objects, true)) {
      const result = identify(hit.object);
      if (result) return { ...result, point: hit.point.clone() };
    }
    return null;
  }
  function pointerDown(event) {
    if (event.button !== 0 || gesture) return;
    const hit = pick(event);
    if (!hit) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    gesture = {
      ...hit,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
    canvas.style.cursor = "grabbing";
    if (hit.action === "flame" && !done) options.onWishStart?.(event);
  }
  function pointerMove(event) {
    if (!gesture) {
      if (event.pointerType === "mouse")
        canvas.style.cursor = pick(event) ? "grab" : "default";
      return;
    }
    if (event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.lastX,
      dy = event.clientY - gesture.lastY;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7)
      gesture.moved = true;
    if (gesture.action === "envelope") {
      rotation.envelopeY = THREE.MathUtils.clamp(
        rotation.envelopeY + dx * 0.012,
        -1.15,
        1.15,
      );
      rotation.envelopeX = THREE.MathUtils.clamp(
        rotation.envelopeX + dy * 0.008,
        -0.65,
        0.65,
      );
    }
    if (gesture.action === "cake") {
      rotation.cakeY += dx * 0.018;
      rotation.cakeX = THREE.MathUtils.clamp(
        rotation.cakeX + dy * 0.006,
        -0.2,
        0.5,
      );
    }
    if (gesture.action === "moon") {
      moonSpin += dx * 0.025;
      moonImpulse = dx * 0.04;
    }
    if (gesture.action === "kiss") {
      rotation.kissY = THREE.MathUtils.clamp(
        rotation.kissY + dx * 0.012,
        -0.9,
        0.9,
      );
      rotation.kissX = THREE.MathUtils.clamp(
        rotation.kissX + dy * 0.009,
        -0.5,
        0.5,
      );
    }
    if (gesture.moved) {
      const r = canvas.getBoundingClientRect();
      effects.trail(
        project(
          (event.clientX - r.left) / r.width,
          (event.clientY - r.top) / r.height,
          0.7,
        ),
      );
    }
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
  }
  function pointerUp(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const g = gesture;
    gesture = null;
    canvas.style.cursor = "grab";
    if (g.action === "flame") {
      options.onWishEnd?.();
      return;
    }
    if (g.moved) return;
    if (g.action === "envelope") options.onEnvelopeTap?.();
    if (g.action === "star") options.onStarTap?.(g.index);
    if (g.action === "heart" && collected.size === 5) options.onHeartTap?.();
    if (g.action === "moon") {
      moonImpulse = 5;
      effects.shoot(moon.position);
      options.onMoonTap?.();
    }
    if (g.action === "kiss") options.onKissTap?.(g.point);
    if (g.action === "cake") {
      cakeBounce = 1;
      options.onCakeTap?.();
    }
    if (g.action === "sparkle") {
      decorations.forEach((object) => (object.userData.spin = 5));
      options.onSparkleTap?.(event.clientX, event.clientY);
    }
  }
  function cancel() {
    gesture = null;
    canvas.style.cursor = "default";
    options.onWishCancel?.();
  }
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("lostpointercapture", cancel);
  return {
    rotation,
    resize,
    setStep(value) {
      step = value;
      done = false;
      cancel();
      constellation.visible = step === 3;
      stars.forEach((s) => (s.object.visible = step === 3));
      decorations.forEach((object) => (object.visible = step !== 3));
      if (step === 3) {
        collected.clear();
        stars.forEach((s) => {
          s.caught = false;
          s.object.scale.setScalar(1);
          s.object.material.emissive.setHex(0);
        });
        resize();
      }
    },
    collectStar(index) {
      if (step !== 3 || collected.has(index)) return;
      collected.add(index);
      stars[index].caught = true;
      stars[index].object.material.emissive.setHex(0x685323);
      return stars[index].object.position.clone();
    },
    spinMoon() {
      moonImpulse = 5;
      effects.shoot(moon.position);
    },
    highlightStar(index) {
      stars.forEach((s, i) => {
        if (!s.caught)
          s.object.material.emissive.setHex(i === index ? 0x55431e : 0);
      });
    },
    celebrate() {
      done = true;
    },
    setTheme(theme) {
      heartMaterial.color.set(theme === "day" ? "#526a70" : "#ead38e");
    },
    update(dt, t, reduced) {
      if (reduced && moonImpulse) {
        moonSpin += (Math.sign(moonImpulse) * Math.PI) / 2;
        moonImpulse = 0;
      }
      moonSpin += moonImpulse * dt;
      moonImpulse = THREE.MathUtils.damp(moonImpulse, 0, 2.3, dt);
      moon.rotation.y = 1.1 + moonSpin;
      decorations.forEach((object) => {
        object.userData.spin = THREE.MathUtils.damp(
          object.userData.spin,
          0,
          3,
          dt,
        );
        object.rotation.z += object.userData.spin * dt;
      });
      moon.scale.setScalar(1 + Math.min(0.12, Math.abs(moonImpulse) * 0.018));
      cakeBounce = reduced ? 0 : THREE.MathUtils.damp(cakeBounce, 0, 5, dt);
      if (step === 2) cake.position.y += Math.sin(cakeBounce * Math.PI) * 0.18;
      heartMesh.geometry.setDrawRange(
        0,
        Math.floor((heartMesh.geometry.index.count * collected.size) / 5 / 3) *
          3,
      );
      heartTouch.visible = step === 3 && collected.size === 5;
      stars.forEach((s, i) => {
        if (step !== 3) return;
        const target = s.caught ? s.target : s.origin;
        s.object.position.lerp(target, reduced ? 1 : 1 - Math.exp(-dt * 6));
        if (!s.caught && !reduced)
          s.object.position.y += Math.sin(t * 1.5 + i) * 0.004;
        const size = s.caught ? 0.3 : 1;
        s.object.scale.setScalar(
          THREE.MathUtils.damp(s.object.scale.x, size, 6, dt),
        );
        s.object.rotation.y = s.caught ? 0 : Math.sin(t * 0.8 + i) * 0.45;
        s.object.rotation.z = s.caught ? 0 : Math.sin(t * 0.6 + i) * 0.15;
      });
      // DOM attributes expose interaction state for assistive UI and browser QA.
      for (const [key, value] of Object.entries({
        objectRotation: rotation.cakeY,
        envelopeRotation: rotation.envelopeY,
        moonRotation: moonSpin,
        kissRotation: rotation.kissY,
      })) {
        const next = value.toFixed(2);
        if (world.dataset[key] !== next) world.dataset[key] = next;
      }
    },
    dispose() {
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
    },
  };
}
