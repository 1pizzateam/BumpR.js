<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Physics, Scene } from '@1pizzateam/bumpr';
import { Grid, Vec2 } from '@1pizzateam/spock';
import { Player } from '@1pizzateam/loopr';

const canvasRef = ref(null);
const isRunning = ref(true);
const gravityEnabled = ref(true);
const bodyCount = ref(0);
const collisionCount = ref(0);
const fpsDisplay = ref(60);

let scene = null;
let grid = null;
let player = null;
let resizeObserver = null;
let visibilityObserver = null;
let width = 0;
let height = 0;
let respawnTimer = 0;

// Angled resting floor geometry
const floorAngle = 9.5 * (Math.PI / 180); // ~9.5 degrees incline
const floorCos = Math.cos(floorAngle);
const floorSin = Math.sin(floorAngle);
const floorTangent = { x: floorCos, y: floorSin };   // Tangent pointing downward-right
const floorNormal = { x: floorSin, y: -floorCos };   // Normal pointing upward into the arena
const floorThickness = 24;

let floorCenter = { x: 0, y: 0 };
let floorLength = 0;
let floorP1 = { x: 0, y: 0 };
let floorP2 = { x: 0, y: 0 };

// Dynamic color palette for hundreds of small balls
const BALL_PALETTE = [
  '#ff6b6b', // Coral
  '#ff9f43', // Warm orange
  '#ffd166', // Golden yellow
  '#06d6a0', // Mint
  '#118ab2', // Ocean blue
  '#38c793', // Emerald green
  '#5b8cff', // Bright blue
  '#70a1ff', // Sky blue
  '#a55eea', // Violet
  '#ff78c4', // Bubblegum pink
  '#f78fb3', // Pastel rose
  '#4ecdc4', // Turquoise
  '#eccc68', // Cream gold
  '#ff4757', // Ruby red
  '#9c88ff', // Lavender
  '#2ed573', // Lime green
];

// Impact spark particles
const sparks = [];
const MAX_SPARKS = 50;
const SPARK_COLORS = ['#ff6b6b', '#ff9f43', '#ffd166', '#ffffff', '#38c793', '#5b8cff', '#ff78c4'];
let sparksSpawnedThisFrame = 0;
let internalBounces = 0;
let lastHudUpdate = 0;

// Click & explosion ripples
const ripples = [];

function spawnScaledSparks(x, y, speed, normalX = 0, normalY = -1, customColor = null) {
  // Speed threshold below which no sparkles are generated (eliminates sparkles at rest)
  const minSpeed = 48;
  const maxSpeed = 340;
  if (speed <= minSpeed) return;
  if (sparksSpawnedThisFrame >= 12) return;

  const intensity = Math.min(1, Math.max(0, (speed - minSpeed) / (maxSpeed - minSpeed)));
  // Sparkle count: 1 on gentle bumps, up to 3 on hard impacts
  const count = Math.min(3, Math.max(1, Math.round(intensity * 3)));
  sparksSpawnedThisFrame += count;

  for (let i = 0; i < count; i++) {
    if (sparks.length >= MAX_SPARKS) sparks.shift();

    let angle;
    if (normalX !== 0 || normalY !== 0) {
      const baseAngle = Math.atan2(normalY, normalX);
      angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.85;
    } else {
      angle = Math.random() * Math.PI * 2;
    }

    const sparkSpeed = (30 + intensity * 120) * (0.6 + Math.random() * 0.8);
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * sparkSpeed,
      vy: Math.sin(angle) * sparkSpeed,
      size: (1.2 + intensity * 1.8) * (0.7 + Math.random() * 0.6),
      life: 1.0,
      maxLife: 0.16 + intensity * 0.25,
      color: customColor || SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    });
  }
}

