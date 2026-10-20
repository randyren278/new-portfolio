// Pointer capture keeps steering continuous when a finger crosses the midpoint.
export function bindTouchSteering(canvas, { enabled, canSteer, onStart, onTap }) {
  const held = new Map();
  let newest = 0;
  const direction = (x) =>
    x < canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2 ? -1 : 1;
  const down = (e) => {
    if (!enabled(e) || !canSteer()) return;
    e.preventDefault();
    onStart();
    held.set(e.pointerId, { axis: direction(e.clientX), at: performance.now(), order: ++newest });
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const pointer = held.get(e.pointerId);
    if (!pointer) return;
    e.preventDefault();
    pointer.axis = direction(e.clientX);
  };
  const end = (e) => {
    const pointer = held.get(e.pointerId);
    if (!pointer) return;
    held.delete(e.pointerId);
    if (e.type === 'pointerup' && performance.now() - pointer.at < 100 && held.size === 0)
      onTap(pointer.axis);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
  return {
    get axis() {
      let latest = null;
      for (const pointer of held.values())
        if (!latest || pointer.order > latest.order) latest = pointer;
      return latest?.axis ?? 0;
    },
    get count() {
      return held.size;
    },
    clear() {
      held.clear();
    },
  };
}
