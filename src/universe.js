import * as THREE from "three";
import { gauss, glowTexture, linear, seeded } from "./galaxy.js";

// The universe at its largest: galaxies strung along filaments between bright clusters, with
// wide empty voids. Some filaments quietly trace a broken heart around where her charm will be.
// Then everything flows home: each galaxy streams along its filament into the charm.

const vertexShader = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  attribute float aHeart;
  attribute float aDelay;
  attribute vec3 aColor;
  attribute vec3 aStart;
  attribute vec3 aCtrl;
  attribute vec3 aHome;
  uniform float uSize;
  uniform float uMaxSize;
  uniform float uOpacity;
  uniform float uGather;
  uniform float uFlow;
  uniform float uHeart;
  uniform float uTime;
  uniform vec3 uLatte;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float g = 1.0 - pow(1.0 - uGather, 3.0);
    vec3 base = mix(aStart, position, g);
    // Galaxies near home leave first; the far web arrives last.
    float f = smoothstep(0.0, 1.0, clamp((uFlow - aDelay * 0.45) / 0.55, 0.0, 1.0));
    vec3 p = mix(mix(base, aCtrl, f), mix(aCtrl, aHome, f), f);
    p.xy += 0.006 * vec2(sin(uTime * 0.4 + aSeed * 40.0), cos(uTime * 0.33 + aSeed * 31.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * aScale / max(-mv.z, 0.001), uMaxSize);
    vec3 c = aColor * (1.0 + aHeart * uHeart * 0.55);
    vColor = mix(c, uLatte, f);
    vAlpha = uOpacity * (0.35 + 0.65 * g);
  }
`;
const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float glow = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.6);
    gl_FragColor = vec4(vColor, glow * vAlpha);
    #include <colorspace_fragment>
  }
`;

const heartXY = (t) => [
  16 * Math.pow(Math.sin(t), 3),
  13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
];

