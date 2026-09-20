# Examples

Live interactive examples running `@1pizzateam/bumpr` directly in your browser.

## Rigid Body Bouncing Sandbox

A dynamic physics environment simulating circles and boxes bouncing under gravity with boundary reflection, Coulomb friction, and pairwise collision resolution. Boxes have surface friction and settle smoothly into resting contact upon landing or stacking, while circles roll and glide freely.

<BouncingDemo />

```javascript
import { Scene, Physics, Vec2 } from '@1pizzateam/bumpr';

const scene = new Scene();
scene.setGravity(new Vec2(0, 250)); // Downward acceleration

// Add dynamic circle
const ball = new Physics(
  new Vec2(100, 50),
  new Vec2(80, 20),
  new Vec2(32, 32),
  1.0,
  1.0,
  0.75,
  'circle'
);
scene.addBody(ball);

// Add dynamic box
const box = new Physics(
  new Vec2(200, 50),
  new Vec2(-60, 10),
  new Vec2(28, 28),
  1.0,
  1.0,
  0.75,
  'aabb'
);
scene.addBody(box);

// Loop integration
function tick(dt) {
  scene.update(dt);
  scene.test();
}
```

---

## Restitution & Collision Impulses

The coefficient of restitution ($e \in [0.0, 1.0]$) governs the elasticity of collisions. Compare three bodies dropped from identical heights:
- $e = 0.0$: Inelastic (no bounce, energy completely dissipated).
- $e = 0.5$: Moderate elasticity (rubber ball).
- $e = 0.95$: Highly elastic (superball).

<RestitutionDemo />

```javascript
import { Physics, Vec2 } from '@1pizzateam/bumpr';

const clay = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.0, 'circle'); // Completely inelastic
const rubber = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.5, 'circle'); // Moderate bounce
const superball = new Physics(new Vec2(150, 50), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.95, 'circle'); // High elasticity
```

---

## Spatial Hash Grid Broad-Phase

For scenes with many bodies, checking every pair ($O(N^2)$) wastes CPU cycles on distant bodies. By attaching a Spock `Grid`, BumpR groups bodies into spatial buckets, culling distant pairs and testing only bodies that share active cells.

<GridBroadphaseDemo />

```javascript
import { Scene, Grid } from '@1pizzateam/bumpr';

const scene = new Scene();
const grid = new Grid(800, 600, 50); // width, height, cellSize
scene.setGrid(grid);
```

---

## Collision Detection Modes

BumpR handles three distinct narrow-phase collision pairs:
1. **Circle vs Circle**: Radial distance separation.
2. **Circle vs AABB**: Voronoi region classification with outward corner projection.
3. **AABB vs AABB**: Dual-axis interval overlap with minimum translation axis projection.

<CollisionShapesDemo />

```javascript
import { CollisionDetection, Physics, Vec2 } from '@1pizzateam/bumpr';

// Circle colliding against a static box (mass = 0)
const ball = new Physics(
  new Vec2(100, 100),
  new Vec2(50, 0),
  new Vec2(44, 44),
  1.0,
  1.0,
  0.8,
  'circle'
);
const obstacle = new Physics(
  new Vec2(180, 100),
  new Vec2(0, 0),
  new Vec2(40, 40),
  0.0, // static
  1.0,
  0.8,
  'aabb'
);

// Test returns true if collision occurred and resolved
const collided = CollisionDetection.test(ball, obstacle);
```
