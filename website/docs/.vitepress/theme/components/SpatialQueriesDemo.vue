<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const canvasRef = ref(null);
const activeTool = ref('blast'); // 'blast' | 'point' | 'marquee'
const lastSubSteps = ref(0);
const currentAlpha = ref(0);
const hoveredInfo = ref('None');
const selectedCount = ref(0);

let scene = null;
let animId = null;
let isRunning = false;

const pointerPos = new Vec2();
let dragStart = null;
let dragEnd = null;
let blastAnim = null; // { center: Vec2, radius: number, maxRadius: number, timer: number }
let selectedBodies = [];

function setTool(tool) {
  activeTool.value = tool;
  selectedBodies = [];
  dragStart = null;
  dragEnd = null;
  hoveredInfo.value = 'None';
}

function spawnBodies() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  if (scene) scene.clear();
  scene = new Scene();
  scene.setGravity(new Vec2(0, 0)); // Floating in zero-G for crisp spatial inspection
  scene.setFixedDeltaTime(1 / 60);
  scene.setMaxSubSteps(5);

  selectedBodies = [];

  // Spawn a field of floating circles and boxes with gentle damping
  const rows = 4;
  const cols = 6;
  const startX = w * 0.15;
  const endX = w * 0.85;
  const startY = h * 0.2;
  const endY = h * 0.8;
  const stepX = (endX - startX) / (cols - 1);
  const stepY = (endY - startY) / (rows - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isCircle = (r + c) % 2 === 0;
      const x = startX + c * stepX + (Math.random() - 0.5) * 20;
      const y = startY + r * stepY + (Math.random() - 0.5) * 20;
      const size = isCircle ? 24 : 26;

      const body = new Physics(
        new Vec2(x, y),
        new Vec2((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
        new Vec2(size, size),
        1.0,
        0.95, // gentle damping
        0.8,
        isCircle ? 'circle' : 'aabb'
      );
      scene.addBody(body);
    }
  }
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawnBodies();
  }

  resize();
  window.addEventListener('resize', resize);

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return new Vec2(e.clientX - rect.left, e.clientY - rect.top);
  }

  function onPointerDown(e) {
    const pos = getCanvasPos(e);
    pointerPos.copy(pos);

    if (activeTool.value === 'blast') {
      // Trigger AoE blast
      const blastRadius = 90;
      blastAnim = {
        center: new Vec2().copy(pos),
        radius: 0,
        maxRadius: blastRadius,
        duration: 0.35,
        elapsed: 0,
      };

      // Query bodies in circle
      const hitBodies = scene.queryCircle(pos, blastRadius);
      selectedBodies = hitBodies;
      selectedCount.value = hitBodies.length;

      // Apply explosive radial impulses
      for (const b of hitBodies) {
        const diff = new Vec2().subVectors(b.position, pos);
        const dist = Math.max(diff.getMagnitude(), 10);
        const impulse = diff.normalize().scale((1 - dist / blastRadius) * 280);
        b.applyImpulseVector(impulse);
      }
    } else if (activeTool.value === 'marquee') {
      dragStart = new Vec2().copy(pos);
      dragEnd = new Vec2().copy(pos);
    }
  }

  function onPointerMove(e) {
    const pos = getCanvasPos(e);
    pointerPos.copy(pos);

    if (activeTool.value === 'point') {
      const hit = scene.queryPointFirst(pos);
      if (hit) {
        selectedBodies = [hit];
        selectedCount.value = 1;
        hoveredInfo.value = `${hit.shape.toUpperCase()} #${hit.collisionSceneId} (v: ${Math.round(hit.velocity.getMagnitude())} px/s)`;
      } else {
        selectedBodies = [];
        selectedCount.value = 0;
        hoveredInfo.value = 'None';
      }
    } else if (activeTool.value === 'marquee' && dragStart) {
      dragEnd = new Vec2().copy(pos);
      // Query bodies in AABB
      const hitBodies = scene.queryAabb(dragStart, dragEnd);
      selectedBodies = hitBodies;
      selectedCount.value = hitBodies.length;
    }
  }

  function onPointerUp() {
    if (activeTool.value === 'marquee') {
      dragStart = null;
      dragEnd = null;
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

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

    // Deterministic fixed-timestep accumulator
    const steps = scene.step(dt);
    lastSubSteps.value = steps;
    currentAlpha.value = scene.getAlpha();

    // Screen bounds bounce
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      const r = b.shape === 'circle' ? b.radius : b.halfSize.x;
      if (b.position.x - r < 10) {
        b.position.x = 10 + r;
        b.velocity.x = Math.abs(b.velocity.x);
      } else if (b.position.x + r > w - 10) {
        b.position.x = w - 10 - r;
        b.velocity.x = -Math.abs(b.velocity.x);
      }
      if (b.position.y - r < 10) {
        b.position.y = 10 + r;
        b.velocity.y = Math.abs(b.velocity.y);
      } else if (b.position.y + r > h - 10) {
        b.position.y = h - 10 - r;
        b.velocity.y = -Math.abs(b.velocity.y);
      }
    }

    // Render
    ctx.clearRect(0, 0, w, h);

    // Draw bodies
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      const isSelected = selectedBodies.includes(b);

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = isDark ? '#5a2d2d' : '#ffe3e3';
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = isDark ? '#2b2c3a' : '#ffffff';
        ctx.strokeStyle = isDark ? '#4a4d5a' : '#ced4da';
        ctx.lineWidth = 1.5;
      }

      if (b.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(b.position.x, b.position.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const hs = b.halfSize;
        ctx.fillRect(b.position.x - hs.x, b.position.y - hs.y, hs.x * 2, hs.y * 2);
        ctx.strokeRect(b.position.x - hs.x, b.position.y - hs.y, hs.x * 2, hs.y * 2);
      }
      ctx.restore();
    }

    // Blast shockwave animation
    if (blastAnim) {
      blastAnim.elapsed += dt;
      const progress = blastAnim.elapsed / blastAnim.duration;
      if (progress >= 1) {
        blastAnim = null;
      } else {
        const radius = blastAnim.maxRadius * progress;
        const alpha = 1 - progress;
        ctx.save();
        ctx.beginPath();
        ctx.arc(blastAnim.center.x, blastAnim.center.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
        ctx.fillStyle = `rgba(255, 107, 107, ${alpha * 0.2})`;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // Marquee selection box
    if (activeTool.value === 'marquee' && dragStart && dragEnd) {
      const x = Math.min(dragStart.x, dragEnd.x);
      const y = Math.min(dragStart.y, dragEnd.y);
      const mw = Math.abs(dragEnd.x - dragStart.x);
      const mh = Math.abs(dragEnd.y - dragStart.y);

      ctx.save();
      ctx.fillStyle = 'rgba(91, 140, 255, 0.15)';
      ctx.strokeStyle = '#5b8cff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(x, y, mw, mh);
      ctx.strokeRect(x, y, mw, mh);
      ctx.restore();
    }
  }

  isRunning = true;
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);

  onUnmounted(() => {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerUp);
    if (scene) scene.clear();
  });
});
</script>

