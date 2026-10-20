# AabbVSTriangle

Narrow-phase SAT detection between an Axis-Aligned Bounding Box (AABB) and a RightTriangle.

`AabbVSTriangle` tests separating axes along X, Y, and `tri.hypNormal` using `Vec2` operations and returns the minimum translation vector.

```javascript
import { Vec2 } from '@1pizzateam/spock';
import { CollisionDetection, Physics } from '@1pizzateam/bumpr';

const box = new Physics(new Vec2(36, 36), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'aabb');
const tri = new Physics(new Vec2(32, 32), new Vec2(), new Vec2(64, 64), 0, 1, 0, 'triangle-nw');

CollisionDetection.test(box, tri);
```

---

## AabbVSTriangle.detect()

Test collision and compute minimum translation penetration vector pushing AABB A out of RightTriangle B.

```typescript
detect(aabbPos: Vec2, aabbHalfSize: Vec2, tri: RightTriangle): Vec2
```

### Parameters

- `aabbPos` — `Vec2`. Center of AABB.
- `aabbHalfSize` — `Vec2`. Half-size of AABB.
- `tri` — `RightTriangle`. RightTriangle collider.

### Returns

`Vec2` — Minimum translation penetration vector (origin vector if no collision).
