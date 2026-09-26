import { Circ, Rect, Vec2 } from '@1pizzateam/spock';
import { Shape } from './collision.js';
import type { Physics } from './physics.js';

export interface RaycastHit {
  body: Physics;
  point: Vec2;
  normal: Vec2;
  fraction: number;
}

export interface RaycastOptions {
  mask?: number;
  category?: number;
  ignoreSensors?: boolean;
}

export const Raycast = {

  scratchCorner: new Vec2(),
  scratchExpandedHalfSize: new Vec2(),
  scratchCircle: new Circ(1, new Vec2(0, 0)),
  scratchRect: new Rect(new Vec2(1, 1), new Vec2(0, 0)),
  scratchMin: new Vec2(),
  scratchMax: new Vec2(),
  scratchClosest: new Vec2(),
  scratchDiff: new Vec2(),
  scratchBestPoint: new Vec2(),
  scratchBestNormal: new Vec2(),

  getAabbExitNormal(point: Vec2, min: Vec2, max: Vec2, out: Vec2): Vec2 {
    const distToMin = this.scratchDiff.subVectors(point, min);
    const distToMax = this.scratchClosest.subVectors(max, point);
    const minDist = this.scratchCorner.minVectors(distToMin, distToMax);

    if (minDist.x <= minDist.y)
      return out.setScalar(distToMin.x <= distToMax.x ? -1 : 1, 0);
    return out.setScalar(0, distToMin.y <= distToMax.y ? -1 : 1);
  },

  raycastCircle(
    start: Vec2,
    end: Vec2,
    center: Vec2,
    radius: number
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchCircle.position.copy(center);
    this.scratchCircle.radius = radius;
    return this.scratchCircle.raycast(start, end);
  },

  raycastAabb(
    start: Vec2,
    end: Vec2,
    center: Vec2,
    halfSize: Vec2
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchRect.position.copy(center);
    this.scratchRect.halfSize.copy(halfSize);
    this.scratchRect.topLeftCorner.subVectors(center, halfSize);
    this.scratchRect.bottomRightCorner.addVectors(center, halfSize);
    return this.scratchRect.raycast(start, end);
  },

  raycastBody(start: Vec2, end: Vec2, body: Physics): RaycastHit | null {
    if (!body.isActive())
      return null;

    const hit = (body.body as Circ | Rect).raycast(start, end);
    if (!hit)
      return null;

    return {
      body,
      point: hit.point,
      normal: hit.normal,
      fraction: hit.fraction
    };
  },

  sweepCircleCircle(
    start: Vec2,
    end: Vec2,
    radiusA: number,
    centerB: Vec2,
    radiusB: number
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    const totalRadius = radiusA + radiusB;
    const hit = this.raycastCircle(start, end, centerB, totalRadius);
    if (!hit)
      return null;

    const point = new Vec2().copy(centerB).addScaledVector(hit.normal, radiusB);
    return {
      fraction: hit.fraction,
      point,
      normal: hit.normal
    };
  },

  sweepCircleAabb(
    start: Vec2,
    end: Vec2,
    radiusA: number,
    centerB: Vec2,
    halfSizeB: Vec2
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchMin.subVectors(centerB, halfSizeB);
    this.scratchMax.addVectors(centerB, halfSizeB);

    this.scratchClosest.clampVectors(start, this.scratchMin, this.scratchMax);
    this.scratchDiff.subVectors(start, this.scratchClosest);
    const distSq = this.scratchDiff.getMagnitude(true);

    if (distSq <= radiusA * radiusA) {
      const normal = new Vec2();
      if (distSq > 0)
        normal.copy(this.scratchDiff).normalize();
      else
        this.getAabbExitNormal(start, this.scratchMin, this.scratchMax, normal);
      return {
        fraction: 0,
        point: start.clone(),
        normal
      };
    }

    let tMin = 2;
    let hasHit = false;

    // 1. Raycast X-expanded box for left/right flat faces
    this.scratchExpandedHalfSize.setScalar(halfSizeB.x + radiusA, halfSizeB.y);
    const hitX = this.raycastAabb(start, end, centerB, this.scratchExpandedHalfSize);
    if (hitX && hitX.normal.x !== 0 && hitX.fraction < tMin) {
      tMin = hitX.fraction;
      this.scratchBestPoint.clampVectors(hitX.point, this.scratchMin, this.scratchMax);
      this.scratchBestNormal.copy(hitX.normal);
      hasHit = true;
    }

    // 2. Raycast Y-expanded box for top/bottom flat faces
    this.scratchExpandedHalfSize.setScalar(halfSizeB.x, halfSizeB.y + radiusA);
    const hitY = this.raycastAabb(start, end, centerB, this.scratchExpandedHalfSize);
    if (hitY && hitY.normal.y !== 0 && hitY.fraction < tMin) {
      tMin = hitY.fraction;
      this.scratchBestPoint.clampVectors(hitY.point, this.scratchMin, this.scratchMax);
      this.scratchBestNormal.copy(hitY.normal);
      hasHit = true;
    }

    // 3. Raycast 4 rounded corner circles
    for (let c = 0; c < 4; c++) {
      const cx = (c & 1) ? this.scratchMax.x : this.scratchMin.x;
      const cy = (c & 2) ? this.scratchMax.y : this.scratchMin.y;
      this.scratchCorner.setScalar(cx, cy);
      const hit = this.raycastCircle(start, end, this.scratchCorner, radiusA);
      if (hit && hit.fraction < tMin) {
        tMin = hit.fraction;
        this.scratchBestPoint.copy(this.scratchCorner);
        this.scratchBestNormal.copy(hit.normal);
        hasHit = true;
      }
    }

    if (tMin <= 1 && hasHit)
      return {
        fraction: tMin,
        point: this.scratchBestPoint.clone(),
        normal: this.scratchBestNormal.clone()
      };
    return null;
  },

  sweepAabbAabb(
    start: Vec2,
    end: Vec2,
    halfSizeA: Vec2,
    centerB: Vec2,
    halfSizeB: Vec2
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchExpandedHalfSize.addVectors(halfSizeB, halfSizeA);
    const hit = this.raycastAabb(start, end, centerB, this.scratchExpandedHalfSize);
    if (!hit)
      return null;

    this.scratchMin.subVectors(centerB, halfSizeB);
    this.scratchMax.addVectors(centerB, halfSizeB);
    const point = new Vec2().clampVectors(hit.point, this.scratchMin, this.scratchMax);

    return {
      fraction: hit.fraction,
      point,
      normal: hit.normal
    };
  },

  sweepAabbCircle(
    start: Vec2,
    end: Vec2,
    halfSizeA: Vec2,
    centerB: Vec2,
    radiusB: number
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    const hit = this.sweepCircleAabb(start, end, radiusB, centerB, halfSizeA);
    if (!hit)
      return null;
    hit.point.copy(centerB).addScaledVector(hit.normal, radiusB);
    return hit;
  },

  sweepBody(
    start: Vec2,
    end: Vec2,
    movingBody: Physics,
    targetBody: Physics
  ): RaycastHit | null {
    if (!targetBody.isActive())
      return null;

    const shapeA = movingBody.shape;
    const shapeB = targetBody.shape;
    const posB = targetBody.position;
    let hit: { fraction: number; point: Vec2; normal: Vec2 } | null = null;

    if (shapeA === Shape.circle) {
      const radiusA = movingBody.radius;
      if (shapeB === Shape.circle)
        hit = this.sweepCircleCircle(start, end, radiusA, posB, targetBody.radius);
      else if (shapeB === Shape.aabb)
        hit = this.sweepCircleAabb(start, end, radiusA, posB, targetBody.halfSize);
    } else if (shapeA === Shape.aabb) {
      const halfA = movingBody.halfSize;
      if (shapeB === Shape.circle)
        hit = this.sweepAabbCircle(start, end, halfA, posB, targetBody.radius);
      else if (shapeB === Shape.aabb)
        hit = this.sweepAabbAabb(start, end, halfA, posB, targetBody.halfSize);
    }

    if (!hit)
      return null;

    return {
      body: targetBody,
      point: hit.point,
      normal: hit.normal,
      fraction: hit.fraction
    };
  }
};
