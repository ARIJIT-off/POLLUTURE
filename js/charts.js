/**
 * charts.js — Mini Chart.js charts for each zone result card
 */

'use strict';

const Charts = (() => {

  const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,26,21,0.95)',
        borderColor: 'rgba(40,224,122,0.3)',
        borderWidth: 1,
        titleColor: '#7aab8a',
        bodyColor: '#e8f5ec',
        padding: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: '#4f7060', font: { size: 9 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        ticks: { color: '#4f7060', font: { size: 9 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
  };

  const registeredCharts = {};

  function destroyAll(prefix) {
    Object.keys(registeredCharts).forEach(key => {
      if (key.startsWith(prefix)) {
        registeredCharts[key].destroy();
        delete registeredCharts[key];
      }
    });
  }

  function makeGradient(ctx, color) {
    const grad = ctx.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, color + 'aa');
    grad.addColorStop(1, color + '00');
    return grad;
  }

  /**
   * Render AQI line chart
   */
  function renderAQI(canvas, aqiData) {
    const ctx = canvas.getContext('2d');
    const labels = aqiData.map(d => `Y${d.year}`);
    const values = aqiData.map(d => d.aqi);
    const gradient = makeGradient(ctx, '#ff4d6d');

    if (registeredCharts[canvas.id]) registeredCharts[canvas.id].destroy();

    registeredCharts[canvas.id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#ff4d6d',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#ff4d6d',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: { label: ctx => `AQI ${ctx.raw}` },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, min: 0 },
        },
      },
    });
  }

  /**
   * Render Groundwater bar chart
   */
  function renderGroundwater(canvas, gwData) {
    const ctx = canvas.getContext('2d');
    const pts = gwData.checkpoints;
    const labels = pts.map(d => `Y${d.year}`);
    const values = pts.map(d => d.dropM);
    const gradient = makeGradient(ctx, '#2196f3');

    if (registeredCharts[canvas.id]) registeredCharts[canvas.id].destroy();

    registeredCharts[canvas.id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: gradient,
          borderColor: '#2196f3',
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: { label: ctx => `${ctx.raw}m drop` },
          },
        },
      },
    });
  }

  /**
   * Render Temperature line chart
   */
  function renderTemperature(canvas, tempData) {
    const ctx = canvas.getContext('2d');
    const pts = tempData.checkpoints;
    const labels = pts.map(d => `Y${d.year}`);
    const values = pts.map(d => d.tempRise);
    const gradient = makeGradient(ctx, '#f9a825');

    if (registeredCharts[canvas.id]) registeredCharts[canvas.id].destroy();

    registeredCharts[canvas.id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#f9a825',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#f9a825',
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: { label: ctx => `+${ctx.raw}°C` },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, min: 0 },
        },
      },
    });
  }

  return { renderAQI, renderGroundwater, renderTemperature, destroyAll };
})();
