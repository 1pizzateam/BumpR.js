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

  private cachedSecond : number = -1;
  private cachedDamping : number = -1;
  private cachedDampingFactor : number = 1;
  private grid : Grid | null = null;

  body        : Rect | Circ;

  collisionSceneId : number = 0;
  active : boolean = true;
  damageTaken : number = 0;
  damageDealt : number = 1;

  constructor(  positionX: number, positionY: number,
                velocityX: number, velocityY: number,
                sizeX: number, sizeY: number,
                mass: number,
                damping: number,
                restitution: number,
                type: string ) {

    this.velocity        = new Vec2( velocityX, velocityY );
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

    switch (type) {
      case 'rectangle':
      case 'aabb':
        this.body = new Rect( sizeX, sizeY, positionX, positionY );
        break;
      default:
        this.body = new Circ( sizeX, positionX, positionY );
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
    this.position.add(this.translate);
    this.body.setPosition(this.position.x, this.position.y);
  }

  public correctPosition(correction: Vec2): void {
    if (!this.inverseMass)
      return;
    this.position.addScaledVector(correction, this.inverseMass);
    this.body.setPosition(this.position.x, this.position.y);
  }

  public setPosition(x: number, y: number ): void {
    this.body.setPosition( x, y );
  }

  public setPositionFromVector( position: Vec2 ): void {
    this.body.setPosition( position.x, position.y );
  }

  public getPosition(): Vec2 {
    return this.position;
  }

  public setVelocity( x: number, y: number ): void {
    this.velocity.setScalar( x, y );
  }

  public setVelocityFromVector( velocity: Vec2 ): void {
    this.velocity.setScalar( velocity.x, velocity.y );
  }

  public getVelocity(): Vec2 {
    return this.velocity;
  }

  public setInitialVelocity( x: number, y: number ): void {
    this.initialVelocity.setScalar( x, y );
  }

  public getInitialVelocity(): Vec2 {
    return this.initialVelocity;
  }

  public setGravity(x: number, y: number): void {
    this.gravity.setScalar(x, y);
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

  public setDamping( damping: number ): void {
    this.damping = Utils.clamp(damping, 0, 1);
  }

  public getDamping(): number {
    return this.damping;
  }

  public getBody(): Rect | Circ {
    return this.body;
  }

  public setSize( width: number, height?: number ): void {
    if (this.body instanceof Rect)
      this.body.setSize( width, height ?? width );
    else if (this.body instanceof Circ)
      this.body.setRadius( width );
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

