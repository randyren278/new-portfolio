const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

test('latest Base-labelled workout reaches the view through the real loader', async () => {
  const P = await import('../src/training/coros/parse.ts');
  const D = await import('../src/training/derive.ts');
  const month = JSON.parse(
    readFileSync(path.join(__dirname, '../src/training/fixtures/laps-2026-09-21-to-10-20.json')),
  );
  const calls = [];
  let lapType = 2;
  const records = month
    .map(
      (r, i) =>
        `${i + 1}. Outdoor Run — ${r.date}\nLabelId: ${r.labelId} | SportType: 100\nstartTimestamp=${Date.parse(`${r.date}T12:00:00-07:00`) / 1000}\nDuration: 1:00:00\nDistance: ${r.km} km`,
    )
    .join('\n');
  const client = {
    call: async (tool, args) => {
      calls.push({ tool, ...args });
      if (tool === 'querySportRecords') return records;
      const run = month.find((r) => r.labelId === args?.labelId);
      if (tool === 'getActivityDetail')
        return `Training Focus: ${run.focus ?? 'Recovery'}\nAnaerobic TE: ${run.anaerobicTE}`;
      if (tool === 'queryActivityLapData')
        return JSON.stringify({
          lapGroups: [
            {
              type: lapType,
              laps: run.laps.map((l) => ({ distance: l.km * 100000, time: l.sec })),
            },
          ],
        });
      return '';
    },
  };
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : ['2026-10-20T22:00:00Z']));
    }
  }
  const module = { exports: {} };
  const source = readFileSync(
    process.env.TRAINING_LOAD_TEST_SOURCE ?? path.join(__dirname, '../src/training/load.ts'),
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    Date: Clock,
    Intl,
    console,
    process: { env: {} },
    require(id) {
      if (id === '@/strava/client') return { fetchActivitiesSince: async () => [] };
      if (id === '@/strava/polyline') return {};
      if (id === 'next/cache') return { unstable_cache: (fn) => fn };
      if (id === './cache') return { cached: (_key, _ttl, fetch) => fetch() };
      if (id === './coros/auth') return { getCorosToken: async () => 'stub' };
      if (id === './coros/mcp') return { connectCoros: async () => client };
      if (id === './coros/parse') return P;
      if (id === './derive') return D;
      if (id.startsWith('node:')) return require(id);
      throw new Error(`Unexpected loader dependency: ${id}`);
    },
  });
  const view = await module.exports.loadTrainingView();
  assert.equal(view.session?.date, '2026-10-20');
  assert.equal(view.session?.title, '4 × 8:00');
  assert.equal(view.session?.focus, 'Base', 'preserve COROS focus separately from lap structure');
  assert.equal(
    calls.filter((c) => c.tool === 'queryActivityLapData').length,
    1,
    'newest session is found without scanning older workouts',
  );
  lapType = 10;
  const auto = await module.exports.loadTrainingView();
  assert.equal(auto.session, null, 'automatic splits alone do not establish work intervals');
});
