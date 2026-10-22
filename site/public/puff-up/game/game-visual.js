import { ANIMATIONS } from './puff-motion.js';
import { DEFAULT_TUNING } from './physics.js';
import { SPRING_SPEED, ROCKET_IGNITE_MS, rocketMs } from './climb.js';

const boost = ANIMATIONS.find((a) => a.id === 'boost'),
  rocket = ANIMATIONS.find((a) => a.id === 'rocket');
const boostAscentMs = (SPRING_SPEED / DEFAULT_TUNING.gravity) * 1000;
export function sampleGameVisual(run) {
  const p = run.player;
  // The rocket's clip spans its whole flight, ignition to touchdown. Its beats sit at fixed
  // shares of the clip (let go at 0.19, the top of the climb at 0.92), so a higher, longer climb
  // stretches only its middle.
  if (run.status === 'rocket') {
    const age = p.timeMs - run.rocket.at,
      top = ROCKET_IGNITE_MS + run.rocket.climb,
      u =
        age < ROCKET_IGNITE_MS
          ? (0.19 * age) / ROCKET_IGNITE_MS
          : age < top
            ? 0.19 + (0.73 * (age - ROCKET_IGNITE_MS)) / run.rocket.climb
            : 0.92 + 0.08 * Math.min(1, (age - top) / (rocketMs(run.rocket) - top));
    return { animation: 'rocket', time: Math.min(rocket.durationMs - 1, u * rocket.durationMs) };
  }
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
