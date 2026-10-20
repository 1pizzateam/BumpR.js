import type { RightTriangle } from '@1pizzateam/spock';
import { Vec2 } from '@1pizzateam/spock';

const scratchDiff = new Vec2();
const scratchAbsNormal = new Vec2();

export const AabbVSTriangle = {

  penetration: new Vec2(),

  detect(aabbPos: Vec2, aabbHalfSize: Vec2, tri: RightTriangle): Vec2 {
    scratchDiff.subVectors(aabbPos, tri.position);
    this.penetration.absoluteVector(scratchDiff).opposite().add(tri.halfSize).add(aabbHalfSize);
    if (this.penetration.x <= 0 || this.penetration.y <= 0)
      return this.penetration.origin();

    const overlapHyp =
      scratchAbsNormal.absoluteVector(tri.hypNormal).dotProduct(aabbHalfSize) -
      scratchDiff.dotProduct(tri.hypNormal);
    if (overlapHyp <= 0)
      return this.penetration.origin();

    if (overlapHyp <= this.penetration.x && overlapHyp <= this.penetration.y)
      return this.penetration.scaleVector(tri.hypNormal, overlapHyp);

    return this.penetration.projectToMinAxis(scratchDiff);
  }

};
