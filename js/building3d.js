/**
 * building3d.js — Isometric 3D building preview rendered on canvas
 */

'use strict';

const Building3D = (() => {

  const canvas = document.getElementById('building-canvas');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;   // 200
  const H = canvas.height;  // 220

  const LAND_COLORS = {
    wetland:      { wall: '#1565c0', roof: '#1e88e5', floor: '#0d47a1' },
    vegetation:   { wall: '#2e7d32', roof: '#43a047', floor: '#1b5e20' },
    agricultural: { wall: '#f57f17', roof: '#f9a825', floor: '#e65100' },
    bare:         { wall: '#4e342e', roof: '#6d4c41', floor: '#3e2723' },
  };

  const DEFAULT_COLORS = { wall: '#1aaa56', roof: '#28e07a', floor: '#0e6632' };

  let animFrame = null;
  let currentFloors = 5;
  let currentLandType = 'bare';
  let targetFloors = 5;

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Isometric tile size
  const TX = 60; // tile width half
  const TY = 22; // tile height half
  const FH = 12; // floor height in px

  function drawBuilding(floors, landType) {
    ctx.clearRect(0, 0, W, H);

    const colors = LAND_COLORS[landType] || DEFAULT_COLORS;
    const numFloors = Math.max(1, Math.round(floors));
    const totalBuildH = numFloors * FH;

    // Isometric base origin
    const ox = W / 2;
    const oy = H - 30 - totalBuildH;

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(ox, H - 20, TX + 5, TY * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw each floor from bottom to top
    for (let f = 0; f < numFloors; f++) {
      const baseY = oy + (numFloors - f) * FH;
      const topY  = baseY - FH;

      // Left face
      ctx.beginPath();
      ctx.moveTo(ox,      topY - TY);
      ctx.lineTo(ox - TX, topY);
      ctx.lineTo(ox - TX, baseY);
      ctx.lineTo(ox,      baseY - TY);
      ctx.closePath();
      ctx.fillStyle = colors.wall;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Right face
      ctx.beginPath();
      ctx.moveTo(ox,      topY - TY);
      ctx.lineTo(ox + TX, topY);
      ctx.lineTo(ox + TX, baseY);
      ctx.lineTo(ox,      baseY - TY);
      ctx.closePath();
      ctx.fillStyle = colors.floor;
      ctx.globalAlpha = 0.75;
      ctx.fill();

      ctx.globalAlpha = 1;

      // Windows on left face (every other floor)
      if (f % 2 === 0) {
        drawWindowRow(ox - TX + 8, topY + 3, true, colors);
      }
      // Windows on right face
      if (f % 2 === 0) {
        drawWindowRow(ox + 8, topY + 3, false, colors);
      }

      // Floor line
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(ox - TX, baseY); ctx.lineTo(ox, baseY - TY); ctx.lineTo(ox + TX, baseY);
      ctx.stroke();
    }

    // Top roof
    const topY = oy;
    ctx.beginPath();
    ctx.moveTo(ox,      topY - TY);
    ctx.lineTo(ox - TX, topY);
    ctx.lineTo(ox,      topY + TY);
    ctx.lineTo(ox + TX, topY);
    ctx.closePath();
    ctx.fillStyle = colors.roof;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw label
    ctx.fillStyle = 'rgba(232,245,236,0.9)';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${numFloors}F`, ox, H - 8);
  }

  function drawWindowRow(x, y, leftFace, colors) {
    const wW = 7; const wH = 6; const gap = 10;
    const cols = leftFace ? 3 : 3;
    for (let c = 0; c < cols; c++) {
      const wx = x + c * (wW + gap);
      const glowChance = Math.random() > 0.4;
      ctx.fillStyle = glowChance ? '#fff9c4' : 'rgba(255,255,255,0.18)';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(wx, y, wW, wH);
      ctx.globalAlpha = 1;
    }
  }

  function animateTo(targetF) {
    if (animFrame) cancelAnimationFrame(animFrame);
    targetFloors = targetF;

    function step() {
      currentFloors = lerp(currentFloors, targetFloors, 0.18);
      drawBuilding(currentFloors, currentLandType);
      if (Math.abs(currentFloors - targetFloors) > 0.05) {
        animFrame = requestAnimationFrame(step);
      } else {
        currentFloors = targetFloors;
        drawBuilding(currentFloors, currentLandType);
      }
    }
    step();
  }

  function update(floors, landType) {
    currentLandType = landType || 'bare';
    animateTo(floors);
    canvas.style.display = 'block';
  }

  function hide() {
    canvas.style.display = 'none';
    if (animFrame) cancelAnimationFrame(animFrame);
  }

  return { update, hide };
})();
