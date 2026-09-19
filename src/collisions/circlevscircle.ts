
import { Vec2 } from '@1pizzateam/spock';

export const CircleVSCircle = {

  ab: new Vec2(),

  detect( apos: Vec2, radiusA: number, bpos: Vec2, radiusB: number ): Vec2 {
    this.ab.copy(apos).subtract(bpos);
    const rr = radiusA + radiusB;
    const dSq = this.ab.getMagnitude(true);
    if(rr * rr - dSq > 0)
      return this.getPenetration(rr, dSq); // collision detected
    return this.ab.origin();
  },

  getPenetration(rr: number, dSq: number): Vec2 {
    if (dSq === 0)
      return this.ab.setScalar(rr, 0);
    const len = Math.sqrt(dSq);
    // distance vector is normalized and scaled by penetration depth
    return this.ab.scale((rr - len) / len);
  }

};

