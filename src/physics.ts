import type { Grid, TriangleCorner, TriangleShape } from '@1pizzateam/spock';
import { Circ, Rect, RightTriangle, Utils, Vec2 } from '@1pizzateam/spock';
import { isTriangleShape } from './collision.js';
import { Raycast, type RaycastHit } from './raycast.js';

export type BodyCollisionCallback = (other: Physics, normal: Vec2, impulse: Vec2) => void;
export type BodyType = 'dynamic' | 'static' | 'kinematic';
export type BodyShape = 'circle' | 'aabb' | 'rectangle' | TriangleShape;

export class Physics {

  public position : Vec2;
  translate       : Vec2;
  velocity        : Vec2;
  initialVelocity : Vec2;
  gravity         : Vec2;
  force           : Vec2;
  impulse         : Vec2;
  resultingAcc    : Vec2;

  public bodyType : BodyType = 'dynamic';
  damping     : number = 0.8;
  mass        : number = 1.0;
  inverseMass : number = 1.0;
  restitution : number = 0; // elasticity [0, 1]
  friction    : number;

  private cachedSecond : number = -1;
  private cachedDamping : number = -1;
  private cachedDampingFactor : number = 1;
  private grid : Grid | null = null;

  body        : Rect | Circ | RightTriangle;

  collisionSceneId : number = 0;
  sceneIndex : number = -1;
  active : boolean = true;
  damageTaken : number = 0;
  damageDealt : number = 1;

  isSleeping : boolean = false;
  canSleep : boolean = true;
  sleepThreshold : number = 0.1;
  sleepStepsThreshold : number = 60;
  idleSteps : number = 0;

  isSensor : boolean = false;
  isBullet : boolean = false;

  collisionCategory : number = 0x0001;
  collisionMask : number = 0xFFFF;
  collisionGroup : number = 0;

  public onCollision: BodyCollisionCallback | null = null;
  private collisionListeners: BodyCollisionCallback[] = [];
  private ignoredBodies: Set<Physics> | null = null;

  /**
   * Create a new rigid body using vector-first parameters.
   * @param position - Center position vector. Defaults to (0, 0).
   * @param velocity - Linear velocity vector. Defaults to (0, 0).
   * @param size - Dimensions (width, height) vector in pixels (radius = size.x * 0.5 for circle). Defaults to (20, 20).
   * @param mass - Mass in kg (0 indicates an immovable static body). Defaults to 1.0.
   * @param damping - Velocity damping factor in [0, 1]. Defaults to 0.8.
   * @param restitution - Elasticity coefficient in [0, 1]. Defaults to 0.0.
   * @param shape - Geometric shape ('circle', 'aabb', 'rectangle', 'triangle-nw', 'triangle-ne', 'triangle-sw', 'triangle-se'). Defaults to 'circle'.
   * @param friction - Surface friction coefficient in [0, 1]. Defaults to 0.0 for circle, 0.6 for AABB/triangle.
   * @param isSensor - Whether this body is a sensor/trigger (detects overlap without physical resolution). Defaults to false.
   * @param collisionCategory - Bitfield category for collision filtering (e.g. 0x0001). Defaults to 0x0001.
   * @param collisionMask - Bitfield mask for categories this body can collide with. Defaults to 0xFFFF.
   * @param collisionGroup - Group index for override filtering (negative never collides, positive always collides). Defaults to 0.
   * @param bodyType - Explicit rigid body simulation type ('dynamic' | 'static' | 'kinematic'). Inferred from mass/velocity if omitted.
   * @param isBullet - Whether Continuous Collision Detection (CCD) is enabled to prevent tunneling at high velocities. Defaults to false.
   */
  constructor(
    position          : Vec2 = new Vec2(),
    velocity          : Vec2 = new Vec2(),
    size              : Vec2 = new Vec2(20, 20),
    mass              : number = 1.0,
    damping           : number = 0.8,
    restitution       : number = 0,
    shape             : BodyShape = 'circle',
    friction?         : number,
    isSensor          : boolean = false,
    collisionCategory : number = 0x0001,
    collisionMask     : number = 0xFFFF,
    collisionGroup    : number = 0,
    bodyType?         : BodyType,
    isBullet          : boolean = false
  ) {
    const pos = position ? position.clone() : new Vec2();
    this.velocity = velocity ? velocity.clone() : new Vec2();
    this.initialVelocity = this.velocity.clone();

    this.translate       = new Vec2();
    this.gravity         = new Vec2();
    this.force           = new Vec2();
    this.impulse         = new Vec2();
    this.resultingAcc    = new Vec2();

    if (bodyType !== undefined) {
      this.bodyType = bodyType;
      if (bodyType === 'static') {
        this.mass = 0;
        this.inverseMass = 0;
        this.velocity.origin();
        this.initialVelocity.origin();
      } else if (bodyType === 'kinematic') {
        this.mass = 0;
        this.inverseMass = 0;
      } else {
        this.mass = Math.max(0, mass);
        if (this.mass === 0)
          this.mass = 1.0;
        this.inverseMass = 1 / this.mass;
      }
    } else {
      this.mass = Math.max(0, mass);
      this.inverseMass = !this.mass ? 0 : 1 / this.mass;
      if (this.mass === 0)
        this.bodyType = this.velocity.isOrigin() ? 'static' : 'kinematic';
      else
        this.bodyType = 'dynamic';
    }

    this.damping      = Utils.clamp(damping, 0, 1);
    this.restitution  = Utils.clamp(restitution, 0, 1);

    this.friction     = friction !== undefined
      ? Utils.clamp(friction, 0, 1)
      : (shape === 'rectangle' || shape === 'aabb' || isTriangleShape(shape) ? 0.6 : 0.0);

    this.isSensor     = isSensor;
    this.isBullet     = isBullet;

    this.collisionCategory = collisionCategory;
    this.collisionMask = collisionMask;
    this.collisionGroup = collisionGroup;

    const s = size ? size.clone() : new Vec2(20, 20);
    if (isTriangleShape(shape)) {
      const corner = shape.slice(9) as TriangleCorner;
      this.body = new RightTriangle( s, pos, corner );
    } else if (shape === 'rectangle' || shape === 'aabb')
      this.body = new Rect( s, pos );
    else
      this.body = new Circ( s.x * 0.5, pos );
    this.position = this.body.position;
  }

