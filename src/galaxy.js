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
export const gauss = (random) => {
  let u = 0;
  while (!u) u = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
};
export const linear = (hex) => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};

// A small spiral for far-away galaxies: each star on an arm, bent by its radius.
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
    scales = new Float32Array(count),
    seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(random(), 1.55) * radius;
    const angle = ((i % branches) / branches) * Math.PI * 2 + r * spin;
    const scatter = (flat = 1) =>
      Math.pow(random(), power) * (random() < 0.5 ? -1 : 1) * randomness * (0.35 + r) * flat;
    positions[i * 3] = Math.cos(angle) * r + scatter();
    positions[i * 3 + 1] = scatter(0.32);
    positions[i * 3 + 2] = Math.sin(angle) * r + scatter();
    const t = Math.min(1, r / radius);
    colors.set(t < 0.4 ? mix(palette[0], palette[1], t / 0.4) : mix(palette[1], palette[2], (t - 0.4) / 0.6), i * 3);
    scales[i] = 0.4 + Math.pow(random(), 7) * 2.6;
    seeds[i] = random();
  }
  return { positions, colors, scales, seeds };
}

// One star program for every sky: steady or twinkling, with a gentle bounded shimmer
// (stars drift around their place instead of winding the arms up over time).
const starVertex = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uSize;
  uniform float uMaxSize;
  uniform float uOpacity;
  uniform float uTwinkle;
  uniform float uShimmer;
  uniform vec3 uMask;
  uniform float uAspect;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float w = 0.35 + aSeed * 0.5;
    p.xz += uShimmer * vec2(cos(uTime * w + aSeed * 6.2831), sin(uTime * w + aSeed * 6.2831));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * aScale / max(-mv.z, 0.001), uMaxSize);
    float tw = 0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 2.6) + aSeed * 40.0);
    vAlpha = uOpacity * (1.0 - uTwinkle * (0.18 + 0.3 * step(1.4, aScale)) * tw);
    vAlpha *= smoothstep(0.4, 2.5, -mv.z);
    // Keep the sky clear around a planet's disc.
    if (uMask.z > 0.0) {
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vAlpha *= smoothstep(uMask.z, uMask.z * 1.6, length((ndc - uMask.xy) * vec2(uAspect, 1.0)));
    }
    vColor = aColor;
  }
`;
const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float glow = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.7);
    gl_FragColor = vec4(vColor, glow * vAlpha);
    #include <colorspace_fragment>
  }
`;

