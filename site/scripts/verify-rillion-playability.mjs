import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [base = 'http://127.0.0.1:4329', output = '/tmp/rillion-playability', mode = 'fixed'] = process.argv.slice(2);
assert.ok(['baseline', 'fixed'].includes(mode));
const exec = promisify(execFile);
const profile = `scratch-rillion-playability-${process.pid}`;
const tab = 'playability';
const cases = [
  { id: 'nature-mammals', input: 'polar bears', date: '2026-01-21', valid: true },
  { id: 'nature-trees', input: 'oak tree', date: '2026-01-16', valid: true },
  { id: 'culture-instruments', input: 'electric guitar', date: '2026-03-31', valid: true },
  { id: 'culture-music-genres', input: 'rock music', date: '2026-10-20', valid: true },
  { id: 'everyday-cooking', input: 'stir fry', date: '2026-07-25', valid: true },
  { id: 'nature-mammals', input: 'sparrow', date: '2026-01-21', valid: false },
  { id: 'everyday-cooking', input: 'refrigerator', date: '2026-07-25', valid: false },
];
mkdirSync(output, { recursive: true });
const call = async (...args) => JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], {
  timeout: 45000, maxBuffer: 4e6,
})).stdout);
const evaluate = async (source) => (await call('eval', source, '--tab', tab)).value;
const results = [];
try {
  for (const item of cases) {
    await call('open', base + '/', '--tab', tab);
    await call('wait', '--selector', '#begin', '--tab', tab);
    await evaluate(`
      localStorage.clear();const NativeDate=Date,stamp=Date.parse(${JSON.stringify(item.date + 'T12:00:00Z')});
      window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}};return true;
    `);
    await call('click', '#daily-mode', '--tab', tab);
    await call('click', '#begin', '--tab', tab);
    const { QUESTIONS } = await import('../public/dive/questions.mjs');
    const question = QUESTIONS.find(q => q.id === item.id);
    assert.equal(await evaluate('return document.querySelector("#prompt").textContent'), question.prompt);
    await call('fill', '#answer', item.input, '--tab', tab);
    await call('press', 'Enter', '--target', '#answer', '--tab', tab);
    const observed = await evaluate(`return {
      state:document.querySelector('#screen').dataset.state,
      canonical:document.querySelector('.result-answer')?.textContent??null,
      message:document.querySelector('#answer-message')?.textContent??null,
      score:Number(document.querySelector('#score').textContent)
    }`);
    assert.equal(observed.state === 'feedback', mode === 'fixed' && item.valid, `${mode}: ${item.id} / ${item.input}`);
    if (observed.state === 'feedback') assert.ok(observed.score > 0);
    else assert.match(observed.message, /Not listed/);
    results.push({ ...item, observed });
    await call('screenshot', path.join(output, `${item.id}-${item.input.replaceAll(' ', '-')}.png`), '--tab', tab);
    console.log(`PASS ${mode}: ${item.input}: ${observed.state}`);
  }
  assert.equal((await call('console', '--level', 'error', '--tab', tab)).count, 0);
  writeFileSync(path.join(output, 'receipt.json'), JSON.stringify({ base, mode, results, testedAt: new Date().toISOString() }, null, 2) + '\n');
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}
