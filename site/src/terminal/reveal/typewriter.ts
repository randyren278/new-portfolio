export type TypewriterHandle = { skip(): void; done: Promise<void> };
export type TypewriterOpts = {
  msPerChar?: number;
  jitterMs?: number;
  holdOn?: RegExp;
  holdMs?: number;
  signal?: AbortSignal;
};

function seededJitter(seed: number, max: number): number {
  // deterministic in [-max, +max]
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = s - Math.floor(s);
  return (frac * 2 - 1) * max;
}

export function typeInto(el: HTMLElement, text: string, opts: TypewriterOpts = {}): TypewriterHandle {
  const { msPerChar = 20, jitterMs = 4, holdOn = /[.,;:]/, holdMs = 80, signal } = opts;
  let cancelled = false;
  let skipped = false;
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stepRef: () => void = () => {};

  el.textContent = '';

  const done = new Promise<void>((resolve) => {
    function step() {
      if (cancelled) return resolve();
      if (skipped) {
        el.textContent = text;
        return resolve();
      }
      if (i >= text.length) return resolve();
      const ch = text.charAt(i);
      el.textContent += ch;
      i += 1;
      const isHold = holdOn.test(ch);
      const base = isHold ? holdMs : msPerChar;
      const jit = seededJitter(i, jitterMs);
      timer = setTimeout(step, Math.max(0, base + jit));
    }
    stepRef = step;
    step();
  });

  if (signal) {
    signal.addEventListener('abort', () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    });
  }

  return {
    skip() {
      skipped = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(stepRef, 0);
    },
    done
  };
}
