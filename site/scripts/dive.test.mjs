import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../public/dive/questions.mjs';
import {
  createRun,
  dayKey,
  dailyNumber,
  evaluateAnswer,
  recordAnswer,
  finishRun,
  loadProgress,
  saveProgress,
  STORAGE_KEY,
  ROUND_COUNT,
  MAX_SCORE,
} from '../public/dive/model.mjs';

function memory(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    value: () => value,
  };
}
function complete(run) {
  while (!run.complete) run = recordAnswer(run, run.questions[run.round].answers[0].name);
  return run;
}

test('UTC day rollover and validated puzzle numbers', () => {
  assert.equal(dayKey(new Date('2026-11-05T23:59:59-08:00')), '2026-11-06');
  assert.equal(dailyNumber('2026-11-05') + 1, dailyNumber('2026-11-06'));
  assert.throws(() => createRun({ dateKey: '2026-02-30' }), RangeError);
  assert.throws(() => dayKey(new Date('bad')), RangeError);
});

test('same UTC daily has seven distinct deterministic questions independent of category or seed', () => {
  const first = createRun({ dateKey: '2026-11-05' });
  const second = createRun({
    dateKey: '2026-11-05',
    seed: 'ignored',
    category: 'ignored',
  });
  assert.deepEqual(first, second);
  assert.equal(first.questions.length, ROUND_COUNT);
  assert.equal(new Set(first.questions.map((q) => q.id)).size, ROUND_COUNT);
  const next = createRun({ dateKey: '2026-11-06' });
  assert.notDeepEqual(
    first.questions.map((q) => q.id),
    next.questions.map((q) => q.id),
  );
});

test('unlimited uses reproducible explicit seeds, fresh omitted seeds and selected category', () => {
  const options = {
    mode: 'unlimited',
    seed: 'repeatable',
    dateKey: '2026-11-05',
  };
  assert.deepEqual(createRun(options), createRun(options));
  assert.notEqual(createRun({ mode: 'unlimited' }).id, createRun({ mode: 'unlimited' }).id);
  const category = QUESTIONS[0].category;
  assert.ok(createRun({ ...options, category }).questions.every((q) => q.category === category));
  assert.throws(() => createRun({ mode: 'unlimited', category: 'no-such-category' }), RangeError);
});

test('answer matching tolerates formatting, accents, aliases, plurality and a unique small typo', () => {
  const question = {
    answers: [
      { name: 'Café racer', score: 45, aliases: ['motorbike'] },
      { name: 'Blue whale', score: 63 },
      { name: 'Giant squid', score: 91 },
    ],
  };
  assert.equal(evaluateAnswer(question, ' THE CAFÉ-RACER! ').canonical, 'Café racer');
  assert.equal(evaluateAnswer(question, 'motorbike').score, 45);
  assert.equal(evaluateAnswer(question, 'blue whales').canonical, 'Blue whale');
  assert.equal(evaluateAnswer(question, 'giant sqiud').canonical, 'Giant squid');
  assert.equal(evaluateAnswer(question, 'giant').valid, false);
  assert.equal(evaluateAnswer(question, 'squid').valid, false);
  assert.equal(evaluateAnswer(question, '').kind, 'blank');
  assert.equal(evaluateAnswer(question, 'not an answer').kind, 'invalid');
  assert.equal(evaluateAnswer(question, 'x'.repeat(81)).valid, false);
});

test('ambiguous typos never pick an arbitrary accepted answer', () => {
  const question = {
    answers: [
      { name: 'beach', score: 10 },
      { name: 'peach', score: 90 },
    ],
  };
  assert.equal(evaluateAnswer(question, 'reach').valid, false);
  assert.equal(evaluateAnswer(question, 'peach').score, 90);
});

test('seven immutable submissions score once, timeout discards input, complete cannot advance', () => {
  const original = createRun({ dateKey: '2026-11-05' });
  let run = recordAnswer(original, original.questions[0].answers[0].name);
  assert.equal(original.round, 0);
  assert.equal(original.answers.length, 0);
  assert.equal(run.round, 1);
  run = recordAnswer(run, run.questions[1].answers[0].name, { timedOut: true });
  assert.equal(run.answers[1].kind, 'timeout');
  assert.equal(run.answers[1].score, 0);
  run = complete(run);
  assert.equal(run.round, ROUND_COUNT);
  assert.equal(run.answers.length, ROUND_COUNT);
  assert.equal(
    run.score,
    run.answers.reduce((sum, answer) => sum + answer.score, 0),
  );
  assert.ok(run.score <= MAX_SCORE);
  assert.equal(recordAnswer(run, 'again'), run);
});

