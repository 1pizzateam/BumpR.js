# CircleVSAabb

Narrow-phase detection between a Circle and an Axis-Aligned Bounding Box (AABB).

`CircleVSAabb` computes the closest clamped point on the AABB to the circle center. For external collisions (faces and corners), it projects outward radially; for internal penetration, it projects along the shallowest axis.

```javascript
import { CircleVSAabb } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const circlePos = new Vec2(50, 40);
const circleRadius = 15;
const boxPos = new Vec2(70, 40);
const boxHalfSize = new Vec2(20, 20);

const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);
```

---

## CircleVSAabb.detect()

Test collision and compute penetration between Circle A and AABB B.

```typescript
detect(apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2): Vec2
```

### Parameters

- `apos` — `Vec2`. Circle center.
- `radiusA` — `number`. Circle radius.
- `bpos` — `Vec2`. AABB center.
- `bhs` — `Vec2`. AABB half-size vector (half-width, half-height).

### Returns

`Vec2` — Penetration vector.