function spawnExplosion(count = 45) {
  if (!scene || width === 0) return;
  const originX = width / 2;
  const originY = 30;

  // Visual shockwave ripple at top center
  ripples.push({
    x: originX,
    y: originY,
    radius: 3,
    maxRadius: 42,
    life: 1.0,
  });

  // Soft burst sparks
  spawnScaledSparks(originX, originY, 85, 0, 1);

  // Spawn controlled burst of colorful balls with balanced physical bounce
  for (let i = 0; i < count; i++) {
    const r = 4.5 + Math.random() * 3.5;
    // Downward cone spread (~48° to 132°)
    const angle = Math.PI * (0.27 + Math.random() * 0.46);
    // Controlled, pleasing velocity: 30 to 85 px/s
    const speed = 30 + Math.random() * 55;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    // Wider spatial jitter so balls disperse naturally without excessive overlap
    const posX = originX + (Math.random() - 0.5) * 72;
    const posY = originY + (Math.random() - 0.5) * 20;

    const b = new Physics(
      new Vec2(posX, posY),
      new Vec2(vx, vy),
      new Vec2(r * 2, r * 2),
      1.0,
      0.98,
      0.82 + Math.random() * 0.06,
      'circle'
    );
    b.color = BALL_PALETTE[i % BALL_PALETTE.length];
    scene.addBody(b);
  }

  bodyCount.value = scene.bodiesLength;
}

function updateFloorGeometry() {
  floorLength = Math.min(width - 64, 840);
  floorCenter = {
    x: width / 2,
    y: height - 105,
  };
  const halfL = floorLength / 2;
  floorP1 = {
    x: floorCenter.x - halfL * floorCos,
    y: floorCenter.y - halfL * floorSin,
  };
  floorP2 = {
    x: floorCenter.x + halfL * floorCos,
    y: floorCenter.y + halfL * floorSin,
  };
}

function testAngledFloor(b, dt = 0.016) {
  const pos = b.position;
  const r = b.body.radius;

  // Vector from P1 to body center
  const vx = pos.x - floorP1.x;
  const vy = pos.y - floorP1.y;

  // Tangent projection along surface (s = 0 at P1, s = floorLength at P2)
  const s = vx * floorTangent.x + vy * floorTangent.y;
  // Normal projection (signed distance above surface line, positive is above)
  const d = vx * floorNormal.x + vy * floorNormal.y;

  // 1. Top flat surface collision (strictly within the red line segment [0, floorLength])
  if (s >= 0 && s <= floorLength) {
    if (d <= r && d >= -floorThickness * 0.7) {
      const pen = r - d;
      pos.x += floorNormal.x * pen;
      pos.y += floorNormal.y * pen;
      b.setPosition(pos);

      // Solid floor support: cancel any downward impulse directed into the floor
      // This prevents resting/rolling balls from rocketing upward when struck by falling balls
      if (!b.impulse.isOrigin()) {
        const inormal = b.impulse.x * floorNormal.x + b.impulse.y * floorNormal.y;
        if (inormal < 0) {
          b.impulse.x -= inormal * floorNormal.x;
          b.impulse.y -= inormal * floorNormal.y;
        }
      }

      const vn = b.velocity.x * floorNormal.x + b.velocity.y * floorNormal.y;
      const vt = b.velocity.x * floorTangent.x + b.velocity.y * floorTangent.y;

      if (vn < 0) {
        let reboundSpeed = -vn * 0.82;
        const newVt = vt * 0.995; // light rolling friction so balls keep rolling smoothly

        // Settle into resting contact
        const restingThreshold = Math.max(1.5 * 400 * dt, 8);
        if (reboundSpeed < restingThreshold) {
          reboundSpeed = 0;
        }

        b.velocity.x = newVt * floorTangent.x + reboundSpeed * floorNormal.x;
        b.velocity.y = newVt * floorTangent.y + reboundSpeed * floorNormal.y;

        if (reboundSpeed > 40) {
          internalBounces++;
          const contactX = floorP1.x + s * floorTangent.x;
          const contactY = floorP1.y + s * floorTangent.y;
          spawnScaledSparks(contactX, contactY, reboundSpeed, floorNormal.x, floorNormal.y, b.color);
        }
      }
    }
    return;
  }

  // 2. Off the right corner P2 (rounding the edge or launching off into free-fall)
  if (s > floorLength && s < floorLength + r) {
    const cx = pos.x - floorP2.x;
    const cy = pos.y - floorP2.y;
    const distSq = cx * cx + cy * cy;
    if (distSq < r * r && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = cx / dist;
      const ny = cy / dist;
      const pen = r - dist;

      pos.x += nx * pen;
      pos.y += ny * pen;
      b.setPosition(pos);

      const vn = b.velocity.x * nx + b.velocity.y * ny;
      if (vn < 0) {
        const reboundSpeed = -vn * b.restitution;
        b.velocity.x += nx * (reboundSpeed - vn);
        b.velocity.y += ny * (reboundSpeed - vn);

        if (reboundSpeed > 40) {
          internalBounces++;
          spawnScaledSparks(floorP2.x, floorP2.y, reboundSpeed, nx, ny, b.color);
        }
      }
    }
    return;
  }

  // 3. Off the left corner P1
  if (s < 0 && s > -r) {
    const cx = pos.x - floorP1.x;
    const cy = pos.y - floorP1.y;
    const distSq = cx * cx + cy * cy;
    if (distSq < r * r && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = cx / dist;
      const ny = cy / dist;
      const pen = r - dist;

      pos.x += nx * pen;
      pos.y += ny * pen;
      b.setPosition(pos);

      const vn = b.velocity.x * nx + b.velocity.y * ny;
      if (vn < 0) {
        const reboundSpeed = -vn * b.restitution;
        b.velocity.x += nx * (reboundSpeed - vn);
        b.velocity.y += ny * (reboundSpeed - vn);

        if (reboundSpeed > 40) {
          internalBounces++;
          spawnScaledSparks(floorP1.x, floorP1.y, reboundSpeed, nx, ny, b.color);
        }
      }
    }
  }
}

