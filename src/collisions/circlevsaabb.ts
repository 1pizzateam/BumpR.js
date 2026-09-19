
import { Vec2 } from '@1pizzateam/spock';

type ProjectionAxis = 'x' | 'y' | 'diag';

export const CircleVSAabb = {

  ab             : new Vec2(),
  penetration    : new Vec2(),
  voronoi        : new Vec2(),
  avertex        : new Vec2(),
  projectionAxis : 'x' as ProjectionAxis,

  detect( apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2): Vec2 {
    this.ab.copy(apos).subtract(bpos);
    if(this.penetration.copy(this.ab)
                       .absolute()
                       .opposite()
                       .addScalar(radiusA)
                       .add(bhs)
                       .isPositive() && this.diagonalHit(apos, radiusA, bpos, bhs))
      return this.getPenetration(radiusA);
    return this.penetration.origin();
  },

  diagonalHit(apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2 ): boolean {
    this.setVoronoiRegion(bhs);
    if( this.voronoi.x === 0 ) {
      this.projectionAxis = this.voronoi.y === 0
        ? this.penetration.getMinAxis() as ProjectionAxis // circle is in the aabb
        : 'y'; // project on y axis
      return true;
    }
    if( this.voronoi.y === 0 ) {
      this.projectionAxis = 'x'; // project on x axis
      return true;
    }
    // possible diagonal collision
    this.avertex.copy( this.voronoi )
                .multiply( bhs )
                .add( bpos ) // get nearest vertex position
                .subtract( apos )
                .opposite(); // calc vert->circle vector
    const len = this.avertex.getMagnitude(true);
    if( radiusA * radiusA - len > 0 ) { // vertex is in the circle; project outward
      this.projectionAxis = 'diag';
      return true; // collision detected
    }
    return false;
  },

  setVoronoiRegion(bhs: Vec2): void { // determine grid/voronoi region of circle center
    this.voronoi.origin();
    // x axis
    if(this.ab.x < -bhs.x)
      this.voronoi.x = -1; // circle is on left side of tile
    else if(this.ab.x > bhs.x)
      this.voronoi.x = 1; // circle is on right side of tile
    // y axis
    if(this.ab.y < -bhs.y)
      this.voronoi.y = -1; // circle is on bottom side of tile
    else if(this.ab.y > bhs.y)
      this.voronoi.y = 1; // circle is on top side of tile
  },

  getPenetration(radiusA: number): Vec2 {
    if (this.projectionAxis !== 'diag') { // aabbvsaabb like collision
      this.penetration.setOppositeAxis(this.projectionAxis, 0.0);
      if(this.ab[this.projectionAxis] < 0)
        this.penetration[this.projectionAxis] = -this.penetration[this.projectionAxis];
      return this.penetration;
    }
    // diagonal collision
    const len = this.avertex.getMagnitude();
    const pen = radiusA - len;
    if( len === 0 )
      this.penetration.copy(this.voronoi).scale(pen/Math.SQRT2); // project out by 45deg (1/square root of 2)
    else
      this.penetration.copy(this.avertex).scale(pen/len);
    return this.penetration;
  }

};

