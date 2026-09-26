<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics, DistanceConstraint } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const canvasRef = ref(null);
const activePreset = ref('pendulum'); // 'pendulum' | 'spring' | 'bridge'
const gravityEnabled = ref(true);

let scene = null;
let animId = null;
let isRunning = false;

let draggedBody = null;
const dragOffset = new Vec2();
const pointerPos = new Vec2();

function setPreset(preset) {
  activePreset.value = preset;
  setupScene();
}

function toggleGravity() {
  gravityEnabled.value = !gravityEnabled.value;
  if (scene) {
    scene.setGravity(new Vec2(0, gravityEnabled.value ? 400 : 0));
  }
}

function setupScene() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  if (scene) scene.clear();
  scene = new Scene();
  scene.setGravity(new Vec2(0, gravityEnabled.value ? 400 : 0));

  if (activePreset.value === 'pendulum') {
    // Static anchor at top center
    const anchor = new Physics(new Vec2(w * 0.5, 40), new Vec2(), new Vec2(16, 16), 0, 1, 0.5, 'circle');
    const bob1 = new Physics(new Vec2(w * 0.5 + 60, 60), new Vec2(), new Vec2(24, 24), 1.0, 0.999, 0.5, 'circle');
    const bob2 = new Physics(new Vec2(w * 0.5 + 120, 80), new Vec2(), new Vec2(24, 24), 1.0, 0.999, 0.5, 'circle');
    const bob3 = new Physics(new Vec2(w * 0.5 + 180, 100), new Vec2(), new Vec2(24, 24), 1.0, 0.999, 0.5, 'circle');

    scene.addBody(anchor);
    scene.addBody(bob1);
    scene.addBody(bob2);
    scene.addBody(bob3);

    scene.addConstraint(DistanceConstraint.createRod(anchor, bob1, 70));
    scene.addConstraint(DistanceConstraint.createRod(bob1, bob2, 70));
    scene.addConstraint(DistanceConstraint.createRod(bob2, bob3, 70));
  } else if (activePreset.value === 'spring') {
    // Spring preset: Anchor and a bouncy damped harmonic spring
    const anchor = new Physics(new Vec2(w * 0.5, 45), new Vec2(), new Vec2(20, 20), 0, 1, 0.5, 'circle');
    // Start displaced: stretched down to y=200 for visible initial bounce
    const mass = new Physics(new Vec2(w * 0.5 + 20, 200), new Vec2(), new Vec2(36, 36), 1.0, 0.995, 0.5, 'aabb');

    scene.addBody(anchor);
    scene.addBody(mass);

    // Spring with rest length 110, stiffness 0.25, and steady decay damping 0.025
    const spring = DistanceConstraint.createSpring(anchor, mass, 110, 0.25, 0.025);
    scene.addConstraint(spring);
  } else {
    // Bridge / Chain preset: Series of nodes between two static anchors
    const nodeCount = 7;
    const startX = w * 0.15;
    const endX = w * 0.85;
    const y = h * 0.4;
    const stepX = (endX - startX) / (nodeCount - 1);

    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const isAnchor = i === 0 || i === nodeCount - 1;
      const body = new Physics(
        new Vec2(startX + i * stepX, y),
        new Vec2(),
        new Vec2(18, 18),
        isAnchor ? 0 : 1.0,
        0.98,
        0.5,
        'circle'
      );
      scene.addBody(body);
      nodes.push(body);
    }

    for (let i = 0; i < nodeCount - 1; i++) {
      const dist = stepX * 1.05;
      scene.addConstraint(DistanceConstraint.createRod(nodes[i], nodes[i + 1], dist));
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
    setupScene();
  }

  resize();
  window.addEventListener('resize', resize);

  function getPointerCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return new Vec2(e.clientX - rect.left, e.clientY - rect.top);
  }

  function onPointerDown(e) {
    const pos = getPointerCanvasPos(e);
    pointerPos.copy(pos);

    // Find dynamic body under pointer
    const hit = scene.queryPointFirst(pos);
    if (hit && hit.isDynamic()) {
      draggedBody = hit;
      dragOffset.subVectors(hit.position, pos);
    }
  }

  function onPointerMove(e) {
    const pos = getPointerCanvasPos(e);
    pointerPos.copy(pos);
    if (draggedBody) {
      draggedBody.setPosition(new Vec2().addVectors(pos, dragOffset));
      draggedBody.velocity.origin();
    }
  }

  function onPointerUp() {
    draggedBody = null;
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

    // Step physics with fixed timestep accumulator
    scene.step(dt);

    // Render
    ctx.clearRect(0, 0, w, h);

    // Draw constraints (rods/springs/ropes)
    const constraints = scene.getConstraints();
    for (const c of constraints) {
      if (c.stiffness < 1) {
        // Realistic coil spring rendering
        const x1 = c.bodyA.position.x;
        const y1 = c.bodyA.position.y;
        const x2 = c.bodyB.position.x;
        const y2 = c.bodyB.position.y;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
          const ux = dx / dist;
          const uy = dy / dist;
          const px = -uy;
          const py = ux;
          const coils = 10;
          const coilWidth = 10;
          const leadIn = 16;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + ux * leadIn, y1 + uy * leadIn);

          const coilDist = Math.max(0, dist - leadIn * 2);
          const step = coilDist / coils;

          for (let i = 1; i <= coils; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const cx = x1 + ux * (leadIn + (i - 0.5) * step) + px * side * coilWidth;
            const cy = y1 + uy * (leadIn + (i - 0.5) * step) + py * side * coilWidth;
            ctx.lineTo(cx, cy);
          }

          ctx.lineTo(x2 - ux * leadIn, y2 - uy * leadIn);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = '#ff9f43';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      } else {
        // Rigid rod rendering: solid steel blue line
        ctx.beginPath();
        ctx.moveTo(c.bodyA.position.x, c.bodyA.position.y);
        ctx.lineTo(c.bodyB.position.x, c.bodyB.position.y);
        ctx.strokeStyle = isDark ? '#5b8cff' : '#3b71ca';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    // Draw bodies
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      const isStatic = b.isStatic();
      const fill = isStatic
        ? (isDark ? '#495057' : '#ced4da')
        : (isDark ? '#2b2c3a' : '#ffffff');
      const stroke = isStatic ? '#868e96' : '#ff6b6b';

      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;

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
          :class="{ active: activePreset === 'pendulum' }"
          @click="setPreset('pendulum')"
        >
          Triple Pendulum
        </button>
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: activePreset === 'spring' }"
          @click="setPreset('spring')"
        >
          Harmonic Spring
        </button>
        <button
          type="button"
          class="bumpr-btn"
          :class="{ active: activePreset === 'bridge' }"
          @click="setPreset('bridge')"
        >
          Suspension Chain
        </button>
      </div>

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
          @click="setupScene"
          title="Reset and release the simulation"
        >
          🔄 Reset
        </button>
      </div>

      <div class="bumpr-stats">
        <span class="bumpr-badge status-info">
          {{ activePreset === 'spring' ? 'Drag & Release mass or click Reset' : 'Click & Drag any node' }}
        </span>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR distance constraints and joints demo"></canvas>

    <figcaption>
      Distance constraints and elastic springs solved via projected Gauss-Seidel relaxation. Supports rigid rods (<code>createRod</code>), ropes (<code>createRope</code>), and damped springs (<code>createSpring</code>).
    </figcaption>
  </figure>
</template>
