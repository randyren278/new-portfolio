import { climb } from './bot.js';
// Plays the game's climb ahead of it with the bot and posts each decision, at most AHEAD past
// the last one the game took: over ten seconds of climbing. Most searches take 20 ms, but a rare
// one takes seconds, longer on a phone, and the lead absorbs it. The game keeps this worker for
// the page and names each climb it asks for, so a decision for an earlier climb is never taken.
const AHEAD = 24;
let current = null;
// One decision per task, so a new climb never waits behind the last one's lead.
const next = new MessageChannel();
next.port1.onmessage = () => {
  if (!current || current.made - current.taken >= AHEAD) return;
  const decision = current.decisions.next();
  if (decision.done) return;
  postMessage({ id: current.id, at: decision.value.at, plan: decision.value.plan });
  current.made++;
  next.port2.postMessage(null);
};
addEventListener('message', ({ data }) => {
  if (data.run)
    current = {
      id: data.id,
      decisions: climb(data.run, data.fallLimit, data.wait),
      made: 0,
      taken: 0,
    };
  else if (data.stop === current?.id) current = null;
  else if (data.id === current?.id) current.taken = data.taken;
  next.port2.postMessage(null);
});
