/**
 * StegX Three.js Scene Manager — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Adaptive quality based on device performance
 *  - Smooth mouse tracking with easing
 *  - Post-processing ready architecture
 *  - Clean resize handling with debounce
 *  - FPS monitoring for auto quality adjustment
 */
import * as THREE from 'three';

let scene, camera, renderer;
let animationId = null;
let mouseX = 0;
let mouseY = 0;
let _qualityLevel = 'high'; // 'high' | 'medium' | 'low'
let _fpsHistory = [];
let _lastFrameTime = 0;

/**
 * Initialise the Three.js scene, camera, renderer, and lights.
 * Returns { scene, camera, renderer } or undefined if canvas is missing.
 */
export function initScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return undefined;

  // Detect device performance
  _qualityLevel = _detectQuality();

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050816, _qualityLevel === 'low' ? 0.0012 : 0.0008);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 400);

  // Renderer
  const pixelRatio = _qualityLevel === 'low'
    ? 1
    : Math.min(window.devicePixelRatio, _qualityLevel === 'medium' ? 1.5 : 2);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: _qualityLevel !== 'low',
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x050816, 1);

  // Lighting
  const ambient = new THREE.AmbientLight(0x111640, 0.5);
  scene.add(ambient);

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
  document.addEventListener('mousemove', _onMouseMove, { passive: true });
  window.addEventListener('resize', _onResize);

  console.log(`[StegX] Three.js scene initialized (quality: ${_qualityLevel})`);

  return { scene, camera, renderer };
}

/**
 * Start the animation loop. `callback` is called each frame.
 */
export function animate(callback) {
  _lastFrameTime = performance.now();

  function loop(now) {
    animationId = requestAnimationFrame(loop);

    // Track FPS for adaptive quality
    const delta = now - _lastFrameTime;
    _lastFrameTime = now;
    if (delta > 0) {
      _fpsHistory.push(1000 / delta);
      if (_fpsHistory.length > 60) _fpsHistory.shift();
    }

    // Smooth camera follow mouse with easing
    if (camera) {
      const targetX = mouseX * 30;
      const targetY = -mouseY * 20;
      camera.position.x += (targetX - camera.position.x) * 0.02;
      camera.position.y += (targetY - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
    }

    if (callback) callback(now / 1000);
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
  loop(performance.now());
}

/* ── Accessors ─────────────────────────────────────────────────── */

export function getScene()        { return scene; }
export function getCamera()       { return camera; }
export function getRenderer()     { return renderer; }
export function getQualityLevel() { return _qualityLevel; }

/** Get average FPS over the last 60 frames. */
export function getAvgFps() {
  if (_fpsHistory.length === 0) return 0;
  return Math.round(_fpsHistory.reduce((a, b) => a + b, 0) / _fpsHistory.length);
}

/* ── Cleanup ───────────────────────────────────────────────────── */

export function disposeScene() {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer)    renderer.dispose();
  document.removeEventListener('mousemove', _onMouseMove);
  window.removeEventListener('resize', _onResize);
  if (_resizeTimer) clearTimeout(_resizeTimer);
}

/* ── Internal ──────────────────────────────────────────────────── */

function _onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}

let _resizeTimer = null;
function _onResize() {
  // Debounce resize for performance
  if (_resizeTimer) clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);
}

/** Detect device quality level based on hardware. */
function _detectQuality() {
  // Check for mobile devices
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) return 'low';

  // Check WebGL capabilities
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Low-end GPU detection
        if (gpuRenderer.includes('intel') && !gpuRenderer.includes('iris')) return 'medium';
        if (gpuRenderer.includes('mali') || gpuRenderer.includes('adreno')) return 'low';
      }
    }
  } catch { /* fallback to high */ }

  // Check available logical processors
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return 'medium';

  return 'high';
}
