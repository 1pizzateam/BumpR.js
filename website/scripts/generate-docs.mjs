import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const docsRoot = path.resolve(root, 'website/docs/api');

const modules = [
  ['Scene', 'scene.ts', 'scene.md'],
  ['Physics', 'physics.ts', 'physics.md'],
  ['CollisionDetection', 'collision.ts', 'collision.md'],
  ['CircleVSCircle', 'collisions/circlevscircle.ts', 'circlevscircle.md'],
  ['CircleVSAabb', 'collisions/circlevsaabb.ts', 'circlevsaabb.md'],
  ['AabbVSAabb', 'collisions/aabbvsaabb.ts', 'aabbvsaabb.md'],
];

const intros = {
  Scene: {
    summary: 'The main spatial world manager and collision resolution orchestrator.',
    body: [
      '`Scene` holds rigid bodies, manages world gravity, coordinates spatial hash grid broad-phase bucketing, advances positions across physics timesteps, and resolves pairwise collisions using configurable constraint solver iterations.',
    ],
    example: `import { Scene, Physics, Grid, Vec2 } from '@1pizzateam/bumpr';

const scene = new Scene();
scene.setGravity(new Vec2(0, 300));

const ball = new Physics(
  new Vec2(100, 50),
  new Vec2(50, 0),
  new Vec2(40, 40),
  1.0,
  1.0,
  0.5,
  'circle'
);
scene.addBody(ball);

// Optional: attach spatial hashing grid
scene.setGrid(new Grid(800, 600, 50));

// In your render/game loop:
function tick(dt) {
  scene.update(dt);
  scene.test();
}`,
    members: {
      constructor: {
        description: 'Create a new physics `Scene` instance.',
        returns: 'A new `Scene` instance.',
        example: `import { Scene } from '@1pizzateam/bumpr';\n\nconst scene = new Scene();`,
      },
      addBody: {
        description: 'Add a `Physics` rigid body into the simulation scene.',
        params: ['- `body` — `Physics`. The rigid body instance to add.'],
        returns: '`boolean` — `true` if successfully added, `false` if already in a scene.',
        example: `const ball = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(30, 30), 1.0, 1.0, 0.5, 'circle');\nscene.addBody(ball);`,
      },
      removeBody: {
        description: 'Remove a `Physics` body from the scene in O(1) time using swap-with-last.',
        params: ['- `body` — `Physics`. The rigid body instance to remove.'],
        returns: '`boolean` — `true` if removed, `false` if not found in this scene.',
        example: `scene.removeBody(ball);`,
      },
      clear: {
        description: 'Remove all bodies from the scene, reset scene IDs, and empty active spatial grid buckets.',
        returns: '`void`',
        example: `scene.clear();`,
      },
      setGrid: {
        description: 'Attach a Spock spatial hashing `Grid` for broad-phase collision culling.',
        params: ['- `grid` — `Grid | null`. Spatial grid or `null` to disable grid broad-phase.'],
        returns: '`void`',
        example: `import { Grid, Vec2 } from '@1pizzateam/bumpr';\n\nscene.setGrid(new Grid(new Vec2(0, 0), new Vec2(1000, 1000), new Vec2(10, 10)));`,
      },
      getGrid: {
        description: 'Get the currently attached Spock `Grid`, or `null` if broad-phase grid is not set.',
        returns: '`Grid | null`',
        example: `const grid = scene.getGrid();`,
      },
      setGravity: {
        description: 'Set global scene gravity vector and propagate to all current member bodies.',
        params: ['- `gravity` — `Vec2`. Gravity acceleration vector.'],
        returns: '`void`',
        example: `scene.setGravity(new Vec2(0, 980)); // Earth gravity in px/s²`,
      },
      update: {
        description: 'Advance position and apply forces/damping on all active dynamic bodies in the scene.',
        params: ['- `second` — `number`. Delta time elapsed in seconds.'],
        returns: '`void`',
        example: `scene.update(1 / 60);`,
      },
      test: {
        description: 'Detect and resolve collisions between all bodies in the scene across solver iterations.',
        returns: '`void`',
        example: `scene.test();`,
      },
      testScene: {
        description: 'Detect and resolve collisions between bodies in this scene against bodies in an external scene.',
        params: ['- `scene` — `Scene`. The second physics scene to test against.'],
        returns: '`void`',
        example: `sceneA.testScene(sceneB);`,
      },
      setIteration: {
        description: 'Set number of constraint solver iterations per step (default `1`). Higher iterations increase stacking stability.',
        params: ['- `iteration` — `number`. Number of collision solver iterations.'],
        returns: '`void`',
        example: `scene.setIteration(4);`,
      },
      draw: {
        description: 'Render all active bodies in the scene to a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target 2D canvas rendering context.',
          '- `fillColor` — `string`. Body interior fill style.',
          '- `strokeColor` — `string`. Body contour stroke style.',
          '- `strokeWidth` — `number`. Contour stroke thickness.',
        ],
        returns: '`void`',
        example: `scene.draw(ctx, '#f8f9fa', '#ff6b6b', 2);`,
      },
      drawGrid: {
        description: 'Render the attached spatial broad-phase grid lines on a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target 2D canvas rendering context.',
          '- `strokeColor` — `string`. Grid line stroke style.',
          '- `strokeWidth` — `number`. Grid line stroke thickness.',
        ],
        returns: '`void`',
        example: `scene.drawGrid(ctx, 'rgba(255,255,255,0.1)', 1);`,
      },
    },
  },
  Physics: {
    summary: 'A 2D rigid body with mass, velocity, acceleration, restitution, damping, and geometry.',
    body: [
      '`Physics` pairs physical dynamics (Newtonian integration, forces, velocity damping, and coefficient of restitution) with geometric primitives (`Circ` or `Rect`) from Spock.js.',
      'A mass of `0` denotes a static, immovable obstacle (`inverseMass = 0`), which absorbs collisions without being pushed back.',
    ],
    example: `import { Physics, Vec2 } from '@1pizzateam/bumpr';

// Dynamic circle (position, velocity, size, mass, damping, restitution, shape)
const ball = new Physics(
  new Vec2(100, 100),
  new Vec2(200, 0),
  new Vec2(40, 40),
  1.0,
  0.98,
  0.85,
  'circle'
);

// Static wall (mass = 0 denotes an immovable obstacle)
const wall = new Physics(
  new Vec2(100, 300),
  new Vec2(0, 0),
  new Vec2(200, 20),
  0,
  1.0,
  0.5,
  'aabb'
);`,
    members: {
      constructor: {
        description: 'Create a new `Physics` body with vector-first arguments.',
        params: [
          '- `position` — `Vec2`. Initial position (default `new Vec2()`).',
          '- `velocity` — `Vec2`. Initial velocity in px/s (default `new Vec2()`).',
          '- `size` — `Vec2`. Bounding dimensions (width, height; default `new Vec2(20, 20)`). For circles, radius is `size.x * 0.5`.',
          '- `mass` — `number`. Body mass in kg (default `1.0`). `0` marks a static body.',
          '- `damping` — `number`. Air resistance / velocity damping per second in `[0, 1]` (default `0.8`).',
          '- `restitution` — `number`. Bounciness in `[0, 1]` (default `0`).',
          "- `shape` — `'circle' | 'aabb' | 'rectangle'`. Collision geometry (default `'circle'`).",
          '- `friction` — `number` (optional). Coulomb friction coefficient in `[0, 1]` (defaults to `0` for circle, `0.6` for AABB).',
        ],
        returns: 'A new `Physics` instance.',
      },
      updatePosition: {
        description: 'Integrate accumulated impulses, apply velocity damping, and update geometric shape position.',
        params: ['- `second` — `number`. Timestep elapsed in seconds.'],
        returns: '`void`',
      },
      applyImpulse: {
        description: 'Apply an instantaneous linear velocity impulse vector to the body.',
        params: ['- `impulse` — `Vec2`. Impulse vector in px·kg/s.'],
        returns: '`void`',
      },
      applyVelocity: {
        description: 'Directly modify the body velocity vector.',
        params: ['- `velocity` — `Vec2`. Velocity offset vector.'],
        returns: '`void`',
      },
      correctPosition: {
        description: 'Directly translate the body position (used for positional penetration de-penetration).',
        params: ['- `correction` — `Vec2`. Translation correction vector.'],
        returns: '`void`',
      },
      setPosition: {
        description: 'Explicitly set the body position vector.',
        params: ['- `position` — `Vec2`. New position vector.'],
        returns: '`void`',
      },
      setVelocity: {
        description: 'Explicitly set linear velocity vector.',
        params: ['- `velocity` — `Vec2`. New velocity vector.'],
        returns: '`void`',
      },
      setInitialVelocity: {
        description: 'Record reference initial velocity for subsequent `reset()` calls.',
        params: ['- `velocity` — `Vec2`. Initial velocity vector.'],
        returns: '`void`',
      },
      setGravity: {
        description: 'Set custom gravity acceleration vector for this body.',
        params: ['- `gravity` — `Vec2`. Gravity vector.'],
        returns: '`void`',
      },
      setMass: {
        description: 'Set body mass. Sets `inverseMass = 1 / mass` (or `0` when `mass = 0`).',
        params: ['- `mass` — `number`. Body mass in kg.'],
        returns: '`void`',
      },
      getMass: {
        description: 'Get body mass.',
        returns: '`number` — Current mass.',
      },
      setRestitution: {
        description: 'Set coefficient of restitution (bounciness), clamped between `0.0` (inelastic) and `1.0` (elastic).',
        params: ['- `restitution` — `number`. Value in `[0.0, 1.0]`.'],
        returns: '`void`',
      },
      getRestitution: {
        description: 'Get coefficient of restitution.',
        returns: '`number`',
      },
      setFriction: {
        description: 'Set coefficient of Coulomb surface friction, clamped between `0.0` (frictionless) and `1.0` (high friction).',
        params: ['- `friction` — `number`. Friction coefficient in `[0.0, 1.0]`.'],
        returns: '`void`',
      },
      getFriction: {
        description: 'Get coefficient of Coulomb surface friction.',
        returns: '`number`',
      },
      setDamping: {
        description: 'Set linear air drag velocity damping factor (default `1.0` = no damping).',
        params: ['- `damping` — `number`. Value in `[0.0, 1.0]`.'],
        returns: '`void`',
      },
      getDamping: {
        description: 'Get linear velocity damping factor.',
        returns: '`number`',
      },
      setSize: {
        description: 'Update the dimensions of the underlying geometric shape.',
        params: ['- `width` — `number`. Radius if circle, width if AABB.', '- `height` — `number | undefined`. Height if AABB.'],
        returns: '`void`',
      },
      getBody: {
        description: 'Get the underlying Spock geometric shape (`Circ` or `Rect`).',
        returns: '`Circ | Rect`',
      },
      reset: {
        description: 'Reset transient forces, impulses, and revert velocity to initial velocity.',
        returns: '`void`',
      },
      draw: {
        description: 'Render the body onto a 2D canvas context.',
        params: [
          '- `context` — `CanvasRenderingContext2D`. Target canvas context.',
          '- `fillColor` — `string`. Interior fill style.',
          '- `strokeColor` — `string`. Contour stroke style.',
          '- `strokeWidth` — `number`. Contour stroke thickness.',
        ],
        returns: '`void`',
      },
      isActive: {
        description: 'Check whether the body is active in simulation.',
        returns: '`boolean`',
      },
      setActive: {
        description: 'Activate body in simulation.',
        returns: '`void`',
      },
      setInactive: {
        description: 'Deactivate body, temporarily skipping physics updates and collisions.',
        returns: '`void`',
      },
      toggleActive: {
        description: 'Toggle active status between enabled and disabled.',
        returns: '`boolean` — New active status.',
      },
    },
  },
  CollisionDetection: {
    summary: 'Narrow-phase collision detection, positional resolution, and elastic impulse solver.',
    body: [
      '`CollisionDetection` computes penetration vectors between pairs of bodies (`Circle vs Circle`, `Circle vs AABB`, `AABB vs AABB`), separates overlapping bodies along the contact normal according to inverse mass ratios, and computes linear impulse responses.',
    ],
    example: `import { CollisionDetection, Physics, Vec2 } from '@1pizzateam/bumpr';
 
const a = new Physics(new Vec2(50, 50), new Vec2(), new Vec2(40, 40), 1.0, 1.0, 0.5, 'circle');
const b = new Physics(new Vec2(70, 50), new Vec2(), new Vec2(40, 40), 1.0, 1.0, 0.5, 'aabb');

// Perform full detection + position correction + impulse resolution:
const hasCollided = CollisionDetection.test(a, b);`,
    members: {
      broadphase: {
        description: 'Test whether two bodies share one or more spatial grid cells.',
        params: [
          '- `a` — `Physics`. First body.',
          '- `b` — `Physics`. Second body.',
          '- `grid` — `Grid`. Spock spatial hash grid.',
        ],
        returns: '`boolean` — `true` if bodies share grid cells, `false` otherwise.',
      },
      test: {
        description: 'Execute full collision pipeline: narrow-phase detection, positional resolution, and impulse computation.',
        params: ['- `a` — `Physics`. First body.', '- `b` — `Physics`. Second body.'],
        returns: '`boolean` — `true` if a collision occurred and was resolved.',
      },
      detect: {
        description: 'Compute the penetration vector between two geometric shapes (`Circ | Rect`). Stores result in `this.penetration`.',
        params: ['- `a` — `Circ | Rect`. First shape.', '- `b` — `Circ | Rect`. Second shape.'],
        returns: '`void`',
      },
      resolve: {
        description: 'Perform positional correction by shifting bodies apart along the penetration normal based on relative inverse masses.',
        params: ['- `a` — `Physics`. First body.', '- `b` — `Physics`. Second body.'],
        returns: '`boolean` — `true` if position was corrected, `false` if zero correction.',
      },
      computeImpulse: {
        description: 'Compute and apply normal collision impulse and tangential Coulomb friction based on relative velocity, restitution, friction coefficients, and masses. Stabilizes steady contact with a resting velocity threshold.',
        params: ['- `a` — `Physics`. First body.', '- `b` — `Physics`. Second body.'],
        returns: '`void`',
      },
    },
  },
  CircleVSCircle: {
    summary: 'Narrow-phase detection and penetration calculation between two circles.',
    body: [
      '`CircleVSCircle` calculates Euclidean separation between circle centers, detects radial overlaps, handles concentric zero-distance edge cases, and returns outward penetration vectors.',
    ],
    example: `import { CircleVSCircle, Vec2 } from '@1pizzateam/bumpr';

const posA = new Vec2(100, 100);
const posB = new Vec2(120, 100);

const penetration = CircleVSCircle.detect(posA, 15, posB, 15);
console.log(penetration.isOrigin()); // false (colliding, 10px overlap)`,
    members: {
      detect: {
        description: 'Test collision and compute penetration between two circles.',
        params: [
          '- `apos` — `Vec2`. Center position of Circle A.',
          '- `radiusA` — `number`. Radius of Circle A.',
          '- `bpos` — `Vec2`. Center position of Circle B.',
          '- `radiusB` — `number`. Radius of Circle B.',
        ],
        returns: '`Vec2` — Outward penetration vector (origin vector if no collision).',
      },
      getPenetration: {
        description: 'Calculate normalized penetration vector from squared distance and combined radii.',
        params: [
          '- `rr` — `number`. Sum of circle radii (`radiusA + radiusB`).',
          '- `dSq` — `number`. Squared distance between centers.',
        ],
        returns: '`Vec2` — Penetration vector.',
      },
    },
  },
  CircleVSAabb: {
    summary: 'Narrow-phase detection between a Circle and an Axis-Aligned Bounding Box (AABB).',
    body: [
      '`CircleVSAabb` categorizes the circle position relative to the 9 Voronoi regions of the box. For face collisions, it projects along the shallowest axis; for corner diagonal collisions, it performs outward radial projection.',
    ],
    example: `import { CircleVSAabb, Vec2 } from '@1pizzateam/bumpr';

const circlePos = new Vec2(50, 40);
const circleRadius = 15;
const boxPos = new Vec2(70, 40);
const boxHalfSize = new Vec2(20, 20);

const pen = CircleVSAabb.detect(circlePos, circleRadius, boxPos, boxHalfSize);`,
    members: {
      detect: {
        description: 'Test collision and compute penetration between Circle A and AABB B.',
        params: [
          '- `apos` — `Vec2`. Circle center.',
          '- `radiusA` — `number`. Circle radius.',
          '- `bpos` — `Vec2`. AABB center.',
          '- `bhs` — `Vec2`. AABB half-size vector (half-width, half-height).',
        ],
        returns: '`Vec2` — Penetration vector.',
      },
      diagonalHit: {
        description: 'Classify Voronoi region and evaluate corner diagonal collision.',
        params: [
          '- `apos` — `Vec2`. Circle center.',
          '- `radiusA` — `number`. Circle radius.',
          '- `bpos` — `Vec2`. AABB center.',
          '- `bhs` — `Vec2`. AABB half-size vector.',
        ],
        returns: '`boolean`',
      },
      setVoronoiRegion: {
        description: 'Determine which Voronoi grid region the circle center occupies relative to the AABB.',
        params: ['- `bhs` — `Vec2`. AABB half-size vector.'],
        returns: '`void`',
      },
      getPenetration: {
        description: 'Compute final penetration vector based on determined projection axis or diagonal normal.',
        params: ['- `radiusA` — `number`. Circle radius.'],
        returns: '`Vec2`',
      },
    },
  },
  AabbVSAabb: {
    summary: 'Narrow-phase detection between two Axis-Aligned Bounding Boxes (AABB vs AABB).',
    body: [
      '`AabbVSAabb` computes overlapping intervals along the horizontal and vertical axes, checks for positive overlap, and returns the minimum translation vector along the shallowest axis.',
    ],
    example: `import { AabbVSAabb, Vec2 } from '@1pizzateam/bumpr';

const posA = new Vec2(40, 40);
const halfSizeA = new Vec2(20, 20);
const posB = new Vec2(60, 40);
const halfSizeB = new Vec2(20, 20);

const pen = AabbVSAabb.detect(posA, halfSizeA, posB, halfSizeB);`,
    members: {
      detect: {
        description: 'Test collision and compute penetration between AABB A and AABB B.',
        params: [
          '- `apos` — `Vec2`. Center of box A.',
          '- `ahs` — `Vec2`. Half-size of box A.',
          '- `bpos` — `Vec2`. Center of box B.',
          '- `bhs` — `Vec2`. Half-size of box B.',
        ],
        returns: '`Vec2` — Minimum translation penetration vector.',
      },
      getPenetration: {
        description: 'Isolate shallowest projection axis and negate direction if necessary.',
        returns: '`Vec2`',
      },
    },
  },
};

