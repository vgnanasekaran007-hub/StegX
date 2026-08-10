/**
 * StegX Three.js Scene Manager — Rewritten from Scratch
 * Creates the immersive 3D background with lighting and mouse tracking.
 */
import * as THREE from 'three';

let scene, camera, renderer;
let animationId = null;
let mouseX = 0;
let mouseY = 0;

/**
 * Initialise the Three.js scene, camera, renderer, and lights.
 * Returns { scene, camera, renderer } or undefined if canvas is missing.
 */
export function initScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return undefined;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050816, 0.0008);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 400);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050816, 1);

  // Lighting
  scene.add(new THREE.AmbientLight(0x111640, 0.5));

  const light1 = new THREE.PointLight(0x00e5ff, 2, 600);
  light1.position.set(200, 200, 200);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x7b61ff, 2, 600);
  light2.position.set(-200, -100, 300);
  scene.add(light2);

  const light3 = new THREE.PointLight(0x00ff88, 1, 400);
  light3.position.set(0, -200, 100);
  scene.add(light3);

  // Mouse tracking
  document.addEventListener('mousemove', _onMouseMove);
  window.addEventListener('resize', _onResize);

  return { scene, camera, renderer };
}

/**
 * Start the animation loop. `callback` is called each frame.
 */
export function animate(callback) {
  function loop() {
    animationId = requestAnimationFrame(loop);

    // Smooth camera follow mouse
    if (camera) {
      camera.position.x += (mouseX * 30 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 20 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
    }

    if (callback) callback();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
  loop();
}

/* ── Accessors ─────────────────────────────────────────────────── */

export function getScene()    { return scene; }
export function getCamera()   { return camera; }
export function getRenderer() { return renderer; }

/* ── Cleanup ───────────────────────────────────────────────────── */

export function disposeScene() {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer)    renderer.dispose();
  document.removeEventListener('mousemove', _onMouseMove);
  window.removeEventListener('resize', _onResize);
}

/* ── Internal ──────────────────────────────────────────────────── */

function _onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}

function _onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
