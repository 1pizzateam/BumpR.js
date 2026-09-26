# Examples

Live interactive examples running `@1pizzateam/bumpr` directly in your browser.

## Rigid Body Bouncing Sandbox

A dynamic physics environment simulating circles and boxes bouncing under gravity with boundary reflection, Coulomb friction, and pairwise collision resolution. Boxes have surface friction and settle smoothly into resting contact upon landing or stacking, while circles roll and glide freely.

<BouncingDemo />

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

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

// Loop integration (deterministic fixed-timestep accumulator)
function tick(dt) {
  scene.step(dt);
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
import { Vec2 } from '@1pizzateam/spock';

const clay = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.0, 'circle'); // Completely inelastic
const rubber = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.5, 'circle'); // Moderate bounce
const superball = new Physics(new Vec2(150, 50), new Vec2(), new Vec2(36, 36), 1.0, 1.0, 0.95, 'circle'); // High elasticity
```

---

## Spatial Hash Grid Broad-Phase

For scenes with many bodies, checking every pair ($O(N^2)$) wastes CPU cycles on distant bodies. By attaching a Spock `Grid`, BumpR groups bodies into spatial buckets, culling distant pairs and testing only bodies that share active cells.

<GridBroadphaseDemo />

```javascript
import { Scene } from '@1pizzateam/bumpr';
import { Grid } from '@1pizzateam/spock';

