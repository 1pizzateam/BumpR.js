<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const canvasRef = ref(null);
const multiHitMode = ref(false);
const ignoreSensors = ref(true);
const hitInfo = ref('Aiming laser...');

let scene = null;
let animId = null;
let isRunning = false;
let resizeObserver = null;

const rayOrigin = new Vec2(40, 140);
const rayTarget = new Vec2(500, 140);
const pointerPos = new Vec2();
let isPointerActive = false;

let sensorZone = null;

function toggleMultiHit() {
  multiHitMode.value = !multiHitMode.value;
}

function toggleIgnoreSensors() {
  ignoreSensors.value = !ignoreSensors.value;
}

function setupScene(w = 600, h = 280) {
  if (scene) scene.clear();
  scene = new Scene();
  scene.setGravity(new Vec2(0, 0));

  rayOrigin.setScalar(40, h * 0.5);

  // Obstacles placed across the arena
  const c1 = new Physics(new Vec2(w * 0.35, h * 0.35), new Vec2(), new Vec2(60, 60), 0, 1, 0.8, 'circle');
  const b1 = new Physics(new Vec2(w * 0.42, h * 0.72), new Vec2(), new Vec2(70, 50), 0, 1, 0.8, 'aabb');
  const c2 = new Physics(new Vec2(w * 0.82, h * 0.65), new Vec2(), new Vec2(56, 56), 0, 1, 0.8, 'circle');
  const b2 = new Physics(new Vec2(w * 0.84, h * 0.28), new Vec2(), new Vec2(50, 60), 0, 1, 0.8, 'aabb');

  // Sensor zone in middle (isSensor = true)
  sensorZone = new Physics(
    new Vec2(w * 0.62, h * 0.5),
    new Vec2(),
    new Vec2(60, 130),
    0,
    1,
    0,
    'aabb',
    0,
    true
  );

  scene.addBody(c1);
  scene.addBody(b1);
  scene.addBody(sensorZone);
  scene.addBody(c2);
  scene.addBody(b2);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 280;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setupScene(w, h);
  }

  resize();
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);
  }

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointerPos.setScalar(e.clientX - rect.left, e.clientY - rect.top);
    isPointerActive = true;
  }

  function onPointerLeave() {
    isPointerActive = false;
  }

  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', updatePointer);
  canvas.addEventListener('pointerleave', onPointerLeave);

  let lastTime = performance.now();

  function loop(now) {
    if (!isRunning) return;
    animId = requestAnimationFrame(loop);

    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 280;
    const isDark = document.documentElement.classList.contains('dark');

    // Aiming calculation
    if (isPointerActive) {
      // Aim in direction of pointer, projecting 1500px forward across arena
      const aimDir = new Vec2().subVectors(pointerPos, rayOrigin);
      if (aimDir.getMagnitude(true) > 1) {
        aimDir.normalize();
        rayTarget.copy(rayOrigin).addScaledVector(aimDir, 1500);
      }
    } else {
      // Auto-sweep back and forth across arena (-35° to +35°)
      const angle = Math.sin(now * 0.0015) * 0.62;
      rayTarget.setScalar(rayOrigin.x + Math.cos(angle) * 1500, rayOrigin.y + Math.sin(angle) * 1500);
    }

    ctx.clearRect(0, 0, w, h);

    // Draw background grid
    ctx.strokeStyle = isDark ? '#262830' : '#f0f2f5';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Sensor Zone
    if (sensorZone) {
      const hs = sensorZone.halfSize;
      const x = sensorZone.position.x - hs.x;
      const y = sensorZone.position.y - hs.y;
      ctx.fillStyle = 'rgba(56, 199, 147, 0.12)';
      ctx.fillRect(x, y, hs.x * 2, hs.y * 2);
      ctx.strokeStyle = '#38c793';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, hs.x * 2, hs.y * 2);
      ctx.setLineDash([]);
      ctx.fillStyle = '#38c793';
      ctx.font = '10px monospace';
      ctx.fillText('SENSOR ZONE', x + 4, y + 15);
    }

    // Draw Obstacles
    const obsFill = isDark ? '#2e303d' : '#e9ecef';
    const obsStroke = isDark ? '#495057' : '#adb5bd';
    if (scene) {
      for (let i = 0; i < scene.bodiesLength; i++) {
        const b = scene.bodies[i];
        if (b === sensorZone) continue;
        ctx.save();
        ctx.fillStyle = obsFill;
        ctx.strokeStyle = obsStroke;
        ctx.lineWidth = 2;
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

    if (!scene) return;

    // Perform Raycast
    const options = { ignoreSensors: ignoreSensors.value };

    if (multiHitMode.value) {
      // RaycastAll: casts through all intersected bodies
      const hits = scene.raycastAll(rayOrigin, rayTarget, options);

      // Draw full ray line
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rayOrigin.x, rayOrigin.y);
      ctx.lineTo(rayTarget.x, rayTarget.y);
      ctx.strokeStyle = '#5b8cff';
      ctx.stroke();

      if (hits.length > 0) {
        hitInfo.value = `Hit ${hits.length} bodies in sight`;
        for (const hit of hits) {
          // Hit dot
          ctx.fillStyle = '#ff6b6b';
          ctx.beginPath();
          ctx.arc(hit.point.x, hit.point.y, 5, 0, Math.PI * 2);
          ctx.fill();

          // Normal vector (gold)
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hit.point.x, hit.point.y);
          ctx.lineTo(hit.point.x + hit.normal.x * 24, hit.point.y + hit.normal.y * 24);
          ctx.stroke();
        }
      } else {
        hitInfo.value = 'Clear Line of Sight (0 Hits)';
      }
    } else {
      // Single nearest hit: scene.raycast
      const hit = scene.raycast(rayOrigin, rayTarget, options);

      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rayOrigin.x, rayOrigin.y);

      if (hit) {
        ctx.lineTo(hit.point.x, hit.point.y);
        ctx.strokeStyle = '#ff6b6b';
        ctx.stroke();

        // Hit point glow
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(hit.point.x, hit.point.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Normal vector (blue)
        ctx.strokeStyle = '#5b8cff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hit.point.x, hit.point.y);
        ctx.lineTo(hit.point.x + hit.normal.x * 28, hit.point.y + hit.normal.y * 28);
        ctx.stroke();

        // Reflected bounce line (orange dashed)
        const rayDir = new Vec2().subVectors(rayTarget, rayOrigin).normalize();
        const reflect = new Vec2().reflectVector(rayDir, hit.normal).scale(70);

        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(hit.point.x, hit.point.y);
        ctx.lineTo(hit.point.x + reflect.x, hit.point.y + reflect.y);
        ctx.stroke();
        ctx.setLineDash([]);

        hitInfo.value = `Hit ${hit.body.shape.toUpperCase()} at (${Math.round(hit.point.x)}, ${Math.round(hit.point.y)})`;
      } else {
        ctx.lineTo(rayTarget.x, rayTarget.y);
        ctx.strokeStyle = isDark ? '#495057' : '#adb5bd';
        ctx.stroke();
        hitInfo.value = 'Clear Line of Sight (Miss)';
      }
    }

    // Laser Turret Origin (left)
    ctx.fillStyle = isDark ? '#495057' : '#ced4da';
    ctx.beginPath();
    ctx.arc(rayOrigin.x, rayOrigin.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(rayOrigin.x, rayOrigin.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  isRunning = true;
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);

  onUnmounted(() => {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (resizeObserver) resizeObserver.disconnect();
    canvas.removeEventListener('pointermove', updatePointer);
    canvas.removeEventListener('pointerdown', updatePointer);
    canvas.removeEventListener('pointerleave', onPointerLeave);
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
          :class="{ active: !multiHitMode }"
          @click="toggleMultiHit"
        >
          Mode: {{ multiHitMode ? 'All Hits (raycastAll)' : 'First Hit (raycast)' }}
        </button>
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: ignoreSensors }"
          @click="toggleIgnoreSensors"
        >
          Sensors: {{ ignoreSensors ? 'Ignored' : 'Detected' }}
        </button>
      </div>

      <div class="bumpr-stats">
        <span
          class="bumpr-badge"
          :class="hitInfo.includes('Hit') ? 'status-active' : 'status-info'"
        >
          {{ hitInfo }}
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR raycasting and line of sight demo"></canvas>

    <figcaption>
      Move or click the pointer to aim the laser (or watch the auto-sweep). <code>scene.raycast()</code> detects the closest surface impact, computing the normal vector (blue) and reflection ray (dashed orange). Toggling <strong>Sensors: Detected</strong> includes non-solid trigger zones in ray intersection tests.
    </figcaption>
  </figure>
</template>
