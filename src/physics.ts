import type { Grid } from '@1pizzateam/spock';
import { Circ, Rect, Utils, Vec2 } from '@1pizzateam/spock';

export class Physics {

  public position : Vec2;
  translate       : Vec2;
  velocity        : Vec2;
  initialVelocity : Vec2;
  gravity         : Vec2;
  force           : Vec2;
  impulse         : Vec2;
  resultingAcc    : Vec2;

  damping     : number = 0.8;
  mass        : number = 1.0;
  inverseMass : number = 1.0;
  restitution : number = 0; // elasticity [0, 1]
  friction    : number;

  private cachedSecond : number = -1;
  private cachedDamping : number = -1;
  private cachedDampingFactor : number = 1;
  private grid : Grid | null = null;

  body        : Rect | Circ;

  collisionSceneId : number = 0;
  active : boolean = true;
  damageTaken : number = 0;
  damageDealt : number = 1;

  /**
   * Create a new rigid body using vector-first parameters.
   * @param position - Center position vector. Defaults to (0, 0).
   * @param velocity - Linear velocity vector. Defaults to (0, 0).
   * @param size - Dimensions (width, height) vector in pixels (radius = size.x * 0.5 for circle). Defaults to (20, 20).
   * @param mass - Mass in kg (0 indicates an immovable static body). Defaults to 1.0.
   * @param damping - Velocity damping factor in [0, 1]. Defaults to 0.8.
   * @param restitution - Elasticity coefficient in [0, 1]. Defaults to 0.0.
   * @param shape - Geometric shape ('circle', 'aabb', 'rectangle'). Defaults to 'circle'.
   * @param friction - Surface friction coefficient in [0, 1]. Defaults to 0.0 for circle, 0.6 for AABB.
   */
  constructor(
    position    : Vec2 = new Vec2(),
    velocity    : Vec2 = new Vec2(),
    size        : Vec2 = new Vec2(20, 20),
    mass        : number = 1.0,
    damping     : number = 0.8,
    restitution : number = 0,
    shape       : 'circle' | 'aabb' | 'rectangle' = 'circle',
    friction?   : number
  ) {
    const pos = position ? position.clone() : new Vec2();
    this.velocity = velocity ? velocity.clone() : new Vec2();
    this.initialVelocity = this.velocity.clone();

    this.translate       = new Vec2();
    this.gravity         = new Vec2();
    this.force           = new Vec2();
    this.impulse         = new Vec2();
    this.resultingAcc    = new Vec2();

    this.mass         = Math.max(0, mass);
    this.inverseMass  = !this.mass ? 0 : 1 / this.mass;
    this.damping      = Utils.clamp(damping, 0, 1);
    this.restitution  = Utils.clamp(restitution, 0, 1);

    this.friction     = friction !== undefined
      ? Utils.clamp(friction, 0, 1)
      : (shape === 'rectangle' || shape === 'aabb' ? 0.6 : 0.0);

    const s = size ? size.clone() : new Vec2(20, 20);
    if (shape === 'rectangle' || shape === 'aabb') {
      this.body = new Rect( s.x, s.y, pos.x, pos.y );
    } else {
      this.body = new Circ( s.x * 0.5, pos.x, pos.y );
    }
    this.position = this.body.position;
  }

  public setActive(): void {
    this.active = true;
  }

  public setInactive(): void {
    this.active = false;
  }

  public toggleActive(): boolean {
    this.active = !this.active;
    return this.active;
  }

  public isActive(): boolean {
    return this.active;
  }

  public updatePosition( second: number ): Vec2 {
    this.translate.origin();
    if (!this.active || second <= 0)
      return this.position;
    if (this.inverseMass) {
      this.applyImpulse();
      this.applyForces( second );
    }
    this.applyVelocity( second );
    return this.position;
  }

  public applyForces( second: number ): void {
    this.resultingAcc.copy( this.gravity ); // initialize resulting acceleration for this frame
    if(!this.force.isOrigin()) {
      this.resultingAcc.addScaledVector( this.force, this.inverseMass );
      this.force.origin();
    }
    if(!this.resultingAcc.isOrigin())
      this.velocity.addScaledVector( this.resultingAcc, second );
  }

