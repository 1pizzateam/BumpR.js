
import type { Circ, Grid, Rect } from '@1pizzateam/spock';
import { Vec2 } from '@1pizzateam/spock';
import { AabbVSAabb } from './collisions/aabbvsaabb';
import { CircleVSAabb } from './collisions/circlevsaabb';
import { CircleVSCircle } from './collisions/circlevscircle';
import type { Physics } from './physics';

export enum Shape { circle = 'circle', aabb = 'aabb' };

export const CollisionDetection = {

  ab                     : new Vec2(),
  penetration            : new Vec2(),
  contactNormal          : new Vec2(),
  correction             : new Vec2(),
  impulsePerInverseMass  : new Vec2(),

  totalInverseMass       : 0,
  impulse                : 0,

  percent                : 0.99, // Penetration percentage to correct

  broadphase( a: Physics, b: Physics, grid: Grid ): boolean {
    return grid.testCells( a.body.gridCells, b.body.gridCells );
  },

  test( a: Physics, b: Physics ): boolean {
    this.detect( a.body, b.body );
    if( !this.penetration.isOrigin()) {
      if ( this.resolve( a, b )) {
        this.computeImpulse( a, b );
      }
      return true;
    }
    return false;
  },

  detect( a: Circ | Rect, b: Circ | Rect ): void {
    if( a.shape === Shape.circle ) {
      if( b.shape === Shape.circle ) {
        this.penetration = CircleVSCircle.detect( a.position, a.radius, b.position, b.radius );
      }else if( b.shape === Shape.aabb ) {
        this.penetration = CircleVSAabb.detect( a.position, a.radius, b.position, b.halfSize );
      }
    }else if( a.shape === Shape.aabb ) {
      if( b.shape === Shape.circle ) {
        this.penetration = CircleVSAabb.detect( b.position, b.radius, a.position, a.halfSize ).opposite();
      }else if( b.shape === Shape.aabb ) {
        this.penetration = AabbVSAabb.detect( a.position, a.halfSize, b.position, b.halfSize );
      }
    }
  },

  resolve( a: Physics, b: Physics ): boolean {
    this.totalInverseMass = a.inverseMass + b.inverseMass;
    if (this.totalInverseMass === 0) {
      return false;
    }

    // compute correction
    this.correction.copy(this.penetration)
                   .scale( this.percent / this.totalInverseMass );

    if(!this.correction.isOrigin()) {
      a.correctPosition( this.correction );
      this.correction.opposite();
      b.correctPosition( this.correction );
      this.correction.opposite();
      return true;
    }
    return false;
  },

  computeImpulse( a: Physics, b: Physics ): void {
    this.contactNormal.copy(this.penetration).normalize();
    this.ab.copy(a.velocity).subtract(b.velocity);
    const separatingVelocity = this.ab.dotProduct(this.contactNormal);
    if( separatingVelocity < 0 ) {
      const restitution = Math.max( a.restitution, b.restitution );
      const deltaVelocity = -separatingVelocity * ( 1 + restitution );
      this.impulse = deltaVelocity / this.totalInverseMass;
      this.impulsePerInverseMass.copy(this.contactNormal).scale(this.impulse);
      a.collision( this.impulsePerInverseMass, b );
      this.impulsePerInverseMass.opposite();
      b.collision( this.impulsePerInverseMass, a );
    }
  }

};

