Version 1.0.0 (September 25th 2026)
-----------------------------
 * Update 1pizzateam/spock dependency to v4.2.0
 * Modernized to TypeScript and ES6 modules
 * Integrated with Spock.js modern geometry and vector engine (Spock 4.2.0)
 * Pure zero-allocation vector arithmetic across all collision solvers and physics routines:
   - Replaced intermediate `.copy()` and mutation calls with target operations (`clampToExtentVectors`, `subVectors`, `scaleVector`, `projectToMinAxis`, etc.)
   - Replaced separate per-body circle extent scratch vectors with `Circ.halfSize` from Spock.js
   - Simplified `Physics.overlapsAabb` by leveraging `overlapsBounds` on `Circ` and `Rect`, removing redundant scratch vectors
   - Delegated 2D geometric segment raycasting in `Physics.raycast`, `Raycast.raycastBody`, `Raycast.raycastCircle`, and `Raycast.raycastAabb` directly to `Circ.raycast` and `Rect.raycast` in Spock.js
   - Simplified `Physics` constructor and `Physics.setSize` using vector-first `new Rect(size, pos)`, `new Circ(radius, pos)`, and `Rect.setSize(Vec2)`
   - Optimized Coulomb friction clamping in `CollisionDetection.computeImpulse` using `Utils.clampToExtent`
   - Simplified normal direction calculation in `DistanceConstraint.solve` using `Vec2.normalizeVector` with fallback normal
   - Upgraded `CircleVSAabb.getPenetration` to be vector-first, accepting `delta: Vec2` directly alongside legacy `dx, dy` scalars, with zero-allocation `scaleVector` and `projectToMinAxis` shallowest-axis exit
   - Adopted Spock.js `Accumulator` in `Scene.step()` for deterministic fixed-timestep game loops and alpha interpolation without duplicated state
 * Vector-first `Physics` constructor accepting `Vec2` instances directly for `position`, `velocity`, and `size`: `new Physics(position, velocity, size, mass, damping, restitution, shape, friction)`
 * Pure vector-first physics API (`setPosition`, `setVelocity`, `setInitialVelocity`, `setGravity` accept `Vec2`)
 * Zero-allocation positional de-penetration via `body.translate()`
 * Zero-iterator collision passes in `Scene.testScene()` using indexed loops
 * Spatial hash grid broad-phase partitioning with `Grid`
 * Added 2D Coulomb tangential friction impulse solver (`CollisionDetection.computeImpulse`) to arrest relative sliding between flat surfaces
 * Added `friction` property, `getFriction()`, and `setFriction()` to `Physics` (defaults to 0.6 for AABB/rectangle, 0.0 for circles)
 * Added resting contact velocity threshold to prevent micro-bouncing jitter and maintain continuous resting contact between stacked bodies
 * Fixed impulse solver in `CollisionDetection.computeImpulse` to use accumulated effective velocities, preventing multi-iteration phantom energy creation and velocity explosion during ball-to-ball collisions
 * Enhanced website rigid body examples and interactive demos with vector-first configuration, impact friction, rolling resistance for resting circles, and progressive stiction deceleration
 * Continuous Collision Detection (CCD):
   - Added bullet mode (`body.setBullet(true)`, `body.getBullet()`) for high-speed dynamic bodies.
   - Swept Minkowski narrow-phase geometric queries in `Raycast` (`sweepCircleCircle`, `sweepCircleAabb`, `sweepAabbAabb`, `sweepAabbCircle`, `sweepBody`).
   - Time-of-Impact (TOI) sub-stepping in `Scene.prototype.updateCcdBody` to resolve high-speed projectile collisions without tunneling through thin colliders.
   - Swept obstacle queries in `Scene` (`sweepBody`, `sweepBodyAll`) returning time of impact, intersection point, and contact normal.
 * Distance Constraints, Joints, and Springs:
   - Added `DistanceConstraint` and `Joint` classes for physical distance locking, rope limits, and elastic harmonic damped springs.
   - Factory methods `DistanceConstraint.createRod(a, b, dist)`, `createRope(a, b, maxDist)`, `createSpring(a, b, dist, stiffness, damping)`.
   - Native constraint integration in `Scene` (`addConstraint`, `removeConstraint`, `getConstraints`, `clearConstraints`, `drawConstraints`).
 * Explicit Body Types:
   - Introduced `BodyType` (`'dynamic' | 'static' | 'kinematic'`) with getters/setters and convenience checkers (`isDynamic()`, `isStatic()`, `isKinematic()`).
   - Kinematic bodies maintain programmed velocities regardless of dynamic collisions, pushing dynamic bodies with infinite mass without deflection.
   - Pruning of non-dynamic pairs (static-vs-static, static-vs-kinematic, kinematic-vs-kinematic) in broadphase and narrowphase for optimal performance.
 * Deterministic Fixed-Timestep Accumulator:
   - Added `scene.step(deltaTime)` to decouple simulation integration from variable display frame rates.
   - Clamped sub-stepping with `maxSubSteps` (default 5) to eliminate the "spiral of death" during frame rate spikes.
   - Configurable `fixedDeltaTime` (default 1/60s).
   - Alpha interpolation fraction `scene.getAlpha()` for smooth visual position interpolation on variable-refresh monitors.
 * Spatial Queries:
   - Added point containment queries (`scene.queryPoint`, `scene.queryPointFirst`, `body.containsPoint`).
   - Added circle area-of-effect queries (`scene.queryCircle`, `body.overlapsCircle`).
   - Added axis-aligned box overlap queries (`scene.queryAabb`, `body.overlapsAabb`).
   - Shared `SpatialQueryOptions` filtering (`mask`, `ignoreSensors`).
 * Raycasting and Segment Queries:
   - Added `Raycast` module with circle and AABB ray intersection solvers.
   - Added `scene.raycast` (nearest hit) and `scene.raycastAll` (sorted all hits) with category bitmask and sensor filtering.
   - Added `body.raycast(start, end)` per-body ray intersection.
 * Collision Filtering and Layers:
   - 16-bit category bitfields (`collisionCategory`), mask bitfields (`collisionMask`), and group indices (`collisionGroup`).
   - Sensor / trigger colliders (`isSensor`, `setSensor`) for overlap detection without physical impulse or velocity alteration.
   - Per-body collision ignore lists (`ignoreCollisionWith`, `restoreCollisionWith`, `isIgnoringCollisionWith`).
 * Body Sleeping and Resting Stacks:
   - Velocity threshold sleep state (`isSleeping`, `sleep()`, `wakeUp()`, `sleepThreshold`, `sleepStepsThreshold`) to freeze resting stacks and conserve CPU cycles.
   - Automatic wake-up when perturbed by forces, impulses, or moving collision contacts.
 * Collision Callbacks and Contact Events:
   - Body-level (`onCollision`) and scene-level (`setOnCollision`, `addListener`) callbacks delivering collision point, normal, relative velocity, and impulse magnitude.
   - Deduplicated single-event dispatch per frame contact even in multi-iteration solvers.

