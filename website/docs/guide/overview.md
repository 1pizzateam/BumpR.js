# Overview

**BumpR.js** is a fast, lightweight 2D rigid body physics and collision detection library written in TypeScript. It is designed for HTML5 games, interactive user interfaces, visual simulations, and particle systems.

## Highlights

- **Linear Dynamics**: Accurate simulation of velocity, acceleration, gravity, damping, and instantaneous impulses.
- **Versatile Shapes**: Narrow-phase detection between Circles (`Circ`) and Axis-Aligned Bounding Boxes (`Rect`).
- **Corner Voronoi Handling**: Diagonal hits against rectangular corners project outwards along true radial normals rather than sticking or catching.
- **Elastic Impulses**: Realistic bounce calculations taking into account both bodies' restitution coefficients and inverse mass ratios.
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
import { Scene, Physics } from '@1pizzateam/bumpr';

// 1. Create a scene
const scene = new Scene();
scene.setGravity(0, 300);

// 2. Create dynamic and static bodies
const ball = new Physics('circle', 16, undefined, 100, 20, 1.0);
ball.setVelocity(40, 0);
ball.setRestitution(0.8);
scene.addBody(ball);

const obstacle = new Physics('aabb', 120, 20, 100, 200, 0.0); // static
scene.addBody(obstacle);

// 3. Step the world on every frame
function onFrame(deltaSeconds) {
  scene.update(deltaSeconds);
  scene.test();
}
```

## Next Steps

- Follow the [Installation Guide](/guide/installation) to install BumpR.js in your project.
- Explore [Interactive Examples](/guide/examples) with real-time browser simulations.
- Browse the full [API Reference](/api/) for class definitions and methods.
