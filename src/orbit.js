import * as THREE from "three";
import { lerpAngle, rubberBand, springStep } from "./motion.js";

// A little Earth with the card's moon in orbit around it. Pull the moon away and let go:
// it always swings back.
export function createOrbit({ scene, renderer, moon, glowTexture, emit, heartPop, options }) {
  const earthRadius = 0.56,
    tilt = 0.42,
    period = 11,
    moonScale = 0.56,
    pullLimit = 2.3;
  let alive = true,
    active = false,
    mix = 0,
    angle = 0.9,
    radius = 1.75,
    mode = "orbit",
    stretch = 0,
    maxStretch = 0,
    hug = 0,
    threadAlpha = 0;
  const centre = new THREE.Vector3(),
    pointer = new THREE.Vector3(),
    position = new THREE.Vector3(),
    velocity = new THREE.Vector3(),
    home = new THREE.Vector3(),
    scratch = new THREE.Vector3(),
    homePosition = new THREE.Vector3();
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: "#5d7f99",
    roughness: 0.78,
  });
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    roughness: 1,
  });
  const loader = new THREE.TextureLoader();
  loader.load(
    `${import.meta.env.BASE_URL}assets/earth.jpg`,
    (texture) => {
      if (!alive) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.map = texture;
      earthMaterial.color.set("#ffffff");
      earthMaterial.needsUpdate = true;
      renderer.initTexture(texture);
    },
    undefined,
    () => {},
  );
  loader.load(
    `${import.meta.env.BASE_URL}assets/earth-clouds.jpg`,
    (texture) => {
      if (!alive) return texture.dispose();
      cloudMaterial.alphaMap = texture;
      cloudMaterial.needsUpdate = true;
      renderer.initTexture(texture);
      clouds.visible = true;
    },
    undefined,
    () => {},
  );
  const axis = new THREE.Group();
  axis.rotation.z = 0.41;
  group.add(axis);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 64, 48),
    earthMaterial,
  );
  axis.add(earth);
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.012, 64, 48),
    cloudMaterial,
  );
  clouds.visible = false;
  axis.add(clouds);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.17, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#a8cbe2") }, uOpacity: { value: 1 } },
      vertexShader: /* glsl */ `
        varying float vFacing;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFacing = dot(normalize(normalMatrix * normal), normalize(-mv.xyz));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vFacing;
        void main() {
          float glow = pow(smoothstep(0.0, 0.52, -vFacing), 1.6);
          gl_FragColor = vec4(uColor, glow * 0.55 * uOpacity);
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(halo);
  const touch = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  touch.userData.action = "earth";
  group.add(touch);

  function local(theta, target) {
    return target.set(
      radius * Math.cos(theta),
      -radius * Math.sin(theta) * Math.sin(tilt),
      radius * Math.sin(theta) * Math.cos(tilt),
    );
  }
  const ringGeometry = new THREE.BufferGeometry();
  const ringMaterial = new THREE.LineBasicMaterial({
    color: "#ead38e",
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const ring = new THREE.LineLoop(ringGeometry, ringMaterial);
  group.add(ring);
  function buildRing() {
    const points = [];
    for (let i = 0; i < 160; i++) points.push(local((i / 160) * Math.PI * 2, new THREE.Vector3()));
    ringGeometry.setFromPoints(points);
  }
  buildRing();

  // A thread of stardust shows the pull between them while they are apart.
  const threadCount = 30,
    threadPositions = new Float32Array(threadCount * 3);
  const threadGeometry = new THREE.BufferGeometry();
  threadGeometry.setAttribute("position", new THREE.BufferAttribute(threadPositions, 3));
  const thread = new THREE.Points(
    threadGeometry,
    new THREE.PointsMaterial({
      map: glowTexture,
      color: "#f2d89a",
      size: 0.085,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  thread.frustumCulled = false;
  scene.add(thread);

  function orbitPoint(target) {
    return local(angle, target).add(centre);
  }
  function reunite() {
    mode = "orbit";
    velocity.set(0, 0, 0);
    if (maxStretch < 0.45) return;
    hug = 1;
    scratch.copy(position).lerp(centre, 0.5);
    scratch.y += 0.25;
    heartPop(scratch);
    emit(scratch, 14, "rose");
    options.onReunion?.();
  }
  return {
    touch,
    get pulling() {
      return mode === "pull";
    },
    get ready() {
      return mode === "orbit" && mix > 0.9;
    },
    setActive(value) {
      active = value;
      if (!value) {
        mode = "orbit";
        stretch = maxStretch = 0;
      }
    },
    setTheme(theme) {
      ringMaterial.color.set(theme === "day" ? "#526a70" : "#ead38e");
      thread.material.color.set(theme === "day" ? "#b08a3e" : "#f2d89a");
      thread.material.blending = theme === "day" ? THREE.NormalBlending : THREE.AdditiveBlending;
      thread.material.needsUpdate = true;
    },
    resize(project) {
      centre.copy(project(0.5, 0.56, 0));
      const halfWidth = project(0.13, 0.5, 0).distanceTo(project(0.87, 0.5, 0)) / 2,
        halfHeight = project(0.5, 0.25, 0).distanceTo(project(0.5, 0.85, 0)) / 2;
      radius = Math.min(1.8, halfWidth * 0.82, halfHeight * 0.75);
      buildRing();
      group.position.copy(centre);
    },
    beginPull() {
      if (!active || mix < 0.9) return false;
      mode = "pull";
      maxStretch = 0;
      orbitPoint(home);
      options.onPullStart?.();
      return true;
    },
    pullTo(worldPoint) {
      if (mode !== "pull") return;
      const offset = scratch.copy(worldPoint).sub(home);
      const distance = offset.length();
      if (distance > 0.0001) offset.multiplyScalar(rubberBand(distance, pullLimit) / distance);
      pointer.copy(home).add(offset);
    },
    get pullDepth() {
      return position.z;
    },
    release() {
      if (mode !== "pull") return;
      // Rejoin the orbit at the nearest point, then let the spring do the rest.
      scratch.copy(position).sub(centre);
      angle = Math.atan2(
        -scratch.y * Math.sin(tilt) + scratch.z * Math.cos(tilt),
        scratch.x,
      );
      mode = "return";
    },
    // A tap (or a keyboard press) sends the moon drifting off on its own, and back.
    drift() {
      if (!active || mode !== "orbit" || mix < 0.9) return false;
      options.onPullStart?.(true);
      orbitPoint(scratch);
      velocity.copy(scratch.sub(centre).setY(0).normalize().multiplyScalar(6.2));
      velocity.y += 1.2;
      maxStretch = 1;
      mode = "return";
      return true;
    },
    update(dt, t, reduced) {
      mix = reduced
        ? Number(active)
        : THREE.MathUtils.damp(mix, active ? 1 : 0, active ? 3.2 : 4.5, dt);
      group.visible = mix > 0.01;
      if (!group.visible && !active) {
        thread.visible = false;
        return;
      }
      if (mode === "orbit" && !reduced) angle += (dt * Math.PI * 2) / period;
      orbitPoint(home);
      if (mode === "orbit") position.copy(home);
      else if (mode === "pull") {
        position.x = THREE.MathUtils.damp(position.x, pointer.x, 14, dt);
        position.y = THREE.MathUtils.damp(position.y, pointer.y, 14, dt);
        position.z = THREE.MathUtils.damp(position.z, pointer.z, 14, dt);
      } else if (reduced) {
        position.copy(home);
        reunite();
      } else {
        springStep(position, velocity, home, dt, 22, 3);
        if (position.distanceTo(home) < 0.035 && velocity.length() < 0.3) reunite();
      }
      stretch = position.distanceTo(home);
      maxStretch = Math.max(maxStretch, stretch);
      hug = THREE.MathUtils.damp(hug, 0, 3.5, dt);

      const eased = 1 - Math.pow(1 - mix, 3);
      group.scale.setScalar(Math.max(0.001, eased * (1 + Math.sin(hug * Math.PI) * 0.07)));
      earth.rotation.y += dt * (reduced ? 0 : 0.12);
      clouds.rotation.y += dt * (reduced ? 0 : 0.15);
      // Earth leans a touch towards the moon while they are apart.
      scratch.copy(position).sub(centre);
      const lean = Math.min(0.14, stretch * 0.06);
      axis.position.copy(scratch.normalize().multiplyScalar(lean));

      // The card's moon leaves its corner to join the orbit, always facing the Earth.
      homePosition.copy(moon.position);
      const homeRotation = moon.rotation.y;
      moon.position.lerpVectors(homePosition, position, eased);
      moon.scale.multiplyScalar(1 + (moonScale - 1) * eased);
      const facing = Math.atan2(-(centre.z - position.z), centre.x - position.x);
      moon.rotation.y = lerpAngle(homeRotation, facing, eased);

      threadAlpha = THREE.MathUtils.damp(
        threadAlpha,
        mode === "orbit" ? 0 : Math.min(1, stretch / 1.2),
        mode === "orbit" ? 3 : 10,
        dt,
      );
      thread.visible = threadAlpha > 0.01;
      thread.material.opacity = threadAlpha * 0.9 * mix;
      if (thread.visible) {
        const from = scratch.copy(position).sub(centre).normalize().multiplyScalar(earthRadius).add(centre);
        for (let i = 0; i < threadCount; i++) {
          const u = i / (threadCount - 1),
            sag = Math.sin(u * Math.PI) * (0.18 - Math.min(0.16, stretch * 0.05)),
            shimmer = reduced ? 0 : Math.sin(t * 6 + i * 0.9) * 0.012;
          threadPositions[i * 3] = from.x + (position.x - from.x) * u;
          threadPositions[i * 3 + 1] = from.y + (position.y - from.y) * u - sag + shimmer;
          threadPositions[i * 3 + 2] = from.z + (position.z - from.z) * u;
        }
        threadGeometry.attributes.position.needsUpdate = true;
      }
    },
    dispose() {
      alive = false;
      earthMaterial.map?.dispose();
      cloudMaterial.alphaMap?.dispose();
      thread.geometry.dispose();
      thread.material.dispose();
    },
  };
}
