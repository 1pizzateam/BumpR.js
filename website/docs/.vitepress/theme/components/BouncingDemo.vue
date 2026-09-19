<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics, Vec2 } from '@1pizzateam/bumpr';

const canvasRef = ref(null);
const gravityEnabled = ref(true);
const bodyCount = ref(0);
const lastCollisionCount = ref(0);

let scene = null;
let animId = null;
let isRunning = false;

function toggleGravity() {
  gravityEnabled.value = !gravityEnabled.value;
  if (scene) {
    scene.setGravity(0, gravityEnabled.value ? 250 : 0);
  }
}

function addRandomBody(type = 'circle') {
  if (!scene || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = 40 + Math.random() * (rect.width - 80);
  const y = 30 + Math.random() * (rect.height * 0.4);
  const vx = (Math.random() - 0.5) * 200;
  const vy = (Math.random() - 0.5) * 100;

  const body = new Physics(
    type,
    type === 'circle' ? 14 + Math.random() * 8 : 24 + Math.random() * 12,
    type === 'aabb' ? 24 + Math.random() * 12 : undefined,
    x,
    y,
    1.0
  );
  body.setVelocity(vx, vy);
  body.setRestitution(0.75);
  scene.addBody(body);
  bodyCount.value = scene.bodiesLength;
}

function resetSimulation() {
  if (!scene || !canvasRef.value) return;
  scene.clear();
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  // Add initial bodies
  for (let i = 0; i < 4; i++) {
    const isCircle = i % 2 === 0;
    const b = new Physics(
      isCircle ? 'circle' : 'aabb',
      isCircle ? 18 : 28,
      isCircle ? undefined : 28,
      60 + i * (w - 120) / 3,
      50 + (i % 2) * 40,
      1.0
    );
    b.setVelocity((Math.random() - 0.5) * 150, Math.random() * 50);
    b.setRestitution(0.8);
    scene.addBody(b);
  }
  bodyCount.value = scene.bodiesLength;
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  scene = new Scene();
  scene.setGravity(0, gravityEnabled.value ? 250 : 0);
  resetSimulation();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    // Update simulation
    scene.update(dt);
    scene.test();

    // Enforce arena boundaries
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      const pos = b.body.position;
      const r = b.type === 'circle' ? b.body.radius : b.body.halfSize.x;
      const ry = b.type === 'circle' ? b.body.radius : b.body.halfSize.y;

      if (pos.x - r < 10) {
        b.setPosition(10 + r, pos.y);
        b.velocity.x = Math.abs(b.velocity.x) * b.restitution;
      } else if (pos.x + r > w - 10) {
        b.setPosition(w - 10 - r, pos.y);
        b.velocity.x = -Math.abs(b.velocity.x) * b.restitution;
      }
      if (pos.y - ry < 10) {
        b.setPosition(pos.x, 10 + ry);
        b.velocity.y = Math.abs(b.velocity.y) * b.restitution;
      } else if (pos.y + ry > h - 10) {
        b.setPosition(pos.x, h - 10 - ry);
        b.velocity.y = -Math.abs(b.velocity.y) * b.restitution;
      }
    }

    // Render arena
    ctx.clearRect(0, 0, w, h);

    // Wall border
    ctx.strokeStyle = isDark ? '#373a40' : '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Draw bodies
    const fill = isDark ? '#25262b' : '#f8f9fa';
    const stroke = '#ff6b6b';
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
          :class="{ active: gravityEnabled }"
          @click="toggleGravity"
        >
          Gravity: {{ gravityEnabled ? 'ON' : 'OFF' }}
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="addRandomBody('circle')"
        >
          + Circle
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="addRandomBody('aabb')"
        >
          + Box
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="resetSimulation"
        >
          Reset
        </button>
      </div>

      <div class="bumpr-stats">
        <span class="bumpr-badge status-active">
          Bodies: <strong>{{ bodyCount }}</strong>
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR 2D physics bouncing demo"></canvas>

    <figcaption>
      Bodies simulate rigid body momentum, boundary reflections, and pairwise impulse resolution in real time.
    </figcaption>
  </div>
</template>
