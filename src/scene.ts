import type { Grid } from '@1pizzateam/spock';
import { Vec2 } from '@1pizzateam/spock';
import { CollisionDetection } from './collision';
import type { Physics } from './physics';

export type DeduplicationMode = 'auto' | 'cell' | 'pair';
export type SceneCollisionCallback = (bodyA: Physics, bodyB: Physics, normal: Vec2, impulse: Vec2) => void;

export class Scene {

  bodies : Physics[];
  bodiesLength : number;
  gravity : Vec2;
  iterations : number;
  grid : Grid | null;
  private nextBodyId : number = 1;

  public onCollision: SceneCollisionCallback | null = null;
  private collisionListeners: SceneCollisionCallback[] = [];

  private deduplicationMode : DeduplicationMode = 'auto';
  private activeDeduplicationMode : 'cell' | 'pair' = 'cell';
  private testedPairs : Set<number> = new Set();

  private cellBuckets : Physics[][] = [];
  private activeBuckets : number[] = [];
  private candidatePairs : Physics[] = [];
  private candidatePairsCount : number = 0;

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
    body.sceneIndex = this.bodies.length;
    if (body.gravity.isOrigin())
      body.setGravity(this.gravity);
    if (this.grid)
      body.setGrid(this.grid);
    this.bodies.push(body);
    this.bodiesLength = this.bodies.length;
    return true;
  }

  public removeBody(body: Physics): boolean {
    const index = body.sceneIndex;
    if (index < 0 || index >= this.bodiesLength || this.bodies[index] !== body)
      return false;
    if (this.grid) {
      const cells = body.body.gridCells;
      for (let c = 0; c < cells.length; c++) {
        const cellId = cells[c];
        if (cellId >= 0 && cellId < this.cellBuckets.length) {
          const bucket = this.cellBuckets[cellId];
          for (let b = 0; b < bucket.length; b++) {
            bucket[b].wakeUp();
          }
        }
      }
    }
    const last = this.bodies.pop();
    if (last && index < this.bodies.length) {
      this.bodies[index] = last;
      last.sceneIndex = index;
    }
    this.bodiesLength = this.bodies.length;
    body.sceneIndex = -1;
    body.collisionSceneId = 0;
    body.setGrid(null);
    return true;
  }

  public clear(): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      this.bodies[i].sceneIndex = -1;
      this.bodies[i].collisionSceneId = 0;
      this.bodies[i].setGrid(null);
    }
    this.bodies = [];
    this.bodiesLength = 0;
    this.clearBuckets();
    this.clearCandidatePairs();
    this.candidatePairs = [];
    this.testedPairs.clear();
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
    for (let i = 0; i < this.bodiesLength; i++) {
      this.bodies[i].setGravity(gravity);
      this.bodies[i].wakeUp();
    }
  }

  public update(second: number): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!body.isActive())
        continue;
      if (body.isSleeping) {
        if (!body.force.isOrigin() || !body.impulse.isOrigin()) {
          body.wakeUp();
        } else {
          continue;
        }
      }
      if (body.inverseMass === 0 && body.velocity.isOrigin())
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
    let hasLargeBodies = false;
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!body.isActive())
        continue;
      const cells = body.body.gridCells;
      if (cells[0] === -1)
        continue;
      if (cells.length >= 3)
        hasLargeBodies = true;
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
    if (this.deduplicationMode === 'auto')
      this.activeDeduplicationMode = hasLargeBodies ? 'pair' : 'cell';
    else
      this.activeDeduplicationMode = this.deduplicationMode;
  }

  private isFirstCommonCell(aCells: number[], bCells: number[], cellId: number): boolean {
    if (this.grid)
      return this.grid.isFirstCommonCell(aCells, bCells, cellId);
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

  private addCandidatePair(body1: Physics, body2: Physics): void {
    const idx = this.candidatePairsCount * 2;
    this.candidatePairs[idx] = body1;
    this.candidatePairs[idx + 1] = body2;
    this.candidatePairsCount++;
  }

  private clearCandidatePairs(): void {
    for (let i = 0; i < this.candidatePairsCount * 2; i++)
      this.candidatePairs[i] = null as any;
    this.candidatePairsCount = 0;
  }

  private collectCandidatePairs(): void {
    this.candidatePairsCount = 0;
    if (this.grid) {
      this.populateBuckets();
      const usePairMode = this.activeDeduplicationMode === 'pair';
      if (usePairMode)
        this.testedPairs.clear();

      for (let a = 0; a < this.activeBuckets.length; a++) {
        const b = this.activeBuckets[a];
        const bucket = this.cellBuckets[b];
        const bucketLen = bucket.length;
        if (bucketLen <= 1) continue;
        for (let i = 0; i < bucketLen; i++) {
          const body1 = bucket[i];
          const isBody1Stationary = body1.isSleeping || body1.inverseMass === 0;
          for (let j = i + 1; j < bucketLen; j++) {
            const body2 = bucket[j];
            if (isBody1Stationary && (body2.isSleeping || body2.inverseMass === 0))
              continue;
            if (usePairMode) {
              const id1 = body1.collisionSceneId;
              const id2 = body2.collisionSceneId;
              const maxId = id1 > id2 ? id1 : id2;
              const minId = id1 > id2 ? id2 : id1;
              const pairKey = maxId * maxId + minId;
              if (this.testedPairs.has(pairKey))
                continue;
              this.testedPairs.add(pairKey);
            } else {
              if (!this.isFirstCommonCell(body1.body.gridCells, body2.body.gridCells, b))
                continue;
            }
            this.addCandidatePair(body1, body2);
          }
        }
      }
      if (usePairMode)
        this.testedPairs.clear();
    } else {
      for (let i = 0; i < this.bodiesLength; i++) {
        const body1 = this.bodies[i];
        if (!body1.isActive())
          continue;
        const isBody1Stationary = body1.isSleeping || body1.inverseMass === 0;
        for (let j = i + 1; j < this.bodiesLength; j++) {
          const body2 = this.bodies[j];
          if (!body2.isActive() || (isBody1Stationary && (body2.isSleeping || body2.inverseMass === 0)))
            continue;
          this.addCandidatePair(body1, body2);
        }
      }
    }
  }

  public test(): void {
    this.collectCandidatePairs();
    const hasCallback = this.onCollision !== null || this.collisionListeners.length > 0;
    const callback = hasCallback
      ? (a: Physics, b: Physics, normal: Vec2, impulse: Vec2) => this.dispatchCollision(a, b, normal, impulse)
      : undefined;
    for (let k = 0; k < this.iterations; k++) {
      for (let p = 0; p < this.candidatePairsCount; p++) {
        CollisionDetection.test(this.candidatePairs[p * 2], this.candidatePairs[p * 2 + 1], callback, k);
      }
    }
    this.clearCandidatePairs();
  }

  private collectSceneCandidatePairs(scene: Scene): void {
    this.candidatePairsCount = 0;
    const sceneBodiesLen = scene.bodiesLength;
    if (this.grid) {
      this.populateBuckets();
      const usePairMode = this.activeDeduplicationMode === 'pair';
      if (usePairMode)
        this.testedPairs.clear();

      for (let s = 0; s < sceneBodiesLen; s++) {
        const body2 = scene.bodies[s];
        if (!body2.isActive()) continue;
        const isBody2Stationary = body2.isSleeping || body2.inverseMass === 0;
        const cells2 = body2.body.gridCells;
        if (cells2[0] === -1) continue;
        for (let c = 0; c < cells2.length; c++) {
          const cellId = cells2[c];
          if (cellId < 0 || cellId >= this.cellBuckets.length) continue;
          const bucket = this.cellBuckets[cellId];
          for (let p = 0; p < bucket.length; p++) {
            const body1 = bucket[p];
            if (body1 === body2) continue;
            if (isBody2Stationary && (body1.isSleeping || body1.inverseMass === 0)) continue;
            if (usePairMode) {
              const id1 = body1.collisionSceneId;
              const id2 = body2.collisionSceneId;
              const maxId = id1 > id2 ? id1 : id2;
              const minId = id1 > id2 ? id2 : id1;
              const pairKey = maxId * maxId + minId;
              if (this.testedPairs.has(pairKey))
                continue;
              this.testedPairs.add(pairKey);
            } else {
              if (!this.isFirstCommonCell(body1.body.gridCells, cells2, cellId)) continue;
            }
            this.addCandidatePair(body1, body2);
          }
        }
      }
      if (usePairMode)
        this.testedPairs.clear();
    } else {
      for (let i = 0; i < this.bodiesLength; i++) {
        const body1 = this.bodies[i];
        if (!body1.isActive())
          continue;
        const isBody1Stationary = body1.isSleeping || body1.inverseMass === 0;
        for (let j = 0; j < sceneBodiesLen; j++) {
          const body2 = scene.bodies[j];
          if (!body2.isActive() || body1 === body2 || (isBody1Stationary && (body2.isSleeping || body2.inverseMass === 0)))
            continue;
          this.addCandidatePair(body1, body2);
        }
      }
    }
  }

  public testScene(scene: Scene): void {
    this.collectSceneCandidatePairs(scene);
    const hasThisCallback = this.onCollision !== null || this.collisionListeners.length > 0;
    const hasSceneCallback = scene.onCollision !== null || scene.collisionListeners.length > 0;
    const callback = (hasThisCallback || hasSceneCallback)
      ? (a: Physics, b: Physics, normal: Vec2, impulse: Vec2) => {
          if (hasThisCallback)
            this.dispatchCollision(a, b, normal, impulse);
          if (hasSceneCallback)
            scene.dispatchCollision(a, b, normal, impulse);
        }
      : undefined;
    for (let k = 0; k < this.iterations; k++) {
      for (let p = 0; p < this.candidatePairsCount; p++) {
        CollisionDetection.test(this.candidatePairs[p * 2], this.candidatePairs[p * 2 + 1], callback, k);
      }
    }
    this.clearCandidatePairs();
  }

  public setOnCollision(callback: SceneCollisionCallback | null): void {
    this.onCollision = callback;
  }

  public getOnCollision(): SceneCollisionCallback | null {
    return this.onCollision;
  }

  public addCollisionListener(listener: SceneCollisionCallback): void {
    if (this.collisionListeners.indexOf(listener) === -1) {
      this.collisionListeners.push(listener);
    }
  }

  public removeCollisionListener(listener: SceneCollisionCallback): boolean {
    const idx = this.collisionListeners.indexOf(listener);
    if (idx !== -1) {
      this.collisionListeners.splice(idx, 1);
      return true;
    }
    return false;
  }

  public clearCollisionListeners(): void {
    this.collisionListeners = [];
  }

  public dispatchCollision(a: Physics, b: Physics, normal: Vec2, impulse: Vec2): void {
    if (this.onCollision) {
      this.onCollision(a, b, normal, impulse);
    }
    for (let i = 0; i < this.collisionListeners.length; i++) {
      this.collisionListeners[i](a, b, normal, impulse);
    }
  }

  public setIteration(iterations: number): void {
    this.iterations = iterations;
  }

  public setDeduplicationMode(mode: DeduplicationMode): void {
    this.deduplicationMode = mode;
  }

  public getDeduplicationMode(): DeduplicationMode {
    return this.deduplicationMode;
  }

  public getActiveDeduplicationMode(): 'cell' | 'pair' {
    return this.activeDeduplicationMode;
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

