# Scene

The main spatial world manager and collision resolution orchestrator.

`Scene` holds rigid bodies, manages world gravity, coordinates spatial hash grid broad-phase bucketing, advances positions across physics timesteps, and resolves pairwise collisions using configurable constraint solver iterations.

```javascript
import { Scene, Physics } from '@1pizzateam/bumpr';
import { Grid, Vec2 } from '@1pizzateam/spock';

const scene = new Scene();
scene.setGravity(new Vec2(0, 300));

const ball = new Physics(
  new Vec2(100, 50),
  new Vec2(50, 0),
  new Vec2(40, 40),
  1.0,
  1.0,
  0.5,
  'circle'
);
scene.addBody(ball);

// Optional: attach spatial hashing grid
scene.setGrid(new Grid(new Vec2(800, 600), 50));

// In your render/game loop (deterministic fixed-timestep accumulator):
function tick(dt) {
  scene.step(dt);
}
```

---

## Constructor

Create a new physics `Scene` instance.

```typescript
new Scene(grid: Grid | null = null)
```

### Returns

A new `Scene` instance.

### Example

```javascript
import { Scene } from '@1pizzateam/bumpr';

const scene = new Scene();
```

---

## Scene.addBody()

Add a `Physics` rigid body into the simulation scene.

```typescript
addBody(body: Physics): boolean
```

### Parameters

- `body` — `Physics`. The rigid body instance to add.

### Returns

`boolean` — `true` if successfully added, `false` if already in a scene.

### Example

```javascript
const ball = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(30, 30), 1.0, 1.0, 0.5, 'circle');
scene.addBody(ball);
```

---

## Scene.removeBody()

Remove a `Physics` body from the scene in O(1) time using swap-with-last.

```typescript
removeBody(body: Physics): boolean
```

### Parameters

- `body` — `Physics`. The rigid body instance to remove.

### Returns

`boolean` — `true` if removed, `false` if not found in this scene.

### Example

```javascript
scene.removeBody(ball);
```

---

## Scene.clear()

Remove all bodies from the scene, reset scene IDs, and empty active spatial grid buckets.

```typescript
clear(): void
```

### Returns

`void`

### Example

```javascript
scene.clear();
```

---

## Scene.setGrid()

Attach a Spock spatial hashing `Grid` for broad-phase collision culling.

```typescript
setGrid(grid: Grid | null): void
```

### Parameters

- `grid` — `Grid | null`. Spatial grid or `null` to disable grid broad-phase.

### Returns

`void`

### Example

```javascript
import { Grid, Vec2 } from '@1pizzateam/spock';

scene.setGrid(new Grid(new Vec2(1000, 1000), 10));
```

---

## Scene.getGrid()

Get the currently attached Spock `Grid`, or `null` if broad-phase grid is not set.

```typescript
getGrid(): Grid | null
```

### Returns

`Grid | null`

### Example

```javascript
const grid = scene.getGrid();
```

---

## Scene.setGravity()

Set global scene gravity vector and propagate to all current member bodies.

```typescript
setGravity(gravity: Vec2): void
```

### Parameters

- `gravity` — `Vec2`. Gravity acceleration vector.

### Returns

`void`

### Example

```javascript
scene.setGravity(new Vec2(0, 980)); // Earth gravity in px/s²
```

---

## Scene.update()

Advance position and apply forces/damping on all active dynamic bodies in the scene.

```typescript
update(second: number): void
```

### Parameters

- `second` — `number`. Delta time elapsed in seconds.

### Returns

`void`

### Example

```javascript
scene.update(1 / 60);
```

---

## Scene.setFixedDeltaTime()

Configure the fixed simulation delta time for deterministic stepping (default `1 / 60`).

```typescript
setFixedDeltaTime(dt: number): void
```

### Parameters

- `dt` — `number`. Fixed delta time in seconds (minimum `0.0001`).

### Returns

`void`

### Example

```javascript
scene.setFixedDeltaTime(1 / 120);
```

---

## Scene.getFixedDeltaTime()

Get current fixed simulation delta time in seconds.

```typescript
getFixedDeltaTime(): number
```

### Returns

`number`

---

## Scene.setMaxSubSteps()

Set maximum sub-steps per frame to prevent the spiral of death during heavy lag spikes (default `5`).

```typescript
setMaxSubSteps(maxSubSteps: number): void
```

### Parameters

- `maxSubSteps` — `number`. Maximum discrete simulation steps per frame (minimum `1`).

### Returns

`void`

### Example

