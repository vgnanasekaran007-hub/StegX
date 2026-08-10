/**
 * StegX Charts Component — Rewritten from Scratch
 * Chart.js integration with cyberpunk styling.
 */
import Chart from 'chart.js/auto';

/* ── Colour Palette ────────────────────────────────────────────── */

const COLORS = {
  primary:   '#00E5FF',
  secondary: '#7B61FF',
  accent:    '#00FF88',
  danger:    '#FF3D71',
  warning:   '#FFB800',
  grid:      'rgba(255, 255, 255, 0.05)',
  text:      '#9BA1B0',
};

/* ── Shared Defaults ───────────────────────────────────────────── */

const FONT_DISPLAY = "'Orbitron', sans-serif";
const FONT_BODY    = "'Rajdhani', sans-serif";

const defaultPlugins = {
  legend: {
    labels: {
      color: COLORS.text,
      font: { family: FONT_BODY, size: 12 },
      padding: 16,
    },
  },
  tooltip: {
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    titleColor: '#E8EAED',
    bodyColor: '#9BA1B0',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
    cornerRadius: 8,
    titleFont: { family: FONT_DISPLAY, size: 12 },
    bodyFont: { family: FONT_BODY, size: 13 },
    padding: 12,
  },
};

const defaultScales = {
  x: {
    ticks:  { color: COLORS.text, font: { family: FONT_BODY } },
    grid:   { color: COLORS.grid },
    border: { color: COLORS.grid },
  },
  y: {
    ticks:  { color: COLORS.text, font: { family: FONT_BODY } },
    grid:   { color: COLORS.grid },
    border: { color: COLORS.grid },
  },
};

/* ── Chart Factories ───────────────────────────────────────────── */

/**
 * Histogram chart — overlay two 256-bin distributions (original vs stego).
 */
export function createHistogramChart(canvasId, originalData, stegoData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const labels = Array.from({ length: 256 }, (_, i) => i);

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Original',
          data: originalData,
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          fill: true,
          tension: 0.1,
        },
        {
          label: 'Stego',
          data: stegoData,
          borderColor: COLORS.danger,
          backgroundColor: 'rgba(255, 61, 113, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...defaultPlugins,
        title: {
          display: true,
          text: 'Pixel Histogram Comparison',
          color: '#E8EAED',
          font: { family: FONT_DISPLAY, size: 14 },
        },
      },
      scales: defaultScales,
    },
  });
}

/**
 * Bar chart with optional custom colours.
 */
export function createBarChart(canvasId, labels, values, colors = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const palette = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.danger];
  const bgColors = colors || labels.map((_, i) => palette[i % palette.length]);

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: bgColors.map((c) => c + '40'),
        borderColor: bgColors,
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { ...defaultPlugins, legend: { display: false } },
      scales: defaultScales,
    },
  });
}

/**
 * Radar chart for multi-dimensional comparison.
 */
export function createRadarChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const palette = [COLORS.primary, COLORS.secondary, COLORS.accent];

  return new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: palette[i % 3],
        backgroundColor: palette[i % 3] + '20',
        borderWidth: 2,
        pointBackgroundColor: palette[i % 3],
        pointRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          ticks:       { color: COLORS.text, backdropColor: 'transparent', font: { size: 10 } },
          grid:        { color: COLORS.grid },
          pointLabels: { color: COLORS.text, font: { family: FONT_BODY, size: 12 } },
          angleLines:  { color: COLORS.grid },
        },
      },
      plugins: defaultPlugins,
    },
  });
}

/**
 * Doughnut chart.
 */
export function createDoughnutChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const palette = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.danger];

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: palette.map((c) => c + '80'),
        borderColor: palette,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: defaultPlugins,
    },
  });
}
