import * as THREE from "three";

export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Each star sits on a spiral arm, bent by its distance from the core, with soft scatter
// that grows towards the rim. Colours run from a warm core to dusty rose and blue arms.
export function generateGalaxy({
  count = 6000,
  radius = 3,
  branches = 4,
  spin = 1.15,
  randomness = 0.3,
  power = 2.6,
  seed = 7,
  palette = [
    [1, 0.84, 0.55],
    [0.86, 0.48, 0.47],
    [0.36, 0.52, 0.66],
  ],
} = {}) {
  const random = seeded(seed);
  const positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3),
    scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(random(), 1.55) * radius;
    const angle = ((i % branches) / branches) * Math.PI * 2 + r * spin;
    const scatter = (flat = 1) =>
      Math.pow(random(), power) *
      (random() < 0.5 ? -1 : 1) *
      randomness *
      (0.35 + r) *
      flat;
    positions[i * 3] = Math.cos(angle) * r + scatter();
    positions[i * 3 + 1] = scatter(0.32);
    positions[i * 3 + 2] = Math.sin(angle) * r + scatter();
    const t = Math.min(1, r / radius);
    const colour =
      t < 0.4
        ? mix(palette[0], palette[1], t / 0.4)
        : mix(palette[1], palette[2], (t - 0.4) / 0.6);
    colors.set(colour, i * 3);
    scales[i] = 0.4 + Math.pow(random(), 7) * 2.6;
  }
  return { positions, colors, scales };
}

const vertexShader = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uSize;
  uniform float uSpin;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    float r = length(p.xz);
    float a = atan(p.z, p.x) + uTime * uSpin / (r + 0.55);
    p.xz = vec2(cos(a), sin(a)) * r;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale / -mv.z;
    vColor = aColor;
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float glow = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.7);
    gl_FragColor = vec4(vColor, glow * uOpacity);
    #include <colorspace_fragment>
  }
`;

function toLinear(palette) {
  return palette.map((hex) => {
    const c = new THREE.Color(hex);
    return [c.r, c.g, c.b];
  });
}

export function galaxyMaterial({ size = 70, spin = 0.12 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uSpin: { value: spin },
      uOpacity: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function galaxyGeometry(options) {
  const { positions, colors, scales } = generateGalaxy({
    ...options,
    palette: toLinear(options.palette || ["#f3d9a0", "#d99c97", "#7f9fb6"]),
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  return geometry;
}

// The galaxy behind the star heart, and a quiet universe of distant ones for the finale.
export function createCosmos(scene, pixelRatio) {
  const galaxy = new THREE.Points(
    galaxyGeometry({ count: 6500, radius: 3.3, seed: 11 }),
    galaxyMaterial({ size: 64 * pixelRatio, spin: 0.16 }),
  );
  galaxy.frustumCulled = false;
  galaxy.rotation.set(1.08, 0, -0.38);
  scene.add(galaxy);

  const universe = new THREE.Group();
  scene.add(universe);
  const farMaterial = galaxyMaterial({ size: 46 * pixelRatio, spin: 0.08 });
  const farShapes = [
    galaxyGeometry({ count: 1300, radius: 1, seed: 3, branches: 2, spin: 2.6 }),
    galaxyGeometry({
      count: 1100,
      radius: 1,
      seed: 5,
      branches: 3,
      spin: 1.6,
      palette: ["#f6e6c3", "#c9a0b4", "#8aa6c1"],
    }),
  ];
  const random = seeded(19);
  const spots = [
    [-3.1, 5.2],
    [2.9, 4.4],
    [-2.6, 1.6],
    [3.3, 0.6],
    [-3.4, -2.4],
    [2.5, -3.6],
    [-0.9, -5.6],
    [0.6, 6.4],
  ];
  spots.forEach(([x, y], i) => {
    const far = new THREE.Points(farShapes[i % 2], farMaterial);
    far.position.set(x, y, -random() * 3);
    far.rotation.set(0.6 + random() * 0.9, random() * 3, random() * 3);
    far.scale.setScalar(0.45 + random() * 0.55);
    far.frustumCulled = false;
    universe.add(far);
  });
  const dustCount = 1400,
    dust = new Float32Array(dustCount * 3),
    dustColor = new Float32Array(dustCount * 3).fill(0.75),
    dustScale = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dust.set([(random() - 0.5) * 10, (random() - 0.5) * 15, -random() * 4], i * 3);
    dustScale[i] = 0.25 + Math.pow(random(), 5) * 1.2;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  dustGeometry.setAttribute("aColor", new THREE.BufferAttribute(dustColor, 3));
  dustGeometry.setAttribute("aScale", new THREE.BufferAttribute(dustScale, 1));
  const dustMaterial = galaxyMaterial({ size: 40 * pixelRatio, spin: 0 });
  const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
  dustPoints.frustumCulled = false;
  universe.add(dustPoints);

  let galaxyMix = 0,
    universeMix = 0,
    showGalaxy = false,
    showUniverse = false;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  return {
    galaxy,
    universe,
    // Light glows on the night sky; on daylight paper the stars are inked instead.
    setTheme(theme) {
      for (const material of [galaxy.material, farMaterial, dustMaterial]) {
        material.blending = theme === "day" ? THREE.NormalBlending : THREE.AdditiveBlending;
        material.needsUpdate = true;
      }
      dustColor.fill(theme === "day" ? 0.32 : 0.75);
      dustGeometry.attributes.aColor.needsUpdate = true;
    },
    show({ galaxy: g = false, universe: u = false }) {
      showGalaxy = g;
      showUniverse = u;
    },
    // Galaxy sits behind the heart constellation, a little further back.
    place(centre, halfWidth, halfHeight) {
      galaxy.position.copy(centre);
      universe.position.set(0, 0, -7);
      universe.scale.set(Math.max(1, halfWidth / 4), Math.max(1, halfHeight / 7), 1);
    },
    update(dt, t, reduced) {
      const rate = reduced ? 1000 : 2.2;
      galaxyMix = THREE.MathUtils.damp(galaxyMix, showGalaxy ? 1 : 0, rate, dt);
      universeMix = THREE.MathUtils.damp(universeMix, showUniverse ? 1 : 0, rate * 0.7, dt);
      const time = reduced ? 0 : t;
      galaxy.visible = galaxyMix > 0.005;
      galaxy.material.uniforms.uTime.value = time;
      galaxy.material.uniforms.uOpacity.value = galaxyMix * 0.62;
      // Arriving from the little orbit, the galaxy settles from close-up to its full view.
      galaxy.scale.setScalar(1 + (1 - ease(galaxyMix)) * (showGalaxy ? 1.4 : 0.3));
      universe.visible = universeMix > 0.005;
      farMaterial.uniforms.uTime.value = time;
      farMaterial.uniforms.uOpacity.value = universeMix * 0.42;
      dustMaterial.uniforms.uOpacity.value = universeMix * 0.5;
      universe.children.forEach((child, i) => {
        if (child !== dustPoints) child.rotation.z += dt * (reduced ? 0 : 0.02 + i * 0.004);
      });
    },
    dispose() {
      galaxy.geometry.dispose();
      galaxy.material.dispose();
      farShapes.forEach((g) => g.dispose());
      farMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
    },
  };
}
