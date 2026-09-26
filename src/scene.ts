import type { Grid } from '@1pizzateam/spock';
import { Vec2, Accumulator } from '@1pizzateam/spock';
import { CollisionDetection } from './collision';
import type { Physics } from './physics';
import { Raycast, type RaycastHit, type RaycastOptions } from './raycast';
import type { DistanceConstraint } from './constraint';

export type DeduplicationMode = 'auto' | 'cell' | 'pair';
export type SceneCollisionCallback = (bodyA: Physics, bodyB: Physics, normal: Vec2, impulse: Vec2) => void;
export type SpatialQueryOptions = { mask?: number; ignoreSensors?: boolean };

export class Scene {

  bodies : Physics[];
  bodiesLength : number;
  gravity : Vec2;
  iterations : number;
  grid : Grid | null;
  private nextBodyId : number = 1;
  private constraints : DistanceConstraint[] = [];

  public onCollision: SceneCollisionCallback | null = null;
  private collisionListeners: SceneCollisionCallback[] = [];
  private boundDispatchCollision = (a: Physics, b: Physics, normal: Vec2, impulse: Vec2): void => {
    this.dispatchCollision(a, b, normal, impulse);
  };
  private testSceneTarget: Scene | null = null;
  private boundDispatchTestScene = (a: Physics, b: Physics, normal: Vec2, impulse: Vec2): void => {
    if (this.onCollision !== null || this.collisionListeners.length > 0)
      this.dispatchCollision(a, b, normal, impulse);
    if (this.testSceneTarget && (this.testSceneTarget.onCollision !== null || this.testSceneTarget.collisionListeners.length > 0))
      this.testSceneTarget.dispatchCollision(a, b, normal, impulse);
  };

  private deduplicationMode : DeduplicationMode = 'auto';
  private activeDeduplicationMode : 'cell' | 'pair' = 'cell';
  private testedPairs : Set<number> = new Set();

  private cellBuckets : Physics[][] = [];
  private activeBuckets : number[] = [];
  private candidatePairs : Physics[] = [];
  private candidatePairsCount : number = 0;
  private ccdSubSteps : number = 3;
  private ccdStartPos : Vec2 = new Vec2();
  private ccdTargetPos : Vec2 = new Vec2();

  private accumulator : Accumulator = new Accumulator(1 / 60, 5);

