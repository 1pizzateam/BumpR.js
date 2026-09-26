import { Vec2 } from '@1pizzateam/spock';
import { CircleVSAabb } from '../build/es6/collisions/circlevsaabb.js';

describe('CircleVSAabb Collisions', () => {
  const boxPos = new Vec2(0, 0);
  const boxHalfSize = new Vec2(10, 10);
  const circleRadius = 6;

  describe('Diagonal Corner Collisions', () => {
    test('Top-Right corner diagonal collision pushes circle outward (+x, +y)', () => {
      // Corner is at (10, 10). Distance is sqrt(4^2 + 4^2) = sqrt(32) ≈ 5.657 < 6
      const circlePos = new Vec2(14, 14);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBeGreaterThan(0);
      expect(pen.y).toBeGreaterThan(0);
      // Penetration depth: 6 - sqrt(32) ≈ 0.3431. Unit vector is (1/sqrt(2), 1/sqrt(2))
      expect(pen.x).toBeCloseTo(0.3431 / Math.SQRT2, 2);
      expect(pen.y).toBeCloseTo(0.3431 / Math.SQRT2, 2);
    });

    test('Top-Left corner diagonal collision pushes circle outward (-x, +y)', () => {
      const circlePos = new Vec2(-14, 14);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBeLessThan(0);
      expect(pen.y).toBeGreaterThan(0);
      expect(pen.x).toBeCloseTo(-0.3431 / Math.SQRT2, 2);
      expect(pen.y).toBeCloseTo(0.3431 / Math.SQRT2, 2);
    });

    test('Bottom-Right corner diagonal collision pushes circle outward (+x, -y)', () => {
      const circlePos = new Vec2(14, -14);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBeGreaterThan(0);
      expect(pen.y).toBeLessThan(0);
      expect(pen.x).toBeCloseTo(0.3431 / Math.SQRT2, 2);
      expect(pen.y).toBeCloseTo(-0.3431 / Math.SQRT2, 2);
    });

    test('Bottom-Left corner diagonal collision pushes circle outward (-x, -y)', () => {
      const circlePos = new Vec2(-14, -14);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBeLessThan(0);
      expect(pen.y).toBeLessThan(0);
      expect(pen.x).toBeCloseTo(-0.3431 / Math.SQRT2, 2);
      expect(pen.y).toBeCloseTo(-0.3431 / Math.SQRT2, 2);
    });

    test('No collision when circle is outside diagonal corner', () => {
      // Distance from (10, 10) is sqrt(5^2 + 5^2) = sqrt(50) ≈ 7.071 > 6
      const circlePos = new Vec2(15, 15);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.isOrigin()).toBe(true);
    });
  });

  describe('Flat Face Collisions', () => {
    test('Right face collision projects along X axis', () => {
      // Circle at (13, 0), radius 6. Penetration: (10 + 6) - 13 = 3
      const circlePos = new Vec2(13, 0);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBe(3);
      expect(pen.y).toBe(0);
    });

    test('Left face collision projects along negative X axis', () => {
      const circlePos = new Vec2(-13, 0);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBe(-3);
      expect(pen.y).toBe(0);
    });

    test('Top face collision projects along Y axis', () => {
      // Circle at (0, 14), radius 6. Penetration: (10 + 6) - 14 = 2
      const circlePos = new Vec2(0, 14);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBe(0);
      expect(pen.y).toBe(2);
    });

    test('Bottom face collision projects along negative Y axis', () => {
      const circlePos = new Vec2(0, -14);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBe(0);
      expect(pen.y).toBe(-2);
    });

    test('Circle inside AABB projects along shallowest penetration axis', () => {
      // Circle at (5, 0), radius 6.
      // Penetration on X: (10 + 6) - 5 = 11. Penetration on Y: (10 + 6) - 0 = 16.
      // Shallowest axis is X (+).
      const circlePosX = new Vec2(5, 0);
      const penX = CircleVSAabb.detect(circlePosX, circleRadius, boxPos, boxHalfSize);
      expect(penX.x).toBe(11);
      expect(penX.y).toBe(0);

      // Circle at (-5, 0). Shallowest axis is X (-).
      const circlePosNegX = new Vec2(-5, 0);
      const penNegX = CircleVSAabb.detect(circlePosNegX, circleRadius, boxPos, boxHalfSize);
      expect(penNegX.x).toBe(-11);
      expect(penNegX.y).toBe(0);

      // Circle at (0, 7).
      // Penetration on X: (10 + 6) - 0 = 16. Penetration on Y: (10 + 6) - 7 = 9.
      // Shallowest axis is Y (+).
      const circlePosY = new Vec2(0, 7);
      const penY = CircleVSAabb.detect(circlePosY, circleRadius, boxPos, boxHalfSize);
      expect(penY.x).toBe(0);
      expect(penY.y).toBe(9);

      // Circle at (0, -7). Shallowest axis is Y (-).
      const circlePosNegY = new Vec2(0, -7);
      const penNegY = CircleVSAabb.detect(circlePosNegY, circleRadius, boxPos, boxHalfSize);
      expect(penNegY.x).toBe(0);
      expect(penNegY.y).toBe(-9);

      // Concentric: circle at (0, 0).
      const circlePosConcentric = new Vec2(0, 0);
      const penConcentric = CircleVSAabb.detect(circlePosConcentric, circleRadius, boxPos, boxHalfSize);
      expect(penConcentric.x).toBe(16);
      expect(penConcentric.y).toBe(0);

      // Circle center directly on AABB boundary at (10, 0)
      const circlePosBoundary = new Vec2(10, 0);
      const penBoundary = CircleVSAabb.detect(circlePosBoundary, circleRadius, boxPos, boxHalfSize);
      expect(penBoundary.x).toBe(6);
      expect(penBoundary.y).toBe(0);
    });

    test('No collision when separated along X or Y axis', () => {
      // Separated on X
      const circlePosX = new Vec2(25, 0);
      expect(CircleVSAabb.detect(circlePosX, circleRadius, boxPos, boxHalfSize).isOrigin()).toBe(true);

      // Separated on Y (X overlaps)
      const circlePosY = new Vec2(0, 25);
      expect(CircleVSAabb.detect(circlePosY, circleRadius, boxPos, boxHalfSize).isOrigin()).toBe(true);
    });
  });

  describe('CircleVSAabb.getPenetration()', () => {
    test('Calculates penetration vector when distSq > 0', () => {
      // radius 10, delta (3, 4), distSq 25 (dist = 5). Penetration = 10 - 5 = 5. Scale = 5/5 = 1.
      const pen = CircleVSAabb.getPenetration(10, new Vec2(3, 4), 25);
      expect(pen.x).toBe(3);
      expect(pen.y).toBe(4);
    });

    test('Calculates internal penetration along shallowest axis when distSq = 0', () => {
      // Internal penetration with bhs: half-width 20, half-height 20, radius 5
      // relX = 5, relY = 0 => overlapX = (20 - 5 + 5) = 20, overlapY = (20 - 0 + 5) = 25
      const bhs = new Vec2(20, 20);
      const penX = CircleVSAabb.getPenetration(5, new Vec2(5, 0), 0, bhs);
      expect(penX.x).toBe(20);
      expect(penX.y).toBe(0);

      // relX = 0, relY = -8 => overlapX = 25, overlapY = (20 - 8 + 5) = 17
      const penY = CircleVSAabb.getPenetration(5, new Vec2(0, -8), 0, bhs);
      expect(penY.x).toBe(0);
      expect(penY.y).toBe(-17);
    });

    test('Returns origin vector when distSq = 0 and bhs is omitted', () => {
      const pen = CircleVSAabb.getPenetration(10, new Vec2(0, 0));
      expect(pen.isOrigin()).toBe(true);
    });
  });
});

