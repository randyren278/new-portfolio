import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [base = 'http://127.0.0.1:4326', receipt = '/tmp/rillion-share-card.json'] = process.argv.slice(2);
const expectedImage = 'https://rillion.randyren.org/dive/share-boat-v1.png';
const checks = [];
for (const userAgent of ['Applebot/0.1', 'Twitterbot/1.0', 'facebookexternalhit/1.1']) {
  const response = await fetch(base, { headers: { 'User-Agent': userAgent } });
  assert.equal(response.status, 200);
  const html = await response.text();
  const head = html.split('</head>')[0];
  const meta = Object.fromEntries([...head.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
    return [attrs.property || attrs.name, attrs.content];
  }));
  assert.equal(meta['og:image'], expectedImage);
  assert.equal(meta['og:type'], 'website');
  assert.equal(meta['og:url'], 'https://rillion.randyren.org/');
  assert.equal(meta['og:title'], 'Rillion');
  assert.equal(meta['og:image:type'], 'image/png');
  assert.equal(meta['og:image:width'], '1200');
  assert.equal(meta['og:image:height'], '630');
  assert.ok(meta['og:image:alt']);
  assert.equal(meta['twitter:card'], 'summary_large_image');
  assert.equal(meta['twitter:image'], expectedImage);
  checks.push({ userAgent, status: response.status, image: meta['og:image'], htmlMetadata: true });
}
const response = await fetch(new URL(new URL(expectedImage).pathname, base));
assert.equal(response.status, 200);
assert.match(response.headers.get('content-type'), /^image\/png/);
const image = Buffer.from(await response.arrayBuffer());
assert.equal(image.readUInt32BE(0), 0x89504e47);
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
assert.ok(image.length < 1_000_000);
assert.deepEqual(image, readFileSync(new URL('../site/public/dive/share-boat-v1.png', import.meta.url)));
mkdirSync(path.dirname(receipt), { recursive: true });
writeFileSync(receipt, JSON.stringify({ base, checks, image: { url: expectedImage, width:1200, height:630, bytes:image.length, sha256:createHash('sha256').update(image).digest('hex') }, recordedAt:new Date().toISOString() }, null, 2) + '\n');
console.log('PASS crawler-visible metadata, large-card tags, public PNG, dimensions, and exact artwork bytes');
