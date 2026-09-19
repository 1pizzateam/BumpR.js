import { Circ, Grid, Rect, Vec2 } from '@1pizzateam/spock';
import { Physics } from '../build/es6/physics.js';

describe('Physics Engine', () => {
  test('Restitution is stored as positive value', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, 0.75, 'circle');
    expect(body.restitution).toBe(0.75);
    expect(body.restitution).toBeGreaterThanOrEqual(0);
  });

  test('Impulses accumulate across multiple collisions in a single step', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');
    const dummyOther = new Physics(10, 10, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');

    const impulse1 = new Vec2(5, 2);
    const impulse2 = new Vec2(3, 4);

    body.collision(impulse1, dummyOther);
    body.collision(impulse2, dummyOther);

    expect(body.impulse.x).toBe(8); // 5 + 3
    expect(body.impulse.y).toBe(6); // 2 + 4
  });

  test('Reset cleans up all transient simulation state and restores initial velocity', () => {
    const body = new Physics(0, 0, 10, 5, 10, 10, 1.0, 0.8, 0.5, 'circle');
    const dummyOther = new Physics(10, 10, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');

    body.collision(new Vec2(5, 5), dummyOther);
    body.force.setScalar(2, 3);
    body.translate.setScalar(1, 1);

    expect(body.impulse.isOrigin()).toBe(false);

    body.reset();

    expect(body.velocity.x).toBe(10);
    expect(body.velocity.y).toBe(5);
    expect(body.impulse.isOrigin()).toBe(true);
    expect(body.force.isOrigin()).toBe(true);
    expect(body.translate.isOrigin()).toBe(true);
    expect(body.damageTaken).toBe(0);
  });

  test('Velocity damping scales down velocity over time', () => {
    // damping = 0.5, initial velocity = (100, 0)
    const body = new Physics(0, 0, 100, 0, 10, 10, 1.0, 0.5, 0.5, 'circle');
    body.setGravity(0, 0);

    body.updatePosition(1.0); // 1 second: velocity scaled by 0.5^1.0 = 0.5

    expect(body.velocity.x).toBeCloseTo(50, 2);
    expect(body.velocity.y).toBe(0);
  });

  test('Continuous force accelerates body proportionally to inverseMass', () => {
    // mass = 2.0 -> inverseMass = 0.5
    const body = new Physics(0, 0, 0, 0, 10, 10, 2.0, 1.0, 0.5, 'circle');
    body.setGravity(0, 0);

    body.force.setScalar(40, 20); // F = (40, 20)
    body.updatePosition(0.5); // dt = 0.5

    // acc = F * invMass = (20, 10)
    // deltaV = acc * dt = (10, 5)
    expect(body.velocity.x).toBeCloseTo(10, 2);
    expect(body.velocity.y).toBeCloseTo(5, 2);
    expect(body.force.isOrigin()).toBe(true); // force reset after step
  });

  test('setPosition updates position and internal body shape', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'rectangle');
    body.setPosition(45, 60);

    expect(body.position.x).toBe(45);
    expect(body.position.y).toBe(60);
    expect(body.body.position.x).toBe(45);
    expect(body.body.position.y).toBe(60);
  });

  test('updatePosition updates Rect corners and grid position during movement', () => {
    // 20x20 rect at (0, 0), moving at (100, 50)
    const body = new Physics(0, 0, 100, 50, 20, 20, 1.0, 1.0, 0.0, 'rectangle');
    body.setGravity(0, 0);

    // Initial topLeftCorner should be (-10, -10)
    expect(body.body.topLeftCorner.x).toBe(-10);
    expect(body.body.topLeftCorner.y).toBe(-10);

    body.updatePosition(0.5); // moves by (50, 25)

    expect(body.position.x).toBe(50);
    expect(body.position.y).toBe(25);
    // topLeftCorner should now be (40, 15)
    expect(body.body.topLeftCorner.x).toBe(40);
    expect(body.body.topLeftCorner.y).toBe(15);
    // bottomRightCorner should now be (60, 35)
    expect(body.body.bottomRightCorner.x).toBe(60);
    expect(body.body.bottomRightCorner.y).toBe(35);
  });

  test('type = "aabb" instantiates a Rect shape', () => {
    const body = new Physics(10, 20, 0, 0, 30, 40, 1.0, 0.8, 0.5, 'aabb');
    expect(body.body.shape).toBe('aabb');
    expect(body.body.size.x).toBe(30);
    expect(body.body.size.y).toBe(40);
  });

  test('Mass and damping boundary clamping', () => {
    // Negative mass clamped to 0
    const staticBody = new Physics(0, 0, 0, 0, 10, 10, -5, 0.8, 0.5, 'circle');
    expect(staticBody.getMass()).toBe(0);
    expect(staticBody.inverseMass).toBe(0);

    // Negative damping clamped to 0
    const clampedDamping = new Physics(0, 0, 0, 0, 10, 10, 1.0, -0.5, 0.5, 'circle');
    expect(clampedDamping.getDamping()).toBe(0);

    // Damping > 1 clamped to 1
    clampedDamping.setDamping(1.5);
    expect(clampedDamping.getDamping()).toBe(1);
  });

  test('Getters and setters work correctly', () => {
    const body = new Physics(0, 0, 10, 20, 10, 10, 2.0, 0.8, 0.5, 'circle');

    body.setVelocity(30, 40);
    expect(body.getVelocity().x).toBe(30);
    expect(body.getVelocity().y).toBe(40);

    body.setVelocityFromVector(new Vec2(50, 60));
    expect(body.getVelocity().x).toBe(50);
    expect(body.getVelocity().y).toBe(60);

    body.setPositionFromVector(new Vec2(70, 80));
    expect(body.getPosition().x).toBe(70);
    expect(body.getPosition().y).toBe(80);

    body.setInitialVelocity(5, 10);
    expect(body.getInitialVelocity().x).toBe(5);
    expect(body.getInitialVelocity().y).toBe(10);

    body.setMass(4.0);
    expect(body.getMass()).toBe(4.0);
    expect(body.inverseMass).toBe(0.25);

    body.setMass(0);
    expect(body.getMass()).toBe(0);
    expect(body.inverseMass).toBe(0);

    body.setRestitution(0.9);
    expect(body.getRestitution()).toBe(0.9);

    body.setDamageDealt(5);
    expect(body.getDamageDealt()).toBe(5);
    expect(body.getDamageTaken()).toBe(0);
  });

  test('Active state toggles correctly', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');
    expect(body.isActive()).toBe(true);

    body.setInactive();
    expect(body.isActive()).toBe(false);

    body.setActive();
    expect(body.isActive()).toBe(true);

    body.toggleActive();
    expect(body.isActive()).toBe(false);
  });

  test('Draw forwards call to body.draw', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');
    let called = false;
    body.body.draw = (ctx, fill, stroke, width) => {
      called = true;
    };
    body.draw({}, '#ff0000', '#000000', 1);
    expect(called).toBe(true);
  });

  test('getBody returns underlying Spock shape and setSize updates it', () => {
    const circle = new Physics(0, 0, 0, 0, 15, 15, 1.0, 0.8, 0.5, 'circle');
    expect(circle.getBody()).toBeInstanceOf(Circ);
    expect(circle.getBody().radius).toBe(15);
    circle.setSize(25);
    expect(circle.getBody().radius).toBe(25);

    const aabb = new Physics(0, 0, 0, 0, 20, 30, 1.0, 0.8, 0.5, 'aabb');
    expect(aabb.getBody()).toBeInstanceOf(Rect);
    expect(aabb.getBody().size.x).toBe(20);
    expect(aabb.getBody().size.y).toBe(30);
    aabb.setSize(40, 50);
    expect(aabb.getBody().size.x).toBe(40);
    expect(aabb.getBody().size.y).toBe(50);
    // Square shortcut (single argument)
    aabb.setSize(60);
    expect(aabb.getBody().size.x).toBe(60);
    expect(aabb.getBody().size.y).toBe(60);
  });

  test('setGrid and getGrid manage Spock Grid attachment on body', () => {
    const body = new Physics(50, 50, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');
    expect(body.getGrid()).toBeNull();

    const grid = new Grid(800, 600, 32);
    body.setGrid(grid);
    expect(body.getGrid()).toBe(grid);
    expect(body.body.gridCells.length).toBeGreaterThan(0);
    expect(body.body.gridCells[0]).not.toBe(-1);

    body.setGrid(null);
    expect(body.getGrid()).toBeNull();
  });

  test('Restitution is clamped between 0 and 1 via Spock Utils', () => {
    const under = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, -0.5, 'circle');
    expect(under.getRestitution()).toBe(0);

    const over = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, 1.5, 'circle');
    expect(over.getRestitution()).toBe(1);

    under.setRestitution(-1);
    expect(under.getRestitution()).toBe(0);

    under.setRestitution(2);
    expect(under.getRestitution()).toBe(1);
  });

  test('updatePosition integrates impulse into velocity and clears impulse', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 2.0, 1.0, 0.5, 'circle');
    const other = new Physics(0, 0, 0, 0, 10, 10, 1.0, 1.0, 0.5, 'circle');
    body.collision(new Vec2(10, 20), other);
    expect(body.impulse.x).toBe(10);
    expect(body.impulse.y).toBe(20);

    // updatePosition should integrate impulse * inverseMass (10 * 0.5 = 5, 20 * 0.5 = 10)
    body.updatePosition(1.0);
    expect(body.velocity.x).toBe(5);
    expect(body.velocity.y).toBe(10);
    expect(body.impulse.isOrigin()).toBe(true);
  });

  test('applyDamage returns false when no damage was taken or body inactive', () => {
    const body = new Physics(0, 0, 0, 0, 10, 10, 1.0, 0.8, 0.5, 'circle');
    expect(body.applyDamage()).toBe(false);

    body.damageTaken = 10;
    body.setInactive();
    expect(body.applyDamage()).toBe(false);
  });
});


