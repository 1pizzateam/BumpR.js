<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics, Vec2 } from '@1pizzateam/bumpr';

const canvasRef = ref(null);
const gravityEnabled = ref(true);
const bodyCount = ref(0);

let scene = null;
let animId = null;
let isRunning = false;

function toggleGravity() {
  gravityEnabled.value = !gravityEnabled.value;
  if (scene) {
    scene.setGravity(new Vec2(0, gravityEnabled.value ? 250 : 0));
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
  const size = type === 'circle' ? 14 + Math.random() * 8 : 24 + Math.random() * 12;

  const body = type === 'circle'
    ? new Physics(
        new Vec2(x, y),
        new Vec2(vx, vy),
        new Vec2(size * 2, size * 2),
        1.0,
        1.0,
        0.75,
        'circle'
      )
    : new Physics(
        new Vec2(x, y),
        new Vec2(vx, vy),
        new Vec2(size, size),
        1.0,
        1.0,
        0.75,
        'aabb'
      );
  scene.addBody(body);
  bodyCount.value = scene.bodiesLength;
}

function resetSimulation() {
  if (!scene || !canvasRef.value) return;
  scene.clear();
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;

  // Add initial bodies
  for (let i = 0; i < 4; i++) {
    const isCircle = i % 2 === 0;
    const size = isCircle ? 18 : 28;
    const x = 60 + (i * (w - 120)) / 3;
    const y = 50 + (i % 2) * 40;
    const vx = (Math.random() - 0.5) * 150;
    const vy = Math.random() * 50;
    const b = isCircle
      ? new Physics(
          new Vec2(x, y),
          new Vec2(vx, vy),
          new Vec2(size * 2, size * 2),
          1.0,
          1.0,
          0.8,
          'circle'
        )
      : new Physics(
          new Vec2(x, y),
          new Vec2(vx, vy),
          new Vec2(size, size),
          1.0,
          1.0,
          0.8,
          'aabb'
        );
    scene.addBody(b);
  }
  bodyCount.value = scene.bodiesLength;
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  scene = new Scene();
  scene.setGravity(new Vec2(0, gravityEnabled.value ? 250 : 0));
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
  const tempPos = new Vec2();

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
      const pos = b.position;
      const isCircle = b.body.shape === 'circle';
      const rx = isCircle ? b.body.radius : b.body.halfSize.x;
      const ry = isCircle ? b.body.radius : b.body.halfSize.y;

      let newX = pos.x;
      let newY = pos.y;
      let changed = false;

      if (pos.x - rx < 10) {
        newX = 10 + rx;
        b.velocity.x = Math.abs(b.velocity.x) * b.restitution;
        changed = true;
      } else if (pos.x + rx > w - 10) {
        newX = w - 10 - rx;
        b.velocity.x = -Math.abs(b.velocity.x) * b.restitution;
        changed = true;
      }
      if (pos.y - ry < 10) {
        newY = 10 + ry;
        b.velocity.y = Math.abs(b.velocity.y) * b.restitution;
        changed = true;
      } else if (pos.y + ry > h - 10) {
        newY = h - 10 - ry;
        changed = true;

        // Settling threshold: squares settle onto flat faces when bounces decay below visible height (~0.6px)
        // Circles retain low threshold to bounce down to microscopic elasticity
        const restingThreshold = gravityEnabled.value
          ? (isCircle ? Math.max(1.5 * 250 * dt, 8) : Math.max(2.0 * 250 * dt, 18))
          : 0;

        if (b.velocity.y > 0) {
          const vyIn = b.velocity.y;
          const reboundSpeed = vyIn * b.restitution;
          let vyOut = 0;
          if (reboundSpeed < restingThreshold && gravityEnabled.value) {
            vyOut = 0;
          } else {
            vyOut = -reboundSpeed;
          }
          b.velocity.y = vyOut;

          // Impact friction on bounce: squares lose horizontal velocity on each ground contact
          if (!isCircle && gravityEnabled.value) {
            const normalImpulse = vyIn - vyOut;
            const maxFriction = 0.15 * normalImpulse;
            if (Math.abs(b.velocity.x) <= maxFriction) {
              b.velocity.x = 0;
            } else {
              b.velocity.x -= Math.sign(b.velocity.x) * maxFriction;
            }
          }
        }

        // Floor friction & rolling resistance when resting on the floor
        if (gravityEnabled.value && Math.abs(b.velocity.y) < restingThreshold) {
          const speed = Math.abs(b.velocity.x);
          if (speed < 0.5) {
            b.velocity.x = 0;
          } else if (!isCircle) {
            // Squares decelerate decisively with progressive stiction easing (no abrupt visual snap)
            const decel = (450 + 4 * speed) * dt;
            if (speed <= decel) {
              b.velocity.x = 0;
            } else {
              b.velocity.x -= Math.sign(b.velocity.x) * decel;
            }
          } else {
            // Circles glide smoothly across the floor with gentle rolling resistance and settle cleanly
            const decel = (35 + 0.5 * speed) * dt;
            if (speed <= decel) {
              b.velocity.x = 0;
            } else {
              b.velocity.x -= Math.sign(b.velocity.x) * decel;
            }
          }
        }
      }

      if (changed) {
        tempPos.setScalar(newX, newY);
        b.setPosition(tempPos);
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
  <figure class="bumpr-demo">
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
  </figure>
</template>
