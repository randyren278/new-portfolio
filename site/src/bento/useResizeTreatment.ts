import { type RefObject, useLayoutEffect } from 'react';

/** Soften line wrapping during a width drag; glide only at column changes. */
export function useResizeTreatment(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Map<HTMLElement, Animation>();
    let previous: { x: number; y: number }[] = [];
    let columns = 0;
    let width = window.innerWidth;
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      clearTimeout(settle);
      grid.classList.remove('is-resizing');
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    };
    const measure = (resizing: boolean) => {
      const cells = Array.from(grid.children) as HTMLElement[];
      const count = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const changed = columns !== 0 && count !== columns;
      // Batch reads. Subtract any in-flight translation to retain CSS geometry.
      const measured = cells.map((cell) => {
        const rect = cell.getBoundingClientRect();
        const matrix = new DOMMatrix(getComputedStyle(cell).transform);
        return {
          x: rect.left - matrix.m41,
          y: rect.top - matrix.m42 + window.scrollY,
          width: rect.width,
          dx: matrix.m41,
          dy: matrix.m42,
        };
      });
      const eligible = resizing && !reduced.matches && !grid.closest('[inert]');
      if (eligible) {
        grid.classList.add('is-resizing');
        clearTimeout(settle);
        settle = setTimeout(() => grid.classList.remove('is-resizing'), changed ? 280 : 140);
        if (changed) {
          // A new breakpoint may interrupt a glide; ordinary resize events never
          // restart it. Keeping the current offset avoids a jump on reversal.
          for (const animation of animations.values()) animation.cancel();
          animations.clear();
          cells.forEach((cell, i) => {
            const old = previous[i];
            const target = measured[i];
            if (!old) return;
            const dx = Math.max(
              -target.x,
              Math.min(
                window.innerWidth - target.x - target.width,
                Math.max(-160, Math.min(160, old.x - target.x + target.dx)),
              ),
            );
            const dy = Math.max(-80, Math.min(80, old.y - target.y + target.dy));
            const animation = cell.animate(
              [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
              { duration: 260, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
            );
            animations.set(cell, animation);
            animation.onfinish = () => animations.delete(cell);
          });
        }
      } else if (resizing) stop();
      previous = measured;
      columns = count;
    };
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const widthChanged = width !== window.innerWidth;
        width = window.innerWidth;
        measure(widthChanged);
      });
    };
    measure(false);
    window.addEventListener('resize', onResize);
    reduced.addEventListener('change', stop);
    return () => {
      window.removeEventListener('resize', onResize);
      reduced.removeEventListener('change', stop);
      cancelAnimationFrame(frame);
      stop();
    };
  }, [ref]);
}