test('finishing is idempotent, high score reloads, and serialized questions are references', () => {
  const storage = memory();
  const run = complete(createRun({ dateKey: '2026-11-05' }));
  let progress = finishRun(loadProgress(storage), run);
  assert.equal(progress.best, run.score);
  assert.equal(progress.played, 1);
  assert.equal(progress.daily[run.dateKey].score, run.score);
  assert.equal(finishRun(progress, run), progress);
  assert.equal(saveProgress(storage, progress), true);
  const raw = JSON.parse(storage.value());
  assert.deepEqual(Object.keys(raw.history[0].questions[0]), ['id']);
  progress = loadProgress(storage);
  assert.equal(progress.best, run.score);
  assert.equal(progress.history[0].questions[0].answers.length, run.questions[0].answers.length);
  assert.equal(progress.played, 1);
  assert.equal(finishRun(progress, run), progress);
});

test('completion ledger prevents recounting old unlimited dives after thirty history entries', () => {
  let progress = loadProgress(memory());
  const first = complete(createRun({ mode: 'unlimited', seed: 'first' }));
  progress = finishRun(progress, first);
  for (let i = 0; i < 35; i++)
    progress = finishRun(progress, complete(createRun({ mode: 'unlimited', seed: `run-${i}` })));
  assert.equal(progress.history.length, 30);
  assert.equal(progress.played, 36);
  assert.equal(finishRun(progress, first), progress);
});

test('incomplete or tampered complete runs cannot change score statistics', () => {
  const progress = loadProgress(memory());
  const incomplete = createRun();
  assert.equal(finishRun(progress, incomplete), progress);
  const run = complete(incomplete);
  assert.equal(finishRun(progress, { ...run, score: 700 }), progress);
  const forged = structuredClone(run);
  forged.answers[0].score = 100;
  assert.equal(finishRun(progress, forged), progress);
});

test('corrupt, unavailable and malformed browser storage recover safely', () => {
  assert.equal(loadProgress(memory('{oops')).best, 0);
  assert.equal(
    loadProgress({
      getItem() {
        throw Error('blocked');
      },
    }).played,
    0,
  );
  assert.equal(
    saveProgress(
      {
        setItem() {
          throw Error('quota');
        },
      },
      loadProgress(memory()),
    ),
    false,
  );
  assert.equal(saveProgress(null, loadProgress(memory())), false);
  const bad = {
    version: 1,
    best: 9000,
    played: -4,
    total: Infinity,
    daily: { __proto__: {} },
    history: [null, { score: 999 }],
  };
  const clean = loadProgress(memory(JSON.stringify(bad)));
  assert.equal(clean.best, 0);
  assert.equal(clean.played, 0);
  assert.equal(clean.total, 0);
  assert.deepEqual(clean.history, []);
});

test('active daily restores canonical questions and feedback but rejects invalid shapes', () => {
  const storage = memory();
  const run = recordAnswer(createRun({ dateKey: '2026-11-05' }), '');
  const progress = {
    ...loadProgress(storage),
    activeDaily: { run, deadline: 0, feedback: true },
  };
  assert.equal(saveProgress(storage, progress), true);
  const clean = loadProgress(storage);
  assert.equal(clean.activeDaily.feedback, true);
  assert.equal(clean.activeDaily.run.round, 1);
  assert.equal(
    clean.activeDaily.run.questions[0],
    QUESTIONS.find((q) => q.id === run.questions[0].id),
  );
  const bad = structuredClone(progress);
  bad.activeDaily.run.questions[0].id = 'does-not-exist';
  assert.equal(loadProgress(memory(JSON.stringify(bad))).activeDaily, null);
  const wrongMode = {
    ...progress,
    activeDaily: { run: createRun({ mode: 'unlimited' }), deadline: 100 },
  };
  assert.equal(loadProgress(memory(JSON.stringify(wrongMode))).activeDaily, null);
  const absurdDeadline = {
    ...progress,
    activeDaily: { run, deadline: Number.MAX_VALUE },
  };
  assert.ok(
    loadProgress(memory(JSON.stringify(absurdDeadline))).activeDaily.deadline <= Date.now() + 25000,
  );
});

