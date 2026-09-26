import { Circ, Grid, Rect, Vec2 } from '@1pizzateam/spock';
import { Physics } from '../build/es6/physics.js';

describe('Physics Engine', () => {
  test('Restitution is stored as positive value', () => {
    const body = new Physics(
      new Vec2(0, 0),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      0.8,
      0.75,
      'circle'
    );
    expect(body.restitution).toBe(0.75);
    expect(body.restitution).toBeGreaterThanOrEqual(0);
  });

  test('Impulses accumulate across multiple collisions in a single step', () => {
    const body = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1.0, 0.8, 0.5, 'circle');
    const dummyOther = new Physics(new Vec2(10, 10), new Vec2(), new Vec2(20, 20), 1.0, 0.8, 0.5, 'circle');

    const impulse1 = new Vec2(5, 2);
    const impulse2 = new Vec2(3, 4);

    body.collision(impulse1, dummyOther);
    body.collision(impulse2, dummyOther);

    expect(body.impulse.x).toBe(8); // 5 + 3
    expect(body.impulse.y).toBe(6); // 2 + 4
  });

  test('Reset cleans up all transient simulation state and restores initial velocity', () => {
    const body = new Physics(
      new Vec2(),
      new Vec2(10, 5),
      new Vec2(20, 20),
      1.0,
      0.8,
      0.5,
      'circle'
    );
    const dummyOther = new Physics(new Vec2(10, 10), new Vec2(), new Vec2(20, 20), 1.0, 0.8, 0.5, 'circle');

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
    const body = new Physics(
      new Vec2(),
      new Vec2(100, 0),
      new Vec2(20, 20),
      1.0,
      0.5,
      0.5,
      'circle'
    );
    body.setGravity(new Vec2(0, 0));

    body.updatePosition(1.0); // 1 second: velocity scaled by 0.5^1.0 = 0.5

    expect(body.velocity.x).toBeCloseTo(50, 2);
    expect(body.velocity.y).toBe(0);
  });

  test('Continuous force accelerates body proportionally to inverseMass', () => {
    // mass = 2.0 -> inverseMass = 0.5
    const body = new Physics(
      new Vec2(),
      new Vec2(),
      new Vec2(20, 20),
      2.0,
      1.0,
      0.5,
      'circle'
    );
    body.setGravity(new Vec2(0, 0));

    body.force.setScalar(40, 20); // F = (40, 20)
    body.updatePosition(0.5); // dt = 0.5

    // acc = F * invMass = (20, 10)
    // deltaV = acc * dt = (10, 5)
    expect(body.velocity.x).toBeCloseTo(10, 2);
    expect(body.velocity.y).toBeCloseTo(5, 2);
    expect(body.force.isOrigin()).toBe(true); // force reset after step
  });

  test('setPosition updates position and internal body shape', () => {
    const body = new Physics(new Vec2(), new Vec2(), new Vec2(10, 10), 1.0, 0.8, 0, 'aabb');
    body.setPosition(new Vec2(45, 60));

    expect(body.position.x).toBe(45);
    expect(body.position.y).toBe(60);
    expect(body.body.position.x).toBe(45);
    expect(body.body.position.y).toBe(60);
  });

  test('updatePosition updates Rect corners and grid position during movement', () => {
    // 20x20 rect at (0, 0), moving at (100, 50)
    const body = new Physics(
      new Vec2(0, 0),
      new Vec2(100, 50),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.0,
      'aabb'
    );
    body.setGravity(new Vec2(0, 0));

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

  test('shape = "aabb" instantiates a Rect shape', () => {
    const body = new Physics(
      new Vec2(10, 20),
      new Vec2(),
      new Vec2(30, 40),
      1.0,
      0.8,
      0,
      'aabb'
    );
    expect(body.body.shape).toBe('aabb');
    expect(body.body.size.x).toBe(30);
    expect(body.body.size.y).toBe(40);
  });

  test('Mass and damping boundary clamping', () => {
    // Negative mass clamped to 0
    const staticBody = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), -5);
    expect(staticBody.getMass()).toBe(0);
    expect(staticBody.inverseMass).toBe(0);

    // Negative damping clamped to 0
    const clampedDamping = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1.0, -0.5);
    expect(clampedDamping.getDamping()).toBe(0);

    // Damping > 1 clamped to 1
    clampedDamping.setDamping(1.5);
    expect(clampedDamping.getDamping()).toBe(1);
  });

  test('Getters and setters work correctly', () => {
    const body = new Physics(
      new Vec2(),
      new Vec2(10, 20),
      new Vec2(20, 20),
      2.0,
      0.8,
      0.5,
      'circle'
    );

    body.setVelocity(new Vec2(30, 40));
    expect(body.getVelocity().x).toBe(30);
    expect(body.getVelocity().y).toBe(40);

    body.setVelocity(new Vec2(45, 55));
    expect(body.getVelocity().x).toBe(45);
    expect(body.getVelocity().y).toBe(55);

    body.setPosition(new Vec2(10, 20));
    expect(body.getPosition().x).toBe(10);
    expect(body.getPosition().y).toBe(20);

    body.setPosition(new Vec2(100, 200));
    expect(body.getPosition().x).toBe(100);
    expect(body.getPosition().y).toBe(200);

    body.setInitialVelocity(new Vec2(5, 10));
    expect(body.getInitialVelocity().x).toBe(5);
    expect(body.getInitialVelocity().y).toBe(10);

    body.setInitialVelocity(new Vec2(15, 25));
    expect(body.getInitialVelocity().x).toBe(15);
    expect(body.getInitialVelocity().y).toBe(25);

    body.setGravity(new Vec2(10, 20));
    expect(body.gravity.x).toBe(10);
    expect(body.gravity.y).toBe(20);

    body.setMass(4.0);
    expect(body.getMass()).toBe(4.0);
    expect(body.inverseMass).toBe(0.25);

    body.setMass(0);
    expect(body.getMass()).toBe(0);
    expect(body.inverseMass).toBe(0);

    body.setRestitution(0.9);
    expect(body.getRestitution()).toBe(0.9);

    body.setFriction(0.75);
    expect(body.getFriction()).toBe(0.75);

    body.setFriction(-0.2);
    expect(body.getFriction()).toBe(0);

    body.setFriction(1.5);
    expect(body.getFriction()).toBe(1);

    body.setDamageDealt(5);
    expect(body.getDamageDealt()).toBe(5);
    expect(body.getDamageTaken()).toBe(0);
  });

  test('Friction defaults: circle defaults to 0, AABB defaults to 0.6', () => {
    const circle = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1, 0.8, 0, 'circle');
    expect(circle.getFriction()).toBe(0);

    const aabb = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1, 0.8, 0, 'aabb');
    expect(aabb.getFriction()).toBe(0.6);

    const rect = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1, 0.8, 0, 'rectangle');
    expect(rect.getFriction()).toBe(0.6);

    const custom = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1, 0.8, 0, 'aabb', 0.85);
    expect(custom.getFriction()).toBe(0.85);
  });

  test('Active state toggles correctly', () => {
    const body = new Physics();
    expect(body.isActive()).toBe(true);

    body.setInactive();
    expect(body.isActive()).toBe(false);

    body.setActive();
    expect(body.isActive()).toBe(true);

    body.toggleActive();
    expect(body.isActive()).toBe(false);
  });

  test('Draw forwards call to body.draw', () => {
    const body = new Physics();
    let called = false;
    body.body.draw = (_ctx, _fill, _stroke, _width) => {
      called = true;
    };
    body.draw({}, '#ff0000', '#000000', 1);
    expect(called).toBe(true);
  });

  test('getBody returns underlying Spock shape and setSize updates it', () => {
    const circle = new Physics(new Vec2(), new Vec2(), new Vec2(30, 30), 1, 0.8, 0, 'circle');
    expect(circle.getBody()).toBeInstanceOf(Circ);
    expect(circle.getBody().radius).toBe(15);
    circle.setSize(25);
    expect(circle.getBody().radius).toBe(25);
    circle.setSize(new Vec2(35, 35));
    expect(circle.getBody().radius).toBe(35);
    circle.setRadius(40);
    expect(circle.getBody().radius).toBe(40);

    const aabb = new Physics(new Vec2(), new Vec2(), new Vec2(20, 30), 1, 0.8, 0, 'aabb');
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
    // Vec2 overload
    aabb.setSize(new Vec2(70, 80));
    expect(aabb.getBody().size.x).toBe(70);
    expect(aabb.getBody().size.y).toBe(80);
  });

  test('setGrid and getGrid manage Spock Grid attachment on body', () => {
    const body = new Physics(new Vec2(50, 50));
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
    const under = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1, 0.8, -0.5);
    expect(under.getRestitution()).toBe(0);

    const over = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1, 0.8, 1.5);
    expect(over.getRestitution()).toBe(1);

    under.setRestitution(-1);
    expect(under.getRestitution()).toBe(0);

    under.setRestitution(2);
    expect(under.getRestitution()).toBe(1);
  });

  test('updatePosition integrates impulse into velocity and clears impulse', () => {
    const body = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 2.0, 1.0, 0.5);
    const other = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1.0, 1.0, 0.5);
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
    const body = new Physics();
    expect(body.applyDamage()).toBe(false);

    body.damageTaken = 10;
    body.setInactive();
    expect(body.applyDamage()).toBe(false);
  });

  test('Velocity damping caches factor across consistent and varied timesteps', () => {
    const body = new Physics(
      new Vec2(),
      new Vec2(100, 0),
      new Vec2(20, 20),
      1.0,
      0.5,
      0.5
    );
    body.setGravity(new Vec2(0, 0));

    // Frame 1 with dt = 0.5
    body.updatePosition(0.5); // 100 * 0.5^0.5 = 100 * 0.707106 = ~70.71
    expect(body.velocity.x).toBeCloseTo(70.71, 1);

    // Frame 2 with same dt = 0.5 (hits cache)
    body.updatePosition(0.5); // 70.71 * 0.707106 = ~50
    expect(body.velocity.x).toBeCloseTo(50, 1);

    // Frame 3 with new dt = 1.0 (invalidates and updates cache)
    body.updatePosition(1.0); // 50 * 0.5^1.0 = ~25
    expect(body.velocity.x).toBeCloseTo(25, 1);
  });

  test('Clones vector arguments to protect against external mutation', () => {
    const pos = new Vec2(10, 20);
    const vel = new Vec2(30, 40);
    const size = new Vec2(50, 60);
    const body = new Physics(pos, vel, size);

    pos.setScalar(999, 999);
    vel.setScalar(888, 888);
    size.setScalar(777, 777);

    expect(body.position.x).toBe(10);
    expect(body.position.y).toBe(20);
    expect(body.velocity.x).toBe(30);
    expect(body.velocity.y).toBe(40);
    expect(body.getBody().radius).toBe(25); // 50 * 0.5
  });

  test('updatePosition returns early if second <= 0 or velocity is zero', () => {
    const body = new Physics(new Vec2(), new Vec2(0, 0));
    expect(body.updatePosition(0)).toBe(body.position);
    expect(body.updatePosition(0.016)).toBe(body.position);
  });

  describe('Body Sleeping and Deactivation', () => {
    test('Default sleep configuration properties and getters/setters', () => {
      const body = new Physics();
      expect(body.getIsSleeping()).toBe(false);
      expect(body.getCanSleep()).toBe(true);
      expect(body.getSleepThreshold()).toBe(0.1);
      expect(body.getSleepStepsThreshold()).toBe(60);

      body.setSleepThreshold(0.5);
      expect(body.getSleepThreshold()).toBe(0.5);
      body.setSleepThreshold(-5);
      expect(body.getSleepThreshold()).toBe(0);

      body.setSleepStepsThreshold(30);
      expect(body.getSleepStepsThreshold()).toBe(30);
      body.setSleepStepsThreshold(0);
      expect(body.getSleepStepsThreshold()).toBe(1);
    });

    test('Manual sleep() and wakeUp() state transitions', () => {
      const body = new Physics(new Vec2(10, 10), new Vec2(5, 5));
      body.idleSteps = 10;
      body.sleep();
      expect(body.isSleeping).toBe(true);
      expect(body.getIsSleeping()).toBe(true);
      expect(body.velocity.isOrigin()).toBe(true);
      expect(body.idleSteps).toBe(0);

      body.wakeUp();
      expect(body.isSleeping).toBe(false);
      expect(body.getIsSleeping()).toBe(false);
    });

    test('canSleep = false disables sleep and wakes up body', () => {
      const body = new Physics();
      body.sleep();
      expect(body.isSleeping).toBe(true);

      body.setCanSleep(false);
      expect(body.isSleeping).toBe(false);
      expect(body.getCanSleep()).toBe(false);

      body.sleep();
      expect(body.isSleeping).toBe(false);
    });

    test('updatePosition transitions to sleep after sleepStepsThreshold idle steps', () => {
      const body = new Physics(new Vec2(0, 0), new Vec2(0.05, 0.05));
      body.setSleepStepsThreshold(3);
      body.setSleepThreshold(0.1);

      // Step 1: idleSteps becomes 1
      body.updatePosition(0.016);
      expect(body.isSleeping).toBe(false);
      expect(body.idleSteps).toBe(1);

      // Step 2: idleSteps becomes 2
      body.updatePosition(0.016);
      expect(body.isSleeping).toBe(false);
      expect(body.idleSteps).toBe(2);

      // Step 3: reaches threshold 3, transitions to sleep
      body.updatePosition(0.016);
      expect(body.isSleeping).toBe(true);
      expect(body.idleSteps).toBe(0);
      expect(body.velocity.isOrigin()).toBe(true);

      // Step 4: sleeping body does not move
      const posBefore = body.position.clone();
      body.updatePosition(0.016);
      expect(body.position.x).toBe(posBefore.x);
      expect(body.position.y).toBe(posBefore.y);
    });

    test('Velocity exceeding sleepThreshold resets idleSteps', () => {
      const body = new Physics(new Vec2(0, 0), new Vec2(0.05, 0));
      body.setSleepStepsThreshold(5);

      body.updatePosition(0.016);
      expect(body.idleSteps).toBe(1);

      // Increase velocity above threshold
      body.velocity.setScalar(10, 0);
      body.updatePosition(0.016);
      expect(body.idleSteps).toBe(0);
      expect(body.isSleeping).toBe(false);
    });

    test('Sleeping body wakes up on applyForce, applyImpulseVector, setPosition, setVelocity, and reset', () => {
      const body = new Physics();
      body.sleep();
      expect(body.isSleeping).toBe(true);

      body.applyForce(new Vec2(10, 0));
      expect(body.isSleeping).toBe(false);

      body.sleep();
      body.applyImpulseVector(new Vec2(5, 5));
      expect(body.isSleeping).toBe(false);

      body.sleep();
      body.setPosition(new Vec2(50, 50));
      expect(body.isSleeping).toBe(false);

      body.sleep();
      body.setVelocity(new Vec2(1, 1));
      expect(body.isSleeping).toBe(false);

      body.sleep();
      body.reset();
      expect(body.isSleeping).toBe(false);
    });

    test('Sleeping body wakes up if force or impulse is queued before updatePosition', () => {
      const body = new Physics();
      body.sleep();
      expect(body.isSleeping).toBe(true);

      body.force.setScalar(20, 0);
      body.updatePosition(0.016);
      expect(body.isSleeping).toBe(false);
      expect(body.velocity.x).toBeGreaterThan(0);
    });
  });

  describe('Collision Callbacks and Contact Events', () => {
    test('onCollision callback is called with other, normal, and impulse on collision', () => {
      const body = new Physics(new Vec2(0, 0), new Vec2(10, 0));
      const other = new Physics(new Vec2(15, 0), new Vec2(-10, 0));

      let receivedOther = null;
      let receivedNormal = null;
      let receivedImpulse = null;

      body.onCollision = (o, normal, impulse) => {
        receivedOther = o;
        receivedNormal = normal;
        receivedImpulse = impulse;
      };

      const testImpulse = new Vec2(-5, 0);
      const testNormal = new Vec2(-1, 0);
      body.collision(testImpulse, other, testNormal);

      expect(receivedOther).toBe(other);
      expect(receivedNormal.x).toBe(-1);
      expect(receivedNormal.y).toBe(0);
      expect(receivedImpulse.x).toBe(-5);
      expect(receivedImpulse.y).toBe(0);
    });

    test('setOnCollision and getOnCollision manage callback reference', () => {
      const body = new Physics();
      const fn = () => {};
      body.setOnCollision(fn);
      expect(body.getOnCollision()).toBe(fn);

      body.setOnCollision(null);
      expect(body.getOnCollision()).toBeNull();
    });

    test('addCollisionListener, removeCollisionListener, and clearCollisionListeners', () => {
      const body = new Physics();
      const other = new Physics();
      let count1 = 0;
      let count2 = 0;

      const listener1 = () => { count1++; };
      const listener2 = () => { count2++; };

      body.addCollisionListener(listener1);
      body.addCollisionListener(listener2);
      // Adding duplicate listener should not duplicate calls
      body.addCollisionListener(listener1);

      body.collision(new Vec2(1, 0), other);
      expect(count1).toBe(1);
      expect(count2).toBe(1);

      expect(body.removeCollisionListener(listener1)).toBe(true);
      expect(body.removeCollisionListener(listener1)).toBe(false);

      body.collision(new Vec2(1, 0), other);
      expect(count1).toBe(1);
      expect(count2).toBe(2);

      body.clearCollisionListeners();
      body.collision(new Vec2(1, 0), other);
      expect(count2).toBe(2);
    });

    test('Callback vectors are safe from mutation and default to zero vector if normal omitted', () => {
      const body = new Physics();
      const other = new Physics();
      const impulse = new Vec2(10, 20);

      let savedNormal = null;
      let savedImpulse = null;

      body.onCollision = (o, n, imp) => {
        savedNormal = n;
        savedImpulse = imp;
        n.x = 999;
        imp.x = 888;
      };

      body.collision(impulse, other);
      expect(savedNormal.x).toBe(999);
      expect(impulse.x).toBe(10); // Original impulse was not mutated
    });
  });

  describe('Sensor and Trigger Bodies', () => {
    test('isSensor defaults to false and can be configured via constructor or setters', () => {
      const normalBody = new Physics();
      expect(normalBody.isSensor).toBe(false);
      expect(normalBody.getSensor()).toBe(false);
      expect(normalBody.getIsSensor()).toBe(false);

      normalBody.setSensor(true);
      expect(normalBody.isSensor).toBe(true);
      expect(normalBody.getSensor()).toBe(true);
      expect(normalBody.getIsSensor()).toBe(true);

      const sensorBody = new Physics(
        new Vec2(10, 10),
        new Vec2(0, 0),
        new Vec2(20, 20),
        0,
        0.8,
        0,
        'aabb',
        0.6,
        true
      );
      expect(sensorBody.isSensor).toBe(true);
      expect(sensorBody.getSensor()).toBe(true);
      expect(sensorBody.getIsSensor()).toBe(true);
    });

    test('isSensor survives reset()', () => {
      const sensor = new Physics();
      sensor.setSensor(true);
      sensor.reset();
      expect(sensor.isSensor).toBe(true);
    });
  });

  describe('Collision Filtering (Layers, Masks, Categories, Groups)', () => {
    test('Default filtering configuration collides with everything', () => {
      const a = new Physics();
      const b = new Physics();

      expect(a.collisionCategory).toBe(0x0001);
      expect(a.collisionMask).toBe(0xFFFF);
      expect(a.collisionGroup).toBe(0);
      expect(a.getCollisionCategory()).toBe(0x0001);
      expect(a.getCollisionMask()).toBe(0xFFFF);
      expect(a.getCollisionGroup()).toBe(0);

      expect(a.canCollideWith(b)).toBe(true);
      expect(b.canCollideWith(a)).toBe(true);
    });

    test('Setters and constructor parameters update category, mask, and group', () => {
      const body = new Physics();
      body.setCollisionCategory(0x0004);
      body.setCollisionMask(0x0002);
      body.setCollisionGroup(-3);

      expect(body.getCollisionCategory()).toBe(0x0004);
      expect(body.getCollisionMask()).toBe(0x0002);
      expect(body.getCollisionGroup()).toBe(-3);

      const customBody = new Physics(
        new Vec2(0, 0),
        new Vec2(0, 0),
        new Vec2(20, 20),
        1,
        0.8,
        0,
        'circle',
        0,
        false,
        0x0008,
        0x0001,
        5
      );
      expect(customBody.getCollisionCategory()).toBe(0x0008);
      expect(customBody.getCollisionMask()).toBe(0x0001);
      expect(customBody.getCollisionGroup()).toBe(5);
    });

    test('Category and mask filtering requires bidirectional agreement', () => {
      const player = new Physics();
      player.setCollisionCategory(0x0002);
      player.setCollisionMask(0x0001 | 0x0004); // Collides with Wall (1) and Enemy (4)

      const bullet = new Physics();
      bullet.setCollisionCategory(0x0008);
      bullet.setCollisionMask(0x0004); // Bullet only collides with Enemy (4)

      // Player and bullet: player excludes bullet (8), bullet excludes player (2)
      expect(player.canCollideWith(bullet)).toBe(false);
      expect(bullet.canCollideWith(player)).toBe(false);

      // Asymmetric mask: A includes B, but B excludes A
      const friendlyWall = new Physics();
      friendlyWall.setCollisionCategory(0x0001);
      friendlyWall.setCollisionMask(0x0002); // Wall accepts player

      const rogueBullet = new Physics();
      rogueBullet.setCollisionCategory(0x0008);
      rogueBullet.setCollisionMask(0x0001); // Bullet accepts wall, but wall excludes bullet (8)

      expect(rogueBullet.canCollideWith(friendlyWall)).toBe(false);
      expect(friendlyWall.canCollideWith(rogueBullet)).toBe(false);
    });

    test('Collision group index overrides category/mask filtering', () => {
      const ragdollPart1 = new Physics();
      const ragdollPart2 = new Physics();

      // Identical negative group never collides
      ragdollPart1.setCollisionGroup(-1);
      ragdollPart2.setCollisionGroup(-1);
      expect(ragdollPart1.canCollideWith(ragdollPart2)).toBe(false);
      expect(ragdollPart2.canCollideWith(ragdollPart1)).toBe(false);

      // Identical positive group always collides, even if masks are 0
      const teamA1 = new Physics();
      const teamA2 = new Physics();
      teamA1.setCollisionGroup(2);
      teamA1.setCollisionMask(0x0000); // 0 mask would normally reject
      teamA2.setCollisionGroup(2);
      teamA2.setCollisionMask(0x0000);
      expect(teamA1.canCollideWith(teamA2)).toBe(true);

      // Different non-zero groups fall back to category/mask check
      const obj1 = new Physics();
      const obj2 = new Physics();
      obj1.setCollisionGroup(1);
      obj1.setCollisionCategory(0x0002);
      obj1.setCollisionMask(0x0004);

      obj2.setCollisionGroup(2);
      obj2.setCollisionCategory(0x0004);
      obj2.setCollisionMask(0x0002);

      expect(obj1.canCollideWith(obj2)).toBe(true);

      // Different groups with non-matching mask
      obj2.setCollisionMask(0x0001);
      expect(obj1.canCollideWith(obj2)).toBe(false);
    });
  });

  describe('Explicit Body Types (dynamic | static | kinematic)', () => {
    test('Default body types inferred from mass and velocity', () => {
      const dynamicBody = new Physics(new Vec2(), new Vec2(10, 0), new Vec2(20, 20), 2.0);
      expect(dynamicBody.getBodyType()).toBe('dynamic');
      expect(dynamicBody.isDynamic()).toBe(true);
      expect(dynamicBody.isStatic()).toBe(false);
      expect(dynamicBody.isKinematic()).toBe(false);

      const staticBody = new Physics(new Vec2(), new Vec2(0, 0), new Vec2(20, 20), 0);
      expect(staticBody.getBodyType()).toBe('static');
      expect(staticBody.isStatic()).toBe(true);
      expect(staticBody.isDynamic()).toBe(false);
      expect(staticBody.isKinematic()).toBe(false);
      expect(staticBody.getMass()).toBe(0);

      const kinematicBody = new Physics(new Vec2(), new Vec2(50, 0), new Vec2(20, 20), 0);
      expect(kinematicBody.getBodyType()).toBe('kinematic');
      expect(kinematicBody.isKinematic()).toBe(true);
      expect(kinematicBody.isDynamic()).toBe(false);
      expect(kinematicBody.isStatic()).toBe(false);
    });

    test('Explicit bodyType argument in constructor', () => {
      const explicitStatic = new Physics(
        new Vec2(10, 10),
        new Vec2(100, 50),
        new Vec2(20, 20),
        5.0,
        0.8,
        0,
        'circle',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'static'
      );
      expect(explicitStatic.isStatic()).toBe(true);
      expect(explicitStatic.getMass()).toBe(0);
      expect(explicitStatic.velocity.isOrigin()).toBe(true);
      expect(explicitStatic.getInitialVelocity().isOrigin()).toBe(true);

      const explicitKinematic = new Physics(
        new Vec2(10, 10),
        new Vec2(100, 50),
        new Vec2(20, 20),
        5.0,
        0.8,
        0,
        'circle',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'kinematic'
      );
      expect(explicitKinematic.isKinematic()).toBe(true);
      expect(explicitKinematic.getMass()).toBe(0);
      expect(explicitKinematic.velocity.x).toBe(100);

      const explicitDynamicZeroMass = new Physics(
        new Vec2(10, 10),
        new Vec2(0, 0),
        new Vec2(20, 20),
        0,
        0.8,
        0,
        'circle',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'dynamic'
      );
      expect(explicitDynamicZeroMass.isDynamic()).toBe(true);
      expect(explicitDynamicZeroMass.getMass()).toBe(1.0);
    });

    test('setBodyType transitions correctly between types', () => {
      const body = new Physics(new Vec2(), new Vec2(10, 20), new Vec2(20, 20), 2.0);
      expect(body.isDynamic()).toBe(true);

      body.setBodyType('kinematic');
      expect(body.isKinematic()).toBe(true);
      expect(body.getMass()).toBe(0);
      expect(body.velocity.x).toBe(10);

      body.setBodyType('static');
      expect(body.isStatic()).toBe(true);
      expect(body.getMass()).toBe(0);
      expect(body.velocity.isOrigin()).toBe(true);

      body.setBodyType('dynamic');
      expect(body.isDynamic()).toBe(true);
      expect(body.getMass()).toBe(1.0);
    });

    test('setMass transitions bodyType when mass becomes 0 or positive', () => {
      const body = new Physics(new Vec2(), new Vec2(0, 0), new Vec2(20, 20), 5.0);
      expect(body.isDynamic()).toBe(true);

      body.setMass(0);
      expect(body.isStatic()).toBe(true);

      body.setMass(10);
      expect(body.isDynamic()).toBe(true);
      expect(body.getMass()).toBe(10);

      body.setVelocity(new Vec2(100, 0));
      body.setMass(0);
      expect(body.isKinematic()).toBe(true);
    });

    test('Kinematic body motion ignores gravity, damping, and external forces', () => {
      const platform = new Physics(
        new Vec2(0, 0),
        new Vec2(100, 0),
        new Vec2(50, 10),
        0,
        0.5, // damping would normally reduce velocity
        0,
        'aabb',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'kinematic'
      );
      platform.setGravity(new Vec2(0, 980));

      // External force and impulse should be ignored
      platform.applyForce(new Vec2(500, 500));
      platform.applyImpulseVector(new Vec2(300, 300));
      expect(platform.force.isOrigin()).toBe(true);
      expect(platform.impulse.isOrigin()).toBe(true);

      // Positional correction ignored
      const initialPos = platform.position.clone();
      platform.correctPosition(new Vec2(10, 10));
      expect(platform.position.x).toBe(initialPos.x);

      // Integration: moves by velocity * dt without damping or gravity
      platform.applyForces(0.1);
      expect(platform.velocity.x).toBe(100);
      platform.updatePosition(0.1);
      expect(platform.position.x).toBeCloseTo(10, 2);
      expect(platform.position.y).toBeCloseTo(0, 2);
      expect(platform.velocity.x).toBe(100);
      expect(platform.velocity.y).toBe(0);

      // reset restores initialVelocity
      platform.setVelocity(new Vec2(200, 50));
      platform.reset();
      expect(platform.velocity.x).toBe(100);
      expect(platform.velocity.y).toBe(0);
    });

    test('Static body does not move and reset preserves zero velocity', () => {
      const wall = new Physics(
        new Vec2(50, 50),
        new Vec2(0, 0),
        new Vec2(20, 100),
        0,
        0.8,
        0,
        'aabb',
        0,
        false,
        0x0001,
        0xFFFF,
        0,
        'static'
      );
      wall.setGravity(new Vec2(0, 980));

      wall.applyForce(new Vec2(500, 0));
      wall.applyImpulseVector(new Vec2(500, 0));
      expect(wall.force.isOrigin()).toBe(true);
      expect(wall.impulse.isOrigin()).toBe(true);

      wall.updatePosition(1.0);
      expect(wall.position.x).toBe(50);
      expect(wall.position.y).toBe(50);
      expect(wall.velocity.isOrigin()).toBe(true);

      wall.reset();
      expect(wall.velocity.isOrigin()).toBe(true);
    });

    test('isStationary evaluates resting and zero-velocity states accurately', () => {
      const staticBody = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'circle', 0, false, 1, 1, 0, 'static');
      expect(staticBody.isStationary()).toBe(true);

      const movingKinematic = new Physics(new Vec2(), new Vec2(50, 0), new Vec2(20, 20), 0, 1, 0, 'circle', 0, false, 1, 1, 0, 'kinematic');
      expect(movingKinematic.isStationary()).toBe(false);

      const pausedKinematic = new Physics(new Vec2(), new Vec2(0, 0), new Vec2(20, 20), 0, 1, 0, 'circle', 0, false, 1, 1, 0, 'kinematic');
      expect(pausedKinematic.isStationary()).toBe(true);

      const activeDynamic = new Physics(new Vec2(), new Vec2(10, 0), new Vec2(20, 20), 1.0);
      expect(activeDynamic.isStationary()).toBe(false);

      activeDynamic.sleep();
      expect(activeDynamic.isStationary()).toBe(true);
    });
  });

  describe('Collision Ignore Management', () => {
    test('ignoreCollisionWith, restoreCollisionWith, and isIgnoringCollisionWith', () => {
      const bodyA = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1.0);
      const bodyB = new Physics(new Vec2(), new Vec2(), new Vec2(20, 20), 1.0);

      expect(bodyA.isIgnoringCollisionWith(bodyB)).toBe(false);
      expect(bodyA.canCollideWith(bodyB)).toBe(true);

      bodyA.ignoreCollisionWith(bodyB);
      expect(bodyA.isIgnoringCollisionWith(bodyB)).toBe(true);
      expect(bodyA.canCollideWith(bodyB)).toBe(false);

      bodyA.restoreCollisionWith(bodyB);
      expect(bodyA.isIgnoringCollisionWith(bodyB)).toBe(false);
      expect(bodyA.canCollideWith(bodyB)).toBe(true);
    });
  });

  describe('Bullet / Continuous Collision Detection (CCD)', () => {
    test('isBullet defaults to false and can be configured via constructor or setters', () => {
      const body = new Physics();
      expect(body.isBullet).toBe(false);
      expect(body.getBullet()).toBe(false);
      expect(body.getIsBullet()).toBe(false);

      body.setBullet(true);
      expect(body.isBullet).toBe(true);
      expect(body.getBullet()).toBe(true);
      expect(body.getIsBullet()).toBe(true);

      const bulletBody = new Physics(
        new Vec2(),
        new Vec2(),
        new Vec2(10, 10),
        1.0,
        0.8,
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
      expect(bulletBody.isBullet).toBe(true);
      expect(bulletBody.getBullet()).toBe(true);
      expect(bulletBody.getIsBullet()).toBe(true);
    });

    test('sweep method queries Raycast.sweepBody', () => {
      const bullet = new Physics(new Vec2(0, 0), new Vec2(), new Vec2(10, 10), 1, 0, 0, 'circle', 0, false, 1, 0xFFFF, 0, 'dynamic', true);
      const wall = new Physics(new Vec2(50, 0), new Vec2(), new Vec2(20, 20), 0, 0, 0, 'aabb', 0, false, 1, 0xFFFF, 0, 'static');

      const hit = bullet.sweep(new Vec2(0, 0), new Vec2(100, 0), wall);
      expect(hit).not.toBeNull();
      expect(hit.body).toBe(wall);
      expect(hit.fraction).toBeLessThan(1);
    });
  });

  describe('Damage and Sleep Helpers', () => {
    test('damage getters, setters, and applyDamage', () => {
      const body = new Physics();
      expect(body.getDamageDealt()).toBe(1);
      expect(body.getDamageTaken()).toBe(0);
      expect(body.applyDamage()).toBe(false);

      body.setDamageDealt(25);
      expect(body.getDamageDealt()).toBe(25);

      const attacker = new Physics();
      attacker.setDamageDealt(50);
      body.collision(new Vec2(), attacker);
      expect(body.getDamageTaken()).toBe(50);

      expect(body.applyDamage()).toBe(50);
      expect(body.getDamageTaken()).toBe(0);
      expect(body.applyDamage()).toBe(false);
    });

    test('setSleepStepsThreshold configures threshold', () => {
      const body = new Physics();
      body.setSleepStepsThreshold(120);
      expect(body.getSleepStepsThreshold()).toBe(120);
    });
  });

  describe('Spatial Overlap and Containment Queries', () => {
    describe('containsPoint', () => {
      test('Circle containsPoint accurately tests interior, boundary, exterior, and inactive', () => {
        const circle = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle'); // radius = 20
        expect(circle.containsPoint(new Vec2(100, 100))).toBe(true); // center
        expect(circle.containsPoint(new Vec2(115, 100))).toBe(true); // inside
        expect(circle.containsPoint(new Vec2(120, 100))).toBe(true); // boundary
        expect(circle.containsPoint(new Vec2(121, 100))).toBe(false); // outside
        expect(circle.containsPoint(new Vec2(200, 200))).toBe(false);

        circle.setActive(false);
        expect(circle.containsPoint(new Vec2(100, 100))).toBe(false); // inactive returns false
      });

      test('AABB containsPoint accurately tests interior, boundary, exterior, and inactive', () => {
        const aabb = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 60), 1, 1, 0, 'aabb'); // halfSize = (20, 30)
        expect(aabb.containsPoint(new Vec2(100, 100))).toBe(true); // center
        expect(aabb.containsPoint(new Vec2(110, 120))).toBe(true); // inside
        expect(aabb.containsPoint(new Vec2(120, 130))).toBe(true); // corner boundary
        expect(aabb.containsPoint(new Vec2(121, 100))).toBe(false); // outside X
        expect(aabb.containsPoint(new Vec2(100, 131))).toBe(false); // outside Y

        aabb.setActive(false);
        expect(aabb.containsPoint(new Vec2(100, 100))).toBe(false);
      });
    });

    describe('overlapsCircle', () => {
      test('Circle vs Circle overlap detection', () => {
        const circle = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle'); // r = 20

        expect(circle.overlapsCircle(new Vec2(100, 100), 10)).toBe(true); // concentric
        expect(circle.overlapsCircle(new Vec2(125, 100), 10)).toBe(true); // overlapping (d=25 <= 30)
        expect(circle.overlapsCircle(new Vec2(130, 100), 10)).toBe(true); // edge touching (d=30 <= 30)
        expect(circle.overlapsCircle(new Vec2(135, 100), 10)).toBe(false); // separating (d=35 > 30)
        expect(circle.overlapsCircle(new Vec2(100, 100), -5)).toBe(false); // negative radius

        circle.setActive(false);
        expect(circle.overlapsCircle(new Vec2(100, 100), 10)).toBe(false);
      });

      test('AABB vs Circle overlap detection', () => {
        const aabb = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'aabb'); // corners [80, 80] to [120, 120]

        expect(aabb.overlapsCircle(new Vec2(100, 100), 5)).toBe(true); // center inside
        expect(aabb.overlapsCircle(new Vec2(125, 100), 10)).toBe(true); // overlapping right face
        expect(aabb.overlapsCircle(new Vec2(130, 130), 15)).toBe(true); // overlapping bottom-right corner (dist=14.14 <= 15)
        expect(aabb.overlapsCircle(new Vec2(130, 130), 10)).toBe(false); // misses corner (dist=14.14 > 10)
        expect(aabb.overlapsCircle(new Vec2(200, 200), 10)).toBe(false); // far outside

        aabb.setActive(false);
        expect(aabb.overlapsCircle(new Vec2(100, 100), 5)).toBe(false);
      });
    });

    describe('overlapsAabb', () => {
      test('AABB vs AABB overlap detection including inverted coordinates', () => {
        const aabb = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'aabb'); // [80, 80] to [120, 120]

        expect(aabb.overlapsAabb(new Vec2(90, 90), new Vec2(110, 110))).toBe(true); // fully inside
        expect(aabb.overlapsAabb(new Vec2(110, 110), new Vec2(150, 150))).toBe(true); // overlapping corner
        expect(aabb.overlapsAabb(new Vec2(120, 80), new Vec2(140, 120))).toBe(true); // touching edge
        expect(aabb.overlapsAabb(new Vec2(125, 80), new Vec2(150, 120))).toBe(false); // separated
        // Inverted min/max
        expect(aabb.overlapsAabb(new Vec2(110, 110), new Vec2(90, 90))).toBe(true);

        aabb.setActive(false);
        expect(aabb.overlapsAabb(new Vec2(90, 90), new Vec2(110, 110))).toBe(false);
      });

      test('Circle vs AABB overlap detection', () => {
        const circle = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle'); // r = 20

        expect(circle.overlapsAabb(new Vec2(90, 90), new Vec2(110, 110))).toBe(true); // box inside circle
        expect(circle.overlapsAabb(new Vec2(50, 50), new Vec2(150, 150))).toBe(true); // box encloses circle
        expect(circle.overlapsAabb(new Vec2(115, 90), new Vec2(150, 110))).toBe(true); // box cuts circle right edge
        expect(circle.overlapsAabb(new Vec2(116, 116), new Vec2(150, 150))).toBe(false); // box outside diagonal
        // Corner intersection
        expect(circle.overlapsAabb(new Vec2(112, 112), new Vec2(150, 150))).toBe(true);

        circle.setActive(false);
        expect(circle.overlapsAabb(new Vec2(90, 90), new Vec2(110, 110))).toBe(false);
      });
    });

    describe('Geometry Getters (shape, radius, halfSize)', () => {
      test('Circle shape, radius, and halfSize', () => {
        const circle = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
        expect(circle.shape).toBe('circle');
        expect(circle.radius).toBe(20);
        expect(circle.halfSize.x).toBe(20);
        expect(circle.halfSize.y).toBe(20);
      });

      test('AABB shape, radius, and halfSize', () => {
        const aabb = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(60, 40), 1, 1, 0, 'aabb');
        expect(aabb.shape).toBe('aabb');
        expect(aabb.radius).toBe(30);
        expect(aabb.halfSize.x).toBe(30);
        expect(aabb.halfSize.y).toBe(20);
      });
    });
  });
});



