import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const docsRoot = path.resolve(root, 'website/docs/api');

const modules = [
  ['Scene', 'scene.ts', 'scene.md'],
  ['Physics', 'physics.ts', 'physics.md'],
  ['CollisionDetection', 'collision.ts', 'collision.md'],
  ['Raycast', 'raycast.ts', 'raycast.md'],
  ['DistanceConstraint', 'constraint.ts', 'constraint.md'],
  ['CircleVSCircle', 'collisions/circlevscircle.ts', 'circlevscircle.md'],
  ['CircleVSAabb', 'collisions/circlevsaabb.ts', 'circlevsaabb.md'],
  ['AabbVSAabb', 'collisions/aabbvsaabb.ts', 'aabbvsaabb.md'],
];

const intros = {
  Scene: {
    summary: 'The main spatial world manager and collision resolution orchestrator.',
    body: [
      '`Scene` holds rigid bodies, manages world gravity, coordinates spatial hash grid broad-phase bucketing, advances positions across physics timesteps, and resolves pairwise collisions using configurable constraint solver iterations.',
    ],
    example: `import { Scene, Physics } from '@1pizzateam/bumpr';
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
}`,
    members: {
      constructor: {
        description: 'Create a new physics `Scene` instance.',
        returns: 'A new `Scene` instance.',
        example: `import { Scene } from '@1pizzateam/bumpr';\n\nconst scene = new Scene();`,
      },
      addBody: {
        description: 'Add a `Physics` rigid body into the simulation scene.',
        params: ['- `body` — `Physics`. The rigid body instance to add.'],
        returns: '`boolean` — `true` if successfully added, `false` if already in a scene.',
        example: `const ball = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(30, 30), 1.0, 1.0, 0.5, 'circle');\nscene.addBody(ball);`,
      },
      removeBody: {
        description: 'Remove a `Physics` body from the scene in O(1) time using swap-with-last.',
        params: ['- `body` — `Physics`. The rigid body instance to remove.'],
        returns: '`boolean` — `true` if removed, `false` if not found in this scene.',
        example: `scene.removeBody(ball);`,
      },
      clear: {
        description: 'Remove all bodies from the scene, reset scene IDs, and empty active spatial grid buckets.',
        returns: '`void`',
        example: `scene.clear();`,
      },
      setGrid: {
        description: 'Attach a Spock spatial hashing `Grid` for broad-phase collision culling.',
        params: ['- `grid` — `Grid | null`. Spatial grid or `null` to disable grid broad-phase.'],
        returns: '`void`',
        example: `import { Grid, Vec2 } from '@1pizzateam/spock';\n\nscene.setGrid(new Grid(new Vec2(1000, 1000), 10));`,
      },
      getGrid: {
        description: 'Get the currently attached Spock `Grid`, or `null` if broad-phase grid is not set.',
        returns: '`Grid | null`',
        example: `const grid = scene.getGrid();`,
      },
      setGravity: {
        description: 'Set global scene gravity vector and propagate to all current member bodies.',
        params: ['- `gravity` — `Vec2`. Gravity acceleration vector.'],
        returns: '`void`',
        example: `scene.setGravity(new Vec2(0, 980)); // Earth gravity in px/s²`,
      },
      update: {
        description: 'Advance position and apply forces/damping on all active dynamic bodies in the scene.',
        params: ['- `second` — `number`. Delta time elapsed in seconds.'],
        returns: '`void`',
        example: `scene.update(1 / 60);`,
      },
      test: {
        description: 'Detect and resolve collisions between all bodies in the scene across solver iterations.',
        returns: '`void`',
        example: `scene.test();`,
      },
      testScene: {
        description: 'Detect and resolve collisions between bodies in this scene against bodies in an external scene.',
        params: ['- `scene` — `Scene`. The second physics scene to test against.'],
        returns: '`void`',
        example: `sceneA.testScene(sceneB);`,
      },
      setIteration: {
        description: 'Set number of constraint solver iterations per step (default `1`). Higher iterations increase stacking stability.',
        params: ['- `iteration` — `number`. Number of collision solver iterations.'],
        returns: '`void`',
        example: `scene.setIteration(4);`,
      },
      setOnCollision: {
        description: 'Set callback invoked when any physical collision occurs in the scene.',
        params: ['- `callback` — `((bodyA: Physics, bodyB: Physics, normal: Vec2, impulse: Vec2) => void) | null`. Collision callback function.'],
        returns: '`void`',
        example: `scene.setOnCollision((a, b, normal, impulse) => {\n  console.log('Impact impulse:', impulse.getMagnitude());\n});`,
      },
      getOnCollision: {
        description: 'Get current scene collision callback.',
        returns: '`SceneCollisionCallback | null`',
      },
      addCollisionListener: {
        description: 'Add an additional collision listener for this scene.',
        params: ['- `listener` — `SceneCollisionCallback`. Collision listener function.'],
        returns: '`void`',
      },
      removeCollisionListener: {
        description: 'Remove a previously registered scene collision listener.',
        params: ['- `listener` — `SceneCollisionCallback`. Collision listener function.'],
        returns: '`boolean` — `true` if listener was found and removed.',
      },
      clearCollisionListeners: {
        description: 'Remove all registered scene collision listeners.',
        returns: '`void`',
      },
      draw: {
        description: 'Render all active bodies in the scene to a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target 2D canvas rendering context.',
          '- `fillColor` — `string`. Body interior fill style.',
          '- `strokeColor` — `string`. Body contour stroke style.',
          '- `strokeWidth` — `number`. Contour stroke thickness.',
        ],
        returns: '`void`',
        example: `scene.draw(ctx, '#f8f9fa', '#ff6b6b', 2);`,
      },
      drawGrid: {
        description: 'Render the attached spatial broad-phase grid lines on a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target 2D canvas rendering context.',
          '- `strokeColor` — `string`. Grid line stroke style.',
          '- `strokeWidth` — `number`. Grid line stroke thickness.',
        ],
        returns: '`void`',
        example: `scene.drawGrid(ctx, 'rgba(255,255,255,0.1)', 1);`,
      },
      addConstraint: {
        description: 'Add a `DistanceConstraint` into the scene. Disables mutual collision between connected bodies if `collideConnected = false`.',
        params: ['- `constraint` — `DistanceConstraint`. The constraint to add.'],
        returns: '`boolean` — `true` if added, `false` if already in the scene.',
        example: `scene.addConstraint(rod);`,
      },
      removeConstraint: {
        description: 'Remove a `DistanceConstraint` from the scene and restores collision between connected bodies.',
        params: ['- `constraint` — `DistanceConstraint`. The constraint to remove.'],
        returns: '`boolean` — `true` if found and removed.',
        example: `scene.removeConstraint(rod);`,
      },
      getConstraints: {
        description: 'Get array of all constraints registered in the scene.',
        returns: '`DistanceConstraint[]`',
      },
      getConstraintsCount: {
        description: 'Get the total number of constraints in the scene.',
        returns: '`number`',
      },
      clearConstraints: {
        description: 'Remove all constraints and restore collisions between all connected bodies.',
        returns: '`void`',
      },
      solveConstraints: {
        description: 'Solve all active constraints by projecting positions and damping normal relative velocities.',
        returns: '`void`',
      },
      drawConstraints: {
        description: 'Render all active constraints in the scene onto a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target canvas context.',
          '- `strokeColor` — `string` (optional, default `"#888888"`). Line stroke style.',
          '- `strokeWidth` — `number` (optional, default `2`). Line width.',
        ],
        returns: '`void`',
      },
      raycast: {
        description: 'Cast a segment from start to end through the scene and return the closest hit, or null if nothing was struck.',
        params: [
          '- `start` — `Vec2`. Starting point of the segment.',
          '- `end` — `Vec2`. Ending point of the segment.',
          '- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask (defaults to `0xFFFF`) or `{ mask, ignoreSensors }` options object.',
        ],
        returns: '`RaycastHit | null` — Nearest impact information `{ body, point, normal, fraction }`, or `null`.',
        example: `const hit = scene.raycast(muzzlePos, targetPos, 0x0004);
if (hit) {
  console.log('Struck', hit.body, 'at', hit.point, 'normal', hit.normal);
}`,
      },
      raycastAll: {
        description: 'Cast a segment from start to end and return all intersected bodies, sorted by fraction ascending.',
        params: [
          '- `start` — `Vec2`. Starting point of the segment.',
          '- `end` — `Vec2`. Ending point of the segment.',
          '- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask or options object.',
        ],
        returns: '`RaycastHit[]` — Array of all impacts sorted nearest-first.',
        example: `const hits = scene.raycastAll(start, end, { ignoreSensors: true });`,
      },
      setCcdSubSteps: {
        description: 'Set maximum Continuous Collision Detection (CCD) substeps per frame for fast-moving bullet bodies (default `3`).',
        params: ['- `subSteps` — `number`. Maximum number of CCD substeps (minimum 1).'],
        returns: '`void`',
        example: `scene.setCcdSubSteps(4);`,
      },
      getCcdSubSteps: {
        description: 'Get current maximum CCD substeps per frame.',
        returns: '`number`',
      },
      sweepBody: {
        description: 'Sweep a moving rigid body along a line segment against all obstacles in the scene and return the nearest impact, or null if clear.',
        params: [
          '- `start` — `Vec2`. Starting position.',
          '- `end` — `Vec2`. Target position.',
          '- `movingBody` — `Physics`. Body being swept.',
          '- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask or options object.',
        ],
        returns: '`RaycastHit | null`',
        example: `const hit = scene.sweepBody(startPos, endPos, bullet);`,
      },
      sweepBodyAll: {
        description: 'Sweep a moving rigid body along a line segment and return all intersected obstacles, sorted by impact fraction ascending.',
        params: [
          '- `start` — `Vec2`. Starting position.',
          '- `end` — `Vec2`. Target position.',
          '- `movingBody` — `Physics`. Body being swept.',
          '- `optionsOrMask` — `number | RaycastOptions` (optional). Category bitmask or options object.',
        ],
        returns: '`RaycastHit[]`',
        example: `const hits = scene.sweepBodyAll(startPos, endPos, bullet);`,
      },
      setFixedDeltaTime: {
        description: 'Configure the fixed simulation delta time for deterministic stepping (default `1 / 60`).',
        params: ['- `dt` — `number`. Fixed delta time in seconds (minimum `0.0001`).'],
        returns: '`void`',
        example: `scene.setFixedDeltaTime(1 / 120);`,
      },
      getFixedDeltaTime: {
        description: 'Get current fixed simulation delta time in seconds.',
        returns: '`number`',
      },
      setMaxSubSteps: {
        description: 'Set maximum sub-steps per frame to prevent the spiral of death during heavy lag spikes (default `5`).',
        params: ['- `maxSubSteps` — `number`. Maximum discrete simulation steps per frame (minimum `1`).'],
        returns: '`void`',
        example: `scene.setMaxSubSteps(8);`,
      },
      getMaxSubSteps: {
        description: 'Get maximum sub-steps per frame.',
        returns: '`number`',
      },
      getAccumulator: {
        description: 'Get accumulated residual frame delta time waiting for the next fixed simulation step.',
        returns: '`number`',
      },
      resetAccumulator: {
        description: 'Reset the residual accumulated frame delta time back to zero.',
        returns: '`void`',
      },
      getAlpha: {
        description: 'Get the interpolation fraction alpha between 0.0 and 1.0 representing progress between the previous and next fixed physics tick. Ideal for renderer frame interpolation on variable refresh monitors.',
        returns: '`number` — Normalized fraction `accumulator / fixedDeltaTime` in `[0, 1)`.',
        example: `const alpha = scene.getAlpha(); // use to interpolate render positions`,
      },
      step: {
        description: 'Advance physics simulation using a deterministic fixed-timestep accumulator. Consumes delta time in discrete chunks of fixedDeltaTime, calling update() and test(). Clamps accumulated time to prevent spiral of death.',
        params: ['- `deltaTime` — `number`. Elapsed frame delta time in seconds (e.g. from requestAnimationFrame).'],
        returns: '`number` — Number of fixed physics sub-steps executed this call.',
        example: `// In your game/render loop:
function tick(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  const subSteps = scene.step(dt);
  // Optional: interpolate rendering using scene.getAlpha()
  requestAnimationFrame(tick);
}`,
      },
      queryPoint: {
        description: 'Find all active bodies in the scene containing a point in world coordinates.',
        params: [
          '- `point` — `Vec2`. Query point in world coordinates.',
          '- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or `{ mask, ignoreSensors }` options object.',
        ],
        returns: '`Physics[]` — Array of matching bodies containing the point.',
        example: `const clickedBodies = scene.queryPoint(mouseWorldPos);`,
      },
      queryPointFirst: {
        description: 'Find the first active body in the scene containing a point in world coordinates.',
        params: [
          '- `point` — `Vec2`. Query point in world coordinates.',
          '- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or options object.',
        ],
        returns: '`Physics | null` — The first matching body, or `null` if none found.',
        example: `const hoveredBody = scene.queryPointFirst(mouseWorldPos);`,
      },
      queryCircle: {
        description: 'Find all active bodies in the scene overlapping a circle (e.g. area-of-effect blast or proximity check).',
        params: [
          '- `center` — `Vec2`. Circle center in world coordinates.',
          '- `radius` — `number`. Circle radius.',
          '- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or options object.',
        ],
        returns: '`Physics[]` — Array of matching bodies overlapping the circle.',
        example: `const blastedEnemies = scene.queryCircle(explosionPos, 150, { mask: ENEMY_CATEGORY });`,
      },
      queryAabb: {
        description: 'Find all active bodies in the scene overlapping an Axis-Aligned Bounding Box (AABB) (e.g. selection marquee or camera frustum).',
        params: [
          '- `min` — `Vec2`. Minimum corner (or first corner).',
          '- `max` — `Vec2`. Maximum corner (or second corner).',
          '- `optionsOrMask` — `number | SpatialQueryOptions` (optional). Category bitmask or options object.',
        ],
        returns: '`Physics[]` — Array of matching bodies overlapping the AABB.',
        example: `const selectedUnits = scene.queryAabb(dragStart, dragEnd);`,
      },
    },
  },
  Physics: {
    summary: 'A 2D rigid body with mass, velocity, acceleration, restitution, damping, and geometry.',
    body: [
      '`Physics` pairs physical dynamics (Newtonian integration, forces, velocity damping, and coefficient of restitution) with geometric primitives (`Circ` or `Rect`) from Spock.js.',
      'A mass of `0` denotes a static, immovable obstacle (`inverseMass = 0`), which absorbs collisions without being pushed back.',
    ],
    example: `import { Physics } from '@1pizzateam/bumpr';
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
);`,
    members: {
      constructor: {
        description: 'Create a new `Physics` body with vector-first arguments.',
        params: [
          '- `position` — `Vec2`. Initial position (default `new Vec2()`).',
          '- `velocity` — `Vec2`. Initial velocity in px/s (default `new Vec2()`).',
          '- `size` — `Vec2`. Bounding dimensions (width, height; default `new Vec2(20, 20)`). For circles, radius is `size.x * 0.5`.',
          '- `mass` — `number`. Body mass in kg (default `1.0`). `0` marks a static body.',
          '- `damping` — `number`. Air resistance / velocity damping per second in `[0, 1]` (default `0.8`).',
          '- `restitution` — `number`. Bounciness in `[0, 1]` (default `0`).',
          "- `shape` — `'circle' | 'aabb' | 'rectangle'`. Collision geometry (default `'circle'`).",
          '- `friction` — `number` (optional). Coulomb friction coefficient in `[0, 1]` (defaults to `0` for circle, `0.6` for AABB).',
          '- `isSensor` — `boolean` (optional). Whether this body acts as a sensor/trigger collider (default `false`).',
          '- `collisionCategory` — `number` (optional). Bitfield category for collision filtering (default `0x0001`).',
          '- `collisionMask` — `number` (optional). Bitfield mask of categories this body can collide with (default `0xFFFF`).',
          '- `collisionGroup` — `number` (optional). Group index for override filtering (negative never collides, positive always collides; default `0`).',
        ],
        returns: 'A new `Physics` instance.',
      },
      updatePosition: {
        description: 'Integrate accumulated impulses, apply velocity damping, and update geometric shape position.',
        params: ['- `second` — `number`. Timestep elapsed in seconds.'],
        returns: '`void`',
      },
      applyImpulse: {
        description: 'Apply an instantaneous linear velocity impulse vector to the body.',
        params: ['- `impulse` — `Vec2`. Impulse vector in px·kg/s.'],
        returns: '`void`',
      },
      applyVelocity: {
        description: 'Directly modify the body velocity vector.',
        params: ['- `velocity` — `Vec2`. Velocity offset vector.'],
        returns: '`void`',
      },
      correctPosition: {
        description: 'Directly translate the body position (used for positional penetration de-penetration).',
        params: ['- `correction` — `Vec2`. Translation correction vector.'],
        returns: '`void`',
      },
      setPosition: {
        description: 'Explicitly set the body position vector.',
        params: ['- `position` — `Vec2`. New position vector.'],
        returns: '`void`',
      },
      setVelocity: {
        description: 'Explicitly set linear velocity vector.',
        params: ['- `velocity` — `Vec2`. New velocity vector.'],
        returns: '`void`',
      },
      setInitialVelocity: {
        description: 'Record reference initial velocity for subsequent `reset()` calls.',
        params: ['- `velocity` — `Vec2`. Initial velocity vector.'],
        returns: '`void`',
      },
      setGravity: {
        description: 'Set custom gravity acceleration vector for this body.',
        params: ['- `gravity` — `Vec2`. Gravity vector.'],
        returns: '`void`',
      },
      setMass: {
        description: 'Set body mass. Sets `inverseMass = 1 / mass` (or `0` when `mass = 0`). Automatically syncs `bodyType` to `static`/`kinematic` if mass is 0, or `dynamic` if mass > 0.',
        params: ['- `mass` — `number`. Body mass in kg.'],
        returns: '`void`',
      },
      getMass: {
        description: 'Get body mass.',
        returns: '`number` — Current mass.',
      },
      setBodyType: {
        description: 'Set explicit rigid body type (`dynamic` | `static` | `kinematic`). Configures mass and velocity constraints accordingly.',
        params: ['- `type` — `BodyType`. Body type (`dynamic`, `static`, or `kinematic`).'],
        returns: '`void`',
        example: `platform.setBodyType('kinematic');`,
      },
      getBodyType: {
        description: 'Get the current rigid body simulation type.',
        returns: '`BodyType` — `\'dynamic\' | \'static\' | \'kinematic\'`.',
      },
      isStatic: {
        description: 'Check whether the body is static (zero inverse mass, zero velocity, immovable).',
        returns: '`boolean`',
      },
      isKinematic: {
        description: 'Check whether the body is kinematic (moves along velocity, unaffected by gravity/forces/impulses).',
        returns: '`boolean`',
      },
      isDynamic: {
        description: 'Check whether the body is dynamic (positive mass, moves under Newtonian physics and collisions).',
        returns: '`boolean`',
      },
      isStationary: {
        description: 'Check whether the body is currently stationary (static, sleeping, or kinematic with zero velocity). Used for broad-phase pruning.',
        returns: '`boolean`',
      },
      setRestitution: {
        description: 'Set coefficient of restitution (bounciness), clamped between `0.0` (inelastic) and `1.0` (elastic).',
        params: ['- `restitution` — `number`. Value in `[0.0, 1.0]`.'],
        returns: '`void`',
      },
      getRestitution: {
        description: 'Get coefficient of restitution.',
        returns: '`number`',
      },
      setFriction: {
        description: 'Set coefficient of Coulomb surface friction, clamped between `0.0` (frictionless) and `1.0` (high friction).',
        params: ['- `friction` — `number`. Friction coefficient in `[0.0, 1.0]`.'],
        returns: '`void`',
      },
      getFriction: {
        description: 'Get coefficient of Coulomb surface friction.',
        returns: '`number`',
      },
      setDamping: {
        description: 'Set linear air drag velocity damping factor (default `1.0` = no damping).',
        params: ['- `damping` — `number`. Value in `[0.0, 1.0]`.'],
        returns: '`void`',
      },
      getDamping: {
        description: 'Get linear velocity damping factor.',
        returns: '`number`',
      },
      setSize: {
        description: 'Update the dimensions of the underlying geometric shape.',
        params: ['- `width` — `number`. Radius if circle, width if AABB.', '- `height` — `number | undefined`. Height if AABB.'],
        returns: '`void`',
      },
      getBody: {
        description: 'Get the underlying Spock geometric shape (`Circ` or `Rect`).',
        returns: '`Circ | Rect`',
      },
      reset: {
        description: 'Reset transient forces, impulses, and revert velocity to initial velocity.',
        returns: '`void`',
      },
      draw: {
        description: 'Render the body onto a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target canvas context.',
          '- `fillColor` — `string`. Interior fill style.',
          '- `strokeColor` — `string`. Contour stroke style.',
          '- `strokeWidth` — `number`. Contour stroke thickness.',
        ],
        returns: '`void`',
      },
      isActive: {
        description: 'Check whether the body is active in simulation.',
        returns: '`boolean`',
      },
      setActive: {
        description: 'Activate body in simulation.',
        returns: '`void`',
      },
      setInactive: {
        description: 'Deactivate body, temporarily skipping physics updates and collisions.',
        returns: '`void`',
      },
      toggleActive: {
        description: 'Toggle active status between enabled and disabled.',
        returns: '`boolean` — New active status.',
      },
      sleep: {
        description: 'Manually put the body to sleep. Zeroes velocity and skips simulation updates until perturbed.',
        returns: '`void`',
      },
      wakeUp: {
        description: 'Awaken the sleeping body, restoring normal integration and broad-phase collision checks.',
        returns: '`void`',
      },
      setCanSleep: {
        description: 'Configure whether this body can automatically go to sleep when idle.',
        params: ['- `canSleep` — `boolean`. Whether sleep is allowed.'],
        returns: '`void`',
      },
      getCanSleep: {
        description: 'Check whether automatic idle sleeping is enabled for this body.',
        returns: '`boolean`',
      },
      getIsSleeping: {
        description: 'Check whether the body is currently sleeping.',
        returns: '`boolean`',
      },
      setSleepThreshold: {
        description: 'Set linear velocity threshold (in px/s) below which the body is considered idle.',
        params: ['- `threshold` — `number`. Speed threshold.'],
        returns: '`void`',
      },
      getSleepThreshold: {
        description: 'Get linear velocity sleep threshold in px/s.',
        returns: '`number`',
      },
      setSleepStepsThreshold: {
        description: 'Set number of consecutive idle steps required before putting the body to sleep.',
        params: ['- `steps` — `number`. Step count threshold.'],
        returns: '`void`',
      },
      getSleepStepsThreshold: {
        description: 'Get consecutive idle steps threshold.',
        returns: '`number`',
      },
      applyForce: {
        description: 'Apply continuous external force vector (resets after step) and awakens the body if sleeping.',
        params: ['- `force` — `Vec2`. Force vector.'],
        returns: '`void`',
      },
      applyImpulseVector: {
        description: 'Apply instantaneous impulse vector and awakens the body if sleeping.',
        params: ['- `impulse` — `Vec2`. Impulse vector.'],
        returns: '`void`',
      },
      setOnCollision: {
        description: 'Set collision callback function for this body.',
        params: ['- `callback` — `((other: Physics, normal: Vec2, impulse: Vec2) => void) | null`. Callback invoked on collision.'],
        returns: '`void`',
        example: `body.setOnCollision((other, normal, impulse) => {\n  console.log('Collided with:', other, 'impulse:', impulse.getMagnitude());\n});`,
      },
      getOnCollision: {
        description: 'Get current collision callback for this body.',
        returns: '`BodyCollisionCallback | null`',
      },
      addCollisionListener: {
        description: 'Add an additional collision listener for this body.',
        params: ['- `listener` — `BodyCollisionCallback`. Collision listener function.'],
        returns: '`void`',
      },
      removeCollisionListener: {
        description: 'Remove a previously registered collision listener from this body.',
        params: ['- `listener` — `BodyCollisionCallback`. Collision listener function.'],
        returns: '`boolean` — `true` if listener was found and removed.',
      },
      clearCollisionListeners: {
        description: 'Remove all registered collision listeners from this body.',
        returns: '`void`',
      },
      setSensor: {
        description: 'Configure this body as a sensor/trigger collider. Sensors detect overlaps and fire collision events without applying positional correction or impulse response.',
        params: ['- `isSensor` — `boolean`. Sensor state.'],
        returns: '`void`',
        example: `coin.setSensor(true);`,
      },
      getSensor: {
        description: 'Get whether this body is configured as a sensor.',
        returns: '`boolean`',
      },
      getIsSensor: {
        description: 'Alias for `getSensor()`.',
        returns: '`boolean`',
      },
      setCollisionCategory: {
        description: 'Set the bitfield category of this body (power of 2, e.g. 0x0002).',
        params: ['- `category` — `number`. Bitfield category integer.'],
        returns: '`void`',
      },
      getCollisionCategory: {
        description: 'Get the bitfield category of this body.',
        returns: '`number`',
      },
      setCollisionMask: {
        description: 'Set the bitfield collision mask defining which categories this body is allowed to collide with.',
        params: ['- `mask` — `number`. Bitfield mask integer.'],
        returns: '`void`',
      },
      getCollisionMask: {
        description: 'Get the bitfield collision mask of this body.',
        returns: '`number`',
      },
      setCollisionGroup: {
        description: 'Set the collision group index (negative never collides with same group, positive always collides with same group, 0 uses category/mask).',
        params: ['- `group` — `number`. Group index integer.'],
        returns: '`void`',
      },
      getCollisionGroup: {
        description: 'Get the collision group index of this body.',
        returns: '`number`',
      },
      canCollideWith: {
        description: 'Check whether this body can collide with another body based on ignored bodies, group indices, and category/mask bitfields.',
        params: ['- `other` — `Physics`. Other body to test.'],
        returns: '`boolean` — `true` if bodies are permitted to collide.',
        example: `if (bullet.canCollideWith(enemy)) { /* ... */ }`,
      },
      ignoreCollisionWith: {
        description: 'Explicitly disable collision detection and resolution with another specific body.',
        params: ['- `other` — `Physics`. Body to ignore.'],
        returns: '`void`',
        example: `bodyA.ignoreCollisionWith(bodyB);`,
      },
      restoreCollisionWith: {
        description: 'Restore collision detection and resolution with a previously ignored body.',
        params: ['- `other` — `Physics`. Body to restore collision with.'],
        returns: '`void`',
        example: `bodyA.restoreCollisionWith(bodyB);`,
      },
      isIgnoringCollisionWith: {
        description: 'Check whether collision with another specific body is currently ignored.',
        params: ['- `other` — `Physics`. Other body to check.'],
        returns: '`boolean` — `true` if ignored.',
      },
      raycast: {
        description: 'Cast a segment from start to end against this body and return hit details if intersected.',
        params: [
          '- `start` — `Vec2`. Starting point of the segment.',
          '- `end` — `Vec2`. Ending point of the segment.',
        ],
        returns: '`RaycastHit | null` — Hit details or `null` if missed or body is inactive.',
        example: `const hit = obstacle.raycast(origin, target);`,
      },
      setBullet: {
        description: 'Enable or disable Continuous Collision Detection (CCD) for this dynamic body to prevent tunneling through thin colliders at high speed.',
        params: ['- `bullet` — `boolean`. Whether this body is simulated with CCD.'],
        returns: '`void`',
        example: `fastProjectile.setBullet(true);`,
      },
      getBullet: {
        description: 'Check whether this body has CCD enabled.',
        returns: '`boolean`',
      },
      getIsBullet: {
        description: 'Alias for `getBullet()`.',
        returns: '`boolean`',
      },
      sweep: {
        description: 'Sweep this body along a line segment from start to end against an obstacle body and return hit information.',
        params: [
          '- `start` — `Vec2`. Starting point.',
          '- `end` — `Vec2`. Target point.',
          '- `other` — `Physics`. Obstacle body to test against.',
        ],
        returns: '`RaycastHit | null`',
        example: `const hit = bullet.sweep(startPos, endPos, wall);`,
      },
      containsPoint: {
        description: 'Test whether a point in world coordinates is inside this active body.',
        params: ['- `point` — `Vec2`. World coordinate query point.'],
        returns: '`boolean` — `true` if the point is inside the body.',
        example: `const isHovered = player.containsPoint(mouseWorldPos);`,
      },
      overlapsCircle: {
        description: 'Test whether this active body overlaps a circle defined by center and radius.',
        params: [
          '- `center` — `Vec2`. Circle center in world coordinates.',
          '- `radius` — `number`. Circle radius.',
        ],
        returns: '`boolean` — `true` if overlapping.',
        example: `if (enemy.overlapsCircle(blastOrigin, blastRadius)) { /* apply damage */ }`,
      },
      overlapsAabb: {
        description: 'Test whether this active body overlaps an Axis-Aligned Bounding Box (AABB).',
        params: [
          '- `min` — `Vec2`. Minimum corner (or first corner).',
          '- `max` — `Vec2`. Maximum corner (or second corner).',
        ],
        returns: '`boolean` — `true` if overlapping.',
        example: `if (body.overlapsAabb(cameraMin, cameraMax)) { /* render */ }`,
      },
    },
  },
  CollisionDetection: {
    summary: 'Narrow-phase collision detection, positional resolution, and elastic impulse solver.',
    body: [
      '`CollisionDetection` computes penetration vectors between pairs of bodies (`Circle vs Circle`, `Circle vs AABB`, `AABB vs AABB`), separates overlapping bodies along the contact normal according to inverse mass ratios, and computes linear impulse responses.',
    ],
    example: `import { CollisionDetection, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';
 
const a = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(40, 40), 1.0, 1.0, 0.5, 'circle');
const b = new Physics(new Vec2(70, 50), new Vec2(), new Vec2(40, 40), 1.0, 1.0, 0.5, 'aabb');

// Perform full detection + position correction + impulse resolution:
const hasCollided = CollisionDetection.test(a, b);`,
    members: {
      broadphase: {
        description: 'Test whether two bodies share one or more spatial grid cells.',
        params: [
          '- `a` — `Physics`. First body.',
          '- `b` — `Physics`. Second body.',
          '- `grid` — `Grid`. Spock spatial hash grid.',
        ],
        returns: '`boolean` — `true` if bodies share grid cells, `false` otherwise.',
      },
      test: {
        description: 'Execute full collision pipeline: narrow-phase detection, positional resolution, and impulse computation.',
        params: ['- `a` — `Physics`. First body.', '- `b` — `Physics`. Second body.'],
        returns: '`boolean` — `true` if a collision occurred and was resolved.',
      },
      detect: {
        description: 'Compute the penetration vector between two geometric shapes (`Circ | Rect`). Stores result in `this.penetration`.',
        params: ['- `a` — `Circ | Rect`. First shape.', '- `b` — `Circ | Rect`. Second shape.'],
        returns: '`void`',
      },
      resolve: {
        description: 'Perform positional correction by shifting bodies apart along the penetration normal based on relative inverse masses.',
        params: ['- `a` — `Physics`. First body.', '- `b` — `Physics`. Second body.'],
        returns: '`boolean` — `true` if position was corrected, `false` if zero correction.',
      },
      computeImpulse: {
        description: 'Compute and apply normal collision impulse and tangential Coulomb friction based on relative velocity, restitution, friction coefficients, and masses. Stabilizes steady contact with a resting velocity threshold.',
        params: ['- `a` — `Physics`. First body.', '- `b` — `Physics`. Second body.'],
        returns: '`void`',
      },
      applyContactImpulse: {
        description: 'Calculate and apply normal impulse and Coulomb tangential friction between two bodies given a contact normal vector.',
        params: [
          '- `a` — `Physics`. First body.',
          '- `b` — `Physics`. Second body.',
          '- `normal` — `Vec2`. Outward contact normal pointing from b to a.',
          '- `sceneCallback` — `SceneCollisionCallback | null` (optional). Scene callback invoked with collision details.',
        ],
        returns: '`void`',
      },
    },
  },
  Raycast: {
    summary: 'Linear segment raycasting and analytical swept continuous collision detection (CCD).',
    body: [
      '`Raycast` provides analytical ray vs circle intersection, fast slab-method ray vs AABB intersection, and continuous swept tests (`sweepBody`, `sweepCircleCircle`, `sweepCircleAabb`, `sweepAabbAabb`, `sweepAabbCircle`).',
      'It returns impact fraction $t \\in [0, 1]$, world coordinates of the hit point, outward unit normal vector, and struck body reference.',
    ],
    example: `import { Raycast, Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const start = new Vec2(0, 100);
const end = new Vec2(500, 100);

// Scene raycast (returns closest hit)
const hit = scene.raycast(start, end, 0x0004);
if (hit) {
  console.log('Impact at:', hit.point.x, hit.point.y, 'normal:', hit.normal);
}`,
    members: {
      raycastCircle: {
        description: 'Cast a segment against a circular boundary and calculate intersection fraction, hit point, and surface normal.',
        params: [
          '- `start` — `Vec2`. Starting point of the segment.',
          '- `end` — `Vec2`. Ending point of the segment.',
          '- `center` — `Vec2`. Circle center.',
          '- `radius` — `number`. Circle radius.',
        ],
        returns: '`{ fraction: number, point: Vec2, normal: Vec2 } | null`',
      },
      raycastAabb: {
        description: 'Cast a segment against an Axis-Aligned Bounding Box (AABB) using the slab method.',
        params: [
          '- `start` — `Vec2`. Starting point of the segment.',
          '- `end` — `Vec2`. Ending point of the segment.',
          '- `center` — `Vec2`. AABB center.',
          '- `halfSize` — `Vec2`. AABB half-size extents.',
        ],
        returns: '`{ fraction: number, point: Vec2, normal: Vec2 } | null`',
      },
      raycastBody: {
        description: 'Cast a segment against a Physics body instance, respecting active state and shape geometry.',
        params: [
          '- `start` — `Vec2`. Starting point of the segment.',
          '- `end` — `Vec2`. Ending point of the segment.',
          '- `body` — `Physics`. Target body.',
        ],
        returns: '`RaycastHit | null`',
      },
      sweepCircleCircle: {
        description: 'Sweep a moving circle along a line segment against a stationary circle using Minkowski sum expansion.',
        params: [
          '- `start` — `Vec2`. Starting point of the moving circle center.',
          '- `end` — `Vec2`. Target position of the moving circle center.',
          '- `radiusA` — `number`. Radius of moving circle A.',
          '- `centerB` — `Vec2`. Center of target circle B.',
          '- `radiusB` — `number`. Radius of target circle B.',
        ],
        returns: '`{ fraction: number, point: Vec2, normal: Vec2 } | null`',
      },
      sweepCircleAabb: {
        description: 'Sweep a moving circle along a line segment against an Axis-Aligned Bounding Box (AABB) using rounded rectangle Minkowski expansion.',
        params: [
          '- `start` — `Vec2`. Starting point of moving circle center.',
          '- `end` — `Vec2`. Target position of moving circle center.',
          '- `radiusA` — `number`. Radius of moving circle A.',
          '- `centerB` — `Vec2`. Center of target AABB B.',
          '- `halfB` — `Vec2`. Half-extents of target AABB B.',
        ],
        returns: '`{ fraction: number, point: Vec2, normal: Vec2 } | null`',
      },
      sweepAabbAabb: {
        description: 'Sweep a moving AABB along a line segment against a stationary AABB using expanded box raycasting.',
        params: [
          '- `start` — `Vec2`. Starting point of moving AABB center.',
          '- `end` — `Vec2`. Target position of moving AABB center.',
          '- `halfA` — `Vec2`. Half-extents of moving AABB A.',
          '- `centerB` — `Vec2`. Center of target AABB B.',
          '- `halfB` — `Vec2`. Half-extents of target AABB B.',
        ],
        returns: '`{ fraction: number, point: Vec2, normal: Vec2 } | null`',
      },
      sweepAabbCircle: {
        description: 'Sweep a moving AABB along a line segment against a stationary circle.',
        params: [
          '- `start` — `Vec2`. Starting point of moving AABB center.',
          '- `end` — `Vec2`. Target position of moving AABB center.',
          '- `halfA` — `Vec2`. Half-extents of moving AABB A.',
          '- `centerB` — `Vec2`. Center of target circle B.',
          '- `radiusB` — `number`. Radius of target circle B.',
        ],
        returns: '`{ fraction: number, point: Vec2, normal: Vec2 } | null`',
      },
      sweepBody: {
        description: 'Sweep a moving Physics body along a line segment against a target obstacle body.',
        params: [
          '- `start` — `Vec2`. Starting point.',
          '- `end` — `Vec2`. Target point.',
          '- `movingBody` — `Physics`. Body being swept.',
          '- `targetBody` — `Physics`. Target obstacle body.',
        ],
        returns: '`RaycastHit | null`',
      },
    },
  },
  DistanceConstraint: {
    summary: 'Distance constraints, rigid rods, ropes, and damped elastic spring joints connecting rigid bodies.',
    body: [
      '`DistanceConstraint` (also exported as `Joint`) maintains a target distance or allowable distance range between two rigid bodies, using position-based constraint projection (PBD) and relative velocity damping.',
      'It supports rigid rods (`createRod`), inextensible ropes or cables (`createRope`), and damped elastic springs (`createSpring`). Connected bodies disable mutual collision by default (`collideConnected = false`).',
    ],
    example: `import { DistanceConstraint, Joint, Scene, Physics } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const scene = new Scene();
const anchor = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'circle', 0, false, 1, 0xFFFF, 0, 'static');
const bob = new Physics(new Vec2(100, 150), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
scene.addBody(anchor);
scene.addBody(bob);

// Create a pendulum rod connecting anchor and bob:
const pendulum = DistanceConstraint.createRod(anchor, bob, 100);
scene.addConstraint(pendulum);`,
    members: {
      constructor: {
        description: 'Create a new distance constraint between two bodies.',
        params: [
          '- `bodyA` — `Physics`. The first rigid body.',
          '- `bodyB` — `Physics`. The second rigid body.',
          '- `options` — `DistanceConstraintOptions` (optional). Distance, limits, stiffness, damping, local anchors, and collideConnected.',
        ],
        returns: 'A new `DistanceConstraint` instance.',
      },
      createRod: {
        description: 'Factory method creating a rigid rod with fixed distance and stiffness = 1.0.',
        params: [
          '- `bodyA` — `Physics`. The first rigid body.',
          '- `bodyB` — `Physics`. The second rigid body.',
          '- `length` — `number` (optional). Rest length of the rod.',
          '- `options` — `DistanceConstraintOptions` (optional). Additional options.',
        ],
        returns: '`DistanceConstraint`',
      },
      createRope: {
        description: 'Factory method creating a rope or cable that permits slack (minDistance = 0, maxDistance = maxLength).',
        params: [
          '- `bodyA` — `Physics`. The first rigid body.',
          '- `bodyB` — `Physics`. The second rigid body.',
          '- `maxLength` — `number` (optional). Maximum allowable separation length.',
          '- `options` — `DistanceConstraintOptions` (optional). Additional options.',
        ],
        returns: '`DistanceConstraint`',
      },
      createSpring: {
        description: 'Factory method creating an elastic spring with configurable stiffness and damping.',
        params: [
          '- `bodyA` — `Physics`. The first rigid body.',
          '- `bodyB` — `Physics`. The second rigid body.',
          '- `stiffness` — `number` (optional, default `0.2`). Spring stiffness in [0, 1].',
          '- `damping` — `number` (optional, default `0.1`). Oscillation damping in [0, 1].',
          '- `length` — `number` (optional). Rest length.',
          '- `options` — `DistanceConstraintOptions` (optional). Additional options.',
        ],
        returns: '`DistanceConstraint`',
      },
      setDistance: {
        description: 'Set target rest distance and synchronizes minDistance and maxDistance.',
        params: ['- `distance` — `number`. Rest distance in pixels.'],
        returns: '`void`',
      },
      getDistance: {
        description: 'Get current rest distance.',
        returns: '`number`',
      },
      setMinDistance: {
        description: 'Set minimum distance threshold before compression resistance triggers.',
        params: ['- `minDistance` — `number`. Minimum distance.'],
        returns: '`void`',
      },
      getMinDistance: {
        description: 'Get minimum distance threshold.',
        returns: '`number`',
      },
      setMaxDistance: {
        description: 'Set maximum distance threshold before tension resistance triggers.',
        params: ['- `maxDistance` — `number`. Maximum distance.'],
        returns: '`void`',
      },
      getMaxDistance: {
        description: 'Get maximum distance threshold.',
        returns: '`number`',
      },
      setStiffness: {
        description: 'Set constraint stiffness in [0, 1]. 1.0 is rigid, lower values are spring-like.',
        params: ['- `stiffness` — `number`. Stiffness factor.'],
        returns: '`void`',
      },
      getStiffness: {
        description: 'Get constraint stiffness.',
        returns: '`number`',
      },
      setDamping: {
        description: 'Set velocity damping impulse along constraint normal in [0, 1].',
        params: ['- `damping` — `number`. Damping factor.'],
        returns: '`void`',
      },
      getDamping: {
        description: 'Get constraint damping.',
        returns: '`number`',
      },
      setActive: {
        description: 'Enable or disable this constraint in simulation steps.',
        params: ['- `active` — `boolean`. Active state.'],
        returns: '`void`',
      },
      isActive: {
        description: 'Get whether this constraint is active.',
        returns: '`boolean`',
      },
      getWorldAnchorA: {
        description: 'Calculate world-space position of anchor A.',
        params: ['- `out` — `Vec2` (optional). Destination vector to store result.'],
        returns: '`Vec2` — World anchor position.',
      },
      getWorldAnchorB: {
        description: 'Calculate world-space position of anchor B.',
        params: ['- `out` — `Vec2` (optional). Destination vector to store result.'],
        returns: '`Vec2` — World anchor position.',
      },
      getCurrentDistance: {
        description: 'Calculate current world distance between anchor points.',
        returns: '`number` — Distance in pixels.',
      },
      solve: {
        description: 'Project positions and apply velocity damping impulses along constraint normal.',
        returns: '`void`',
      },
      draw: {
        description: 'Render the constraint line between anchor points onto a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target canvas context.',
          '- `strokeColor` — `string` (optional, default `"#888888"`). Line color.',
          '- `strokeWidth` — `number` (optional, default `2`). Line width in pixels.',
        ],
        returns: '`void`',
      },
    },
  },
  CircleVSCircle: {
    summary: 'Narrow-phase detection and penetration calculation between two circles.',
    body: [
      '`CircleVSCircle` calculates Euclidean separation between circle centers, detects radial overlaps, handles concentric zero-distance edge cases, and returns outward penetration vectors.',
    ],
    example: `import { CircleVSCircle } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const posA = new Vec2(100, 100);
const posB = new Vec2(120, 100);

const penetration = CircleVSCircle.detect(posA, 15, posB, 15);
console.log(penetration.isOrigin()); // false (colliding, 10px overlap)`,
    members: {
      detect: {
        description: 'Test collision and compute penetration between two circles.',
        params: [
          '- `apos` — `Vec2`. Center position of Circle A.',
          '- `radiusA` — `number`. Radius of Circle A.',
          '- `bpos` — `Vec2`. Center position of Circle B.',
          '- `radiusB` — `number`. Radius of Circle B.',
        ],
        returns: '`Vec2` — Outward penetration vector (origin vector if no collision).',
      },
      getPenetration: {
        description: 'Calculate normalized penetration vector from squared distance and combined radii.',
        params: [
          '- `rr` — `number`. Sum of circle radii (`radiusA + radiusB`).',
          '- `dSq` — `number`. Squared distance between centers.',
        ],
        returns: '`Vec2` — Penetration vector.',
      },
    },
  },
  CircleVSAabb: {
    summary: 'Narrow-phase detection between a Circle and an Axis-Aligned Bounding Box (AABB).',
    body: [
      '`CircleVSAabb` computes the closest clamped point on the AABB to the circle center. For external collisions (faces and corners), it projects outward radially; for internal penetration, it projects along the shallowest axis.',
    ],
    example: `import { CircleVSAabb } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const circlePos = new Vec2(50, 40);
const circleRadius = 15;
const boxPos = new Vec2(70, 40);
const boxHalfSize = new Vec2(20, 20);

const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);`,
    members: {
      detect: {
        description: 'Test collision and compute penetration between Circle A and AABB B.',
        params: [
          '- `apos` — `Vec2`. Circle center.',
          '- `radiusA` — `number`. Circle radius.',
          '- `bpos` — `Vec2`. AABB center.',
          '- `bhs` — `Vec2`. AABB half-size vector (half-width, half-height).',
        ],
        returns: '`Vec2` — Penetration vector.',
      },
      getPenetration: {
        description: 'Compute penetration vector from distance to closest clamped point or internal shallowest axis overlap.',
        params: [
          '- `radiusA` — `number`. Circle radius.',
          '- `dx` — `number`. Delta X from clamped point (or relative X if inside).',
          '- `dy` — `number`. Delta Y from clamped point (or relative Y if inside).',
          '- `distSq` — `number` (optional, default `0`). Squared distance to clamped point.',
          '- `bhs` — `Vec2` (optional). AABB half-size vector for internal overlap resolution.',
        ],
        returns: '`Vec2` — Outward penetration vector.',
        example: `const pen = CircleVSAabb.getPenetration(15, 3, 4, 25);`,
      },
    },
  },
  AabbVSAabb: {
    summary: 'Narrow-phase detection between two Axis-Aligned Bounding Boxes (AABB vs AABB).',
    body: [
      '`AabbVSAabb` computes overlapping intervals along the horizontal and vertical axes, checks for positive overlap, and returns the minimum translation vector along the shallowest axis.',
    ],
    example: `import { AabbVSAabb } from '@1pizzateam/bumpr';
import { Vec2 } from '@1pizzateam/spock';

const posA = new Vec2(40, 40);
const halfSizeA = new Vec2(20, 20);
const posB = new Vec2(60, 40);
const halfSizeB = new Vec2(20, 20);

const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);`,
    members: {
      detect: {
        description: 'Test collision and compute penetration between AABB A and AABB B.',
        params: [
          '- `apos` — `Vec2`. Center of box A.',
          '- `ahs` — `Vec2`. Half-size of box A.',
          '- `bpos` — `Vec2`. Center of box B.',
          '- `bhs` — `Vec2`. Half-size of box B.',
        ],
        returns: '`Vec2` — Minimum translation penetration vector.',
      },
      getPenetration: {
        description: 'Isolate shallowest projection axis and negate direction if necessary.',
        returns: '`Vec2`',
      },
    },
  },
};