```javascript
scene.setMaxSubSteps(8);
```

---

## Scene.getMaxSubSteps()

Get maximum sub-steps per frame.

```typescript
getMaxSubSteps(): number
```

### Returns

`number`

---

## Scene.getAccumulator()

Get accumulated residual frame delta time waiting for the next fixed simulation step.

```typescript
getAccumulator(): number
```

### Returns

`number`

---

## Scene.resetAccumulator()

Reset the residual accumulated frame delta time back to zero.

```typescript
resetAccumulator(): void
```

### Returns

`void`

---

## Scene.getAlpha()

Get the interpolation fraction alpha between 0.0 and 1.0 representing progress between the previous and next fixed physics tick. Ideal for renderer frame interpolation on variable refresh monitors.

```typescript
getAlpha(): number
```

### Returns

`number` — Normalized fraction `accumulator / fixedDeltaTime` in `[0, 1)`.

### Example

```javascript
const alpha = scene.getAlpha(); // use to interpolate render positions
```

---

## Scene.step()

Advance physics simulation using a deterministic fixed-timestep accumulator. Consumes delta time in discrete chunks of fixedDeltaTime, calling update() and test(). Clamps accumulated time to prevent spiral of death.

```typescript
step(deltaTime: number): number
```

### Parameters

- `deltaTime` — `number`. Elapsed frame delta time in seconds (e.g. from requestAnimationFrame).

### Returns

`number` — Number of fixed physics sub-steps executed this call.

### Example

```javascript
// In your game/render loop:
function tick(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  const subSteps = scene.step(dt);
  // Optional: interpolate rendering using scene.getAlpha()
  requestAnimationFrame(tick);
}
```

---

## Scene.test()

Detect and resolve collisions between all bodies in the scene across solver iterations.

```typescript
test(): void
```

### Returns

`void`

### Example

```javascript
scene.test();
```

---

## Scene.testScene()

Detect and resolve collisions between bodies in this scene against bodies in an external scene.

```typescript
testScene(scene: Scene): void
```

### Parameters

- `scene` — `Scene`. The second physics scene to test against.

### Returns

`void`

### Example

```javascript
sceneA.testScene(sceneB);
```

---

## Scene.setOnCollision()

Set callback invoked when any physical collision occurs in the scene.

```typescript
setOnCollision(callback: SceneCollisionCallback | null): void
```

### Parameters

- `callback` — `((bodyA: Physics, bodyB: Physics, normal: Vec2, impulse: Vec2) => void) | null`. Collision callback function.

### Returns

`void`

### Example

```javascript
scene.setOnCollision((a, b, normal, impulse) => {
  console.log('Impact impulse:', impulse.getMagnitude());
});
```

---

## Scene.getOnCollision()

Get current scene collision callback.

```typescript
getOnCollision(): SceneCollisionCallback | null
```

### Returns

`SceneCollisionCallback | null`

---

## Scene.addCollisionListener()

Add an additional collision listener for this scene.

```typescript
addCollisionListener(listener: SceneCollisionCallback): void
```

### Parameters

- `listener` — `SceneCollisionCallback`. Collision listener function.

### Returns

`void`

---

## Scene.removeCollisionListener()

Remove a previously registered scene collision listener.

```typescript
removeCollisionListener(listener: SceneCollisionCallback): boolean
```

### Parameters

- `listener` — `SceneCollisionCallback`. Collision listener function.

### Returns

`boolean` — `true` if listener was found and removed.

---

## Scene.clearCollisionListeners()

Remove all registered scene collision listeners.

```typescript
clearCollisionListeners(): void
```

### Returns

`void`

---

## Scene.dispatchCollision()



```typescript
dispatchCollision(a: Physics, b: Physics, normal: Vec2, impulse: Vec2): void
```

---

## Scene.setIteration()

Set number of constraint solver iterations per step (default `1`). Higher iterations increase stacking stability.

```typescript
setIteration(iterations: number): void
```

### Parameters

- `iteration` — `number`. Number of collision solver iterations.

### Returns

`void`

### Example

```javascript
scene.setIteration(4);
```

---

## Scene.setDeduplicationMode()



```typescript
setDeduplicationMode(mode: DeduplicationMode): void
```

---

## Scene.getDeduplicationMode()



```typescript
getDeduplicationMode(): DeduplicationMode
```

---

## Scene.getActiveDeduplicationMode()



```typescript
getActiveDeduplicationMode(): 'cell' | 'pair'
```

---

## Scene.draw()

