import { ANIMATIONS } from './puff-motion.js';
import { DEFAULT_TUNING } from './physics.js';
import { SPRING_SPEED } from './climb.js';

const boost = ANIMATIONS.find((a) => a.id === 'boost');
const boostAscentMs = (SPRING_SPEED / DEFAULT_TUNING.gravity) * 1000;
export function sampleGameVisual(run) {
  const p = run.player;
  if (!p.grounded) {
    if (run.lastLanding?.kind === 'spring' && p.vy < 0) {
      return {
        animation: 'boost',
        time: Math.min(
          boost.durationMs - 1,
          ((p.timeMs - run.lastLanding.at) / boostAscentMs) * boost.durationMs,
        ),
      };
    }
    if (p.vy < 20)
      return {
        animation: 'jump',
        time: 250 + (1 - Math.min(1, Math.abs(p.vy) / DEFAULT_TUNING.jumpSpeed)) * 480,
      };
    return { animation: 'fall', time: p.timeMs };
  }
  return { animation: p.motion === 'idle' ? 'turn' : p.motion, time: p.timeMs };
}
