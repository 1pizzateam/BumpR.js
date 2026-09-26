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

---

## CircleVSAabb.getPenetration()

Compute penetration vector from distance to closest clamped point or internal shallowest axis overlap.

```typescript
getPenetration(radiusA: number, delta: Vec2, distSq: number = 0, bhs?: Vec2): Vec2
```

### Parameters

- `radiusA` — `number`. Circle radius.
- `dx` — `number`. Delta X from clamped point (or relative X if inside).
- `dy` — `number`. Delta Y from clamped point (or relative Y if inside).
- `distSq` — `number` (optional, default `0`). Squared distance to clamped point.
- `bhs` — `Vec2` (optional). AABB half-size vector for internal overlap resolution.

### Returns

`Vec2` — Outward penetration vector.

### Example

```javascript
const pen = CircleVSAabb.getPenetration(15, 3, 4, 25);
```
