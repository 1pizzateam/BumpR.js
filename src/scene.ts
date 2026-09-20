import type { Grid } from '@1pizzateam/spock';
import { Vec2 } from '@1pizzateam/spock';
import { CollisionDetection } from './collision';
import type { Physics } from './physics';

export class Scene {

  bodies : Physics[];
  bodiesLength : number;
  gravity : Vec2;
  iterations : number;
  grid : Grid | null;
  private nextBodyId : number = 1;

  private cellBuckets : Physics[][] = [];
  private activeBuckets : number[] = [];

  constructor(grid: Grid | null = null) {
    this.bodies = [];
    this.bodiesLength = 0;
    this.iterations = 1;
    this.gravity = new Vec2( 0, 400 );
    this.grid = grid;
  }

  public addBody(body: Physics): boolean {
    if (body.collisionSceneId)
      return false;
    body.collisionSceneId = this.nextBodyId++;
    if (body.gravity.isOrigin())
      body.setGravity(this.gravity);
    if (this.grid)
      body.setGrid(this.grid);
    this.bodies.push(body);
    this.bodiesLength = this.bodies.length;
    return true;
  }

  public removeBody(body: Physics): boolean {
    const index = this.bodies.indexOf(body);
    if (index === -1)
      return false;
    const last = this.bodies.pop();
    if (last && index < this.bodies.length)
      this.bodies[index] = last;
    this.bodiesLength = this.bodies.length;
    body.collisionSceneId = 0;
    body.setGrid(null);
    return true;
  }

  public clear(): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      this.bodies[i].collisionSceneId = 0;
      this.bodies[i].setGrid(null);
    }
    this.bodies = [];
    this.bodiesLength = 0;
    this.clearBuckets();
  }

  public setGrid(grid: Grid | null): void {
    this.grid = grid;
    this.clearBuckets();
    this.cellBuckets = [];
    this.activeBuckets = [];
    for (let i = 0; i < this.bodiesLength; i++)
      this.bodies[i].setGrid(grid);
  }

  public getGrid(): Grid | null {
    return this.grid;
  }

  public setGravity(gravity: Vec2): void {
    this.gravity.copy(gravity);
    for (let i = 0; i < this.bodiesLength; i++)
      this.bodies[i].setGravity(gravity);
  }

  public update(second: number): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!body.isActive() || (body.inverseMass === 0 && body.velocity.isOrigin()))
        continue;
      body.updatePosition(second);
    }
  }

  private clearBuckets(): void {
    for (let i = 0; i < this.activeBuckets.length; i++)
      this.cellBuckets[this.activeBuckets[i]].length = 0;
    this.activeBuckets.length = 0;
  }

  private populateBuckets(): void {
    if (!this.grid) return;
    const totalCells = this.grid.len.x * this.grid.len.y;
    while (this.cellBuckets.length < totalCells)
      this.cellBuckets.push([]);
    this.clearBuckets();
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!body.isActive())
        continue;
      const cells = body.body.gridCells;
      if (cells[0] === -1)
        continue;
      for (let c = 0; c < cells.length; c++) {
        const cellId = cells[c];
        if (cellId < 0 || cellId >= totalCells)
          continue;
        const bucket = this.cellBuckets[cellId];
        if (bucket.length === 0)
          this.activeBuckets.push(cellId);
        bucket.push(body);
      }
    }
  }

  private isFirstCommonCell(aCells: number[], bCells: number[], cellId: number): boolean {
    if (aCells[0] === cellId || bCells[0] === cellId)
      return true;
    for (let i = 0; i < aCells.length; i++) {
      const c = aCells[i];
      if (c >= cellId) break;
      if (c !== -1 && bCells.indexOf(c) !== -1)
        return false;
    }
    return true;
  }

  public test(): void {
    for(let k = 0 ; k < this.iterations ; k++) {
      if (this.grid) {
        this.populateBuckets();
        for (let a = 0; a < this.activeBuckets.length; a++) {
          const b = this.activeBuckets[a];
          const bucket = this.cellBuckets[b];
          const bucketLen = bucket.length;
          if (bucketLen <= 1) continue;
          for (let i = 0; i < bucketLen; i++) {
            const body1 = bucket[i];
            for (let j = i + 1; j < bucketLen; j++) {
              const body2 = bucket[j];
              if (body1.inverseMass === 0 && body2.inverseMass === 0)
                continue;
              if (!this.isFirstCommonCell(body1.body.gridCells, body2.body.gridCells, b))
                continue;
              CollisionDetection.test(body1, body2);
            }
          }
        }
      } else {
        for(let i = 0 ; i < this.bodiesLength ; i++) {
          const body1 = this.bodies[i];
          if (!body1.isActive())
            continue;
          for(let j = i + 1 ; j < this.bodiesLength ; j++) {
            const body2 = this.bodies[j];
            if (!body2.isActive() || (body1.inverseMass === 0 && body2.inverseMass === 0))
              continue;
            CollisionDetection.test(body1, body2);
          }
        }
      }
    }
  }

  public testScene(scene: Scene): void {
    const sceneBodiesLen = scene.bodiesLength;
    for(let k = 0 ; k < this.iterations ; k++) {
      if (this.grid) {
        this.populateBuckets();
        for (let s = 0; s < sceneBodiesLen; s++) {
          const body2 = scene.bodies[s];
          if (!body2.isActive()) continue;
          const cells2 = body2.body.gridCells;
          if (cells2[0] === -1) continue;
          for (let c = 0; c < cells2.length; c++) {
            const cellId = cells2[c];
            if (cellId < 0 || cellId >= this.cellBuckets.length) continue;
            const bucket = this.cellBuckets[cellId];
            for (let p = 0; p < bucket.length; p++) {
              const body1 = bucket[p];
              if (body1 === body2) continue;
              if (body1.inverseMass === 0 && body2.inverseMass === 0) continue;
              if (!this.isFirstCommonCell(body1.body.gridCells, cells2, cellId)) continue;
              CollisionDetection.test(body1, body2);
            }
          }
        }
      } else {
        for(let i = 0 ; i < this.bodiesLength ; i++) {
          const body1 = this.bodies[i];
          if (!body1.isActive())
            continue;
          for(let j = 0 ; j < sceneBodiesLen ; j++) {
            const body2 = scene.bodies[j];
            if (!body2.isActive() || body1 === body2 || (body1.inverseMass === 0 && body2.inverseMass === 0))
              continue;
            CollisionDetection.test(body1, body2);
          }
        }
      }
    }
  }

  public setIteration(iterations: number): void {
    this.iterations = iterations;
  }

  public draw(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (body.isActive())
        body.draw(context, fillColor, strokeColor, strokeWidth);
    }
  }

  public drawGrid(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void {
    if (this.grid)
      this.grid.draw(context, fillColor, strokeColor, strokeWidth);
  }

}