function setupScene() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;

  updateFloorGeometry();

  scene = new Scene();
  scene.setGravity(new Vec2(0, gravityEnabled.value ? 400 : 0));

  // Attach spatial hash grid for high-performance broad-phase culling
  const cellSize = Math.max(30, Math.floor(width / 18));
  grid = new Grid(width, height, cellSize);
  scene.setGrid(grid);

  // Clear transient particles
  sparks.length = 0;
  ripples.length = 0;
  internalBounces = 0;
  collisionCount.value = 0;

  // Trigger gentle burst of colorful balls from top center
  spawnExplosion();
  bodyCount.value = scene.bodiesLength;
}

function toggleGravity() {
  gravityEnabled.value = !gravityEnabled.value;
  if (scene) {
    scene.setGravity(new Vec2(0, gravityEnabled.value ? 400 : 0));
  }
}

function addBurst(count = 15) {
  if (!scene) return;
  spawnExplosion(count);
}

function togglePlay() {
  if (!player) return;
  isRunning.value = player.toggle();
}

function resetSimulation() {
  internalBounces = 0;
  collisionCount.value = 0;
  setupScene();
  if (player && !isRunning.value) {
    isRunning.value = player.toggle();
  }
}

function handleCanvasClick(event) {
  if (!canvasRef.value || !scene) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  // Add click ripple
  ripples.push({
    x: clickX,
    y: clickY,
    radius: 4,
    maxRadius: 55,
    life: 1.0,
  });

  // Spawn a cluster of 8 colorful small balls radiating outward
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = 60 + Math.random() * 140;
    const r = 4.5 + Math.random() * 3;
    const body = new Physics(
      new Vec2(clickX, clickY),
      new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
      new Vec2(r * 2, r * 2),
      1.0,
      0.98,
      0.84,
      'circle'
    );
    body.color = BALL_PALETTE[Math.floor(Math.random() * BALL_PALETTE.length)];
    scene.addBody(body);
  }

  bodyCount.value = scene.bodiesLength;
  spawnScaledSparks(clickX, clickY, 160, 0, 0);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let bgCanvas = null;
  let bgIsDark = null;

  function updateBackground(isDark) {
    if (!bgCanvas) {
      bgCanvas = document.createElement('canvas');
    }
    const dpr = window.devicePixelRatio || 1;
    bgCanvas.width = Math.round(width * dpr);
    bgCanvas.height = Math.round(height * dpr);
    const bctx = bgCanvas.getContext('2d');
    if (!bctx) return;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const surfaceColor = isDark ? '#1b1b1f' : '#ffffff';
    const gridDotColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const arenaBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';

    // Fill surface
    bctx.fillStyle = surfaceColor;
    bctx.fillRect(0, 0, width, height);

    // Pre-rendered grid dots in a single subpath batch
    bctx.fillStyle = gridDotColor;
    bctx.beginPath();
    const spacing = 36;
    for (let gx = 18; gx < width; gx += spacing) {
      for (let gy = 18; gy < height; gy += spacing) {
        bctx.moveTo(gx + 1.2, gy);
        bctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      }
    }
    bctx.fill();

    // Outer arena outline: Left, Top, and Right walls (open at bottom)
    bctx.strokeStyle = arenaBorderColor;
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.moveTo(16, height);
    bctx.lineTo(16, 16);
    bctx.lineTo(width - 16, 16);
    bctx.lineTo(width - 16, height);
    bctx.stroke();

    bgIsDark = isDark;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    updateFloorGeometry();

    // Invalidate cached background
    bgCanvas = null;
    bgIsDark = null;

    // Refresh grid size
    if (scene) {
      const cellSize = Math.max(30, Math.floor(width / 18));
      grid = new Grid(width, height, cellSize);
      scene.setGrid(grid);
    }
  }

  setupScene();
  resize();

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  // Step physics and render on every frame using LoopR Player
  player = new Player((delta) => {
    const dt = Math.min(delta, 0.05);
    sparksSpawnedThisFrame = 0;

    // 1. Step simulation (with LoopR + BumpR)
    scene.update(dt);
    scene.test();

    // 2. Enforce arena bounds, angled floor collision, and bottom disappearance
    for (let i = scene.bodiesLength - 1; i >= 0; i--) {
      const b = scene.bodies[i];
      if (!b) continue;

      const pos = b.position;
      const r = b.body.radius;

      // Disappear when reaching the bottom of the screen (bottom is open, not a floor)
      if (pos.y - r > height) {
        scene.removeBody(b);
        continue;
      }

      // Left wall
      if (pos.x - r < 16) {
        pos.x = 16 + r;
        if (b.impulse.x < 0) b.impulse.x = 0;
        const reboundSpeed = Math.abs(b.velocity.x) * b.restitution;
        b.velocity.x = reboundSpeed;
        if (reboundSpeed > 40) {
          internalBounces++;
          spawnScaledSparks(16, pos.y, reboundSpeed, 1, 0, b.color);
        }
      }
      // Right wall
      else if (pos.x + r > width - 16) {
        pos.x = width - 16 - r;
        if (b.impulse.x > 0) b.impulse.x = 0;
        const reboundSpeed = Math.abs(b.velocity.x) * b.restitution;
        b.velocity.x = -reboundSpeed;
        if (reboundSpeed > 40) {
          internalBounces++;
          spawnScaledSparks(width - 16, pos.y, reboundSpeed, -1, 0, b.color);
        }
      }

      // Ceiling
      if (pos.y - r < 16) {
        pos.y = 16 + r;
        if (b.impulse.y < 0) b.impulse.y = 0;
        const reboundSpeed = Math.abs(b.velocity.y) * b.restitution;
        b.velocity.y = reboundSpeed;
        if (reboundSpeed > 40) {
          internalBounces++;
          spawnScaledSparks(pos.x, 16, reboundSpeed, 0, 1, b.color);
        }
      }

      // Angled resting floor collision
      testAngledFloor(b, dt);

      // Check if body collided via BumpR narrow-phase (applyDamage returns > 0 on hit)
      const damage = b.applyDamage();
      if (damage) {
        const speed = Math.hypot(b.velocity.x, b.velocity.y);
        if (speed > 48) {
          internalBounces++;
          spawnScaledSparks(pos.x, pos.y, speed, 0, -1, b.color);
        }
      }

      // Smooth maximum velocity cap to prevent unnatural acceleration spikes
      const currentSpeed = Math.hypot(b.velocity.x, b.velocity.y);
      const maxSpeed = 600;
      if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed;
        b.velocity.x *= factor;
        b.velocity.y *= factor;
      }
    }

    // When all balls have fallen off the bottom, automatically trigger a new explosion
    if (scene.bodiesLength === 0) {
      respawnTimer += dt;
      if (respawnTimer > 1.2) {
        respawnTimer = 0;
        spawnExplosion();
      }
    } else {
      respawnTimer = 0;
    }

    // Throttle Vue reactive HUD updates to ~8Hz to prevent DOM layout thrashing during physics
    const now = performance.now();
    if (now - lastHudUpdate > 120) {
      lastHudUpdate = now;
      fpsDisplay.value = Math.round(player.getFPS());
      collisionCount.value = internalBounces;
      bodyCount.value = scene.bodiesLength;
    }

    // 3. Render cached background, grid dots, and arena outline in a single fast blit
    const isDark = document.documentElement.classList.contains('dark');
    if (!bgCanvas || bgIsDark !== isDark) {
      updateBackground(isDark);
    }
    ctx.drawImage(bgCanvas, 0, 0, width, height);

    // 4. Render angled floor platform (zero shadowBlur for buttery smooth 60fps)
    ctx.save();
    ctx.translate(floorCenter.x, floorCenter.y);
    ctx.rotate(floorAngle);

    const fw = floorLength;
    const fh = floorThickness;
    const fx = -fw / 2;
    const fy = 0; // top impact surface at local y = 0

    // Platform body gradient
    const floorGrad = ctx.createLinearGradient(0, 0, 0, fh);
    floorGrad.addColorStop(0, isDark ? '#2e303d' : '#e9ecef');
    floorGrad.addColorStop(1, isDark ? '#1a1b23' : '#ced4da');

    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(fx, fy, fw, fh, [0, 0, 8, 8]);
      ctx.fill();
    } else {
      ctx.fillRect(fx, fy, fw, fh);
    }

    // Glowing top impact surface: hardware-accelerated dual-stroke neon aura
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.25)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.stroke();

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.stroke();

    // Grip marks along the angled floor
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let mx = fx + 24; mx < fx + fw - 12; mx += 28) {
      ctx.beginPath();
      ctx.moveTo(mx, fy + 6);
      ctx.lineTo(mx + 8, fy + fh - 6);
      ctx.stroke();
    }

    ctx.restore();

    // 5. Render bodies
    for (let i = 0; i < scene.bodiesLength; i++) {
      const b = scene.bodies[i];
      const pos = b.position;
      const r = b.body.radius;
      const color = b.color || '#ff6b6b';

      // Fast high-quality spherical bead drawing
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(pos.x - r * 0.32, pos.y - r * 0.32, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Update & render impact spark particles with additive blending (blazing fast, zero shadowBlur)
    if (sparks.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let s = sparks.length - 1; s >= 0; s--) {
        const sp = sparks[s];
        sp.life -= dt / sp.maxLife;
        if (sp.life <= 0) {
          sparks.splice(s, 1);
          continue;
        }
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;

        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Update & render ripples
    for (let r = ripples.length - 1; r >= 0; r--) {
      const rp = ripples[r];
      rp.life -= dt * 2.2;
      rp.radius += (rp.maxRadius - rp.radius) * dt * 8;
      if (rp.life <= 0) {
        ripples.splice(r, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, rp.life) * 0.55;
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });

  player.capFPS(60);
  player.start();

  visibilityObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (isRunning.value) player.start();
    } else {
      player.pause();
    }
  });
  visibilityObserver.observe(canvas);
});

