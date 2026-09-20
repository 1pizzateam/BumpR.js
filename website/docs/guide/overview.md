# Overview

**BumpR.js** is a fast, lightweight 2D rigid body physics and collision detection library written in TypeScript. It is designed for HTML5 games, interactive user interfaces, visual simulations, and particle systems.

## Highlights

- **Linear Dynamics**: Accurate simulation of velocity, acceleration, gravity, damping, and instantaneous impulses.
- **Versatile Shapes**: Narrow-phase detection between Circles (`Circ`) and Axis-Aligned Bounding Boxes (`Rect`).
- **Corner Voronoi Handling**: Diagonal hits against rectangular corners project outwards along true radial normals rather than sticking or catching.
- **Elastic Impulses & Friction**: Realistic bounce calculations taking into account both bodies' restitution coefficients and inverse mass ratios, accompanied by a 2D Coulomb tangential friction solver that prevents unnatural sliding.
- **Resting Contact Stabilization**: Thresholded contact resolution eliminates micro-bouncing jitter for stable stacks and resting bodies.
- **Static Obstacles**: Bodies with mass `0` behave as immovable infinite-mass obstacles (floors, walls, platforms).
- **Spatial Hash Acceleration**: Native integration with `@1pizzateam/spock`'s `Grid` reduces pairwise checks from $O(N^2)$ to $O(\text{activeCells})$.
- **Zero Allocations in Hot Paths**: Collision detection vectors and intermediate math structures are reused across iterations to eliminate garbage collection pauses.

## Architecture

The simulation pipeline consists of three core components:

```
┌────────────────────────────────────────────────────────┐
│                        Scene                           │
│  - Holds rigid bodies                                  │
│  - Propagates gravity                                  │
│  - Coordinates Spatial Hash Grid broad-phase           │
└──────────────────────────┬─────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
┌───────────────────────┐     ┌────────────────────────┐
│        Physics        │     │  CollisionDetection    │
│  - Position & Velocity│     │  - Broadphase test     │
│  - Mass & Damping     │────▶│  - Narrowphase detect  │
│  - Impulse integration│     │  - Positional resolve  │
│  - Geometric shape    │     │  - Impulse computation │
└───────────────────────┘     └────────────────────────┘
```

## Quick Start

```js
import { Scene, Physics, Vec2 } from '@1pizzateam/bumpr';
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

// 3. Step the world on every frame with LoopR
const player = new Player((delta) => {
  scene.update(delta);
  scene.test();
});
player.start();
```

## Next Steps

- Follow the [Installation Guide](/guide/installation) to install BumpR.js in your project.
- Explore [Interactive Examples](/guide/examples) with real-time browser simulations.
- Browse the full [API Reference](/api/) for class definitions and methods.
