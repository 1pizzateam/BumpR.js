import { Grid } from '@1pizzateam/spock';
import { CollisionDetection } from '../build/es6/collision.js';
import { Physics } from '../build/es6/physics.js';

describe('Collision Detection & Impulse Response', () => {
  test('Circle vs AABB: Circle moving right towards stationary AABB bounces back', () => {
    // Circle at (0, 0) radius 10 moving right with velocity (10, 0)
    const circle = new Physics(0, 0, 10, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');
    // AABB at (15, 0) halfSize (10, 10) stationary (mass = 1.0)
    const aabb = new Physics(15, 0, 0, 0, 20, 20, 1.0, 1.0, 1.0, 'rectangle');

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
    const aabb = new Physics(0, 0, 10, 0, 20, 20, 1.0, 1.0, 1.0, 'rectangle');
    // Circle at (15, 0) radius 10 stationary (mass = 1.0)
    const circle = new Physics(15, 0, 0, 0, 10, 10, 1.0, 1.0, 1.0, 'circle');

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
    const staticA = new Physics(0, 0, 0, 0, 20, 20, 0, 1.0, 0.5, 'rectangle');
    const staticB = new Physics(10, 0, 0, 0, 20, 20, 0, 1.0, 0.5, 'rectangle');

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
    const b1 = new Physics(25, 25, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const b2 = new Physics(30, 25, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const b3 = new Physics(500, 500, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

    b1.setGrid(grid);
    b2.setGrid(grid);
    b3.setGrid(grid);

    expect(CollisionDetection.broadphase(b1, b2, grid)).toBe(true);
    expect(CollisionDetection.broadphase(b1, b3, grid)).toBe(false);
  });

  test('CollisionDetection.test returns false when bodies do not collide', () => {
    const a = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const b = new Physics(100, 100, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    expect(CollisionDetection.test(a, b)).toBe(false);
  });

  test('Vertical collision along Y axis resolves with axis-aligned normal', () => {
    const circle = new Physics(0, 0, 0, 10, 10, 10, 1.0, 1.0, 1.0, 'circle');
    const floor = new Physics(0, 15, 0, 0, 100, 20, 0, 1.0, 1.0, 'rectangle');

    const collided = CollisionDetection.test(circle, floor);
    expect(collided).toBe(true);
    expect(circle.impulse.y).toBeLessThan(0);
  });

  test('Diagonal corner collision resolves with normalized contact normal', () => {
    const circle = new Physics(16, 16, -10, -10, 10, 10, 1.0, 1.0, 1.0, 'circle');
    const aabb = new Physics(0, 0, 0, 0, 20, 20, 1.0, 1.0, 1.0, 'rectangle');

    const collided = CollisionDetection.test(circle, aabb);
    expect(collided).toBe(true);
    expect(circle.impulse.x).toBeGreaterThan(0);
    expect(circle.impulse.y).toBeGreaterThan(0);
  });
});


