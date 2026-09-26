import { Vec2 } from '@1pizzateam/spock';

export const AabbVSAabb = {

  ab    : new Vec2(),
  absAb : new Vec2(),
  pen   : new Vec2(),

  detect( apos: Vec2, ahs : Vec2, bpos: Vec2, bhs : Vec2 ): Vec2 {
    this.ab.subVectors(apos, bpos);
    this.absAb.absoluteVector(this.ab);
    this.pen.addVectors(ahs, bhs).subtract(this.absAb);

    if (this.pen.x > 0 && this.pen.y > 0)
      return this.getPenetration();
    return this.pen.origin();
  },

  getPenetration(): Vec2 {
    return this.pen.projectToMinAxis(this.ab);
  }
};

