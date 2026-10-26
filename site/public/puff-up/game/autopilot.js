import { decides, stateKey, steer } from './bot.js';
/** Lets the bot steer `run`. A search can take a while, so a worker plays the climb ahead of the
 * game (see bot-worker.js) and the game takes one decision per landing, checked to be made in the
 * exact state it has reached. If the next decision hasn't come, the game holds the climb. */
export function createAutopilot(run, fallLimit) {
  let worker = null,
    waiting = [],
    decision = null,
    tick = 0,
    taken = 0;
  function stop() {
    if (!worker) return;
    worker.onmessage = null;
    worker.terminate();
  }
  function fly(from) {
    stop();
    waiting = [];
    taken = 0;
    worker = new Worker(new URL('./bot-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => waiting.push(e.data);
    worker.postMessage({ run: from, fallLimit });
  }
  fly(run);
  return {
    /** Whether the game may step `run`: false while the decision it needs is still coming. */
    ready(run) {
      if (decision) return true;
      const next = waiting.shift();
      if (!next) return false;
      // The worker's climb has drifted from the game's: it starts again from here.
      if (next.at !== stateKey(run)) {
        fly(run);
        return false;
      }
      decision = next;
      tick = 0;
      worker.postMessage({ taken: ++taken });
      return true;
    },
    get axis() {
      return steer(decision?.plan, tick);
    },
    /** After each step: a landing ends the decision it was flown with. */
    stepped(run) {
      tick++;
      if (decides(run)) decision = null;
    },
    stop,
  };
}
