
import { Grid, Vec2 } from '@1pizzateam/spock';
import { CollisionDetection } from './collision';
import { Physics } from './physics';

export class Scene {

  bodies : Physics[];
  bodiesLength : number;
  gravity : Vec2;
  iterations : number;
  grid : Grid | null;
  private nextBodyId : number = 1;

  constructor(grid: Grid | null = null) {
    this.bodies = [];
    this.bodiesLength = 0;
    this.iterations = 1;
    this.gravity = new Vec2( 0, 400 );
    this.grid = grid;
  }

  public addBody(body: Physics): boolean {
    if(!body.collisionSceneId) {
      body.collisionSceneId = this.nextBodyId++;
      if (body.gravity.isOrigin()) {
        body.setGravity(this.gravity.x, this.gravity.y);
      }
      if (this.grid) {
        body.setGrid(this.grid);
      }
      this.bodies.push(body);
      this.bodiesLength = this.bodies.length;
      return true;
    }
    return false;
  }

  public removeBody(body: Physics): boolean {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
      this.bodiesLength = this.bodies.length;
      body.collisionSceneId = 0;
      body.setGrid(null);
      return true;
    }
    return false;
  }

  public clear(): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      this.bodies[i].collisionSceneId = 0;
      this.bodies[i].setGrid(null);
    }
    this.bodies = [];
    this.bodiesLength = 0;
  }

  public setGrid(grid: Grid | null): void {
    this.grid = grid;
    for (let i = 0; i < this.bodiesLength; i++) {
      this.bodies[i].setGrid(grid);
    }
  }

  public getGrid(): Grid | null {
    return this.grid;
  }

  public setGravity(x: number, y: number): void {
    this.gravity.setScalar(x, y);
    for (let i = 0; i < this.bodiesLength; i++) {
      this.bodies[i].setGravity(x, y);
    }
  }

  public update(second: number): void {
    for (let i = 0; i < this.bodiesLength; i++) {
      let body = this.bodies[i];
      if (body.isActive()) {
        body.updatePosition(second);
      }
    }
  }

  public test(): void {
    for(let k = 0 ; k < this.iterations ; k++) {
      for(let i = 0 ; i < this.bodiesLength ; i++) {
        let body1 = this.bodies[i];
        if (body1.isActive()) {
          for(let j = i + 1 ; j < this.bodiesLength ; j++) {
            let body2 = this.bodies[j];
            if (body2.isActive()) {
              if (body1.inverseMass === 0 && body2.inverseMass === 0) {
                continue;
              }
              if (this.grid && !this.grid.testCells(body1.body.gridCells, body2.body.gridCells)) {
                continue;
              }
              CollisionDetection.test(body1, body2);
            }
          }
        }
      }
    }
  }

  public testScene(scene: Scene): void {
    for(let k = 0 ; k < this.iterations ; k++) {
      for(let body1 of this.bodies) {
        if (body1.isActive()) {
          for(let body2 of scene.bodies) {
            if (body2.isActive()) {
              if (body1 === body2) {
                continue;
              }
              if (body1.inverseMass === 0 && body2.inverseMass === 0) {
                continue;
              }
              if (this.grid && !this.grid.testCells(body1.body.gridCells, body2.body.gridCells)) {
                continue;
              }
              CollisionDetection.test(body1, body2);
            }
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
      let body = this.bodies[i];
      if (body.isActive()) {
        body.draw(context, fillColor, strokeColor, strokeWidth);
      }
    }
  }

  public drawGrid(context: CanvasRenderingContext2D, fillColor: string, strokeColor: string, strokeWidth: number): void {
    if (this.grid) {
      this.grid.draw(context, fillColor, strokeColor, strokeWidth);
    }
  }

}