function jsDoc(node, source) {
  const ranges = ts.getLeadingCommentRanges(source.text, node.getFullStart()) ?? [];
  const comment = ranges
    .map(range => source.text.slice(range.pos, range.end))
    .reverse()
    .find(value => value.startsWith('/**'));
  return comment
    ? comment.replace(/^\/\*\*\s?|\s?\*\/$/g, '').replace(/^\s*\*\s?/gm, '').trim()
    : '';
}

function parameterInfo(parameter, source) {
  return {
    name: parameter.name.getText(source),
    type: parameter.type?.getText(source) ?? 'unknown',
    optional: Boolean(parameter.questionToken || parameter.initializer),
  };
}

function publicApi(exportName, sourcePath) {
  const text = fs.readFileSync(sourcePath, 'utf8');
  const source = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const entries = [];

  for (const statement of source.statements) {
    if (ts.isClassDeclaration(statement) && statement.name?.text === exportName) {
      for (const member of statement.members) {
        if (member.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword)) continue;
        if (ts.isConstructorDeclaration(member)) {
          entries.push({
            name: 'constructor',
            signature: `new ${exportName}(${member.parameters.map(p => p.getText(source)).join(', ')})`,
            params: member.parameters.map(p => parameterInfo(p, source)),
            returns: exportName,
            description: jsDoc(member, source),
          });
        } else if (ts.isMethodDeclaration(member) && member.name) {
          const name = member.name.getText(source);
          const returns = member.type?.getText(source) ?? 'void';
          entries.push({
            name,
            signature: `${name}(${member.parameters.map(p => p.getText(source)).join(', ')}): ${returns}`,
            params: member.parameters.map(p => parameterInfo(p, source)),
            returns,
            description: jsDoc(member, source),
          });
        }
      }
      return entries;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.name.getText(source) === exportName && declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
          for (const prop of declaration.initializer.properties) {
            if (ts.isMethodDeclaration(prop) && prop.name) {
              const name = prop.name.getText(source);
              const returns = prop.type?.getText(source) ?? 'void';
              entries.push({
                name,
                signature: `${name}(${prop.parameters.map(p => p.getText(source)).join(', ')}): ${returns}`,
                params: prop.parameters.map(p => parameterInfo(p, source)),
                returns,
                description: jsDoc(prop, source),
              });
            }
          }
          return entries;
        }
      }
    }
  }
  return entries;
}

