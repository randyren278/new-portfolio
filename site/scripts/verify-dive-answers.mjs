import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { createRun, loadProgress, STORAGE_KEY } from '../public/dive/model.mjs';

const [base = 'http://127.0.0.1:4318', output = '/tmp/dive-answer-qa', mode = 'fixed'] =
  process.argv.slice(2);
assert.ok(['baseline', 'fixed'].includes(mode));
const exec = promisify(execFile),
  profile = `scratch-dive-answers-${process.pid}`,
  tab = 'answers';
const cases = [
  { id: 'nature-dog-breeds', input: 'Cane Corso', valid: true, canonical: 'Cane Corso' },
  { id: 'nature-mammals', input: 'Orca', valid: true, canonical: 'Orca' },
  { id: 'nature-marine-mammals', input: 'whale', valid: true, canonical: 'whale' },
  { id: 'nature-primates', input: 'monkey', valid: true, canonical: 'monkey' },
  { id: 'nature-primates', input: 'ape', valid: true, canonical: 'ape' },
  { id: 'nature-wild-canids', input: 'fox', valid: true, canonical: 'fox' },
  { id: 'nature-mammals', input: 'cats', valid: true, canonical: 'cat' },
  { id: 'nature-mammals', input: 'mice', valid: true, canonical: 'mouse' },
  { id: 'everyday-kitchen', input: 'knives', valid: true, canonical: 'knife' },
  { id: 'world-capitals', input: 'Kyoto', valid: true, canonical: 'Kyoto' },
  { id: 'world-v5-canadian-cities', input: 'Surrey', valid: true, canonical: 'Surrey' },
  { id: 'world-v5-vietnamese-cities', input: 'Đà Nẵng', valid: true, canonical: 'Da Nang' },
  { id: 'culture-v5-minecraft-mobs', input: 'Creaking', valid: true, canonical: 'Creaking' },
  { id: 'world-landlocked', input: 'Gambia', valid: false, oldCanonical: 'zambia' },
  { id: 'nature-sharks', input: 'Whale', valid: false, oldCanonical: 'whale shark' },
];
const dates = new Map();
const targetIds = new Set(cases.map((item) => item.id));
for (let i = 0; i < 10000 && dates.size < targetIds.size; i++) {
  const date = new Date(Date.UTC(2026, 10, 7 + i)).toISOString().slice(0, 10);
  const run = createRun({ dateKey: date, poolVersion: 1 });
  if (cases.some((item) => item.id === run.questions[0].id) && !dates.has(run.questions[0].id))
    dates.set(run.questions[0].id, { date, prompt: run.questions[0].prompt, run });
}
assert.equal(dates.size, targetIds.size, 'Find deterministic public daily fixtures for every case');
mkdirSync(output, { recursive: true });
const call = async (...args) =>
  JSON.parse(
    (
      await exec('umbra', ['--profile', profile, '--json', ...args], {
        timeout: 45000,
        maxBuffer: 4e6,
      })
    ).stdout,
  );
const evaluate = async (source) => (await call('eval', source, '--tab', tab)).value;
const results = [];
try {
  for (const item of cases) {
    const fixture = dates.get(item.id);
    await call('open', `${base}/dive`, '--tab', tab);
    await call('wait', '--selector', '#begin', '--tab', tab);
    // Specialist questions remain playable by resuming an existing old-pool save.
    const progress = loadProgress();
    progress.activeDaily = {
      run: fixture.run,
      deadline: Date.parse(`${fixture.date}T12:00:00Z`) + 25000,
      feedback: false,
    };
    progress.activeDailies[fixture.date] = progress.activeDaily;
    await evaluate(`
      localStorage.clear();window.OriginalDate=Date;const stamp=Date.parse(${JSON.stringify(`${fixture.date}T12:00:00Z`)});
      window.Date=class extends window.OriginalDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}};
      localStorage.setItem(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(JSON.stringify(progress))});return true;
    `);
    await call('click', '#daily-mode', '--tab', tab);
    await call('click', '#begin', '--tab', tab);
    assert.equal(
      await evaluate('return document.querySelector("#prompt").textContent'),
      fixture.prompt,
    );
    await call('fill', '#answer', item.input, '--tab', tab);
    await call('press', 'Enter', '--target', '#answer', '--tab', tab);
    const observed = await evaluate(`return {
      state:document.querySelector('#screen').dataset.state,
      canonical:document.querySelector('.result-answer')?.textContent??null,
      message:document.querySelector('#answer-message')?.textContent??null,
      score:Number(document.querySelector('#score').textContent)
    }`);
    const accepted = observed.state === 'feedback';
    assert.equal(
      accepted,
      mode === 'fixed' ? item.valid : !item.valid,
      `${mode}: ${item.id} / ${item.input}`,
    );
    if (accepted)
      assert.equal(observed.canonical, mode === 'fixed' ? item.canonical : item.oldCanonical);
    else assert.match(observed.message, /Not listed/);
    results.push({ ...item, date: fixture.date, prompt: fixture.prompt, surface: 'resumed old-pool daily', observed });
    await call('screenshot', path.join(output, `${item.id}-${item.input.replace(/[^a-z0-9]+/gi, '-')}.png`), '--tab', tab);
    console.log(`PASS ${mode}: ${item.input} ${accepted ? 'accepted' : 'rejected'} on ${item.id}`);
  }
  const errors = await call('console', '--level', 'error', '--tab', tab);
  assert.equal(errors.count, 0);
  writeFileSync(
    path.join(output, 'receipt.json'),
    JSON.stringify({ mode, base, results, testedAt: new Date().toISOString() }, null, 2),
  );
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}
