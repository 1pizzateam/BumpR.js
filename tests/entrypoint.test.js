import * as BumprBundle from '../build/bumpr.mjs';
import * as BumprEs6 from '../build/es6/bumpr.js';
import {
  CollisionDetection as DistCollisionDetection,
  Physics as DistPhysics,
  Raycast as DistRaycast,
  Scene as DistScene,
  Shape as DistShape,
  DistanceConstraint as DistDistanceConstraint,
  Joint as DistJoint
} from '../build/bumpr.mjs';
import {
  CollisionDetection,
  Physics,
  Raycast,
  Scene,
  Shape,
  DistanceConstraint,
  Joint
} from '../build/es6/bumpr.js';
import { Vec2 } from '@1pizzateam/spock';

describe('Public Library Exports', () => {
  test('ES6 source exports only BumpR modules (Scene, Physics, CollisionDetection, Shape, Raycast, DistanceConstraint, Joint) and does not re-export Spock primitives', () => {
    expect(Scene).toBeDefined();
    expect(Physics).toBeDefined();
    expect(CollisionDetection).toBeDefined();
    expect(Shape).toBeDefined();
    expect(Raycast).toBeDefined();
    expect(DistanceConstraint).toBeDefined();
    expect(Joint).toBeDefined();
    expect(Shape.circle).toBe('circle');
    expect(Shape.aabb).toBe('aabb');

    // Verify Spock primitives are not re-exported
    expect(BumprEs6.Grid).toBeUndefined();
    expect(BumprEs6.Vec2).toBeUndefined();
    expect(BumprEs6.Circ).toBeUndefined();
    expect(BumprEs6.Rect).toBeUndefined();
    expect(BumprEs6.Utils).toBeUndefined();

    const scene = new Scene();
    const body = new Physics(
      new Vec2(0, 0),
      new Vec2(10, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.5,
      'circle'
    );
    expect(body.isDynamic()).toBe(true);
    body.setBodyType('kinematic');
    expect(body.isKinematic()).toBe(true);
    expect(scene.addBody(body)).toBe(true);
    expect(scene.bodiesLength).toBe(1);
  });

  test('Rollup bundled build/bumpr.mjs exports only BumpR modules and does not re-export Spock primitives', () => {
    expect(DistScene).toBeDefined();
    expect(DistPhysics).toBeDefined();
    expect(DistCollisionDetection).toBeDefined();
    expect(DistShape).toBeDefined();
    expect(DistRaycast).toBeDefined();
    expect(DistDistanceConstraint).toBeDefined();
    expect(DistJoint).toBeDefined();
    expect(DistShape.circle).toBe('circle');
    expect(DistShape.aabb).toBe('aabb');

    // Verify Spock primitives are not re-exported in bundled dist
    expect(BumprBundle.Grid).toBeUndefined();
    expect(BumprBundle.Vec2).toBeUndefined();
    expect(BumprBundle.Circ).toBeUndefined();
    expect(BumprBundle.Rect).toBeUndefined();
    expect(BumprBundle.Utils).toBeUndefined();

    const scene = new DistScene();
    const bodyA = new DistPhysics(
      new Vec2(0, 0),
      new Vec2(5, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.5,
      'circle'
    );
    const bodyB = new DistPhysics(
      new Vec2(8, 0),
      new Vec2(-5, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.5,
      'circle'
    );

    expect(bodyA.isDynamic()).toBe(true);
    expect(bodyB.isDynamic()).toBe(true);
    scene.addBody(bodyA);
    scene.addBody(bodyB);

    expect(scene.bodiesLength).toBe(2);
    scene.test();

    // Check collision impulse through bundled export
    expect(bodyA.impulse.x).toBeLessThan(0);
    expect(bodyB.impulse.x).toBeGreaterThan(0);
  });
});


