<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { CollisionDetection, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

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
let animId = null;
let isRunning = false;
const tempPos = new Vec2();

function setMode(id) {
  currentMode.value = id;
  setupBodies();
}

function setupBodies() {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  if (currentMode.value === 'circlevscircle') {
    bodyA = new Physics(
      new Vec2(cx - 95, cy),
      new Vec2(120, 0),
      new Vec2(48, 48),
      1.0,
      1.0,
      0.9,
      'circle'
    );
    bodyB = new Physics(
      new Vec2(cx, cy),
      new Vec2(0, 0),
      new Vec2(60, 60),
      0.0,
      1.0,
      0.9,
      'circle'
    ); // static obstacle in the center
  } else if (currentMode.value === 'circlevsaabb') {
    bodyA = new Physics(
      new Vec2(cx - 95, cy - 25),
      new Vec2(120, 30),
      new Vec2(44, 44),
      1.0,
      1.0,
      0.9,
      'circle'
    );
    bodyB = new Physics(
      new Vec2(cx, cy),
      new Vec2(0, 0),
      new Vec2(48, 48),
      0.0,
      1.0,
      0.9,
      'aabb'
    ); // static box in the center
  } else {
    bodyA = new Physics(
      new Vec2(cx - 95, cy - 15),
      new Vec2(120, 20),
      new Vec2(32, 32),
      1.0,
      1.0,
      0.9,
      'aabb'
    );
    bodyB = new Physics(
      new Vec2(cx, cy),
      new Vec2(0, 0),
      new Vec2(48, 48),
      0.0,
      1.0,
      0.9,
      'aabb'
    ); // static box in the center
  }
}

function impulse() {
  if (!bodyA || !bodyB) return;
  const targetX = bodyB.body.position.x;
  const targetY = bodyB.body.position.y;
  // Subtle lateral jitter so repeated pushes from same spot test different collision angles
  const jitterX = (Math.random() - 0.5) * 16;
  const jitterY = (Math.random() - 0.5) * 16;
  const dx = (targetX + jitterX) - bodyA.body.position.x;
  const dy = (targetY + jitterY) - bodyA.body.position.y;
  const len = Math.hypot(dx, dy);
  const speed = 140;

  if (len > 0.001) {
    bodyA.velocity.setScalar((dx / len) * speed, (dy / len) * speed);
  } else {
    bodyA.velocity.setScalar(speed, 0);
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
        tempPos.setScalar(r, bodyA.body.position.y);
        bodyA.setPosition(tempPos);
        bodyA.velocity.x = Math.abs(bodyA.velocity.x);
      } else if (bodyA.body.position.x > w - r) {
        tempPos.setScalar(w - r, bodyA.body.position.y);
        bodyA.setPosition(tempPos);
        bodyA.velocity.x = -Math.abs(bodyA.velocity.x);
      }
      if (bodyA.body.position.y < r) {
        tempPos.setScalar(bodyA.body.position.x, r);
        bodyA.setPosition(tempPos);
        bodyA.velocity.y = Math.abs(bodyA.velocity.y);
      } else if (bodyA.body.position.y > h - r) {
        tempPos.setScalar(bodyA.body.position.x, h - r);
        bodyA.setPosition(tempPos);
        bodyA.velocity.y = -Math.abs(bodyA.velocity.y);
      }
    }

    // Detect and resolve
    let hit = false;
    if (bodyA && bodyB) {
      hit = CollisionDetection.test(bodyA, bodyB);
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
  <figure class="bumpr-demo">
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
  </figure>
</template>