  public setActive(active: boolean = true): void {
    this.active = active;
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

  public sleep(): void {
    if (!this.canSleep)
      return;
    this.isSleeping = true;
    this.velocity.origin();
    this.translate.origin();
    this.idleSteps = 0;
  }

  public wakeUp(): void {
    this.isSleeping = false;
    this.idleSteps = 0;
  }

  public setCanSleep(canSleep: boolean): void {
    this.canSleep = canSleep;
    if (!canSleep && this.isSleeping)
      this.wakeUp();
  }

  public getCanSleep(): boolean {
    return this.canSleep;
  }

  public getIsSleeping(): boolean {
    return this.isSleeping;
  }

  public setSleepThreshold(threshold: number): void {
    this.sleepThreshold = Math.max(0, threshold);
  }

  public getSleepThreshold(): number {
    return this.sleepThreshold;
  }

  public setSleepStepsThreshold(steps: number): void {
    this.sleepStepsThreshold = Math.max(1, steps);
  }

  public getSleepStepsThreshold(): number {
    return this.sleepStepsThreshold;
  }

  public applyForce(force: Vec2): void {
    if (this.bodyType !== 'dynamic')
      return;
    this.force.add(force);
    this.wakeUp();
  }

  public applyImpulseVector(impulse: Vec2): void {
    if (this.bodyType !== 'dynamic')
      return;
    this.impulse.add(impulse);
    this.wakeUp();
  }

  public prepareStep( second: number ): boolean {
    if (!this.active || second <= 0 || this.bodyType === 'static')
      return false;

    if (!this.force.isOrigin() || !this.impulse.isOrigin())
      this.wakeUp();

    if (this.isSleeping)
      return false;

    if (this.inverseMass && this.bodyType === 'dynamic')
      this.applyImpulse();

    if (this.canSleep) {
      const speedSq = this.velocity.getMagnitude(true);
      if (speedSq < this.sleepThreshold * this.sleepThreshold) {
        this.idleSteps++;
        if (this.idleSteps >= this.sleepStepsThreshold) {
          this.sleep();
          return false;
        }
      } else
        this.idleSteps = 0;
    }

    if (this.bodyType === 'dynamic') {
      if (this.inverseMass)
        this.applyForces( second );
      if (this.damping < 1) {
        if (this.cachedSecond !== second || this.cachedDamping !== this.damping) {
          this.cachedSecond = second;
          this.cachedDamping = this.damping;
          this.cachedDampingFactor = this.damping ** second;
        }
        this.velocity.scale( this.cachedDampingFactor );
      }
    }

    return !this.velocity.isOrigin();
  }

  public updatePosition( second: number ): Vec2 {
    this.translate.origin();
    if (this.prepareStep(second)) {
      this.translate.scaleVector(this.velocity, second);
      this.body.translate(this.translate);
    }
    return this.position;
  }

  public applyForces( second: number ): void {
    if (this.bodyType !== 'dynamic')
      return;
    this.resultingAcc.copy( this.gravity ); // initialize resulting acceleration for this frame
    if(!this.force.isOrigin()) {
      this.resultingAcc.addScaledVector( this.force, this.inverseMass );
      this.force.origin();
    }
    if(!this.resultingAcc.isOrigin())
      this.velocity.addScaledVector( this.resultingAcc, second );
  }

  public applyImpulse() : void {
    if (this.bodyType !== 'dynamic' || this.impulse.isOrigin())
      return;
    this.velocity.addScaledVector( this.impulse, this.inverseMass );
    this.impulse.origin();
  }



  public correctPosition(correction: Vec2): void {
    this.wakeUp();
    if (!this.inverseMass || this.bodyType !== 'dynamic')
      return;
    this.translate.scaleVector(correction, this.inverseMass);
    this.body.translate(this.translate);
  }

  public setPosition(position: Vec2): void {
    this.body.setPosition(position);
    this.wakeUp();
  }

  public getPosition(target?: Vec2): Vec2 {
    return target ? target.copy(this.position) : this.position;
  }

  public setVelocity(velocity: Vec2): void {
    this.velocity.copy(velocity);
    this.impulse.origin();
    if (!this.velocity.isOrigin())
      this.wakeUp();
  }

  public getVelocity(target?: Vec2): Vec2 {
    return target ? target.copy(this.velocity) : this.velocity;
  }

  public setInitialVelocity(velocity: Vec2): void {
    this.initialVelocity.copy(velocity);
  }

  public getInitialVelocity(target?: Vec2): Vec2 {
    return target ? target.copy(this.initialVelocity) : this.initialVelocity;
  }

  public setGravity(gravity: Vec2): void {
    this.gravity.copy(gravity);
  }

  public getGravity(target?: Vec2): Vec2 {
    return target ? target.copy(this.gravity) : this.gravity;
  }

  public setMass( mass: number ): void {
    this.mass = Math.max(0, mass);
    this.inverseMass = !this.mass ? 0 : 1 / this.mass;
    if (this.mass === 0 && this.bodyType === 'dynamic')
      this.bodyType = this.velocity.isOrigin() ? 'static' : 'kinematic';
    else if (this.mass > 0)
      this.bodyType = 'dynamic';
  }

  public getMass(): number {
    return this.mass;
  }

  public setBodyType(type: BodyType): void {
    this.bodyType = type;
    if (type === 'static') {
      this.mass = 0;
      this.inverseMass = 0;
      this.velocity.origin();
      this.initialVelocity.origin();
    } else if (type === 'kinematic') {
      this.mass = 0;
      this.inverseMass = 0;
    } else if (type === 'dynamic') {
      if (this.mass === 0)
        this.mass = 1.0;
      this.inverseMass = 1 / this.mass;
    }
  }

  public getBodyType(): BodyType {
    return this.bodyType;
  }

  public isStatic(): boolean {
    return this.bodyType === 'static';
  }

  public isKinematic(): boolean {
    return this.bodyType === 'kinematic';
  }

  public isDynamic(): boolean {
    return this.bodyType === 'dynamic';
  }

  public isStationary(): boolean {
    return this.isSleeping || this.bodyType === 'static' || (this.bodyType === 'kinematic' && this.velocity.isOrigin());
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

  public getBody(): Rect | Circ | RightTriangle {
    return this.body;
  }

  public setSize( size: Vec2 ): void {
    if (this.body.shape === 'circle')
      (this.body as Circ).setRadius( size.x );
    else
      (this.body as Rect | RightTriangle).setSize( size );
  }

  public getSize( target: Vec2 = new Vec2() ): Vec2 {
    return target.scaleVector( this.body.halfSize, 2 );
  }

  public get shape(): BodyShape {
    return this.body.shape as BodyShape;
  }

  public get radius(): number {
    return this.body.halfSize.x;
  }

  public get halfSize(): Vec2 {
    return this.body.halfSize;
  }

  public setRadius( radius: number ): void {
    if (this.body.shape === 'circle')
      (this.body as Circ).setRadius( radius );
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

  public setOnCollision(callback: BodyCollisionCallback | null): void {
    this.onCollision = callback;
  }

  public getOnCollision(): BodyCollisionCallback | null {
    return this.onCollision;
  }

  public addCollisionListener(listener: BodyCollisionCallback): void {
    if (this.collisionListeners.indexOf(listener) === -1)
      this.collisionListeners.push(listener);
  }

  public removeCollisionListener(listener: BodyCollisionCallback): boolean {
    const idx = this.collisionListeners.indexOf(listener);
    if (idx === -1)
      return false;
    this.collisionListeners.splice(idx, 1);
    return true;
  }

  public clearCollisionListeners(): void {
    this.collisionListeners = [];
  }

  public setSensor(isSensor: boolean): void {
    this.isSensor = isSensor;
  }

  public getSensor(): boolean {
    return this.isSensor;
  }

  public getIsSensor(): boolean {
    return this.isSensor;
  }

  public setCollisionCategory(category: number): void {
    this.collisionCategory = category;
  }

  public getCollisionCategory(): number {
    return this.collisionCategory;
  }

  public setCollisionMask(mask: number): void {
    this.collisionMask = mask;
  }

  public getCollisionMask(): number {
    return this.collisionMask;
  }

  public setCollisionGroup(group: number): void {
    this.collisionGroup = group;
  }

  public getCollisionGroup(): number {
    return this.collisionGroup;
  }

  public ignoreCollisionWith(other: Physics): void {
    if (!this.ignoredBodies)
      this.ignoredBodies = new Set();
    this.ignoredBodies.add(other);
  }

  public restoreCollisionWith(other: Physics): void {
    if (this.ignoredBodies) {
      this.ignoredBodies.delete(other);
      if (this.ignoredBodies.size === 0)
        this.ignoredBodies = null;
    }
  }

  public isIgnoringCollisionWith(other: Physics): boolean {
    return this.ignoredBodies !== null && this.ignoredBodies.has(other);
  }

  public canCollideWith(other: Physics): boolean {
    if ((this.ignoredBodies && this.ignoredBodies.has(other)) ||
        (other.ignoredBodies && other.ignoredBodies.has(this)))
      return false;
    if (this.collisionGroup !== 0 && this.collisionGroup === other.collisionGroup)
      return this.collisionGroup > 0;
    return (this.collisionCategory & other.collisionMask) !== 0 &&
           (other.collisionCategory & this.collisionMask) !== 0;
  }

  public setBullet(bullet: boolean): void {
    this.isBullet = bullet;
  }

  public getBullet(): boolean {
    return this.isBullet;
  }

  public getIsBullet(): boolean {
    return this.isBullet;
  }

  public raycast(start: Vec2, end: Vec2): RaycastHit | null {
    return Raycast.raycastBody(start, end, this);
  }

  public sweep(start: Vec2, end: Vec2, other: Physics): RaycastHit | null {
    return Raycast.sweepBody(start, end, this, other);
  }

  public collision (impulsePerInverseMass: Vec2, object: Physics, normal?: Vec2): void {
    this.wakeUp();
    if(this.inverseMass)
      this.impulse.add(impulsePerInverseMass);
    this.damageTaken += object.damageDealt;
    if (this.onCollision || this.collisionListeners.length > 0) {
      const n = normal ? normal.clone() : new Vec2();
      const imp = impulsePerInverseMass.clone();
      if (this.onCollision)
        this.onCollision(object, n, imp);
      for (let i = 0; i < this.collisionListeners.length; i++)
        this.collisionListeners[i](object, n, imp);
    }
  }

  public reset(): void {
    this.translate.origin();
    this.force.origin();
    this.impulse.origin();
    this.resultingAcc.origin();
    this.damageTaken = 0;
    this.wakeUp();
    if (this.bodyType === 'static') {
      this.velocity.origin();
      this.initialVelocity.origin();
    } else
      this.velocity.copy(this.initialVelocity);
  }

  /**
   * Test whether a point lies inside this active body.
   * @param point - Point in world coordinates.
   * @returns true if the point is inside the body.
   */
  public containsPoint(point: Vec2): boolean {
    if (!this.active)
      return false;
    return this.body.isIn(point);
  }

  private static readonly scratchCircle = new Circ(0);

  /**
   * Test whether this active body overlaps a circle defined by center and radius.
   * @param center - Circle center in world coordinates.
   * @param radius - Circle radius.
   * @returns true if overlapping.
   */
  public overlapsCircle(center: Vec2, radius: number): boolean {
    if (!this.active || radius < 0)
      return false;
    Physics.scratchCircle.position.copy(center);
    Physics.scratchCircle.radius = radius;
    return this.body.overlapsCircle(Physics.scratchCircle);
  }

  /**
   * Test whether this active body overlaps an Axis-Aligned Bounding Box (AABB).
   * @param min - Minimum corner (or first corner).
   * @param max - Maximum corner (or second corner).
   * @returns true if overlapping.
   */
  public overlapsAabb(min: Vec2, max: Vec2): boolean {
    if (!this.active)
      return false;
    return this.body.overlapsBounds(min, max);
  }

  public draw(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void {
    this.body.draw( context, fillColor, strokeColor, strokeWidth );
  }

}

