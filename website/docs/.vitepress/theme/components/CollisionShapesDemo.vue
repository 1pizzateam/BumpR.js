<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { CollisionDetection, Physics, Vec2 } from '@1pizzateam/bumpr';

const canvasRef = ref(null);
const currentMode = ref('circlevsaabb');
const colliding = ref(false);

const modes = [
  { id: 'circlevsaabb', label: 'Circle vs AABB' },
  { id: 'circlevscircle', label: 'Circle vs Circle' },
  { id: 'aabbvsaabb', label: 'AABB vs AABB' },
];

let bodyA = null;
let bodyB = null;
let detector = null;
let animId = null;
let isRunning = false;

function setMode(id) {
  currentMode.value = id;
  setupBodies();
}

function setupBodies() {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  detector = new CollisionDetection();

  if (currentMode.value === 'circlevscircle') {
    bodyA = new Physics('circle', 24, undefined, cx - 70, cy, 1.0);
    bodyB = new Physics('circle', 30, undefined, cx + 50, cy, 0.0); // static obstacle
    bodyA.setVelocity(100, 0);
  } else if (currentMode.value === 'circlevsaabb') {
    bodyA = new Physics('circle', 22, undefined, cx - 80, cy - 25, 1.0);
    bodyB = new Physics('aabb', 35, 35, cx + 40, cy, 0.0); // static box
    bodyA.setVelocity(110, 30);
  } else {
    bodyA = new Physics('aabb', 24, 24, cx - 80, cy, 1.0);
    bodyB = new Physics('aabb', 35, 35, cx + 40, cy, 0.0); // static box
    bodyA.setVelocity(100, 0);
  }

  bodyA.setRestitution(0.9);
  bodyB.setRestitution(0.9);
}

function impulse() {
  if (!bodyA) return;
  bodyA.setVelocity(120, (Math.random() - 0.5) * 80);
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
    setupBodies();
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

    // Update dynamic body A
    if (bodyA) {
      bodyA.updatePosition(dt);

      // Boundaries for bodyA
      const r = 30;
      if (bodyA.body.position.x < r) {
        bodyA.setPosition(r, bodyA.body.position.y);
        bodyA.velocity.x = Math.abs(bodyA.velocity.x);
      } else if (bodyA.body.position.x > w - r) {
        bodyA.setPosition(w - r, bodyA.body.position.y);
        bodyA.velocity.x = -Math.abs(bodyA.velocity.x);
      }
      if (bodyA.body.position.y < r) {
        bodyA.setPosition(bodyA.body.position.x, r);
        bodyA.velocity.y = Math.abs(bodyA.velocity.y);
      } else if (bodyA.body.position.y > h - r) {
        bodyA.setPosition(bodyA.body.position.x, h - r);
        bodyA.velocity.y = -Math.abs(bodyA.velocity.y);
      }
    }

    // Detect and resolve
    let hit = false;
    if (bodyA && bodyB && detector) {
      hit = detector.test(bodyA, bodyB);
    }
    colliding.value = hit;

    ctx.clearRect(0, 0, w, h);

    // Draw static body B
    if (bodyB) {
      const fillB = isDark ? '#2e303d' : '#e9ecef';
      const strokeB = isDark ? '#707489' : '#868e96';
      bodyB.draw(ctx, fillB, strokeB, 2);
    }

    // Draw moving body A
    if (bodyA) {
      const fillA = isDark ? '#3b2528' : '#ffe3e3';
      const strokeA = '#ff6b6b';
      bodyA.draw(ctx, fillA, strokeA, 2);
    }
  }

  isRunning = true;
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);

  onUnmounted(() => {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  });
});
</script>

<template>
  <div class="bumpr-demo">
    <div class="bumpr-demo-toolbar">
      <div class="bumpr-btn-group">
        <button
          v-for="mode in modes"
          :key="mode.id"
          type="button"
          class="bumpr-btn"
          :class="{ active: currentMode === mode.id }"
          @click="setMode(mode.id)"
        >
          {{ mode.label }}
        </button>
        <button type="button" class="bumpr-btn" @click="impulse">
          Push
        </button>
      </div>

      <div class="bumpr-stats">
        <span
          class="bumpr-badge"
          :class="colliding ? 'status-collision' : 'status-active'"
        >
          Status: <strong>{{ colliding ? 'COLLISION' : 'CLEAR' }}</strong>
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR collision pairs demo"></canvas>

    <figcaption>
      Interactive narrow-phase test. The stationary obstacle has infinite mass (<code>inverseMass = 0</code>), causing the dynamic body to rebound symmetrically.
    </figcaption>
  </div>
</template>
