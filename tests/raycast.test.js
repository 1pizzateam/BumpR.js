import { Raycast, Scene, Physics } from '../build/es6/bumpr.js';
import { Vec2 } from '@1pizzateam/spock';

describe('Raycasting and Segment Queries', () => {

  describe('Raycast.raycastCircle', () => {
    const center = new Vec2(100, 100);
    const radius = 20;

    test('Direct horizontal hit through center', () => {
      const start = new Vec2(50, 100);
      const end = new Vec2(150, 100);

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).not.toBeNull();
      // Hits at x = 80 (distance 30 along total segment length 100 -> fraction = 0.3)
      expect(hit.fraction).toBeCloseTo(0.3);
      expect(hit.point.x).toBeCloseTo(80);
      expect(hit.point.y).toBeCloseTo(100);
      // Normal points towards ray origin (left, -1, 0)
      expect(hit.normal.x).toBeCloseTo(-1);
      expect(hit.normal.y).toBeCloseTo(0);
    });

    test('Vertical hit from bottom to top', () => {
      const start = new Vec2(100, 150);
      const end = new Vec2(100, 50);

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).not.toBeNull();
      // Hits at y = 120 (distance 30 along total length 100 -> fraction = 0.3)
      expect(hit.fraction).toBeCloseTo(0.3);
      expect(hit.point.x).toBeCloseTo(100);
      expect(hit.point.y).toBeCloseTo(120);
      expect(hit.normal.x).toBeCloseTo(0);
      expect(hit.normal.y).toBeCloseTo(1);
    });

    test('Ray misses circle', () => {
      const start = new Vec2(50, 50);
      const end = new Vec2(150, 50); // y=50, circle is at y=100 with radius 20

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).toBeNull();
    });

    test('Ray points away from circle', () => {
      const start = new Vec2(50, 100);
      const end = new Vec2(0, 100); // points left, circle is at x=100

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).toBeNull();
    });

    test('Ray segment stops before reaching circle', () => {
      const start = new Vec2(0, 100);
      const end = new Vec2(70, 100); // circle starts at x=80

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).toBeNull();
    });

    test('Ray start is inside circle', () => {
      const start = new Vec2(95, 100);
      const end = new Vec2(150, 100);

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBe(0);
      expect(hit.point.x).toBe(95);
      expect(hit.point.y).toBe(100);
      // Normal points outward from center (95 - 100 = -5 -> -1, 0)
      expect(hit.normal.x).toBeCloseTo(-1);
      expect(hit.normal.y).toBeCloseTo(0);
    });

    test('Ray start is exactly at circle center', () => {
      const start = new Vec2(100, 100);
      const end = new Vec2(150, 100);

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBe(0);
      expect(hit.point.x).toBe(100);
      expect(hit.point.y).toBe(100);
      // Opposite to ray direction
      expect(hit.normal.x).toBeCloseTo(-1);
      expect(hit.normal.y).toBeCloseTo(0);
    });

    test('Zero length ray outside circle returns null', () => {
      const start = new Vec2(0, 0);
      const end = new Vec2(0, 0);

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).toBeNull();
    });

    test('Zero length ray inside circle returns hit at fraction 0', () => {
      const start = new Vec2(100, 100);
      const end = new Vec2(100, 100);

      const hit = Raycast.raycastCircle(start, end, center, radius);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBe(0);
      expect(hit.normal.y).toBe(-1);
    });

    test('Ray hits zero-radius circle (point obstacle)', () => {
      const hit = Raycast.raycastCircle(new Vec2(-10, 0), new Vec2(10, 0), new Vec2(0, 0), 0);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBeCloseTo(0.5);
      expect(hit.point.x).toBeCloseTo(0);
      expect(hit.normal.x).toBeCloseTo(-1);
    });
  });

  describe('Raycast.raycastAabb', () => {
    const center = new Vec2(100, 100);
    const halfSize = new Vec2(20, 20); // Bounds: [80, 120] x [80, 120]

    test('Hit left face', () => {
      const start = new Vec2(0, 100);
      const end = new Vec2(200, 100);

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBeCloseTo(0.4); // 80 / 200 = 0.4
      expect(hit.point.x).toBeCloseTo(80);
      expect(hit.point.y).toBeCloseTo(100);
      expect(hit.normal.x).toBe(-1);
      expect(hit.normal.y).toBe(0);
    });

    test('Hit right face', () => {
      const start = new Vec2(200, 100);
      const end = new Vec2(0, 100);

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBeCloseTo(0.4); // 120 is at distance 80 / 200 = 0.4
      expect(hit.point.x).toBeCloseTo(120);
      expect(hit.point.y).toBeCloseTo(100);
      expect(hit.normal.x).toBe(1);
      expect(hit.normal.y).toBe(0);
    });

    test('Hit top face', () => {
      const start = new Vec2(100, 0);
      const end = new Vec2(100, 200);

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBeCloseTo(0.4);
      expect(hit.point.x).toBeCloseTo(100);
      expect(hit.point.y).toBeCloseTo(80);
      expect(hit.normal.x).toBe(0);
      expect(hit.normal.y).toBe(-1);
    });

    test('Hit bottom face', () => {
      const start = new Vec2(100, 200);
      const end = new Vec2(100, 0);

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBeCloseTo(0.4);
      expect(hit.point.x).toBeCloseTo(100);
      expect(hit.point.y).toBeCloseTo(120);
      expect(hit.normal.x).toBe(0);
      expect(hit.normal.y).toBe(1);
    });

    test('Ray parallel to X axis outside bounds returns null', () => {
      const start = new Vec2(0, 50);
      const end = new Vec2(200, 50); // y=50 outside [80, 120]

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).toBeNull();
    });

    test('Ray parallel to Y axis outside bounds returns null', () => {
      const start = new Vec2(50, 0);
      const end = new Vec2(50, 200); // x=50 outside [80, 120]

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).toBeNull();
    });

    test('Ray segment stops before reaching AABB', () => {
      const start = new Vec2(0, 100);
      const end = new Vec2(50, 100); // stops at 50, AABB is at [80, 120]

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).toBeNull();
    });

    test('Ray misses diagonal corner', () => {
      const start = new Vec2(0, 0);
      const end = new Vec2(50, 200); // passes to the left

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).toBeNull();
    });

    test('Ray crosses X bounds but misses Y bounds (tMin > tMax on Y slab)', () => {
      const start = new Vec2(60, 200);
      const end = new Vec2(140, 150);
      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).toBeNull();
    });

    test('Ray start inside AABB returns fraction 0 with nearest face normal', () => {
      // Near left face
      const hitLeft = Raycast.raycastAabb(new Vec2(85, 100), new Vec2(150, 100), center, halfSize);
      expect(hitLeft.normal.x).toBe(-1);
      expect(hitLeft.normal.y).toBe(0);

      // Near right face
      const hitRight = Raycast.raycastAabb(new Vec2(115, 100), new Vec2(150, 100), center, halfSize);
      expect(hitRight.normal.x).toBe(1);
      expect(hitRight.normal.y).toBe(0);

      // Near top face
      const hitTop = Raycast.raycastAabb(new Vec2(100, 85), new Vec2(100, 150), center, halfSize);
      expect(hitTop.normal.x).toBe(0);
      expect(hitTop.normal.y).toBe(-1);

      // Near bottom face
      const hitBottom = Raycast.raycastAabb(new Vec2(100, 115), new Vec2(100, 150), center, halfSize);
      expect(hitBottom.normal.x).toBe(0);
      expect(hitBottom.normal.y).toBe(1);
    });

    test('Diagonal ray entering AABB', () => {
      const start = new Vec2(0, 0);
      const end = new Vec2(200, 200);

      const hit = Raycast.raycastAabb(start, end, center, halfSize);
      expect(hit).not.toBeNull();
      expect(hit.fraction).toBeCloseTo(0.4);
      expect(hit.point.x).toBeCloseTo(80);
      expect(hit.point.y).toBeCloseTo(80);
    });
  });

  describe('Physics.raycast & Raycast.raycastBody', () => {
    test('Inactive body returns null', () => {
      const body = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
      body.setActive(false);

      const hit = body.raycast(new Vec2(0, 100), new Vec2(200, 100));
      expect(hit).toBeNull();
    });

    test('Circle body returns valid RaycastHit with body reference', () => {
      const body = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');

      const hit = body.raycast(new Vec2(0, 100), new Vec2(200, 100));
      expect(hit).not.toBeNull();
      expect(hit.body).toBe(body);
      expect(hit.point.x).toBeCloseTo(80);
      expect(hit.normal.x).toBeCloseTo(-1);
    });

    test('AABB body returns valid RaycastHit with body reference', () => {
      const body = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'aabb');

      const hit = body.raycast(new Vec2(0, 100), new Vec2(200, 100));
      expect(hit).not.toBeNull();
      expect(hit.body).toBe(body);
      expect(hit.point.x).toBeCloseTo(80);
      expect(hit.normal.x).toBe(-1);
    });
  });

  describe('Scene.raycast and Scene.raycastAll', () => {
    test('scene.raycast returns the closest body along ray', () => {
      const scene = new Scene();

      // Near body at x = 100
      const nearBody = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
      // Far body at x = 200
      const farBody = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');

      scene.addBody(farBody);
      scene.addBody(nearBody);

      const hit = scene.raycast(new Vec2(0, 50), new Vec2(300, 50));
      expect(hit).not.toBeNull();
      expect(hit.body).toBe(nearBody);
      expect(hit.point.x).toBeCloseTo(80);
    });

    test('scene.raycast returns null when ray misses all bodies', () => {
      const scene = new Scene();
      const body = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
      scene.addBody(body);

      const hit = scene.raycast(new Vec2(0, 0), new Vec2(300, 0));
      expect(hit).toBeNull();
    });

    test('scene.raycast filters bodies by category mask', () => {
      const scene = new Scene();

      const CAT_GLASS = 0x0002;
      const CAT_SOLID = 0x0004;

      const glassWall = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb');
      glassWall.setCollisionCategory(CAT_GLASS);

      const solidWall = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb');
      solidWall.setCollisionCategory(CAT_SOLID);

      scene.addBody(glassWall);
      scene.addBody(solidWall);

      // Ray only tests for CAT_SOLID (pierces glassWall)
      const hit = scene.raycast(new Vec2(0, 50), new Vec2(300, 50), CAT_SOLID);
      expect(hit).not.toBeNull();
      expect(hit.body).toBe(solidWall);
      expect(hit.point.x).toBeCloseTo(180);
    });

    test('scene.raycast respects ignoreSensors option', () => {
      const scene = new Scene();

      const triggerZone = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, true);
      const solidEnemy = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');

      scene.addBody(triggerZone);
      scene.addBody(solidEnemy);

      // Default hits sensor triggerZone first
      const hitDefault = scene.raycast(new Vec2(0, 50), new Vec2(300, 50));
      expect(hitDefault.body).toBe(triggerZone);

      // With ignoreSensors: true, hits solidEnemy
      const hitSolid = scene.raycast(new Vec2(0, 50), new Vec2(300, 50), { ignoreSensors: true });
      expect(hitSolid.body).toBe(solidEnemy);
    });

    test('scene.raycastAll returns all intersected bodies sorted by distance', () => {
      const scene = new Scene();

      const body1 = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'aabb');
      const body2 = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
      const body3 = new Physics(new Vec2(300, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'aabb');
      const offRayBody = new Physics(new Vec2(150, 150), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');

      // Add in arbitrary order
      scene.addBody(body3);
      scene.addBody(offRayBody);
      scene.addBody(body1);
      scene.addBody(body2);

      const hits = scene.raycastAll(new Vec2(0, 50), new Vec2(400, 50));
      expect(hits.length).toBe(3);
      expect(hits[0].body).toBe(body1);
      expect(hits[1].body).toBe(body2);
      expect(hits[2].body).toBe(body3);

      expect(hits[0].fraction).toBeLessThan(hits[1].fraction);
      expect(hits[1].fraction).toBeLessThan(hits[2].fraction);
    });

    test('scene.raycastAll returns empty array when nothing is hit', () => {
      const scene = new Scene();
      const body = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
      scene.addBody(body);

      const hits = scene.raycastAll(new Vec2(0, 0), new Vec2(10, 0));
      expect(hits).toEqual([]);
    });

    test('scene.raycastAll respects ignoreSensors, mask, and skips inactive bodies', () => {
      const scene = new Scene();

      const sensor = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, true);
      const wall = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb');
      wall.setCollisionCategory(0x0004);
      const inactive = new Physics(new Vec2(150, 50), new Vec2(), new Vec2(40, 40), 1, 1, 0, 'circle');
      inactive.setInactive();

      scene.addBody(sensor);
      scene.addBody(wall);
      scene.addBody(inactive);

      // Default: hits sensor and wall
      const allHits = scene.raycastAll(new Vec2(0, 50), new Vec2(300, 50));
      expect(allHits.length).toBe(2);
      expect(allHits[0].body).toBe(sensor);
      expect(allHits[1].body).toBe(wall);

      // With mask: only wall
      const maskedHits = scene.raycastAll(new Vec2(0, 50), new Vec2(300, 50), 0x0004);
      expect(maskedHits.length).toBe(1);
      expect(maskedHits[0].body).toBe(wall);

      // With ignoreSensors: only wall
      const solidHits = scene.raycastAll(new Vec2(0, 50), new Vec2(300, 50), { ignoreSensors: true });
      expect(solidHits.length).toBe(1);
      expect(solidHits[0].body).toBe(wall);
    });
  });

  describe('Swept Queries (Continuous Collision Detection)', () => {
    describe('Raycast.sweepCircleCircle', () => {
      const centerB = new Vec2(100, 100);
      const radiusB = 20;
      const radiusA = 10;

      test('Moving circle hits stationary circle', () => {
        const start = new Vec2(0, 100);
        const end = new Vec2(200, 100);

        const hit = Raycast.sweepCircleCircle(start, end, radiusA, centerB, radiusB);
        expect(hit).not.toBeNull();
        // Total radius = 30. Center B at 100, so contact when circle A center reaches x = 70.
        // Along segment of length 200, t = 70 / 200 = 0.35.
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBeCloseTo(-1);
        expect(hit.normal.y).toBeCloseTo(0);
        expect(hit.point.x).toBeCloseTo(80); // Contact point on surface of B (100 - 20)
        expect(hit.point.y).toBeCloseTo(100);
      });

      test('Moving circle misses stationary circle', () => {
        const start = new Vec2(0, 50);
        const end = new Vec2(200, 50);

        const hit = Raycast.sweepCircleCircle(start, end, radiusA, centerB, radiusB);
        expect(hit).toBeNull();
      });
    });

    describe('Raycast.sweepCircleAabb', () => {
      const centerB = new Vec2(100, 100);
      const halfB = new Vec2(20, 20); // [80, 120] x [80, 120]
      const radiusA = 10;

      test('Hit left face', () => {
        const start = new Vec2(0, 100);
        const end = new Vec2(200, 100);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        // Hits at x = 80 - 10 = 70. t = 70 / 200 = 0.35.
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBe(-1);
        expect(hit.normal.y).toBe(0);
        expect(hit.point.x).toBe(80);
      });

      test('Hit right face', () => {
        const start = new Vec2(200, 100);
        const end = new Vec2(0, 100);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        // Hits at x = 120 + 10 = 130. Dist from 200 is 70 -> t = 70 / 200 = 0.35.
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBe(1);
        expect(hit.normal.y).toBe(0);
        expect(hit.point.x).toBe(120);
      });

      test('Hit top face', () => {
        const start = new Vec2(100, 0);
        const end = new Vec2(100, 200);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBe(0);
        expect(hit.normal.y).toBe(-1);
        expect(hit.point.y).toBe(80);
      });

      test('Hit bottom face', () => {
        const start = new Vec2(100, 200);
        const end = new Vec2(100, 0);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBe(0);
        expect(hit.normal.y).toBe(1);
        expect(hit.point.y).toBe(120);
      });

      test('Hit corner arc', () => {
        // Aiming diagonally towards top-left corner [80, 80]
        const start = new Vec2(50, 50);
        const end = new Vec2(150, 150);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.fraction).toBeGreaterThan(0);
        expect(hit.fraction).toBeLessThan(1);
        expect(hit.normal.x).toBeLessThan(0);
        expect(hit.normal.y).toBeLessThan(0);
      });

      test('Hit top-right corner arc', () => {
        const start = new Vec2(150, 50);
        const end = new Vec2(100, 100);
        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.point.x).toBe(120);
        expect(hit.point.y).toBe(80);
      });

      test('Hit bottom-left corner arc', () => {
        const start = new Vec2(50, 150);
        const end = new Vec2(100, 100);
        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.point.x).toBe(80);
        expect(hit.point.y).toBe(120);
      });

      test('Hit bottom-right corner arc', () => {
        const start = new Vec2(150, 150);
        const end = new Vec2(100, 100);
        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.point.x).toBe(120);
        expect(hit.point.y).toBe(120);
      });

      test('Circle start already overlapping AABB (outside box)', () => {
        const start = new Vec2(75, 100); // 5px inside expanded boundary (80 - 10 = 70)
        const end = new Vec2(150, 100);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.fraction).toBe(0);
        expect(hit.normal.x).toBeCloseTo(-1);
      });

      test('Circle start already inside AABB center', () => {
        const start = new Vec2(95, 100);
        const end = new Vec2(150, 100);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).not.toBeNull();
        expect(hit.fraction).toBe(0);
      });

      test('Circle sweep misses AABB entirely', () => {
        const start = new Vec2(0, 0);
        const end = new Vec2(0, 200);

        const hit = Raycast.sweepCircleAabb(start, end, radiusA, centerB, halfB);
        expect(hit).toBeNull();
      });
    });

    describe('Raycast.sweepAabbAabb', () => {
      const centerB = new Vec2(100, 100);
      const halfB = new Vec2(20, 20);
      const halfA = new Vec2(10, 10);

      test('Moving AABB hits stationary AABB', () => {
        const start = new Vec2(0, 100);
        const end = new Vec2(200, 100);

        const hit = Raycast.sweepAabbAabb(start, end, halfA, centerB, halfB);
        expect(hit).not.toBeNull();
        // Expanded half-extent = 30. Hit at 100 - 30 = 70 -> t = 70 / 200 = 0.35.
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBe(-1);
        expect(hit.point.x).toBe(80);
      });

      test('Moving AABB misses stationary AABB', () => {
        const start = new Vec2(0, 0);
        const end = new Vec2(200, 0);

        const hit = Raycast.sweepAabbAabb(start, end, halfA, centerB, halfB);
        expect(hit).toBeNull();
      });
    });

    describe('Raycast.sweepAabbCircle & sweepBody', () => {
      test('sweepAabbCircle detects collision between moving AABB and stationary Circle', () => {
        const halfA = new Vec2(10, 10);
        const centerB = new Vec2(100, 100);
        const radiusB = 20;

        const hit = Raycast.sweepAabbCircle(new Vec2(0, 100), new Vec2(200, 100), halfA, centerB, radiusB);
        expect(hit).not.toBeNull();
        expect(hit.fraction).toBeCloseTo(0.35);
        expect(hit.normal.x).toBe(-1);
      });

      test('sweepAabbCircle returns null when moving AABB misses circle', () => {
        const halfA = new Vec2(10, 10);
        const centerB = new Vec2(100, 100);
        const radiusB = 20;

        const hit = Raycast.sweepAabbCircle(new Vec2(0, 0), new Vec2(0, 200), halfA, centerB, radiusB);
        expect(hit).toBeNull();
      });

      test('sweepBody handles all shape permutations and inactive targets', () => {
        const circleA = new Physics(new Vec2(0, 100), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle');
        const aabbA = new Physics(new Vec2(0, 100), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'aabb');

        const circleB = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'circle');
        const aabbB = new Physics(new Vec2(100, 100), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb');

        expect(Raycast.sweepBody(new Vec2(0, 100), new Vec2(200, 100), circleA, circleB)).not.toBeNull();
        expect(Raycast.sweepBody(new Vec2(0, 100), new Vec2(200, 100), circleA, aabbB)).not.toBeNull();
        expect(Raycast.sweepBody(new Vec2(0, 100), new Vec2(200, 100), aabbA, circleB)).not.toBeNull();
        expect(Raycast.sweepBody(new Vec2(0, 100), new Vec2(200, 100), aabbA, aabbB)).not.toBeNull();

        circleB.setActive(false);
        expect(Raycast.sweepBody(new Vec2(0, 100), new Vec2(200, 100), circleA, circleB)).toBeNull();
      });
    });

    describe('Scene.sweepBody and Scene.sweepBodyAll', () => {
      test('scene.sweepBody finds closest obstacle, respects mask and ignoreSensors', () => {
        const scene = new Scene();
        const bullet = new Physics(new Vec2(0, 50), new Vec2(), new Vec2(10, 10), 1, 1, 0, 'circle', 0, false, 1, 0xFFFF, 0, 'dynamic', true);

        const sensor = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb', 0, true);
        const wall = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(40, 40), 0, 1, 0, 'aabb');
        wall.setCollisionCategory(0x0004);

        scene.addBody(sensor);
        scene.addBody(wall);

        // Default hits sensor first
        const hitDefault = scene.sweepBody(new Vec2(0, 50), new Vec2(300, 50), bullet);
        expect(hitDefault.body).toBe(sensor);

        // ignoreSensors hits wall
        const hitSolid = scene.sweepBody(new Vec2(0, 50), new Vec2(300, 50), bullet, { ignoreSensors: true });
        expect(hitSolid.body).toBe(wall);

        // Mask filters
        const hitMask = scene.sweepBody(new Vec2(0, 50), new Vec2(300, 50), bullet, 0x0004);
        expect(hitMask.body).toBe(wall);
      });

      test('scene.sweepBodyAll returns all bodies sorted by fraction', () => {
        const scene = new Scene();
        const bullet = new Physics(new Vec2(0, 50), new Vec2(), new Vec2(10, 10), 1, 1, 0, 'circle');

        const wall1 = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'aabb');
        const wall2 = new Physics(new Vec2(200, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'aabb');

        scene.addBody(wall2);
        scene.addBody(wall1);

        const hits = scene.sweepBodyAll(new Vec2(0, 50), new Vec2(300, 50), bullet);
        expect(hits.length).toBe(2);
        expect(hits[0].body).toBe(wall1);
        expect(hits[1].body).toBe(wall2);
      });
    });
  });
});