const scene = new Scene();
const grid = new Grid(new Vec2(800, 600), 50); // size, cellSize
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
import { CollisionDetection, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

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

---

## Raycasting & Line of Sight

BumpR provides high-performance ray segment queries for line-of-sight checks, laser weapons, aiming reticles, and visibility testing.

- **`scene.raycast(start, end, options)`**: Returns the closest intersected obstacle, exact impact coordinates, and the geometric surface normal vector.
- **`scene.raycastAll(start, end, options)`**: Penetrates through all intersected obstacles along the segment, returning an array of hits sorted by distance from start.
- **Sensor Filtering (`ignoreSensors: true`)**: Allows rays to pass unimpeded through non-solid ghost trigger zones or detect them as triggers.

<RaycastDemo />

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();

const rayStart = new Vec2(50, 150);
const rayEnd = new Vec2(400, 150);

// 1. Find closest obstacle along ray
const hit = scene.raycast(rayStart, rayEnd, { ignoreSensors: true });
if (hit) {
  console.log('Struck', hit.body.shape, 'at', hit.point, 'normal:', hit.normal);
}

// 2. Multi-hit penetrating raycast through all bodies
const allHits = scene.raycastAll(rayStart, rayEnd);
for (const h of allHits) {
  console.log('Penetrated', h.body.shape, 'at fraction', h.fraction);
}
```

---

## Continuous Collision Detection (CCD)

In standard discrete physics simulation, objects advance by \(\Delta x = v \cdot \Delta t\) each frame. If a projectile moves very fast (e.g., 1800 px/s) or a wall is very thin (e.g., 4px), the projectile's movement per tick can exceed the obstacle's thickness, skipping past it entirely between frames—a problem known as **tunneling**.

BumpR solves this with **Continuous Collision Detection (CCD)**:
- **Bullet Mode (`setBullet(true)`)**: Sweeps the body's geometric volume along its movement vector using Minkowski sum queries.
- **Time of Impact (TOI)**: Calculates the exact fraction $t \in [0, 1]$ of the frame at which contact occurs, advances the body precisely to the impact surface, and resolves the bounce impulse without allowing penetration.

In the interactive demo below, compare a high-speed bullet with CCD enabled (stops and bounces off the 4px barrier) against the same bullet without CCD (passes straight through the barrier):

<CcdDemo />

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();

// 1. High-speed bullet with CCD ENABLED (never tunnels)
const bulletCcd = new Physics(
  new Vec2(50, 100),
  new Vec2(1800, 0), // 1800 px/s projectile
  new Vec2(16, 16),
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
  true // isBullet = true (CCD Enabled)
);
scene.addBody(bulletCcd);

// 2. High-speed bullet WITHOUT CCD (Discrete - tunnels through thin walls)
const bulletDiscrete = new Physics(
  new Vec2(50, 200),
  new Vec2(1800, 0),
  new Vec2(16, 16),
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
  false // isBullet = false (Discrete)
);
scene.addBody(bulletDiscrete);
```

---

## Distance Constraints, Springs & Joints

Link rigid bodies together using physical distance constraints. BumpR includes factory constructors for rigid rods, flexible ropes, and harmonic damped springs:

- **Rods (`createRod`)**: Enforces exact fixed separation distance between two points.
- **Ropes (`createRope`)**: Enforces a maximum distance limit while allowing bodies to move closer freely.
- **Springs (`createSpring`)**: Applies elastic restorative forces with configurable stiffness and velocity damping.

<ConstraintDemo />

```javascript
import { Scene, Physics, DistanceConstraint } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();

// Static anchor post
const anchor = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'circle');
// Dynamic bob
const bob = new Physics(new Vec2(260, 100), new Vec2(), new Vec2(24, 24), 1.0, 0.999, 0.5, 'circle');

scene.addBody(anchor);
scene.addBody(bob);

// Connect with rigid rod of length 80px
const rod = DistanceConstraint.createRod(anchor, bob, 80);
scene.addConstraint(rod);

// Or connect with an elastic harmonic spring (length: 110, stiffness: 0.25, damping: 0.01)
const spring = DistanceConstraint.createSpring(anchor, bob, 110, 0.25, 0.01);
scene.addConstraint(spring);
```

---

## Explicit Body Types & Sensor Triggers

BumpR explicitly distinguishes between three body types (`dynamic`, `static`, and `kinematic`), alongside non-solid **Sensors** for area triggers:

- **Dynamic**: Subject to forces, gravity, damping, and collision reactions.
- **Static**: Immovable infinite-mass obstacles (floors, walls).
- **Kinematic**: Moves along a programmed velocity without being deflected or slowed down by dynamic collisions, pushing dynamic bodies with infinite momentum.
- **Sensors (`isSensor = true`)**: Ghost trigger zones that detect overlaps and dispatch collision events without applying physical bounce impulses.

<BodyTypesDemo />

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();

// Static immovable platform
const wall = new Physics(
  new Vec2(100, 300),
  new Vec2(),
  new Vec2(100, 20),
  0,
  1.0,
  0.4,
  'aabb',
  0.6,
  false,
  0x0002,
  0xFFFF,
  0,
  'static' // Explicit static type
);
scene.addBody(wall);

// Kinematic moving platform
const platform = new Physics(
  new Vec2(260, 340),
  new Vec2(80, 0), // Scripted velocity
  new Vec2(120, 20),
  0,
  1.0,
  0.2,
  'aabb',
  0.8,
  false,
  0x0002,
  0xFFFF,
  0,
  'kinematic' // Explicit kinematic type
);
scene.addBody(platform);

// Sensor Trigger Zone
const triggerZone = new Physics(
  new Vec2(400, 250),
  new Vec2(),
  new Vec2(80, 100),
  0,
  1.0,
  0,
  'aabb',
  0,
  true // isSensor = true
);
scene.addBody(triggerZone);

// Listen to trigger overlaps (bodyA, bodyB)
scene.setOnCollision((bodyA, bodyB) => {
  if (bodyA === triggerZone || bodyB === triggerZone) {
    console.log('Body entered trigger zone!');
  }
});
```

---

## Spatial Queries & Fixed-Timestep Accumulator

Query world geometry efficiently for mouse picking, radial explosions, and marquee selection boxes. Stepping the world via `scene.step(deltaTime)` guarantees deterministic simulation regardless of variable display frame rates.

- **`scene.queryPoint(point)`**: Finds bodies containing a world coordinate.
- **`scene.queryCircle(center, radius)`**: Finds all bodies within a blast or proximity circle.
- **`scene.queryAabb(min, max)`**: Finds all bodies overlapping an axis-aligned bounding box.
- **`scene.step(deltaTime)`**: Consumes elapsed frame time in deterministic chunks of `fixedDeltaTime` with lag spike protection.
- **`scene.getAlpha()`**: Returns visual interpolation factor $\alpha \in [0, 1)$ for butter-smooth rendering on high-refresh monitors.

<SpatialQueriesDemo />

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();
scene.setFixedDeltaTime(1 / 60);

// 1. Mouse hover picking
const hovered = scene.queryPointFirst(mouseWorldPos);

// 2. Radial explosion query (AoE blast)
const hitBodies = scene.queryCircle(explosionOrigin, 120);
for (const body of hitBodies) {
  const dir = new Vec2().subVectors(body.position, explosionOrigin).normalize();
  body.applyImpulseVector(dir.scale(300));
}

// 3. Selection marquee
const selected = scene.queryAabb(dragStartPos, dragEndPos);

// 4. Fixed timestep simulation loop
function tick(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  
  const subSteps = scene.step(dt);
  const alpha = scene.getAlpha(); // use to interpolate render transform
  
  requestAnimationFrame(tick);
}
```

