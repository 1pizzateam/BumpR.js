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
      text: Live Examples
      link: /guide/examples
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon: ⚡
    title: Rigid Body Dynamics
    details: Linear momentum, gravity, mass ratios, impulse response, velocity damping, and restitution.
  - icon: 🎯
    title: Precise Narrow-Phase
    details: Exact collision detection for Circle vs Circle, Circle vs AABB (with Voronoi corners), and AABB vs AABB.
  - icon: 🌐
    title: Spatial Hash Broad-Phase
    details: Built-in integration with Spock Grid, accelerating collision queries down to active spatial cells.
  - icon: 🍕
    title: Zero Extra Dependencies
    details: Tightly integrated with the 1 Pizza Team ecosystem, re-exporting Vec2, Grid, Circ, Rect, and Utils.
---

```js
import { Scene, Physics, Grid, Vec2 } from '@1pizzateam/bumpr';

// Create simulation world
const scene = new Scene();
scene.setGravity(0, 400); // 400 px/s² downward

// Dynamic circle (radius = 18, mass = 1.0, restitution = 0.8)
const ball = new Physics('circle', 18, undefined, 150, 50, 1.0);
ball.setVelocity(60, 0);
ball.setRestitution(0.8);
scene.addBody(ball);

// Immovable static floor (width = 600, height = 30, mass = 0)
const floor = new Physics('aabb', 600, 30, 300, 400, 0);
scene.addBody(floor);

// Advance physics in your animation or render loop
function tick(deltaSeconds) {
  scene.update(deltaSeconds);
  scene.test();
}
```