<template>
  <figure class="bumpr-demo">
    <div class="bumpr-demo-toolbar">
      <div class="bumpr-btn-group">
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: activeTool === 'blast' }"
          @click="setTool('blast')"
        >
          💥 AoE Blast (queryCircle)
        </button>
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: activeTool === 'point' }"
          @click="setTool('point')"
        >
          🔍 Inspect (queryPoint)
        </button>
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: activeTool === 'marquee' }"
          @click="setTool('marquee')"
        >
          Select Marquee (queryAabb)
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="spawnBodies"
        >
          Reset Field
        </button>
      </div>

      <div class="bumpr-stats">
        <span class="bumpr-badge status-active">
          Selected: <strong>{{ selectedCount }}</strong>
        </span>
        <span v-if="activeTool === 'point'" class="bumpr-badge status-info">
          Hovered: <strong>{{ hoveredInfo }}</strong>
        </span>
        <span class="bumpr-badge">
          SubSteps: <strong>{{ lastSubSteps }}</strong> (α: {{ currentAlpha.toFixed(2) }})
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR spatial queries and fixed timestep demo"></canvas>

    <figcaption>
      Spatial queries: <code>queryCircle</code> finds bodies in radial blast zones, <code>queryPoint</code> detects mouse hover hits, and <code>queryAabb</code> selects bodies in bounding boxes. Simulation is stepped with <code>scene.step(dt)</code>.
    </figcaption>
  </figure>
</template>
