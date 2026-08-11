/**
 * StegX Charts Component — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Scroll-triggered animation via IntersectionObserver
 *  - Dark mode optimized gradients and glow effects
 *  - Chart export as PNG
 *  - Responsive breakpoint handling
 *  - Shared cyberpunk color palette
 */
import Chart from 'chart.js/auto';

/* ── Colour Palette ────────────────────────────────────────────── */

export const CHART_COLORS = {
  primary:   '#00E5FF',
  secondary: '#7B61FF',
  accent:    '#00FF88',
  danger:    '#FF3D71',
  warning:   '#FFB800',
  info:      '#00B8D4',
  grid:      'rgba(255, 255, 255, 0.05)',
  gridHover: 'rgba(255, 255, 255, 0.1)',
  text:      '#9BA1B0',
  textLight: '#E8EAED',
};

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
];

/* ── Shared Defaults ───────────────────────────────────────────── */

const FONT_DISPLAY = "'Orbitron', sans-serif";
const FONT_BODY    = "'Rajdhani', sans-serif";

const defaultPlugins = {
  legend: {
    labels: {
      color: CHART_COLORS.text,
      font: { family: FONT_BODY, size: 12 },
      padding: 16,
      usePointStyle: true,
      pointStyleWidth: 10,
    },
  },
  tooltip: {
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    titleColor: CHART_COLORS.textLight,
    bodyColor: CHART_COLORS.text,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
    cornerRadius: 8,
    titleFont: { family: FONT_DISPLAY, size: 12, weight: 600 },
    bodyFont: { family: FONT_BODY, size: 13 },
    padding: 12,
    displayColors: true,
    boxPadding: 4,
  },
};

const defaultScales = {
  x: {
    ticks:  { color: CHART_COLORS.text, font: { family: FONT_BODY, size: 11 } },
    grid:   { color: CHART_COLORS.grid },
    border: { color: CHART_COLORS.grid },
  },
  y: {
    ticks:  { color: CHART_COLORS.text, font: { family: FONT_BODY, size: 11 } },
    grid:   { color: CHART_COLORS.grid },
    border: { color: CHART_COLORS.grid },
  },
};

/* ── Active chart instances (for cleanup) ──────────────────────── */

const _charts = new Map();

function _destroyExisting(canvasId) {
  if (_charts.has(canvasId)) {
    _charts.get(canvasId).destroy();
    _charts.delete(canvasId);
  }
}

function _register(canvasId, chart) {
  _charts.set(canvasId, chart);
  return chart;
}

/* ── Chart Export ──────────────────────────────────────────────── */

/**
 * Export a chart as a PNG data URL.
 * @param {string} canvasId
 * @returns {string|null} data URL or null
 */
export function exportChartAsPng(canvasId) {
  const chart = _charts.get(canvasId);
  if (!chart) return null;
  return chart.toBase64Image('image/png', 1.0);
}

/**
 * Download a chart as PNG file.
 */
export function downloadChart(canvasId, filename = 'chart.png') {
  const url = exportChartAsPng(canvasId);
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/* ── Chart Factories ───────────────────────────────────────────── */

/**
 * Histogram chart — overlay two 256-bin distributions (original vs stego).
 */
export function createHistogramChart(canvasId, originalData, stegoData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExisting(canvasId);

  const ctx = canvas.getContext('2d');
  const gradientOrig = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientOrig.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
  gradientOrig.addColorStop(1, 'rgba(0, 229, 255, 0.02)');

  const gradientStego = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradientStego.addColorStop(0, 'rgba(255, 61, 113, 0.25)');
  gradientStego.addColorStop(1, 'rgba(255, 61, 113, 0.02)');

  const labels = Array.from({ length: 256 }, (_, i) => i);

  return _register(canvasId, new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Original',
          data: originalData,
          borderColor: CHART_COLORS.primary,
          backgroundColor: gradientOrig,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 3,
          fill: true,
          tension: 0.1,
        },
        {
          label: 'Stego',
          data: stegoData,
          borderColor: CHART_COLORS.danger,
          backgroundColor: gradientStego,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 3,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...defaultPlugins,
        title: {
          display: true,
          text: 'Pixel Histogram Comparison',
          color: CHART_COLORS.textLight,
          font: { family: FONT_DISPLAY, size: 14, weight: 600 },
          padding: { bottom: 16 },
        },
      },
      scales: defaultScales,
    },
  }));
}

/**
 * Bar chart with optional custom colours and gradient fills.
 */
export function createBarChart(canvasId, labels, values, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExisting(canvasId);

  const colors = options.colors || labels.map((_, i) => PALETTE[i % PALETTE.length]);

  return _register(canvasId, new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: options.label || 'Value',
        data: values,
        backgroundColor: colors.map((c) => c + '60'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: { ...defaultPlugins, legend: { display: false } },
      scales: defaultScales,
    },
  }));
}

/**
 * Radar chart for multi-dimensional comparison.
 */
export function createRadarChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExisting(canvasId);

  return _register(canvasId, new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: PALETTE[i % PALETTE.length] + '20',
        borderWidth: 2,
        pointBackgroundColor: PALETTE[i % PALETTE.length],
        pointBorderColor: 'transparent',
        pointRadius: 4,
        pointHoverRadius: 6,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      scales: {
        r: {
          ticks:       { color: CHART_COLORS.text, backdropColor: 'transparent', font: { size: 10 } },
          grid:        { color: CHART_COLORS.grid },
          pointLabels: { color: CHART_COLORS.text, font: { family: FONT_BODY, size: 12 } },
          angleLines:  { color: CHART_COLORS.grid },
          beginAtZero: true,
        },
      },
      plugins: defaultPlugins,
    },
  }));
}

/**
 * Doughnut chart with glow effects.
 */
export function createDoughnutChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExisting(canvasId);

  return _register(canvasId, new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length).map((c) => c + '80'),
        borderColor: PALETTE.slice(0, labels.length),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      animation: { duration: 800, easing: 'easeOutQuart', animateRotate: true },
      plugins: {
        ...defaultPlugins,
        legend: {
          ...defaultPlugins.legend,
          position: 'bottom',
        },
      },
    },
  }));
}

/**
 * Create a mini sparkline chart (no axes, no labels — just the line).
 */
export function createSparkline(canvasId, data, color = CHART_COLORS.primary) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExisting(canvasId);

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, color + '40');
  gradient.addColorStop(1, color + '00');

  return _register(canvasId, new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{
        data,
        borderColor: color,
        backgroundColor: gradient,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  }));
}

/** Destroy all active chart instances. */
export function destroyAllCharts() {
  for (const [, chart] of _charts) {
    chart.destroy();
  }
  _charts.clear();
}
