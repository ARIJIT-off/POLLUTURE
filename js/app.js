/**
 * app.js — Polluture Main Orchestrator
 * Custom polygon drawing (no Leaflet Draw dependency)
 * Leaflet map, zone management, per-zone config, impacts
 */

'use strict';

// ══════════════════════════════════════════ ZONE COLORS
const ZONE_PALETTE = [
  '#28e07a', '#2196f3', '#f9a825', '#ff7043',
  '#ab47bc', '#26c6da', '#ec407a', '#66bb6a',
  '#ff8f00', '#5c6bc0',
];

const LAND_FILL_COLORS = {
  wetland:      { color: '#2196f3', fill: '#2196f3' },
  vegetation:   { color: '#2e7d32', fill: '#43a047' },
  agricultural: { color: '#f9a825', fill: '#f9a825' },
  bare:         { color: '#8d6e63', fill: '#8d6e63' },
};

// ══════════════════════════════════════════ STATE
const state = {
  zones: [],
  selectedId: null,
  nextId: 1,
  map: null,
  tileLayers: {},
  currentTile: 'street',

  // Drawing state
  drawing: false,
  drawPoints: [],       // array of L.LatLng
  drawPolyline: null,   // preview polyline
  drawMarkers: [],      // vertex markers
  drawGhostLine: null,  // follows cursor
};

// ══════════════════════════════════════════ INIT MAP
function initMap() {
  state.map = L.map('map', {
    center: [22.5726, 88.3639],
    zoom: 13,
    zoomControl: true,
    doubleClickZoom: false, // we use dblclick to finish drawing
  });

  // Tile layers
  state.tileLayers.street = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '© OpenStreetMap contributors', maxZoom: 19 }
  );

  state.tileLayers.satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles © Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', maxZoom: 19 }
  );

  state.tileLayers.hybrid = L.layerGroup([
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri', maxZoom: 19 }
    ),
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { opacity: 0.4, maxZoom: 19 }
    ),
  ]);

  state.tileLayers.street.addTo(state.map);

  // Map click: place polygon vertex if in drawing mode
  state.map.on('click', onMapClick);
  // Map dblclick: finish polygon
  state.map.on('dblclick', onMapDblClick);
  // Map mousemove: ghost line following cursor
  state.map.on('mousemove', onMapMouseMove);

  // Esc key: cancel drawing
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.drawing) cancelDrawing();
  });
}

// ══════════════════════════════════════════ CUSTOM DRAWING
function startDrawing() {
  if (state.drawing) { cancelDrawing(); return; }
  state.drawing = true;
  state.drawPoints = [];
  state.map.getContainer().style.cursor = 'crosshair';

  // Show hint and finish button
  document.getElementById('draw-hint').classList.remove('hidden');
  document.getElementById('btn-finish-draw').classList.add('hidden');

  // Update button state
  document.getElementById('btn-draw-zone').classList.add('active');
}

function cancelDrawing() {
  state.drawing = false;
  state.drawPoints = [];
  clearDrawPreview();
  state.map.getContainer().style.cursor = '';
  document.getElementById('draw-hint').classList.add('hidden');
  document.getElementById('btn-draw-zone').classList.remove('active');
}

function clearDrawPreview() {
  if (state.drawPolyline) { state.map.removeLayer(state.drawPolyline); state.drawPolyline = null; }
  if (state.drawGhostLine) { state.map.removeLayer(state.drawGhostLine); state.drawGhostLine = null; }
  state.drawMarkers.forEach(m => state.map.removeLayer(m));
  state.drawMarkers = [];
}

function onMapClick(e) {
  if (!state.drawing) return;
  const latlng = e.latlng;

  // Prevent double-clicking adding a point too close to the last one
  if (state.drawPoints.length > 0) {
    const last = state.drawPoints[state.drawPoints.length - 1];
    if (latlng.distanceTo(last) < 1) return; 
  }

  state.drawPoints.push(latlng);

  // Draw vertex marker
  const marker = L.circleMarker(latlng, {
    radius: 7,
    color: '#28e07a',
    fillColor: '#28e07a',
    fillOpacity: 1,
    weight: 2,
  }).addTo(state.map);
  
  // Click first marker to close
  if (state.drawPoints.length === 1) {
    marker.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      if (state.drawPoints.length >= 3) finishDrawing();
    });
  }

  state.drawMarkers.push(marker);

  // Show finish button if we have at least 3 points
  if (state.drawPoints.length >= 3) {
    document.getElementById('btn-finish-draw').classList.remove('hidden');
  }

  // Update preview polyline
  if (state.drawPolyline) state.map.removeLayer(state.drawPolyline);
  if (state.drawPoints.length > 1) {
    state.drawPolyline = L.polyline(state.drawPoints, {
      color: '#28e07a',
      weight: 2,
      dashArray: '6 4',
    }).addTo(state.map);
  }
}

