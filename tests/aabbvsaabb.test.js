import { Vec2 } from '@1pizzateam/spock';
import { AabbVSAabb } from '../build/es6/collisions/aabbvsaabb.js';

describe('AabbVSAabb Collision Detection', () => {
  const halfSizeA = new Vec2(10, 10);
  const halfSizeB = new Vec2(10, 10);

  test('Right-side collision projects along X axis', () => {
    // Box A at (15, 0), Box B at (0, 0)
    // Overlap X: (10 + 10) - 15 = 5. Overlap Y: 20.
    const posA = new Vec2(15, 0);
    const posB = new Vec2(0, 0);

    const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);
    expect(pen.x).toBe(5);
    expect(pen.y).toBe(0);
  });

  test('Left-side collision projects along negative X axis', () => {
    // Box A at (-15, 0), Box B at (0, 0)
    const posA = new Vec2(-15, 0);
    const posB = new Vec2(0, 0);

    const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);
    expect(pen.x).toBe(-5);
    expect(pen.y).toBe(0);
  });

  test('Top-side collision projects along Y axis', () => {
    // Box A at (0, 16), Box B at (0, 0)
    // Overlap X: 20. Overlap Y: (10 + 10) - 16 = 4.
    const posA = new Vec2(0, 16);
    const posB = new Vec2(0, 0);

    const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);
    expect(pen.x).toBe(0);
    expect(pen.y).toBe(4);
  });

  test('Bottom-side collision projects along negative Y axis', () => {
    // Box A at (0, -14), Box B at (0, 0)
    const posA = new Vec2(0, -14);
    const posB = new Vec2(0, 0);

    const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);
    expect(pen.x).toBe(0);
    expect(pen.y).toBe(-6);
  });

  test('No collision when separated along X or Y axis', () => {
    const posA = new Vec2(25, 0);
    const posB = new Vec2(0, 0);

    const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);
    expect(pen.isOrigin()).toBe(true);
  });
});
