# DistanceConstraint

Distance constraints, rigid rods, ropes, and damped elastic spring joints connecting rigid bodies.

`DistanceConstraint` (also exported as `Joint`) maintains a target distance or allowable distance range between two rigid bodies, using position-based constraint projection (PBD) and relative velocity damping.

It supports rigid rods (`createRod`), inextensible ropes or cables (`createRope`), and damped elastic springs (`createSpring`). Connected bodies disable mutual collision by default (`collideConnected = false`).

```javascript
import { DistanceConstraint, Joint, Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();
const anchor = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'circle', 0, false, 1, 0xFFFF, 0, 'static');
const bob = new Physics(new Vec2(100, 150), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
scene.addBody(anchor);
scene.addBody(bob);

// Create a pendulum rod connecting anchor and bob:
const pendulum = DistanceConstraint.createRod(anchor, bob, 100);
scene.addConstraint(pendulum);
```

---

## Constructor

Create a new distance constraint between two bodies.

```typescript
new DistanceConstraint(bodyA: Physics, bodyB: Physics, options?: DistanceConstraintOptions)
```

### Parameters

- `bodyA` — `Physics`. The first rigid body.
- `bodyB` — `Physics`. The second rigid body.
- `options` — `DistanceConstraintOptions` (optional). Distance, limits, stiffness, damping, local anchors, and collideConnected.

### Returns

A new `DistanceConstraint` instance.

---

## DistanceConstraint.createRod()

Factory method creating a rigid rod with fixed distance and stiffness = 1.0.

```typescript
createRod(bodyA: Physics, bodyB: Physics, length?: number, options?: Omit<DistanceConstraintOptions, 'distance' | 'minDistance' | 'maxDistance' | 'stiffness'>): DistanceConstraint
```

### Parameters

- `bodyA` — `Physics`. The first rigid body.
- `bodyB` — `Physics`. The second rigid body.
- `length` — `number` (optional). Rest length of the rod.
- `options` — `DistanceConstraintOptions` (optional). Additional options.

### Returns

`DistanceConstraint`

---

## DistanceConstraint.createRope()

Factory method creating a rope or cable that permits slack (minDistance = 0, maxDistance = maxLength).

```typescript
createRope(bodyA: Physics, bodyB: Physics, maxLength?: number, options?: Omit<DistanceConstraintOptions, 'minDistance' | 'maxDistance'>): DistanceConstraint
```

### Parameters

- `bodyA` — `Physics`. The first rigid body.
- `bodyB` — `Physics`. The second rigid body.
- `maxLength` — `number` (optional). Maximum allowable separation length.
- `options` — `DistanceConstraintOptions` (optional). Additional options.

### Returns

`DistanceConstraint`

---

## DistanceConstraint.createSpring()

Factory method creating an elastic spring with configurable stiffness and damping.

```typescript
createSpring(bodyA: Physics, bodyB: Physics, stiffnessOrLength?: number, dampingOrStiffness?: number, lengthOrDamping?: number, options?: Omit<DistanceConstraintOptions, 'stiffness' | 'damping' | 'distance'>): DistanceConstraint
```

### Parameters

- `bodyA` — `Physics`. The first rigid body.
- `bodyB` — `Physics`. The second rigid body.
- `stiffness` — `number` (optional, default `0.2`). Spring stiffness in [0, 1].
- `damping` — `number` (optional, default `0.1`). Oscillation damping in [0, 1].
- `length` — `number` (optional). Rest length.
- `options` — `DistanceConstraintOptions` (optional). Additional options.

### Returns

`DistanceConstraint`

---

## DistanceConstraint.setDistance()

Set target rest distance and synchronizes minDistance and maxDistance.

```typescript
setDistance(distance: number): void
```

### Parameters

- `distance` — `number`. Rest distance in pixels.

### Returns

`void`

---

## DistanceConstraint.getDistance()

Get current rest distance.

```typescript
getDistance(): number
```

### Returns

`number`

---

## DistanceConstraint.setMinDistance()

Set minimum distance threshold before compression resistance triggers.

```typescript
setMinDistance(minDistance: number): void
```

### Parameters

- `minDistance` — `number`. Minimum distance.

### Returns

`void`

---

## DistanceConstraint.getMinDistance()

Get minimum distance threshold.

```typescript
getMinDistance(): number
```

### Returns

`number`

---

## DistanceConstraint.setMaxDistance()

Set maximum distance threshold before tension resistance triggers.

```typescript
setMaxDistance(maxDistance: number): void
```

### Parameters

- `maxDistance` — `number`. Maximum distance.

### Returns

`void`

---

## DistanceConstraint.getMaxDistance()

Get maximum distance threshold.

```typescript
getMaxDistance(): number
```

### Returns

`number`

---

## DistanceConstraint.setStiffness()

Set constraint stiffness in [0, 1]. 1.0 is rigid, lower values are spring-like.

```typescript
setStiffness(stiffness: number): void
```

### Parameters

- `stiffness` — `number`. Stiffness factor.

### Returns

`void`

---

## DistanceConstraint.getStiffness()

Get constraint stiffness.

```typescript
getStiffness(): number
```

### Returns

`number`

---

## DistanceConstraint.setDamping()

Set velocity damping impulse along constraint normal in [0, 1].

```typescript
setDamping(damping: number): void
```

### Parameters

- `damping` — `number`. Damping factor.

### Returns

`void`

---

## DistanceConstraint.getDamping()

Get constraint damping.

```typescript
getDamping(): number
```

### Returns

`number`

---

## DistanceConstraint.setActive()

Enable or disable this constraint in simulation steps.

```typescript
setActive(active: boolean): void
```

### Parameters

- `active` — `boolean`. Active state.

### Returns

`void`

---

## DistanceConstraint.isActive()

Get whether this constraint is active.

```typescript
isActive(): boolean
```

### Returns

`boolean`

---

## DistanceConstraint.getWorldAnchorA()

Calculate world-space position of anchor A.

```typescript
getWorldAnchorA(out?: Vec2): Vec2
```

### Parameters

- `out` — `Vec2` (optional). Destination vector to store result.

### Returns

`Vec2` — World anchor position.

---

## DistanceConstraint.getWorldAnchorB()

Calculate world-space position of anchor B.

```typescript
getWorldAnchorB(out?: Vec2): Vec2
```

### Parameters

- `out` — `Vec2` (optional). Destination vector to store result.

### Returns

`Vec2` — World anchor position.

---

## DistanceConstraint.getCurrentDistance()

Calculate current world distance between anchor points.

```typescript
getCurrentDistance(): number
```

### Returns

`number` — Distance in pixels.

---

## DistanceConstraint.solve()

Project positions and apply velocity damping impulses along constraint normal.

```typescript
solve(): void
```

### Returns

`void`

---

## DistanceConstraint.draw()

Render the constraint line between anchor points onto a 2D canvas context.

```typescript
draw(context: CanvasRenderingContext2D, strokeColor: string = '#888888', strokeWidth: number = 2): void
```

### Parameters

- `context` — `CanvasRenderingContext2D`. Target canvas context.
- `strokeColor` — `string` (optional, default `"#888888"`). Line color.
- `strokeWidth` — `number` (optional, default `2`). Line width in pixels.

### Returns

`void`
