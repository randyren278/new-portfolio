import { decides, stateKey, steer } from './bot.js';
// The bot's worker, started when the ★ is first switched on and kept for the page. A new worker
// for each climb fetched its modules and searched cold before its first decision, and the game
// held the climb for it: 100-300 ms at every handover.
let worker = null,
  climbs = 0;
/** Starts the bot's worker if it isn't running, ahead of the climb it will steer. */
export function warmBot() {
  worker ??= new Worker(new URL('./bot-worker.js', import.meta.url), { type: 'module' });
}
// The first hop of each climb goes straight up this many ticks while the game waits for it, so
// the game plays on instead of holding: most searches take 20 ms, a rare one over 100 ms.
const WAIT = 24;
/** Lets the bot steer `run`. A search can take a while, so the worker plays the climb ahead of the
 * game (see bot-worker.js) and the game takes one decision per landing, checked to be made in the
 * exact state it has reached. If the next decision hasn't come, the game holds the climb. */
export function createAutopilot(run, fallLimit) {
  let id = 0,
    waiting = [],
    decision = null,
    // Where the hop being flown began, ticks since, and how many of them may go by straight up
    // before its decision has to be in.
    from = null,
    tick = 0,
    grace = 0,
    taken = 0;
  warmBot();
  const listen = (e) => e.data.id === id && waiting.push(e.data);
  worker.addEventListener('message', listen);
  function fly(run) {
    id = ++climbs;
    waiting = [];
    taken = 0;
    from = stateKey(run);
    tick = 0;
    grace = WAIT;
    worker.postMessage({ run, fallLimit, id, wait: WAIT });
  }
  fly(run);
  return {
    /** Whether the game may step `run`: false while the decision it needs is still coming. */
    ready(run) {
      if (decision) return true;
      const next = waiting.shift();
      if (!next) return tick < grace;
      // The worker's climb has drifted from the game's: it starts again from here.
      if (next.at !== from) {
        fly(run);
        return true;
      }
      decision = next;
      grace = 0;
      worker.postMessage({ taken: ++taken, id });
      return true;
    },
    get axis() {
      return steer(decision?.plan, tick);
    },
    /** After each step: a landing ends the decision it was flown with. */
    stepped(run) {
      tick++;
      if (!decides(run)) return;
      decision = null;
      from = stateKey(run);
      tick = 0;
    },
    stop() {
      worker.removeEventListener('message', listen);
      worker.postMessage({ stop: id });
    },
  };
}