Render all active bodies in the scene to a 2D canvas context.

```typescript
draw(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void
```

### Parameters

- `context` — `CanvasRenderingContext2D`. Target 2D canvas rendering context.
- `fillColor` — `string`. Body interior fill style.
- `strokeColor` — `string`. Body contour stroke style.
- `strokeWidth` — `number`. Contour stroke thickness.

### Returns

`void`

### Example

```javascript
scene.draw(ctx, '#f8f9fa', '#ff6b6b', 2);
```

---

## Scene.drawGrid()

Render the attached spatial broad-phase grid lines on a 2D canvas context.

```typescript
drawGrid(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void
```

### Parameters

- `context` — `CanvasRenderingContext2D`. Target 2D canvas rendering context.
- `strokeColor` — `string`. Grid line stroke style.
- `strokeWidth` — `number`. Grid line stroke thickness.

### Returns

`void`

### Example

```javascript
scene.drawGrid(ctx, 'rgba(255,255,255,0.1)', 1);
```

---

## Scene.addConstraint()

Add a `DistanceConstraint` into the scene. Disables mutual collision between connected bodies if `collideConnected = false`.

```typescript
addConstraint(constraint: DistanceConstraint): boolean
```

### Parameters

- `constraint` — `DistanceConstraint`. The constraint to add.

### Returns

`boolean` — `true` if added, `false` if already in the scene.

### Example

```javascript
scene.addConstraint(rod);
```

---

## Scene.removeConstraint()

Remove a `DistanceConstraint` from the scene and restores collision between connected bodies.

```typescript
removeConstraint(constraint: DistanceConstraint): boolean
```

### Parameters

- `constraint` — `DistanceConstraint`. The constraint to remove.

### Returns

`boolean` — `true` if found and removed.

### Example

```javascript
scene.removeConstraint(rod);
```

---

## Scene.getConstraints()

Get array of all constraints registered in the scene.

```typescript
getConstraints(): DistanceConstraint[]
```

### Returns

`DistanceConstraint[]`

---

## Scene.getConstraintsCount()

Get the total number of constraints in the scene.

```typescript
getConstraintsCount(): number
```

### Returns

`number`

---

## Scene.clearConstraints()

Remove all constraints and restore collisions between all connected bodies.

```typescript
clearConstraints(): void
```

### Returns

`void`

---

## Scene.solveConstraints()

Solve all active constraints by projecting positions and damping normal relative velocities.

```typescript
solveConstraints(): void
```

### Returns

`void`

---

## Scene.drawConstraints()

Render all active constraints in the scene onto a 2D canvas context.

```typescript
drawConstraints(context: CanvasRenderingContext2D, strokeColor: string = '#888888', strokeWidth: number = 2): void
```

### Parameters

- `context` — `CanvasRenderingContext2D`. Target canvas context.
- `strokeColor` — `string` (optional, default `"#888888"`). Line stroke style.
- `strokeWidth` — `number` (optional, default `2`). Line width.

### Returns

`void`

---

## Scene.raycast()

Cast a segment from start to end through the scene and return the closest hit, or null if nothing was struck.

```typescript
raycast(start: Vec2, end: Vec2, optionsOrMask?: number | RaycastOptions): RaycastHit | null
```

### Parameters

- `start` — `Vec2`. Starting point of the segment.
- `end` — `Vec2`. Ending point of the segment.
- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask (defaults to `0xFFFF`) or `{ mask, ignoreSensors }` options object.

### Returns

`RaycastHit | null` — Nearest impact information `{ body, point, normal, fraction }`, or `null`.

### Example

```javascript
const hit = scene.raycast(muzzlePos, targetPos, 0x0004);
if (hit) {
  console.log('Struck', hit.body, 'at', hit.point, 'normal', hit.normal);
}
```

---

## Scene.raycastAll()

Cast a segment from start to end and return all intersected bodies, sorted by fraction ascending.

```typescript
raycastAll(start: Vec2, end: Vec2, optionsOrMask?: number | RaycastOptions): RaycastHit[]
```

### Parameters

- `start` — `Vec2`. Starting point of the segment.
- `end` — `Vec2`. Ending point of the segment.
- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask or options object.

### Returns

`RaycastHit[]` — Array of all impacts sorted nearest-first.

### Example

```javascript
const hits = scene.raycastAll(start, end, { ignoreSensors: true });
```

---

## Scene.setCcdSubSteps()

Set maximum Continuous Collision Detection (CCD) substeps per frame for fast-moving bullet bodies (default `3`).