function onMapDblClick(e) {
  if (!state.drawing) return;
  if (state.drawPoints.length < 3) {
    // Not enough points yet — add this last point too (dblclick fires click+dblclick)
    // The click handler already added the penultimate point, just finish
    if (state.drawPoints.length < 3) return;
  }
  finishDrawing();
}

function onMapMouseMove(e) {
  if (!state.drawing || state.drawPoints.length === 0) return;
  const pts = [...state.drawPoints, e.latlng];
  if (state.drawGhostLine) state.map.removeLayer(state.drawGhostLine);
  state.drawGhostLine = L.polyline(pts, {
    color: '#28e07a',
    weight: 1.5,
    opacity: 0.5,
    dashArray: '4 4',
  }).addTo(state.map);
}

function finishDrawing() {
  if (state.drawPoints.length < 3) return;

  const points = [...state.drawPoints];
  cancelDrawing();

  // Create a Leaflet polygon
  const id = state.nextId++;
  const color = ZONE_PALETTE[(id - 1) % ZONE_PALETTE.length];

  const polygon = L.polygon(points, {
    color,
    fillColor: color,
    fillOpacity: 0.18,
    weight: 2,
  }).addTo(state.map);

  const zone = {
    id,
    name: `Zone ${id}`,
    layer: polygon,
    color,
    landType: 'bare',
    floors: 5,
    residents: 200,
    years: 25,
    result: null,
  };

  polygon.on('click', () => selectZone(id));
  state.zones.push(zone);
  selectZone(id);
  renderZoneList();
  updateZoneBadge();
}

// ══════════════════════════════════════════ ZONE MANAGEMENT
function deleteZone(id) {
  const zone = state.zones.find(z => z.id === id);
  if (!zone) return;
  state.map.removeLayer(zone.layer);
  state.zones = state.zones.filter(z => z.id !== id);

  if (state.selectedId === id) {
    state.selectedId = null;
    hideConfigPanel();
    Building3D.hide();
  }

  const card = document.getElementById(`result-card-${id}`);
  if (card) card.remove();

  renderZoneList();
  updateZoneBadge();
  updateCombinedDebt();
  updateResultsPanelVisibility();

  if (state.zones.length > 0) selectZone(state.zones[state.zones.length - 1].id);
}

function clearAllZones() {
  state.zones.forEach(z => state.map.removeLayer(z.layer));
  state.zones = [];
  state.selectedId = null;
  renderZoneList();
  updateZoneBadge();
  hideConfigPanel();
  Building3D.hide();
  document.getElementById('results-content').innerHTML = '';
  document.getElementById('combined-debt-bar').classList.add('hidden');
  hideResultsPanel();
}

function selectZone(id) {
  state.selectedId = id;
  const zone = state.zones.find(z => z.id === id);
  if (!zone) return;

  // Highlight selected polygon
  state.zones.forEach(z => {
    const lc = LAND_FILL_COLORS[z.landType];
    const col = lc ? lc.color : z.color;
    z.layer.setStyle({
      color: col,
      fillColor: col,
      fillOpacity: z.id === id ? 0.30 : 0.15,
      weight: z.id === id ? 3 : 2,
    });
  });

  document.querySelectorAll('.zone-item').forEach(el => {
    el.classList.toggle('selected', +el.dataset.id === id);
  });

  showConfigPanel(zone);
  Building3D.update(zone.floors, zone.landType);
}

