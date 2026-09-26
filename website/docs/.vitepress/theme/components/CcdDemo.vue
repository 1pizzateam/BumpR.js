<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const canvasRef = ref(null);
const ccdStatus = ref('Ready to fire');
const discreteStatus = ref('Ready to fire');

let scene = null;
let animId = null;
let isRunning = false;

const BULLET_START_X = 50;
const BULLET_SPEED = 2400; // 40px per fixed physics step at 60 Hz
const BULLET_RADIUS = 6;
const WALL_THICKNESS = 4;

let wallX = 350;
let thinWallUpper = null;
let thinWallLower = null;
let bulletCcd = null;
let bulletDiscrete = null;

// Sparks particle effects on impact
let impactParticles = [];

function fireWithCcd() {
  if (!scene || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const h = rect.height;

  if (bulletCcd) {
    scene.removeBody(bulletCcd);
    bulletCcd = null;
  }

  const startY = h * 0.3; // Upper lane
  bulletCcd = new Physics(
    new Vec2(BULLET_START_X, startY),
    new Vec2(BULLET_SPEED, 0), // 2400 px/s = 40px per step
    new Vec2(BULLET_RADIUS * 2, BULLET_RADIUS * 2),
    1.0,
    1.0,
    0.85,
    'circle',
    0.0,
    false,
    0x0001,
    0xFFFF,
    0,
    'dynamic',
    true // isBullet = true (REAL CONTINUOUS COLLISION DETECTION)
  );
  scene.addBody(bulletCcd);
  ccdStatus.value = 'In Flight...';
}

function fireWithoutCcd() {
  if (!scene || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const h = rect.height;

  if (bulletDiscrete) {
    scene.removeBody(bulletDiscrete);
    bulletDiscrete = null;
  }

  const startY = h * 0.7; // Lower lane
  bulletDiscrete = new Physics(
    new Vec2(BULLET_START_X, startY),
    new Vec2(BULLET_SPEED, 0), // Identical speed, but discrete physics only
    new Vec2(BULLET_RADIUS * 2, BULLET_RADIUS * 2),
    1.0,
    1.0,
    0.85,
    'circle',
    0.0,
    false,
    0x0001,
    0xFFFF,
    0,
    'dynamic',
    false // isBullet = false (REAL DISCRETE PHYSICS: TUNNELS)
  );
  scene.addBody(bulletDiscrete);
  discreteStatus.value = 'In Flight...';
}

function fireBoth() {
  fireWithCcd();
  fireWithoutCcd();
}

function resetArena() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  if (scene) scene.clear();
  scene = new Scene();
  scene.setGravity(new Vec2(0, 0));
  scene.setFixedDeltaTime(1 / 60);

  bulletCcd = null;
  bulletDiscrete = null;
  impactParticles = [];
  ccdStatus.value = 'Ready to fire';
  discreteStatus.value = 'Ready to fire';

  // Position wall half a step away from discrete frame snapshots
  // This guarantees physical tunneling across all window sizes
  const stepDistance = BULLET_SPEED * (1 / 60); // 40px
  const targetX = w * 0.55;
  const n = Math.max(3, Math.round((targetX - BULLET_START_X) / stepDistance - 0.5));
  wallX = BULLET_START_X + (n + 0.5) * stepDistance;

  // Thin barrier in Upper lane (CCD)
  thinWallUpper = new Physics(
    new Vec2(wallX, h * 0.3),
    new Vec2(),
    new Vec2(WALL_THICKNESS, h * 0.32),
    0,
    1,
    0.85,
    'aabb',
    0.0,
    false,
    0x0002,
    0xFFFF,
    0,
    'static'
  );
  scene.addBody(thinWallUpper);

  // Thin barrier in Lower lane (Discrete)
  thinWallLower = new Physics(
    new Vec2(wallX, h * 0.7),
    new Vec2(),
    new Vec2(WALL_THICKNESS, h * 0.32),
    0,
    1,
    0.85,
    'aabb',
    0.0,
    false,
    0x0002,
    0xFFFF,
    0,
    'static'
  );
  scene.addBody(thinWallLower);
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
    resetArena();
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

    // Step physics engine
    scene.step(dt);

    // Track CCD Bullet
    if (bulletCcd) {
      if (bulletCcd.velocity.x < 0 && ccdStatus.value !== 'Impact & Bounced!') {
        ccdStatus.value = 'Impact & Bounced!';
        // Spawn sparks
        for (let i = 0; i < 15; i++) {
          impactParticles.push({
            x: wallX - 2,
            y: h * 0.3 + (Math.random() - 0.5) * 16,
            vx: -150 - Math.random() * 200,
            vy: (Math.random() - 0.5) * 180,
            life: 0.35,
            color: '#38c793',
          });
        }
      }
    }

    // Track Discrete Bullet
    if (bulletDiscrete) {
      if (bulletDiscrete.position.x > wallX + 25) {
        discreteStatus.value = 'Tunneled Through Wall!';
      }
    }

    // Update particles
    for (let i = impactParticles.length - 1; i >= 0; i--) {
      const p = impactParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        impactParticles.splice(i, 1);
      }
    }

    // Render
    ctx.clearRect(0, 0, w, h);

    // Lane divider
    ctx.strokeStyle = isDark ? '#2c2e3b' : '#e4e7eb';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, h * 0.5);
    ctx.lineTo(w - 20, h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lane Labels
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38c793';
    ctx.fillText('LANE 1: WITH CCD (setBullet: true)', 30, h * 0.12);

    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('LANE 2: WITHOUT CCD (Discrete)', 30, h * 0.58);

    // Thin Barrier Walls
    if (thinWallUpper && thinWallLower) {
      ctx.fillStyle = isDark ? '#5c6072' : '#868e96';
      ctx.fillRect(wallX - 2, thinWallUpper.position.y - thinWallUpper.halfSize.y, WALL_THICKNESS, thinWallUpper.halfSize.y * 2);
      ctx.fillRect(wallX - 2, thinWallLower.position.y - thinWallLower.halfSize.y, WALL_THICKNESS, thinWallLower.halfSize.y * 2);

      // Wall Label
      ctx.fillStyle = isDark ? '#adb5bd' : '#6c757d';
      ctx.font = '10px monospace';
      ctx.fillText(`THIN WALL (${WALL_THICKNESS}px)`, wallX - 45, 20);
    }

    // Draw Bullets
    if (bulletCcd) {
      ctx.fillStyle = '#38c793';
      ctx.beginPath();
      ctx.arc(bulletCcd.position.x, bulletCcd.position.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Motion trail
      ctx.strokeStyle = 'rgba(56, 199, 147, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bulletCcd.position.x, bulletCcd.position.y);
      ctx.lineTo(bulletCcd.position.x - Math.sign(bulletCcd.velocity.x) * 20, bulletCcd.position.y);
      ctx.stroke();
    }

    if (bulletDiscrete) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(bulletDiscrete.position.x, bulletDiscrete.position.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Motion trail
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bulletDiscrete.position.x, bulletDiscrete.position.y);
      ctx.lineTo(bulletDiscrete.position.x - 25, bulletDiscrete.position.y);
      ctx.stroke();
    }

    // Draw Particles
    for (const p of impactParticles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
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
          class="bumpr-btn active"
          @click="fireWithCcd"
        >
          🛡️ Fire With CCD
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="fireWithoutCcd"
        >
          💨 Fire Without CCD (Pass Through)
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="fireBoth"
        >
          ⚡ Compare Both
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="resetArena"
        >
          Reset
        </button>
      </div>

      <div class="bumpr-stats">
        <span
          class="bumpr-badge"
          :class="ccdStatus.includes('Impact') ? 'status-active' : 'status-info'"
        >
          CCD: <strong>{{ ccdStatus }}</strong>
        </span>
        <span
          class="bumpr-badge"
          :class="discreteStatus.includes('Tunneled') ? 'status-collision' : 'status-info'"
        >
          Discrete: <strong>{{ discreteStatus }}</strong>
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR continuous collision detection bullet demo"></canvas>

    <figcaption>
      High-speed projectile test against a 4px thin wall. In standard discrete physics, the bullet jumps past the wall in one frame (tunneling). With CCD (<code>isBullet = true</code>), swept Minkowski queries detect Time of Impact and resolve the bounce safely.
    </figcaption>
  </figure>
</template>