function jsDoc(node, source) {
  const ranges = ts.getLeadingCommentRanges(source.text, node.getFullStart()) ?? [];
  const comment = ranges
    .map(range => source.text.slice(range.pos, range.end))
    .reverse()
    .find(value => value.startsWith('/**'));
  return comment
    ? comment.replace(/^\/\*\*\s?|\s?\*\/$/g, '').replace(/^\s*\*\s?/gm, '').trim()
    : '';
}

function parameterInfo(parameter, source) {
  return {
    name: parameter.name.getText(source),
    type: parameter.type?.getText(source) ?? 'unknown',
    optional: Boolean(parameter.questionToken || parameter.initializer),
  };
}

function publicApi(exportName, sourcePath) {
  const text = fs.readFileSync(sourcePath, 'utf8');
  const source = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const entries = [];

  for (const statement of source.statements) {
    if (ts.isClassDeclaration(statement) && statement.name?.text === exportName) {
      for (const member of statement.members) {
        if (member.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword)) continue;
        if (ts.isConstructorDeclaration(member)) {
          entries.push({
            name: 'constructor',
            signature: `new ${exportName}(${member.parameters.map(p => p.getText(source)).join(', ')})`,
            params: member.parameters.map(p => parameterInfo(p, source)),
            returns: exportName,
            description: jsDoc(member, source),
          });
        } else if (ts.isMethodDeclaration(member) && member.name) {
          const name = member.name.getText(source);
          const returns = member.type?.getText(source) ?? 'void';
          entries.push({
            name,
            signature: `${name}(${member.parameters.map(p => p.getText(source)).join(', ')}): ${returns}`,
            params: member.parameters.map(p => parameterInfo(p, source)),
            returns,
            description: jsDoc(member, source),
          });
        }
      }
      return entries;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.name.getText(source) === exportName && declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
          for (const prop of declaration.initializer.properties) {
            if (ts.isMethodDeclaration(prop) && prop.name) {
              const name = prop.name.getText(source);
              const returns = prop.type?.getText(source) ?? 'void';
              entries.push({
                name,
                signature: `${name}(${prop.parameters.map(p => p.getText(source)).join(', ')}): ${returns}`,
                params: prop.parameters.map(p => parameterInfo(p, source)),
                returns,
                description: jsDoc(prop, source),
              });
            }
          }
          return entries;
        }
      }
    }
  }
  return entries;
}