// ══════════════════════════════════════════ ZONE LIST
function renderZoneList() {
  const list = document.getElementById('zone-list');
  if (state.zones.length === 0) {
    list.innerHTML = `<div class="zone-empty"><div class="zone-empty-icon">🗺️</div><p>Click "Draw New Zone", then click map points. Double-click to finish.</p></div>`;
    return;
  }

  list.innerHTML = state.zones.map(z => {
    const area = calcAreaHa(z.layer);
    const calc = z.result ? ' ✔' : '';
    return `
      <div class="zone-item${z.id === state.selectedId ? ' selected' : ''}" data-id="${z.id}">
        <div class="zone-dot" style="background:${z.color}"></div>
        <div class="zone-name">${z.name}</div>
        <div class="zone-meta">${area.toFixed(2)} ha${calc}</div>
        <button class="zone-del-btn" data-del="${z.id}" title="Delete zone">✕</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.zone-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.zone-del-btn')) return;
      selectZone(+el.dataset.id);
    });
  });

  list.querySelectorAll('.zone-del-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteZone(+btn.dataset.del); });
  });
}

function updateZoneBadge() {
  document.getElementById('zone-count-badge').textContent = state.zones.length;
}

// ══════════════════════════════════════════ CONFIG PANEL
function showConfigPanel(zone) {
  const section = document.getElementById('config-section');
  section.style.display = 'block';
  document.getElementById('config-zone-label').textContent = `⚙ ${zone.name}`;

  document.querySelectorAll('.land-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === zone.landType);
  });

  document.getElementById('slider-floors').value = zone.floors;
  document.getElementById('floors-val').textContent = zone.floors;
  document.getElementById('slider-residents').value = zone.residents;
  document.getElementById('residents-val').textContent = zone.residents;
  document.getElementById('slider-years').value = zone.years;
  document.getElementById('years-val').textContent = `${zone.years} yrs`;

  const area = calcAreaHa(zone.layer);
  document.getElementById('zone-area-display').textContent = `${area.toFixed(2)} ha`;
}

function hideConfigPanel() {
  document.getElementById('config-section').style.display = 'none';
}

// ══════════════════════════════════════════ TILE SWITCHER
function switchTile(layerName) {
  Object.values(state.tileLayers).forEach(l => state.map.removeLayer(l));
  state.tileLayers[layerName].addTo(state.map);
  state.currentTile = layerName;
  document.querySelectorAll('.tile-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layer === layerName);
  });
}

// ══════════════════════════════════════════ CALCULATE
function calculateZone() {
  const zone = state.zones.find(z => z.id === state.selectedId);
  if (!zone) return;

  const areaHa = calcAreaHa(zone.layer);
  const params = {
    landType: zone.landType,
    floors: zone.floors,
    residents: zone.residents,
    years: zone.years,
    areaHa,
    name: zone.name,
  };

  const result = Calculator.compute(params);
  zone.result = result;

  // Update polygon color to land type
  const lc = LAND_FILL_COLORS[zone.landType];
  zone.layer.setStyle({
    color: lc?.color || zone.color,
    fillColor: lc?.fill || zone.color,
    fillOpacity: 0.25,
    weight: 2.5,
  });

  showResultsPanel();
  renderResultCard(zone, params, result);
  updateCombinedDebt();
  renderZoneList();
}

// ══════════════════════════════════════════ RESULT CARD
function renderResultCard(zone, params, result) {
  const content = document.getElementById('results-content');
  const existing = document.getElementById(`result-card-${zone.id}`);
  if (existing) existing.remove();

  const { summary, aqi, groundwater, temperature } = result;
  const debt = result.ecologicalDebt;

  const card = document.createElement('div');
  card.className = 'result-card';
  card.id = `result-card-${zone.id}`;

  card.innerHTML = `
    <div class="result-card-header">
      <div class="result-card-dot" style="background:${zone.color}"></div>
      <span class="result-card-name">${zone.name} · ${params.landType}</span>
      <span class="result-card-area">${params.areaHa.toFixed(2)} ha</span>
    </div>

    <div class="eco-debt-block">
      <div class="eco-debt-label">💸 Ecological Debt</div>
      <div class="eco-debt-value" id="debt-val-${zone.id}">₹ 0</div>
    </div>

    <div class="impact-metrics">
      <div class="metric-cell">
        <div class="metric-icon">🫁</div>
        <div class="metric-val">${summary.finalAQI}</div>
        <div class="metric-label">AQI Y${params.years}</div>
      </div>
      <div class="metric-cell">
        <div class="metric-icon">💧</div>
        <div class="metric-val">${summary.finalGroundwaterDrop}m</div>
        <div class="metric-label">GW drop</div>
      </div>
      <div class="metric-cell">
        <div class="metric-icon">🌡</div>
        <div class="metric-val">+${summary.finalTempRise}°C</div>
        <div class="metric-label">Heat rise</div>
      </div>
    </div>

    <div class="charts-section">
      <h3>📊 Projections over ${params.years} years</h3>
      <div class="charts-grid">
        <div>
          <div class="chart-title">🫁 AQI over time</div>
          <div class="chart-wrap"><canvas id="chart-aqi-${zone.id}"></canvas></div>
        </div>
        <div>
          <div class="chart-title">💧 Groundwater drop (m)</div>
          <div class="chart-wrap"><canvas id="chart-gw-${zone.id}"></canvas></div>
        </div>
        <div>
          <div class="chart-title">🌡 Temperature rise (°C)</div>
          <div class="chart-wrap"><canvas id="chart-temp-${zone.id}"></canvas></div>
        </div>
      </div>
    </div>

    <div class="timeline-section">
      <h3>📅 ${params.years}-Year Narrative</h3>
      <div class="timeline-beats" id="timeline-${zone.id}"></div>
    </div>
  `;

  content.prepend(card);

  // CountUp debt animation
  setTimeout(() => {
    if (typeof CountUp !== 'undefined') {
      const cu = new CountUp.CountUp(`debt-val-${zone.id}`, debt, {
        prefix: '₹ ', separator: ',', duration: 2.5,
      });
      cu.start();
    } else {
      document.getElementById(`debt-val-${zone.id}`).textContent = `₹ ${debt.toLocaleString('en-IN')}`;
    }
  }, 100);

  // Render charts
  setTimeout(() => {
    const aqiCanvas  = document.getElementById(`chart-aqi-${zone.id}`);
    const gwCanvas   = document.getElementById(`chart-gw-${zone.id}`);
    const tempCanvas = document.getElementById(`chart-temp-${zone.id}`);
    if (aqiCanvas)  Charts.renderAQI(aqiCanvas, aqi);
    if (gwCanvas)   Charts.renderGroundwater(gwCanvas, groundwater);
    if (tempCanvas) Charts.renderTemperature(tempCanvas, temperature);
  }, 200);

  // Render timeline
  const tlBeats = Timeline.generate(params);
  const tlContainer = document.getElementById(`timeline-${zone.id}`);
  if (tlContainer) {
    tlContainer.innerHTML = tlBeats.map((beat, i) => `
      <div class="beat">
        <div class="beat-dot-col">
          <div class="beat-dot sev-${beat.severity}"></div>
          ${i < tlBeats.length - 1 ? '<div class="beat-line"></div>' : ''}
        </div>
        <div>
          <div class="beat-year">Year ${beat.year}</div>
          <div class="beat-text">${beat.text}</div>
        </div>
      </div>
    `).join('');
  }
}

// ══════════════════════════════════════════ COMBINED DEBT
function updateCombinedDebt() {
  const calculated = state.zones.filter(z => z.result);
  const bar = document.getElementById('combined-debt-bar');

  if (calculated.length >= 2) {
    bar.classList.remove('hidden');
    const total = calculated.reduce((sum, z) => sum + z.result.ecologicalDebt, 0);
    if (typeof CountUp !== 'undefined') {
      const cu = new CountUp.CountUp('combined-debt-value', total, {
        prefix: '₹ ', separator: ',', duration: 2,
      });
      cu.start();
    } else {
      document.getElementById('combined-debt-value').textContent = `₹ ${total.toLocaleString('en-IN')}`;
    }
  } else {
    bar.classList.add('hidden');
  }
}

// ══════════════════════════════════════════ RESULTS PANEL (COLLAPSIBLE)
function showResultsPanel() { 
  const rp = document.getElementById('results-panel');
  rp.classList.remove('hidden'); 
  rp.classList.remove('collapsed');
  setTimeout(() => state.map.invalidateSize(), 350);
}
function hideResultsPanel() { 
  document.getElementById('results-panel').classList.add('collapsed');
  setTimeout(() => state.map.invalidateSize(), 350);
}
function updateResultsPanelVisibility() {
  if (!state.zones.some(z => z.result)) hideResultsPanel();
}

// ══════════════════════════════════════════ COMPARE MODE
function openCompareModal() {
  const calculated = state.zones.filter(z => z.result);
  if (calculated.length === 0) {
    alert('Calculate at least one zone first!');
    return;
  }
  const modal = document.getElementById('compare-modal');
  const content = document.getElementById('compare-content');
  content.innerHTML = calculated.map(zone => {
    const r = zone.result;
    const p = { landType: zone.landType, floors: zone.floors, residents: zone.residents, years: zone.years };
    const area = calcAreaHa(zone.layer);
    return `
      <div class="compare-card">
        <div class="compare-card-title">
          <div class="compare-dot" style="background:${zone.color}"></div>${zone.name}
        </div>
        <div class="compare-row"><span>Land type</span><span class="compare-val">${p.landType}</span></div>
        <div class="compare-row"><span>Area</span><span class="compare-val">${area.toFixed(2)} ha</span></div>
        <div class="compare-row"><span>Floors</span><span class="compare-val">${p.floors}</span></div>
        <div class="compare-row"><span>Residents</span><span class="compare-val">${p.residents.toLocaleString()}</span></div>
        <div class="compare-row"><span>Horizon</span><span class="compare-val">${p.years} yrs</span></div>
        <div class="compare-row"><span>AQI Y${p.years}</span><span class="compare-val">${r.summary.finalAQI}</span></div>
        <div class="compare-row"><span>GW drop</span><span class="compare-val">${r.summary.finalGroundwaterDrop}m</span></div>
        <div class="compare-row"><span>Temp rise</span><span class="compare-val">+${r.summary.finalTempRise}°C</span></div>
        <div class="compare-debt">₹ ${r.ecologicalDebt.toLocaleString('en-IN')}</div>
      </div>
    `;
  }).join('');
  modal.classList.remove('hidden');
}

// ══════════════════════════════════════════ UTILITIES
function calcAreaHa(layer) {
  const latlngs = layer.getLatLngs()[0];
  return polygonArea(latlngs) / 10000;
}

function polygonArea(latlngs) {
  const R = 6371000;
  let area = 0;
  const n = latlngs.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = latlngs[i].lat * Math.PI / 180;
    const lat2 = latlngs[j].lat * Math.PI / 180;
    const lon1 = latlngs[i].lng * Math.PI / 180;
    const lon2 = latlngs[j].lng * Math.PI / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2);
}

// ══════════════════════════════════════════ EVENT WIRING
function wire() {
  // Draw zone button
  document.getElementById('btn-draw-zone').addEventListener('click', startDrawing);
  document.getElementById('btn-finish-draw').addEventListener('click', finishDrawing);

  // Tile switcher
  document.querySelectorAll('.tile-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTile(btn.dataset.layer));
  });

  // Land type
  document.querySelectorAll('.land-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const zone = state.zones.find(z => z.id === state.selectedId);
      if (!zone) return;
      zone.landType = btn.dataset.type;
      document.querySelectorAll('.land-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Building3D.update(zone.floors, zone.landType);
    });
  });

  // Sliders
  document.getElementById('slider-floors').addEventListener('input', e => {
    const val = +e.target.value;
    document.getElementById('floors-val').textContent = val;
    const zone = state.zones.find(z => z.id === state.selectedId);
    if (zone) { zone.floors = val; Building3D.update(val, zone.landType); }
  });

  document.getElementById('slider-residents').addEventListener('input', e => {
    const val = +e.target.value;
    document.getElementById('residents-val').textContent = val;
    const zone = state.zones.find(z => z.id === state.selectedId);
    if (zone) zone.residents = val;
  });

  document.getElementById('slider-years').addEventListener('input', e => {
    const val = +e.target.value;
    document.getElementById('years-val').textContent = `${val} yrs`;
    const zone = state.zones.find(z => z.id === state.selectedId);
    if (zone) zone.years = val;
  });

  // Calculate
  document.getElementById('btn-calculate').addEventListener('click', calculateZone);

  // Delete zone
  document.getElementById('btn-delete-zone').addEventListener('click', () => {
    if (state.selectedId) deleteZone(state.selectedId);
  });

  // Clear all
  document.getElementById('btn-clear-all').addEventListener('click', clearAllZones);

  // Reset
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset everything?')) { clearAllZones(); state.nextId = 1; }
  });

  // Compare
  document.getElementById('btn-compare').addEventListener('click', openCompareModal);

  // Close compare modal
  document.getElementById('btn-close-compare').addEventListener('click', () => {
    document.getElementById('compare-modal').classList.add('hidden');
  });
  document.querySelector('.modal-backdrop').addEventListener('click', () => {
    document.getElementById('compare-modal').classList.add('hidden');
  });

  // Close results panel
  document.getElementById('btn-close-results').addEventListener('click', hideResultsPanel);

  // Sidebar Toggles
  document.getElementById('btn-toggle-left').addEventListener('click', (e) => {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('collapsed');
    e.target.innerText = sb.classList.contains('collapsed') ? '›' : '‹';
    setTimeout(() => state.map.invalidateSize(), 350);
  });

  document.getElementById('btn-toggle-right').addEventListener('click', (e) => {
    const rp = document.getElementById('results-panel');
    rp.classList.toggle('collapsed');
    rp.classList.remove('hidden'); 
    e.target.innerText = rp.classList.contains('collapsed') ? '‹' : '›';
    setTimeout(() => state.map.invalidateSize(), 350);
  });
}

// ══════════════════════════════════════════ BOOTSTRAP
(function init() {
  initMap();
  wire();
})();