// Pure layout: a cosmic web around a heart centre, in world units. The heart's filaments
// are drawn exactly like every other filament, so it is found, not drawn.
export function generateWeb({ centre = [0, 0, 0], halfWidth = 2.4, halfHeight = 4.4, charmSize = 0.66, seed = 29 } = {}) {
  const rr = seeded(seed);
  const [cx, cy, cz] = centre;
  const s = 1.15 / 16,
    tilt = 0.18;
  const place = ([x, y]) => {
    const yy = y + 2.5;
    return [cx + (x * Math.cos(tilt) - yy * Math.sin(tilt)) * s, cy + (x * Math.sin(tilt) + yy * Math.cos(tilt)) * s, cz - 0.4];
  };
  const nodes = [];
  const HN = 16;
  for (let i = 0; i < HN; i++) {
    const [x, y, z] = place(heartXY((i / HN) * Math.PI * 2));
    nodes.push({ p: [x + gauss(rr) * 0.035, y + gauss(rr) * 0.035, z + gauss(rr) * 0.12], heart: true });
  }
  const notch = place(heartXY(0));
  // Clusters scattered through a deep box, avoiding a pocket around the heart.
  while (nodes.length < HN + 38) {
    const p = [cx + (rr() - 0.5) * 2.5 * halfWidth, cy + (rr() - 0.5) * 2.3 * halfHeight, cz - 1.8 + (rr() - 0.5) * 4];
    if (Math.hypot(p[0] - cx, p[1] - cy) < 1.5) continue;
    nodes.push({ p, heart: false });
  }
  const edges = [];
  const linked = (i, j) => edges.some(([p, q]) => (p === i && q === j) || (p === j && q === i));
  // Two heart segments stay broken.
  for (let i = 0; i < HN; i++) if (i !== 4 && i !== 11) edges.push([i, (i + 1) % HN, true]);
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => [j, Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2])])
      .filter(([j]) => j !== i && !(a.heart && nodes[j].heart))
      .sort((x, y) => x[1] - y[1]);
    // Every cluster links to its nearest neighbours; a few heart nodes reach out into the web.
    const reach = a.heart ? (i % 4 === 0 ? 1 : 0) : 3;
    near.slice(0, reach).forEach(([j]) => {
      if (!linked(i, j)) edges.push([i, j, false]);
    });
  });
  const P = [],
    C = [],
    S = [],
    D = [],
    H = [],
    start = [],
    ctrl = [],
    home = [],
    delay = [];
  const rose = linear("#c98f96"),
    hot = linear("#f3d9a0"),
    cream = linear("#fff1d6"),
    blue = linear("#9fb4d8"),
    far = linear("#e8957a"),
    gold = linear("#ffd08f");
  const dist = (p) => Math.hypot(p[0] - notch[0], p[1] - notch[1], p[2] - notch[2]);
  const maxDist = Math.max(...nodes.map((n) => dist(n.p)));
  // Where each point ends up: on or inside the charm's heart silhouette.
  const homePoint = () => {
    const t = rr() * Math.PI * 2,
      [hx, hy] = heartXY(t),
      k = rr() < 0.6 ? 1 : Math.sqrt(rr());
    return [cx + (hx / 16) * charmSize * k, cy + ((hy + 2.5) / 16) * charmSize * 0.95 * k, cz + (rr() - 0.5) * 0.12];
  };
  const add = (p, col, size, heart, via) => {
    P.push(...p);
    C.push(...col);
    S.push(size);
    D.push(rr());
    H.push(heart ? 1 : 0);
    start.push(p[0] + (rr() - 0.5) * halfWidth * 1.6, p[1] + (rr() - 0.5) * halfHeight * 1.6, p[2] + (rr() - 0.5) * 2);
    ctrl.push(...via);
    home.push(...homePoint());
    delay.push(Math.min(1, dist(via) / maxDist));
  };
  edges.forEach(([i, j, heart]) => {
    const a = nodes[i].p,
      b = nodes[j].p,
      len = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const m = a.map((v, k) => (v + b[k]) / 2 + gauss(rr) * len * (heart ? 0.03 : 0.12));
    const via = dist(a) < dist(b) ? a : b;
    const n = Math.round(len * (heart ? 150 : 95));
    for (let k = 0; k < n; k++) {
      const t = rr(),
        it = 1 - t;
      const q = [0, 1, 2].map((d) => it * it * a[d] + 2 * it * t * m[d] + t * t * b[d]);
      // Filaments are thin threads that thicken near their middles.
      const sig = (heart ? 0.03 : 0.05) + 0.05 * Math.sin(Math.PI * t) * (heart ? 0.4 : 1);
      const depth = Math.min(1, Math.max(0, (cz - 1 - q[2]) / 3));
      const base = mix3(rr() < 0.3 ? blue : rose, far, depth * 0.6);
      const col = mix3(base, hot, rr() * 0.25).map((v) => v * (0.28 + rr() * 0.32) * (1 - depth * 0.4));
      add([q[0] + gauss(rr) * sig, q[1] + gauss(rr) * sig, q[2] + gauss(rr) * sig], col, 0.3 + Math.pow(rr(), 9) * 1.4, heart, via);
    }
  });
  // Clusters: a knot of bright galaxies at every node, gold ellipticals at the heart of each.
  nodes.forEach((node) => {
    const n = node.heart ? 10 : 14 + Math.floor(rr() * 30);
    for (let k = 0; k < n; k++) {
      const s2 = 0.04 + rr() * 0.08;
      add(
        node.p.map((v) => v + gauss(rr) * s2),
        (k % 4 ? cream : gold).map((v) => v * (0.45 + rr() * 0.4)),
        0.45 + Math.pow(rr(), 4) * 1.5,
        node.heart,
        node.p,
      );
    }
  });
  // A deep field of faint, far galaxies filling the voids.
  for (let k = 0; k < 2200; k++) {
    const p = [cx + (rr() - 0.5) * 2.6 * halfWidth, cy + (rr() - 0.5) * 2.4 * halfHeight, cz - 2 + (rr() - 0.5) * 5];
    const tint = [cream, blue, far, rose][k % 4];
    add(p, tint.map((v) => v * (0.12 + Math.pow(rr(), 3) * 0.3)), 0.25 + Math.pow(rr(), 12) * 1.2, false, p);
  }
  return { P, C, S, D, H, start, ctrl, home, delay, notch, hero: nodes[HN + 3].p, count: P.length / 3 };
}
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function arcTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const x = canvas.getContext("2d");
  x.shadowColor = "white";
  x.shadowBlur = 6;
  x.strokeStyle = "rgba(255,255,255,0.9)";
  x.lineWidth = 3;
  x.lineCap = "round";
  x.beginPath();
  x.arc(64, 130, 90, -Math.PI * 0.68, -Math.PI * 0.32);
  x.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createUniverse(scene, pixelRatio) {
  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: 70 * pixelRatio },
      uMaxSize: { value: 36 * pixelRatio },
      uOpacity: { value: 0 },
      uGather: { value: 0 },
      uFlow: { value: 0 },
      uHeart: { value: 0 },
      uTime: { value: 0 },
      uLatte: { value: new THREE.Color("#fff8e7") },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  let points = null,
    notch = new THREE.Vector3();
  const glow = glowTexture(),
    arc = arcTexture();
  const extras = [];
  const sprite = (map, color, size, strength, rot = 0) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, color, transparent: true, opacity: 0, rotation: rot, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    s.scale.setScalar(size);
    s.userData.strength = strength;
    root.add(s);
    extras.push(s);
    return s;
  };
  // A hero cluster: a cream halo, rose-lilac hot gas, and thin arcs of lensed light.
  const halo = sprite(glow, "#f6e2c0", 1.4, 0.14),
    gas = sprite(glow, "#d58ab6", 0.9, 0.08),
    arcs = [0.4, 2.6].map((rot, i) => sprite(arc, i % 2 ? "#cfe0ff" : "#ffc49a", 0.6, 0.28, rot));
  return {
    root,
    get notch() {
      return notch;
    },
    build(centre, halfWidth, halfHeight) {
      const web = generateWeb({ centre: centre.toArray(), halfWidth, halfHeight });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(web.P, 3));
      g.setAttribute("aColor", new THREE.Float32BufferAttribute(web.C, 3));
      g.setAttribute("aScale", new THREE.Float32BufferAttribute(web.S, 1));
      g.setAttribute("aSeed", new THREE.Float32BufferAttribute(web.D, 1));
      g.setAttribute("aHeart", new THREE.Float32BufferAttribute(web.H, 1));
      g.setAttribute("aStart", new THREE.Float32BufferAttribute(web.start, 3));
      g.setAttribute("aCtrl", new THREE.Float32BufferAttribute(web.ctrl, 3));
      g.setAttribute("aHome", new THREE.Float32BufferAttribute(web.home, 3));
      g.setAttribute("aDelay", new THREE.Float32BufferAttribute(web.delay, 1));
      if (points) {
        points.geometry.dispose();
        points.geometry = g;
      } else {
        points = new THREE.Points(g, material);
        points.frustumCulled = false;
        root.add(points);
      }
      notch.fromArray(web.notch);
      const hero = new THREE.Vector3().fromArray(web.hero);
      halo.position.copy(hero);
      gas.position.copy(hero);
      arcs.forEach((a, i) => {
        const rot = [0.4, 2.6][i];
        a.position.copy(hero).add(new THREE.Vector3(Math.sin(-rot) * 0.32, Math.cos(-rot) * 0.32, 0));
      });
    },
    set({ opacity, gather, flow, heart }) {
      root.visible = opacity > 0.005;
      material.uniforms.uOpacity.value = opacity * 0.9;
      material.uniforms.uGather.value = gather;
      material.uniforms.uFlow.value = flow;
      material.uniforms.uHeart.value = heart;
      extras.forEach((s) => (s.material.opacity = opacity * gather * (1 - flow) * s.userData.strength));
    },
    update(t, reduced) {
      material.uniforms.uTime.value = reduced ? 0 : t;
    },
    setTheme(theme) {
      material.blending = theme === "day" ? THREE.NormalBlending : THREE.AdditiveBlending;
      material.needsUpdate = true;
    },
    dispose() {
      points?.geometry.dispose();
      material.dispose();
      extras.forEach((s) => s.material.dispose());
      glow.dispose();
      arc.dispose();
    },
  };
}
