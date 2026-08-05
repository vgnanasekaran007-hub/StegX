/**
 * StegX Charts Component
 * Chart.js integration with cyberpunk styling.
 */
import Chart from 'chart.js/auto';

const cyberpunkColors = {
  primary: '#00E5FF',
  secondary: '#7B61FF',
  accent: '#00FF88',
  danger: '#FF3D71',
  warning: '#FFB800',
  grid: 'rgba(255, 255, 255, 0.05)',
  text: '#9BA1B0',
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: cyberpunkColors.text,
        font: { family: "'Rajdhani', sans-serif", size: 12 },
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
      titleFont: { family: "'Orbitron', sans-serif", size: 12 },
      bodyFont: { family: "'Rajdhani', sans-serif", size: 13 },
      padding: 12,
    },
  },
  scales: {
    x: {
      ticks: { color: cyberpunkColors.text, font: { family: "'Rajdhani', sans-serif" } },
      grid: { color: cyberpunkColors.grid },
      border: { color: cyberpunkColors.grid },
    },
    y: {
      ticks: { color: cyberpunkColors.text, font: { family: "'Rajdhani', sans-serif" } },
      grid: { color: cyberpunkColors.grid },
      border: { color: cyberpunkColors.grid },
    },
  },
};

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
          borderColor: cyberpunkColors.primary,
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          fill: true,
          tension: 0.1,
        },
        {
          label: 'Stego',
          data: stegoData,
          borderColor: cyberpunkColors.danger,
          backgroundColor: 'rgba(255, 61, 113, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      ...defaultOptions,
      plugins: {
        ...defaultOptions.plugins,
        title: { display: true, text: 'Pixel Histogram Comparison', color: '#E8EAED', font: { family: "'Orbitron', sans-serif", size: 14 } },
      },
    },
  });
}

export function createBarChart(canvasId, labels, values, colors = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const bgColors = colors || labels.map((_, i) => {
    const palette = [cyberpunkColors.primary, cyberpunkColors.secondary, cyberpunkColors.accent, cyberpunkColors.warning, cyberpunkColors.danger];
    return palette[i % palette.length];
  });

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: bgColors.map(c => c + '40'),
        borderColor: bgColors,
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      ...defaultOptions,
      plugins: { ...defaultOptions.plugins, legend: { display: false } },
    },
  });
}

export function createRadarChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: [cyberpunkColors.primary, cyberpunkColors.secondary, cyberpunkColors.accent][i % 3],
        backgroundColor: [cyberpunkColors.primary, cyberpunkColors.secondary, cyberpunkColors.accent][i % 3] + '20',
        borderWidth: 2,
        pointBackgroundColor: [cyberpunkColors.primary, cyberpunkColors.secondary, cyberpunkColors.accent][i % 3],
        pointRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          ticks: { color: cyberpunkColors.text, backdropColor: 'transparent', font: { size: 10 } },
          grid: { color: cyberpunkColors.grid },
          pointLabels: { color: cyberpunkColors.text, font: { family: "'Rajdhani', sans-serif", size: 12 } },
          angleLines: { color: cyberpunkColors.grid },
        },
      },
      plugins: defaultOptions.plugins,
    },
  });
}

export function createDoughnutChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          cyberpunkColors.primary + '80',
          cyberpunkColors.secondary + '80',
          cyberpunkColors.accent + '80',
          cyberpunkColors.warning + '80',
          cyberpunkColors.danger + '80',
        ],
        borderColor: [
          cyberpunkColors.primary,
          cyberpunkColors.secondary,
          cyberpunkColors.accent,
          cyberpunkColors.warning,
          cyberpunkColors.danger,
        ],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: defaultOptions.plugins,
    },
  });
}
