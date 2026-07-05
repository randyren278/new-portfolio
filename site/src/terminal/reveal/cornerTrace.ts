import { CONTENT_AT, FRAME_MS } from './cadences';

export type TraceOpts = {
  durationMs?: number;
  onContent?: () => void;
  signal?: AbortSignal;
};

export function traceCorners(svg: SVGSVGElement, opts: TraceOpts = {}): Promise<void> {
  const { durationMs = FRAME_MS, onContent, signal } = opts;
  const corners = Array.from(svg.querySelectorAll<SVGPathElement>('path.corner'));
  if (corners.length === 0) return Promise.resolve();

  const stagger = Math.min(80, durationMs / (corners.length * 4));
  const perDuration = durationMs - stagger * (corners.length - 1);

  return new Promise((resolve) => {
    let cancelled = false;
    if (signal) signal.addEventListener('abort', () => { cancelled = true; resolve(); });

    corners.forEach((path, idx) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.style.transition = 'none';
      // force reflow so the transition takes effect
      void path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${perDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * stagger}ms`;
      requestAnimationFrame(() => {
        if (cancelled) return;
        path.style.strokeDashoffset = '0';
      });
    });

    if (onContent) setTimeout(() => { if (!cancelled) onContent(); }, durationMs * CONTENT_AT);
    setTimeout(() => { if (!cancelled) resolve(); }, durationMs + 40);
  });
}
