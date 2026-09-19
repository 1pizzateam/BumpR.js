import { Vec2 } from '@1pizzateam/spock';
import { CircleVSCircle } from '../build/es6/collisions/circlevscircle.js';

describe('CircleVSCircle Collision Detection', () => {
  test('Concentric circles (len === 0) do not produce NaN and separate safely', () => {
    const posA = new Vec2(100, 100);
    const posB = new Vec2(100, 100);
    const radiusA = 10;
    const radiusB = 15;

    const pen = CircleVSCircle.detect(posA, radiusA, posB, radiusB);

    expect(Number.isNaN(pen.x)).toBe(false);
    expect(Number.isNaN(pen.y)).toBe(false);
    expect(pen.x).toBe(25); // rr = 10 + 15 = 25
    expect(pen.y).toBe(0);
  });

  test('Overlapping circles at distance return outward penetration vector', () => {
    const posA = new Vec2(16, 0);
    const posB = new Vec2(0, 0);
    const radiusA = 10;
    const radiusB = 10;

    // rr = 20, distance = 16, penetration depth = 4
    const pen = CircleVSCircle.detect(posA, radiusA, posB, radiusB);

    expect(pen.x).toBeCloseTo(4, 3);
    expect(pen.y).toBeCloseTo(0, 3);
  });

  test('Non-overlapping circles return origin vector', () => {
    const posA = new Vec2(50, 0);
    const posB = new Vec2(0, 0);
    const radiusA = 10;
    const radiusB = 10;

    const pen = CircleVSCircle.detect(posA, radiusA, posB, radiusB);

    expect(pen.isOrigin()).toBe(true);
  });
});
