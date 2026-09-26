# Physics

A 2D rigid body with mass, velocity, acceleration, restitution, damping, and geometry.

`Physics` pairs physical dynamics (Newtonian integration, forces, velocity damping, and coefficient of restitution) with geometric primitives (`Circ` or `Rect`) from Spock.js.

A mass of `0` denotes a static, immovable obstacle (`inverseMass = 0`), which absorbs collisions without being pushed back.

```javascript
import { Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

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
new Physics(position          : Vec2 = new Vec2(), velocity          : Vec2 = new Vec2(), size              : Vec2 = new Vec2(20, 20), mass              : number = 1.0, damping           : number = 0.8, restitution       : number = 0, shape             : 'circle' | 'aabb' | 'rectangle' = 'circle', friction?         : number, isSensor          : boolean = false, collisionCategory : number = 0x0001, collisionMask     : number = 0xFFFF, collisionGroup    : number = 0, bodyType?         : BodyType, isBullet          : boolean = false)
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
- `isSensor` — `boolean` (optional). Whether this body acts as a sensor/trigger collider (default `false`).
- `collisionCategory` — `number` (optional). Bitfield category for collision filtering (default `0x0001`).
- `collisionMask` — `number` (optional). Bitfield mask of categories this body can collide with (default `0xFFFF`).
- `collisionGroup` — `number` (optional). Group index for override filtering (negative never collides, positive always collides; default `0`).

### Returns

A new `Physics` instance.

---

## Physics.setActive()

Activate body in simulation.

```typescript
setActive(active: boolean = true): void
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

## Physics.sleep()

Manually put the body to sleep. Zeroes velocity and skips simulation updates until perturbed.

```typescript
sleep(): void
```

### Returns

`void`

---

## Physics.wakeUp()

Awaken the sleeping body, restoring normal integration and broad-phase collision checks.

```typescript
wakeUp(): void
```

### Returns

`void`

---

## Physics.setCanSleep()

Configure whether this body can automatically go to sleep when idle.

```typescript
setCanSleep(canSleep: boolean): void
```

### Parameters

- `canSleep` — `boolean`. Whether sleep is allowed.

### Returns

`void`

---

## Physics.getCanSleep()

Check whether automatic idle sleeping is enabled for this body.

```typescript
getCanSleep(): boolean
```

### Returns

`boolean`

---

## Physics.getIsSleeping()

Check whether the body is currently sleeping.

```typescript
getIsSleeping(): boolean
```

### Returns

`boolean`

---

## Physics.setSleepThreshold()

Set linear velocity threshold (in px/s) below which the body is considered idle.

```typescript
setSleepThreshold(threshold: number): void
```

### Parameters

- `threshold` — `number`. Speed threshold.

### Returns

`void`

---

## Physics.getSleepThreshold()

Get linear velocity sleep threshold in px/s.

```typescript
getSleepThreshold(): number
```

### Returns

`number`

---

## Physics.setSleepStepsThreshold()

Set number of consecutive idle steps required before putting the body to sleep.

```typescript
setSleepStepsThreshold(steps: number): void
```

### Parameters

- `steps` — `number`. Step count threshold.

### Returns

`void`

---

## Physics.getSleepStepsThreshold()

Get consecutive idle steps threshold.

```typescript
getSleepStepsThreshold(): number
```

### Returns

`number`

---

## Physics.applyForce()

Apply continuous external force vector (resets after step) and awakens the body if sleeping.

```typescript
applyForce(force: Vec2): void
```

### Parameters

- `force` — `Vec2`. Force vector.

### Returns

`void`

---

## Physics.applyImpulseVector()

Apply instantaneous impulse vector and awakens the body if sleeping.

```typescript
applyImpulseVector(impulse: Vec2): void
```

### Parameters

- `impulse` — `Vec2`. Impulse vector.

### Returns

`void`

---

## Physics.prepareStep()



```typescript
prepareStep(second: number): boolean
```

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

## Physics.applyImpulse()

Apply an instantaneous linear velocity impulse vector to the body.

```typescript
applyImpulse(): void
```

### Parameters

- `impulse` — `Vec2`. Impulse vector in px·kg/s.

### Returns

`void`

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

Set body mass. Sets `inverseMass = 1 / mass` (or `0` when `mass = 0`). Automatically syncs `bodyType` to `static`/`kinematic` if mass is 0, or `dynamic` if mass > 0.

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

## Physics.setBodyType()

Set explicit rigid body type (`dynamic` | `static` | `kinematic`). Configures mass and velocity constraints accordingly.

