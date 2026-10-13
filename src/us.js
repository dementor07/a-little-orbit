import * as THREE from "three";
import { springStep } from "./motion.js";

// "Us": two tiny points of light, one blue, one cream, circling each other. They are the
// Earth and Moon seen from far away, and they still drift apart and spring back, even out here.
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    vColor = aColor;
    vAlpha = uOpacity;
  }
`;
const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.22, 0.0, d);
    float halo = pow(smoothstep(0.5, 0.0, d), 2.0) * 0.45;
    gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
    #include <colorspace_fragment>
  }
`;

export function createUs(scene, pixelRatio) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(9);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const blue = new THREE.Color("#9fd0ff"),
    cream = new THREE.Color("#fff3dc"),
    rose = new THREE.Color("#e9b9b1");
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute([...blue.toArray(), ...cream.toArray(), ...rose.toArray()], 3));
  const sizes = new Float32Array([16, 12, 0]);
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: pixelRatio }, uOpacity: { value: 0 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const dots = new THREE.Points(geometry, material);
  dots.frustumCulled = false;
  dots.renderOrder = 900;
  scene.add(dots);

  const right = new THREE.Vector3(),
    up = new THREE.Vector3(),
    centre = new THREE.Vector3();
  let angle = 0,
    beatClock = 11,
    glint = 0,
    holding = 0;
  // The squabble beat: separation multiplier with a spring that brings it home.
  const stretch = { x: 1, y: 0, z: 0 },
    stretchVelocity = { x: 0, y: 0, z: 0 },
    stretchTarget = { x: 1, y: 0, z: 0 };
  return {
    // anchor: world point; sep: separation in CSS px; opacity 0..1; beats: allow drift-and-return.
    update({ anchor, sep, opacity, beats }, camera, view, dt, reduced) {
      dots.visible = opacity > 0.005;
      material.uniforms.uOpacity.value = opacity;
      if (!dots.visible) return;
      if (!reduced) angle += dt * ((Math.PI * 2) / 6);
      if (beats && !reduced) {
        beatClock -= dt;
        if (beatClock <= 0 && holding <= 0) {
          stretchTarget.x = 2.4;
          holding = 1.3;
          beatClock = 10 + Math.random() * 6;
        }
      }
      if (holding > 0) {
        holding -= dt;
        if (holding <= 0.4 && stretchTarget.x !== 1) {
          stretchTarget.x = 1;
          glint = 1;
        }
      }
      springStep(stretch, stretchVelocity, stretchTarget, dt, 27.4, 5.76);
      glint = Math.max(0, glint - dt / 0.5);
      const distance = camera.position.distanceTo(anchor);
      const worldPerPx = (2 * distance * Math.tan(THREE.MathUtils.degToRad(17))) / view.height;
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      up.setFromMatrixColumn(camera.matrixWorld, 1);
      const half = (sep * stretch.x * worldPerPx) / 2;
      centre.copy(anchor);
      const cx = Math.cos(angle) * half,
        cy = Math.sin(angle) * half * 0.45;
      positions.set([centre.x - right.x * cx - up.x * cy, centre.y - right.y * cx - up.y * cy, centre.z - right.z * cx - up.z * cy], 0);
      positions.set([centre.x + right.x * cx + up.x * cy, centre.y + right.y * cx + up.y * cy, centre.z + right.z * cx + up.z * cy], 3);
      positions.set(positions.subarray(3, 6), 6);
      sizes[2] = 34 * glint;
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
    },
    reset() {
      stretch.x = stretchTarget.x = 1;
      stretchVelocity.x = 0;
      holding = 0;
      beatClock = 11;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