test('separate dates preserve independent active questions and feedback across reload', () => {
  const storage = memory();
  const today = createRun({ dateKey: '2026-11-05' });
  const yesterday = recordAnswer(createRun({ dateKey: '2026-11-04' }), '');
  const activeToday = {
    run: today,
    deadline: Date.now() + 20000,
    feedback: false,
  };
  const activeYesterday = { run: yesterday, deadline: 0, feedback: true };
  const progress = {
    ...loadProgress(storage),
    activeDaily: activeToday,
    activeDailies: { '2026-11-05': activeToday, '2026-11-04': activeYesterday },
  };
  assert.equal(saveProgress(storage, progress), true);
  const raw = JSON.parse(storage.value());
  assert.deepEqual(Object.keys(raw.activeDailies['2026-11-04'].run.questions[0]), ['id']);
  const clean = loadProgress(storage);
  assert.equal(Object.keys(clean.activeDailies).length, 2);
  assert.equal(clean.activeDailies['2026-11-04'].feedback, true);
  assert.equal(clean.activeDailies['2026-11-04'].run.round, 1);
  assert.equal(clean.activeDailies['2026-11-05'].feedback, false);
  assert.equal(clean.activeDaily.run.dateKey, '2026-11-05');
});

test('legacy active daily migrates, wrong-date map entries reject, canonical map wins conflicts', () => {
  const run = createRun({ dateKey: '2026-11-05' });
  const legacy = { run, deadline: 0, feedback: false };
  const source = { ...loadProgress(null), activeDaily: legacy };
  const migrated = loadProgress(memory(JSON.stringify(source)));
  assert.equal(migrated.activeDailies['2026-11-05'].run.id, run.id);
  const advanced = { run: recordAnswer(run, ''), deadline: 0, feedback: true };
  const clean = loadProgress(
    memory(
      JSON.stringify({
        ...source,
        activeDailies: { '2026-11-04': legacy, '2026-11-05': advanced },
      }),
    ),
  );
  assert.equal(clean.activeDailies['2026-11-04'], undefined);
  assert.equal(clean.activeDaily.run.round, 1);
  assert.equal(clean.activeDaily.feedback, true);
});

test('finishing one daily removes only its active date and keeps the other expedition', () => {
  const run = createRun({ dateKey: '2026-11-05' });
  const archive = createRun({ dateKey: '2026-11-04' });
  const activeToday = { run, deadline: Date.now() + 20000, feedback: false };
  const activeArchive = { run: archive, deadline: 0, feedback: false };
  const progress = {
    ...loadProgress(null),
    activeDaily: activeToday,
    activeDailies: { '2026-11-05': activeToday, '2026-11-04': activeArchive },
  };
  const finished = finishRun(progress, complete(run));
  assert.equal(finished.activeDailies['2026-11-05'], undefined);
  assert.equal(finished.activeDailies['2026-11-04'].run.id, archive.id);
  assert.equal(finished.activeDaily.run.id, archive.id);
  const storage = memory();
  saveProgress(storage, finished);
  assert.equal(loadProgress(storage).activeDailies['2026-11-04'].run.id, archive.id);
  assert.equal(loadProgress(storage).activeDailies['2026-11-05'], undefined);
});

test('current bank supports four themes, consistent matching and the best available dive', () => {
  assert.ok(QUESTIONS.length >= 70);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  for (const category of new Set(QUESTIONS.map((q) => q.category))) {
    assert.ok(QUESTIONS.filter((q) => q.category === category).length >= 14);
  }
  for (const question of QUESTIONS) {
    assert.ok(
      question.answers.every((a) => Number.isInteger(a.score) && a.score > 0 && a.score <= 100),
    );
    assert.ok(Math.max(...question.answers.map((a) => a.score)) >= 65);
    for (const answer of question.answers) {
      assert.equal(evaluateAnswer(question, answer.name).score, answer.score);
      for (const alias of answer.aliases ?? [])
        assert.equal(evaluateAnswer(question, alias).score, answer.score);
    }
  }
  let run = createRun({ mode: 'unlimited', seed: 'perfect' });
  const availableBest = run.questions.reduce((sum, q) => sum + Math.max(...q.answers.map((a) => a.score)), 0);
  while (!run.complete) {
    const best = run.questions[run.round].answers.reduce((best, answer) => answer.score > best.score ? answer : best);
    run = recordAnswer(run, best.name);
  }
  assert.equal(run.score, availableBest);
  assert.ok(run.score <= MAX_SCORE);
});