```typescript
setBodyType(type: BodyType): void
```

### Parameters

- `type` — `BodyType`. Body type (`dynamic`, `static`, or `kinematic`).

### Returns

`void`

### Example

```javascript
platform.setBodyType('kinematic');
```

---

## Physics.getBodyType()

Get the current rigid body simulation type.

```typescript
getBodyType(): BodyType
```

### Returns

`BodyType` — `'dynamic' | 'static' | 'kinematic'`.

---

## Physics.isStatic()

Check whether the body is static (zero inverse mass, zero velocity, immovable).

```typescript
isStatic(): boolean
```

### Returns

`boolean`

---

## Physics.isKinematic()

Check whether the body is kinematic (moves along velocity, unaffected by gravity/forces/impulses).

```typescript
isKinematic(): boolean
```

### Returns

`boolean`

---

## Physics.isDynamic()

Check whether the body is dynamic (positive mass, moves under Newtonian physics and collisions).

```typescript
isDynamic(): boolean
```

### Returns

`boolean`

---

## Physics.isStationary()

Check whether the body is currently stationary (static, sleeping, or kinematic with zero velocity). Used for broad-phase pruning.

```typescript
isStationary(): boolean
```

### Returns

`boolean`

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

## Physics.setOnCollision()

Set collision callback function for this body.

```typescript
setOnCollision(callback: BodyCollisionCallback | null): void
```

### Parameters

- `callback` — `((other: Physics, normal: Vec2, impulse: Vec2) => void) | null`. Callback invoked on collision.

### Returns

`void`

### Example

```javascript
body.setOnCollision((other, normal, impulse) => {
  console.log('Collided with:', other, 'impulse:', impulse.getMagnitude());
});
```

---

## Physics.getOnCollision()

Get current collision callback for this body.

```typescript
getOnCollision(): BodyCollisionCallback | null
```

### Returns

`BodyCollisionCallback | null`

---

## Physics.addCollisionListener()

Add an additional collision listener for this body.

```typescript
addCollisionListener(listener: BodyCollisionCallback): void
```

### Parameters

- `listener` — `BodyCollisionCallback`. Collision listener function.

### Returns

`void`

---

## Physics.removeCollisionListener()

Remove a previously registered collision listener from this body.

```typescript
removeCollisionListener(listener: BodyCollisionCallback): boolean
```

### Parameters

- `listener` — `BodyCollisionCallback`. Collision listener function.

### Returns

`boolean` — `true` if listener was found and removed.

---

## Physics.clearCollisionListeners()

Remove all registered collision listeners from this body.

```typescript
clearCollisionListeners(): void
```

### Returns

`void`

---

## Physics.setSensor()

Configure this body as a sensor/trigger collider. Sensors detect overlaps and fire collision events without applying positional correction or impulse response.

```typescript
setSensor(isSensor: boolean): void
```

### Parameters

- `isSensor` — `boolean`. Sensor state.

### Returns

`void`

### Example

```javascript
coin.setSensor(true);
```

---

## Physics.getSensor()

Get whether this body is configured as a sensor.

```typescript
getSensor(): boolean
```

### Returns

`boolean`

---

## Physics.getIsSensor()

Alias for `getSensor()`.

```typescript
getIsSensor(): boolean
```

### Returns

`boolean`

---

## Physics.setCollisionCategory()

Set the bitfield category of this body (power of 2, e.g. 0x0002).

```typescript
setCollisionCategory(category: number): void
```

### Parameters

- `category` — `number`. Bitfield category integer.

### Returns

`void`

---

## Physics.getCollisionCategory()

Get the bitfield category of this body.

```typescript
getCollisionCategory(): number
```

### Returns

`number`

---

## Physics.setCollisionMask()

Set the bitfield collision mask defining which categories this body is allowed to collide with.

```typescript
setCollisionMask(mask: number): void
```

### Parameters

- `mask` — `number`. Bitfield mask integer.

### Returns

`void`

---

## Physics.getCollisionMask()

Get the bitfield collision mask of this body.

```typescript
getCollisionMask(): number
```

### Returns

`number`

---

## Physics.setCollisionGroup()

Set the collision group index (negative never collides with same group, positive always collides with same group, 0 uses category/mask).

```typescript
setCollisionGroup(group: number): void
```

### Parameters

- `group` — `number`. Group index integer.

### Returns

`void`

---

## Physics.getCollisionGroup()

Get the collision group index of this body.

```typescript
getCollisionGroup(): number
```