  constructor(grid: Grid | null = null) {
    this.bodies = [];
    this.bodiesLength = 0;
    this.iterations = 1;
    this.gravity = new Vec2( 0, 400 );
    this.grid = grid;
    this.constraints = [];
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
          for (let b = 0; b < bucket.length; b++)
            bucket[b].wakeUp();
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
    if (this.constraints.length > 0) {
      for (let i = this.constraints.length - 1; i >= 0; i--) {
        const c = this.constraints[i];
        if (c.bodyA === body || c.bodyB === body)
          this.removeConstraint(c);
      }
    }
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
    this.clearConstraints();
    this.clearBuckets();
    this.clearCandidatePairs();
    this.candidatePairs = [];
    this.testedPairs.clear();
    this.resetAccumulator();
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
        if (!body.force.isOrigin() || !body.impulse.isOrigin())
          body.wakeUp();
        else
          continue;
      }
      if (body.inverseMass === 0 && body.velocity.isOrigin())
        continue;
      if (body.isBullet && body.isDynamic())
        this.updateCcdBody(body, second);
      else
        body.updatePosition(second);
    }
  }

  public setFixedDeltaTime(dt: number): void {
    this.accumulator.fixedStep = Math.max(1e-4, dt);
  }

  public getFixedDeltaTime(): number {
    return this.accumulator.fixedStep;
  }

  public setMaxSubSteps(maxSubSteps: number): void {
    this.accumulator.maxSubSteps = Math.max(1, Math.floor(maxSubSteps));
  }

  public getMaxSubSteps(): number {
    return this.accumulator.maxSubSteps;
  }

  public getAccumulator(): number {
    return this.accumulator.value;
  }

  public resetAccumulator(): void {
    this.accumulator.reset();
  }

  public getAlpha(): number {
    return this.accumulator.alpha;
  }

  /**
   * Advance physics simulation using a deterministic fixed-timestep accumulator.
   * Consumes delta time in discrete chunks of fixedDeltaTime, calling update() and test().
   * Clamps accumulated time to (fixedDeltaTime * maxSubSteps) to prevent spiral-of-death.
   * @param deltaTime - Elapsed frame delta time in seconds (e.g. from requestAnimationFrame).
   * @returns Number of fixed simulation substeps executed.
   */
  public step(deltaTime: number): number {
    return this.accumulator.step(deltaTime, (fixedStep) => {
      this.update(fixedStep);
      this.test();
    });
  }

  private clearBuckets(): void {
    for (let i = 0; i < this.activeBuckets.length; i++)
      this.cellBuckets[this.activeBuckets[i]].length = 0;
    this.activeBuckets.length = 0;
  }

  private populateBuckets(): void {
    if (!this.grid)
      return;
    const totalCells = this.grid.totalCells;
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
    return true;
  }

  private shouldTestPair(body1: Physics, body2: Physics, isBodyStationary: boolean): boolean {
    if (!body1.isDynamic() && !body2.isDynamic() && !body1.isSensor && !body2.isSensor)
      return false;
    if (isBodyStationary && body2.isStationary())
      return false;
    return body1.canCollideWith(body2);
  }

  private hasTestedPair(id1: number, id2: number): boolean {
    const maxId = id1 > id2 ? id1 : id2;
    const minId = id1 > id2 ? id2 : id1;
    const pairKey = maxId * maxId + minId;
    if (this.testedPairs.has(pairKey))
      return true;
    this.testedPairs.add(pairKey);
    return false;
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
        if (bucketLen <= 1)
          continue;
        for (let i = 0; i < bucketLen; i++) {
          const body1 = bucket[i];
          const isBody1Stationary = body1.isStationary();
          for (let j = i + 1; j < bucketLen; j++) {
            const body2 = bucket[j];
            if (!this.shouldTestPair(body1, body2, isBody1Stationary))
              continue;
            if (usePairMode ? this.hasTestedPair(body1.collisionSceneId, body2.collisionSceneId) : !this.isFirstCommonCell(body1.body.gridCells, body2.body.gridCells, b))
              continue;
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
        const isBody1Stationary = body1.isStationary();
        for (let j = i + 1; j < this.bodiesLength; j++) {
          const body2 = this.bodies[j];
          if (!body2.isActive())
            continue;
          if (!this.shouldTestPair(body1, body2, isBody1Stationary))
            continue;
          this.addCandidatePair(body1, body2);
        }
      }
    }
  }

  public test(): void {
    this.collectCandidatePairs();
    const hasCallback = this.onCollision !== null || this.collisionListeners.length > 0;
    const callback = hasCallback ? this.boundDispatchCollision : undefined;
    for (let k = 0; k < this.iterations; k++) {
      this.solveConstraints();
      for (let p = 0; p < this.candidatePairsCount; p++)
        CollisionDetection.test(this.candidatePairs[p * 2], this.candidatePairs[p * 2 + 1], callback, k);
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
        if (!body2.isActive())
          continue;
        const isBody2Stationary = body2.isStationary();
        const cells2 = body2.body.gridCells;
        if (cells2[0] === -1)
          continue;
        for (let c = 0; c < cells2.length; c++) {
          const cellId = cells2[c];
          if (cellId < 0 || cellId >= this.cellBuckets.length)
            continue;
          const bucket = this.cellBuckets[cellId];
          for (let p = 0; p < bucket.length; p++) {
            const body1 = bucket[p];
            if (body1 === body2)
              continue;
            if (!this.shouldTestPair(body1, body2, isBody2Stationary))
              continue;
            if (usePairMode ? this.hasTestedPair(body1.collisionSceneId, body2.collisionSceneId) : !this.isFirstCommonCell(body1.body.gridCells, cells2, cellId))
              continue;
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
        const isBody1Stationary = body1.isStationary();
        for (let j = 0; j < sceneBodiesLen; j++) {
          const body2 = scene.bodies[j];
          if (!body2.isActive() || body1 === body2)
            continue;
          if (!this.shouldTestPair(body1, body2, isBody1Stationary))
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
    let callback: SceneCollisionCallback | undefined;
    if (hasThisCallback || hasSceneCallback) {
      this.testSceneTarget = scene;
      callback = this.boundDispatchTestScene;
    }
    for (let k = 0; k < this.iterations; k++) {
      for (let p = 0; p < this.candidatePairsCount; p++)
        CollisionDetection.test(this.candidatePairs[p * 2], this.candidatePairs[p * 2 + 1], callback, k);
    }
    this.testSceneTarget = null;
    this.clearCandidatePairs();
  }

  public setOnCollision(callback: SceneCollisionCallback | null): void {
    this.onCollision = callback;
  }

  public getOnCollision(): SceneCollisionCallback | null {
    return this.onCollision;
  }

  public addCollisionListener(listener: SceneCollisionCallback): void {
    if (this.collisionListeners.indexOf(listener) === -1)
      this.collisionListeners.push(listener);
  }

  public removeCollisionListener(listener: SceneCollisionCallback): boolean {
    const idx = this.collisionListeners.indexOf(listener);
    if (idx === -1)
      return false;
    this.collisionListeners.splice(idx, 1);
    return true;
  }

  public clearCollisionListeners(): void {
    this.collisionListeners = [];
  }

  public dispatchCollision(a: Physics, b: Physics, normal: Vec2, impulse: Vec2): void {
    if (this.onCollision)
      this.onCollision(a, b, normal, impulse);
    for (let i = 0; i < this.collisionListeners.length; i++)
      this.collisionListeners[i](a, b, normal, impulse);
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

  public addConstraint(constraint: DistanceConstraint): boolean {
    if (this.constraints.indexOf(constraint) !== -1)
      return false;
    this.constraints.push(constraint);
    if (!constraint.collideConnected) {
      constraint.bodyA.ignoreCollisionWith(constraint.bodyB);
      constraint.bodyB.ignoreCollisionWith(constraint.bodyA);
    }
    return true;
  }

  public removeConstraint(constraint: DistanceConstraint): boolean {
    const index = this.constraints.indexOf(constraint);
    if (index === -1)
      return false;
    const last = this.constraints.pop()!;
    if (index < this.constraints.length)
      this.constraints[index] = last;
    if (!constraint.collideConnected) {
      constraint.bodyA.restoreCollisionWith(constraint.bodyB);
      constraint.bodyB.restoreCollisionWith(constraint.bodyA);
    }
    return true;
  }

  public getConstraints(): DistanceConstraint[] {
    return this.constraints;
  }

  public getConstraintsCount(): number {
    return this.constraints.length;
  }

  public clearConstraints(): void {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (!c.collideConnected) {
        c.bodyA.restoreCollisionWith(c.bodyB);
        c.bodyB.restoreCollisionWith(c.bodyA);
      }
    }
    this.constraints = [];
  }

  public solveConstraints(): void {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (c.active)
        c.solve();
    }
  }

  public drawConstraints(
    context: CanvasRenderingContext2D,
    strokeColor: string = '#888888',
    strokeWidth: number = 2
  ): void {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (c.active)
        c.draw(context, strokeColor, strokeWidth);
    }
  }

  private parseSpatialQueryOptions(optionsOrMask?: number | SpatialQueryOptions | RaycastOptions): { mask: number; ignoreSensors: boolean } {
    let mask = 0xFFFF;
    let ignoreSensors = false;
    if (typeof optionsOrMask === 'number')
      mask = optionsOrMask;
    else if (optionsOrMask) {
      if (optionsOrMask.mask !== undefined)
        mask = optionsOrMask.mask;
      if (optionsOrMask.ignoreSensors !== undefined)
        ignoreSensors = optionsOrMask.ignoreSensors;
    }
    return { mask, ignoreSensors };
  }

  private passesSpatialFilter(body: Physics, mask: number, ignoreSensors: boolean): boolean {
    return body.isActive() && (!ignoreSensors || !body.isSensor) && (body.collisionCategory & mask) !== 0;
  }

  public raycast(
    start: Vec2,
    end: Vec2,
    optionsOrMask?: number | RaycastOptions
  ): RaycastHit | null {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);

    let closestHit: RaycastHit | null = null;
    let minFraction = 1.0;

    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;

      const hit = body.raycast(start, end);
      if (hit && hit.fraction <= minFraction) {
        minFraction = hit.fraction;
        closestHit = hit;
      }
    }

    return closestHit;
  }

  public raycastAll(
    start: Vec2,
    end: Vec2,
    optionsOrMask?: number | RaycastOptions
  ): RaycastHit[] {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    const hits: RaycastHit[] = [];

    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;

      const hit = body.raycast(start, end);
      if (hit)
        hits.push(hit);
    }

    hits.sort((a, b) => a.fraction - b.fraction);
    return hits;
  }

  public setCcdSubSteps(subSteps: number): void {
    this.ccdSubSteps = Math.max(1, subSteps);
  }

  public getCcdSubSteps(): number {
    return this.ccdSubSteps;
  }

  public sweepBody(
    start: Vec2,
    end: Vec2,
    movingBody: Physics,
    optionsOrMask?: number | RaycastOptions
  ): RaycastHit | null {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);

    let closestHit: RaycastHit | null = null;
    let minFraction = 1.0;

    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (body === movingBody || !this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (!movingBody.canCollideWith(body))
        continue;

      const hit = Raycast.sweepBody(start, end, movingBody, body);
      if (hit && hit.fraction <= minFraction) {
        minFraction = hit.fraction;
        closestHit = hit;
      }
    }

    return closestHit;
  }

  public sweepBodyAll(
    start: Vec2,
    end: Vec2,
    movingBody: Physics,
    optionsOrMask?: number | RaycastOptions
  ): RaycastHit[] {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    const hits: RaycastHit[] = [];

    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (body === movingBody || !this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (!movingBody.canCollideWith(body))
        continue;

      const hit = Raycast.sweepBody(start, end, movingBody, body);
      if (hit)
        hits.push(hit);
    }

    hits.sort((a, b) => a.fraction - b.fraction);
    return hits;
  }

  /**
   * Find all active bodies in the scene containing a point.
   * @param point - Query point in world coordinates.
   * @param optionsOrMask - Optional category bitmask or query options.
   * @returns Array of matching bodies.
   */
  public queryPoint(point: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics[] {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    const results: Physics[] = [];
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (body.containsPoint(point))
        results.push(body);
    }
    return results;
  }

  /**
   * Find the first active body in the scene containing a point.
   * @param point - Query point in world coordinates.
   * @param optionsOrMask - Optional category bitmask or query options.
   * @returns The first matching body, or null if none found.
   */
  public queryPointFirst(point: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics | null {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (body.containsPoint(point))
        return body;
    }
    return null;
  }

  /**
   * Find all active bodies in the scene overlapping a circle.
   * @param center - Circle center in world coordinates.
   * @param radius - Circle radius.
   * @param optionsOrMask - Optional category bitmask or query options.
   * @returns Array of matching bodies.
   */
  public queryCircle(center: Vec2, radius: number, optionsOrMask?: number | SpatialQueryOptions): Physics[] {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    const results: Physics[] = [];
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (body.overlapsCircle(center, radius))
        results.push(body);
    }
    return results;
  }

  /**
   * Find the first active body in the scene overlapping a circle.
   * @param center - Circle center in world coordinates.
   * @param radius - Circle radius.
   * @param optionsOrMask - Optional category bitmask or query options.
   * @returns The first matching body, or null if none found.
   */
  public queryCircleFirst(center: Vec2, radius: number, optionsOrMask?: number | SpatialQueryOptions): Physics | null {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (body.overlapsCircle(center, radius))
        return body;
    }
    return null;
  }

  /**
   * Find all active bodies in the scene overlapping an Axis-Aligned Bounding Box (AABB).
   * @param min - Minimum corner (or first corner).
   * @param max - Maximum corner (or second corner).
   * @param optionsOrMask - Optional category bitmask or query options.
   * @returns Array of matching bodies.
   */
  public queryAabb(min: Vec2, max: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics[] {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    const results: Physics[] = [];
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (body.overlapsAabb(min, max))
        results.push(body);
    }
    return results;
  }

  /**
   * Find the first active body in the scene overlapping an Axis-Aligned Bounding Box (AABB).
   * @param min - Minimum corner (or first corner).
   * @param max - Maximum corner (or second corner).
   * @param optionsOrMask - Optional category bitmask or query options.
   * @returns The first matching body, or null if none found.
   */
  public queryAabbFirst(min: Vec2, max: Vec2, optionsOrMask?: number | SpatialQueryOptions): Physics | null {
    const { mask, ignoreSensors } = this.parseSpatialQueryOptions(optionsOrMask);
    for (let i = 0; i < this.bodiesLength; i++) {
      const body = this.bodies[i];
      if (!this.passesSpatialFilter(body, mask, ignoreSensors))
        continue;
      if (body.overlapsAabb(min, max))
        return body;
    }
    return null;
  }

  private updateCcdBody(body: Physics, second: number): void {
    if (!body.prepareStep(second))
      return;

    let remainingTime = second;
    const hasCallback = this.onCollision !== null || this.collisionListeners.length > 0;
    const callback = hasCallback ? this.boundDispatchCollision : undefined;

    for (let step = 0; step < this.ccdSubSteps; step++) {
      if (remainingTime <= 1e-6 || body.velocity.isOrigin())
        break;

      this.ccdStartPos.copy(body.position);
      this.ccdTargetPos.copy(this.ccdStartPos).addScaledVector(body.velocity, remainingTime);
      if (this.ccdStartPos.equals(this.ccdTargetPos))
        break;

      const hits = this.sweepBodyAll(this.ccdStartPos, this.ccdTargetPos, body);

      let solidHit: RaycastHit | null = null;

      for (let h = 0; h < hits.length; h++) {
        const hit = hits[h];
        if (hit.body.isSensor || body.isSensor) {
          hit.body.wakeUp();
          body.collision(CollisionDetection.zeroImpulse, hit.body, hit.normal);
          hit.normal.opposite();
          hit.body.collision(CollisionDetection.zeroImpulse, body, hit.normal);
          hit.normal.opposite();
          this.dispatchCollision(body, hit.body, hit.normal, CollisionDetection.zeroImpulse);
        } else {
          solidHit = hit;
          break;
        }
      }

      if (!solidHit) {
        body.translate.scaleVector(body.velocity, remainingTime);
        body.body.translate(body.translate);
        break;
      }

      const t = solidHit.fraction;
      if (t > 0) {
        const advanceFrac = Math.max(0, t - 1e-4);
        body.translate.scaleVector(body.velocity, remainingTime * advanceFrac);
        body.body.translate(body.translate);
      }

      body.wakeUp();
      solidHit.body.wakeUp();

      CollisionDetection.applyContactImpulse(
        body,
        solidHit.body,
        solidHit.normal,
        callback
      );

      body.applyImpulse();
      solidHit.body.applyImpulse();

      remainingTime *= (1 - t);
      if (t === 0)
        break;
    }
  }

}

