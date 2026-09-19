# CircleVSAabb

Narrow-phase detection between a Circle and an Axis-Aligned Bounding Box (AABB).

`CircleVSAabb` categorizes the circle position relative to the 9 Voronoi regions of the box. For face collisions, it projects along the shallowest axis; for corner diagonal collisions, it performs outward radial projection.

```javascript
import { CircleVSAabb, Vec2 } from '@1pizzateam/bumpr';

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

## CircleVSAabb.diagonalHit()

Classify Voronoi region and evaluate corner diagonal collision.

```typescript
diagonalHit(apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2): boolean
```

### Parameters

- `apos` — `Vec2`. Circle center.
- `radiusA` — `number`. Circle radius.
- `bpos` — `Vec2`. AABB center.
- `bhs` — `Vec2`. AABB half-size vector.

### Returns

`boolean`

---

## CircleVSAabb.setVoronoiRegion()

Determine which Voronoi grid region the circle center occupies relative to the AABB.

```typescript
setVoronoiRegion(bhs: Vec2): void
```

### Parameters

- `bhs` — `Vec2`. AABB half-size vector.

### Returns

`void`

---

## CircleVSAabb.getPenetration()

Compute final penetration vector based on determined projection axis or diagonal normal.

```typescript
getPenetration(radiusA: number): Vec2
```

### Parameters

- `radiusA` — `number`. Circle radius.

### Returns

`Vec2`
