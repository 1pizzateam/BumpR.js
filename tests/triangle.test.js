import { Circ, Grid, RightTriangle, Vec2, raycastSegment } from '@1pizzateam/spock';
import { CollisionDetection } from '../build/es6/collision.js';
import { AabbVSTriangle } from '../build/es6/collisions/aabbvstriangle.js';
import { CircleVSTriangle } from '../build/es6/collisions/circlevstriangle.js';
import { Physics } from '../build/es6/physics.js';
import { Raycast } from '../build/es6/raycast.js';
import { Scene } from '../build/es6/scene.js';

describe('RightTriangle Collider & Collisions', () => {
  test('RightTriangle vertices, normals, and point containment for all 4 corners', () => {
    const nw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'nw');
    expect(nw.shape).toBe('triangle-nw');
    expect(nw.hypNormal.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(nw.hypNormal.y).toBeCloseTo(Math.SQRT1_2, 5);
    const vertsNW = nw.getVertices();
    expect(vertsNW.s.x).toBe(0);
    expect(vertsNW.s.y).toBe(0);
    expect(vertsNW.a.x).toBe(0);
    expect(vertsNW.a.y).toBe(64);
    expect(vertsNW.b.x).toBe(64);
    expect(vertsNW.b.y).toBe(0);
    expect(nw.isIn(new Vec2(10, 10))).toBe(true);
    expect(nw.isIn(new Vec2(54, 54))).toBe(false);
    expect(nw.isIn(new Vec2(-5, 10))).toBe(false);

    const ne = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'ne');
    expect(ne.shape).toBe('triangle-ne');
    expect(ne.isIn(new Vec2(54, 10))).toBe(true);
    expect(ne.isIn(new Vec2(10, 54))).toBe(false);

    const sw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'sw');
    expect(sw.shape).toBe('triangle-sw');
    expect(sw.isIn(new Vec2(10, 54))).toBe(true);
    expect(sw.isIn(new Vec2(54, 10))).toBe(false);

    const se = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'se');
    expect(se.shape).toBe('triangle-se');
    expect(se.isIn(new Vec2(54, 54))).toBe(true);
    expect(se.isIn(new Vec2(10, 10))).toBe(false);
  });

  test('RightTriangle overlapsCircle and overlapsBounds', () => {
    const nw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'nw');
    expect(nw.overlapsCircle(new Circ(5, new Vec2(10, 10)))).toBe(true);
    expect(nw.overlapsCircle(new Circ(10, new Vec2(36, 36)))).toBe(true);
    expect(nw.overlapsCircle(new Circ(5, new Vec2(60, 60)))).toBe(false);
    expect(nw.overlapsCircle(new Circ(6, new Vec2(-5, 20)))).toBe(true);
    expect(nw.overlapsCircle(new Circ(6, new Vec2(20, -5)))).toBe(true);
    expect(nw.overlapsCircle(new Circ(-1, new Vec2(10, 10)))).toBe(false);
    expect(nw.overlapsCircle(new Circ(5, new Vec2(200, 200)))).toBe(false);

    expect(nw.overlapsBounds(new Vec2(5, 5), new Vec2(15, 15))).toBe(true);
    expect(nw.overlapsBounds(new Vec2(50, 50), new Vec2(62, 62))).toBe(false);
    expect(nw.overlapsBounds(new Vec2(100, 100), new Vec2(120, 120))).toBe(false);
  });

  test('RightTriangle raycast from outside and inside', () => {
    const nw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'nw');
    // Hit hypotenuse from SE
    const hitHyp = nw.raycast(new Vec2(60, 60), new Vec2(10, 10));
    expect(hitHyp).not.toBeNull();
    expect(hitHyp.point.x).toBeCloseTo(32, 3);
    expect(hitHyp.point.y).toBeCloseTo(32, 3);
    expect(hitHyp.normal.x).toBeCloseTo(Math.SQRT1_2, 4);
    expect(hitHyp.normal.y).toBeCloseTo(Math.SQRT1_2, 4);

    // Hit vertical leg from W
    const hitLegX = nw.raycast(new Vec2(-10, 20), new Vec2(20, 20));
    expect(hitLegX).not.toBeNull();
    expect(hitLegX.point.x).toBeCloseTo(0, 3);
    expect(hitLegX.normal.x).toBe(-1);

    // Hit horizontal leg from N
    const hitLegY = nw.raycast(new Vec2(20, -10), new Vec2(20, 20));
    expect(hitLegY).not.toBeNull();
    expect(hitLegY.point.y).toBeCloseTo(0, 3);
    expect(hitLegY.normal.y).toBe(-1);

    // Start inside near hypotenuse
    const insideHyp = nw.raycast(new Vec2(30, 30), new Vec2(60, 60));
    expect(insideHyp).not.toBeNull();
    expect(insideHyp.fraction).toBe(0);
    expect(insideHyp.normal.x).toBeCloseTo(Math.SQRT1_2, 4);

    // Start inside near vertical leg
    const insideLegX = nw.raycast(new Vec2(1, 20), new Vec2(60, 20));
    expect(insideLegX.fraction).toBe(0);
    expect(insideLegX.normal.x).toBe(-1);

    // Start inside near horizontal leg
    const insideLegY = nw.raycast(new Vec2(20, 1), new Vec2(20, 60));
    expect(insideLegY.fraction).toBe(0);
    expect(insideLegY.normal.y).toBe(-1);

    // Miss
    expect(nw.raycast(new Vec2(50, 60), new Vec2(60, 50))).toBeNull();
  });

  test('CircleVSTriangle narrow-phase and CollisionDetection.detect', () => {
    const nw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'nw');
    // Outside AABB
    expect(CircleVSTriangle.detect(new Vec2(100, 100), 14, nw).isOrigin()).toBe(true);
    // In open half outside radius
    expect(CircleVSTriangle.detect(new Vec2(55, 55), 14, nw).isOrigin()).toBe(true);
    // Overlapping hypotenuse from open half
    const penHyp = CircleVSTriangle.detect(new Vec2(36, 36), 14, nw);
    expect(penHyp.x).toBeGreaterThan(0);
    expect(penHyp.y).toBeGreaterThan(0);
    // Center inside triangle
    const penInside = CircleVSTriangle.detect(new Vec2(28, 28), 14, nw);
    expect(penInside.x).toBeGreaterThan(0);
    expect(penInside.y).toBeGreaterThan(0);
    // Overlapping vertical leg
    const penLegX = CircleVSTriangle.detect(new Vec2(-5, 20), 10, nw);
    expect(penLegX.x).toBeCloseTo(-5, 4);
    expect(penLegX.y).toBeCloseTo(0, 4);
    // Overlapping horizontal leg
    const penLegY = CircleVSTriangle.detect(new Vec2(20, -5), 10, nw);
    expect(penLegY.x).toBeCloseTo(0, 4);
    expect(penLegY.y).toBeCloseTo(-5, 4);

    // CollisionDetection symmetry (circle vs triangle & triangle vs circle)
    const circleBody = new Physics(new Vec2(36, 36), new Vec2(), new Vec2(28, 28), 1, 1, 0, 'circle');
    const triBody = new Physics(new Vec2(32, 32), new Vec2(), new Vec2(64, 64), 0, 1, 0, 'triangle-nw');
    CollisionDetection.detect(circleBody.body, triBody.body);
    expect(CollisionDetection.penetration.x).toBeGreaterThan(0);
    CollisionDetection.detect(triBody.body, circleBody.body);
    expect(CollisionDetection.penetration.x).toBeLessThan(0);
  });

  test('Scene step and sweepBody with RightTriangle body', () => {
    const grid = new Grid(new Vec2(128, 128), 64);
    const scene = new Scene(grid);
    scene.setGravity(new Vec2(0, 0));
    const triBody = new Physics(new Vec2(32, 32), new Vec2(), new Vec2(64, 64), 0, 1, 0, 'triangle-nw');
    const player = new Physics(new Vec2(50, 50), new Vec2(-100, -100), new Vec2(28, 28), 1, 1, 0, 'circle', 0);
    scene.addBody(triBody);
    scene.addBody(player);

    const sweepHit = scene.sweepBody(new Vec2(60, 60), new Vec2(10, 10), player);
    expect(sweepHit).not.toBeNull();
    expect(sweepHit.body).toBe(triBody);
    expect(sweepHit.normal.x).toBeCloseTo(Math.SQRT1_2, 4);

    // Sweep already overlapping
    const overlapSweep = Raycast.sweepCircleTriangle(new Vec2(35, 35), new Vec2(10, 10), 14, triBody.body);
    expect(overlapSweep).not.toBeNull();
    expect(overlapSweep.fraction).toBe(0);

    // Sweep hitting legs and vertices
    const legXSweep = Raycast.sweepCircleTriangle(new Vec2(-30, 20), new Vec2(10, 20), 10, triBody.body);
    expect(legXSweep).not.toBeNull();
    expect(legXSweep.normal.x).toBe(-1);

    const legYSweep = Raycast.sweepCircleTriangle(new Vec2(20, -30), new Vec2(20, 10), 10, triBody.body);
    expect(legYSweep).not.toBeNull();
    expect(legYSweep.normal.y).toBe(-1);

    const vertSweep = Raycast.sweepCircleTriangle(new Vec2(-20, -20), new Vec2(0, 0), 10, triBody.body);
    expect(vertSweep).not.toBeNull();

    // Draw coverage
    const ctx = {
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0
    };
    triBody.draw(ctx, '#ff0000', '#00ff00', 2);
  });

  test('RightTriangle hypotenuse helpers, opposite corner, Circ overload, and target raycast', () => {
    const nw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'nw');
    const opp = new Vec2();
    expect(nw.getOppositeCorner(opp)).toBe(opp);
    expect(opp.x).toBe(64);
    expect(opp.y).toBe(64);
    expect(nw.hypLength).toBeCloseTo(64 * Math.SQRT2, 5);
    expect(nw.signedDistanceToHypotenuse(new Vec2(32, 32))).toBeCloseTo(0, 5);
    expect(nw.signedDistanceToHypotenuse(new Vec2(64, 64))).toBeGreaterThan(0);

    const proj = new Vec2();
    nw.projectOntoHypotenuse(new Vec2(40, 24), 2, proj);
    expect(proj.x + proj.y).toBeCloseTo(64, 5);

    // Circ overload in overlapsCircle
    expect(nw.overlapsCircle(new Circ(10, new Vec2(36, 36)))).toBe(true);

    // Parallel raycastSegment returns null
    expect(raycastSegment(new Vec2(0, 0), new Vec2(10, 0), new Vec2(0, 5), new Vec2(10, 5), new Vec2(0, 1))).toBeNull();

    // Raycast with pre-allocated target
    const targetHit = { fraction: 0, point: new Vec2(), normal: new Vec2() };
    const res = nw.raycast(new Vec2(60, 60), new Vec2(10, 10), targetHit);
    expect(res).toBe(targetHit);
    expect(targetHit.point.x).toBeCloseTo(32, 3);
  });

  test('AabbVSTriangle collision detection and sweepAabbTriangle', () => {
    const nw = new RightTriangle(new Vec2(64, 64), new Vec2(32, 32), 'nw');
    // Separated in X, Y, or open half-space
    expect(AabbVSTriangle.detect(new Vec2(100, 32), new Vec2(10, 10), nw).isOrigin()).toBe(true);
    expect(AabbVSTriangle.detect(new Vec2(32, 100), new Vec2(10, 10), nw).isOrigin()).toBe(true);
    expect(AabbVSTriangle.detect(new Vec2(55, 55), new Vec2(5, 5), nw).isOrigin()).toBe(true);

    // Overlapping hypotenuse
    const penHyp = AabbVSTriangle.detect(new Vec2(36, 36), new Vec2(10, 10), nw);
    expect(penHyp.x).toBeGreaterThan(0);
    expect(penHyp.y).toBeGreaterThan(0);

    // Overlapping X leg
    const penX = AabbVSTriangle.detect(new Vec2(-5, 20), new Vec2(10, 10), nw);
    expect(penX.x).toBeLessThan(0);
    expect(penX.y).toBe(0);

    // Overlapping Y leg
    const penY = AabbVSTriangle.detect(new Vec2(20, -5), new Vec2(10, 10), nw);
    expect(penY.x).toBe(0);
    expect(penY.y).toBeLessThan(0);

    // CollisionDetection.detect symmetry for AABB vs Triangle
    const aabbBody = new Physics(new Vec2(36, 36), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'aabb');
    const triBody = new Physics(new Vec2(32, 32), new Vec2(), new Vec2(64, 64), 0, 1, 0, 'triangle-nw');
    CollisionDetection.detect(aabbBody.body, triBody.body);
    expect(CollisionDetection.penetration.x).toBeGreaterThan(0);
    CollisionDetection.detect(triBody.body, aabbBody.body);
    expect(CollisionDetection.penetration.x).toBeLessThan(0);

    // sweepBody and sweepAabbTriangle
    const sweepHit = Raycast.sweepBody(new Vec2(60, 60), new Vec2(20, 20), aabbBody, triBody);
    expect(sweepHit).not.toBeNull();
    expect(sweepHit.normal.x).toBeCloseTo(Math.SQRT1_2, 4);

    // Already overlapping sweepAabbTriangle
    const overlapHit = Raycast.sweepAabbTriangle(new Vec2(36, 36), new Vec2(10, 10), new Vec2(10, 10), nw);
    expect(overlapHit).not.toBeNull();
    expect(overlapHit.fraction).toBe(0);

    // Misses in open half
    expect(Raycast.sweepAabbTriangle(new Vec2(58, 58), new Vec2(54, 54), new Vec2(4, 4), nw)).toBeNull();
  });

  test('Scene.hasLineOfSight, ignoreBody, category filter, and symmetric ignoreCollisionWith', () => {
    const scene = new Scene();
    const wall = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(20, 20), 0, 1, 0, 'aabb', 0, false, 1, 0xFFFF, 0, 'static');
    const enemy = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(20, 20), 1, 1, 0, 'circle', 0, false, 4, 0xFFFF);
    scene.addBody(wall);
    scene.addBody(enemy);

    expect(scene.hasLineOfSight(new Vec2(0, 50), new Vec2(100, 50), { mask: 1 })).toBe(false);
    expect(scene.hasLineOfSight(new Vec2(0, 10), new Vec2(100, 10), { mask: 1 })).toBe(true);
    expect(scene.hasLineOfSight(new Vec2(0, 50), new Vec2(100, 50), { mask: 1, ignoreBody: wall })).toBe(true);
    expect(scene.getPositionCorrection()).toBeCloseTo(0.99, 5);
    scene.setPositionCorrection(1);
    expect(scene.getPositionCorrection()).toBe(1);

    const found = scene.queryCircle(new Vec2(100, 50), 30, { mask: 4, category: 1, ignoreBody: wall });
    expect(found).toContain(enemy);
    expect(scene.queryCircleFirst(new Vec2(100, 50), 30, { mask: 4, ignoreBody: enemy })).toBeNull();

    // Symmetric ignoreCollisionWith
    const shot = new Physics(new Vec2(100, 50), new Vec2(), new Vec2(10, 10), 1, 1, 0, 'circle');
    shot.ignoreCollisionWith(enemy);
    expect(shot.canCollideWith(enemy)).toBe(false);
    expect(enemy.canCollideWith(shot)).toBe(false);

    // Target vector getters on Physics
    const outPos = new Vec2();
    const outVel = new Vec2();
    const outInitVel = new Vec2();
    const outGrav = new Vec2();
    const outSize = new Vec2();
    expect(enemy.getPosition(outPos)).toBe(outPos);
    expect(outPos.x).toBe(100);
    expect(enemy.getVelocity(outVel)).toBe(outVel);
    expect(enemy.getInitialVelocity(outInitVel)).toBe(outInitVel);
    expect(enemy.getGravity(outGrav)).toBe(outGrav);
    expect(enemy.getGravity()).toBe(enemy.gravity);
    expect(enemy.getSize(outSize)).toBe(outSize);
    expect(outSize.toArray()).toEqual([20, 20]);
    expect(wall.getSize().toArray()).toEqual([20, 20]);
  });
});
