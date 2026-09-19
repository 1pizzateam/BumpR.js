import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const production = process.env.NODE_ENV === 'production';

const base = process.env.VITEPRESS_BASE || (production ? '/BumpR.js/' : '/docs/');

const here = path.dirname(fileURLToPath(import.meta.url));

// The live demos import the library by its package name, but it always resolves
// to the local build so the docs demo the current source instead of whatever
// happens to be published. Docker mounts dist/ beside the website; outside Docker
// it sits at the repository root.
function localEntry() {
  const entry = [
    path.resolve(here, '../../dist/bumpr.js'),
    path.resolve(here, '../../../dist/bumpr.js'),
  ].find(candidate => fs.existsSync(candidate));

  if (!entry)
    throw new Error('Local build not found. Run "npm run build:lib" in the repository root first.');

  return entry;
}

const alias = {
  '@1pizzateam/bumpr': localEntry(),
};

export default defineConfig({
  title: 'BumpR.js',
  description: 'A lightweight 2D rigid body physics and collision detection library in TypeScript for games and simulations.',
  base,
  cleanUrls: true,
  vite: {
    resolve: { alias },
  },
  head: [
    ['meta', { name: 'theme-color', content: '#ff6b6b' }],
  ],
  themeConfig: {
    siteTitle: 'BumpR.js',
    nav: [
      { text: 'Guide', link: '/guide/overview' },
      { text: 'Examples', link: '/guide/examples' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Overview', link: '/guide/overview' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Examples', link: '/guide/examples' },
        ],
      },
      {
        text: 'API overview',
        link: '/api/',
      },
      {
        text: 'Core',
        collapsed: false,
        items: [
          { text: 'Scene', link: '/api/scene' },
          { text: 'Physics', link: '/api/physics' },
          { text: 'CollisionDetection', link: '/api/collision' },
        ],
      },
      {
        text: 'Narrow-Phase Collisions',
        collapsed: false,
        items: [
          { text: 'Circle vs Circle', link: '/api/circlevscircle' },
          { text: 'Circle vs AABB', link: '/api/circlevsaabb' },
          { text: 'AABB vs AABB', link: '/api/aabbvsaabb' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/1pizzateam/BumpR.js' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@1pizzateam/bumpr' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2017-present 1 Pizza Team',
    },
  },
});
