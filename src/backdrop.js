import * as THREE from "three";
import { galaxyGeometry, galaxyMaterial, seeded } from "./galaxy.js";

// A deep, quiet universe behind every scene: layered starlight, a few far spiral
// galaxies and faint nebulae. Depth comes from distance, so a drifting camera
// moves near stars more than far ones.
export function createBackdrop(scene, pixelRatio) {
  const group = new THREE.Group();
  scene.add(group);
  const random = seeded(101);

  const count = 2400,
    positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3),
    scales = new Float32Array(count),
    seeds = new Float32Array(count);
  const tints = [
    [1, 0.93, 0.82],
    [0.82, 0.88, 1],
    [1, 0.84, 0.8],
    [1, 1, 1],
  ];
  for (let i = 0; i < count; i++) {
    const depth = Math.pow(random(), 0.7);
    positions.set(
      [(random() - 0.5) * (14 + depth * 34), (random() - 0.5) * (22 + depth * 44), -5 - depth * 34],
      i * 3,
    );
    const tint = tints[i % tints.length],
      level = 0.55 + random() * 0.45;
    colors.set(tint.map((c) => c * level), i * 3);
    scales[i] = 0.35 + Math.pow(random(), 9) * 3.4;
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const starMaterial = galaxyMaterial({ size: 72 * pixelRatio, spin: 0 });
  const stars = new THREE.Points(geometry, starMaterial);
  stars.frustumCulled = false;
  group.add(stars);

  const farMaterial = galaxyMaterial({ size: 52 * pixelRatio, spin: 0.05 });
  const shapes = [
    galaxyGeometry({ count: 900, radius: 1, seed: 21, branches: 2, spin: 2.8 }),
    galaxyGeometry({
      count: 800,
      radius: 1,
      seed: 23,
      branches: 3,
      spin: 1.9,
      palette: ["#f7e7c6", "#cfa3b8", "#8fa9c6"],
    }),
  ];
  const far = [
    [-5.5, 8.5, -24, 1.4],
    [6.5, 4, -28, 1.1],
    [-6, -7.5, -22, 1.2],
    [5, -10, -30, 1.6],
    [0.5, 12.5, -32, 1],
  ].map(([x, y, z, s], i) => {
    const g = new THREE.Points(shapes[i % 2], farMaterial);
    g.position.set(x, y, z);
    g.rotation.set(0.5 + random() * 1.1, random() * 3, random() * 3);
    g.scale.setScalar(s);
    g.frustumCulled = false;
    group.add(g);
    return g;
  });

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d"),
    gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const haze = new THREE.CanvasTexture(canvas);
  haze.colorSpace = THREE.SRGBColorSpace;
  const nebulae = [
    ["#b97f93", -7, 9, -26, 20, 0.11],
    ["#5f86a8", 8, -2, -30, 24, 0.1],
    ["#c9a46f", -4, -11, -28, 18, 0.07],
    ["#8f7fb3", 6, 12, -34, 22, 0.08],
  ].map(([color, x, y, z, s, strength]) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haze,
        color,
        transparent: true,
        opacity: strength,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(s, s * 0.7, 1);
    sprite.userData.strength = strength;
    group.add(sprite);
    return sprite;
  });

  let level = 0;
  return {
    setTheme(theme) {
      // On daylight paper the night sky would read as grey dust; keep it for the night.
      group.visible = theme !== "day";
    },
    update(dt, t, reduced) {
      level = THREE.MathUtils.damp(level, 1, reduced ? 1000 : 1.2, dt);
      const time = reduced ? 0 : t;
      starMaterial.uniforms.uTime.value = time;
      starMaterial.uniforms.uOpacity.value = level * 0.95;
      farMaterial.uniforms.uTime.value = time;
      farMaterial.uniforms.uOpacity.value = level * 0.32;
      far.forEach((g, i) => (g.rotation.z += dt * (reduced ? 0 : 0.012 + i * 0.003)));
      nebulae.forEach((sprite, i) => {
        sprite.material.opacity =
          level * sprite.userData.strength * (reduced ? 1 : 0.85 + Math.sin(t * 0.15 + i * 1.7) * 0.15);
      });
    },
    dispose() {
      geometry.dispose();
      starMaterial.dispose();
      shapes.forEach((s) => s.dispose());
      farMaterial.dispose();
      nebulae.forEach((s) => s.material.dispose());
      haze.dispose();
    },
  };
}
