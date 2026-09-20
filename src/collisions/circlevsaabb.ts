
import { Vec2 } from '@1pizzateam/spock';

export const CircleVSAabb = {

  penetration : new Vec2(),

  detect( apos: Vec2, radiusA: number, bpos: Vec2, bhs: Vec2 ): Vec2 {
    const relX = apos.x - bpos.x;
    const relY = apos.y - bpos.y;

    const clampedX = Math.max(-bhs.x, Math.min(bhs.x, relX));
    const clampedY = Math.max(-bhs.y, Math.min(bhs.y, relY));

    const dx = relX - clampedX;
    const dy = relY - clampedY;
    const distSq = dx * dx + dy * dy;

    if (distSq > 0) {
      const r2 = radiusA * radiusA;
      if (distSq >= r2)
        return this.penetration.origin();

      const dist = Math.sqrt(distSq);
      const pen = radiusA - dist;
      const scale = pen / dist;
      this.penetration.x = dx * scale;
      this.penetration.y = dy * scale;
      return this.penetration;
    }

    // Circle center is inside or on the boundary of the AABB
    const overlapX = bhs.x - Math.abs(relX) + radiusA;
    const overlapY = bhs.y - Math.abs(relY) + radiusA;

    if (overlapX <= overlapY) {
      this.penetration.x = relX < 0 ? -overlapX : overlapX;
      this.penetration.y = 0;
    } else {
      this.penetration.x = 0;
      this.penetration.y = relY < 0 ? -overlapY : overlapY;
    }

    return this.penetration;
  }

};