```typescript
setCcdSubSteps(subSteps: number): void
```

### Parameters

- `subSteps` — `number`. Maximum number of CCD substeps (minimum 1).

### Returns

`void`

### Example

```javascript
scene.setCcdSubSteps(4);
```

---

## Scene.getCcdSubSteps()

Get current maximum CCD substeps per frame.

```typescript
getCcdSubSteps(): number
```

### Returns

`number`

---

## Scene.sweepBody()

Sweep a moving rigid body along a line segment against all obstacles in the scene and return the nearest impact, or null if clear.

```typescript
sweepBody(start: Vec2, end: Vec2, movingBody: Physics, optionsOrMask?: number | RaycastOptions): RaycastHit | null
```

### Parameters

- `start` — `Vec2`. Starting position.
- `end` — `Vec2`. Target position.
- `movingBody` — `Physics`. Body being swept.
- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask or options object.

### Returns

`RaycastHit | null`

### Example

```javascript
const hit = scene.sweepBody(startPos, endPos, bullet);
```

---

## Scene.sweepBodyAll()

Sweep a moving rigid body along a line segment and return all intersected obstacles, sorted by impact fraction ascending.

```typescript
sweepBodyAll(start: Vec2, end: Vec2, movingBody: Physics, optionsOrMask?: number | RaycastOptions): RaycastHit[]
```

### Parameters

- `start` — `Vec2`. Starting position.
- `end` — `Vec2`. Target position.
- `movingBody` — `Physics`. Body being swept.
- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask or options object.

### Returns

`RaycastHit[]`

### Example

```javascript
const hits = scene.sweepBodyAll(startPos, endPos, bullet);
```

---

## Scene.queryPoint()

Find all active bodies in the scene containing a point in world coordinates.

```typescript
queryPoint(point: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics[]
```

### Parameters

- `point` — `Vec2`. Query point in world coordinates.
- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or `{ mask, ignoreSensors }` options object.

### Returns

`Physics[]` — Array of matching bodies containing the point.

### Example

```javascript
const clickedBodies = scene.queryPoint(mouseWorldPos);
```

---

## Scene.queryPointFirst()

Find the first active body in the scene containing a point in world coordinates.

```typescript
queryPointFirst(point: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics | null
```

### Parameters

- `point` — `Vec2`. Query point in world coordinates.
- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or options object.

### Returns

`Physics | null` — The first matching body, or `null` if none found.

### Example

```javascript
const hoveredBody = scene.queryPointFirst(mouseWorldPos);
```

---

## Scene.queryCircle()

Find all active bodies in the scene overlapping a circle (e.g. area-of-effect blast or proximity check).

```typescript
queryCircle(center: Vec2, radius: number, optionsOrMask?: number | SpatialQueryOptions): Physics[]
```

### Parameters

- `center` — `Vec2`. Circle center in world coordinates.
- `radius` — `number`. Circle radius.
- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or options object.

### Returns

`Physics[]` — Array of matching bodies overlapping the circle.

### Example

```javascript
const blastedEnemies = scene.queryCircle(explosionPos, 150, { mask: ENEMY_CATEGORY });
```

---

## Scene.queryCircleFirst()

Find the first active body in the scene overlapping a circle.
@param center - Circle center in world coordinates.
@param radius - Circle radius.
@param optionsOrMask - Optional category bitmask or query options.
@returns The first matching body, or null if none found.

```typescript
queryCircleFirst(center: Vec2, radius: number, optionsOrMask?: number | SpatialQueryOptions): Physics | null
```

---

## Scene.queryAabb()

Find all active bodies in the scene overlapping an Axis-Aligned Bounding Box (AABB) (e.g. selection marquee or camera frustum).

```typescript
queryAabb(min: Vec2, max: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics[]
```

### Parameters

- `min` — `Vec2`. Minimum corner (or first corner).
- `max` — `Vec2`. Maximum corner (or second corner).
- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or options object.

### Returns

`Physics[]` — Array of matching bodies overlapping the AABB.

### Example

```javascript
const selectedUnits = scene.queryAabb(dragStart, dragEnd);
```

---

## Scene.queryAabbFirst()

Find the first active body in the scene overlapping an Axis-Aligned Bounding Box (AABB).
@param min - Minimum corner (or first corner).
@param max - Maximum corner (or second corner).
@param optionsOrMask - Optional category bitmask or query options.
@returns The first matching body, or null if none found.

```typescript
queryAabbFirst(min: Vec2, max: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics | null
```
