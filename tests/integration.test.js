import { Scene, Physics } from '../build/es6/bumpr.js';
import { Grid, Vec2 } from '@1pizzateam/spock';

describe('Cross-Library Integration: Spock + BumpR', () => {
  test('Scene fixed-timestep accumulator drives Physics simulation using Spock Grid and Vec2', () => {
    const grid = new Grid(new Vec2(800, 600), 50);
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
    for (let i = 0; i < 10; i++)
      frameCount += scene.step(1 / 60);

    expect(frameCount).toBe(10);
    expect(ball.position.x).toBe(100);
    // Ball should have fallen due to gravity and moved down from y=50
    expect(ball.position.y).toBeGreaterThan(50);
    // Verify no NaNs occurred anywhere
    expect(Number.isNaN(ball.position.x)).toBe(false);
    expect(Number.isNaN(ball.position.y)).toBe(false);
    expect(Number.isNaN(ball.velocity.y)).toBe(false);
  });

  test('Elastic collision resolution within Scene step loop', () => {
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
    for (let i = 0; i < 30; i++) {
      scene.update(0.02);
      scene.test();
      if (ballA.impulse.x < 0 || ballA.velocity.x < 0)
        collided = true;
    }

    expect(collided).toBe(true);
    // After elastic collision, ballA should be bounced backward (negative X velocity)
    expect(ballA.velocity.x).toBeLessThan(0);
    expect(ballB.velocity.x).toBeGreaterThan(0);
  });
});
