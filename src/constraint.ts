import { Vec2 } from '@1pizzateam/spock';
import type { Physics } from './physics';

export interface DistanceConstraintOptions {
  distance?: number;
  minDistance?: number;
  maxDistance?: number;
  stiffness?: number;
  damping?: number;
  anchorA?: Vec2;
  anchorB?: Vec2;
  collideConnected?: boolean;
}

export class DistanceConstraint {
  public bodyA: Physics;
  public bodyB: Physics;
  public anchorA: Vec2;
  public anchorB: Vec2;
  public distance: number;
  public minDistance: number;
  public maxDistance: number;
  public stiffness: number;
  public damping: number;
  public collideConnected: boolean;
  public active: boolean = true;
  private static readonly FALLBACK_NORMAL = new Vec2(1, 0);

  // Pre-allocated scratch vectors to avoid runtime allocations in hot solver path
  private pA = new Vec2();
  private pB = new Vec2();
  private delta = new Vec2();
  private normal = new Vec2();
  private correction = new Vec2();

  constructor(
    bodyA: Physics,
    bodyB: Physics,
    options?: DistanceConstraintOptions
  ) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.anchorA = options?.anchorA ? options.anchorA.clone() : new Vec2();
    this.anchorB = options?.anchorB ? options.anchorB.clone() : new Vec2();

    const initialDist = this.getCurrentDistance();

