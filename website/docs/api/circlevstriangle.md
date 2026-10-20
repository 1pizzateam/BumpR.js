# CircleVSTriangle

Narrow-phase detection between a Circle and an Axis-Aligned RightTriangle.

`CircleVSTriangle` delegates closest-point and signed hypotenuse distance queries to `RightTriangle` from `@1pizzateam/spock` and computes the outward minimum translation vector.

```javascript
import { RightTriangle, Vec2 } from '@1pizzateam/spock';
import { CollisionDetection, Physics } from '@1pizzateam/bumpr';

const circle = new Physics(new Vec2(36, 36), new Vec2(), new Vec2(28, 28), 1, 1, 0, 'circle');
const tri = new Physics(new Vec2(32, 32), new Vec2(), new Vec2(64, 64), 0, 1, 0, 'triangle-nw');

CollisionDetection.test(circle, tri);
```

---

## CircleVSTriangle.detect()

Test collision and compute outward penetration vector pushing Circle A out of RightTriangle B.

```typescript
detect(circlePos: Vec2, radius: number, tri: RightTriangle): Vec2
```

### Parameters

- `circlePos` — `Vec2`. Circle center.
- `radius` — `number`. Circle radius.
- `tri` — `RightTriangle`. RightTriangle collider.

### Returns

`Vec2` — Outward penetration vector (origin vector if no collision).
