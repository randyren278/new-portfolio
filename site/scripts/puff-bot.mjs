// Plays Puff Up with the search bot the game's ★ lets steer (public/puff-up/game/bot.js).
// CLI: node scripts/puff-bot.mjs [seeds=20] [metres=1200] [firstSeed=0] [fromMetres=0]
import { pathToFileURL } from 'node:url';
import { createRun, climbFrom, stepRun, ROCKET_STREAK } from '../public/puff-up/game/climb.js';
import { choose } from '../public/puff-up/game/bot.js';

export { choose };
export function playBot(seed, metres = 1200, from = 0) {
  let run = from ? climbFrom(seed, from) : createRun(seed),
    hops = 0;
  while (run.status === 'playing' && run.score < metres) {
    const plan = choose(run);
    if (!plan) break;
    // The bot climbs every metre itself, so a clear covers every zone: each streak lapses one
    // landing short of a rocket.
    if (run.streak === ROCKET_STREAK - 1) run = { ...run, streak: 0 };
    for (let t = 0; t < 240 && run.status === 'playing'; t++) {
      run = stepRun(run, { axis: t < plan.k ? plan.a : plan.b });
      if (run.player.landed) break;
    }
    hops++;
  }
  return { seed, metres: run.score, cleared: run.score >= metres, hops };
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [seeds = 20, metres = 1200, first = 0, from = 0] = process.argv.slice(2).map(Number);
  let failed = 0;
  for (let seed = first; seed < first + seeds; seed++) {
    const started = performance.now(),
      result = playBot(seed, metres, from);
    if (!result.cleared) failed++;
    console.log(JSON.stringify({ ...result, ms: Math.round(performance.now() - started) }));
  }
  console.log(JSON.stringify({ seeds, metres, cleared: seeds - failed, failed }));
  process.exitCode = failed ? 1 : 0;
}
