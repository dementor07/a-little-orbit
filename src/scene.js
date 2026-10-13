import * as THREE from "three";
import { attachInteractions } from "./interactions.js";
import { createMagic } from "./magic.js";
import { createOrbit } from "./orbit.js";
import { createCosmos } from "./galaxy.js";

export function createScene(host, options) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  let reduced = options.reducedMotion,
    currentStep = 0,
    open = 0,
    cakeMix = 0,
    celebration = -1,
    alive = true,
    wishProgress = 0,
    moonShow = 1,
    finaleDrop = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.3, 10.7);
  camera.lookAt(0, 0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  host.append(renderer.domElement);
  const textures = [];
  const ambient = new THREE.HemisphereLight(0xfff4d5, 0x657f99, 1.8);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff0ce, 2.4);
  key.position.set(-3, 6, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa9c8ec, 0.9);
  fill.position.set(5, 1, 3);
  scene.add(fill);

  function paperTexture(colour, drawing) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1024, 640);
    let seed = 71;
    for (let i = 0; i < 22000; i++) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1024;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 640;
      ctx.fillStyle = i % 2 ? "#ffffff0b" : "#483a2008";
      ctx.fillRect(x, y, 1.8, 1.8);
    }
    drawing?.(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures.push(texture);
    return texture;
  }
  function drawStar(ctx, x, y, radius, fill = "#e2c781") {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2,
        r = i % 2 ? radius * 0.22 : radius;
      if (!i) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  const backTexture = paperTexture("#e4c77f");
  const flapTexture = paperTexture("#efd899");
  let frontTexture;
  function frontDrawing(ctx) {
    ctx.strokeStyle = "#6b633d48";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 35, 956, 570);
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.lineTo(512, 326);
    ctx.lineTo(1024, 640);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#334b53";
    ctx.font = 'italic 48px "Cormorant Garamond"';
    const greeting = `For ${options.name},`;
    ctx.fillText(greeting, 82, 403, 380);
    ctx.fillText("with all my love.", 82, 454, 370);
    ctx.font = "500 11px Manrope";
    ctx.letterSpacing = "3px";
    ctx.fillStyle = "#5d654d";
    ctx.fillText("A LITTLE BIRTHDAY MAGIC", 84, 515);
    drawStar(ctx, 923, 517, 24, "#8c7c47");
    drawStar(ctx, 875, 558, 10, "#8c7c47");
    // A postmark from home, inked a little unevenly like a real one.
    ctx.save();
    ctx.translate(858, 228);
    ctx.rotate(-0.16);
    ctx.strokeStyle = "#6d6440";
    ctx.fillStyle = "#6d6440";
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 47, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "600 12px Manrope";
    ctx.letterSpacing = "0px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ringText = (text, start, direction) => {
      const step = 0.155;
      [...text].forEach((ch, i) => {
        const a = start + direction * (i - (text.length - 1) / 2) * step;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, direction > 0 ? -56.5 : 56.5);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
    };
    ringText("THE MILKY WAY", 0, 1);
    ringText("SOLAR SYSTEM", 0, -1);
    ctx.font = 'italic 22px "Cormorant Garamond"';
    ctx.fillText("Earth", 0, -4);
    ctx.font = "600 9px Manrope";
    ctx.fillText("14 OCT 2026", 0, 17);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let x = 78; x <= 134; x += 4) {
        const y = -24 + i * 16 + Math.sin(x * 0.075) * 4;
        if (x === 78) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  frontTexture = paperTexture("#e5cb87", frontDrawing);
  const envelope = new THREE.Group();
  scene.add(envelope);
  envelope.rotation.set(-0.11, -0.2, -0.16);
  const paper = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.98,
    side: THREE.DoubleSide,
  });
  const frontMaterial = new THREE.MeshStandardMaterial({
    map: frontTexture,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const envelopeBack = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 2.8, 0.06),
    paper,
  );
  envelope.add(envelopeBack);
  // The insert peeks out of the envelope, like a real card rather than a flat illustration.
  const insertTexture = paperTexture("#233e53", (ctx) => {
    ctx.strokeStyle = "#d9c58b90";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 976, 592);
    const positions = [
      [110, 80, 22],
      [350, 115, 12],
      [810, 85, 18],
      [920, 240, 15],
      [565, 70, 10],
      [100, 280, 14],
      [710, 160, 8],
    ];
    positions.forEach(([x, y, r]) => drawStar(ctx, x, y, r));
    ctx.fillStyle = "#eee8d0";
    ctx.font = 'italic 46px "Cormorant Garamond"';
    ctx.textAlign = "center";
    ctx.fillText("my person, in every universe", 512, 205);
    ctx.strokeStyle = "#cfb878a0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(505, 400, 330, 120, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#e6ce87";
    ctx.beginPath();
    ctx.arc(530, 395, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#233e53";
    ctx.beginPath();
    ctx.arc(554, 377, 60, 0, Math.PI * 2);
    ctx.fill();
  });
  const insert = new THREE.Mesh(
    new THREE.PlaneGeometry(3.94, 2.65),
    new THREE.MeshStandardMaterial({
      map: insertTexture,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  insert.position.set(0, 0.55, 0.05);
  insert.rotation.z = 0.055;
  envelope.add(insert);
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.8),
    frontMaterial,
  );
  front.position.z = 0.13;
  envelope.add(front);
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-2.2, 0);
  flapShape.lineTo(2.2, 0);
  flapShape.lineTo(0.14, -1.66);
  flapShape.quadraticCurveTo(0, -1.76, -0.14, -1.66);
  flapShape.closePath();
  const flapGeo = new THREE.ShapeGeometry(flapShape);
  // ShapeGeometry defaults to position-based UVs; normalize them for the paper grain.
  const uv = flapGeo.attributes.uv;
  const position = flapGeo.attributes.position;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(
      i,
      (position.getX(i) + 2.2) / 4.4,
      (position.getY(i) + 1.76) / 1.76,
    );
  const flap = new THREE.Mesh(
    flapGeo,
    new THREE.MeshStandardMaterial({
      map: flapTexture,
      side: THREE.DoubleSide,
      roughness: 0.96,
    }),
  );
  flap.position.set(0, 1.4, 0.16);
  envelope.add(flap);
  const seal = new THREE.Group();
  const sealMat = new THREE.MeshStandardMaterial({
    color: "#bb8a4e",
    roughness: 0.48,
    metalness: 0.2,
  });
  const sealMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.34, 0.075, 48),
    sealMat,
  );
  sealMesh.rotation.x = Math.PI / 2;
  seal.add(sealMesh);
  const sealRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.278, 0.009, 8, 64),
    new THREE.MeshStandardMaterial({
      color: "#e1b570",
      metalness: 0.35,
      roughness: 0.6,
    }),
  );
  sealRim.position.z = 0.05;
  seal.add(sealRim);
  const embossMat = new THREE.MeshStandardMaterial({
    color: "#e4b977",
    metalness: 0.15,
    roughness: 0.7,
  });
  const sealSun = new THREE.Mesh(new THREE.CircleGeometry(0.09, 32), embossMat);
  sealSun.position.z = 0.055;
  seal.add(sealSun);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const ray = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.055, 0.007),
      embossMat,
    );
    ray.position.set(Math.sin(a) * 0.145, Math.cos(a) * 0.145, 0.056);
    ray.rotation.z = -a;
    seal.add(ray);
  }
  seal.position.set(0.03, -1.52, 0.08);
  flap.add(seal);

  const moonMat = new THREE.MeshStandardMaterial({
    color: "#b8b69e",
    roughness: 1,
  });
  const lunarMoon = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 48, 32),
    moonMat,
  );
  lunarMoon.position.set(2, 1.65, -0.7);
  lunarMoon.rotation.y = 1.1;
  scene.add(lunarMoon);
  // A larger, invisible reach for the moon while it is small enough to pull.
  const moonTouch = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  lunarMoon.add(moonTouch);
  new THREE.TextureLoader().load(
    `${import.meta.env.BASE_URL}assets/moon.jpg`,
    (texture) => {
      if (!alive) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      moonMat.map = texture;
      moonMat.bumpMap = texture;
      moonMat.bumpScale = 0.035;
      moonMat.needsUpdate = true;
    },
    undefined,
    () => {},
  );
  const gold = new THREE.MeshStandardMaterial({
    color: "#ddc77f",
    metalness: 0.5,
    roughness: 0.34,
  });
  function starMesh(radius) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 + Math.PI / 2,
        r = i % 2 ? radius * 0.43 : radius;
      if (!i) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.045,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.012,
        bevelSegments: 2,
        steps: 1,
      }),
      gold,
    );
    return mesh;
  }
  const largeStar = starMesh(0.3);
  largeStar.position.set(-2.15, -1.65, 0.3);
  largeStar.rotation.z = -0.3;
  scene.add(largeStar);
  const littleStar = starMesh(0.15);
  littleStar.position.set(2.25, -1.2, -0.1);
  littleStar.rotation.z = 0.25;
  scene.add(littleStar);

  const cake = new THREE.Group();
  cake.visible = false;
  scene.add(cake);
  cake.position.y = -0.35;
  const plateMat = new THREE.MeshStandardMaterial({
    color: "#c7d1c9",
    metalness: 0.15,
    roughness: 0.3,
  });
  const butterMat = new THREE.MeshStandardMaterial({
    color: "#e7d5a2",
    roughness: 0.8,
  });
  const frostingMat = new THREE.MeshStandardMaterial({
    color: "#f3e8c9",
    roughness: 0.65,
  });
  function cylinder(r1, r2, h, mat, y) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 72), mat);
    mesh.position.y = y;
    cake.add(mesh);
    return mesh;
  }
  cylinder(1.8, 1.8, 0.09, plateMat, -1);
  cylinder(0.48, 0.62, 0.67, plateMat, -1.37);
  cylinder(0.95, 0.95, 0.09, plateMat, -1.73);
  cylinder(1.4, 1.4, 1.1, butterMat, -0.4);
  cylinder(1.42, 1.42, 0.12, frostingMat, 0.17);
  // Repeated decorations share draw calls to keep the cake smooth on phones.
  const stamp = new THREE.Object3D();
  const creams = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.115, 12, 8),
    frostingMat,
    38,
  );
  for (let i = 0; i < 38; i++) {
    const a = (i / 38) * Math.PI * 2;
    stamp.position.set(Math.cos(a) * 1.29, 0.25, Math.sin(a) * 1.29);
    stamp.scale.set(1, 0.85, 1);
    stamp.updateMatrix();
    creams.setMatrixAt(i, stamp.matrix);
  }
  cake.add(creams);
  const ridges = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.92, 5),
    frostingMat,
    56,
  );
  stamp.scale.set(1, 1, 1);
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    stamp.position.set(Math.cos(a) * 1.405, -0.41, Math.sin(a) * 1.405);
    stamp.updateMatrix();
    ridges.setMatrixAt(i, stamp.matrix);
  }
  cake.add(ridges);
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.92, 24),
    new THREE.MeshStandardMaterial({ color: "#7f9caa", roughness: 0.6 }),
  );
  candle.position.y = 0.72;
  cake.add(candle);
  for (let i = 0; i < 7; i++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.086, 0.018, 6, 24),
      frostingMat,
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.34 + i * 0.12;
    cake.add(band);
  }
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8),
    new THREE.MeshBasicMaterial({ color: "#55442f" }),
  );
  wick.position.y = 1.24;
  cake.add(wick);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 24, 16),
    new THREE.MeshBasicMaterial({ color: "#ffda87" }),
  );
  flame.scale.set(0.75, 1.8, 0.75);
  flame.position.y = 1.46;
  cake.add(flame);
  const flameInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#fff8dc" }),
  );
  flameInner.scale.set(0.7, 1.5, 0.7);
  flameInner.position.set(0, 1.42, 0.055);
  cake.add(flameInner);
  const candleLight = new THREE.PointLight(0xffce77, 2, 4);
  candleLight.position.set(0, 1.45, 0);
  cake.add(candleLight);
  const berryMat = new THREE.MeshStandardMaterial({
    color: "#ab5960",
    roughness: 0.85,
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const berry = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 12),
      berryMat,
    );
    berry.scale.y = 1.2;
    berry.position.set(Math.cos(a) * 0.98, 0.35, Math.sin(a) * 0.98);
    cake.add(berry);
  }
  const confetti = new THREE.Group();
  scene.add(confetti);
  const confettiMaterials = ["#e9d28a", "#8caebb", "#d69a98", "#e9ecdd"].map(
    (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
  );
  const confettiGeo = new THREE.PlaneGeometry(0.065, 0.13);
  for (let i = 0; i < 95; i++) {
    const p = new THREE.Mesh(confettiGeo, confettiMaterials[i % 4]);
    p.userData = {
      angle: i * 2.399,
      speed: 0.7 + (i % 7) * 0.17,
      lift: 2 + (i % 9) * 0.16,
      spin: i * 0.6,
    };
    p.visible = false;
    confetti.add(p);
  }
  const magic = createMagic({ scene, renderer, camera, host, moon: lunarMoon, flame });
  const orbit = createOrbit({
    scene,
    renderer,
    moon: lunarMoon,
    glowTexture: magic.glowTexture,
    emit: magic.emit,
    heartPop: magic.heartPop,
    options,
  });
  const cosmos = createCosmos(scene, renderer.getPixelRatio());
  const interactions = attachInteractions({
    host,
    renderer,
    scene,
    camera,
    envelope,
    cake,
    moon: lunarMoon,
    flame,
    makeStar: starMesh,
    decorations: [largeStar, littleStar],
    kissHeart: magic.heart,
    effects: magic,
    orbit,
    options,
  });
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = Math.max(
      8.2,
      5.6 / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect),
    );
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    interactions.resize();
    magic.resize();
    orbit.resize(interactions.project);
    const far = (x, y) => interactions.project(x, y, -7);
    cosmos.place(
      interactions.project(0.5, 0.53, -2.2),
      far(0, 0.5).distanceTo(far(1, 0.5)) / 2,
      far(0.5, 0).distanceTo(far(0.5, 1)) / 2,
    );
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  let previous = performance.now(),
    elapsed = 0;
  const projectedFlame = new THREE.Vector3();
  const projectedMoon = new THREE.Vector3();
  const projectedKiss = new THREE.Vector3();
  function render(now) {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (document.hidden) return;
    elapsed += dt;
    const t = reduced ? 0 : elapsed;
    open = THREE.MathUtils.damp(open, currentStep === 1 ? 1 : 0, 5, dt);
    cakeMix = THREE.MathUtils.damp(cakeMix, currentStep === 2 ? 1 : 0, 5, dt);
    if (reduced) {
      open = currentStep === 1 ? 1 : 0;
      cakeMix = currentStep === 2 ? 1 : 0;
    }
    envelope.visible = currentStep !== 3 && currentStep !== 4 && cakeMix < 0.98;
    envelope.scale.setScalar(Math.max(0.001, 1 - cakeMix));
    envelope.rotation.y = THREE.MathUtils.damp(
      envelope.rotation.y,
      interactions.rotation.envelopeY,
      3,
      dt,
    );
    envelope.rotation.x = THREE.MathUtils.damp(
      envelope.rotation.x,
      interactions.rotation.envelopeX,
      3,
      dt,
    );
    envelope.position.y = Math.sin(t * 0.65) * 0.085 - open * 0.7;
    flap.rotation.x = -open * Math.PI * 0.93;
    insert.position.y = 0.55 + open * 0.6;
    cake.visible = cakeMix > 0.02;
    cake.scale.setScalar(Math.max(0.001, cakeMix));
    cake.rotation.y = THREE.MathUtils.damp(
      cake.rotation.y,
      interactions.rotation.cakeY,
      3,
      dt,
    );
    // In the finale the cake settles lower, leaving the wish-heart its own space.
    finaleDrop = THREE.MathUtils.damp(finaleDrop, celebration >= 0 ? 1 : 0, reduced ? 1000 : 2.5, dt);
    cake.scale.multiplyScalar(1 - finaleDrop * 0.1);
    cake.position.y = -0.65 - finaleDrop * 0.6 + Math.sin(t * 0.65) * 0.045;
    cake.rotation.x = THREE.MathUtils.damp(
      cake.rotation.x,
      interactions.rotation.cakeX,
      6,
      dt,
    );
    flame.scale.x = (0.75 + Math.sin(t * 7) * 0.08) * (1 - wishProgress * 0.8);
    flame.scale.y = (1.8 + Math.sin(t * 8) * 0.12) * (1 - wishProgress * 0.7);
    flame.rotation.z = wishProgress * 0.8;
    flameInner.scale.set(
      0.7 * (1 - wishProgress * 0.8),
      1.5 * (1 - wishProgress * 0.7),
      0.7,
    );
    candleLight.intensity = 2 * (1 - wishProgress * 0.9);
    lunarMoon.position.set(2, 1.65 + Math.sin(t * 0.3) * 0.07, -0.7);
    largeStar.rotation.y = Math.sin(t * 0.4) * 0.4;
    littleStar.rotation.y = t * 0.2;
    if (celebration >= 0) {
      celebration += dt;
      confetti.children.forEach((p) => {
        p.visible = !reduced && celebration < 5.5;
        const d = p.userData,
          v = celebration;
        p.position.set(
          Math.cos(d.angle) * v * d.speed,
          d.lift * v - 0.55 * v * v,
          Math.sin(d.angle) * v * d.speed * 0.5 + 1,
        );
        p.rotation.set(d.spin + v * 2, v * 1.6, v);
      });
    }
    interactions.update(dt, t, reduced);
    orbit.update(dt, t, reduced);
    moonTouch.scale.setScalar(currentStep === 4 ? 1.8 : 1);
    // Out among the galaxy, the moon steps aside.
    moonShow = THREE.MathUtils.damp(moonShow, currentStep === 3 ? 0 : 1, reduced ? 1000 : 4, dt);
    lunarMoon.scale.multiplyScalar(Math.max(0.001, moonShow));
    lunarMoon.visible = moonShow > 0.02;
    cosmos.update(dt, t, reduced);
    magic.update(dt, t, reduced, wishProgress, interactions.rotation);
    renderer.render(scene, camera);
    if (options.onMoonPosition) {
      lunarMoon.getWorldPosition(projectedMoon).project(camera);
      options.onMoonPosition(
        (projectedMoon.x + 1) / 2,
        (1 - projectedMoon.y) / 2,
      );
    }
    if (magic.heart.visible && options.onKissPosition) {
      magic.heart.getWorldPosition(projectedKiss).project(camera);
      options.onKissPosition(
        (projectedKiss.x + 1) / 2,
        (1 - projectedKiss.y) / 2,
      );
    }
    if (currentStep === 2 && options.onFlamePosition) {
      flame.getWorldPosition(projectedFlame).project(camera);
      options.onFlamePosition(
        (projectedFlame.x + 1) / 2,
        (1 - projectedFlame.y) / 2,
      );
    }
  }
  renderer.setAnimationLoop(render);
  // Compile every shader now, while the envelope floats, so later moments never stutter.
  setTimeout(() => {
    if (!alive) return;
    const hidden = [];
    scene.traverse((object) => {
      if (!object.visible) {
        hidden.push(object);
        object.visible = true;
      }
    });
    try {
      renderer.compile(scene, camera);
    } catch {}
    hidden.forEach((object) => (object.visible = false));
  }, 400);
  function resetWish() {
    celebration = -1;
    flame.visible = true;
    flameInner.visible = true;
    candleLight.visible = true;
    confetti.children.forEach((p) => (p.visible = false));
  }
  return {
    setStep(step) {
      currentStep = step;
      magic.setFinale(false);
      interactions.setStep(step);
      orbit.setActive(step === 4);
      cosmos.show({ galaxy: step === 3 });
      wishProgress = 0;
      resetWish();
    },
    setWishProgress(value) {
      wishProgress = value;
    },
    collectStar(index) {
      const origin = interactions.collectStar(index);
      if (origin) magic.star(origin);
    },
    spinMoon() {
      interactions.spinMoon();
    },
    driftMoon() {
      return orbit.drift();
    },
    highlightStar(index) {
      interactions.highlightStar(index);
    },
    celebrate() {
      magic.setFinale(true);
      cosmos.show({ universe: true });
      magic.shoot(flame.getWorldPosition(new THREE.Vector3()));
      interactions.celebrate();
      celebration = 0;
      flame.visible = false;
      flameInner.visible = false;
      candleLight.visible = false;
    },
    resetWish,
    sendKiss(point) {
      magic.sendKiss(point);
    },
    setTheme(theme) {
      ambient.intensity = theme === "day" ? 2 : 1.8;
      interactions.setTheme(theme);
      orbit.setTheme(theme);
      cosmos.setTheme(theme);
    },
    setReducedMotion(value) {
      reduced = value;
    },
    updateName(name) {
      options.name = name;
      const old = frontTexture;
      frontTexture = paperTexture("#e5cb87", frontDrawing);
      frontMaterial.map = frontTexture;
      old.dispose();
    },
    dispose() {
      alive = false;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      interactions.dispose();
      magic.dispose();
      orbit.dispose();
      cosmos.dispose();
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
