# Overview

**BumpR.js** is a fast, lightweight 2D rigid body physics and collision detection library written in TypeScript. It is designed for HTML5 games, interactive user interfaces, visual simulations, and particle systems.

## Highlights

- **Linear Dynamics**: Accurate simulation of velocity, acceleration, gravity, damping, and instantaneous impulses.
- **Versatile Shapes**: Narrow-phase detection between Circles (`Circ`) and Axis-Aligned Bounding Boxes (`Rect`).
- **Corner Voronoi Handling**: Diagonal hits against rectangular corners project outwards along true radial normals rather than sticking or catching.
- **Elastic Impulses & Friction**: Realistic bounce calculations taking into account both bodies' restitution coefficients and inverse mass ratios, accompanied by a 2D Coulomb tangential friction solver that prevents unnatural sliding.
- **Resting Contact Stabilization & Sleeping**: Thresholded contact resolution eliminates micro-bouncing jitter; idle bodies automatically enter sleep state to save CPU.
- **Explicit Body Types**: First-class support for `dynamic`, `static` (immovable), and `kinematic` (scripted velocity pushing dynamic bodies with infinite momentum) bodies.
- **Continuous Collision Detection (CCD)**: Bullet mode with swept Minkowski queries prevents fast-moving projectiles from tunneling through thin obstacles.
- **Distance Constraints & Joints**: Connect bodies with rigid rods (`createRod`), flexible ropes (`createRope`), or harmonic damped springs (`createSpring`).
- **Deterministic Fixed-Timestep Accumulator**: `scene.step(deltaTime)` decouples simulation time from render frame rates, offering alpha interpolation (`getAlpha()`) for smooth rendering on high-refresh monitors.
- **Raycasting & Spatial Queries**: Line-of-sight raycasting (`scene.raycast`), point containment (`scene.queryPoint`), and area queries (`scene.queryCircle`, `scene.queryAabb`).
- **Collision Filtering & Sensors**: 16-bit category/mask bitfields, group indices, and non-solid sensor trigger zones.
- **Spatial Hash Acceleration**: Native integration with `@1pizzateam/spock`'s `Grid` reduces pairwise checks from $O(N^2)$ to $O(\text{activeCells})$.
- **Zero Allocations in Hot Paths**: Collision detection vectors and intermediate math structures are reused across iterations to eliminate garbage collection pauses.

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                                Scene                                   │
│  - Rigid bodies & constraints management                               │
│  - Deterministic fixed-timestep accumulator (scene.step)               │
│  - Spatial hash grid broad-phase, raycasting, & spatial queries        │
│  - TOI sub-stepping for Continuous Collision Detection (CCD)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼──────────────────────────┐
        ▼                           ▼                          ▼
┌───────────────┐          ┌─────────────────┐        ┌──────────────────┐
│    Physics    │          │ CollisionDetect │        │ DistanceConstrain│
│ - Body types  │─────────▶│ - Broadphase    │◀───────│ - Rods / Ropes   │
│ - Mass/Force  │          │ - Narrowphase   │        │ - Damped Springs │
│ - Velocity/CCD│          │ - Impulse solver│        │ - Gauss-Seidel   │
└───────────────┘          └─────────────────┘        └──────────────────┘
```

## Quick Start

```js
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';
import { Player } from '@1pizzateam/loopr';

// 1. Create a scene
const scene = new Scene();
scene.setGravity(new Vec2(0, 300));

// 2. Create dynamic and static bodies
const ball = new Physics(
  new Vec2(100, 20),
  new Vec2(40, 0),
  new Vec2(32, 32),
  1.0,
  1.0,
  0.8,
  'circle'
);
scene.addBody(ball);

const obstacle = new Physics(
  new Vec2(100, 200),
  new Vec2(0, 0),
  new Vec2(120, 20),
  0.0, // static obstacle
  1.0,
  0.5,
  'aabb'
);
scene.addBody(obstacle);

// 3. Step the world on every frame with LoopR (fixed-timestep accumulator)
const player = new Player((delta) => {
  scene.step(delta);
});
player.start();
```

## Next Steps

- Follow the [Installation Guide](/guide/installation) to install BumpR.js in your project.
- Explore [Interactive Examples](/guide/examples) with real-time browser simulations.
- Browse the full [API Reference](/api/) for class definitions and methods.
