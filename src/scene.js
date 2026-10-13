import * as THREE from "three";
import { attachInteractions } from "./interactions.js";
import { createMagic } from "./magic.js";
import { createOrbit } from "./orbit.js";
import { createGalaxyLayer } from "./galaxy.js";
import { createSkies } from "./skies.js";
import { createUniverse } from "./universe.js";
import { createUs } from "./us.js";
import { createJourney } from "./journey.js";
import { decorateCake } from "./cake.js";

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
    finaleDrop = 0,
    cakeBaseX = 0.1,
    confettiAge = -1,
    scaleName = "home";
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
  // The canvas fills the whole screen, but the composition is laid out in a "frame":
  // the stage between the header and the hint, widened 10% each side, as it always was.
  // Positions are given in that frame; the camera's view offset lets the scene run
  // past it, under the header and hint, instead of stopping in a hard line.
  const view = {
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    W: 1,
    H: 1,
    worldLeft: 0,
    worldTop: 0,
    toCanvas(nx, ny) {
      return [(this.left + nx * this.width) / this.W, (this.top + ny * this.height) / this.H];
    },
  };
  const ambient = new THREE.HemisphereLight(0xfff4d5, 0x657f99, 1.8);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff0ce, 2.4);
  key.position.set(-3, 6, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa9c8ec, 0.9);
  fill.position.set(5, 1, 3);
  const keyHome = new THREE.Color(0xfff0ce),
    keySpace = new THREE.Color(0xfff1e4),
    keyHomePosition = new THREE.Vector3(-3, 6, 8),
    keySpacePosition = new THREE.Vector3(-4.5, 6.5, 3);
  let dayTheme = false;
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
  const cakeDetails = decorateCake(cake, { flame });
  // Paper confetti with real flight: it bursts up, slows in the air, then tumbles and
  // flutters down. Metallic pieces catch the key light as they turn.
  const confetti = new THREE.Group();
  scene.add(confetti);
  const confettiMaterials = [
    { color: "#e3c56f", metalness: 0.8, roughness: 0.28 },
    { color: "#f2ede0", metalness: 0, roughness: 0.6 },
    { color: "#d99a98", metalness: 0.35, roughness: 0.4 },
    { color: "#9db7c6", metalness: 0.2, roughness: 0.5 },
    { color: "#c9a24f", metalness: 0.85, roughness: 0.22 },
  ].map((m) => new THREE.MeshStandardMaterial({ ...m, side: THREE.DoubleSide }));
  const confettiShapes = [
    new THREE.PlaneGeometry(0.07, 0.14),
    new THREE.PlaneGeometry(0.1, 0.1),
    new THREE.CircleGeometry(0.055, 12),
  ];
  for (let i = 0; i < 150; i++) {
    const p = new THREE.Mesh(confettiShapes[i % 3], confettiMaterials[i % 5]);
    p.userData = {
      velocity: new THREE.Vector3(),
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      spin: 4 + Math.random() * 9,
      sway: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      delay: Math.random() * 0.25,
    };
    p.visible = false;
    confetti.add(p);
  }
  const launch = () => {
    confetti.children.forEach((p) => {
      const d = p.userData,
        a = Math.random() * Math.PI * 2,
        lift = 4.2 + Math.random() * 3.4,
        spread = 1 + Math.random() * 2.8;
      flame.getWorldPosition(p.position);
      p.position.y += 0.1;
      d.velocity.set(Math.cos(a) * spread, lift, Math.sin(a) * spread * 0.6 + 0.8);
      p.quaternion.setFromAxisAngle(d.axis, Math.random() * 6);
    });
  };
  const pixelRatio = renderer.getPixelRatio();
  const skies = createSkies(scene, pixelRatio);
  const galaxy = createGalaxyLayer(scene, pixelRatio);
  const universe = createUniverse(scene, pixelRatio);
  const us = createUs(scene, pixelRatio);
  const journey = createJourney({ reduced });
  const magic = createMagic({ scene, renderer, camera, view, moon: lunarMoon, flame });
  const orbit = createOrbit({
    scene,
    renderer,
    moon: lunarMoon,
    glowTexture: magic.glowTexture,
    emit: magic.emit,
    heartPop: magic.heartPop,
    options,
  });
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
    view,
    options,
  });
  const resize = () => {
    const W = host.clientWidth,
      H = host.clientHeight,
      stage = host.parentElement.getBoundingClientRect();
    if (!W || !H || !stage.width || !stage.height) return;
    Object.assign(view, {
      left: stage.left - stage.width * 0.1,
      top: stage.top,
      width: stage.width * 1.2,
      height: stage.height,
      W,
      H,
      worldLeft: stage.left,
      worldTop: stage.top,
    });
    renderer.setSize(W, H);
    camera.aspect = view.width / view.height;
    camera.position.z = Math.max(
      8.2,
      5.6 / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect),
    );
    camera.setViewOffset(view.width, view.height, -view.left, -view.top, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    interactions.resize();
    magic.resize();
    orbit.resize(interactions.project);
    skies.layout(interactions.project, camera, interactions.project(0.5, 0.56, 0));
    galaxy.place(interactions.project(0.5, 0.53, -2.2));
    const p = interactions.project;
    universe.build(
      magic.heartTarget,
      p(0.06, 0.5, -1).distanceTo(p(0.94, 0.5, -1)) / 2,
      p(0.5, 0.02, -1).distanceTo(p(0.5, 0.98, -1)) / 2,
    );
    risePoint.copy(p(0.5, 0.4, 1));
  };
  const risePoint = new THREE.Vector3();
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  observer.observe(host.parentElement);
  resize();
  let previous = performance.now(),
    elapsed = 0;
  const projectedFlame = new THREE.Vector3();
  const projectedMoon = new THREE.Vector3();
  // Screen position of a projected point, relative to the stage the DOM controls live in.
  const stageX = (v) => ((v.x + 1) / 2) * view.W - view.worldLeft,
    stageY = (v) => ((1 - v.y) / 2) * view.H - view.worldTop;
  const projectedKiss = new THREE.Vector3();
  const projectedUs = new THREE.Vector3();

  // Where every layer rests for each step; a playing journey overrides these exactly, and
  // when it ends values ease back to rest (they are designed to meet).
  const V = {};
  function restValues() {
    const s = currentStep,
      home = s === 0 || s === 1 || s === 2;
    return {
      home: home ? 1 : 0,
      space: s === 4 ? 1 : 0,
      band: s === 4 ? 0.45 : 0,
      sun: s === 4 ? 1 : 0,
      lights: s === 4 ? 1 : 0,
      solarZoom: s === 4 ? 1 : 0.06,
      solarLift: 0,
      galaxy: s === 3 ? 1 : 0,
      galaxyScale: 1,
      galaxyOrient: 1,
      galaxyLock: 0,
      dots: s === 3 ? 1 : 0,
      dotsAnchor: s === 3 ? 1 : 0,
      dotsSep: 1,
      usTag: 0,
      web: 0,
      webGather: 0,
      webFlow: 0,
      webHeart: 0,
      veil: 0,
      charm: celebration >= 0 ? 1 : 0,
      flame: 1,
      cakeShow: 1,
      cakeTilt: 0,
      cakeSink: 0,
      moonShow: s === 3 ? 0 : 1,
    };
  }
  Object.assign(V, restValues());
  const anchors = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    dotsPos = new THREE.Vector3(),
    flameRest = new THREE.Vector3(),
    flameNow = new THREE.Vector3(),
    sunDirection = new THREE.Vector3();
  const anchorAt = (value) => {
    const i = Math.max(0, Math.min(3, Math.floor(value)));
    return dotsPos.lerpVectors(anchors[i], anchors[Math.min(4, i + 1)], Math.min(1, value - i));
  };
  journey.onBeat((name, timeline) => {
    if (name === "arrive" && timeline === "pullout") {
      interactions.setStep(3);
      orbit.setActive(false, true);
    }
    if (name === "celebrate") {
      confettiAge = 0;
      launch();
      magic.shoot(magic.heartTarget);
    }
    if (name === "home") magic.startFireworks();
    options.onBeat?.(name, timeline);
  });
  function render(now) {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (document.hidden) return;
    elapsed += dt;
    const t = reduced ? 0 : elapsed;
    journey.update(dt);
    const rest = restValues();
    for (const key in rest) {
      if (journey.has(key)) V[key] = journey.value(key);
      else V[key] = reduced ? rest[key] : THREE.MathUtils.damp(V[key], rest[key], 4, dt);
    }
    open = THREE.MathUtils.damp(open, currentStep === 1 ? 1 : 0, 5, dt);
    cakeMix = THREE.MathUtils.damp(cakeMix, currentStep === 2 ? 1 : 0, 5, dt);
    if (reduced) {
      open = currentStep === 1 ? 1 : 0;
      cakeMix = currentStep === 2 ? 1 : 0;
    }
    envelope.visible = currentStep <= 1 && cakeMix < 0.98;
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
    // The cake arrives out of the rush home (top-down, then tilting to rest), sinks away
    // when her wish rides out, and rises back for the homecoming.
    const arrival = journey.name === "rushHome" ? V.cakeShow : 1;
    const cakeScale = (journey.name === "rushHome" ? 1 : cakeMix) * (1 - V.cakeSink * 0.35);
    cake.visible = cakeScale * arrival > 0.02 && V.cakeSink < 0.98;
    cake.scale.setScalar(Math.max(0.001, cakeScale));
    cake.rotation.y = THREE.MathUtils.damp(
      cake.rotation.y,
      interactions.rotation.cakeY,
      3,
      dt,
    );
    // In the finale the cake settles lower, leaving the wish-heart its own space.
    finaleDrop = THREE.MathUtils.damp(finaleDrop, celebration >= 0 ? 1 : 0, reduced ? 1000 : 2.5, dt);
    cake.scale.multiplyScalar(1 - finaleDrop * 0.1);
    cake.position.set(0, -0.65 - finaleDrop * 0.6 + Math.sin(t * 0.61 + 2) * 0.045 - V.cakeSink * 3.6, 0);
    cakeBaseX = THREE.MathUtils.damp(cakeBaseX, interactions.rotation.cakeX, 6, dt);
    cake.rotation.x = cakeBaseX;
    cake.updateMatrixWorld(true);
    flame.getWorldPosition(flameRest);
    if (arrival < 0.999 || V.cakeTilt > 0.001) {
      // Grow and tilt about the flame, so it stays exactly where the two dots became it.
      cake.scale.multiplyScalar(Math.max(0.001, arrival));
      cake.rotation.x = cakeBaseX + V.cakeTilt * 1.2;
      cake.updateMatrixWorld(true);
      flame.getWorldPosition(flameNow);
      cake.position.add(flameRest).sub(flameNow);
      cake.updateMatrixWorld(true);
    }
    const ignite = Math.max(0.001, V.flame);
    flame.scale.x = (0.75 + Math.sin(t * 7) * 0.08) * (1 - wishProgress * 0.8) * ignite;
    flame.scale.y = (1.8 + Math.sin(t * 8) * 0.12) * (1 - wishProgress * 0.7) * ignite;
    flame.rotation.z = wishProgress * 0.8;
    flameInner.scale.set(
      0.7 * (1 - wishProgress * 0.8),
      1.5 * (1 - wishProgress * 0.7),
      0.7,
    );
    candleLight.intensity = 2 * (1 - wishProgress * 0.9);
    lunarMoon.position.set(2, 1.65 + Math.sin((t * Math.PI * 2) / 11.6) * 0.07, -0.7);
    largeStar.rotation.y = Math.sin(t * 0.4) * 0.4;
    littleStar.rotation.y = t * 0.2;
    if (celebration >= 0) celebration += dt;
    if (confettiAge >= 0) {
      confettiAge += dt;
      confetti.children.forEach((p) => {
        const d = p.userData,
          live = confettiAge - d.delay;
        p.visible = !reduced && live > 0 && confettiAge < 7;
        if (!p.visible) return;
        // Gravity, strong air drag and a sideways flutter give paper its float.
        d.velocity.y -= 5.2 * dt;
        d.velocity.multiplyScalar(Math.exp(-2.1 * dt));
        const flutter = Math.sin(t * d.sway * 3 + d.phase);
        p.position.addScaledVector(d.velocity, dt);
        p.position.x += flutter * 0.55 * dt;
        p.rotateOnAxis(d.axis, d.spin * dt * (0.6 + Math.abs(flutter) * 0.6));
        p.scale.setScalar(Math.min(1, (7 - confettiAge) / 1.2));
      });
    }
    // A slow, barely-there camera drift: near things move more than the far universe.
    if (!reduced) {
      camera.position.x = Math.sin(t * 0.11) * 0.16;
      camera.position.y = 0.3 + Math.sin(t * 0.083 + 1.3) * 0.1;
      camera.lookAt(0, 0, 0);
    }
    cakeDetails.update(t, wishProgress, flame.visible && cake.visible && V.flame > 0.5, reduced);
    // Lights: warm and soft at home; in space, one hard white Sun so the Earth shows a real
    // terminator and the Moon's phase agrees with it.
    const L = dayTheme ? 0 : V.lights;
    ambient.intensity = THREE.MathUtils.lerp(dayTheme ? 2 : 1.8, 0.42, L);
    key.intensity = THREE.MathUtils.lerp(2.4, 3.1, L);
    key.color.lerpColors(keyHome, keySpace, L);
    key.position.lerpVectors(keyHomePosition, keySpacePosition, L);
    fill.intensity = THREE.MathUtils.lerp(0.9, 0.15, L);
    orbit.setSun(sunDirection.copy(key.position).normalize().transformDirection(camera.matrixWorldInverse));
    orbit.setZoom(V.solarZoom, V.solarLift);
    interactions.update(dt, t, reduced);
    orbit.update(dt, t, reduced);
    moonTouch.scale.setScalar(currentStep === 4 ? 1.8 : 1);
    lunarMoon.scale.multiplyScalar(Math.max(0.001, V.moonShow));
    lunarMoon.visible = V.moonShow > 0.02 && !orbit.hidesMoon;
    // The gold decorations and shooting stars belong to the sky at home.
    largeStar.visible = littleStar.visible = V.home > 0.5 && currentStep !== 3;
    magic.setHomeSky(V.home > 0.5);
    skies.set(V);
    skies.update(t, reduced);
    // "Us" travels between anchors: Earth, our spot in the galaxy, the candle flame, the
    // place the wish rises to, and the heart's notch in the cosmic web.
    anchors[0].copy(orbit.centre);
    anchors[2].copy(flameRest);
    anchors[3].copy(risePoint);
    anchors[4].copy(universe.notch);
    let pin = null;
    if (journey.name === "finale") pin = anchorAt(V.dotsAnchor).clone();
    else if (journey.name === "pullout") pin = anchors[0];
    else if (journey.name === "rushHome") pin = anchors[2];
    galaxy.update(dt, t, reduced);
    galaxy.pose({ opacity: V.galaxy, scale: V.galaxyScale, orient: V.galaxyOrient, lock: V.galaxyLock, pin });
    galaxy.homeWorld(anchors[1]);
    anchorAt(V.dotsAnchor);
    us.update({ anchor: dotsPos, sep: 12 * V.dotsSep, opacity: V.dots, beats: currentStep === 3 && !journey.busy }, camera, view, dt, reduced);
    universe.set({ opacity: V.web, gather: V.webGather, flow: V.webFlow, heart: V.webHeart });
    universe.update(t, reduced);
    if (celebration >= 0) magic.setCharm(V.charm);
    const nextScale = V.web > 0.5 ? "universe" : V.galaxy > 0.5 ? "galaxy" : V.space > 0.5 ? "space" : "home";
    if (nextScale !== scaleName) {
      scaleName = nextScale;
      options.onScale?.(scaleName);
    }
    magic.update(dt, t, reduced, wishProgress, interactions.rotation);
    renderer.render(scene, camera);
    if (options.onMoonPosition) {
      lunarMoon.getWorldPosition(projectedMoon).project(camera);
      options.onMoonPosition(stageX(projectedMoon), stageY(projectedMoon));
    }
    if (magic.heart.visible && options.onKissPosition) {
      magic.heart.getWorldPosition(projectedKiss).project(camera);
      options.onKissPosition(stageX(projectedKiss), stageY(projectedKiss));
    }
    if (currentStep === 2 && options.onFlamePosition) {
      flame.getWorldPosition(projectedFlame).project(camera);
      options.onFlamePosition(stageX(projectedFlame), stageY(projectedFlame));
    }
    if (options.onUs) {
      projectedUs.copy(dotsPos).project(camera);
      options.onUs(stageX(projectedUs), stageY(projectedUs), V.dots, V.usTag, V.veil);
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
    flame.visible = true;
    flameInner.visible = true;
    candleLight.visible = true;
    confetti.children.forEach((p) => (p.visible = false));
  }
  return {
    setStep(step) {
      const from = currentStep;
      currentStep = step;
      const kind = from === 1 && step === 4 ? "liftoff" : from === 4 && step === 3 ? "pullout" : from === 3 && step === 2 ? "rushHome" : null;
      journey.stop();
      if (kind) journey.play(kind);
      magic.setFinale(false);
      // Stars are only catchable once the journey has arrived at the galaxy.
      interactions.setStep(kind === "pullout" ? -1 : step);
      orbit.setActive(step === 4 || kind === "pullout", kind === "liftoff");
      if (step !== 3) us.reset();
      wishProgress = 0;
      celebration = -1;
      confettiAge = -1;
      resetWish();
    },
    get busy() {
      return journey.busy;
    },
    // A tap during travel hurries the journey; it never jumps.
    hurry() {
      journey.hurry();
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
      magic.setCharm(0);
      interactions.celebrate();
      celebration = 0;
      journey.play("finale");
      flame.visible = false;
      flameInner.visible = false;
      candleLight.visible = false;
    },
    resetWish,
    sendKiss(point) {
      magic.sendKiss(point);
    },
    setTheme(theme) {
      dayTheme = theme === "day";
      interactions.setTheme(theme);
      orbit.setTheme(theme);
      skies.setTheme(theme);
      galaxy.setTheme(theme);
      universe.setTheme(theme);
    },
    setReducedMotion(value) {
      reduced = value;
      journey.setReduced(value);
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
      skies.dispose();
      galaxy.dispose();
      universe.dispose();
      us.dispose();
      cakeDetails.dispose();
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