    this.distance = options?.distance !== undefined ? Math.max(0, options.distance) : initialDist;
    this.minDistance = options?.minDistance !== undefined ? Math.max(0, options.minDistance) : this.distance;
    this.maxDistance = options?.maxDistance !== undefined ? Math.max(this.minDistance, options.maxDistance) : this.distance;
    this.stiffness = options?.stiffness !== undefined ? Math.max(0, Math.min(1, options.stiffness)) : 1.0;
    this.damping = options?.damping !== undefined ? Math.max(0, Math.min(1, options.damping)) : 0.1;
    this.collideConnected = options?.collideConnected ?? false;
  }

  public static createRod(
    bodyA: Physics,
    bodyB: Physics,
    length?: number,
    options?: Omit<DistanceConstraintOptions, 'distance' | 'minDistance' | 'maxDistance' | 'stiffness'>
  ): DistanceConstraint {
    return new DistanceConstraint(bodyA, bodyB, {
      ...options,
      distance: length,
      minDistance: length,
      maxDistance: length,
      stiffness: 1.0,
    });
  }

  public static createRope(
    bodyA: Physics,
    bodyB: Physics,
    maxLength?: number,
    options?: Omit<DistanceConstraintOptions, 'minDistance' | 'maxDistance'>
  ): DistanceConstraint {
    return new DistanceConstraint(bodyA, bodyB, {
      ...options,
      distance: maxLength,
      minDistance: 0,
      maxDistance: maxLength,
      stiffness: options?.stiffness ?? 1.0,
    });
  }

  public static createSpring(
    bodyA: Physics,
    bodyB: Physics,
    stiffnessOrLength?: number,
    dampingOrStiffness?: number,
    lengthOrDamping?: number,
    options?: Omit<DistanceConstraintOptions, 'stiffness' | 'damping' | 'distance'>
  ): DistanceConstraint {
    let distance: number | undefined;
    let stiffness: number;
    let damping: number;

    if (stiffnessOrLength !== undefined && stiffnessOrLength > 1) {
      distance = stiffnessOrLength;
      stiffness = dampingOrStiffness ?? 0.2;
      damping = lengthOrDamping ?? 0.1;
    } else {
      stiffness = stiffnessOrLength ?? 0.2;
      damping = dampingOrStiffness ?? 0.1;
      distance = lengthOrDamping;
    }

    return new DistanceConstraint(bodyA, bodyB, {
      ...options,
      distance,
      stiffness,
      damping,
    });
  }

  public setDistance(distance: number): void {
    this.distance = Math.max(0, distance);
    this.minDistance = this.distance;
    this.maxDistance = this.distance;
  }

  public getDistance(): number {
    return this.distance;
  }

  public setMinDistance(minDistance: number): void {
    this.minDistance = Math.max(0, minDistance);
    if (this.maxDistance < this.minDistance)
      this.maxDistance = this.minDistance;
  }

  public getMinDistance(): number {
    return this.minDistance;
  }

  public setMaxDistance(maxDistance: number): void {
    this.maxDistance = Math.max(this.minDistance, maxDistance);
  }

  public getMaxDistance(): number {
    return this.maxDistance;
  }

  public setStiffness(stiffness: number): void {
    this.stiffness = Math.max(0, Math.min(1, stiffness));
  }

  public getStiffness(): number {
    return this.stiffness;
  }

  public setDamping(damping: number): void {
    this.damping = Math.max(0, Math.min(1, damping));
  }

  public getDamping(): number {
    return this.damping;
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public isActive(): boolean {
    return this.active;
  }

  public getWorldAnchorA(out?: Vec2): Vec2 {
    return (out ?? new Vec2()).addVectors(this.bodyA.position, this.anchorA);
  }

  public getWorldAnchorB(out?: Vec2): Vec2 {
    return (out ?? new Vec2()).addVectors(this.bodyB.position, this.anchorB);
  }

  public getCurrentDistance(): number {
    this.getWorldAnchorA(this.pA);
    this.getWorldAnchorB(this.pB);
    this.delta.subVectors(this.pB, this.pA);
    return this.delta.getMagnitude();
  }

  public solve(): void {
    if (!this.active)
      return;
    if (!this.bodyA.isActive() && !this.bodyB.isActive())
      return;
    if (this.bodyA.isStationary() && this.bodyB.isStationary())
      return;

    this.getWorldAnchorA(this.pA);
    this.getWorldAnchorB(this.pB);
    this.delta.subVectors(this.pB, this.pA);
    const distSq = this.delta.getMagnitude(true);

    if (distSq >= this.minDistance * this.minDistance && distSq <= this.maxDistance * this.maxDistance)
      return; // Within range [minDistance, maxDistance]

    const currentDist = Math.sqrt(distSq);
    let error = 0;
    if (currentDist < this.minDistance)
      error = currentDist - this.minDistance; // Negative: too close, needs expansion
    else
      error = currentDist - this.maxDistance; // Positive: too far, needs pull

    if (Math.abs(error) > 0.001) {
      this.bodyA.wakeUp();
      this.bodyB.wakeUp();
    }

    this.normal.normalizeVector(this.delta, DistanceConstraint.FALLBACK_NORMAL);

    const invMassA = this.bodyA.isDynamic() ? this.bodyA.inverseMass : 0;
    const invMassB = this.bodyB.isDynamic() ? this.bodyB.inverseMass : 0;
    const totalInvMass = invMassA + invMassB;
    if (totalInvMass <= 0)
      return;

    if (this.stiffness < 1.0) {
      // Elastic spring restorative impulse (Hooke's law: F = -k * x)
      const springImpulse = (error * (this.stiffness * 5)) / totalInvMass;
      if (invMassA > 0)
        this.bodyA.velocity.addScaledVector(this.normal, springImpulse * invMassA);
      if (invMassB > 0)
        this.bodyB.velocity.addScaledVector(this.normal, -springImpulse * invMassB);
    } else {
      // Rigid constraint positional projection (rods & ropes)
      const correctionMag = error / totalInvMass;
      if (invMassA > 0) {
        this.correction.scaleVector(this.normal, correctionMag * invMassA);
        this.bodyA.body.translate(this.correction);
      }
      if (invMassB > 0) {
        this.correction.scaleVector(this.normal, -correctionMag * invMassB);
        this.bodyB.body.translate(this.correction);
      }
    }

    // Velocity impulse damping
    if (this.damping > 0) {
      this.delta.subVectors(this.bodyB.velocity, this.bodyA.velocity);
      const normalVel = this.delta.dotProduct(this.normal);
      const dampingImpulse = (normalVel * this.damping) / totalInvMass;

      if (invMassA > 0)
        this.bodyA.velocity.addScaledVector(this.normal, dampingImpulse * invMassA);
      if (invMassB > 0)
        this.bodyB.velocity.addScaledVector(this.normal, -dampingImpulse * invMassB);
    }
  }

  public draw(
    context: CanvasRenderingContext2D,
    strokeColor: string = '#888888',
    strokeWidth: number = 2
  ): void {
    if (!this.active)
      return;
    this.getWorldAnchorA(this.pA);
    this.getWorldAnchorB(this.pB);
    context.save();
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.beginPath();
    context.moveTo(this.pA.x, this.pA.y);
    context.lineTo(this.pB.x, this.pB.y);
    context.stroke();
    context.restore();
  }
}

export { DistanceConstraint as Joint };
