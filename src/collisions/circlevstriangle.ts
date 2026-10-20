import type { RightTriangle } from '@1pizzateam/spock';
import { Vec2 } from '@1pizzateam/spock';

const scratchClosest = new Vec2();
const scratchDiff = new Vec2();

export const CircleVSTriangle = {

  penetration: new Vec2(),

  detect(circlePos: Vec2, radius: number, tri: RightTriangle): Vec2 {
    this.penetration.origin();
    scratchDiff.subVectors(circlePos, tri.position).absolute().subtract(tri.halfSize);
    if (scratchDiff.x > radius || scratchDiff.y > radius)
      return this.penetration;

    tri.getClosestPoint(circlePos, scratchClosest);
    const minDistSq = scratchDiff.subVectors(circlePos, scratchClosest).getMagnitude(true);
    if (minDistSq >= radius * radius)
      return this.penetration;

    if (minDistSq > 1e-8) {
      const dist = Math.sqrt(minDistSq);
      return this.penetration.scaleVector(scratchDiff, (radius - dist) / dist);
    }

    return this.penetration.scaleVector(tri.hypNormal, radius - Math.min(0, tri.signedDistanceToHypotenuse(circlePos)));
  }

};