onBeforeUnmount(() => {
  if (player) player.stop();
  if (resizeObserver) resizeObserver.disconnect();
  if (visibilityObserver) visibilityObserver.disconnect();
  if (scene) scene.clear();
});
</script>

<template>
  <section class="bumpr-section">
    <div class="bumpr-heading">
      <div>
        <p class="bumpr-eyebrow">Built with BumpR.js</p>
        <h2>Rigid body physics demo</h2>
        <p>
          A 2D simulation powered by BumpR's impulse resolution and collision detection, stepped with LoopR.
        </p>
      </div>
      <div class="bumpr-actions">
        <!-- Gravity Toggle -->
        <button
          type="button"
          class="bumpr-pill-btn"
          :class="{ active: gravityEnabled }"
          :aria-pressed="gravityEnabled"
          @click="toggleGravity"
        >
          Gravity: {{ gravityEnabled ? 'ON' : 'OFF' }}
        </button>

        <!-- Burst -->
        <button
          type="button"
          class="bumpr-pill-btn"
          @click="addBurst(30)"
        >
          + Burst
        </button>

        <!-- Play / Pause -->
        <button
          type="button"
          class="bumpr-circle-btn"
          :aria-label="isRunning ? 'Pause physics loop' : 'Resume physics loop'"
          :title="isRunning ? 'Pause' : 'Play'"
          @click="togglePlay"
        >
          <svg
            v-if="isRunning"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>

        <!-- Restart -->
        <button
          type="button"
          class="bumpr-circle-btn"
          aria-label="Reset simulation"
          title="Reset"
          @click="resetSimulation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      </div>
    </div>

    <div class="bumpr-canvas">
      <canvas
        ref="canvasRef"
        aria-label="Interactive 2D physics simulation showing bouncing bodies"
        @click="handleCanvasClick"
      ></canvas>

      <!-- FPS, bodies and bounces info placed at top right -->
      <div class="bumpr-stats">
        <span>{{ fpsDisplay }} FPS</span>
        <span>Bodies: {{ bodyCount }}</span>
        <span>Bounces: {{ collisionCount }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bumpr-section {
  max-width: 1152px;
  margin: 72px auto 0;
  padding: 0 24px 8px;
}

.bumpr-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 20px;
}

