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
      // Shallowest axis is X.
      const circlePos = new Vec2(5, 0);
      const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);

      expect(pen.x).toBe(11);
      expect(pen.y).toBe(0);
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
});
