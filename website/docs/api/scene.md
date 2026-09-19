# Scene

The main spatial world manager and collision resolution orchestrator.

`Scene` holds rigid bodies, manages world gravity, coordinates spatial hash grid broad-phase bucketing, advances positions across physics timesteps, and resolves pairwise collisions using configurable constraint solver iterations.

```javascript
import { Scene, Physics, Grid, Vec2 } from '@1pizzateam/bumpr';

const scene = new Scene();
scene.setGravity(0, 300);

const ball = new Physics('circle', 20, undefined, 100, 50, 1.0);
ball.setVelocity(50, 0);
scene.addBody(ball);

// Optional: attach spatial hashing grid
scene.setGrid(new Grid(new Vec2(0, 0), new Vec2(800, 600), new Vec2(8, 6)));

// In your render/game loop:
function tick(dt) {
  scene.update(dt);
  scene.test();
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
const ball = new Physics('circle', 15, undefined, 50, 50, 1.0);
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
import { Grid, Vec2 } from '@1pizzateam/bumpr';

scene.setGrid(new Grid(new Vec2(0, 0), new Vec2(1000, 1000), new Vec2(10, 10)));
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
setGravity(x: number, y: number): void
```

### Parameters

- `x` — `number`. Horizontal gravity acceleration.
- `y` — `number`. Vertical gravity acceleration.

### Returns

`void`

### Example

```javascript
scene.setGravity(0, 980); // Earth gravity in px/s²
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
