# Installation

BumpR.js requires Node.js 22 or newer and is published as an ES module (`bumpr.js`) with complete TypeScript declarations (`bumpr.d.ts`).

## Package Managers

### npm

```bash
npm install @1pizzateam/bumpr
```

### Yarn

```bash
yarn add @1pizzateam/bumpr
```

### pnpm

```bash
pnpm add @1pizzateam/bumpr
```

## Bundler / ESM Usage

Import the classes and helpers directly:

```javascript
import { Scene, Physics, CollisionDetection } from '@1pizzateam/bumpr';
import { Grid, Vec2 } from '@1pizzateam/spock';

const scene = new Scene();
scene.setGravity(new Vec2(0, 500));

const body = new Physics(
  new Vec2(50, 50),
  new Vec2(),
  new Vec2(40, 40),
  1.0,
  1.0,
  0.5,
  'circle'
);
scene.addBody(body);
```

## Direct Browser Script

BumpR.js is packaged as a standard ES module and can be loaded directly inside browser scripts with `type="module"`:

```html
<canvas id="stage" width="800" height="600"></canvas>

<script type="module">
  import { Scene, Physics } from './node_modules/@1pizzateam/bumpr/dist/bumpr.js';
  import { Vec2 } from './node_modules/@1pizzateam/spock/dist/spock.js';

  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  const scene = new Scene();
  scene.setGravity(new Vec2(0, 350));

  const ball = new Physics(
    new Vec2(400, 100),
    new Vec2(100, 0),
    new Vec2(36, 36),
    1.0,
    1.0,
    0.85,
    'circle'
  );
  scene.addBody(ball);

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    scene.update(dt);
    scene.test();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.draw(ctx, '#ffffff', '#ff6b6b', 2);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
</script>
```

## TypeScript Configuration

BumpR.js includes first-party type definitions. Ensure your `tsconfig.json` has `moduleResolution` set to modern Node or Bundler standards:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```
