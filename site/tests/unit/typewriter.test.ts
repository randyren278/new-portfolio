import { afterEach, describe, expect, it, vi } from 'vitest';
import { typeInto } from '@/terminal/reveal/typewriter';

describe('typeInto', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves with the full text after enough time', async () => {
    vi.useFakeTimers();
    const el = document.createElement('span');
    const handle = typeInto(el, 'hello', { msPerChar: 10, jitterMs: 0 });
    await vi.advanceTimersByTimeAsync(200);
    await handle.done;
    expect(el.textContent).toBe('hello');
  });

  it('skip() jumps to final text immediately', async () => {
    vi.useFakeTimers();
    const el = document.createElement('span');
    const handle = typeInto(el, 'abcdef', { msPerChar: 50, jitterMs: 0 });
    handle.skip();
    await vi.advanceTimersByTimeAsync(1);
    await handle.done;
    expect(el.textContent).toBe('abcdef');
  });
});
