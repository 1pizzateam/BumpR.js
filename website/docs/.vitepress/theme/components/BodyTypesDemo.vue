<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const canvasRef = ref(null);
const sensorTriggerCount = ref(0);
const sensorActive = ref(false);

let scene = null;
let animId = null;
let isRunning = false;

let kinematicPlatform = null;
let staticLedge = null;
let sensorZone = null;
const currentSensorOverlaps = new Set();
let prevSensorOverlaps = new Set();

function spawnCrate() {
  if (!scene || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = 50 + Math.random() * (rect.width - 100);
  const y = 30 + Math.random() * 40;
  const size = 26 + Math.random() * 8;

  const crate = new Physics(
    new Vec2(x, y),
    new Vec2((Math.random() - 0.5) * 50, 0),
    new Vec2(size, size),
    1.0,
    0.98,
    0.4,
    'aabb',
    0.6,
    false,
    0x0001, // Category: Dynamic Object
    0xFFFF,
    0,
    'dynamic'
  );
  scene.addBody(crate);
}

function spawnSphere() {
  if (!scene || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = 50 + Math.random() * (rect.width - 100);
  const y = 30 + Math.random() * 40;
  const r = 14 + Math.random() * 4;

  const sphere = new Physics(
    new Vec2(x, y),
    new Vec2((Math.random() - 0.5) * 60, 0),
    new Vec2(r * 2, r * 2),
    1.0,
    0.99,
    0.7,
    'circle',
    0.1,
    false,
    0x0001,
    0xFFFF,
    0,
    'dynamic'
  );
  scene.addBody(sphere);
}

function spawnInSensor() {
  if (!scene || !canvasRef.value || !sensorZone) return;
  const x = sensorZone.position.x + (Math.random() - 0.5) * 20;
  const r = 14;
  const sphere = new Physics(
    new Vec2(x, 30),
    new Vec2(0, 40),
    new Vec2(r * 2, r * 2),
    1.0,
    0.99,
    0.7,
    'circle',
    0.1,
    false,
    0x0001,
    0xFFFF,
    0,
    'dynamic'
  );
  scene.addBody(sphere);
}

function resetScene() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  sensorTriggerCount.value = 0;
  sensorActive.value = false;

  if (scene) scene.clear();
  scene = new Scene();
  scene.setGravity(new Vec2(0, 350));

  // Static floor & boundaries
  const floor = new Physics(new Vec2(w * 0.5, h - 15), new Vec2(), new Vec2(w - 20, 30), 0, 1, 0.4, 'aabb', 0.6, false, 0x0002, 0xFFFF, 0, 'static');
  const leftWall = new Physics(new Vec2(10, h * 0.5), new Vec2(), new Vec2(20, h), 0, 1, 0.4, 'aabb', 0.6, false, 0x0002, 0xFFFF, 0, 'static');
  const rightWall = new Physics(new Vec2(w - 10, h * 0.5), new Vec2(), new Vec2(20, h), 0, 1, 0.4, 'aabb', 0.6, false, 0x0002, 0xFFFF, 0, 'static');

  scene.addBody(floor);
  scene.addBody(leftWall);
  scene.addBody(rightWall);

  // Static immovable platform
  staticLedge = new Physics(
    new Vec2(w * 0.22, h - 140),
    new Vec2(),
    new Vec2(100, 20),
    0,
    1.0,
    0.3,
    'aabb',
    0.6,
    false,
    0x0002,
    0xFFFF,
    0,
    'static'
  );
  scene.addBody(staticLedge);

  // Kinematic moving platform (oscillates left-right)
  kinematicPlatform = new Physics(
    new Vec2(w * 0.45, h - 85),
    new Vec2(90, 0),
    new Vec2(120, 20),
    0, // Mass 0 for kinematic
    1.0,
    0.3,
    'aabb',
    0.8,
    false,
    0x0002,
    0xFFFF,
    0,
    'kinematic'
  );
  scene.addBody(kinematicPlatform);

  // Sensor Trigger Zone on the right (ghost portal)
  sensorZone = new Physics(
    new Vec2(w * 0.78, h - 100),
    new Vec2(),
    new Vec2(60, 140),
    0,
    1.0,
    0,
    'aabb',
    0,
    true, // isSensor = true
    0x0004,
    0xFFFF,
    0,
    'static'
  );
  scene.addBody(sensorZone);

  // Listen for sensor trigger events (bodyA, bodyB)
  currentSensorOverlaps.clear();
  prevSensorOverlaps.clear();
  scene.setOnCollision((bodyA, bodyB) => {
    if (bodyA === sensorZone) {
      currentSensorOverlaps.add(bodyB);
    } else if (bodyB === sensorZone) {
      currentSensorOverlaps.add(bodyA);
    }
  });

  // Add initial dynamic objects
  for (let i = 0; i < 3; i++) {
    spawnCrate();
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
    resetScene();
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

    // Oscillate kinematic platform between bounds
    if (kinematicPlatform) {
      if (kinematicPlatform.position.x > w * 0.65) {
        kinematicPlatform.setVelocity(new Vec2(-90, 0));
      } else if (kinematicPlatform.position.x < w * 0.25) {
        kinematicPlatform.setVelocity(new Vec2(90, 0));
      }
    }

    // Step physics & evaluate sensor triggers
    currentSensorOverlaps.clear();
    scene.step(dt);

    for (const b of currentSensorOverlaps) {
      if (!prevSensorOverlaps.has(b)) {
        sensorTriggerCount.value++;
      }
    }
    prevSensorOverlaps = new Set(currentSensorOverlaps);
    sensorActive.value = currentSensorOverlaps.size > 0;

    // Render
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Sensor Zone (Ghost Trigger)
    if (sensorZone) {
      const hs = sensorZone.halfSize;
      const x = sensorZone.position.x - hs.x;
      const y = sensorZone.position.y - hs.y;
      const activeColor = sensorActive.value ? 'rgba(56, 199, 147, 0.45)' : 'rgba(56, 199, 147, 0.15)';
      ctx.fillStyle = activeColor;
      ctx.fillRect(x, y, hs.x * 2, hs.y * 2);

      ctx.strokeStyle = '#38c793';
      ctx.lineWidth = sensorActive.value ? 2.5 : 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, hs.x * 2, hs.y * 2);
      ctx.setLineDash([]);

      ctx.fillStyle = '#38c793';
      ctx.font = '11px monospace';
      ctx.fillText('STATIC SENSOR', x + 5, y + 20);
    }

    // 2. Draw Kinematic Platform
    if (kinematicPlatform) {
      const hs = kinematicPlatform.halfSize;
      ctx.fillStyle = isDark ? '#264653' : '#2a9d8f';
      ctx.strokeStyle = '#2a9d8f';
      ctx.lineWidth = 2;
      ctx.fillRect(kinematicPlatform.position.x - hs.x, kinematicPlatform.position.y - hs.y, hs.x * 2, hs.y * 2);
      ctx.strokeRect(kinematicPlatform.position.x - hs.x, kinematicPlatform.position.y - hs.y, hs.x * 2, hs.y * 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText('KINEMATIC', kinematicPlatform.position.x - 28, kinematicPlatform.position.y + 4);
    }

    // 2b. Draw Static Ledge
    if (staticLedge) {
      const hs = staticLedge.halfSize;
      ctx.fillStyle = isDark ? '#495057' : '#ced4da';
      ctx.strokeStyle = isDark ? '#6c757d' : '#adb5bd';
      ctx.lineWidth = 2;
      ctx.fillRect(staticLedge.position.x - hs.x, staticLedge.position.y - hs.y, hs.x * 2, hs.y * 2);
      ctx.strokeRect(staticLedge.position.x - hs.x, staticLedge.position.y - hs.y, hs.x * 2, hs.y * 2);

      ctx.fillStyle = isDark ? '#f8f9fa' : '#212529';
      ctx.font = '10px monospace';
      ctx.fillText('STATIC', staticLedge.position.x - 18, staticLedge.position.y + 4);
    }

    // 3. Draw All other bodies
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      if (b === sensorZone || b === kinematicPlatform || b === staticLedge) continue;

      ctx.save();
      if (b.isStatic()) {
        ctx.fillStyle = isDark ? '#343a40' : '#dee2e6';
        ctx.strokeStyle = isDark ? '#495057' : '#ced4da';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = isDark ? '#3a2e39' : '#fff0f3';
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
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
  }

  let draggedBody = null;
  const dragOffset = new Vec2();

  function getPointerCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return new Vec2(clientX - rect.left, clientY - rect.top);
  }

  function onPointerDown(e) {
    const pos = getPointerCanvasPos(e);
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      if (b.isDynamic() && b.containsPoint(pos)) {
        draggedBody = b;
        dragOffset.subVectors(b.position, pos);
        b.velocity.origin();
        break;
      }
    }
  }

  function onPointerMove(e) {
    if (draggedBody) {
      const pos = getPointerCanvasPos(e);
      draggedBody.setPosition(new Vec2().copy(pos).add(dragOffset));
      draggedBody.velocity.origin();
    }
  }

  function onPointerUp() {
    draggedBody = null;
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  isRunning = true;
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);

  onUnmounted(() => {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('mousedown', onPointerDown);
    canvas.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    canvas.removeEventListener('touchstart', onPointerDown);
    canvas.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
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
          @click="spawnCrate"
        >
          + Dynamic Box
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="spawnSphere"
        >
          + Dynamic Sphere
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="spawnInSensor"
        >
          + Drop in Sensor
        </button>
        <button
          type="button"
          class="bumpr-btn"
          @click="resetScene"
        >
          Reset Arena
        </button>
      </div>

      <div class="bumpr-stats">
        <span
          class="bumpr-badge"
          :class="sensorActive ? 'status-active' : 'status-info'"
        >
          Sensor Triggers: <strong>{{ sensorTriggerCount }}</strong>
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR body types and sensor demo"></canvas>

    <figcaption>
      Explicit body types: <strong>Static</strong> (grey obstacle & boundaries) are immovable, <strong>Kinematic</strong> (teal platform) moves with scripted velocity without deflection, and <strong>Dynamic</strong> bodies bounce under gravity. <strong>Static Sensor</strong> (dashed green) detects overlaps without collision impulses.
    </figcaption>
  </figure>
</template>
