import { Grid, Vec2 } from '@1pizzateam/spock';
import { Physics } from '../build/es6/physics.js';
import { Scene } from '../build/es6/scene.js';
import { DistanceConstraint } from '../build/es6/constraint.js';

describe('Scene Management & Lifecycle', () => {
  test('addBody adds body, sets collisionSceneId, and propagates gravity', () => {
    const scene = new Scene();
    scene.setGravity(new Vec2(0, 500));

    const body = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    expect(body.collisionSceneId).toBe(0);

    const added = scene.addBody(body);
    expect(added).toBe(true);
    expect(scene.bodiesLength).toBe(1);
    expect(body.collisionSceneId).toBe(1);
    // Body should receive scene gravity
    expect(body.gravity.x).toBe(0);
    expect(body.gravity.y).toBe(500);

    // Cannot add the same body again
    expect(scene.addBody(body)).toBe(false);
    expect(scene.bodiesLength).toBe(1);
  });

  test('removeBody removes body, resets collisionSceneId, and allows re-adding', () => {
    const scene = new Scene();
    const body1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const body2 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    scene.addBody(body1);
    scene.addBody(body2);
    expect(scene.bodiesLength).toBe(2);

    const removed = scene.removeBody(body1);
    expect(removed).toBe(true);
    expect(scene.bodiesLength).toBe(1);
    expect(body1.collisionSceneId).toBe(0);
    expect(scene.bodies[0]).toBe(body2);

    // Removing again returns false
    expect(scene.removeBody(body1)).toBe(false);

    // Can re-add body1
    expect(scene.addBody(body1)).toBe(true);
    expect(scene.bodiesLength).toBe(2);
  });

  test('clear removes all bodies and resets collisionSceneId', () => {
    const scene = new Scene();
    const body1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const body2 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    scene.addBody(body1);
    scene.addBody(body2);
    expect(scene.bodiesLength).toBe(2);

    scene.clear();
    expect(scene.bodiesLength).toBe(0);
    expect(scene.bodies.length).toBe(0);
    expect(body1.collisionSceneId).toBe(0);
    expect(body2.collisionSceneId).toBe(0);
  });

  test('setGravity updates scene gravity and all member bodies', () => {
    const scene = new Scene();
    const body1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const body2 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    scene.addBody(body1);
    scene.addBody(body2);

    scene.setGravity(new Vec2(10, 980));
    expect(scene.gravity.x).toBe(10);
    expect(scene.gravity.y).toBe(980);
    expect(body1.gravity.x).toBe(10);
    expect(body1.gravity.y).toBe(980);
    expect(body2.gravity.x).toBe(10);
    expect(body2.gravity.y).toBe(980);
  });

  test('update advances position of active bodies', () => {
    const scene = new Scene();
    scene.setGravity(new Vec2(0, 100));

    const activeBody = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const inactiveBody = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    inactiveBody.toggleActive(); // active becomes false

    scene.addBody(activeBody);
    scene.addBody(inactiveBody);

    scene.update(0.1); // 0.1 second step

    // Active body should accelerate downward from gravity: v = a*t = 100*0.1 = 10, y moves
    expect(activeBody.position.y).toBeGreaterThan(0);
    // Inactive body must remain at (0, 0)
    expect(inactiveBody.position.x).toBe(0);
    expect(inactiveBody.position.y).toBe(0);
  });

  test('test detects and resolves collisions within the scene', () => {
    const scene = new Scene();
    scene.setGravity(new Vec2(0, 0));

    // Two circles heading towards each other
    const body1 = new Physics(
      new Vec2(0, 0),
      new Vec2(10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    const body2 = new Physics(
      new Vec2(15, 0),
      new Vec2(-10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );

    scene.addBody(body1);
    scene.addBody(body2);

    scene.test();

    // Impulses should push body1 left and body2 right
    expect(body1.impulse.x).toBeLessThan(0);
    expect(body2.impulse.x).toBeGreaterThan(0);
  });

  test('testScene detects collisions across separate scenes', () => {
    const sceneA = new Scene();
    const sceneB = new Scene();
    sceneA.setGravity(new Vec2(0, 0));
    sceneB.setGravity(new Vec2(0, 0));

    const bodyA = new Physics(
      new Vec2(0, 0),
      new Vec2(10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    const bodyB = new Physics(
      new Vec2(15, 0),
      new Vec2(-10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );

    sceneA.addBody(bodyA);
    sceneB.addBody(bodyB);

    sceneA.testScene(sceneB);

    expect(bodyA.impulse.x).toBeLessThan(0);
    expect(bodyB.impulse.x).toBeGreaterThan(0);
  });

  test('Cumulative damage from multiple collisions in a single step', () => {
    const victim = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const attacker1 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const attacker2 = new Physics(new Vec2(-10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    attacker1.setDamageDealt(15);
    attacker2.setDamageDealt(25);

    victim.collision(new Vec2(), attacker1);
    victim.collision(new Vec2(), attacker2);

    expect(victim.damageTaken).toBe(40); // 15 + 25 = 40
    const dmg = victim.applyDamage();
    expect(dmg).toBe(40);
    expect(victim.damageTaken).toBe(0);
  });

  test('Monotonic collisionSceneId allocation prevents duplicate IDs across removals', () => {
    const scene = new Scene();
    const b1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const b2 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const b3 = new Physics(new Vec2(20, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    scene.addBody(b1); // id: 1
    scene.addBody(b2); // id: 2
    expect(b1.collisionSceneId).toBe(1);
    expect(b2.collisionSceneId).toBe(2);

    scene.removeBody(b1); // b1 removed, scene length is 1

    scene.addBody(b3); // id should be 3, not 2!
    expect(b3.collisionSceneId).toBe(3);
    expect(b2.collisionSceneId).toBe(2);
    expect(b3.collisionSceneId).not.toBe(b2.collisionSceneId);
  });

  test('testScene ignores self-collision when a scene is tested against itself', () => {
    const scene = new Scene();
    const b1 = new Physics(
      new Vec2(0, 0),
      new Vec2(10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    scene.addBody(b1);

    // Testing scene against itself: b1 should not collide with b1
    expect(() => scene.testScene(scene)).not.toThrow();
    expect(b1.impulse.isOrigin()).toBe(true);
  });

  test('draw calls draw on all active bodies and skips inactive bodies', () => {
    const scene = new Scene();
    const activeBody = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const inactiveBody = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    inactiveBody.setInactive();

    let activeDrawn = false;
    let inactiveDrawn = false;
    activeBody.body.draw = () => { activeDrawn = true; };
    inactiveBody.body.draw = () => { inactiveDrawn = true; };

    scene.addBody(activeBody);
    scene.addBody(inactiveBody);

    scene.draw({}, '#ff0000', '#000000', 1);

    expect(activeDrawn).toBe(true);
    expect(inactiveDrawn).toBe(false);
  });

  test('setIteration updates iterations count', () => {
    const scene = new Scene();
    expect(scene.iterations).toBe(1);
    scene.setIteration(5);
    expect(scene.iterations).toBe(5);
  });

  test('dual static bodies with inverseMass = 0 are skipped in test() and testScene()', () => {
    const scene = new Scene();
    const staticA = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(40, 40), 0, 1.0, 0.5, 'circle');
    const staticB = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(40, 40), 0, 1.0, 0.5, 'circle');
    scene.addBody(staticA);
    scene.addBody(staticB);

    expect(() => scene.test()).not.toThrow();
    expect(staticA.impulse.isOrigin()).toBe(true);

    const scene2 = new Scene();
    const staticC = new Physics(new Vec2(5, 0), new Vec2(), new Vec2(40, 40), 0, 1.0, 0.5, 'circle');
    scene2.addBody(staticC);

    expect(() => scene.testScene(scene2)).not.toThrow();
    expect(staticA.impulse.isOrigin()).toBe(true);
    expect(staticC.impulse.isOrigin()).toBe(true);
  });

  describe('Spock Grid Broad-Phase Integration', () => {
    test('Scene manages Grid lifecycle on bodies (add, remove, clear, setGrid)', () => {
      const grid = new Grid(800, 600, 32);
      const scene = new Scene(grid);
      expect(scene.getGrid()).toBe(grid);

      const b1 = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      const b2 = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(10, 10), 1.0, 1.0, 0.5, 'aabb');

      scene.addBody(b1);
      scene.addBody(b2);
      expect(b1.getGrid()).toBe(grid);
      expect(b2.getGrid()).toBe(grid);

      // Removing body clears grid from body
      scene.removeBody(b1);
      expect(b1.getGrid()).toBeNull();

      // Setting null detaches grid from scene
      scene.setGrid(null);
      expect(scene.getGrid()).toBeNull();

      // Adding body to scene without grid does not attach a grid
      scene.addBody(b1);
      expect(b1.getGrid()).toBeNull();

      // Setting grid on scene with existing bodies propagates to all bodies
      const newGrid = new Grid(400, 300, 20);
      scene.setGrid(newGrid);
      expect(scene.getGrid()).toBe(newGrid);
      expect(b1.getGrid()).toBe(newGrid);

      // Clearing scene clears grid from remaining bodies
      scene.clear();
      expect(b1.getGrid()).toBeNull();
    });

    test('Grid broad-phase skips collision detection when bodies are in different cells', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      // Body 1 at (25, 25), Body 2 at (400, 400) - far apart in different grid cells
      const b1 = new Physics(
        new Vec2(25, 25),
        new Vec2(10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );
      const b2 = new Physics(
        new Vec2(400, 400),
        new Vec2(-10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );

      scene.addBody(b1);
      scene.addBody(b2);

      scene.test();

      // No collision should occur
      expect(b1.impulse.isOrigin()).toBe(true);
      expect(b2.impulse.isOrigin()).toBe(true);
    });

    test('Grid broad-phase allows collision detection when bodies share grid cells', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      // Overlapping bodies in the same cell at (25, 25) and (35, 25)
      const b1 = new Physics(
        new Vec2(25, 25),
        new Vec2(10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );
      const b2 = new Physics(
        new Vec2(35, 25),
        new Vec2(-10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );

      scene.addBody(b1);
      scene.addBody(b2);

      scene.test();

      // Collision should be detected and resolved
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
    });

    test('testScene respects Grid broad-phase filtering across scenes', () => {
      const grid = new Grid(800, 600, 50);
      const sceneA = new Scene(grid);
      const sceneB = new Scene();
      sceneA.setGravity(new Vec2(0, 0));
      sceneB.setGravity(new Vec2(0, 0));

      // Distant bodies
      const b1 = new Physics(
        new Vec2(25, 25),
        new Vec2(10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );
      const b2 = new Physics(
        new Vec2(500, 500),
        new Vec2(-10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );

      sceneA.addBody(b1);
      sceneB.addBody(b2);
      b2.setGrid(grid); // ensure b2 has grid cells computed

      sceneA.testScene(sceneB);
      expect(b1.impulse.isOrigin()).toBe(true);
      expect(b2.impulse.isOrigin()).toBe(true);
    });

    test('drawGrid delegates to Grid.draw when grid is attached', () => {
      const grid = new Grid(800, 600, 50);
      let drawn = false;
      grid.draw = () => { drawn = true; };

      const scene = new Scene(grid);
      scene.drawGrid({}, '#ffffff', '#000000', 1);
      expect(drawn).toBe(true);

      // If grid is null, drawGrid does nothing without error
      scene.setGrid(null);
      expect(() => scene.drawGrid({}, '', '', 1)).not.toThrow();
    });

    test('removeBody uses swap-with-last to remove middle body in O(1)', () => {
      const scene = new Scene();
      const b1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0.5, 'circle');
      const b2 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0.5, 'circle');
      const b3 = new Physics(new Vec2(20, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0.5, 'circle');
      expect(b1.sceneIndex).toBe(-1);

      scene.addBody(b1);
      scene.addBody(b2);
      scene.addBody(b3);

      expect(b1.sceneIndex).toBe(0);
      expect(b2.sceneIndex).toBe(1);
      expect(b3.sceneIndex).toBe(2);
      expect(scene.bodiesLength).toBe(3);

      const removed = scene.removeBody(b2);
      expect(removed).toBe(true);
      expect(b2.sceneIndex).toBe(-1);
      expect(scene.bodiesLength).toBe(2);
      expect(scene.bodies[0]).toBe(b1);
      expect(b1.sceneIndex).toBe(0);
      expect(scene.bodies[1]).toBe(b3);
      expect(b3.sceneIndex).toBe(1);

      // Re-removing already removed body returns false
      expect(scene.removeBody(b2)).toBe(false);

      // Removing last body
      expect(scene.removeBody(b3)).toBe(true);
      expect(b3.sceneIndex).toBe(-1);
      expect(scene.bodiesLength).toBe(1);
      expect(scene.bodies[0]).toBe(b1);

      // Clearing resets sceneIndex on remaining bodies
      scene.clear();
      expect(b1.sceneIndex).toBe(-1);
      expect(scene.bodiesLength).toBe(0);
    });

    test('update skips stationary static bodies', () => {
      const scene = new Scene();
      const staticBody = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0.5, 'aabb');
      let updateCalled = false;
      staticBody.updatePosition = () => { updateCalled = true; return staticBody.position; };
      scene.addBody(staticBody);
      scene.update(0.1);
      expect(updateCalled).toBe(false);
    });

    test('Grid broad-phase deduplicates pair tests across multi-cell spanning bodies', () => {
      const grid = new Grid(800, 600, 20);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      // Large bodies spanning multiple cells vertically and horizontally
      const b1 = new Physics(
        new Vec2(18, 30),
        new Vec2(5, 0),
        new Vec2(20, 60),
        1.0,
        1.0,
        0.5,
        'aabb'
      );
      const b2 = new Physics(
        new Vec2(34, 30),
        new Vec2(-5, 0),
        new Vec2(20, 60),
        1.0,
        1.0,
        0.5,
        'aabb'
      );
      scene.addBody(b1);
      scene.addBody(b2);

      expect(b1.body.gridCells.length).toBeGreaterThan(1);
      expect(b2.body.gridCells.length).toBeGreaterThan(1);

      scene.test();
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
    });

    test('testScene with grid detects collisions across overlapping bodies', () => {
      const grid = new Grid(800, 600, 50);
      const sceneA = new Scene(grid);
      const sceneB = new Scene(grid);
      sceneA.setGravity(new Vec2(0, 0));
      sceneB.setGravity(new Vec2(0, 0));

      const b1 = new Physics(
        new Vec2(25, 25),
        new Vec2(10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );
      const b2 = new Physics(
        new Vec2(35, 25),
        new Vec2(-10, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        1.0,
        'circle'
      );

      sceneA.addBody(b1);
      sceneB.addBody(b2);

      sceneA.testScene(sceneB);
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
    });

    test('Grid broad-phase scales efficiently with many distributed bodies', () => {
      const grid = new Grid(2000, 2000, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      for (let i = 0; i < 200; i++) {
        const x = (i % 20) * 90 + 20;
        const y = Math.floor(i / 20) * 90 + 20;
        scene.addBody(new Physics(
          new Vec2(x, y),
          new Vec2(),
          new Vec2(20, 20),
          1.0,
          1.0,
          0.5,
          'circle'
        ));
      }

      const start = performance.now();
      scene.test();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test('Sparse Grid broad-phase skips out-of-bounds bodies and empty buckets', () => {
      const grid = new Grid(2000, 2000, 20); // 10,000 cells
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      // Body out of grid bounds (gridCells = [-1])
      const outOfBounds = new Physics(
        new Vec2(5000, 5000),
        new Vec2(),
        new Vec2(20, 20),
        1.0,
        1.0,
        0.5,
        'circle'
      );
      // In-bounds colliding bodies
      const b1 = new Physics(
        new Vec2(50, 50),
        new Vec2(5, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        0.5,
        'circle'
      );
      const b2 = new Physics(
        new Vec2(55, 50),
        new Vec2(-5, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        0.5,
        'circle'
      );

      scene.addBody(outOfBounds);
      scene.addBody(b1);
      scene.addBody(b2);

      scene.test();

      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
      expect(outOfBounds.impulse.isOrigin()).toBe(true);
    });

    test('populateBuckets is called exactly once per test() even with iterations > 1', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));
      scene.setIteration(8);

      const b1 = new Physics(new Vec2(50, 50), new Vec2(10, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      const b2 = new Physics(new Vec2(60, 50), new Vec2(-10, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);

      let populateCount = 0;
      const origPopulate = scene['populateBuckets'];
      scene['populateBuckets'] = function() {
        populateCount++;
        return origPopulate.apply(this, arguments);
      };

      scene.test();

      expect(populateCount).toBe(1);
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
      expect(scene['candidatePairsCount']).toBe(0);
      expect(scene['candidatePairs'][0]).toBeNull();
    });

    test('populateBuckets is called exactly once per testScene() with iterations > 1', () => {
      const grid = new Grid(800, 600, 50);
      const sceneA = new Scene(grid);
      const sceneB = new Scene(grid);
      sceneA.setGravity(new Vec2(0, 0));
      sceneB.setGravity(new Vec2(0, 0));
      sceneA.setIteration(5);

      const b1 = new Physics(new Vec2(50, 50), new Vec2(10, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      const b2 = new Physics(new Vec2(60, 50), new Vec2(-10, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      sceneA.addBody(b1);
      sceneB.addBody(b2);

      let populateCount = 0;
      const origPopulate = sceneA['populateBuckets'];
      sceneA['populateBuckets'] = function() {
        populateCount++;
        return origPopulate.apply(this, arguments);
      };

      sceneA.testScene(sceneB);

      expect(populateCount).toBe(1);
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
      expect(sceneA['candidatePairsCount']).toBe(0);
    });

    test('isFirstCommonCell delegates to grid when grid is attached', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      let calledWith = null;
      const origIsFirst = grid.isFirstCommonCell;
      grid.isFirstCommonCell = function(a, b, c) {
        calledWith = [a, b, c];
        return origIsFirst.apply(this, arguments);
      };

      const result = scene['isFirstCommonCell']([1, 2], [2, 3], 2);
      expect(calledWith).toEqual([[1, 2], [2, 3], 2]);
      expect(result).toBe(true);
    });

    test('clear resets candidatePairs buffer and count', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      const b1 = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      const b2 = new Physics(new Vec2(55, 50), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);
      scene.test();

      scene.clear();
      expect(scene['candidatePairsCount']).toBe(0);
      expect(scene['candidatePairs']).toEqual([]);
    });

    test('non-grid test() resolves candidate pairs across multiple iterations', () => {
      const scene = new Scene();
      scene.setGravity(new Vec2(0, 0));
      scene.setIteration(4);

      const b1 = new Physics(new Vec2(50, 50), new Vec2(10, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      const b2 = new Physics(new Vec2(60, 50), new Vec2(-10, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);

      scene.test();
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
      expect(scene['candidatePairsCount']).toBe(0);
    });

    test('deduplicationMode getter and setter default to auto', () => {
      const scene = new Scene();
      expect(scene.getDeduplicationMode()).toBe('auto');

      scene.setDeduplicationMode('cell');
      expect(scene.getDeduplicationMode()).toBe('cell');

      scene.setDeduplicationMode('pair');
      expect(scene.getDeduplicationMode()).toBe('pair');

      scene.setDeduplicationMode('auto');
      expect(scene.getDeduplicationMode()).toBe('auto');
    });

    test('explicit cell deduplication mode resolves multi-cell collision and keeps mode', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));
      scene.setDeduplicationMode('cell');

      // Bodies spanning multiple cells
      const b1 = new Physics(new Vec2(48, 50), new Vec2(10, 0), new Vec2(30, 100), 1.0, 1.0, 0.5, 'aabb');
      const b2 = new Physics(new Vec2(52, 50), new Vec2(-10, 0), new Vec2(30, 100), 1.0, 1.0, 0.5, 'aabb');
      scene.addBody(b1);
      scene.addBody(b2);

      let isFirstCalled = false;
      const origIsFirst = grid.isFirstCommonCell;
      grid.isFirstCommonCell = function() {
        isFirstCalled = true;
        return origIsFirst.apply(this, arguments);
      };

      scene.test();
      expect(scene.getActiveDeduplicationMode()).toBe('cell');
      expect(isFirstCalled).toBe(true);
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
    });

    test('explicit pair deduplication mode resolves multi-cell collision without calling isFirstCommonCell', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));
      scene.setDeduplicationMode('pair');

      // Bodies spanning multiple cells
      const b1 = new Physics(new Vec2(48, 50), new Vec2(10, 0), new Vec2(30, 100), 1.0, 1.0, 0.5, 'aabb');
      const b2 = new Physics(new Vec2(52, 50), new Vec2(-10, 0), new Vec2(30, 100), 1.0, 1.0, 0.5, 'aabb');
      scene.addBody(b1);
      scene.addBody(b2);

      let isFirstCalled = false;
      const origIsFirst = grid.isFirstCommonCell;
      grid.isFirstCommonCell = function() {
        isFirstCalled = true;
        return origIsFirst.apply(this, arguments);
      };

      scene.test();
      expect(scene.getActiveDeduplicationMode()).toBe('pair');
      expect(isFirstCalled).toBe(false);
      expect(b1.impulse.x).toBeLessThan(0);
      expect(b2.impulse.x).toBeGreaterThan(0);
      expect(scene['testedPairs'].size).toBe(0); // cleared post-collection
    });

    test('auto mode selects cell for small bodies and pair for multi-cell bodies with identical impulse outcome', () => {
      const gridA = new Grid(800, 600, 50);
      const sceneSmall = new Scene(gridA);
      sceneSmall.setGravity(new Vec2(0, 0));
      // Small bodies occupying <= 2 cells
      const s1 = new Physics(new Vec2(25, 25), new Vec2(5, 0), new Vec2(10, 10), 1.0, 1.0, 0.5, 'circle');
      const s2 = new Physics(new Vec2(30, 25), new Vec2(-5, 0), new Vec2(10, 10), 1.0, 1.0, 0.5, 'circle');
      sceneSmall.addBody(s1);
      sceneSmall.addBody(s2);
      sceneSmall.test();
      expect(sceneSmall.getActiveDeduplicationMode()).toBe('cell');

      // Large multi-cell bodies spanning >= 3 cells
      const gridB = new Grid(800, 600, 50);
      const sceneLarge = new Scene(gridB);
      sceneLarge.setGravity(new Vec2(0, 0));
      const l1 = new Physics(new Vec2(45, 100), new Vec2(5, 0), new Vec2(20, 160), 1.0, 1.0, 0.5, 'aabb');
      const l2 = new Physics(new Vec2(55, 100), new Vec2(-5, 0), new Vec2(20, 160), 1.0, 1.0, 0.5, 'aabb');
      sceneLarge.addBody(l1);
      sceneLarge.addBody(l2);
      sceneLarge.test();
      expect(sceneLarge.getActiveDeduplicationMode()).toBe('pair');

      // Now verify exact impulse equivalence between explicit cell and explicit pair modes
      const scenePair = new Scene(new Grid(800, 600, 50));
      scenePair.setGravity(new Vec2(0, 0));
      scenePair.setDeduplicationMode('pair');
      const p1 = new Physics(new Vec2(45, 100), new Vec2(5, 0), new Vec2(20, 160), 1.0, 1.0, 0.5, 'aabb');
      const p2 = new Physics(new Vec2(55, 100), new Vec2(-5, 0), new Vec2(20, 160), 1.0, 1.0, 0.5, 'aabb');
      scenePair.addBody(p1);
      scenePair.addBody(p2);
      scenePair.test();

      const sceneCell = new Scene(new Grid(800, 600, 50));
      sceneCell.setGravity(new Vec2(0, 0));
      sceneCell.setDeduplicationMode('cell');
      const c1 = new Physics(new Vec2(45, 100), new Vec2(5, 0), new Vec2(20, 160), 1.0, 1.0, 0.5, 'aabb');
      const c2 = new Physics(new Vec2(55, 100), new Vec2(-5, 0), new Vec2(20, 160), 1.0, 1.0, 0.5, 'aabb');
      sceneCell.addBody(c1);
      sceneCell.addBody(c2);
      sceneCell.test();

      expect(p1.impulse.x).toBeCloseTo(c1.impulse.x, 5);
      expect(p2.impulse.x).toBeCloseTo(c2.impulse.x, 5);
    });

    test('testScene works under both cell and pair deduplication modes', () => {
      const grid = new Grid(800, 600, 50);
      const sceneA = new Scene(grid);
      const sceneB = new Scene(grid);
      sceneA.setGravity(new Vec2(0, 0));
      sceneB.setGravity(new Vec2(0, 0));

      const bA = new Physics(new Vec2(48, 50), new Vec2(10, 0), new Vec2(30, 80), 1.0, 1.0, 0.5, 'aabb');
      const bB = new Physics(new Vec2(52, 50), new Vec2(-10, 0), new Vec2(30, 80), 1.0, 1.0, 0.5, 'aabb');
      sceneA.addBody(bA);
      sceneB.addBody(bB);

      sceneA.setDeduplicationMode('pair');
      sceneA.testScene(sceneB);
      expect(bA.impulse.x).toBeLessThan(0);
      expect(bB.impulse.x).toBeGreaterThan(0);

      // Reset and test with cell mode
      bA.impulse.setScalar(0, 0);
      bB.impulse.setScalar(0, 0);
      sceneA.setDeduplicationMode('cell');
      sceneA.testScene(sceneB);
      expect(bA.impulse.x).toBeLessThan(0);
      expect(bB.impulse.x).toBeGreaterThan(0);
    });
  });

  describe('Body Sleeping and Resting Stacks in Scene', () => {
    test('Sleeping bodies are skipped during scene.update(second)', () => {
      const scene = new Scene();
      scene.setGravity(new Vec2(0, 500));
      const body = new Physics(new Vec2(100, 100), new Vec2(0, 0));
      scene.addBody(body);

      body.sleep();
      expect(body.isSleeping).toBe(true);

      const posBefore = body.position.clone();
      scene.update(0.016);

      // Sleeping body should not move and gravity should not be integrated
      expect(body.position.x).toBe(posBefore.x);
      expect(body.position.y).toBe(posBefore.y);
      expect(body.velocity.isOrigin()).toBe(true);
      expect(body.isSleeping).toBe(true);
    });

    test('Perturbing sleeping body with force awakens it during scene.update', () => {
      const scene = new Scene();
      scene.setGravity(new Vec2(0, 0));
      const body = new Physics(new Vec2(100, 100), new Vec2(0, 0));
      scene.addBody(body);
      body.sleep();
      expect(body.isSleeping).toBe(true);

      body.force.setScalar(50, 0);
      scene.update(0.016);

      expect(body.isSleeping).toBe(false);
      expect(body.velocity.x).toBeGreaterThan(0);
    });

    test('Broad-phase skips collision tests between two sleeping bodies', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      const box1 = new Physics(new Vec2(50, 50), new Vec2(0, 0), new Vec2(30, 30), 1.0, 1.0, 0.5, 'aabb');
      const box2 = new Physics(new Vec2(55, 50), new Vec2(0, 0), new Vec2(30, 30), 1.0, 1.0, 0.5, 'aabb');
      scene.addBody(box1);
      scene.addBody(box2);

      box1.sleep();
      box2.sleep();

      scene.test();
      expect(scene['candidatePairsCount']).toBe(0);
      expect(box1.impulse.isOrigin()).toBe(true);
      expect(box2.impulse.isOrigin()).toBe(true);
    });

    test('Broad-phase skips test between sleeping body and static body', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      const staticFloor = new Physics(new Vec2(50, 100), new Vec2(0, 0), new Vec2(200, 20), 0, 1.0, 0.5, 'aabb');
      const sleepingBox = new Physics(new Vec2(50, 90), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'aabb');
      scene.addBody(staticFloor);
      scene.addBody(sleepingBox);

      sleepingBox.sleep();
      scene.test();

      expect(scene['candidatePairsCount']).toBe(0);
      expect(sleepingBox.isSleeping).toBe(true);
    });

    test('Moving active body collides with sleeping body and wakes it up', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      scene.setGravity(new Vec2(0, 0));

      const sleepingBox = new Physics(new Vec2(60, 50), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      const movingBall = new Physics(new Vec2(45, 50), new Vec2(50, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
      scene.addBody(sleepingBox);
      scene.addBody(movingBall);

      sleepingBox.sleep();
      expect(sleepingBox.isSleeping).toBe(true);

      scene.test();

      expect(sleepingBox.isSleeping).toBe(false);
      expect(sleepingBox.impulse.x).toBeGreaterThan(0);
      expect(movingBall.impulse.x).toBeLessThan(0);
    });

    test('Scene setGravity awakens all sleeping bodies', () => {
      const scene = new Scene();
      const b1 = new Physics(new Vec2(50, 50));
      const b2 = new Physics(new Vec2(100, 100));
      scene.addBody(b1);
      scene.addBody(b2);

      b1.sleep();
      b2.sleep();
      expect(b1.isSleeping).toBe(true);
      expect(b2.isSleeping).toBe(true);

      scene.setGravity(new Vec2(0, 300));
      expect(b1.isSleeping).toBe(false);
      expect(b2.isSleeping).toBe(false);
    });

    test('Removing a body awakens neighbor bodies sharing grid cells', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);
      const b1 = new Physics(new Vec2(50, 50), new Vec2(0, 0), new Vec2(20, 20), 1, 1, 0, 'aabb');
      const b2 = new Physics(new Vec2(50, 50), new Vec2(0, 0), new Vec2(20, 20), 1, 1, 0, 'aabb');
      scene.addBody(b1);
      scene.addBody(b2);

      // Populate buckets
      scene.test();

      b1.sleep();
      b2.sleep();
      expect(b1.isSleeping).toBe(true);
      expect(b2.isSleeping).toBe(true);

      // Removing b1 should wake up b2 because they share grid cells
      scene.removeBody(b1);
      expect(b2.isSleeping).toBe(false);
    });
  });

  describe('Collision Callbacks and Contact Events in Scene', () => {
    test('scene.onCollision receives collision events during test()', () => {
      const scene = new Scene();
      const b1 = new Physics(new Vec2(100, 100), new Vec2(50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      const b2 = new Physics(new Vec2(130, 100), new Vec2(-50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);

      let eventReceived = null;
      scene.onCollision = (a, b, normal, impulse) => {
        eventReceived = { a, b, normal, impulse };
      };

      scene.test();

      expect(eventReceived).not.toBeNull();
      expect(eventReceived.a).toBe(b1);
      expect(eventReceived.b).toBe(b2);
      expect(eventReceived.normal.x).toBeLessThan(0); // Normal points from b2 to b1 (-X)
      expect(eventReceived.impulse.x).toBeLessThan(0);
    });

    test('setOnCollision, getOnCollision, and listener methods on Scene', () => {
      const scene = new Scene();
      const fn = () => {};
      scene.setOnCollision(fn);
      expect(scene.getOnCollision()).toBe(fn);
      scene.setOnCollision(null);
      expect(scene.getOnCollision()).toBeNull();

      let count = 0;
      const listener = () => { count++; };
      scene.addCollisionListener(listener);
      scene.addCollisionListener(listener); // duplicate ignored

      const b1 = new Physics(new Vec2(100, 100), new Vec2(50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      const b2 = new Physics(new Vec2(130, 100), new Vec2(-50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);

      scene.test();
      expect(count).toBe(1);

      expect(scene.removeCollisionListener(listener)).toBe(true);
      expect(scene.removeCollisionListener(listener)).toBe(false);

      scene.clearCollisionListeners();
    });

    test('Both body-level and scene-level callbacks fire with symmetrical perspectives', () => {
      const scene = new Scene();
      const b1 = new Physics(new Vec2(100, 100), new Vec2(50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      const b2 = new Physics(new Vec2(130, 100), new Vec2(-50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);

      let b1Event = null;
      let b2Event = null;
      let sceneEvent = null;

      b1.onCollision = (other, normal, impulse) => {
        b1Event = { other, normal, impulse };
      };
      b2.onCollision = (other, normal, impulse) => {
        b2Event = { other, normal, impulse };
      };
      scene.onCollision = (a, b, normal, impulse) => {
        sceneEvent = { a, b, normal, impulse };
      };

      scene.test();

      expect(b1Event.other).toBe(b2);
      expect(b2Event.other).toBe(b1);
      expect(sceneEvent.a).toBe(b1);
      expect(sceneEvent.b).toBe(b2);

      // Symmetrical normals and impulses
      expect(b1Event.normal.x).toBeCloseTo(-b2Event.normal.x, 5);
      expect(b1Event.impulse.x).toBeCloseTo(-b2Event.impulse.x, 5);
      expect(sceneEvent.normal.x).toBeCloseTo(b1Event.normal.x, 5);
      expect(sceneEvent.impulse.x).toBeCloseTo(b1Event.impulse.x, 5);
    });

    test('Multi-iteration solver (iterations = 5) fires callback exactly once per collision contact per frame', () => {
      const scene = new Scene();
      scene.setIteration(5);
      const b1 = new Physics(new Vec2(100, 100), new Vec2(50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      const b2 = new Physics(new Vec2(130, 100), new Vec2(-50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);

      let b1CallCount = 0;
      let sceneCallCount = 0;

      b1.onCollision = () => { b1CallCount++; };
      scene.onCollision = () => { sceneCallCount++; };

      scene.test();

      expect(b1CallCount).toBe(1);
      expect(sceneCallCount).toBe(1);
    });

    test('Dynamic body colliding with static body triggers callback on both bodies and scene', () => {
      const scene = new Scene();
      const ball = new Physics(new Vec2(100, 85), new Vec2(0, 100), new Vec2(20, 20), 1, 1, 0.5, 'circle');
      const floor = new Physics(new Vec2(100, 100), new Vec2(0, 0), new Vec2(100, 20), 0, 1, 0.5, 'aabb'); // mass = 0
      scene.addBody(ball);
      scene.addBody(floor);

      let ballHit = false;
      let floorHit = false;
      let sceneHit = false;

      ball.onCollision = (other) => {
        if (other === floor) ballHit = true;
      };
      floor.onCollision = (other) => {
        if (other === ball) floorHit = true;
      };
      scene.onCollision = (a, b) => {
        if ((a === ball && b === floor) || (a === floor && b === ball))
          sceneHit = true;
      };

      scene.test();

      expect(ballHit).toBe(true);
      expect(floorHit).toBe(true);
      expect(sceneHit).toBe(true);
      expect(floor.velocity.x).toBe(0);
      expect(floor.velocity.y).toBe(0);
    });

    test('testScene dispatches collision callbacks across distinct scenes', () => {
      const scene1 = new Scene();
      const scene2 = new Scene();

      const b1 = new Physics(new Vec2(100, 100), new Vec2(50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      const b2 = new Physics(new Vec2(130, 100), new Vec2(-50, 0), new Vec2(40, 40), 1, 1, 0.5, 'circle');
      scene1.addBody(b1);
      scene2.addBody(b2);

      let scene1Called = false;
      let scene2Called = false;

      scene1.onCollision = () => { scene1Called = true; };
      scene2.onCollision = () => { scene2Called = true; };

      scene1.testScene(scene2);

      expect(scene1Called).toBe(true);
      expect(scene2Called).toBe(true);
    });

    test('Sensor trigger in Scene fires exactly once per frame even with iterations = 5, deals damage, and leaves velocity intact', () => {
      const scene = new Scene();
      scene.setIteration(5);

      // Player running rightwards
      const player = new Physics(
        new Vec2(100, 100),
        new Vec2(200, 0),
        new Vec2(30, 30),
        1.0,
        1.0,
        0,
        'circle'
      );

      // Lava trigger zone (static, mass = 0, isSensor = true)
      const lavaZone = new Physics(
        new Vec2(110, 100),
        new Vec2(0, 0),
        new Vec2(60, 60),
        0,
        1.0,
        0,
        'aabb',
        0,
        true
      );
      lavaZone.damageDealt = 25;

      scene.addBody(player);
      scene.addBody(lavaZone);

      let playerCallbacks = 0;
      let lavaCallbacks = 0;
      let sceneCallbacks = 0;

      player.onCollision = (other, normal, impulse) => {
        playerCallbacks++;
        expect(impulse.isOrigin()).toBe(true);
      };
      lavaZone.onCollision = () => {
        lavaCallbacks++;
      };
      scene.onCollision = (a, b, normal, impulse) => {
        sceneCallbacks++;
        expect(impulse.isOrigin()).toBe(true);
      };

      const initialVelX = player.velocity.x;
      const initialPosX = player.position.x;

      scene.test();

      // Only fires once despite 5 solver iterations
      expect(playerCallbacks).toBe(1);
      expect(lavaCallbacks).toBe(1);
      expect(sceneCallbacks).toBe(1);

      // No positional pushback
      expect(player.position.x).toBe(initialPosX);
      // No velocity bounce or deceleration
      expect(player.velocity.x).toBe(initialVelX);

      // Damage was applied correctly by the hazard sensor
      expect(player.damageTaken).toBe(25);
    });
  });

  describe('Collision Filtering in Scene', () => {
    test('Non-grid broadphase filters out non-colliding pairs (Player, Enemy, Bullet)', () => {
      const scene = new Scene();

      const CAT_PLAYER = 0x0002;
      const CAT_ENEMY  = 0x0004;
      const CAT_BULLET = 0x0008;

      const player = new Physics(new Vec2(100, 100), new Vec2(0, 0), new Vec2(30, 30), 1, 1, 0, 'circle');
      player.setCollisionCategory(CAT_PLAYER);
      player.setCollisionMask(CAT_ENEMY); // Collides only with Enemy

      const bullet = new Physics(new Vec2(100, 100), new Vec2(500, 0), new Vec2(10, 10), 0.1, 1, 0, 'circle');
      bullet.setCollisionCategory(CAT_BULLET);
      bullet.setCollisionMask(CAT_ENEMY); // Collides only with Enemy (ignores Player!)

      const enemy = new Physics(new Vec2(110, 100), new Vec2(0, 0), new Vec2(30, 30), 1, 1, 0, 'circle');
      enemy.setCollisionCategory(CAT_ENEMY);
      enemy.setCollisionMask(CAT_PLAYER | CAT_BULLET); // Collides with Player and Bullet

      scene.addBody(player);
      scene.addBody(bullet);
      scene.addBody(enemy);

      let bulletPlayerHit = false;
      let bulletEnemyHit = false;

      bullet.onCollision = (other) => {
        if (other === player) bulletPlayerHit = true;
        if (other === enemy) bulletEnemyHit = true;
      };

      scene.test();

      // Bullet must not hit player even though they overlap at (100, 100)
      expect(bulletPlayerHit).toBe(false);
      // Bullet must hit enemy
      expect(bulletEnemyHit).toBe(true);
    });

    test('Grid broadphase skips non-colliding pairs early', () => {
      const scene = new Scene();
      const grid = new Grid(new Vec2(10, 10), new Vec2(50, 50));
      scene.setGrid(grid);

      const CAT_A = 0x0001;
      const CAT_B = 0x0002;

      const b1 = new Physics(new Vec2(25, 25), new Vec2(0, 0), new Vec2(20, 20), 1, 1, 0, 'circle');
      b1.setCollisionCategory(CAT_A);
      b1.setCollisionMask(CAT_A); // Only collides with A

      const b2 = new Physics(new Vec2(25, 25), new Vec2(0, 0), new Vec2(20, 20), 1, 1, 0, 'circle');
      b2.setCollisionCategory(CAT_B);
      b2.setCollisionMask(CAT_B); // Only collides with B

      scene.addBody(b1);
      scene.addBody(b2);

      let collisions = 0;
      scene.onCollision = () => { collisions++; };

      scene.test();
      expect(collisions).toBe(0);
    });

    test('testScene respects collision filtering across scenes', () => {
      const scene1 = new Scene();
      const scene2 = new Scene();

      const b1 = new Physics(new Vec2(100, 100), new Vec2(0, 0), new Vec2(40, 40), 1, 1, 0, 'circle');
      b1.setCollisionCategory(0x0002);
      b1.setCollisionMask(0x0001); // Excludes 0x0004

      const b2 = new Physics(new Vec2(100, 100), new Vec2(0, 0), new Vec2(40, 40), 1, 1, 0, 'circle');
      b2.setCollisionCategory(0x0004);
      b2.setCollisionMask(0x0002);

      scene1.addBody(b1);
      scene2.addBody(b2);

      let hit = false;
      scene1.onCollision = () => { hit = true; };

      scene1.testScene(scene2);
      expect(hit).toBe(false);
    });
  });

  describe('Explicit Body Types in Scene Simulation', () => {
    test('Dynamic body collides with moving Kinematic platform without altering platform velocity', () => {
      const scene = new Scene();
      // Kinematic platform moving right
      const platform = new Physics(
        new Vec2(100, 100),
        new Vec2(50, 0),
        new Vec2(100, 20),
        0,
        1.0,
        0,
        'aabb',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'kinematic'
      );
      // Dynamic ball falling down towards the platform
      const ball = new Physics(
        new Vec2(100, 85),
        new Vec2(0, 50),
        new Vec2(20, 20),
        1.0,
        1.0,
        0.5,
        'circle',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'dynamic'
      );

      scene.addBody(platform);
      scene.addBody(ball);

      let collisionHappened = false;
      scene.onCollision = (a, b) => {
        collisionHappened = true;
      };

      scene.test();

      expect(collisionHappened).toBe(true);
      // Kinematic platform velocity is completely unaltered
      expect(platform.velocity.x).toBe(50);
      expect(platform.velocity.y).toBe(0);
      expect(platform.impulse.isOrigin()).toBe(true);

      // Ball received upward impulse and was displaced
      expect(ball.impulse.y).toBeLessThan(0);
    });

    test('Moving Kinematic body wakes up a resting sleeping Dynamic body', () => {
      const scene = new Scene();
      const platform = new Physics(
        new Vec2(80, 100),
        new Vec2(100, 0),
        new Vec2(40, 40),
        0,
        1.0,
        0,
        'aabb',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'kinematic'
      );
      const sleepingBall = new Physics(
        new Vec2(100, 100),
        new Vec2(0, 0),
        new Vec2(20, 20),
        1.0,
        1.0,
        0,
        'circle',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'dynamic'
      );
      sleepingBall.sleep();
      expect(sleepingBall.isSleeping).toBe(true);

      scene.addBody(platform);
      scene.addBody(sleepingBall);

      scene.test();

      // Sleeping body should have woken up upon collision
      expect(sleepingBall.isSleeping).toBe(false);
      expect(sleepingBall.impulse.isOrigin()).toBe(false);
    });

    test('Static vs Static and Kinematic vs Static pairs are pruned from test() and testScene()', () => {
      const scene = new Scene();
      const wall1 = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, false, 1, 1, 0, 'static');
      const wall2 = new Physics(new Vec2(60, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, false, 1, 1, 0, 'static');
      const movingDoor = new Physics(new Vec2(55, 50), new Vec2(10, 0), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, false, 1, 1, 0, 'kinematic');

      scene.addBody(wall1);
      scene.addBody(wall2);
      scene.addBody(movingDoor);

      let callbacks = 0;
      scene.onCollision = () => { callbacks++; };

      scene.test();
      expect(callbacks).toBe(0);

      // Same across testScene
      const scene2 = new Scene();
      const otherDoor = new Physics(new Vec2(55, 50), new Vec2(10, 0), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, false, 1, 1, 0, 'kinematic');
      scene2.addBody(otherDoor);

      scene.testScene(scene2);
      expect(callbacks).toBe(0);
    });

    test('Static Sensor detects moving Kinematic body and fires callback', () => {
      const scene = new Scene();
      const trigger = new Physics(
        new Vec2(100, 100),
        new Vec2(0, 0),
        new Vec2(40, 40),
        0,
        1,
        0,
        'aabb',
        0,
        true, // Sensor
        0x0001,
        0xFFFF,
        0,
        'static'
      );
      const movingElevator = new Physics(
        new Vec2(100, 100),
        new Vec2(0, -50),
        new Vec2(40, 40),
        0,
        1,
        0,
        'aabb',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'kinematic'
      );

      scene.addBody(trigger);
      scene.addBody(movingElevator);

      let sensorTriggered = false;
      scene.onCollision = (a, b) => {
        sensorTriggered = true;
      };

      scene.test();
      expect(sensorTriggered).toBe(true);
      // Neither body is displaced or receives impulse
      expect(movingElevator.impulse.isOrigin()).toBe(true);
      expect(trigger.impulse.isOrigin()).toBe(true);
    });

    test('Spock Grid broad-phase prunes non-dynamic pairs while detecting kinematic vs dynamic', () => {
      const grid = new Grid(800, 600, 50);
      const scene = new Scene(grid);

      const staticWall = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(60, 60), 0, 1, 0, 'aabb', 0, false, 1, 1, 0, 'static');
      const kinematicPlat = new Physics(new Vec2(110, 100), new Vec2(20, 0), new Vec2(60, 60), 0, 1, 0, 'aabb', 0, false, 1, 1, 0, 'kinematic');
      const dynamicPlayer = new Physics(new Vec2(120, 100), new Vec2(0, 0), new Vec2(20, 20), 1, 1, 0, 'circle', 0, false, 1, 1, 0, 'dynamic');

      scene.addBody(staticWall);
      scene.addBody(kinematicPlat);
      scene.addBody(dynamicPlayer);

      const collidedPairs = [];
      scene.onCollision = (a, b) => {
        collidedPairs.push([a.getBodyType(), b.getBodyType()]);
      };

      scene.test();

      // Only collisions involving dynamic player should occur!
      // Static vs Kinematic must NOT be in collidedPairs
      for (const [t1, t2] of collidedPairs) {
        expect(t1 === 'dynamic' || t2 === 'dynamic').toBe(true);
      }
    });
  });

  describe('Distance Constraints and Joints in Scene', () => {
    test('addConstraint, removeConstraint, getConstraints, and clearConstraints', () => {
      const scene = new Scene();
      const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      scene.addBody(bodyA);
      scene.addBody(bodyB);

      const constraint = DistanceConstraint.createRod(bodyA, bodyB, 50);

      expect(scene.addConstraint(constraint)).toBe(true);
      expect(scene.addConstraint(constraint)).toBe(false); // Duplicate rejected
      expect(scene.getConstraintsCount()).toBe(1);
      expect(scene.getConstraints()[0]).toBe(constraint);

      // Connected bodies do not collide by default
      expect(bodyA.canCollideWith(bodyB)).toBe(false);

      expect(scene.removeConstraint(constraint)).toBe(true);
      expect(scene.removeConstraint(constraint)).toBe(false); // Non-existent rejected
      expect(scene.getConstraintsCount()).toBe(0);

      // Collision restored after removal
      expect(bodyA.canCollideWith(bodyB)).toBe(true);

      // clearConstraints
      scene.addConstraint(constraint);
      expect(scene.getConstraintsCount()).toBe(1);
      expect(bodyA.canCollideWith(bodyB)).toBe(false);

      scene.clearConstraints();
      expect(scene.getConstraintsCount()).toBe(0);
      expect(bodyA.canCollideWith(bodyB)).toBe(true);
    });

    test('Connected bodies with collideConnected = false do not trigger collision events', () => {
      const scene = new Scene();
      // Overlapping bodies
      const bodyA = new Physics(new Vec2(10, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(12, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      scene.addBody(bodyA);
      scene.addBody(bodyB);

      let collided = false;
      scene.onCollision = () => { collided = true; };

      const constraint = new DistanceConstraint(bodyA, bodyB, { collideConnected: false });
      scene.addConstraint(constraint);

      scene.test();
      expect(collided).toBe(false);
    });

    test('Rigid rod maintains distance between dynamic bodies during simulation', () => {
      const scene = new Scene();
      scene.setGravity(new Vec2(0, 100));

      const bodyA = new Physics(new Vec2(100, 100), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(150, 100), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      scene.addBody(bodyA);
      scene.addBody(bodyB);

      const rod = DistanceConstraint.createRod(bodyA, bodyB, 50);
      scene.addConstraint(rod);

      // Simulate a few steps
      for (let i = 0; i < 5; i++) {
        scene.update(0.016);
        scene.test();
      }

      // Both bodies fell due to gravity
      expect(bodyA.position.y).toBeGreaterThan(100);
      expect(bodyB.position.y).toBeGreaterThan(100);
      // Distance between them remains exactly 50
      expect(rod.getCurrentDistance()).toBeCloseTo(50, 1);
    });

    test('removeBody cleans up associated constraints', () => {
      const scene = new Scene();
      const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      scene.addBody(bodyA);
      scene.addBody(bodyB);

      const constraint = DistanceConstraint.createRod(bodyA, bodyB, 50);
      scene.addConstraint(constraint);
      expect(scene.getConstraintsCount()).toBe(1);

      scene.removeBody(bodyA);
      expect(scene.getConstraintsCount()).toBe(0);
      expect(bodyB.canCollideWith(bodyA)).toBe(true);
    });

    test('scene.clear() cleans up all constraints and bodies', () => {
      const scene = new Scene();
      const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      scene.addBody(bodyA);
      scene.addBody(bodyB);

      const constraint = DistanceConstraint.createRod(bodyA, bodyB, 50);
      scene.addConstraint(constraint);

      scene.clear();
      expect(scene.bodiesLength).toBe(0);
      expect(scene.getConstraintsCount()).toBe(0);
    });

    test('drawConstraints renders all active constraints', () => {
      const scene = new Scene();
      const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0);
      scene.addBody(bodyA);
      scene.addBody(bodyB);

      const constraint = DistanceConstraint.createRod(bodyA, bodyB, 50);
      scene.addConstraint(constraint);

      const calls = [];
      const mockContext = {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        beginPath: () => calls.push('beginPath'),
        moveTo: () => calls.push('moveTo'),
        lineTo: () => calls.push('lineTo'),
        stroke: () => calls.push('stroke'),
        strokeStyle: '',
        lineWidth: 0,
      };

      scene.drawConstraints(mockContext);
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('Continuous Collision Detection (CCD) Simulation', () => {
    test('setCcdSubSteps and getCcdSubSteps', () => {
      const scene = new Scene();
      expect(scene.getCcdSubSteps()).toBe(3);
      scene.setCcdSubSteps(5);
      expect(scene.getCcdSubSteps()).toBe(5);
      scene.setCcdSubSteps(0); // Clamped to at least 1
      expect(scene.getCcdSubSteps()).toBe(1);
    });

    test('High-speed bullet does not tunnel through thin static wall', () => {
      const scene = new Scene();
      scene.gravity.origin(); // No gravity for pure horizontal test

      // Thin wall of thickness 4px at x = 100, halfSize = (2, 50)
      const wall = new Physics(
        new Vec2(100, 50),
        new Vec2(0, 0),
        new Vec2(4, 100),
        0, // Static
        1,
        0,
        'aabb',
        0,
        false,
        1,
        0xFFFF,
        0,
        'static'
      );
      scene.addBody(wall);

      // Fast bullet at x = 0, radius = 5, velocity = (6000, 0)
      // In 1/60th second, it would travel 100px and land at x = 100 (tunneling through 4px wall)
      const bullet = new Physics(
        new Vec2(0, 50),
        new Vec2(6000, 0),
        new Vec2(10, 10),
        1.0,
        1.0, // Zero damping
        0.5, // Restitution
        'circle',
        0,
        false,
        1,
        0xFFFF,
        0,
        'dynamic',
        true // isBullet = true
      );
      scene.addBody(bullet);

      let bulletCollided = false;
      let sceneCollided = false;
      bullet.onCollision = (other) => {
        bulletCollided = true;
        expect(other).toBe(wall);
      };
      scene.onCollision = (a, b) => {
        sceneCollided = true;
      };

      // Step physics
      scene.update(1 / 60);

      expect(bulletCollided).toBe(true);
      expect(sceneCollided).toBe(true);

      // Bullet must not be past the wall (wall left face is at 100 - 2 = 98)
      // Because restitution is 0.5, bullet bounces backwards!
      expect(bullet.position.x).toBeLessThan(98);
      expect(bullet.velocity.x).toBeLessThan(0); // Velocity reflected!
    });

    test('Non-bullet body with same speed tunnels through thin wall (confirming discrete baseline)', () => {
      const scene = new Scene();
      scene.gravity.origin();

      const wall = new Physics(
        new Vec2(100, 50),
        new Vec2(0, 0),
        new Vec2(4, 100),
        0,
        1,
        0,
        'aabb',
        0,
        false,
        1,
        0xFFFF,
        0,
        'static'
      );
      scene.addBody(wall);

      const nonBullet = new Physics(
        new Vec2(0, 50),
        new Vec2(6000, 0),
        new Vec2(10, 10),
        1.0,
        1.0,
        0.5,
        'circle',
        0,
        false,
        1,
        0xFFFF,
        0,
        'dynamic',
        false // isBullet = false
      );
      scene.addBody(nonBullet);

      scene.update(1 / 60);
      // Discrete update teleports straight through: 0 + 6000 * (1/60) = 100
      expect(nonBullet.position.x).toBeCloseTo(100);
      expect(nonBullet.velocity.x).toBe(6000); // No bounce
    });

    test('Bullet hits sensor trigger zone, fires callback, and passes through', () => {
      const scene = new Scene();
      scene.gravity.origin();

      const sensor = new Physics(
        new Vec2(100, 50),
        new Vec2(0, 0),
        new Vec2(20, 100),
        0,
        1,
        0,
        'aabb',
        0,
        true // isSensor = true
      );
      scene.addBody(sensor);

      const bullet = new Physics(
        new Vec2(0, 50),
        new Vec2(6000, 0),
        new Vec2(10, 10),
        1.0,
        1.0,
        0,
        'circle',
        0,
        false,
        1,
        0xFFFF,
        0,
        'dynamic',
        true // isBullet = true
      );
      scene.addBody(bullet);

      let sensorTriggered = false;
      sensor.onCollision = (other, normal, impulse) => {
        sensorTriggered = true;
        expect(other).toBe(bullet);
        expect(impulse.x).toBe(0);
        expect(impulse.y).toBe(0);
      };

      scene.update(1 / 60);

      expect(sensorTriggered).toBe(true);
      // Bullet continues moving through the sensor without stopping
      expect(bullet.velocity.x).toBe(6000);
      expect(bullet.position.x).toBeCloseTo(100);

      // On next frame, it moves past the sensor to x = 200
      scene.update(1 / 60);
      expect(bullet.position.x).toBeCloseTo(200);
    });

    test('Bullet CCD respects sleep and waking', () => {
      const scene = new Scene();
      scene.gravity.origin();

      const bullet = new Physics(
        new Vec2(0, 50),
        new Vec2(0, 0),
        new Vec2(10, 10),
        1.0,
        1.0,
        0,
        'circle',
        0,
        false,
        1,
        0xFFFF,
        0,
        'dynamic',
        true
      );
      scene.addBody(bullet);
      bullet.sleep();

      scene.update(1 / 60);
      expect(bullet.isSleeping).toBe(true);

      bullet.applyForce(new Vec2(100, 0));
      scene.update(1 / 60);
      expect(bullet.isSleeping).toBe(false);
    });
  });

  describe('Deterministic Fixed-Timestep Accumulator', () => {
    test('getters and setters configure fixedDeltaTime and maxSubSteps with clamping', () => {
      const scene = new Scene();
      expect(scene.getFixedDeltaTime()).toBeCloseTo(1 / 60);
      expect(scene.getMaxSubSteps()).toBe(5);
      expect(scene.getAccumulator()).toBe(0);
      expect(scene.getAlpha()).toBe(0);

      scene.setFixedDeltaTime(1 / 120);
      expect(scene.getFixedDeltaTime()).toBeCloseTo(1 / 120);
      scene.setFixedDeltaTime(-1); // clamped to 1e-4
      expect(scene.getFixedDeltaTime()).toBe(1e-4);

      scene.setMaxSubSteps(8);
      expect(scene.getMaxSubSteps()).toBe(8);
      scene.setMaxSubSteps(0); // clamped to 1
      expect(scene.getMaxSubSteps()).toBe(1);
    });

    test('step(deltaTime) accumulates time and executes discrete fixed steps', () => {
      const scene = new Scene();
      scene.setGravity(new Vec2(0, 0));
      scene.setFixedDeltaTime(0.016); // 16ms
      scene.setMaxSubSteps(5);

      const body = new Physics(new Vec2(0, 0), new Vec2(100, 0), new Vec2(20, 20), 1, 1, 0, 'circle');
      scene.addBody(body);

      // 1. Non-positive deltaTime produces 0 steps
      expect(scene.step(0)).toBe(0);
      expect(scene.step(-0.01)).toBe(0);
      expect(body.position.x).toBe(0);

      // 2. Small sub-frame delta time accumulates without stepping
      const steps1 = scene.step(0.008); // 8ms < 16ms
      expect(steps1).toBe(0);
      expect(scene.getAccumulator()).toBeCloseTo(0.008);
      expect(scene.getAlpha()).toBeCloseTo(0.5);
      expect(body.position.x).toBe(0);

      // 3. Second sub-frame delta trips the threshold (0.008 + 0.010 = 0.018 >= 0.016)
      const steps2 = scene.step(0.010);
      expect(steps2).toBe(1);
      expect(scene.getAccumulator()).toBeCloseTo(0.002);
      expect(body.position.x).toBeCloseTo(1.6); // 100 * 0.016 = 1.6

      // 4. Multi-step frame (e.g. 35ms with 2ms accumulator = 37ms => 2 steps of 16ms, 5ms rem)
      const steps3 = scene.step(0.035);
      expect(steps3).toBe(2);
      expect(scene.getAccumulator()).toBeCloseTo(0.005);
      expect(body.position.x).toBeCloseTo(1.6 + 3.2); // 4.8

      // 5. Huge lag spike is clamped to maxSubSteps to prevent spiral of death
      const stepsSpike = scene.step(1.0); // 1.0s >> 5 * 16ms = 80ms
      expect(stepsSpike).toBe(5);
      expect(scene.getAccumulator()).toBeCloseTo(0);

      // 6. resetAccumulator and clear()
      scene.step(0.01);
      expect(scene.getAccumulator()).toBeGreaterThan(0);
      scene.resetAccumulator();
      expect(scene.getAccumulator()).toBe(0);

      scene.step(0.01);
      scene.clear();
      expect(scene.getAccumulator()).toBe(0);
    });
  });

  describe('Scene Spatial Queries', () => {
    let scene;
    let bCirc1, bCirc2, bAabb1, bSensor;

    beforeEach(() => {
      scene = new Scene();
      scene.setGravity(new Vec2(0, 0));

      // Circle 1: center (100, 100), radius 20, category 0x0001
      bCirc1 = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle', 0, false, 0x0001);
      // Circle 2: center (200, 100), radius 20, category 0x0002
      bCirc2 = new Physics(new Vec2(200, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle', 0, false, 0x0002);
      // AABB 1: center (100, 100), size 40x40 (corners [80, 80] to [120, 120]), category 0x0004
      bAabb1 = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'aabb', 0, false, 0x0004);
      // Sensor Circle: center (100, 100), radius 30, category 0x0001
      bSensor = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(60, 60), 1, 1, 0, 'circle', 0, true, 0x0001);

      scene.addBody(bCirc1);
      scene.addBody(bCirc2);
      scene.addBody(bAabb1);
      scene.addBody(bSensor);
    });

    test('queryPoint returns all active bodies containing point, respecting masks and sensors', () => {
      const resultsAll = scene.queryPoint(new Vec2(100, 100));
      expect(resultsAll).toHaveLength(3); // bCirc1, bAabb1, bSensor
      expect(resultsAll).toContain(bCirc1);
      expect(resultsAll).toContain(bAabb1);
      expect(resultsAll).toContain(bSensor);

      // With category mask
      const resultsMask = scene.queryPoint(new Vec2(100, 100), 0x0004);
      expect(resultsMask).toHaveLength(1);
      expect(resultsMask[0]).toBe(bAabb1);

      // With ignoreSensors
      const resultsNoSensors = scene.queryPoint(new Vec2(100, 100), { ignoreSensors: true });
      expect(resultsNoSensors).toHaveLength(2);
      expect(resultsNoSensors).not.toContain(bSensor);

      // Inactive body
      bCirc1.setActive(false);
      const resultsActive = scene.queryPoint(new Vec2(100, 100), { ignoreSensors: true });
      expect(resultsActive).toHaveLength(1);
      expect(resultsActive[0]).toBe(bAabb1);
    });

    test('queryPointFirst returns the first matching body or null', () => {
      const first = scene.queryPointFirst(new Vec2(100, 100));
      expect(first).toBe(bCirc1);

      const firstMask = scene.queryPointFirst(new Vec2(100, 100), 0x0002);
      expect(firstMask).toBeNull(); // bCirc2 is at (200, 100)

      const miss = scene.queryPointFirst(new Vec2(500, 500));
      expect(miss).toBeNull();
    });

    test('queryCircle finds all bodies overlapping circle with filters', () => {
      // Query circle at (150, 100) with radius 60: overlaps bCirc1 (dist 50 <= 80) and bCirc2 (dist 50 <= 80)
      const hitBoth = scene.queryCircle(new Vec2(150, 100), 60, { ignoreSensors: true });
      expect(hitBoth).toContain(bCirc1);
      expect(hitBoth).toContain(bCirc2);
      expect(hitBoth).toContain(bAabb1);

      // Query circle overlapping only bCirc2
      const hitOnlyCirc2 = scene.queryCircle(new Vec2(225, 100), 10);
      expect(hitOnlyCirc2).toHaveLength(1);
      expect(hitOnlyCirc2[0]).toBe(bCirc2);
    });

    test('queryCircleFirst returns first matching body or null', () => {
      const first = scene.queryCircleFirst(new Vec2(150, 100), 60, { ignoreSensors: true });
      expect(first).not.toBeNull();
      expect([bCirc1, bCirc2, bAabb1]).toContain(first);

      const miss = scene.queryCircleFirst(new Vec2(500, 500), 10);
      expect(miss).toBeNull();
    });

    test('queryAabb finds all bodies overlapping AABB with filters', () => {
      // Bounding box [180, 80] to [220, 120] covering only bCirc2
      const hitCirc2 = scene.queryAabb(new Vec2(180, 80), new Vec2(220, 120));
      expect(hitCirc2).toHaveLength(1);
      expect(hitCirc2[0]).toBe(bCirc2);

      // Bounding box [70, 70] to [130, 130] covering bCirc1, bAabb1, bSensor
      const hitLeft = scene.queryAabb(new Vec2(70, 70), new Vec2(130, 130), { ignoreSensors: true, mask: 0x0001 });
      expect(hitLeft).toHaveLength(1);
      expect(hitLeft[0]).toBe(bCirc1);
    });

    test('queryAabbFirst returns first matching body or null', () => {
      const first = scene.queryAabbFirst(new Vec2(180, 80), new Vec2(220, 120));
      expect(first).toBe(bCirc2);

      const miss = scene.queryAabbFirst(new Vec2(500, 500), new Vec2(550, 550));
      expect(miss).toBeNull();
    });
  });

  describe('Scene Additional Edge Cases', () => {
    test('removeConstraint swaps with last constraint when index < length', () => {
      const scene = new Scene();
      const b1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      const b2 = new Physics(new Vec2(50, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      const b3 = new Physics(new Vec2(100, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      scene.addBody(b1);
      scene.addBody(b2);
      scene.addBody(b3);

      const c1 = new DistanceConstraint(b1, b2, { distance: 50 });
      const c2 = new DistanceConstraint(b2, b3, { distance: 50 });
      scene.addConstraint(c1);
      scene.addConstraint(c2);

      expect(scene.getConstraintsCount()).toBe(2);
      // Remove first constraint: index 0 < length 1, triggers swap
      expect(scene.removeConstraint(c1)).toBe(true);
      expect(scene.getConstraintsCount()).toBe(1);
      expect(scene.getConstraints()[0]).toBe(c2);
    });

    test('sweepBody and sweepBodyAll skip bodies that cannot collide with movingBody', () => {
      const scene = new Scene();
      const mover = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle', 0, false, 0x0001, 0x0001);
      const obstacle = new Physics(new Vec2(100, 0), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'circle', 0, false, 0x0002, 0x0002);
      scene.addBody(mover);
      scene.addBody(obstacle);

      const hit = scene.sweepBody(new Vec2(0, 0), new Vec2(200, 0), mover);
      expect(hit).toBeNull();

      const hits = scene.sweepBodyAll(new Vec2(0, 0), new Vec2(200, 0), mover);
      expect(hits).toHaveLength(0);
    });

    test('testScene skips inactive bodies and identical references in grid and non-grid mode', () => {
      // Non-grid testScene
      const sceneA = new Scene();
      const sceneB = new Scene();
      const b1 = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      const b2 = new Physics(new Vec2(10, 0), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      b1.setActive(false);
      sceneA.addBody(b1);
      sceneB.addBody(b2);

      let collided = false;
      sceneA.setOnCollision(() => { collided = true; });
      sceneA.testScene(sceneB);
      expect(collided).toBe(false);

      // Grid testScene with inactive body in sceneB
      const grid = new Grid(500, 500, 50);
      const sceneG1 = new Scene(grid);
      const sceneG2 = new Scene(grid);
      const g1 = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      const g2 = new Physics(new Vec2(55, 50), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
      g2.setActive(false);
      sceneG1.addBody(g1);
      sceneG2.addBody(g2);
      sceneG1.testScene(sceneG2);
    });

    test('updateCcdBody handles sensor collision and already-touching obstacle (t = 0)', () => {
      const scene = new Scene();
      scene.setGravity(new Vec2(0, 0));

      const bullet = new Physics(new Vec2(0, 0), new Vec2(6000, 0), new Vec2(10, 10), 1, 1, 0, 'circle', 0, false, 0x0001, 0xFFFF, 0, 'dynamic', true);
      const sensor = new Physics(new Vec2(30, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1, 0, 'circle', 0, true);
      const wall = new Physics(new Vec2(80, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1, 0, 'aabb');

      scene.addBody(bullet);
      scene.addBody(sensor);
      scene.addBody(wall);

      let bulletCollided = false;
      bullet.setOnCollision(() => { bulletCollided = true; });

      scene.step(1 / 60);
      expect(bulletCollided).toBe(true);
      expect(bullet.position.x).toBeLessThan(80);

      // Already touching obstacle: t === 0
      const touchingScene = new Scene();
      touchingScene.setGravity(new Vec2(0, 0));
      const touchingBullet = new Physics(new Vec2(50, 0), new Vec2(6000, 0), new Vec2(10, 10), 1, 1, 0, 'circle', 0, false, 0x0001, 0xFFFF, 0, 'dynamic', true);
      const touchingWall = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1, 0, 'aabb');
      touchingScene.addBody(touchingBullet);
      touchingScene.addBody(touchingWall);
      touchingScene.step(1 / 60);
    });
  });
});


