import fs from 'node:fs';

const mail = 'https://github.com/1pizzateam/BumpR.js';
const CRLF = '\r\n';
const dest = './dist/';
const license = fs.readFileSync('./LICENSE');
const header = `/*${CRLF}${license}${CRLF}${mail}${CRLF}*/${CRLF}${CRLF}`;

const files = [
  ['./build/bumpr.mjs', `${dest}bumpr.js`],
  ['./build/bumpr.d.mts', `${dest}bumpr.d.ts`],
];

fs.mkdirSync(dest, { recursive: true });
for (const [src, out] of files)
  fs.writeFileSync(out, header + fs.readFileSync(src));
