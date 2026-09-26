import { Vec2 } from '@1pizzateam/spock';

export interface ICircleVSAabb {
  pen: Vec2;
  rel: Vec2;
  clamped: Vec2;
  diff: Vec2;
  detect(apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2): Vec2;
  getPenetration(radiusA: number, delta: Vec2, distSq?: number, bhs?: Vec2): Vec2;
}

export const CircleVSAabb: ICircleVSAabb = {

  pen       : new Vec2(),
  rel       : new Vec2(),
  clamped   : new Vec2(),
  diff      : new Vec2(),
  detect( apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2 ): Vec2 {
    this.rel.subVectors(apos, bpos);
    this.clamped.clampToExtentVectors(this.rel, bhs);
    this.diff.subVectors(this.rel, this.clamped);
    const distSq = this.diff.getMagnitude(true);

    if (distSq > 0) {
      if (distSq >= radiusA * radiusA)
        return this.pen.origin();
      return this.getPenetration(radiusA, this.diff, distSq);
    }
    // Circle center is inside or on the boundary of the AABB
    return this.getPenetration(radiusA, this.rel, 0, bhs);
  },

  getPenetration( radiusA: number, delta: Vec2, distSq: number = 0, bhs?: Vec2 ): Vec2 {
    if (distSq > 0) {
      const dist = Math.sqrt(distSq);
      const scale = (radiusA - dist) / dist;
      return this.pen.scaleVector(delta, scale);
    }

    // Circle center is inside or on the boundary of the AABB
    if (bhs)
      return this.pen.absoluteVector(delta).opposite().add(bhs).addScalar(radiusA).projectToMinAxis(delta);
    return this.pen.origin();
  }

};
