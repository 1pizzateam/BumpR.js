<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const canvasRef = ref(null);
let scene = null;
let animId = null;
let isRunning = false;
let balls = [];
const tempPos = new Vec2();

function drop() {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const w = rect.width;

  const positions = [w * 0.2, w * 0.5, w * 0.8];
  const restitutions = [0.0, 0.5, 0.95];

  for (let i = 0; i < 3; i++) {
    tempPos.setScalar(positions[i], 40);
    balls[i].setPosition(tempPos);
    balls[i].velocity.origin();
    balls[i].setRestitution(restitutions[i]);
  }
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  scene = new Scene();
  scene.setGravity(new Vec2(0, 400));

  balls = [
    new Physics(new Vec2(50, 40), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.0, 'circle'),
    new Physics(new Vec2(100, 40), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.5, 'circle'),
    new Physics(new Vec2(150, 40), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.95, 'circle'),
  ];

  for (const ball of balls) {
    scene.addBody(ball);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drop();
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
    const floorY = h - 35;

    scene.update(dt);

    // Floor collision for each ball
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      const r = b.body.radius;
      if (b.body.position.y + r >= floorY) {
        tempPos.setScalar(b.body.position.x, floorY - r);
        b.setPosition(tempPos);
        b.velocity.y = -Math.abs(b.velocity.y) * b.restitution;
        if (Math.abs(b.velocity.y) < 10) b.velocity.y = 0;
      }
    }

    ctx.clearRect(0, 0, w, h);

    // Floor line
    ctx.beginPath();
    ctx.moveTo(20, floorY);
    ctx.lineTo(w - 20, floorY);
    ctx.strokeStyle = isDark ? '#4a4d5a' : '#ced4da';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Labels and ball drawing
    const labels = [
      { name: 'Clay (e = 0.0)', color: isDark ? '#868e96' : '#495057' },
      { name: 'Rubber (e = 0.5)', color: '#5b8cff' },
      { name: 'Superball (e = 0.95)', color: '#ff6b6b' },
    ];

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      const pos = b.body.position;
      const r = b.body.radius;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = labels[i].color;
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text label below floor
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = isDark ? '#c1c2c5' : '#495057';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i].name, pos.x, floorY + 22);
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
        <button type="button" class="bumpr-btn active" @click="drop">
          Drop Balls
        </button>
      </div>
    </div>

    <canvas ref="canvasRef" aria-label="BumpR restitution comparison demo"></canvas>

    <figcaption>
      Restitution determines post-collision impulse magnitude. <code>0.0</code> is completely inelastic, while <code>0.95</code> retains nearly all kinetic energy.
    </figcaption>
  </figure>
</template>
