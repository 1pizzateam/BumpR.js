import { Grid, Vec2 } from '@1pizzateam/spock';
import { Physics } from '../build/es6/physics.js';
import { Scene } from '../build/es6/scene.js';

describe('Scene Management & Lifecycle', () => {
  test('addBody adds body, sets collisionSceneId, and propagates gravity', () => {
    const scene = new Scene();
    scene.setGravity(0, 500);

    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
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
    const body1 = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const body2 = new Physics(10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

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
    const body1 = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const body2 = new Physics(10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

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
    const body1 = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const body2 = new Physics(10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

    scene.addBody(body1);
    scene.addBody(body2);

    scene.setGravity(10, 980);
    expect(scene.gravity.x).toBe(10);
    expect(scene.gravity.y).toBe(980);
    expect(body1.gravity.x).toBe(10);
    expect(body1.gravity.y).toBe(980);
    expect(body2.gravity.x).toBe(10);
    expect(body2.gravity.y).toBe(980);
  });

  test('update advances position of active bodies', () => {
    const scene = new Scene();
    scene.setGravity(0, 100);

    const activeBody = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const inactiveBody = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
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
    scene.setGravity(0, 0);

    // Two circles heading towards each other
    const body1 = new Physics(0, 0, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
    const body2 = new Physics(15, 0, -10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');

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
    sceneA.setGravity(0, 0);
    sceneB.setGravity(0, 0);

    const bodyA = new Physics(0, 0, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
    const bodyB = new Physics(15, 0, -10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');

    sceneA.addBody(bodyA);
    sceneB.addBody(bodyB);

    sceneA.testScene(sceneB);

    expect(bodyA.impulse.x).toBeLessThan(0);
    expect(bodyB.impulse.x).toBeGreaterThan(0);
  });

  test('Cumulative damage from multiple collisions in a single step', () => {
    const victim = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const attacker1 = new Physics(10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const attacker2 = new Physics(-10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

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
    const b1 = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const b2 = new Physics(10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const b3 = new Physics(20, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

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
    const b1 = new Physics(0, 0, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
    scene.addBody(b1);

    // Testing scene against itself: b1 should not collide with b1
    expect(() => scene.testScene(scene)).not.toThrow();
    expect(b1.impulse.isOrigin()).toBe(true);
  });

  test('draw calls draw on all active bodies and skips inactive bodies', () => {
    const scene = new Scene();
    const activeBody = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const inactiveBody = new Physics(10, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
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
    const staticA = new Physics(0, 0, 0, 0, 20, 20, 0, 1.0, 0.5, 'circle');
    const staticB = new Physics(10, 0, 0, 0, 20, 20, 0, 1.0, 0.5, 'circle');
    scene.addBody(staticA);
    scene.addBody(staticB);

    expect(() => scene.test()).not.toThrow();
    expect(staticA.impulse.isOrigin()).toBe(true);

    const scene2 = new Scene();
    const staticC = new Physics(5, 0, 0, 0, 20, 20, 0, 1.0, 0.5, 'circle');
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

      const b1 = new Physics(50, 50, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
      const b2 = new Physics(100, 100, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'aabb');

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
      scene.setGravity(0, 0);

      // Body 1 at (25, 25), Body 2 at (400, 400) - far apart in different grid cells
      const b1 = new Physics(25, 25, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
      const b2 = new Physics(400, 400, -10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');

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
      scene.setGravity(0, 0);

      // Overlapping bodies in the same cell at (25, 25) and (35, 25)
      const b1 = new Physics(25, 25, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
      const b2 = new Physics(35, 25, -10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');

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
      sceneA.setGravity(0, 0);
      sceneB.setGravity(0, 0);

      // Distant bodies
      const b1 = new Physics(25, 25, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
      const b2 = new Physics(500, 500, -10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');

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
  });
});


