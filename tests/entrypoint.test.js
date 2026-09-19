import {
  Circ as DistCirc,
  CollisionDetection as DistCollisionDetection,
  Grid as DistGrid,
  Physics as DistPhysics,
  Rect as DistRect,
  Scene as DistScene,
  Shape as DistShape,
  Utils as DistUtils, 
  Vec2 as DistVec2
} from '../build/bumpr.mjs';
import {
  Circ,
  CollisionDetection,
  Grid,
  Physics,
  Rect,
  Scene,
  Shape,
  Utils, 
  Vec2
} from '../build/es6/bumpr.js';

describe('Public Library Exports', () => {
  test('ES6 source exports Scene, Physics, CollisionDetection, Shape, and Spock primitives', () => {
    expect(Scene).toBeDefined();
    expect(Physics).toBeDefined();
    expect(CollisionDetection).toBeDefined();
    expect(Shape).toBeDefined();
    expect(Shape.circle).toBe('circle');
    expect(Shape.aabb).toBe('aabb');

    expect(Grid).toBeDefined();
    expect(Vec2).toBeDefined();
    expect(Circ).toBeDefined();
    expect(Rect).toBeDefined();
    expect(Utils).toBeDefined();

    const scene = new Scene();
    const body = new Physics(0, 0, 10, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    expect(scene.addBody(body)).toBe(true);
    expect(scene.bodiesLength).toBe(1);
  });

  test('Rollup bundled build/bumpr.mjs exports Scene, Physics, CollisionDetection, Shape, and Spock primitives', () => {
    expect(DistScene).toBeDefined();
    expect(DistPhysics).toBeDefined();
    expect(DistCollisionDetection).toBeDefined();
    expect(DistShape).toBeDefined();
    expect(DistShape.circle).toBe('circle');
    expect(DistShape.aabb).toBe('aabb');

    expect(DistGrid).toBeDefined();
    expect(DistVec2).toBeDefined();
    expect(DistCirc).toBeDefined();
    expect(DistRect).toBeDefined();
    expect(DistUtils).toBeDefined();

    const scene = new DistScene();
    const bodyA = new DistPhysics(0, 0, 5, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    const bodyB = new DistPhysics(8, 0, -5, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');

    scene.addBody(bodyA);
    scene.addBody(bodyB);

    expect(scene.bodiesLength).toBe(2);
    scene.test();

    // Check collision impulse through bundled export
    expect(bodyA.impulse.x).toBeLessThan(0);
    expect(bodyB.impulse.x).toBeGreaterThan(0);
  });
});