  private applyImpulse() : void {
    if (this.impulse.isOrigin())
      return;
    this.velocity.addScaledVector( this.impulse, this.inverseMass );
    this.impulse.origin();
  }

  private applyVelocity( second: number ): void {
    if (this.velocity.isOrigin())
      return;
    if(this.damping < 1) {
      if (this.cachedSecond !== second || this.cachedDamping !== this.damping) {
        this.cachedSecond = second;
        this.cachedDamping = this.damping;
        this.cachedDampingFactor = this.damping ** second;
      }
      this.velocity.scale( this.cachedDampingFactor );
    }
    this.translate.copy(this.velocity).scale(second);
    this.body.translate(this.translate);
  }

  public correctPosition(correction: Vec2): void {
    if (!this.inverseMass) return;
    this.translate.copy(correction).scale(this.inverseMass);
    this.body.translate(this.translate);
  }

  public setPosition(position: Vec2): void {
    this.body.setPosition(position);
  }

  public getPosition(): Vec2 {
    return this.position;
  }

  public setVelocity(velocity: Vec2): void {
    this.velocity.copy(velocity);
  }

  public getVelocity(): Vec2 {
    return this.velocity;
  }

  public setInitialVelocity(velocity: Vec2): void {
    this.initialVelocity.copy(velocity);
  }

  public getInitialVelocity(): Vec2 {
    return this.initialVelocity;
  }

  public setGravity(gravity: Vec2): void {
    this.gravity.copy(gravity);
  }

  public setMass( mass: number ): void {
    this.mass = Math.max(0, mass);
    this.inverseMass = !this.mass ? 0 : 1 / this.mass;
  }

  public getMass(): number {
    return this.mass;
  }

  public setRestitution( restitution: number ): void {
    this.restitution = Utils.clamp(restitution, 0, 1);
  }

  public getRestitution(): number {
    return this.restitution;
  }

  public setFriction( friction: number ): void {
    this.friction = Utils.clamp(friction, 0, 1);
  }

  public getFriction(): number {
    return this.friction;
  }

  public setDamping( damping: number ): void {
    this.damping = Utils.clamp(damping, 0, 1);
  }

  public getDamping(): number {
    return this.damping;
  }

  public getBody(): Rect | Circ {
    return this.body;
  }

  public setSize( sizeOrWidth: Vec2 | number, height?: number ): void {
    if (sizeOrWidth instanceof Vec2) {
      if (this.body instanceof Rect)
        this.body.setSize( sizeOrWidth.x, sizeOrWidth.y );
      else if (this.body instanceof Circ)
        this.body.setRadius( sizeOrWidth.x );
    } else {
      if (this.body instanceof Rect)
        this.body.setSize( sizeOrWidth, height ?? sizeOrWidth );
      else if (this.body instanceof Circ)
        this.body.setRadius( sizeOrWidth );
    }
  }

  public setRadius( radius: number ): void {
    if (this.body instanceof Circ)
      this.body.setRadius( radius );
  }

  public setGrid( grid: Grid | null ): void {
    this.grid = grid;
    this.body.setGrid( grid );
  }

  public getGrid(): Grid | null {
    return this.grid;
  }

  public setDamageDealt( damageDealt: number ): void {
    this.damageDealt = damageDealt;
  }

  public getDamageDealt(): number {
    return this.damageDealt;
  }

  public getDamageTaken(): number {
    return this.damageTaken;
  }

  public applyDamage(): number|false {
    if (!this.active || !this.damageTaken)
      return false;
    const dmg = this.damageTaken;
    this.damageTaken = 0;
    return dmg;
  }

  public collision (impulsePerInverseMass: Vec2, object: Physics): void {
    if(this.inverseMass)
      this.impulse.add(impulsePerInverseMass);
    this.damageTaken += object.damageDealt;
  }

  public reset(): void {
    this.velocity.copy(this.initialVelocity);
    this.translate.origin();
    this.force.origin();
    this.impulse.origin();
    this.resultingAcc.origin();
    this.damageTaken = 0;
  }

  public draw(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void {
    this.body.draw( context, fillColor, strokeColor, strokeWidth );
  }

}

