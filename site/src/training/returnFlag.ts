/**
 * Set (in sessionStorage) when leaving for /training; the bento consumes
 * it on mount and skips the Puff intro, so coming back doesn't replay it.
 */
const KEY = 'rr-return-from-training';

export function markReturnToHome() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {}
}

export function consumeReturnToHome(): boolean {
  try {
    const set = sessionStorage.getItem(KEY) === '1';
    sessionStorage.removeItem(KEY);
    return set;
  } catch {
    return false;
  }
}
