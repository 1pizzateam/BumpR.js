<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics, Grid, Vec2 } from '@1pizzateam/bumpr';

const canvasRef = ref(null);
const activeCellCount = ref(0);
const bodyCount = ref(0);
const showGrid = ref(true);

let scene = null;
let grid = null;
let animId = null;
let isRunning = false;

function toggleGrid() {
  showGrid.value = !showGrid.value;
}

function addBody() {
  if (!scene || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = 30 + Math.random() * (rect.width - 60);
  const y = 30 + Math.random() * (rect.height - 60);

  const b = new Physics('circle', 16, undefined, x, y, 1.0);
  b.setVelocity((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120);
  b.setRestitution(0.9);
  scene.addBody(b);
  bodyCount.value = scene.bodiesLength;
}

function reset() {
  if (!scene || !canvasRef.value) return;
  scene.clear();
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  for (let i = 0; i < 5; i++) {
    const b = new Physics('circle', 16, undefined, 40 + i * (w - 80) / 4, 40 + (i % 2) * 60, 1.0);
    b.setVelocity((Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140);
    b.setRestitution(0.9);
    scene.addBody(b);
  }
  bodyCount.value = scene.bodiesLength;
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  scene = new Scene();
  scene.setGravity(0, 0);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Create 6x4 spatial hash grid
    const cols = 6;
    const rows = 4;
    grid = new Grid(new Vec2(0, 0), new Vec2(w, h), new Vec2(cols, rows));
    scene.setGrid(grid);
    reset();
  }

  resize();
  window.addEventListener('resize', resize);

  let lastTime = performance.now();

  function loop(now) {
    if (!isRunning) return;
    animId = requestAnimationFrame(loop);

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const isDark = document.documentElement.classList.contains('dark');

    scene.update(dt);
    scene.test();

    // Boundary bounces
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      const pos = b.body.position;
      const r = b.body.radius;
      if (pos.x - r < 5) {
        b.setPosition(5 + r, pos.y);
        b.velocity.x = Math.abs(b.velocity.x);
      } else if (pos.x + r > w - 5) {
        b.setPosition(w - 5 - r, pos.y);
        b.velocity.x = -Math.abs(b.velocity.x);
      }
      if (pos.y - r < 5) {
        b.setPosition(pos.x, 5 + r);
        b.velocity.y = Math.abs(b.velocity.y);
      } else if (pos.y + r > h - 5) {
        b.setPosition(pos.x, h - 5 - r);
        b.velocity.y = -Math.abs(b.velocity.y);
      }
    }

    ctx.clearRect(0, 0, w, h);

    // Draw grid if enabled
    if (showGrid.value && grid) {
      const cellW = w / 6;
      const cellH = h / 4;

      // Highlight occupied cells
      const activeCellIds = new Set();
      for (let i = 0; i < scene.bodiesLength; i++) {
        for (const cellId of scene.bodies[i].body.gridCells) {
          if (cellId >= 0) activeCellIds.add(cellId);
        }
      }
      activeCellCount.value = activeCellIds.size;

      for (const cellId of activeCellIds) {
        const cx = (cellId % 6) * cellW;
        const cy = Math.floor(cellId / 6) * cellH;
        ctx.fillStyle = isDark ? 'rgba(255, 107, 107, 0.12)' : 'rgba(255, 107, 107, 0.1)';
        ctx.fillRect(cx, cy, cellW, cellH);
      }

      // Grid lines
      ctx.strokeStyle = isDark ? '#2e3039' : '#e9ecef';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += cellW) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += cellH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Cell indices
      ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
      ctx.fillStyle = isDark ? '#5c5f66' : '#adb5bd';
      ctx.textAlign = 'left';
      for (let i = 0; i < 24; i++) {
        const cx = (i % 6) * cellW + 4;
        const cy = Math.floor(i / 6) * cellH + 12;
        ctx.fillText(`#${i}`, cx, cy);
      }
    }

    // Draw bodies
    const fill = isDark ? '#25262b' : '#ffffff';
    const stroke = '#38c793';
    scene.draw(ctx, fill, stroke, 2);
  }

  isRunning = true;
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);

  onUnmounted(() => {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (scene) scene.clear();
  });
});
</script>

<template>
  <div class="bumpr-demo">
    <div class="bumpr-demo-toolbar">
      <div class="bumpr-btn-group">
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: showGrid }"
          @click="toggleGrid"
        >
          Grid: {{ showGrid ? 'Visible' : 'Hidden' }}
        </button>
        <button type="button" class="bumpr-btn" @click="addBody">
          + Body
        </button>
        <button type="button" class="bumpr-btn" @click="reset">
          Reset
        </button>
      </div>

      <div class="bumpr-stats">
        <span class="bumpr-badge status-active">
          Active Cells: <strong>{{ activeCellCount }} / 24</strong>
        </span>
        <span class="bumpr-badge status-info">
          Bodies: <strong>{{ bodyCount }}</strong>
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR spatial hash grid demo"></canvas>

    <figcaption>
      Spock's <code>Grid</code> partitions space into cells. BumpR only performs narrow-phase collision tests on bodies sharing active cells (highlighted in red), scaling to thousands of bodies.
    </figcaption>
  </div>
</template>
