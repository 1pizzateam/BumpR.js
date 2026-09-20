# API Overview

All public APIs are named ESM exports from `@1pizzateam/bumpr`. Geometric and mathematical primitives are imported directly from [`@1pizzateam/spock`](https://1pizzateam.github.io/Spock.js/). There is no default export and no namespace object, so you import exactly what you need and modern bundlers tree-shake the rest.

```javascript
import {
  Scene,
  Physics,
  CollisionDetection,
  Shape
} from '@1pizzateam/bumpr';
import {
  Circ,
  Rect,
  Grid,
  Vec2
} from '@1pizzateam/spock';
```

## Module Groups

### Core Simulation
- [Scene](/api/scene): Spatial world manager holding bodies, controlling gravity, stepping integration, and testing collisions.
- [Physics](/api/physics): Rigid body physics instance handling linear momentum, impulse, velocity damping, restitution, and Spock geometric shapes.
- [CollisionDetection](/api/collision): Narrow-phase dispatch, contact normal computation, positional de-penetration, and elastic collision response solver.

### Narrow-Phase Collisions
- [Circle vs Circle](/api/circlevscircle): Fast Euclidean radial distance detection and penetration extraction.
- [Circle vs AABB](/api/circlevsaabb): Voronoi region classification with outward diagonal corner projection.
- [AABB vs AABB](/api/aabbvsaabb): Dual-axis interval overlap with minimum translation axis projection.

### Primitives from Spock.js
BumpR is built on top of mathematical and spatial primitives from [`@1pizzateam/spock`](https://1pizzateam.github.io/Spock.js/):
- `Vec2`: 2D vector mathematics with chained operations.
- `Grid`: Spatial hash grid partitioning space for $O(\text{activeCells})$ broad-phase culling.
- `Circ`: Circle geometry shape (`position`, `radius`, `gridCells`).
- `Rect`: Axis-aligned rectangle shape (`position`, `size`, `halfSize`, `corners`, `gridCells`).
- `Utils`: Numeric utility functions including `clamp`.