if (!fs.existsSync(docsRoot)) {
  fs.mkdirSync(docsRoot, { recursive: true });
}

for (const [exportName, sourceFile, docFile] of modules) {
  const api = publicApi(exportName, path.join(root, 'src', sourceFile));
  const intro = intros[exportName];
  if (!intro) continue;

  let markdown = `# ${exportName}

${intro.summary}

${intro.body.join('\n\n')}

\`\`\`javascript
${intro.example}
\`\`\`
`;

  for (const entry of api) {
    const meta = intro.members?.[entry.name] || {};
    const title = entry.name === 'constructor' ? '## Constructor' : `## ${exportName}.${entry.name}()`;
    markdown += `
---

${title}

${meta.description || entry.description || ''}

\`\`\`typescript
${entry.signature}
\`\`\`
`;

    if (meta.params?.length) {
      markdown += `
### Parameters

${meta.params.join('\n')}
`;
    }

    if (meta.returns) {
      markdown += `
### Returns

${meta.returns}
`;
    }

    if (meta.example) {
      markdown += `
### Example

\`\`\`javascript
${meta.example}
\`\`\`
`;
    }
  }

  fs.writeFileSync(path.join(docsRoot, docFile), markdown.trimStart());
}

console.log('API documentation generated successfully with code usage samples.');