export function starMaterial({ size = 70, maxSize = 40, twinkle = 0, shimmer = 0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uMaxSize: { value: maxSize },
      uOpacity: { value: 0 },
      uTwinkle: { value: twinkle },
      uShimmer: { value: shimmer },
      uMask: { value: new THREE.Vector3(0, 0, 0) },
      uAspect: { value: 1 },
    },
    vertexShader: starVertex,
    fragmentShader: starFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Dust lanes: these points erase light (colour and alpha), so the navy sky shows through.
export function eraseMaterial({ size = 70, maxSize = 90 } = {}) {
  const material = starMaterial({ size, maxSize });
  material.fragmentShader = /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float g = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
      gl_FragColor = vec4(0.0, 0.0, 0.0, g * vAlpha);
    }
  `;
  Object.assign(material, {
    // Depth-tested, so the lanes darken the sky behind the gold stars, never the stars.
    depthTest: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  return material;
}

export function pointsGeometry(P, C, S, D) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("aColor", new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute("aScale", new THREE.Float32BufferAttribute(S, 1));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(D, 1));
  return g;
}

export function galaxyGeometry(options) {
  const { positions, colors, scales, seeds } = generateGalaxy({
    ...options,
    palette: (options.palette || ["#f3d9a0", "#d99c97", "#7f9fb6"]).map(linear),
  });
  return pointsGeometry(positions, colors, scales, seeds);
}

// Our galaxy from outside: a barred spiral with two trailing arms, pink star-forming knots
// strung along them, dark lanes on their inner edges, a halo of old clusters and two small
// satellite clouds. "Us" sits in the quiet gap between two arms, a little over halfway out,
// and just outward, on the next arm, a tiny pink heart glows next door.
export function makeMilkyWay({ seed = 11, count = 9000, radius = 3.3, arms = 2, pitch = 0.42, bar = 0.75 } = {}) {
  const r = seeded(seed);
  const P = [],
    C = [],
    S = [],
    D = [];
  const dP = [],
    dC = [],
    dS = [],
    dD = [];
  const core = linear("#fff1d6"),
    gold = linear("#f3d9a0"),
    rose = linear("#d99c97"),
    blue = linear("#8fb0cc"),
    young = linear("#e6eef8"),
    pink = linear("#f2899f");
  const k = 1 / Math.tan(pitch),
    r0 = bar * 0.9;
  const crest = (rad, arm) => (arm / arms) * Math.PI * 2 + Math.log(Math.max(rad, r0) / r0) * k;
  const push = (x, y, z, col, s) => {
    P.push(x, y, z);
    C.push(...col);
    S.push(s);
    D.push(r());
  };
  for (let i = 0; i < count; i++) {
    const u = r();
    if (u < 0.13) {
      const rad = Math.abs(gauss(r)) * 0.32,
        th = r() * Math.PI * 2,
        ph = Math.acos(2 * r() - 1);
      push(
        rad * Math.sin(ph) * Math.cos(th),
        rad * Math.cos(ph) * 0.55,
        rad * Math.sin(ph) * Math.sin(th),
        mix(core, gold, Math.min(1, rad / 0.5)).map((c) => c * (0.7 + r() * 0.3)),
        0.5 + Math.pow(r(), 6) * 1.6,
      );
    } else if (u < 0.2) {
      push(gauss(r) * bar * 0.45, gauss(r) * 0.04, gauss(r) * 0.11, mix(core, gold, r()), 0.45 + Math.pow(r(), 6) * 1.4);
    } else {
      const rad = Math.min(radius, r0 * 0.8 + -Math.log(1 - r() * 0.985) * 0.85);
      const arm = Math.floor(r() * arms),
        inArm = r() < 0.72;
      const dA = inArm ? (gauss(r) * (0.1 + 0.06 * rad)) / rad : ((r() - 0.5) * Math.PI * 2) / arms;
      const a = crest(rad, arm) + dA,
        t = Math.min(1, rad / radius);
      let col = t < 0.35 ? mix(gold, rose, t / 0.35) : mix(rose, blue, (t - 0.35) / 0.65);
      if (inArm && dA < 0 && dA * rad > -0.12 && r() < 0.35) col = mix(col, young, 0.7);
      const laneA = (0.1 + 0.05 * rad) / rad;
      if (inArm && Math.abs(dA - laneA) * rad < 0.045 && rad > r0) col = col.map((c) => c * 0.25);
      col = col.map((c) => c * (0.55 + r() * 0.45));
      push(
        Math.cos(a) * rad + gauss(r) * 0.03,
        gauss(r) * 0.045 * (1 + rad * 0.25),
        Math.sin(a) * rad + gauss(r) * 0.03,
        col,
        0.4 + Math.pow(r(), 7) * 2.4,
      );
    }
  }
  for (let c = 0; c < 64; c++) {
    const arm = c % arms,
      rad = r0 * 1.2 + r() * (radius * 0.8 - r0);
    const a = crest(rad, arm) - 0.06 / rad + (gauss(r) * 0.05) / rad;
    const cx = Math.cos(a) * rad,
      cz = Math.sin(a) * rad,
      n = 2 + Math.floor(r() * 4);
    for (let j = 0; j < n; j++)
      push(cx + gauss(r) * 0.045, gauss(r) * 0.02, cz + gauss(r) * 0.045, pink.map((v) => v * (0.6 + r() * 0.4)), 1.4 + r() * 1.6);
    push(cx, 0, cz, young, 0.9);
  }
  // A halo of old globular clusters.
  for (let i = 0; i < 70; i++) {
    const rad = radius * (0.25 + Math.pow(r(), 0.7) * 0.75),
      th = r() * Math.PI * 2,
      ph = Math.acos(2 * r() - 1);
    push(rad * Math.sin(ph) * Math.cos(th), rad * Math.cos(ph) * 0.8, rad * Math.sin(ph) * Math.sin(th), linear("#ffd9a0").map((v) => v * 0.7), 0.6 + r() * 0.5);
  }
  // Two satellite clouds below the disc.
  [
    [-2.6, -1.1, 2.4, 220, 0.32],
    [-1.9, -1.5, 3.1, 120, 0.2],
  ].forEach(([x, y, z, n, s]) => {
    for (let i = 0; i < n; i++)
      push(x + gauss(r) * s, y + gauss(r) * s * 0.5, z + gauss(r) * s, linear(i % 17 ? "#c6d2ea" : "#f29bb5").map((v) => v * (0.45 + r() * 0.4)), 0.4 + Math.pow(r(), 5) * 1.2);
  });
  // "Us": in the gap between the two main arms, a little over halfway out.
  const rh = radius * 0.55,
    th = crest(rh, 0) + Math.PI / 2;
  const home = new THREE.Vector3(Math.cos(th) * rh, 0, Math.sin(th) * rh);
  // A tiny pink heart on the next arm out, drawn in the disc's plane.
  const knotR = rh + 0.42,
    knotA = crest(knotR, 0) - 0.04;
  const kx = Math.cos(knotA) * knotR,
    kz = Math.sin(knotA) * knotR;
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const hx = Math.pow(Math.sin(t), 3),
      hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
    push(kx + hx * 0.07, 0, kz - hy * 0.07, pink.map((v) => v * 0.95), 1.1);
  }
  for (let i = 0; i < 1100; i++) {
    const arm = i % arms,
      rad = r0 * 1.05 + Math.pow(r(), 0.8) * (radius * 0.85 - r0);
    const a = crest(rad, arm) + (0.1 + 0.05 * rad) / rad + (gauss(r) * 0.02) / rad;
    dP.push(Math.cos(a) * rad, gauss(r) * 0.015, Math.sin(a) * rad);
    dC.push(0, 0, 0);
    dS.push(1.1 + r() * 1.3 * (1 - (rad / radius) * 0.5));
    dD.push(r());
  }
  return { stars: pointsGeometry(P, C, S, D), dust: pointsGeometry(dP, dC, dS, dD), home, count: P.length / 3 };
}

export function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d"),
    gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.45)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// The galaxy as a layer the journey can pose: scaled, tilted from edge-on (as the band was
// seen from inside) to its resting view, and pinned so "us" stays put while it grows or shrinks.
export function createGalaxyLayer(scene, pixelRatio) {
  const built = makeMilkyWay();
  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);
  const disc = new THREE.Group();
  root.add(disc);
  const stars = new THREE.Points(built.stars, starMaterial({ size: 64 * pixelRatio, maxSize: 40 * pixelRatio, shimmer: 0.012 }));
  const dust = new THREE.Points(built.dust, eraseMaterial({ size: 64 * pixelRatio, maxSize: 90 * pixelRatio }));
  dust.renderOrder = 1;
  [stars, dust].forEach((p) => {
    p.frustumCulled = false;
    disc.add(p);
  });
  const glow = glowTexture();
  const sprites = [
    ["#ffe2b0", 1.3, 0.5],
    ["#f3c7a4", 3.2, 0.22],
  ].map(([color, size, strength]) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    sprite.scale.setScalar(size);
    sprite.userData.strength = strength;
    disc.add(sprite);
    return sprite;
  });
  const qEdge = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, 0, 1.05, "ZYX"));
  const qRest = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.08, 0, -0.38));
  const rest = new THREE.Vector3();
  const offset = new THREE.Vector3(),
    pinned = new THREE.Vector3();
  let spin = 0,
    dayTheme = false;
  return {
    root,
    place(restCentre) {
      rest.copy(restCentre);
    },
    // opacity 0..1, scale (1 = rest), orient (0 edge-on .. 1 rest), lock (1 = "us" pinned to pin).
    pose({ opacity, scale, orient, lock, pin }) {
      root.visible = opacity > 0.005;
      root.quaternion.slerpQuaternions(qEdge, qRest, orient);
      root.scale.setScalar(scale);
      disc.rotation.y = spin;
      disc.updateMatrix();
      offset.copy(built.home).applyMatrix4(disc.matrix).applyQuaternion(root.quaternion).multiplyScalar(scale);
      root.position.copy(rest);
      if (pin && lock > 0) root.position.lerp(pinned.copy(pin).sub(offset), lock);
      root.updateMatrixWorld(true);
      stars.material.uniforms.uOpacity.value = opacity * 0.8;
      dust.material.uniforms.uOpacity.value = dayTheme ? 0 : opacity * 0.55;
      sprites.forEach((s) => (s.material.opacity = opacity * s.userData.strength));
    },
    homeWorld(target) {
      return disc.localToWorld(target.copy(built.home));
    },
    // Journeys frame "us" from a known orientation, however long the galaxy has been turning.
    resetSpin() {
      spin = 0;
    },
    setTheme(theme) {
      dayTheme = theme === "day";
      stars.material.blending = dayTheme ? THREE.NormalBlending : THREE.AdditiveBlending;
      stars.material.needsUpdate = true;
    },
    update(dt, t, reduced) {
      // The whole pattern turns slowly and rigidly, trailing its arms.
      spin += reduced ? 0 : dt * 0.02;
      stars.material.uniforms.uTime.value = reduced ? 0 : t;
      dust.material.uniforms.uTime.value = reduced ? 0 : t;
    },
    dispose() {
      built.stars.dispose();
      built.dust.dispose();
      stars.material.dispose();
      dust.material.dispose();
      sprites.forEach((s) => s.material.dispose());
      glow.dispose();
    },
  };
}
