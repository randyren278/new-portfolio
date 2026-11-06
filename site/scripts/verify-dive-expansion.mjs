import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { createRun } from '../public/dive/model.mjs';

const [base = 'http://127.0.0.1:4318', output = '/tmp/dive-expansion-qa'] = process.argv.slice(2);
const exec = promisify(execFile),
  profile = `scratch-dive-expansion-${process.pid}`,
  tab = 'expansion';
const raw = readFileSync(new URL('./fixtures/dive-legacy-progress.json', import.meta.url), 'utf8');
const legacy = JSON.parse(raw),
  checks = [];
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
const click = (selector) => call('click', selector, '--tab', tab);
const read = (selector) =>
  evaluate(`return document.querySelector(${JSON.stringify(selector)}).textContent`);
function pass(name) {
  checks.push(name);
  console.log(`PASS ${name}`);
}
async function showDay(date) {
  await evaluate(`
    window.OriginalDate??=Date;const stamp=window.OriginalDate.parse(${JSON.stringify(`${date}T12:00:00Z`)});
    window.Date=class extends window.OriginalDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}};return true;
  `);
  await click('#daily-mode');
}
try {
  await call('open', `${base}/dive`, '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  await call('viewport', '1440', '1000', '--tab', tab);
  const palette = await evaluate(`
    const ctx=document.querySelector('#ocean').getContext('2d'),draw=ctx.drawImage;let result=null;
    ctx.drawImage=function(image,...args){
      if(image.width>60&&image.height>35&&!(image.width===112&&image.height===96)&&image.getContext){
        const data=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
        let opaque=0,cool=0,warm=0;
        for(let i=0;i<data.length;i+=4)if(data[i+3]>128){
          const [r,g,b]=data.slice(i,i+3);opaque++;
          if(b>r*1.05&&b>=g*.95)cool++;
          if(r>100&&r>g*1.16&&g>b*1.25)warm++;
        }
        result={opaque,cool,warm,coolFraction:cool/opaque,warmFraction:warm/opaque};
      }
      return draw.call(this,image,...args);
    };
    await new Promise(resolve=>{const end=performance.now()+3000;function step(){if(result||performance.now()>end)resolve();else requestAnimationFrame(step)}requestAnimationFrame(step)});
    ctx.drawImage=draw;return result;
  `);
  assert.ok(
    palette && palette.coolFraction > 0.55 && palette.warmFraction < 0.03,
    JSON.stringify(palette),
  );
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [320, 568],
  ]) {
    await call('viewport', String(width), String(height), '--tab', tab);
    await call('screenshot', path.join(output, `boat-${width}.png`), '--tab', tab);
  }
  pass('rendered boat uses the cool ocean palette at desktop and phone sizes');
  await call('viewport', '1440', '1000', '--tab', tab);
  await evaluate(`localStorage.setItem('randy-dive-v1',${JSON.stringify(raw)});return true`);
  await call('reload', '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  await showDay('2026-11-06');
  assert.equal(Number(await read('#best')), 700);
  assert.match(await read('#begin'), /Resume/);
  await click('#begin');
  assert.equal(Number(await read('#score')), legacy.activeDaily.run.score);
  assert.equal(await read('.result-answer'), legacy.activeDaily.run.answers[0].canonical);
  await click('#next');
  assert.equal(await read('#prompt'), createRun({ dateKey: '2026-11-06' }).questions[1].prompt);
  await call('reload', '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  assert.equal(Number(await read('#best')), 700);
  assert.deepEqual(
    await evaluate(
      'return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDailies["2026-11-06"].run.answers[0]',
    ),
    legacy.activeDaily.run.answers[0],
  );
  pass('a pre-expansion browser save resumes its question and preserves the 700-point best');
  await showDay('2026-11-07');
  await click('#begin');
  const expected = createRun({ dateKey: '2026-11-07' });
  assert.equal(await read('#prompt'), expected.questions[0].prompt);
  const answer = expected.questions[0].answers.find((entry) => entry.score === 100);
  await call('fill', '#answer', answer.aliases?.[0] ?? answer.name, '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  assert.equal(Number(await read('#score')), 100);
  assert.equal(await read('.result-answer'), answer.name);
  await click('#next');
  assert.equal(await read('#prompt'), expected.questions[1].prompt);
  assert.equal(expected.questions[1].preciseMatching, true);
  await call('fill', '#answer', expected.questions[1].answers.find((entry) => entry.score === 100).name, '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  assert.equal(Number(await read('#score')), 200);
  await call('screenshot', path.join(output, 'expanded-daily.png'), '--tab', tab);
  pass('the next UTC daily uses the expanded bank and accepts a real typed answer');
  const errors = await call('console', '--level', 'error', '--tab', tab);
  assert.equal(errors.count, 0);
  writeFileSync(
    path.join(output, 'receipt.json'),
    JSON.stringify({ checks, palette, testedAt: new Date().toISOString() }, null, 2),
  );
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}
