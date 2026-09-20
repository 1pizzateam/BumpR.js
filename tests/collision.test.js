import { Grid, Vec2 } from '@1pizzateam/spock';
import { CollisionDetection } from '../build/es6/collision.js';
import { Physics } from '../build/es6/physics.js';

describe('Collision Detection & Impulse Response', () => {
  test('Circle vs AABB: Circle moving right towards stationary AABB bounces back', () => {
    // Circle at (0, 0) radius 10 moving right with velocity (10, 0)
    const circle = new Physics(
      new Vec2(0, 0),
      new Vec2(10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    // AABB at (15, 0) halfSize (10, 10) stationary (mass = 1.0)
    const aabb = new Physics(
      new Vec2(15, 0),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'aabb'
    );

    const collided = CollisionDetection.test(circle, aabb);
    expect(collided).toBe(true);

    // Circle should receive an impulse to the left (negative x)
    expect(circle.impulse.x).toBeLessThan(0);
    // AABB should receive an impulse to the right (positive x)
    expect(aabb.impulse.x).toBeGreaterThan(0);
    // Impulses should be equal and opposite (Newton's 3rd law)
    expect(circle.impulse.x).toBeCloseTo(-aabb.impulse.x, 3);
  });

  test('AABB vs Circle: AABB moving right towards stationary Circle bounces back symmetrically', () => {
    // AABB at (0, 0) halfSize (10, 10) moving right with velocity (10, 0)
    const aabb = new Physics(
      new Vec2(0, 0),
      new Vec2(10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'aabb'
    );
    // Circle at (15, 0) radius 10 stationary (mass = 1.0)
    const circle = new Physics(
      new Vec2(15, 0),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );

    const collided = CollisionDetection.test(aabb, circle);
    expect(collided).toBe(true);

    // AABB should receive an impulse to the left (negative x)
    expect(aabb.impulse.x).toBeLessThan(0);
    // Circle should receive an impulse to the right (positive x)
    expect(circle.impulse.x).toBeGreaterThan(0);
    // Impulses should be equal and opposite
    expect(aabb.impulse.x).toBeCloseTo(-circle.impulse.x, 3);
  });

  test('Dual static bodies (mass = 0) do not produce NaN or Infinity', () => {
    const staticA = new Physics(
      new Vec2(0, 0),
      new Vec2(0, 0),
      new Vec2(20, 20),
      0,
      1.0,
      0.5,
      'aabb'
    );
    const staticB = new Physics(
      new Vec2(10, 0),
      new Vec2(0, 0),
      new Vec2(20, 20),
      0,
      1.0,
      0.5,
      'aabb'
    );

    const collided = CollisionDetection.test(staticA, staticB);
    expect(collided).toBe(true);

    expect(Number.isNaN(staticA.position.x)).toBe(false);
    expect(Number.isNaN(staticB.position.x)).toBe(false);
    expect(Number.isFinite(staticA.position.x)).toBe(true);
    expect(Number.isFinite(staticB.position.x)).toBe(true);
    expect(staticA.impulse.isOrigin()).toBe(true);
    expect(staticB.impulse.isOrigin()).toBe(true);
  });

  test('CollisionDetection.broadphase uses Spock Grid to test cell overlap', () => {
    const grid = new Grid(800, 600, 50);
    const b1 = new Physics(new Vec2(25, 25), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const b2 = new Physics(new Vec2(30, 25), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const b3 = new Physics(new Vec2(500, 500), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    b1.setGrid(grid);
    b2.setGrid(grid);
    b3.setGrid(grid);

    expect(CollisionDetection.broadphase(b1, b2, grid)).toBe(true);
    expect(CollisionDetection.broadphase(b1, b3, grid)).toBe(false);
  });

  test('CollisionDetection.test returns false when bodies do not collide', () => {
    const a = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const b = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    expect(CollisionDetection.test(a, b)).toBe(false);
  });

  test('Vertical collision along Y axis resolves with axis-aligned normal', () => {
    const circle = new Physics(
      new Vec2(0, 0),
      new Vec2(0, 10),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    const floor = new Physics(
      new Vec2(0, 15),
      new Vec2(0, 0),
      new Vec2(100, 20),
      0,
      1.0,
      1.0,
      'aabb'
    );

    const collided = CollisionDetection.test(circle, floor);
    expect(collided).toBe(true);
    expect(circle.impulse.y).toBeLessThan(0);
  });

  test('Diagonal corner collision resolves with normalized contact normal', () => {
    const circle = new Physics(
      new Vec2(16, 16),
      new Vec2(-10, -10),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    const aabb = new Physics(
      new Vec2(0, 0),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'aabb'
    );

    const collided = CollisionDetection.test(circle, aabb);
    expect(collided).toBe(true);
    expect(circle.impulse.x).toBeGreaterThan(0);
    expect(circle.impulse.y).toBeGreaterThan(0);
  });

  test('AABB vs AABB: Tangential friction opposes sliding motion', () => {
    // Box A on top of Box B, moving right with vx = 20, vy = 10 (hitting top of B)
    // Box B stationary at (0, 20), halfSize (20, 10)
    const boxA = new Physics(
      new Vec2(0, 5),
      new Vec2(20, 10),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.0,
      'aabb',
      0.5
    );
    const boxB = new Physics(
      new Vec2(0, 20),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.0,
      'aabb',
      0.5
    );

    const collided = CollisionDetection.test(boxA, boxB);
    expect(collided).toBe(true);

    // Normal impulse on A should be negative Y (pushed up)
    expect(boxA.impulse.y).toBeLessThan(0);
    expect(boxB.impulse.y).toBeGreaterThan(0);

    // Tangential friction impulse on A should oppose positive X velocity (negative X)
    expect(boxA.impulse.x).toBeLessThan(0);
    // Equal and opposite on B (positive X)
    expect(boxB.impulse.x).toBeGreaterThan(0);
    expect(boxA.impulse.x).toBeCloseTo(-boxB.impulse.x, 3);
  });

  test('Circle vs AABB: Zero friction preserves pure normal impulse', () => {
    // Circle moving obliquely (vx = 20, vy = 10) towards horizontal flat top of AABB
    const circle = new Physics(
      new Vec2(0, 5),
      new Vec2(20, 10),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.0,
      'circle'
    );
    const floor = new Physics(
      new Vec2(0, 20),
      new Vec2(0, 0),
      new Vec2(100, 20),
      0,
      1.0,
      0.0,
      'aabb'
    );

    const collided = CollisionDetection.test(circle, floor);
    expect(collided).toBe(true);

    // Pure normal impulse along Y
    expect(circle.impulse.y).toBeLessThan(0);
    // Zero tangential friction impulse on circle (friction = 0)
    expect(circle.impulse.x).toBe(0);
  });

  test('Resting contact threshold zeroes restitution for micro-collisions', () => {
    // Low relative velocity (vy = 2 < restingThreshold 6)
    const a = new Physics(
      new Vec2(0, 5),
      new Vec2(0, 2),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.8,
      'aabb'
    );
    const b = new Physics(
      new Vec2(0, 20),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.8,
      'aabb'
    );

    CollisionDetection.test(a, b);

    // Delta velocity with restitution=0 is 2, impulse = 2 / 2 = 1
    // (If restitution 0.8 were used, impulse would be 2 * 1.8 / 2 = 1.8)
    expect(Math.abs(a.impulse.y)).toBeCloseTo(1, 2);
  });

  test('Multi-iteration collision does not inflate velocity or create energy', () => {
    const ballA = new Physics(
      new Vec2(100, 100),
      new Vec2(50, 0),
      new Vec2(40, 40),
      1.0,
      1.0,
      0.8,
      'circle'
    );
    const ballB = new Physics(
      new Vec2(130, 100),
      new Vec2(-50, 0),
      new Vec2(40, 40),
      1.0,
      1.0,
      0.8,
      'circle'
    );

    // First collision iteration computes impulse
    CollisionDetection.test(ballA, ballB);
    const firstImpulseX = ballA.impulse.x;
    expect(firstImpulseX).toBeLessThan(0);

    // Second iteration sees separating effective velocities and applies no extra impulse
    CollisionDetection.test(ballA, ballB);
    expect(ballA.impulse.x).toBe(firstImpulseX);

    // When integrated, rebound velocity magnitude must equal e * vin = 0.8 * 50 = 40
    ballA.updatePosition(0.016);
    ballB.updatePosition(0.016);
    expect(ballA.velocity.x).toBeCloseTo(-40, 2);
    expect(ballB.velocity.x).toBeCloseTo(40, 2);
  });

  describe('Sensor / Trigger Colliders (Ghost Bodies)', () => {
    test('Sensor collision detects overlap, fires callbacks with zero impulse, and does not alter positions or velocities', () => {
      const player = new Physics(
        new Vec2(100, 100),
        new Vec2(150, 0),
        new Vec2(40, 40),
        1.0,
        1.0,
        0.5,
        'circle'
      );
      const coin = new Physics(
        new Vec2(110, 100),
        new Vec2(0, 0),
        new Vec2(20, 20),
        0, // static mass
        1.0,
        0,
        'circle',
        0,
        true // isSensor = true
      );

      const initialPlayerPos = player.position.clone();
      const initialPlayerVel = player.velocity.clone();
      const initialCoinPos = coin.position.clone();

      let playerCalled = false;
      let coinCalled = false;
      let sceneCallbackCalled = false;
      let capturedImpulse = null;
      let capturedNormal = null;

      player.onCollision = (other, normal, impulse) => {
        playerCalled = true;
        capturedImpulse = impulse;
        capturedNormal = normal;
      };
      coin.onCollision = (other) => {
        if (other === player) coinCalled = true;
      };

      const sceneCb = (a, b, normal, impulse) => {
        sceneCallbackCalled = true;
        expect(impulse.isOrigin()).toBe(true);
      };

      const collided = CollisionDetection.test(player, coin, sceneCb);
      expect(collided).toBe(true);
      expect(playerCalled).toBe(true);
      expect(coinCalled).toBe(true);
      expect(sceneCallbackCalled).toBe(true);

      // Contact normal exists pointing from coin to player
      expect(capturedNormal).not.toBeNull();
      expect(capturedNormal.x).toBeLessThan(0);

      // Impulse is zero (no physical bounce or force)
      expect(capturedImpulse.x).toBe(0);
      expect(capturedImpulse.y).toBe(0);
      expect(player.impulse.isOrigin()).toBe(true);

      // Positions are completely unchanged (NO positional correction / resolve)
      expect(player.position.x).toBe(initialPlayerPos.x);
      expect(player.position.y).toBe(initialPlayerPos.y);
      expect(coin.position.x).toBe(initialCoinPos.x);
      expect(coin.position.y).toBe(initialCoinPos.y);

      // Velocity is completely unchanged
      expect(player.velocity.x).toBe(initialPlayerVel.x);
      expect(player.velocity.y).toBe(initialPlayerVel.y);
    });

    test('iteration > 0 immediately skips sensor pairs', () => {
      const sensor = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'circle', 0, true);
      const body = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');

      let callCount = 0;
      sensor.onCollision = () => { callCount++; };

      // Iteration 0 tests and triggers
      const r0 = CollisionDetection.test(sensor, body, undefined, 0);
      expect(r0).toBe(true);
      expect(callCount).toBe(1);

      // Iteration 1 returns false immediately and does not trigger
      const r1 = CollisionDetection.test(sensor, body, undefined, 1);
      expect(r1).toBe(false);
      expect(callCount).toBe(1);
    });
  });
});
