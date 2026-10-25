import type { RayHit2D, RightTriangle } from '@1pizzateam/spock';
import { Circ, Rect, Vec2, raycastSegment } from '@1pizzateam/spock';
import { isTriangleShape, Shape } from './collision.js';
import { AabbVSTriangle } from './collisions/aabbvstriangle.js';
import { CircleVSTriangle } from './collisions/circlevstriangle.js';
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
  ignoreBody?: Physics;
  filter?: (body: Physics) => boolean;
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
  scratchS: new Vec2(),
  scratchA: new Vec2(),
  scratchB: new Vec2(),
  scratchE1: new Vec2(),
  scratchE2: new Vec2(),
  scratchHit: { fraction: 0, point: new Vec2(), normal: new Vec2() } as RayHit2D,

  raycastCircle(
    start: Vec2,
    end: Vec2,
    center: Vec2,
    radius: number,
    target?: RayHit2D
  ): RayHit2D | null {
    this.scratchCircle.position.copy(center);
    this.scratchCircle.radius = radius;
    return this.scratchCircle.raycast(start, end, target);
  },

  raycastAabb(
    start: Vec2,
    end: Vec2,
    center: Vec2,
    halfSize: Vec2,
    target?: RayHit2D
  ): RayHit2D | null {
    this.scratchRect.halfSize.copy(halfSize);
    this.scratchRect.setPosition(center);
    return this.scratchRect.raycast(start, end, target);
  },

  raycastSegment(
    start: Vec2,
    end: Vec2,
    p1: Vec2,
    p2: Vec2,
    outNormal: Vec2,
    target?: RayHit2D
  ): RayHit2D | null {
    return raycastSegment(start, end, p1, p2, outNormal, target);
  },

  raycastBody(start: Vec2, end: Vec2, body: Physics): RaycastHit | null {
    if (!body.isActive())
      return null;

    const hit = body.body.raycast(start, end);
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
    const hit = this.raycastCircle(start, end, centerB, radiusA + radiusB);
    if (!hit)
      return null;

    hit.point.copy(centerB).addScaledVector(hit.normal, radiusB);
    return hit;
  },

  sweepCircleAabb(
    start: Vec2,
    end: Vec2,
    radiusA: number,
    centerB: Vec2,
    halfSizeB: Vec2
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchRect.halfSize.copy(halfSizeB);
    this.scratchRect.setPosition(centerB);
    this.scratchRect.getBounds(this.scratchMin, this.scratchMax);
    this.scratchRect.getClosestPoint(start, this.scratchClosest);
    this.scratchDiff.subVectors(start, this.scratchClosest);
    const distSq = this.scratchDiff.getMagnitude(true);

    if (distSq <= radiusA * radiusA) {
      const normal = new Vec2();
      if (distSq > 0)
        normal.normalizeVector(this.scratchDiff);
      else {
        const insideHit = this.scratchRect.raycast(start, end, this.scratchHit);
        if (insideHit)
          normal.copy(insideHit.normal);
        else
          normal.setScalar(0, -1);
      }
      return {
        fraction: 0,
        point: start.clone(),
        normal
      };
    }

    let tMin = 2;

    // 1. Raycast X-expanded box for left/right flat faces
    this.scratchExpandedHalfSize.setScalar(halfSizeB.x + radiusA, halfSizeB.y);
    const hitX = this.raycastAabb(start, end, centerB, this.scratchExpandedHalfSize, this.scratchHit);
    if (hitX && hitX.normal.x !== 0 && hitX.fraction < tMin) {
      tMin = hitX.fraction;
      this.scratchBestPoint.clampVectors(hitX.point, this.scratchMin, this.scratchMax);
      this.scratchBestNormal.copy(hitX.normal);
    }

    // 2. Raycast Y-expanded box for top/bottom flat faces
    this.scratchExpandedHalfSize.setScalar(halfSizeB.x, halfSizeB.y + radiusA);
    const hitY = this.raycastAabb(start, end, centerB, this.scratchExpandedHalfSize, this.scratchHit);
    if (hitY && hitY.normal.y !== 0 && hitY.fraction < tMin) {
      tMin = hitY.fraction;
      this.scratchBestPoint.clampVectors(hitY.point, this.scratchMin, this.scratchMax);
      this.scratchBestNormal.copy(hitY.normal);
    }

    // 3. Raycast 4 rounded corner circles
    for (let c = 0; c < 4; c++) {
      const cx = (c & 1) ? this.scratchMax.x : this.scratchMin.x;
      const cy = (c & 2) ? this.scratchMax.y : this.scratchMin.y;
      this.scratchCorner.setScalar(cx, cy);
      const hit = this.raycastCircle(start, end, this.scratchCorner, radiusA, this.scratchHit);
      if (hit && hit.fraction < tMin) {
        tMin = hit.fraction;
        this.scratchBestPoint.copy(this.scratchCorner);
        this.scratchBestNormal.copy(hit.normal);
      }
    }

    if (tMin <= 1)
      return {
        fraction: tMin,
        point: this.scratchBestPoint.clone(),
        normal: this.scratchBestNormal.clone()
      };
    return null;
  },

  testOffsetEdge(
    start: Vec2,
    end: Vec2,
    p1: Vec2,
    p2: Vec2,
    normal: Vec2,
    radius: number,
    tMin: number
  ): number {
    this.scratchE1.copy(p1).addScaledVector(normal, radius);
    this.scratchE2.copy(p2).addScaledVector(normal, radius);
    const hit = this.raycastSegment(start, end, this.scratchE1, this.scratchE2, normal, this.scratchHit);
    if (hit && hit.fraction < tMin) {
      this.scratchBestPoint.copy(hit.point).subtractScaledVector(normal, radius);
      this.scratchBestNormal.copy(normal);
      return hit.fraction;
    }
    return tMin;
  },

  sweepCircleTriangle(
    start: Vec2,
    end: Vec2,
    radiusA: number,
    tri: RightTriangle
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchMin.minVectors(start, end).subtractScalar(radiusA);
    this.scratchMax.maxVectors(start, end).addScalar(radiusA);
    if (!tri.overlapsBounds(this.scratchMin, this.scratchMax))
      return null;

    const pen = CircleVSTriangle.detect(start, radiusA, tri);
    if (!pen.isOrigin())
      return {
        fraction: 0,
        point: start.clone(),
        normal: new Vec2().normalizeVector(pen)
      };

    tri.getVertices(this.scratchS, this.scratchA, this.scratchB);

    let tMin = this.testOffsetEdge(start, end, this.scratchA, this.scratchB, tri.hypNormal, radiusA, 2);
    tMin = this.testOffsetEdge(start, end, this.scratchS, this.scratchA, this.scratchCorner.setScalar(tri.sx, 0), radiusA, tMin);
    tMin = this.testOffsetEdge(start, end, this.scratchB, this.scratchS, this.scratchCorner.setScalar(0, tri.sy), radiusA, tMin);

    const vertices = [this.scratchS, this.scratchA, this.scratchB];
    for (let v = 0; v < 3; v++) {
      const vert = vertices[v];
      const hitVert = this.raycastCircle(start, end, vert, radiusA, this.scratchHit);
      if (hitVert && hitVert.fraction < tMin) {
        tMin = hitVert.fraction;
        this.scratchBestPoint.copy(vert);
        this.scratchBestNormal.copy(hitVert.normal);
      }
    }

    if (tMin <= 1)
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
    hit.point.clamp(this.scratchMin, this.scratchMax);
    return hit;
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

  sweepAabbTriangle(
    start: Vec2,
    end: Vec2,
    halfSizeA: Vec2,
    tri: RightTriangle
  ): { fraction: number; point: Vec2; normal: Vec2 } | null {
    this.scratchMin.minVectors(start, end).subtract(halfSizeA);
    this.scratchMax.maxVectors(start, end).add(halfSizeA);
    if (!tri.overlapsBounds(this.scratchMin, this.scratchMax))
      return null;

    const pen = AabbVSTriangle.detect(start, halfSizeA, tri);
    if (!pen.isOrigin())
      return {
        fraction: 0,
        point: start.clone(),
        normal: new Vec2().normalizeVector(pen)
      };

    this.scratchExpandedHalfSize.addVectors(tri.halfSize, halfSizeA);
    const hitAabb = this.raycastAabb(start, end, tri.position, this.scratchExpandedHalfSize, this.scratchHit);
    if (!hitAabb)
      return null;

    // Also test the offset hypotenuse plane (expanded by AABB support along hypNormal)
    const support = this.scratchCorner.absoluteVector(tri.hypNormal).dotProduct(halfSizeA);
    const d0 = tri.signedDistanceToHypotenuse(start) - support;
    const d1 = tri.signedDistanceToHypotenuse(end) - support;
    if (d0 > 0 && d1 > 0)
      return null;

    let tEntry = hitAabb.fraction;
    this.scratchBestNormal.copy(hitAabb.normal);
    if (d0 > 0 && d1 <= 0) {
      const tHyp = d0 / (d0 - d1);
      if (tHyp > tEntry) {
        tEntry = tHyp;
        this.scratchBestNormal.copy(tri.hypNormal);
      }
    }

    if (tEntry > 1)
      return null;

    this.scratchBestPoint.lerpVectors(start, end, tEntry);
    this.scratchExpandedHalfSize.addVectors(tri.halfSize, halfSizeA).addScalar(1e-5);
    this.scratchMin.subVectors(tri.position, this.scratchExpandedHalfSize);
    this.scratchMax.addVectors(tri.position, this.scratchExpandedHalfSize);
    if (!this.scratchBestPoint.isInBounds(this.scratchMin, this.scratchMax))
      return null;

    return {
      fraction: tEntry,
      point: this.scratchBestPoint.clone(),
      normal: this.scratchBestNormal.clone()
    };
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
      else if (isTriangleShape(shapeB))
        hit = this.sweepCircleTriangle(start, end, radiusA, targetBody.body as RightTriangle);
    } else if (shapeA === Shape.aabb) {
      const halfA = movingBody.halfSize;
      if (shapeB === Shape.circle)
        hit = this.sweepAabbCircle(start, end, halfA, posB, targetBody.radius);
      else if (shapeB === Shape.aabb)
        hit = this.sweepAabbAabb(start, end, halfA, posB, targetBody.halfSize);
      else if (isTriangleShape(shapeB))
        hit = this.sweepAabbTriangle(start, end, halfA, targetBody.body as RightTriangle);
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