if (!fs.existsSync(docsRoot)) {
  fs.mkdirSync(docsRoot, { recursive: true });
}

for (const [exportName, sourceFile, docFile] of modules) {
  const api = publicApi(exportName, path.join(root, 'src', sourceFile));
  const intro = intros[exportName];
  if (!intro) continue;

  let markdown = `# ${exportName}

${intro.summary}

${intro.body.join('\n\n')}

\`\`\`javascript
${intro.example}
\`\`\`
`;

  for (const entry of api) {
    const meta = intro.members?.[entry.name] || {};
    const title = entry.name === 'constructor' ? '## Constructor' : `## ${exportName}.${entry.name}()`;
    markdown += `
---

${title}

${meta.description || entry.description || ''}

\`\`\`typescript
${entry.signature}
\`\`\`
`;

    if (meta.params?.length) {
      markdown += `
### Parameters

${meta.params.join('\n')}
`;
    }

    if (meta.returns) {
      markdown += `
### Returns

${meta.returns}
`;
    }

    if (meta.example) {
      markdown += `
### Example

\`\`\`javascript
${meta.example}
\`\`\`
`;
    }
  }

  fs.writeFileSync(path.join(docsRoot, docFile), markdown.trimStart());
}

console.log('API documentation generated successfully with code usage samples.');
