import { climb } from './bot.js';
// Plays the game's climb ahead of it with the bot and posts each decision, at most AHEAD past
// the last one the game took: over ten seconds of climbing. Most searches take 20 ms, but a rare
// one takes seconds, longer on a phone, and the lead absorbs it.
const AHEAD = 24;
let decisions = null,
  made = 0,
  taken = 0;
addEventListener('message', ({ data }) => {
  if (data.run) decisions = climb(data.run, data.fallLimit);
  else taken = data.taken;
  while (made - taken < AHEAD) {
    const next = decisions.next();
    if (next.done) return;
    postMessage({ at: next.value.at, plan: next.value.plan });
    made++;
  }
});