### Returns

`number`

---

## Physics.ignoreCollisionWith()

Explicitly disable collision detection and resolution with another specific body.

```typescript
ignoreCollisionWith(other: Physics): void
```

### Parameters

- `other` — `Physics`. Body to ignore.

### Returns

`void`

### Example

```javascript
bodyA.ignoreCollisionWith(bodyB);
```

---

## Physics.restoreCollisionWith()

Restore collision detection and resolution with a previously ignored body.

```typescript
restoreCollisionWith(other: Physics): void
```

### Parameters

- `other` — `Physics`. Body to restore collision with.

### Returns

`void`

### Example

```javascript
bodyA.restoreCollisionWith(bodyB);
```

---

## Physics.isIgnoringCollisionWith()

Check whether collision with another specific body is currently ignored.

```typescript
isIgnoringCollisionWith(other: Physics): boolean
```

### Parameters

- `other` — `Physics`. Other body to check.

### Returns

`boolean` — `true` if ignored.

---

## Physics.canCollideWith()

Check whether this body can collide with another body based on ignored bodies, group indices, and category/mask bitfields.

```typescript
canCollideWith(other: Physics): boolean
```

### Parameters

- `other` — `Physics`. Other body to test.

### Returns

`boolean` — `true` if bodies are permitted to collide.

### Example

```javascript
if (bullet.canCollideWith(enemy)) { /* ... */ }
```

---

## Physics.setBullet()

Enable or disable Continuous Collision Detection (CCD) for this dynamic body to prevent tunneling through thin colliders at high speed.

```typescript
setBullet(bullet: boolean): void
```

### Parameters

- `bullet` — `boolean`. Whether this body is simulated with CCD.

### Returns

`void`

### Example

```javascript
fastProjectile.setBullet(true);
```

---

## Physics.getBullet()

Check whether this body has CCD enabled.

```typescript
getBullet(): boolean
```

### Returns

`boolean`

---

## Physics.getIsBullet()

Alias for `getBullet()`.

```typescript
getIsBullet(): boolean
```

### Returns

`boolean`

---

## Physics.raycast()

Cast a segment from start to end against this body and return hit details if intersected.

```typescript
raycast(start: Vec2, end: Vec2): RaycastHit | null
```

### Parameters

- `start` — `Vec2`. Starting point of the segment.
- `end` — `Vec2`. Ending point of the segment.

### Returns

`RaycastHit | null` — Hit details or `null` if missed or body is inactive.

### Example

```javascript
const hit = obstacle.raycast(origin, target);
```

---

## Physics.sweep()

Sweep this body along a line segment from start to end against an obstacle body and return hit information.

```typescript
sweep(start: Vec2, end: Vec2, other: Physics): RaycastHit | null
```

### Parameters

- `start` — `Vec2`. Starting point.
- `end` — `Vec2`. Target point.
- `other` — `Physics`. Obstacle body to test against.

### Returns

`RaycastHit | null`

### Example

```javascript
const hit = bullet.sweep(startPos, endPos, wall);
```

---

## Physics.collision()



```typescript
collision(impulsePerInverseMass: Vec2, object: Physics, normal?: Vec2): void
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

## Physics.containsPoint()

Test whether a point in world coordinates is inside this active body.

```typescript
containsPoint(point: Vec2): boolean
```

### Parameters

- `point` — `Vec2`. World coordinate query point.

### Returns

`boolean` — `true` if the point is inside the body.

### Example

```javascript
const isHovered = player.containsPoint(mouseWorldPos);
```

---

## Physics.overlapsCircle()

Test whether this active body overlaps a circle defined by center and radius.

```typescript
overlapsCircle(center: Vec2, radius: number): boolean
```

### Parameters

- `center` — `Vec2`. Circle center in world coordinates.
- `radius` — `number`. Circle radius.

### Returns

`boolean` — `true` if overlapping.

### Example

```javascript
if (enemy.overlapsCircle(blastOrigin, blastRadius)) { /* apply damage */ }
```

---

## Physics.overlapsAabb()

Test whether this active body overlaps an Axis-Aligned Bounding Box (AABB).

```typescript
overlapsAabb(min: Vec2, max: Vec2): boolean
```

### Parameters

- `min` — `Vec2`. Minimum corner (or first corner).
- `max` — `Vec2`. Maximum corner (or second corner).

### Returns

`boolean` — `true` if overlapping.

### Example

```javascript
if (body.overlapsAabb(cameraMin, cameraMax)) { /* render */ }
```

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
