import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { QUESTIONS, PLAYABLE_QUESTIONS, LEGACY_QUESTIONS, CATEGORIES } from '../public/dive/questions.mjs';

const [base = 'http://127.0.0.1:4318', output = '/tmp/randy-dive-qa'] = process.argv.slice(2);
const profile = `scratch-dive-check-${process.pid}`;
const exec = promisify(execFile);
const checks = [];
const encountered = [];
const tab = 'dive-check';
mkdirSync(output, { recursive: true });
async function call(...args) {
  const result = await exec('umbra', ['--profile', profile, '--json', ...args], {
    timeout: 45000,
    maxBuffer: 4e6,
  });
  return JSON.parse(result.stdout);
}
const evaluate = async (source, target = tab) =>
  (await call('eval', source, '--tab', target)).value;
const settle = () =>
  call(
    'wait',
    '--js',
    `document.fonts.status === 'loaded' && document.getAnimations().filter(a=>a.effect?.target === document.querySelector('#screen') || a.effect?.target === document.querySelector('#depth-marker')).every(a=>a.playState !== 'running')`,
    '--tab',
    tab,
  );
const click = (target) => call('click', target, '--tab', tab);
const wait = (selector, seconds = 10) =>
  call('wait', '--selector', selector, '--timeout', String(seconds), '--tab', tab);
const read = (selector) =>
  evaluate(`return document.querySelector(${JSON.stringify(selector)})?.textContent`);
