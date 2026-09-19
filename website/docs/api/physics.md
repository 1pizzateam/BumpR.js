# Physics

A 2D rigid body with mass, velocity, acceleration, restitution, damping, and geometry.

`Physics` pairs physical dynamics (Newtonian integration, forces, velocity damping, and coefficient of restitution) with geometric primitives (`Circ` or `Rect`) from Spock.js.

A mass of `0` denotes a static, immovable obstacle (`inverseMass = 0`), which absorbs collisions without being pushed back.

```javascript
import { Physics } from '@1pizzateam/bumpr';

// Dynamic circle (radius = 20, mass = 1.0)
const ball = new Physics('circle', 20, undefined, 100, 100, 1.0);
ball.setVelocity(200, 0);
ball.setRestitution(0.85);

// Static wall (width = 200, height = 20, mass = 0)
const wall = new Physics('aabb', 200, 20, 100, 300, 0);
```

---

## Constructor

Create a new `Physics` body.

```typescript
new Physics(positionX: number, positionY: number, velocityX: number, velocityY: number, sizeX: number, sizeY: number, mass: number, damping: number, restitution: number, type: string)
```

### Parameters

- `type` — `'circle' | 'aabb'`. Geometric shape type.
- `width` — `number`. Radius if circle, or total width if AABB.
- `height` — `number | undefined`. Total height if AABB, omitted for circle.
- `x` — `number`. Initial horizontal position (default `0`).
- `y` — `number`. Initial vertical position (default `0`).
- `mass` — `number`. Rigid body mass (default `1.0`). Use `0` for static immovable obstacles.

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

Explicitly set the body position coordinates.

```typescript
setPosition(x: number, y: number): void
```

### Parameters

- `x` — `number`. Horizontal position.
- `y` — `number`. Vertical position.

### Returns

`void`

---

## Physics.setPositionFromVector()



```typescript
setPositionFromVector(position: Vec2): void
```

---

## Physics.getPosition()



```typescript
getPosition(): Vec2
```

---

## Physics.setVelocity()

Explicitly set linear velocity vector components.

```typescript
setVelocity(x: number, y: number): void
```

### Parameters

- `x` — `number`. Horizontal velocity.
- `y` — `number`. Vertical velocity.

### Returns

`void`

---

## Physics.setVelocityFromVector()



```typescript
setVelocityFromVector(velocity: Vec2): void
```

---

## Physics.getVelocity()



```typescript
getVelocity(): Vec2
```

---

## Physics.setInitialVelocity()

Record reference initial velocity for subsequent `reset()` calls.

```typescript
setInitialVelocity(x: number, y: number): void
```

### Parameters

- `x` — `number`. Horizontal initial velocity.
- `y` — `number`. Vertical initial velocity.

### Returns

`void`

---

## Physics.getInitialVelocity()



```typescript
getInitialVelocity(): Vec2
```

---

## Physics.setGravity()



```typescript
setGravity(x: number, y: number): void
```

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
setSize(width: number, height?: number): void
```

### Parameters

- `width` — `number`. Radius if circle, width if AABB.
- `height` — `number | undefined`. Height if AABB.

### Returns

`void`

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
