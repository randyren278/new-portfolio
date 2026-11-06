import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(root, '../site/public');
const output = path.join(root, 'dist');
rmSync(output, { recursive: true, force: true });

const files = [
  ...readdirSync(path.join(source, 'dive'))
    .filter((name) => /\.(mjs|css|html)$/.test(name) || name === 'boat-grid.webp')
    .map((name) => `dive/${name}`),
  'surfaces.css',
  'favicon.svg',
  'favicon-32.png',
  'favicon-16.png',
  'apple-touch-icon.png',
  'fonts/ibm-plex-mono-normal-400.woff2',
  'fonts/ibmplexmono-OFL.txt',
  'fonts/instrument-serif-normal-400.woff2',
  'fonts/instrument-serif-italic-400.woff2',
  'fonts/instrumentserif-OFL.txt',
  'puff-up/game/puff-motion.js',
  'puff-up/game/flight-pose.js',
];
for (const file of files) {
  const destination = path.join(output, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(source, file), destination);
}
copyFileSync(path.join(source, 'dive/index.html'), path.join(output, 'index.html'));
copyFileSync(path.join(root, 'vercel.json'), path.join(output, 'vercel.json'));

const hashes = Object.fromEntries([...files, 'index.html', 'vercel.json'].sort().map((file) => [
  file, createHash('sha256').update(readFileSync(path.join(output, file))).digest('hex'),
]));
const receipt = path.resolve(root, '../output/rillion-release/bundle.json');
mkdirSync(path.dirname(receipt), { recursive: true });
writeFileSync(receipt, JSON.stringify({ output, hashes }, null, 2) + '\n');
console.log(`Built Rillion: ${Object.keys(hashes).length} static files in ${output}`);
