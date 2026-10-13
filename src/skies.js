import * as THREE from "three";
import { glowTexture, linear, pointsGeometry, seeded, starMaterial } from "./galaxy.js";

// Skies that match the scale. At home (under air) stars twinkle. Out in the solar system they
// hold perfectly still; the Sun glares from just past the corner, its zodiacal light leans
// along the ecliptic with a few planets on it, and the Milky Way crosses the dark as a band:
// the first glimpse of the galaxy the journey is about to leave.

function canvasTexture(size, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d"), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function starField(count, seed, box, palette, scaleFn) {
  const r = seeded(seed);
  const P = [],
    C = [],
    S = [],
    D = [];
  for (let i = 0; i < count; i++) {
    P.push((r() - 0.5) * box[0], (r() - 0.5) * box[1], box[2] - r() * box[3]);
    const tint = palette[i % palette.length],
      level = 0.5 + r() * 0.5;
    C.push(...tint.map((c) => c * level));
    S.push(scaleFn(r));
    D.push(r());
  }
  return { P, C, S, D };
}

export function createSkies(scene, pixelRatio, renderer) {
  const pr = pixelRatio;
  const white = linear("#f4f1ea"),
    warm = linear("#ffd9b0"),
    cool = linear("#cfdcff");
  const palette = [white, white, white, white, white, white, white, white, warm, cool];

  // Home: seen through air, so they twinkle.
  const homeData = starField(900, 101, [30, 34, -18, 12], palette, (r) => 0.35 + Math.pow(r(), 9) * 3);
  const home = new THREE.Points(pointsGeometry(homeData.P, homeData.C, homeData.S, homeData.D), starMaterial({ size: 72 * pr, maxSize: 26 * pr, twinkle: 1 }));
  home.frustumCulled = false;
  scene.add(home);

  // Space: steady stars, faint dust, and planets placed along the ecliptic on resize.
  const stars = starField(170, 7, [30, 36, -14, 16], palette, (r) => 0.4 + Math.pow(r(), 9) * 3);
  const dust = starField(620, 9, [30, 36, -14, 16], [linear("#b9c3cf")], (r) => 0.3 + r() * 0.25);
  dust.C = dust.C.map((c) => c * 0.35);
  const planets = [
    ["#fff6e0", 2.6],
    ["#e8a07a", 1.6],
    ["#f2e2c4", 2.0],
  ];
  const P = [...stars.P, ...dust.P, ...planets.flatMap(() => [0, 0, -14])];
  const C = [...stars.C, ...dust.C, ...planets.flatMap(([hex]) => linear(hex))];
  const S = [...stars.S, ...dust.S, ...planets.map(([, s]) => s)];
  const D = [...stars.D, ...dust.D, ...planets.map(() => 0.5)];
  const spaceGeometry = pointsGeometry(P, C, S, D);
  const planetStart = stars.S.length + dust.S.length;
  const space = new THREE.Points(spaceGeometry, starMaterial({ size: 72 * pr, maxSize: 26 * pr, twinkle: 0 }));
  space.frustumCulled = false;
  scene.add(space);

  // The Milky Way band (NASA SVS Deep Star Maps, Gaia DR2), toned to rose, gold and cream.
  const bandMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uOpacity: { value: 0 },
      uRose: { value: new THREE.Color("#d99a98") },
      uGold: { value: new THREE.Color("#ead38e") },
      uCream: { value: new THREE.Color("#fff3dc") },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform vec3 uRose, uGold, uCream;
      varying vec2 vUv;
      void main() {
        vec3 c = texture2D(uMap, vUv).rgb;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        vec3 tint = mix(uRose * 0.55, uGold, smoothstep(0.03, 0.25, l));
        tint = mix(tint, uCream, smoothstep(0.25, 0.6, l));
        vec3 col = mix(tint * l * 1.7, c, 0.15);
        float e = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
        gl_FragColor = vec4(col, e * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(64, 13), bandMaterial);
  band.visible = false;
  scene.add(band);
  let bandTexture = null,
    alive = true;
  new THREE.TextureLoader().load(
    `${import.meta.env.BASE_URL}assets/milky-way-band.jpg`,
    (texture) => {
      if (!alive) return texture.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      bandTexture = texture;
      bandMaterial.uniforms.uMap.value = texture;
      renderer?.initTexture(texture);
    },
    undefined,
    () => {},
  );

  // Zodiacal light: a soft cone of sunlit dust leaning along the ecliptic.
  const coneTexture = canvasTexture(128, (x, s) => {
    const g = x.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, s * 0.12);
    x.lineTo(s, s * 0.46);
    x.lineTo(s, s * 0.54);
    x.lineTo(0, s * 0.88);
    x.fill();
  });
  const cone = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: coneTexture, color: "#f3e3c0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  scene.add(cone);

  // The Sun, just past the corner: a white-hot core, gold glare and fine rays. Never a yellow disc.
  const glow = glowTexture();
  const rays = canvasTexture(256, (x, s) => {
    const c = s / 2,
      rr = seeded(5);
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + rr() * 0.2,
        len = c * (0.45 + rr() * 0.55),
        w = 1 + rr() * 2.2;
      x.save();
      x.translate(c, c);
      x.rotate(a);
      const g = x.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, -w);
      x.lineTo(len, 0);
      x.lineTo(0, w);
      x.fill();
      x.restore();
    }
  });
  const sun = new THREE.Group();
  scene.add(sun);
  const sunParts = [
    [glow, "#e9b9b1", 3.2, 0.14],
    [glow, "#ead38e", 1.25, 0.42],
    [rays, "#fff0d0", 1.35, 0.5],
    [glow, "#fffaf0", 0.32, 1],
  ].map(([map, color, size, strength]) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.userData = { size, strength };
    sun.add(s);
    return s;
  });

  let sunDistance = 1,
    dayTheme = false;
  const tmp = new THREE.Vector3(),
    earthNdc = new THREE.Vector3();
  return {
    // Lay the solar sky out against the frame: the Sun past the top-left corner, the ecliptic
    // running down through the Earth, the band crossing to the Earth's right.
    layout(project, camera, earthCentre, aspect) {
      const sunPos = project(-0.04, -0.03, -8);
      sun.position.copy(sunPos);
      sunDistance = sunPos.distanceTo(camera.position);
      const position = spaceGeometry.attributes.position;
      [
        [0.22, 0.27],
        [0.75, 0.8],
        [0.93, 0.93],
      ].forEach(([x, y], i) => {
        const p = project(x, y, -14);
        position.setXYZ(planetStart + i, p.x, p.y, p.z);
      });
      position.needsUpdate = true;
      const a = project(0.04, 0.06, -6),
        b = project(0.5, 0.56, -6);
      cone.position.copy(a).lerp(b, 0.5);
      cone.scale.set(a.distanceTo(b) * 1.1, a.distanceTo(b) * 0.45, 1);
      cone.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
      const core = project(0.6, 1.02, -30),
        upper = project(0.98, 0.18, -30);
      band.position.copy(core);
      band.rotation.z = Math.atan2(upper.y - core.y, upper.x - core.x);
      earthNdc.copy(earthCentre).project(camera);
      tmp.copy(earthCentre).add(new THREE.Vector3(0, 0.56, 0)).project(camera);
      const maskR = Math.abs(tmp.y - earthNdc.y) * 1.15;
      space.material.uniforms.uMask.value.set(earthNdc.x, earthNdc.y, maskR);
      space.material.uniforms.uAspect.value = aspect;
    },
    set({ home: homeWeight, space: spaceWeight, band: bandWeight, sun: sunWeight }) {
      const night = !dayTheme;
      home.visible = homeWeight > 0.005 && night;
      home.material.uniforms.uOpacity.value = homeWeight * 0.9;
      space.visible = spaceWeight > 0.005 && night;
      space.material.uniforms.uOpacity.value = spaceWeight;
      cone.visible = spaceWeight > 0.005 && night;
      cone.material.opacity = spaceWeight * 0.07;
      band.visible = bandWeight > 0.005 && Boolean(bandTexture) && night;
      bandMaterial.uniforms.uOpacity.value = bandWeight;
      sun.visible = sunWeight > 0.005 && night;
      const unit = 2 * Math.tan(THREE.MathUtils.degToRad(17)) * sunDistance;
      sunParts.forEach((s) => {
        s.material.opacity = sunWeight * s.userData.strength;
        s.scale.setScalar(s.userData.size * unit * 0.35);
      });
    },
    update(t, reduced) {
      const time = reduced ? 0 : t;
      home.material.uniforms.uTime.value = time;
      space.material.uniforms.uTime.value = time;
      sunParts[2].material.rotation = time * 0.02;
    },
    setTheme(theme) {
      dayTheme = theme === "day";
    },
    get bandTexture() {
      return bandTexture;
    },
    dispose() {
      alive = false;
      [home, space].forEach((p) => {
        p.geometry.dispose();
        p.material.dispose();
      });
      band.geometry.dispose();
      bandMaterial.dispose();
      bandTexture?.dispose();
      cone.geometry.dispose();
      cone.material.dispose();
      coneTexture.dispose();
      sunParts.forEach((s) => s.material.dispose());
      glow.dispose();
      rays.dispose();
    },
  };
}
