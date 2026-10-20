# Raycast

Linear segment raycasting and analytical swept continuous collision detection (CCD).

`Raycast` provides analytical ray vs circle intersection, fast slab-method ray vs AABB intersection, ray vs segment intersection, and continuous swept tests (`sweepBody`, `sweepCircleCircle`, `sweepCircleAabb`, `sweepCircleTriangle`, `sweepAabbAabb`, `sweepAabbCircle`, `sweepAabbTriangle`).

It returns impact fraction $t \in [0, 1]$, world coordinates of the hit point, outward unit normal vector, and struck body reference.

```javascript
import { Raycast, Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const start = new Vec2(0, 100);
const end = new Vec2(500, 100);

// Scene raycast (returns closest hit)
const hit = scene.raycast(start, end, { mask: 0x0004 });
if (hit) {
  console.log('Impact at:', hit.point.x, hit.point.y, 'normal:', hit.normal);
}
```

---

## Raycast.getAabbExitNormal()



```typescript
getAabbExitNormal(point: Vec2, min: Vec2, max: Vec2, out: Vec2): Vec2
```

---

## Raycast.raycastCircle()

Cast a segment against a circular boundary and calculate intersection fraction, hit point, and surface normal.

```typescript
raycastCircle(start: Vec2, end: Vec2, center: Vec2, radius: number, target?: RayHit2D): RayHit2D | null
```

### Parameters

- `start` — `Vec2`. Starting point of the segment.
- `end` — `Vec2`. Ending point of the segment.
- `center` — `Vec2`. Circle center.
- `radius` — `number`. Circle radius.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.raycastAabb()

Cast a segment against an Axis-Aligned Bounding Box (AABB) using the slab method.

```typescript
raycastAabb(start: Vec2, end: Vec2, center: Vec2, halfSize: Vec2, target?: RayHit2D): RayHit2D | null
```

### Parameters

- `start` — `Vec2`. Starting point of the segment.
- `end` — `Vec2`. Ending point of the segment.
- `center` — `Vec2`. AABB center.
- `halfSize` — `Vec2`. AABB half-size extents.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.raycastSegment()



```typescript
raycastSegment(start: Vec2, end: Vec2, p1: Vec2, p2: Vec2, outNormal: Vec2, target?: RayHit2D): RayHit2D | null
```

---

## Raycast.raycastBody()

Cast a segment against a Physics body instance, respecting active state and shape geometry.

```typescript
raycastBody(start: Vec2, end: Vec2, body: Physics): RaycastHit | null
```

### Parameters

- `start` — `Vec2`. Starting point of the segment.
- `end` — `Vec2`. Ending point of the segment.
- `body` — `Physics`. Target body.

### Returns

`RaycastHit | null`

---

## Raycast.sweepCircleCircle()

Sweep a moving circle along a line segment against a stationary circle using Minkowski sum expansion.

```typescript
sweepCircleCircle(start: Vec2, end: Vec2, radiusA: number, centerB: Vec2, radiusB: number): { fraction: number; point: Vec2; normal: Vec2 } | null
```

### Parameters

- `start` — `Vec2`. Starting point of the moving circle center.
- `end` — `Vec2`. Target position of the moving circle center.
- `radiusA` — `number`. Radius of moving circle A.
- `centerB` — `Vec2`. Center of target circle B.
- `radiusB` — `number`. Radius of target circle B.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.sweepCircleAabb()

Sweep a moving circle along a line segment against an Axis-Aligned Bounding Box (AABB) using rounded rectangle Minkowski expansion.

```typescript
sweepCircleAabb(start: Vec2, end: Vec2, radiusA: number, centerB: Vec2, halfSizeB: Vec2): { fraction: number; point: Vec2; normal: Vec2 } | null
```

### Parameters

- `start` — `Vec2`. Starting point of moving circle center.
- `end` — `Vec2`. Target position of moving circle center.
- `radiusA` — `number`. Radius of moving circle A.
- `centerB` — `Vec2`. Center of target AABB B.
- `halfSizeB` — `Vec2`. Half-extents of target AABB B.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.testOffsetEdge()



```typescript
testOffsetEdge(start: Vec2, end: Vec2, p1: Vec2, p2: Vec2, normal: Vec2, radius: number, tMin: number): number
```

---

## Raycast.sweepCircleTriangle()

Sweep a moving circle along a line segment against a `RightTriangle` using offset edges and rounded vertices.

```typescript
sweepCircleTriangle(start: Vec2, end: Vec2, radiusA: number, tri: RightTriangle): { fraction: number; point: Vec2; normal: Vec2 } | null
```

### Parameters

- `start` — `Vec2`. Starting point of moving circle center.
- `end` — `Vec2`. Target position of moving circle center.
- `radiusA` — `number`. Radius of moving circle A.
- `tri` — `RightTriangle`. Target right triangle.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.sweepAabbAabb()

Sweep a moving AABB along a line segment against a stationary AABB using expanded box raycasting.

```typescript
sweepAabbAabb(start: Vec2, end: Vec2, halfSizeA: Vec2, centerB: Vec2, halfSizeB: Vec2): { fraction: number; point: Vec2; normal: Vec2 } | null
```

### Parameters

- `start` — `Vec2`. Starting point of moving AABB center.
- `end` — `Vec2`. Target position of moving AABB center.
- `halfSizeA` — `Vec2`. Half-extents of moving AABB A.
- `centerB` — `Vec2`. Center of target AABB B.
- `halfSizeB` — `Vec2`. Half-extents of target AABB B.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.sweepAabbCircle()

Sweep a moving AABB along a line segment against a stationary circle.

```typescript
sweepAabbCircle(start: Vec2, end: Vec2, halfSizeA: Vec2, centerB: Vec2, radiusB: number): { fraction: number; point: Vec2; normal: Vec2 } | null
```

### Parameters

- `start` — `Vec2`. Starting point of moving AABB center.
- `end` — `Vec2`. Target position of moving AABB center.
- `halfSizeA` — `Vec2`. Half-extents of moving AABB A.
- `centerB` — `Vec2`. Center of target circle B.
- `radiusB` — `number`. Radius of target circle B.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.sweepAabbTriangle()

Sweep a moving AABB along a line segment against a `RightTriangle`.

```typescript
sweepAabbTriangle(start: Vec2, end: Vec2, halfSizeA: Vec2, tri: RightTriangle): { fraction: number; point: Vec2; normal: Vec2 } | null
```

### Parameters

- `start` — `Vec2`. Starting point of moving AABB center.
- `end` — `Vec2`. Target position of moving AABB center.
- `halfSizeA` — `Vec2`. Half-extents of moving AABB A.
- `tri` — `RightTriangle`. Target right triangle.

### Returns

`{ fraction: number, point: Vec2, normal: Vec2 } | null`

---

## Raycast.sweepBody()

Sweep a moving Physics body along a line segment against a target obstacle body.

```typescript
sweepBody(start: Vec2, end: Vec2, movingBody: Physics, targetBody: Physics): RaycastHit | null
```

### Parameters

- `start` — `Vec2`. Starting point.
- `end` — `Vec2`. Target point.
- `movingBody` — `Physics`. Body being swept.
- `targetBody` — `Physics`. Target obstacle body.

### Returns

`RaycastHit | null`
