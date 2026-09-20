
import type { Circ, Grid, Rect } from '@1pizzateam/spock';
import { Utils, Vec2 } from '@1pizzateam/spock';
import { AabbVSAabb } from './collisions/aabbvsaabb';
import { CircleVSAabb } from './collisions/circlevsaabb';
import { CircleVSCircle } from './collisions/circlevscircle';
import type { Physics } from './physics';

export enum Shape { circle = 'circle', aabb = 'aabb' };

export const CollisionDetection = {

  ab                     : new Vec2(),
  effectiveVelocityA     : new Vec2(),
  effectiveVelocityB     : new Vec2(),
  penetration            : new Vec2(),
  contactNormal          : new Vec2(),
  contactTangent         : new Vec2(),
  correction             : new Vec2(),
  impulsePerInverseMass  : new Vec2(),
  zeroImpulse            : new Vec2(),

  totalInverseMass       : 0,
  impulse                : 0,
  tangentImpulse         : 0,
  restingThreshold       : 6,

  percent                : 0.99, // Penetration percentage to correct

  broadphase( a: Physics, b: Physics, grid: Grid ): boolean {
    return grid.testCells( a.body.gridCells, b.body.gridCells );
  },

  test( a: Physics, b: Physics, sceneCallback?: (a: Physics, b: Physics, normal: Vec2, impulse: Vec2) => void, iteration: number = 0 ): boolean {
    if (a.isSleeping && b.isSleeping)
      return false;
    if (iteration > 0 && (a.isSensor || b.isSensor))
      return false;
    this.detect( a.body, b.body );
    if (this.penetration.isOrigin())
      return false;
    if (a.isSensor || b.isSensor) {
      this.contactNormal.copy(this.penetration).normalize();
      this.zeroImpulse.origin();
      a.collision( this.zeroImpulse, b, this.contactNormal );
      if (sceneCallback)
        sceneCallback( a, b, this.contactNormal.clone(), this.zeroImpulse.clone() );
      this.contactNormal.opposite();
      b.collision( this.zeroImpulse, a, this.contactNormal );
      this.contactNormal.opposite();
      return true;
    }
    if (this.resolve( a, b ))
      this.computeImpulse( a, b, sceneCallback );
    return true;
  },

  detect( a: Circ | Rect, b: Circ | Rect ): void {
    if( a.shape === Shape.circle ) {
      if( b.shape === Shape.circle )
        this.penetration = CircleVSCircle.detect( a.position, a.radius, b.position, b.radius );
      else if( b.shape === Shape.aabb )
        this.penetration = CircleVSAabb.detect( a.position, a.radius, b.position, b.halfSize );
      return;
    }
    if( a.shape === Shape.aabb ) {
      if( b.shape === Shape.circle )
        this.penetration = CircleVSAabb.detect( b.position, b.radius, a.position, a.halfSize ).opposite();
      else if( b.shape === Shape.aabb )
        this.penetration = AabbVSAabb.detect( a.position, a.halfSize, b.position, b.halfSize );
    }
  },

  resolve( a: Physics, b: Physics ): boolean {
    this.totalInverseMass = a.inverseMass + b.inverseMass;
    if (this.totalInverseMass === 0)
      return false;

    // compute correction
    this.correction.copy(this.penetration)
                   .scale( this.percent / this.totalInverseMass );

    if(this.correction.isOrigin())
      return false;
    a.correctPosition( this.correction );
    this.correction.opposite();
    b.correctPosition( this.correction );
    this.correction.opposite();
    a.wakeUp();
    b.wakeUp();
    return true;
  },

  computeImpulse( a: Physics, b: Physics, sceneCallback?: (a: Physics, b: Physics, normal: Vec2, impulse: Vec2) => void ): void {
    this.contactNormal.copy(this.penetration).normalize();

    this.effectiveVelocityA.copy(a.velocity);
    if (a.inverseMass && !a.impulse.isOrigin()) {
      this.effectiveVelocityA.addScaledVector(a.impulse, a.inverseMass);
    }
    this.effectiveVelocityB.copy(b.velocity);
    if (b.inverseMass && !b.impulse.isOrigin()) {
      this.effectiveVelocityB.addScaledVector(b.impulse, b.inverseMass);
    }

    this.ab.copy(this.effectiveVelocityA).subtract(this.effectiveVelocityB);
    const separatingVelocity = this.ab.dotProduct(this.contactNormal);
    if( separatingVelocity < 0 ) {
      const restitution = Math.abs(separatingVelocity) < this.restingThreshold
        ? 0
        : Math.max( a.restitution, b.restitution );
      const deltaVelocity = -separatingVelocity * ( 1 + restitution );
      this.impulse = deltaVelocity / this.totalInverseMass;
      this.impulsePerInverseMass.copy(this.contactNormal).scale(this.impulse);

      const friction = Math.min( a.friction, b.friction );
      if (friction > 0) {
        this.contactTangent.setScalar( -this.contactNormal.y, this.contactNormal.x );
        const relativeTangentVelocity = this.ab.dotProduct(this.contactTangent);
        if (relativeTangentVelocity !== 0) {
          const desiredTangentImpulse = -relativeTangentVelocity / this.totalInverseMass;
          const maxFrictionImpulse = friction * this.impulse;
          this.tangentImpulse = Utils.clamp(desiredTangentImpulse, -maxFrictionImpulse, maxFrictionImpulse);
          this.impulsePerInverseMass.addScaledVector(this.contactTangent, this.tangentImpulse);
        }
      }

      a.collision( this.impulsePerInverseMass, b, this.contactNormal );
      if (sceneCallback)
        sceneCallback( a, b, this.contactNormal.clone(), this.impulsePerInverseMass.clone() );

      this.impulsePerInverseMass.opposite();
      this.contactNormal.opposite();
      b.collision( this.impulsePerInverseMass, a, this.contactNormal );
      this.impulsePerInverseMass.opposite();
      this.contactNormal.opposite();
    }
  }

};

