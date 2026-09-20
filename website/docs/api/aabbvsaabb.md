# AabbVSAabb

Narrow-phase detection between two Axis-Aligned Bounding Boxes (AABB vs AABB).

`AabbVSAabb` computes overlapping intervals along the horizontal and vertical axes, checks for positive overlap, and returns the minimum translation vector along the shallowest axis.

```javascript
import { AabbVSAabb } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const posA = new Vec2(40, 40);
const halfSizeA = new Vec2(20, 20);
const posB = new Vec2(60, 40);
const halfSizeB = new Vec2(20, 20);

const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);
```

---

## AabbVSAabb.detect()

Test collision and compute penetration between AABB A and AABB B.

```typescript
detect(apos: Vec2, ahs : Vec2, bpos: Vec2, bhs : Vec2): Vec2
```

### Parameters

- `apos` — `Vec2`. Center of box A.
- `ahs` — `Vec2`. Half-size of box A.
- `bpos` — `Vec2`. Center of box B.
- `bhs` — `Vec2`. Half-size of box B.

### Returns

`Vec2` — Minimum translation penetration vector.

---

## AabbVSAabb.getPenetration()

Isolate shallowest projection axis and negate direction if necessary.

```typescript
getPenetration(): Vec2
```

### Returns

`Vec2`
