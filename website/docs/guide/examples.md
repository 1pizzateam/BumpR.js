# Examples

Live interactive examples running `@1pizzateam/bumpr` directly in your browser.

## Rigid Body Bouncing Sandbox

A dynamic physics environment simulating circles and boxes bouncing under gravity with boundary reflection and pairwise collision resolution.

<BouncingDemo />

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';

const scene = new Scene();
scene.setGravity(0, 250); // Downward acceleration

// Add dynamic circle
const ball = new Physics('circle', 16, undefined, 100, 50, 1.0);
ball.setVelocity(80, 20);
ball.setRestitution(0.75);
scene.addBody(ball);

// Add dynamic box
const box = new Physics('aabb', 28, 28, 200, 50, 1.0);
box.setVelocity(-60, 10);
box.setRestitution(0.75);
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
import { Physics } from '@1pizzateam/bumpr';

const clay = new Physics('circle', 18, undefined, 50, 50, 1.0);
clay.setRestitution(0.0); // Completely inelastic

const rubber = new Physics('circle', 18, undefined, 100, 50, 1.0);
rubber.setRestitution(0.5); // Moderate bounce

const superball = new Physics('circle', 18, undefined, 150, 50, 1.0);
superball.setRestitution(0.95); // High elasticity
```

---

## Spatial Hash Grid Broad-Phase

For scenes with many bodies, checking every pair ($O(N^2)$) wastes CPU cycles on distant bodies. By attaching a Spock `Grid`, BumpR groups bodies into spatial buckets, culling distant pairs and testing only bodies that share active cells.

<GridBroadphaseDemo />

```javascript
import { Scene, Grid, Vec2 } from '@1pizzateam/bumpr';

const scene = new Scene();

// Create 6x4 spatial hash grid over 600x400 arena
const grid = new Grid(
  new Vec2(0, 0),       // Top-left origin
  new Vec2(600, 400),   // Dimensions
  new Vec2(6, 4)        // Columns and rows
);

// Attach grid to scene for automatic broad-phase culling
scene.setGrid(grid);
```

---

## Narrow-Phase Collision Pairs

BumpR handles three distinct narrow-phase collision pairs:
1. **Circle vs Circle**: Radial distance separation.
2. **Circle vs AABB**: Voronoi region classification with outward corner projection.
3. **AABB vs AABB**: Dual-axis interval overlap with minimum translation axis projection.

<CollisionShapesDemo />

```javascript
import { CollisionDetection, Physics } from '@1pizzateam/bumpr';

const detector = new CollisionDetection();

// Circle colliding against a static box (mass = 0)
const ball = new Physics('circle', 22, undefined, 100, 100, 1.0);
const obstacle = new Physics('aabb', 40, 40, 180, 100, 0.0); // static

// Test returns true if collision occurred and resolved
const collided = detector.test(ball, obstacle);
```
