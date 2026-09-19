import { Vec2 } from '@1pizzateam/spock';

export const AabbVSAabb = {

  ab         : new Vec2(),
  penetration: new Vec2(),

  detect( apos: Vec2,
          ahs : Vec2,
          bpos: Vec2,
          bhs : Vec2 ): Vec2 {
    this.ab.copy(apos).subtract(bpos);
    if (this.penetration.copy(this.ab)
                        .absolute()
                        .opposite()
                        .add(ahs)
                        .add(bhs)
                        .isPositive())
      return this.getPenetration();
    return this.penetration.origin();
  },

  getPenetration(): Vec2 {
    //pick the projection axis
    const minAxis = this.penetration.getMinAxis();
    this.penetration.setOppositeAxis(minAxis, 0.0);
    if(this.penetration[minAxis] && this.ab[minAxis] < 0)
      this.penetration[minAxis] = -this.penetration[minAxis];
    return this.penetration;
  }
};

