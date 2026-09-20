# Physics

A 2D rigid body with mass, velocity, acceleration, restitution, damping, and geometry.

`Physics` pairs physical dynamics (Newtonian integration, forces, velocity damping, and coefficient of restitution) with geometric primitives (`Circ` or `Rect`) from Spock.js.

A mass of `0` denotes a static, immovable obstacle (`inverseMass = 0`), which absorbs collisions without being pushed back.

```javascript
import { Physics, Vec2 } from '@1pizzateam/bumpr';

// Dynamic circle (position, velocity, size, mass, damping, restitution, shape)
const ball = new Physics(
  new Vec2(100, 100),
  new Vec2(200, 0),
  new Vec2(40, 40),
  1.0,
  0.98,
  0.85,
  'circle'
);

// Static wall (mass = 0 denotes an immovable obstacle)
const wall = new Physics(
  new Vec2(100, 300),
  new Vec2(0, 0),
  new Vec2(200, 20),
  0,
  1.0,
  0.5,
  'aabb'
);
```

---

## Constructor

Create a new `Physics` body with vector-first arguments.

```typescript
new Physics(position    : Vec2 = new Vec2(), velocity    : Vec2 = new Vec2(), size        : Vec2 = new Vec2(20, 20), mass        : number = 1.0, damping     : number = 0.8, restitution : number = 0, shape       : 'circle' | 'aabb' | 'rectangle' = 'circle', friction?   : number)
```

### Parameters

- `position` — `Vec2`. Initial position (default `new Vec2()`).
- `velocity` — `Vec2`. Initial velocity in px/s (default `new Vec2()`).
- `size` — `Vec2`. Bounding dimensions (width, height; default `new Vec2(20, 20)`). For circles, radius is `size.x * 0.5`.
- `mass` — `number`. Body mass in kg (default `1.0`). `0` marks a static body.
- `damping` — `number`. Air resistance / velocity damping per second in `[0, 1]` (default `0.8`).
- `restitution` — `number`. Bounciness in `[0, 1]` (default `0`).
- `shape` — `'circle' | 'aabb' | 'rectangle'`. Collision geometry (default `'circle'`).
- `friction` — `number` (optional). Coulomb friction coefficient in `[0, 1]` (defaults to `0` for circle, `0.6` for AABB).

### Returns

A new `Physics` instance.

---

## Physics.setActive()

Activate body in simulation.

```typescript
setActive(): void
```

### Returns

`void`

---

## Physics.setInactive()

Deactivate body, temporarily skipping physics updates and collisions.

```typescript
setInactive(): void
```

### Returns

`void`

---

## Physics.toggleActive()

Toggle active status between enabled and disabled.

```typescript
toggleActive(): boolean
```

### Returns

`boolean` — New active status.

---

## Physics.isActive()

Check whether the body is active in simulation.

```typescript
isActive(): boolean
```

### Returns

`boolean`

---

## Physics.updatePosition()

Integrate accumulated impulses, apply velocity damping, and update geometric shape position.

```typescript
updatePosition(second: number): Vec2
```

### Parameters

- `second` — `number`. Timestep elapsed in seconds.

### Returns

`void`

---

## Physics.applyForces()



```typescript
applyForces(second: number): void
```

---

## Physics.correctPosition()

Directly translate the body position (used for positional penetration de-penetration).

```typescript
correctPosition(correction: Vec2): void
```

### Parameters

- `correction` — `Vec2`. Translation correction vector.

### Returns

`void`

---

## Physics.setPosition()

Explicitly set the body position vector.

```typescript
setPosition(position: Vec2): void
```

### Parameters

- `position` — `Vec2`. New position vector.

### Returns

`void`

---

## Physics.getPosition()



```typescript
getPosition(): Vec2
```

---

## Physics.setVelocity()

Explicitly set linear velocity vector.

```typescript
setVelocity(velocity: Vec2): void
```

### Parameters

- `velocity` — `Vec2`. New velocity vector.

### Returns

`void`

---

## Physics.getVelocity()



