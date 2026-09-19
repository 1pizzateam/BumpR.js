# CollisionDetection

Narrow-phase collision detection, positional resolution, and elastic impulse solver.

`CollisionDetection` computes penetration vectors between pairs of bodies (`Circle vs Circle`, `Circle vs AABB`, `AABB vs AABB`), separates overlapping bodies along the contact normal according to inverse mass ratios, and computes linear impulse responses.

```javascript
import { CollisionDetection, Physics } from '@1pizzateam/bumpr';

const a = new Physics('circle', 20, undefined, 50, 50, 1.0);
const b = new Physics('aabb', 40, 40, 70, 50, 1.0);

// Perform full detection + position correction + impulse resolution:
const hasCollided = CollisionDetection.test(a, b);
```

---

## CollisionDetection.broadphase()

Test whether two bodies share one or more spatial grid cells.

```typescript
broadphase(a: Physics, b: Physics, grid: Grid): boolean
```

### Parameters

- `a` — `Physics`. First body.
- `b` — `Physics`. Second body.
- `grid` — `Grid`. Spock spatial hash grid.

### Returns

`boolean` — `true` if bodies share grid cells, `false` otherwise.

---

## CollisionDetection.test()

Execute full collision pipeline: narrow-phase detection, positional resolution, and impulse computation.

```typescript
test(a: Physics, b: Physics): boolean
```

### Parameters

- `a` — `Physics`. First body.
- `b` — `Physics`. Second body.

### Returns

`boolean` — `true` if a collision occurred and was resolved.

---

## CollisionDetection.detect()

Compute the penetration vector between two geometric shapes (`Circ | Rect`). Stores result in `this.penetration`.

```typescript
detect(a: Circ | Rect, b: Circ | Rect): void
```

### Parameters

- `a` — `Circ | Rect`. First shape.
- `b` — `Circ | Rect`. Second shape.

### Returns

`void`

---

## CollisionDetection.resolve()

Perform positional correction by shifting bodies apart along the penetration normal based on relative inverse masses.

```typescript
resolve(a: Physics, b: Physics): boolean
```

### Parameters

- `a` — `Physics`. First body.
- `b` — `Physics`. Second body.

### Returns

`boolean` — `true` if position was corrected, `false` if zero correction.

---

## CollisionDetection.computeImpulse()

Compute and apply momentum impulse along the contact normal based on relative velocity, restitution, and masses.

```typescript
computeImpulse(a: Physics, b: Physics): void
```

### Parameters

- `a` — `Physics`. First body.
- `b` — `Physics`. Second body.

### Returns

`void`