function pass(name) {
  checks.push(name);
  process.stdout.write(`PASS ${name}\n`);
}
async function answer(maximum = true) {
  const prompt = await read('#prompt');
  const question = QUESTIONS.find((item) => item.prompt === prompt);
  assert.ok(question, `Known prompt: ${prompt}`);
  encountered.push(question.id);
  const entry = maximum
    ? [...question.answers].sort((a, b) => b.score - a.score)[0]
    : question.answers[0];
  await call('fill', '#answer', entry.name, '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  return entry.score;
}
async function finishCurrent(maximum = true) {
  let expected = Number(await read('#score'));
  while (await evaluate('return Boolean(document.querySelector("#answer"))')) {
    expected += await answer(maximum);
    assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
    assert.equal(await evaluate('return Boolean(document.querySelector("#again"))'), false);
    if ((await read('.round-top > span')).startsWith('07'))
      assert.match(await read('#next'), /Surface/);
    if (await evaluate('return Boolean(document.querySelector("#next"))')) await click('#next');
  }
  assert.ok(await evaluate('return Boolean(document.querySelector("#again"))'));
  assert.equal(Number(await read('#score')), expected);
  return expected;
}
async function geometry(width, height) {
  await call('viewport', String(width), String(height), '--tab', tab);
  const values = await evaluate(
    `return {width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('#ocean').getBoundingClientRect().toJSON(),viewportHeight:innerHeight,boxes:[...document.querySelectorAll('#answer,.submit-answer,#timer,#skip')].map(el=>{const b=el.getBoundingClientRect();return {tag:el.id||el.tagName,x:b.x,right:b.right,width:b.width,height:b.height}})}`,
  );
  assert.ok(values.scroll <= values.width + 1, `No overflow at ${width}`);
  assert.equal(values.canvas.x, 0);
  assert.equal(values.canvas.y, 0);
  assert.ok(Math.abs(values.canvas.width - width) < 1);
  assert.ok(Math.abs(values.canvas.height - values.viewportHeight) < 1);
  assert.ok(
    values.boxes.every(
      (box) => box.x >= 0 && box.right <= width + 1 && box.width > 0 && box.height >= 0,
    ),
  );
  pass(`responsive ${width}×${height}, input and timer in horizontal bounds`);
}
try {
  await call('open', `${base}/dive`, '--tab', tab);
  await call('wait', '--js', 'document.querySelector("#begin") != null', '--tab', tab);
  assert.equal(await evaluate('return document.title'), 'Randy Ren');
  assert.equal(await evaluate('return document.querySelectorAll("iframe").length'), 0);
  assert.equal(await evaluate('return location.pathname'), '/dive');
  pass('Next /dive serves the working game directly without an iframe');
  await call('open', `${base}/dive/index.html`, '--tab', tab);
  await wait('#begin');
  await call('viewport', '1440', '1000', '--tab', tab);
  await settle();
  await call('screenshot', path.join(output, 'desktop-home.png'), '--tab', tab);
  await click('[data-dialog="help"]');
  assert.equal(await evaluate('return document.querySelector("#help").open'), true);
  await call('press', 'Escape', '--tab', tab);
  pass('instructions dialog opens and closes by keyboard');
  await click('#begin');
  await wait('#answer');
  const firstPrompt = await read('#prompt');
  assert.ok(
    Number.parseFloat(
      await evaluate('return getComputedStyle(document.querySelector("#prompt")).fontSize'),
    ) <= 44,
  );
  pass('desktop question stays at or below 44px');
  const initialDeadline = await evaluate(
    'return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDaily.deadline',
  );
  await call('fill', '#answer', 'xyzzy nonexistent choice', '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  assert.equal(await read('#prompt'), firstPrompt);
  assert.match(await read('#answer-message'), /Try another/);
  assert.equal(
    await evaluate('return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDaily.deadline'),
    initialDeadline,
  );
  pass('unrecognized answer can retry while the same clock keeps running');
  await evaluate(`
    const ctx=document.querySelector('#ocean').getContext('2d');
    window.__cameraTrace={start:0,samples:[]};window.__cameraDraw=ctx.drawImage;
    document.querySelector('.answer-form').addEventListener('submit',()=>window.__cameraTrace.start=performance.now(),{capture:true,once:true});
    ctx.drawImage=function(image,x,y,...rest){const tr=window.__cameraTrace,now=performance.now();if(tr.start&&image.width===2&&image.height===256&&(!tr.samples.length||now-tr.samples.at(-1).t>5))tr.samples.push({t:now,top:y});return window.__cameraDraw.call(this,image,x,y,...rest)};
    return true;
  `);
  await answer();
  await wait('#next');
  const camera = await evaluate(`
    await new Promise(resolve=>{function step(t){if(t-window.__cameraTrace.start<800)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});
    const trace=window.__cameraTrace;
    document.querySelector('#ocean').getContext('2d').drawImage=window.__cameraDraw;
    return {samples:trace.samples.map(s=>({ms:s.t-trace.start,top:s.top})),expected:innerHeight*.25-innerHeight*1.32/7};
  `);
  const arrived = camera.samples.find((s) => Math.abs(s.top - camera.expected) < 0.25);
  assert.ok(
    arrived && arrived.ms <= 750,
    `Actual camera should arrive within750ms: ${JSON.stringify(arrived)}`,
  );
  assert.ok(camera.samples.length >= 25);
  writeFileSync(path.join(output, 'camera-samples.json'), JSON.stringify(camera, null, 2));
  pass('native answer moves the rendered waterline to1000m within750ms');
  assert.equal(await evaluate('return document.documentElement.dataset.input'), 'pointer');
  assert.equal(
    await evaluate('return getComputedStyle(document.querySelector("#next")).outlineStyle'),
    'none',
  );
  pass('answer submission and programmatic focus leave no pointer outline');
  await call('press', 'Tab', '--tab', tab);
  const keyboardOutline = await evaluate(
    'document.querySelector("#next").focus(); return {mode:document.documentElement.dataset.input,hasFocus:document.hasFocus(),matches:document.querySelector("#next").matches(":focus"),style:getComputedStyle(document.querySelector("#next")).outlineStyle}',
  );
  assert.equal(keyboardOutline.mode, 'keyboard');
  writeFileSync(
    path.join(output, 'keyboard-focus-coverage.json'),
    JSON.stringify(keyboardOutline, null, 2),
  );
  if (keyboardOutline.hasFocus && keyboardOutline.matches) {
    assert.equal(keyboardOutline.style, 'solid');
    pass('keyboard input preserves a visible focus indicator');
  } else {
    pass('keyboard events select keyboard modality');
    process.stdout.write(
      'LIMIT native keyboard focus ring not observed: headless document.hasFocus=false\n',
    );
  }
  await call('reload', '--tab', tab);
  await wait('#begin');
  assert.match(await read('#begin'), /Resume/);
  await click('#begin');
  await wait('#next');
  assert.equal(Number(await read('#score')), 100);
  pass('daily answer and feedback survive reload without restart');
  await click('#next');
  await call('fill', '#answer', 'typed answer stays', '--tab', tab);
  await call('open', `${base}/dive/index.html`, '--tab', 'sound-check');
  await call('wait', '--selector', '#sound', '--tab', 'sound-check');
  await call('click', '#sound', '--tab', 'sound-check');
  assert.equal(
    await evaluate('return document.querySelector("#answer").value'),
    'typed answer stays',
  );
  await call('tab', 'close', 'sound-check');
  pass('sound change in another tab preserves a typed answer');
  await answer();
  await click('#next');
  const deadline = await evaluate(
    'return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDaily.deadline',
  );
  await call('reload', '--tab', tab);
  await wait('#begin');
  await click('#begin');
  assert.equal(
    await evaluate('return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDaily.deadline'),
    deadline,
  );
  process.stdout.write('Waiting for one real 25-second question timer…\n');
  await wait('#next', 28);
  assert.match(await read('.feedback-title'), /CLOCK/);
  assert.equal(Number(await read('#score')), 200);
  pass('absolute deadline survives reload and real expiry records zero once');
  await click('#next');
  const dailyScore = await finishCurrent();
  assert.equal(dailyScore, 600);
  await click('#return');
  await call('reload', '--tab', tab);
  await wait('#begin');
  assert.match(await read('#begin'), /View/);
  assert.equal(Number(await read('#best')), dailyScore);
  await click('#begin');
  await call('reload', '--tab', tab);
  assert.equal(
    await evaluate('return JSON.parse(localStorage.getItem("randy-dive-v1")).played'),
    1,
  );
  pass('completed daily locks, high score survives reload, result counted once');
  await click('#unlimited-mode');
  await click('#begin');
  const unlimitedQuestions = await evaluate('return document.querySelector("#prompt").textContent');
  const perfect = await finishCurrent();
  assert.equal(perfect, 700);
  assert.equal(Number((await read('#scene-depth')).replaceAll(',', '')), 7000);
  assert.equal(Number(await read('#best')), 700);
  await call('screenshot', path.join(output, 'perfect-result.png'), '--tab', tab);
  pass('unlimited seven-answer perfect run reaches 700 points and 7000 metres');
  await click('#again');
  const lower = await finishCurrent(false);
  assert.ok(lower < 700);
  assert.equal(Number(await read('#best')), 700);
  const saved = await evaluate('return JSON.parse(localStorage.getItem("randy-dive-v1"))');
  assert.equal(saved.played, 3);
  assert.notEqual(saved.history[0].id, saved.history[1].id);
  assert.notDeepEqual(saved.history[0].questions, saved.history[1].questions);
  pass('fresh unlimited runs vary, lower score keeps best and stats count three runs');
  await click('#return');
  await click('[data-dialog="themes"]');
  const themeLabels = await evaluate(
    'return [...document.querySelectorAll("[data-theme]")].map(el=>({id:el.dataset.theme,text:el.textContent}))',
  );
  for (const category of CATEGORIES) {
    const count = PLAYABLE_QUESTIONS.filter((question) => question.category === category.id).length;
    assert.ok(themeLabels.find((label) => label.id === category.id)?.text.includes(`${count} PROMPTS`));
  }
  const category = await evaluate('return document.querySelector("[data-theme]").dataset.theme');
  await click('[data-theme]');
  await click('#begin');
  const prompt = await read('#prompt');
  assert.equal(QUESTIONS.find((item) => item.prompt === prompt).category, category);
  pass('themed dive draws from selected category');
  for (const [width, height] of [
    [1440, 1000],
    [768, 1024],
    [390, 844],
    [320, 740],
    [844, 390],
  ])
    await geometry(width, height);
  await call('viewport', '390', '844', '--tab', tab);
  await settle();
  await call('screenshot', path.join(output, 'mobile-active.png'), '--tab', tab);
  await call('viewport', '1440', '1000', '--tab', tab);
  await click('#daily-mode');
  await click('[data-dialog="archive"]');
  const archiveKey = await evaluate('return document.querySelector("[data-date]").dataset.date');
  await click('[data-date]');
  await click('#begin');
  assert.equal(
    await evaluate(
      'return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDaily.run.dateKey',
    ),
    archiveKey,
  );
  pass('archive starts an independent historical daily puzzle');
  await click('#daily-mode');
  // Controlled browser-clock fixture: the actual public Begin action must follow UTC rollover.
  await evaluate(
    'window.OriginalDate=Date; window.Date=class extends OriginalDate {constructor(...args){super(...(args.length?args:[OriginalDate.now()+86400000]));} static now(){return OriginalDate.now()+86400000;}}; return true',
  );
  await click('#begin');
  const clockKey = await evaluate('return new Date().toISOString().slice(0,10)');
  assert.equal(
    await evaluate(
      'return JSON.parse(localStorage.getItem("randy-dive-v1")).activeDaily.run.dateKey',
    ),
    clockKey,
  );
  assert.ok(
    await evaluate(
      `return Boolean(JSON.parse(localStorage.getItem('randy-dive-v1')).activeDailies[${JSON.stringify(archiveKey)}])`,
    ),
  );
  await evaluate('window.Date=window.OriginalDate; return true');
  pass('open home follows UTC rollover; historical unfinished dive remains saved');
  const legacyIds = new Set(LEGACY_QUESTIONS.map((q) => q.id));
  assert.ok(encountered.some((id) => !legacyIds.has(id)));
  pass('native unlimited play uses expanded prompts and theme choices show full pool sizes');
  const errors = await call('console', '--level', 'error', '--tab', tab);
  assert.equal(errors.count, 0);
  writeFileSync(path.join(output, 'console.json'), JSON.stringify(errors, null, 2));
  writeFileSync(
    path.join(output, 'receipt.json'),
    JSON.stringify(
      {
        base,
        firstPrompt,
        unlimitedQuestions,
        encountered,
        checks,
        passed: checks.length,
        testedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  process.stdout.write(`PASS ${checks.length} browser checks. Evidence: ${output}\n`);
} catch (error) {
  writeFileSync(path.join(output, 'failure.txt'), error.stack);
  throw error;
} finally {
  await exec('umbra', ['--profile', profile, 'stop']).catch(() => {});
}