```typescript
getVelocity(): Vec2
```

---

## Physics.setInitialVelocity()

Record reference initial velocity for subsequent `reset()` calls.

```typescript
setInitialVelocity(velocity: Vec2): void
```

### Parameters

- `velocity` — `Vec2`. Initial velocity vector.

### Returns

`void`

---

## Physics.getInitialVelocity()



```typescript
getInitialVelocity(): Vec2
```

---

## Physics.setGravity()

Set custom gravity acceleration vector for this body.

```typescript
setGravity(gravity: Vec2): void
```

### Parameters

- `gravity` — `Vec2`. Gravity vector.

### Returns

`void`

---

## Physics.setMass()

Set body mass. Sets `inverseMass = 1 / mass` (or `0` when `mass = 0`).

```typescript
setMass(mass: number): void
```

### Parameters

- `mass` — `number`. Body mass in kg.

### Returns

`void`

---

## Physics.getMass()

Get body mass.

```typescript
getMass(): number
```

### Returns

`number` — Current mass.

---

## Physics.setRestitution()

Set coefficient of restitution (bounciness), clamped between `0.0` (inelastic) and `1.0` (elastic).

```typescript
setRestitution(restitution: number): void
```

### Parameters

- `restitution` — `number`. Value in `[0.0, 1.0]`.

### Returns

`void`

---

## Physics.getRestitution()

Get coefficient of restitution.

```typescript
getRestitution(): number
```

### Returns

`number`

---

## Physics.setFriction()

Set coefficient of Coulomb surface friction, clamped between `0.0` (frictionless) and `1.0` (high friction).

```typescript
setFriction(friction: number): void
```

### Parameters

- `friction` — `number`. Friction coefficient in `[0.0, 1.0]`.

### Returns

`void`

---

## Physics.getFriction()

Get coefficient of Coulomb surface friction.

```typescript
getFriction(): number
```

### Returns

`number`

---

## Physics.setDamping()

Set linear air drag velocity damping factor (default `1.0` = no damping).

```typescript
setDamping(damping: number): void
```

### Parameters

- `damping` — `number`. Value in `[0.0, 1.0]`.

### Returns

`void`

---

## Physics.getDamping()

Get linear velocity damping factor.

```typescript
getDamping(): number
```

### Returns

`number`

---

## Physics.getBody()

Get the underlying Spock geometric shape (`Circ` or `Rect`).

```typescript
getBody(): Rect | Circ
```

### Returns

`Circ | Rect`

---

## Physics.setSize()

Update the dimensions of the underlying geometric shape.

```typescript
setSize(sizeOrWidth: Vec2 | number, height?: number): void
```

### Parameters

- `width` — `number`. Radius if circle, width if AABB.
- `height` — `number | undefined`. Height if AABB.

### Returns

`void`

---

## Physics.setRadius()



```typescript
setRadius(radius: number): void
```

---

## Physics.setGrid()



```typescript
setGrid(grid: Grid | null): void
```

---

## Physics.getGrid()



```typescript
getGrid(): Grid | null
```

---

## Physics.setDamageDealt()



```typescript
setDamageDealt(damageDealt: number): void
```

---

## Physics.getDamageDealt()



```typescript
getDamageDealt(): number
```

---

## Physics.getDamageTaken()



```typescript
getDamageTaken(): number
```

---

## Physics.applyDamage()



```typescript
applyDamage(): number|false
```

---

## Physics.collision()



```typescript
collision(impulsePerInverseMass: Vec2, object: Physics): void
```

---

## Physics.reset()

Reset transient forces, impulses, and revert velocity to initial velocity.

```typescript
reset(): void
```

### Returns

`void`

---

## Physics.draw()

Render the body onto a 2D canvas context.

```typescript
draw(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void
```

### Parameters

- `context` — `CanvasRenderingContext2D`. Target canvas context.
- `fillColor` — `string`. Interior fill style.
- `strokeColor` — `string`. Contour stroke style.
- `strokeWidth` — `number`. Contour stroke thickness.

### Returns

`void`