.bumpr-heading h2 {
  margin: 4px 0 8px;
  border: 0;
  font-size: 28px;
  line-height: 1.25;
}

.bumpr-heading p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.bumpr-heading .bumpr-eyebrow {
  color: var(--vp-c-brand-1, #ff6b6b);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bumpr-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.bumpr-pill-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.bumpr-pill-btn:hover:not(.active) {
  color: var(--vp-c-brand-1, #ff6b6b);
  border-color: var(--vp-c-brand-1, #ff6b6b);
  background: var(--vp-c-bg-mute);
}

.bumpr-pill-btn.active {
  background: var(--vp-c-brand-1, #ff6b6b);
  border-color: var(--vp-c-brand-1, #ff6b6b);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.35);
}

.bumpr-circle-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 0;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.bumpr-circle-btn:hover {
  border-color: var(--vp-c-brand-1, #ff6b6b);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-brand-1, #ff6b6b);
}

.bumpr-circle-btn:focus-visible,
.bumpr-pill-btn:focus-visible {
  outline: 2px solid var(--vp-c-brand-1, #ff6b6b);
  outline-offset: 2px;
}

.bumpr-canvas {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  cursor: crosshair;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* Height increased for spacious viewing */
.bumpr-canvas canvas {
  display: block;
  width: 100%;
  height: 480px;
}

/* Placed on top right of the canvas */
.bumpr-stats {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
  color: var(--vp-c-text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  pointer-events: none;
  backdrop-filter: blur(8px);
  z-index: 2;
}

@media (max-width: 640px) {
  .bumpr-section {
    margin-top: 48px;
  }

  .bumpr-heading {
    align-items: start;
    gap: 16px;
  }

  .bumpr-actions {
    width: 100%;
    justify-content: space-between;
  }

  .bumpr-canvas canvas {
    height: 380px;
  }

  .bumpr-stats {
    top: 8px;
    right: 8px;
    font-size: 11px;
    gap: 8px;
    padding: 4px 8px;
  }
}
</style>
