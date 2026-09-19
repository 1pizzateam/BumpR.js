# CircleVSCircle

Narrow-phase detection and penetration calculation between two circles.

`CircleVSCircle` calculates Euclidean separation between circle centers, detects radial overlaps, handles concentric zero-distance edge cases, and returns outward penetration vectors.

```javascript
import { CircleVSCircle, Vec2 } from '@1pizzateam/bumpr';

const posA = new Vec2(100, 100);
const posB = new Vec2(120, 100);

const penetration = CircleVSCircle.detect(posA, 15, posB, 15);
console.log(penetration.isOrigin()); // false (colliding, 10px overlap)
```

---

## CircleVSCircle.detect()

Test collision and compute penetration between two circles.

```typescript
detect(apos: Vec2, radiusA: number, bpos: Vec2, radiusB: number): Vec2
```

### Parameters

- `apos` — `Vec2`. Center position of Circle A.
- `radiusA` — `number`. Radius of Circle A.
- `bpos` — `Vec2`. Center position of Circle B.
- `radiusB` — `number`. Radius of Circle B.

### Returns

`Vec2` — Outward penetration vector (origin vector if no collision).

---

## CircleVSCircle.getPenetration()

Calculate normalized penetration vector from squared distance and combined radii.

```typescript
getPenetration(rr: number, dSq: number): Vec2
```

### Parameters

- `rr` — `number`. Sum of circle radii (`radiusA + radiusB`).
- `dSq` — `number`. Squared distance between centers.

### Returns

`Vec2` — Penetration vector.
