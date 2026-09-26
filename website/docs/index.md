---
layout: home

hero:
  name: BumpR.js
  text: 2D Physics & Collisions
  tagline: A lightweight 2D rigid body physics and collision detection engine in TypeScript for games and simulations.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/overview
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon: ⚡
    title: Rigid Body Dynamics
    details: Linear momentum, gravity, mass ratios, impulse response, surface friction, velocity damping, and restitution.
  - icon: 🎯
    title: Precise Narrow-Phase
    details: Exact collision detection for Circle vs Circle, Circle vs AABB (with Voronoi corners), and AABB vs AABB.
  - icon: 🛡️
    title: Continuous Collision Detection
    details: Bullet mode with swept Minkowski queries prevents high-speed projectiles from tunneling through thin colliders.
  - icon: 🔗
    title: Constraints & Springs
    details: Connect bodies with rigid rods, flexible ropes, and harmonic damped springs using projected Gauss-Seidel relaxation.
  - icon: 🏗️
    title: Body Types & Sensors
    details: Explicit dynamic, static, and kinematic bodies alongside non-solid sensor trigger zones with category filtering.
  - icon: ⏱️
    title: Fixed-Timestep Accumulator
    details: Deterministic sub-stepping with spiral-of-death clamping and alpha interpolation for high-refresh monitors.
  - icon: 🔦
    title: Raycasting & Spatial Queries
    details: Line-of-sight raycasts, point containment checks, and radial/bounding-box spatial queries for interactive games.
  - icon: 🌐
    title: Spatial Hash Broad-Phase
    details: Built-in integration with Spock Grid, accelerating collision queries down to active spatial cells.
---

<PhysicsDemo />

```js
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Grid, Vec2 } from '@1pizzateam/spock';
import { Player } from '@1pizzateam/loopr';

// 1. Initialize simulation world with downward gravity
const scene = new Scene();
scene.setGravity(new Vec2(0, 400)); // 400 px/s² downward

// 2. Attach spatial hash Grid for broad-phase culling (efficient for 50+ bodies)
const grid = new Grid(new Vec2(800, 480), 40);
scene.setGrid(grid);

// 3. Helper to spawn lively, bouncy balls with tuned physics properties
function spawnBall(x, y, vx, vy, radius = 12) {
  const mass = 1.0;          // Uniform mass ensures balanced, symmetric momentum transfer
  const damping = 0.99;      // Minimal air resistance preserves kinetic energy
  const restitution = 0.85;  // High elasticity for springy, responsive bounces
  const friction = 0.0;      // Zero tangential friction for smooth rolling

  const ball = new Physics(
    new Vec2(x, y),
    new Vec2(vx, vy),
    new Vec2(radius * 2, radius * 2),
    mass,
    damping,
    restitution,
    'circle',
    friction
  );
  scene.addBody(ball);
  return ball;
}

// Spawn a burst of balls from top center with moderate spread
for (let i = 0; i < 30; i++) {
  const angle = Math.random() * Math.PI; // Downward hemisphere spread
  const speed = 40 + Math.random() * 60;
  spawnBall(
    400 + (Math.random() - 0.5) * 60, 40,
    Math.cos(angle) * speed, Math.sin(angle) * speed,
    10 + Math.random() * 6
  );
}

// 4. Drive physics loop on every animation frame with LoopR
const player = new Player((delta) => {
  const dt = Math.min(delta, 0.05);

  // Advance integration & resolve pairwise collisions
  scene.update(dt);
  scene.test();

  // Detect collision impacts for particle sparks or audio triggers
  for (let i = 0; i < scene.bodiesLength; i++) {
    const body = scene.bodies[i];
    if (body.applyDamage()) {
      // Trigger visual sparks, ripples, or hit audio
    }
  }
});
player.start();
```
