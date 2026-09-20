import { Player } from '../../LoopR.js/build/es6/player.js';
import { Scene, Physics } from '../build/es6/bumpr.js';
import { Grid, Vec2 } from '@1pizzateam/spock';

describe('Cross-Library Integration: Spock + BumpR + LoopR', () => {
  test('LoopR Player drives BumpR Scene physics simulation using Spock Grid and Vec2', () => {
    const grid = new Grid(800, 600, 50);
    const scene = new Scene(grid);
    scene.setGravity(new Vec2(0, 200));

    // Dynamic ball falling toward a static floor
    const ball = new Physics(
      new Vec2(100, 50),
      new Vec2(0, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      0.5,
      'circle'
    );
    // Static platform
    const floor = new Physics(
      new Vec2(100, 200),
      new Vec2(0, 0),
      new Vec2(200, 20),
      0,
      1.0,
      0.5,
      'aabb'
    );

    scene.addBody(ball);
    scene.addBody(floor);

    let frameCount = 0;
    const player = new Player((delta) => {
      frameCount++;
      scene.update(delta);
      scene.test();
      if (frameCount >= 10) return false; // Stop after 10 simulation frames
    });

    // Simulate 10 frames with 16ms delta (0.016s)
    let fakeNow = performance.now();
    player.start();
    for (let i = 0; i < 15; i++) {
      fakeNow += 16;
      player['computeNewFrame'](fakeNow);
    }

    expect(frameCount).toBe(10);
    expect(player.isActive()).toBe(false);
    expect(ball.position.x).toBe(100);
    // Ball should have fallen due to gravity and moved down from y=50
    expect(ball.position.y).toBeGreaterThan(50);
    // Verify no NaNs occurred anywhere
    expect(Number.isNaN(ball.position.x)).toBe(false);
    expect(Number.isNaN(ball.position.y)).toBe(false);
    expect(Number.isNaN(ball.velocity.y)).toBe(false);
  });

  test('Elastic collision resolution within LoopR animation frame step', () => {
    const scene = new Scene();
    scene.setGravity(new Vec2(0, 0));

    // Two balls on collision course
    const ballA = new Physics(
      new Vec2(50, 100),
      new Vec2(100, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );
    const ballB = new Physics(
      new Vec2(150, 100),
      new Vec2(-100, 0),
      new Vec2(20, 20),
      1.0,
      1.0,
      1.0,
      'circle'
    );

    scene.addBody(ballA);
    scene.addBody(ballB);

    let collided = false;
    const player = new Player((delta) => {
      scene.update(delta);
      scene.test();
      if (ballA.impulse.x < 0 || ballA.velocity.x < 0)
        collided = true;
    });

    // Step through 0.6 seconds (balls start 100px apart moving at 100px/s each, colliding around t=0.4s)
    let fakeNow = performance.now();
    player.start();
    for (let i = 0; i < 30; i++) {
      fakeNow += 20; // 20ms steps
      player['computeNewFrame'](fakeNow);
    }

    expect(collided).toBe(true);
    // After elastic collision, ballA should be bounced backward (negative X velocity)
    expect(ballA.velocity.x).toBeLessThan(0);
    expect(ballB.velocity.x).toBeGreaterThan(0);
  });
});
