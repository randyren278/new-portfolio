import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 180;
const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, '.next');
const HTML_PATH = path.join(NEXT_DIR, 'server', 'app', 'index.html');

const html = await readFile(HTML_PATH, 'utf8');

// Match every <script ...> tag and keep only those loading /_next/static/chunks/*.js
// that are NOT tagged noModule (the noModule bundle is a legacy-browser polyfill and
// is not executed by modern browsers — so it does not count toward first-load JS).
const tagRe = /<script\b[^>]*>/g;
const srcRe = /\bsrc="(\/_next\/static\/chunks\/[^"]+\.js)"/;
const chunks = new Set();
for (const m of html.matchAll(tagRe)) {
  const tag = m[0];
  if (/\bnoModule\b/.test(tag)) continue;
  const s = srcRe.exec(tag);
  if (s) chunks.add(s[1]);
}

let total = 0;
for (const src of chunks) {
  const rel = src.replace(/^\/_next\//, '');
  const full = path.join(NEXT_DIR, rel);
  const buf = await readFile(full);
  total += gzipSync(buf).length;
}

const kb = total / 1024;
console.log(
  `/  first-load JS (gz): ${kb.toFixed(1)} KB (budget ${BUDGET_KB} KB, ${chunks.size} chunks)`,
);
if (kb > BUDGET_KB) {
  console.error(`BUDGET EXCEEDED: ${kb.toFixed(1)} KB > ${BUDGET_KB} KB`);
  process.exit(1);
}
