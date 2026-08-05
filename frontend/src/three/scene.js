/**
 * StegX Three.js Scene Manager
 * Creates the immersive 3D background with post-processing.
 */
import * as THREE from 'three';

let scene, camera, renderer;
let animationId;
let mouseX = 0, mouseY = 0;

export function initScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050816, 0.0008);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 400);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050816, 1);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x111640, 0.5);
  scene.add(ambientLight);

  // Point lights
  const light1 = new THREE.PointLight(0x00E5FF, 2, 600);
  light1.position.set(200, 200, 200);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x7B61FF, 2, 600);
  light2.position.set(-200, -100, 300);
  scene.add(light2);

  const light3 = new THREE.PointLight(0x00FF88, 1, 400);
  light3.position.set(0, -200, 100);
  scene.add(light3);

  // Mouse tracking
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Resize
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer };
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function animate(callback) {
  function loop() {
    animationId = requestAnimationFrame(loop);

    // Smooth camera follow mouse
    camera.position.x += (mouseX * 30 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 20 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    if (callback) callback();
    renderer.render(scene, camera);
  }
  loop();
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }

export function disposeScene() {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) renderer.dispose();
  window.removeEventListener('resize', onResize);
}
