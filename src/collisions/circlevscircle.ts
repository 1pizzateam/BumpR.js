
import { Vec2 } from '@1pizzateam/spock';

export const CircleVSCircle = {

  ab: new Vec2(),

  detect( apos: Vec2, radiusA: number, bpos: Vec2, radiusB: number ): Vec2 {
    this.ab.copy(apos).subtract(bpos);
    let rr = radiusA + radiusB;
    if(rr * rr - this.ab.getMagnitude(true) > 0) {//collision detected
      return this.getPenetration(rr);
    }
    return this.ab.origin();
  },

  getPenetration(rr: number): Vec2 {
    let len = this.ab.getMagnitude();
    if (len === 0) {
      return this.ab.setScalar(rr, 0);
    }
    //distance vector is normalized and scaled by penetration depth
    return this.ab.scale((rr-len)/len);
  }

};

