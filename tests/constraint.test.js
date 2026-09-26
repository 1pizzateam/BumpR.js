import { DistanceConstraint, Joint } from '../build/es6/constraint.js';
import { Physics } from '../build/es6/physics.js';
import { Vec2 } from '@1pizzateam/spock';

describe('DistanceConstraint and Joint', () => {
  test('Joint alias matches DistanceConstraint', () => {
    expect(Joint).toBe(DistanceConstraint);
  });

  test('Constructor initializes default distance, anchors, stiffness, damping, and collideConnected', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    const constraint = new DistanceConstraint(bodyA, bodyB);

    expect(constraint.bodyA).toBe(bodyA);
    expect(constraint.bodyB).toBe(bodyB);
    expect(constraint.getDistance()).toBe(100);
    expect(constraint.getMinDistance()).toBe(100);
    expect(constraint.getMaxDistance()).toBe(100);
    expect(constraint.getStiffness()).toBe(1.0);
    expect(constraint.getDamping()).toBe(0.1);
    expect(constraint.collideConnected).toBe(false);
    expect(constraint.isActive()).toBe(true);
  });

  test('Constructor with custom options and anchor offsets', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    const constraint = new DistanceConstraint(bodyA, bodyB, {
      distance: 60,
      minDistance: 40,
      maxDistance: 80,
      stiffness: 0.8,
      damping: 0.2,
      anchorA: new Vec2(10, 0),
      anchorB: new Vec2(-10, 0),
      collideConnected: true,
    });

    expect(constraint.getDistance()).toBe(60);
    expect(constraint.getMinDistance()).toBe(40);
    expect(constraint.getMaxDistance()).toBe(80);
    expect(constraint.getStiffness()).toBe(0.8);
    expect(constraint.getDamping()).toBe(0.2);
    expect(constraint.collideConnected).toBe(true);

    const worldA = constraint.getWorldAnchorA();
    const worldB = constraint.getWorldAnchorB();
    expect(worldA.x).toBe(10);
    expect(worldB.x).toBe(40);
    expect(constraint.getCurrentDistance()).toBe(30);

    const outA = new Vec2();
    expect(constraint.getWorldAnchorA(outA)).toBe(outA);
    expect(outA.x).toBe(10);
    const outB = new Vec2();
    expect(constraint.getWorldAnchorB(outB)).toBe(outB);
    expect(outB.x).toBe(40);
  });

  test('Factory methods: createRod, createRope, and createSpring', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');

    const rod = DistanceConstraint.createRod(bodyA, bodyB, 50);
    expect(rod.getStiffness()).toBe(1.0);
    expect(rod.getMinDistance()).toBe(50);
    expect(rod.getMaxDistance()).toBe(50);

    const rope = DistanceConstraint.createRope(bodyA, bodyB, 80);
    expect(rope.getMinDistance()).toBe(0);
    expect(rope.getMaxDistance()).toBe(80);
    expect(rope.getStiffness()).toBe(1.0);

    const spring = DistanceConstraint.createSpring(bodyA, bodyB, 0.5, 0.3, 60);
    expect(spring.getStiffness()).toBe(0.5);
    expect(spring.getDamping()).toBe(0.3);
    expect(spring.getDistance()).toBe(60);

    // Flexible argument ordering with length passed first (length > 1)
    const spring2 = DistanceConstraint.createSpring(bodyA, bodyB, 120, 0.25, 0.05);
    expect(spring2.getDistance()).toBe(120);
    expect(spring2.getStiffness()).toBe(0.25);
    expect(spring2.getDamping()).toBe(0.05);

    // Default parameters when only length is passed
    const spring3 = DistanceConstraint.createSpring(bodyA, bodyB, 150);
    expect(spring3.getDistance()).toBe(150);
    expect(spring3.getStiffness()).toBe(0.2);
    expect(spring3.getDamping()).toBe(0.1);
  });

  test('Getters and setters for distance, minDistance, maxDistance, stiffness, damping, and active', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB);

    constraint.setDistance(120);
    expect(constraint.getDistance()).toBe(120);
    expect(constraint.getMinDistance()).toBe(120);
    expect(constraint.getMaxDistance()).toBe(120);

    constraint.setMinDistance(80);
    expect(constraint.getMinDistance()).toBe(80);

    // Setting minDistance higher than maxDistance bumps maxDistance
    constraint.setMinDistance(150);
    expect(constraint.getMaxDistance()).toBe(150);

    constraint.setMaxDistance(200);
    expect(constraint.getMaxDistance()).toBe(200);

    // Setting maxDistance below minDistance clamps to minDistance
    constraint.setMaxDistance(50);
    expect(constraint.getMaxDistance()).toBe(150);

    constraint.setStiffness(0.4);
    expect(constraint.getStiffness()).toBe(0.4);
    constraint.setStiffness(-1);
    expect(constraint.getStiffness()).toBe(0);
    constraint.setStiffness(2);
    expect(constraint.getStiffness()).toBe(1);

    constraint.setDamping(0.7);
    expect(constraint.getDamping()).toBe(0.7);
    constraint.setDamping(-0.5);
    expect(constraint.getDamping()).toBe(0);
    constraint.setDamping(1.5);
    expect(constraint.getDamping()).toBe(1);

    constraint.setActive(false);
    expect(constraint.isActive()).toBe(false);
    constraint.setActive(true);
    expect(constraint.isActive()).toBe(true);
  });

  test('solve() early returns when inactive, bodies inactive, or both stationary and slack', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(50, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 50 });

    // Inactive constraint
    constraint.setActive(false);
    constraint.solve();
    expect(bodyA.position.x).toBe(0);

    // Inactive bodies
    constraint.setActive(true);
    bodyA.setActive(false);
    bodyB.setActive(false);
    constraint.solve();
    expect(bodyA.position.x).toBe(0);

    // Both stationary (sleeping or static)
    bodyA.setActive(true);
    bodyB.setActive(true);
    bodyA.isSleeping = true;
    bodyB.isSleeping = true;
    constraint.solve();
    expect(bodyA.position.x).toBe(0);

    // Distance within [minDistance, maxDistance]
    bodyA.isSleeping = false;
    bodyB.isSleeping = false;
    constraint.setMinDistance(30);
    constraint.setMaxDistance(70);
    constraint.solve();
    expect(bodyA.position.x).toBe(0);
    expect(bodyB.position.x).toBe(50);
  });

  test('solve() pulls bodies together when distance exceeds maxDistance', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 60, stiffness: 1.0, damping: 0 });

    constraint.solve();

    // Total distance was 100, target 60 -> error = 40
    // Equal mass (1.0 each) -> totalInvMass = 2.0
    // BodyA moves right by 40 * (1/2) = +20 -> x = 20
    // BodyB moves left by 40 * (1/2) = -20 -> x = 80
    // New distance = 80 - 20 = 60
    expect(bodyA.position.x).toBeCloseTo(20);
    expect(bodyB.position.x).toBeCloseTo(80);
    expect(constraint.getCurrentDistance()).toBeCloseTo(60);
  });

  test('solve() pushes bodies apart when distance is less than minDistance', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(20, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 60, stiffness: 1.0, damping: 0 });

    constraint.solve();

    // Total distance was 20, target 60 -> error = -40
    // BodyA moves left by -40 * (1/2) = -20 -> x = -20
    // BodyB moves right by +20 -> x = 40
    // New distance = 40 - (-20) = 60
    expect(bodyA.position.x).toBeCloseTo(-20);
    expect(bodyB.position.x).toBeCloseTo(40);
    expect(constraint.getCurrentDistance()).toBeCloseTo(60);
  });

  test('solve() with static body preserves static immobility and moves dynamic body 100%', () => {
    // Static anchor at origin
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1.0, 0.5, 'circle', 0, false, 0x1, 0xFFFF, 0, 'static');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 60, stiffness: 1.0, damping: 0 });

    constraint.solve();

    expect(bodyA.position.x).toBe(0);
    expect(bodyB.position.x).toBeCloseTo(60);
    expect(constraint.getCurrentDistance()).toBeCloseTo(60);
  });

  test('solve() with two static bodies early returns without NaN', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1.0, 0.5, 'circle', 0, false, 0x1, 0xFFFF, 0, 'static');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1.0, 0.5, 'circle', 0, false, 0x1, 0xFFFF, 0, 'static');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 50 });

    constraint.solve();

    expect(bodyA.position.x).toBe(0);
    expect(bodyB.position.x).toBe(100);
  });

  test('solve() with moving kinematic and static bodies where totalInvMass is 0', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(10, 0), new Vec2(20, 20), 0, 1.0, 0.5, 'circle', 0, false, 0x1, 0xFFFF, 0, 'kinematic');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 0, 1.0, 0.5, 'circle', 0, false, 0x1, 0xFFFF, 0, 'static');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 50 });

    constraint.solve();

    expect(bodyA.position.x).toBe(0);
    expect(bodyB.position.x).toBe(100);
  });

  test('solve() with concentric bodies (distance === 0) uses fallback normal', () => {
    const bodyA = new Physics(new Vec2(50, 50), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(50, 50), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 40, stiffness: 1.0, damping: 0 });

    constraint.solve();

    expect(Number.isNaN(bodyA.position.x)).toBe(false);
    expect(Number.isNaN(bodyB.position.x)).toBe(false);
    expect(constraint.getCurrentDistance()).toBeCloseTo(40);
  });

  test('solve() dampens relative velocity along constraint normal', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    // BodyB moving right at 100 px/s away from A
    const bodyB = new Physics(new Vec2(60, 0), new Vec2(100, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    // Start slightly perturbed so error !== 0 and constraint triggers
    bodyB.position.x = 61;

    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 60, stiffness: 1.0, damping: 0.5 });

    constraint.solve();

    // Damping impulse opposes relative velocity
    expect(bodyB.velocity.x).toBeLessThan(100);
    expect(bodyA.velocity.x).toBeGreaterThan(0);
  });

  test('solve() applies elastic restoring velocity impulse when stiffness < 1.0', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    // Rest length 60, current distance 100 -> error 40 -> spring pulls
    const spring = new DistanceConstraint(bodyA, bodyB, { distance: 60, stiffness: 0.2, damping: 0 });

    spring.solve();

    // BodyA should be accelerated towards BodyB (+x)
    expect(bodyA.velocity.x).toBeGreaterThan(0);
    // BodyB should be accelerated towards BodyA (-x)
    expect(bodyB.velocity.x).toBeLessThan(0);
  });

  test('solve() wakes up sleeping bodies when perturbed', () => {
    const bodyA = new Physics(new Vec2(0, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(100, 0), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    bodyA.isSleeping = true;
    bodyB.isSleeping = true;

    // Perturb bodyA slightly while keeping isStationary false for at least one
    bodyA.isSleeping = false;
    const constraint = new DistanceConstraint(bodyA, bodyB, { distance: 50 });

    constraint.solve();

    expect(bodyA.isSleeping).toBe(false);
    expect(bodyB.isSleeping).toBe(false);
  });

  test('draw() renders line onto canvas context', () => {
    const bodyA = new Physics(new Vec2(10, 20), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const bodyB = new Physics(new Vec2(80, 60), new Vec2(0, 0), new Vec2(20, 20), 1.0, 1.0, 0.5, 'circle');
    const constraint = new DistanceConstraint(bodyA, bodyB);

    const calls = [];
    const mockContext = {
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      beginPath: () => calls.push('beginPath'),
      moveTo: (x, y) => calls.push(`moveTo(${x},${y})`),
      lineTo: (x, y) => calls.push(`lineTo(${x},${y})`),
      stroke: () => calls.push('stroke'),
      strokeStyle: '',
      lineWidth: 0,
    };

    constraint.draw(mockContext, '#ff0000', 3);

    expect(calls).toEqual([
      'save',
      'beginPath',
      'moveTo(10,20)',
      'lineTo(80,60)',
      'stroke',
      'restore',
    ]);
    expect(mockContext.strokeStyle).toBe('#ff0000');
    expect(mockContext.lineWidth).toBe(3);

    // Inactive constraint does not draw
    constraint.setActive(false);
    calls.length = 0;
    constraint.draw(mockContext);
    expect(calls.length).toBe(0);
  });
});