Version 0.5.5 (May 09th 2020)
-----------------------------
 * Update Type6js dependency to v2.0.0
 * Fix Typescript declaration file

Version 0.5.4 (October 13th 2018)
-----------------------------
 * Bump.js published on NPM at @lcluber/bumpjs.
 * Updated README.md with NPM installation procedure.

Version 0.5.3 (July 23th 2018)
------------------------------
 * lighter ES6 library.

Version 0.5.2 (July 22th 2018)
------------------------------
 * Library exported as ES6 and IIFE modules instead of UMD.
 * BUMP namespace becomes Bump

Version 0.5.1 (July 4th 2018)
------------------------------
 * Documentation automatically generated in /doc folder
 * Typedoc and grunt-typedoc added in devDependencies
 * New "typedoc" task in Gruntfile.js
 * Typescript upgraded to version 2.9.2
 * INSTALL.md becomes NOTICE.md and RELEASE_NOTES.md becomes CHANGELOG.md

Version 0.5.0 (April 13th 2018)
------------------------------
 * Now written in Typescript. And can be used as a module.

Version 0.4.1 (March 11th 2017)
------------------------------
 * Added setVelocity() method to physics class.
 * Added getVelocityX() and getVelocityY() methods to physics class.
 * optimized applyVelocity() method in physics class.

Version 0.4.0 (March 5th 2017)
------------------------------
 * Included the body directly into the physics class. Holding the TYPE6.Geometry mask for collision tests.
 * Added drawBody() method to draw the collision mask of an object.
 * setPosition() method in Physics class becomes updatePosition(). setPosition now sets the position directly without computing forces and velocity.
 * Added setActive(), setInactive(), toggleActive() and isActive() methods to physics class. this allows to set inactive bodies as inactive in the collision scene. In order for them to not be checked for collision.
 * Added missing getters for every parameters in Physics class.

Version 0.3.0 (March 2nd 2017)
------------------------------
 * Added damage handling. Physics class can hold damage information to apply to another object on collision.
 * Added a Penetration Resolution correction in collision.js to improve the engine behavior.
 * Added setIteration() and getIteration() methods to Scene class. This allows to iterate several times through all collisions and improve greatly the engine behavior.

Version 0.2.5 (February 21th 2017)
------------------------------
 * Type6.js dependency is built separately into the dist/dependencies/ folder instead of being directly inserted into the distribution Bump.js and Bump.min.js files

Version 0.2.4 (February 11th 2017)
------------------------------
 * Added testScene() method to test collisions between 2 collision scenes
 * Updated documentation

Version 0.2.3 (January 30th 2017)
------------------------------
 * Updated Type6.js dependency to version 0.2.3

Version 0.2.2 (January 18th 2017)
------------------------------
 * Fix damping setter on Physics.create() method

Version 0.2.1 (January 14th 2017)
------------------------------
 * Added setGravity() method

Version 0.2.0 (December 22th 2016)
------------------------------
 * Updated for open source release on GitHub
 * Code reworked
 * Dedicated website
 * Documentation
 * Examples

Version 0.1.0 (December 1st 2011)
-----------------------------
 * initial version
