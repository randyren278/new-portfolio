export type TypewriterHandle = { skip(): void; done: Promise<void> };
export type TypewriterOpts = {
  msPerChar?: number;
  jitterMs?: number;
  holdOn?: RegExp;
  holdMs?: number;
  signal?: AbortSignal;
};

function seededJitter(i: number, max: number): number {
  // deterministic LCG in [-max, +max), matching the prototype
  const seed = ((i * 9301 + 49297) % 233280) / 233280;
  return (seed - 0.5) * 2 * max;
}

export function typeInto(el: HTMLElement, text: string, opts: TypewriterOpts = {}): TypewriterHandle {
  const { msPerChar = 20, jitterMs = 4, holdOn = /[.,;:!?]/, holdMs = 80, signal } = opts;
  let cancelled = false;
  let skipped = false;
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stepRef: () => void = () => {};

  el.textContent = '';

  let resolvePromise: (() => void) | null = null;
  const done = new Promise<void>((resolve) => {
    resolvePromise = resolve;
    function step() {
      if (cancelled) return resolve();
      if (skipped) {
        el.textContent = text;
        return resolve();
      }
      if (i >= text.length) return resolve();
      const ch = text.charAt(i);
      el.textContent += ch;
      const isHold = holdOn.test(ch);
      let base = isHold ? holdMs : msPerChar;
      const jit = seededJitter(i, jitterMs);
      if (ch === '—') base += 60;
      if (ch === '\n') base += 80;
      i += 1;
      timer = setTimeout(step, Math.max(0, base + jit));
    }
    stepRef = step;
    step();
  });

  if (signal) {
    signal.addEventListener('abort', () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      resolvePromise?.();
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
