/**
 * StegX 3D Universal Steganography Studio — Main Entry
 * Rewritten from Scratch.
 *
 * SPA hash-router, Three.js background, component mounting.
 */
import { initScene, animate } from './three/scene.js';
import { ParticleSystem } from './three/particles.js';
import { BinaryRain } from './three/binaryRain.js';
import { renderNavbar } from './components/navbar.js';
import { renderSidebar, setActiveSidebarItem } from './components/sidebar.js';

// Page imports
import { renderDashboard }         from './pages/dashboard.js';
import { renderHideData }          from './pages/hideData.js';
import { renderExtractData }       from './pages/extractData.js';
import { renderImageSteg }         from './pages/imageSteg.js';
import { renderAudioSteg }         from './pages/audioSteg.js';
import { renderVideoSteg }         from './pages/videoSteg.js';
import { renderTextSteg }          from './pages/textSteg.js';
import { renderEncryption }        from './pages/encryption.js';
import { renderAIRecommend }       from './pages/aiRecommend.js';
import { renderCapacityAnalyzer }  from './pages/capacityAnalyzer.js';
import { renderQualityAnalysis }   from './pages/qualityAnalysis.js';
import { renderMetadataInspector } from './pages/metadataInspector.js';
import { renderHistory }           from './pages/history.js';
import { renderSettings }          from './pages/settings.js';

/* ── Route Table ───────────────────────────────────────────────── */

const ROUTES = {
  '/':            { render: renderDashboard,         id: 'dashboard' },
  '/hide':        { render: renderHideData,          id: 'hide-data' },
  '/extract':     { render: renderExtractData,       id: 'extract-data' },
  '/image-steg':  { render: renderImageSteg,         id: 'image-steg' },
  '/audio-steg':  { render: renderAudioSteg,         id: 'audio-steg' },
  '/video-steg':  { render: renderVideoSteg,         id: 'video-steg' },
  '/text-steg':   { render: renderTextSteg,          id: 'text-steg' },
  '/encryption':  { render: renderEncryption,        id: 'encryption' },
  '/ai-recommend':{ render: renderAIRecommend,       id: 'ai-recommend' },
  '/capacity':    { render: renderCapacityAnalyzer,  id: 'capacity' },
  '/quality':     { render: renderQualityAnalysis,   id: 'quality' },
  '/metadata':    { render: renderMetadataInspector,  id: 'metadata' },
  '/history':     { render: renderHistory,           id: 'history' },
  '/settings':    { render: renderSettings,          id: 'settings' },
};

/* ── Application Init ──────────────────────────────────────────── */

let particles = null;
let binaryRain = null;

function init() {
  // Render shell components
  renderNavbar();
  renderSidebar();

  // Initialise Three.js (graceful failure)
  try {
    const result = initScene();
    if (result && result.scene) {
      particles  = new ParticleSystem(result.scene, 2500);
      binaryRain = new BinaryRain(result.scene, 30);

      const startTime = Date.now();
      animate(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (particles)  particles.update(elapsed);
        if (binaryRain) binaryRain.update(elapsed);
      });
    }
  } catch (e) {
    console.warn('Three.js init failed (WebGL may be unavailable):', e);
  }

  // Set up hash-router
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

/* ── Router ────────────────────────────────────────────────────── */

function handleRoute() {
  const hash = window.location.hash || '#/';
  const path = hash.slice(1) || '/';
  const route = ROUTES[path];
  const container = document.getElementById('page-container');
  if (!container) return;

  if (route) {
    // Fade out
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(() => {
      try {
        route.render(container);
      } catch (err) {
        console.error(`Page render error [${route.id}]:`, err);
        container.innerHTML = `
          <div style="text-align:center; padding:80px 20px;">
            <div style="font-size:64px; margin-bottom:24px;">⚠️</div>
            <h1 class="page-title" style="font-size:28px;">Something Went Wrong</h1>
            <p class="text-muted mt-8">${err.message}</p>
            <a href="#/" class="btn btn-primary mt-24">← Back to Dashboard</a>
          </div>`;
      }

      setActiveSidebarItem(route.id);

      // Fade in
      requestAnimationFrame(() => {
        container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      });
    }, 200);
  } else {
    // 404
    container.innerHTML = `
      <div style="text-align:center; padding:80px 20px;">
        <div style="font-size:64px; margin-bottom:24px;">🔍</div>
        <h1 class="page-title" style="font-size:32px;">Page Not Found</h1>
        <p class="text-muted mt-8">The page you're looking for doesn't exist.</p>
        <a href="#/" class="btn btn-primary mt-24">← Back to Dashboard</a>
      </div>`;
  }
}

/* ── Boot ──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);
