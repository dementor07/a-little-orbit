import * as THREE from "three";
import { seeded } from "./galaxy.js";

// Bakery details: a glossy blush glaze with drips, sprinkles, a gilded plate rim and a
// warm halo around the flame. Repeated pieces are instanced to stay light on phones.
export function decorateCake(cake, { flame }) {
  const random = seeded(31);
  const glaze = new THREE.MeshPhysicalMaterial({
    color: "#e9b9b1",
    roughness: 0.32,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    sheen: 0.4,
    sheenColor: new THREE.Color("#fff0ea"),
  });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.425, 1.43, 0.07, 72), glaze);
  top.position.y = 0.205;
  cake.add(top);

  // Drips run down from the rim at uneven lengths, like real poured glaze.
  const dripCount = 34;
  const drips = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.055, 0.2, 4, 10), glaze, dripCount);
  const stamp = new THREE.Object3D();
  for (let i = 0; i < dripCount; i++) {
    const a = (i / dripCount) * Math.PI * 2 + (random() - 0.5) * 0.08,
      length = 0.45 + Math.pow(random(), 1.6) * 1.9;
    stamp.position.set(Math.cos(a) * 1.418, 0.235 - length * 0.155, Math.sin(a) * 1.418);
    stamp.rotation.set(0, -a, 0);
    stamp.scale.set(1, length, 0.7);
    stamp.updateMatrix();
    drips.setMatrixAt(i, stamp.matrix);
  }
  cake.add(drips);

  // Sprinkles lie scattered on the glaze, kept clear of the candle and berries.
  const sprinkleCount = 150;
  const sprinkles = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.014, 0.05, 2, 6),
    new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }),
    sprinkleCount,
  );
  const palette = ["#e8c96f", "#f6efe0", "#d98f95", "#9cb8c8", "#c9a24f"].map((c) => new THREE.Color(c));
  for (let i = 0; i < sprinkleCount; i++) {
    let r, a;
    do {
      r = 0.22 + Math.sqrt(random()) * 0.95;
      a = random() * Math.PI * 2;
    } while (Math.abs(r - 0.98) < 0.16);
    stamp.position.set(Math.cos(a) * r, 0.246, Math.sin(a) * r);
    stamp.rotation.set(Math.PI / 2, 0, random() * Math.PI);
    stamp.scale.setScalar(0.85 + random() * 0.4);
    stamp.updateMatrix();
    sprinkles.setMatrixAt(i, stamp.matrix);
    sprinkles.setColorAt(i, palette[i % palette.length]);
  }
  cake.add(sprinkles);

  const gold = new THREE.MeshStandardMaterial({ color: "#d9bd74", metalness: 0.75, roughness: 0.26 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.022, 10, 120), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.955;
  cake.add(rim);
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), gold, 64);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    stamp.position.set(Math.cos(a) * 1.4, -0.95, Math.sin(a) * 1.4);
    stamp.rotation.set(0, 0, 0);
    stamp.scale.setScalar(1);
    stamp.updateMatrix();
    beads.setMatrixAt(i, stamp.matrix);
  }
  cake.add(beads);

  // The flame's light: a soft inner glow and a wide warm halo.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d"),
    gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  const halo = [
    ["#ffd793", 0.75, 0.9],
    ["#ffb877", 1.7, 0.26],
  ].map(([color, size, strength]) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color,
        transparent: true,
        opacity: strength,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sprite.scale.setScalar(size);
    sprite.position.copy(flame.position);
    sprite.userData = { size, strength };
    cake.add(sprite);
    return sprite;
  });

  return {
    // Flicker with the flame; dim as the wish is held; vanish when it is blown out.
    update(t, wish, lit, reduced) {
      const flicker = reduced ? 1 : 0.9 + Math.sin(t * 9.1) * 0.05 + Math.sin(t * 23.7) * 0.04;
      halo.forEach((sprite) => {
        sprite.visible = lit;
        sprite.material.opacity = sprite.userData.strength * flicker * (1 - wish * 0.85);
        sprite.scale.setScalar(sprite.userData.size * (0.95 + flicker * 0.05) * (1 - wish * 0.4));
      });
    },
    dispose() {
      glowTexture.dispose();
      halo.forEach((sprite) => sprite.material.dispose());
    },
  };
}
