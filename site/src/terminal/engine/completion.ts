import { ORDER } from '@/content/projects';
import { listDir } from './filesystem';

export type CompleteResult = { text: string; candidates: string[] };

function commonPrefix(arr: readonly string[]): string {
  if (!arr.length) return '';
  let p = arr[0] ?? '';
  for (let i = 1; i < arr.length; i++) {
    const s = arr[i] ?? '';
    while (s.indexOf(p) !== 0) {
      p = p.slice(0, -1);
      if (!p) return '';
    }
  }
  return p;
}

export function complete(input: string, cwd: string): CompleteResult {
  const parts = input.split(/\s+/);
  if (parts.length < 2) return { text: input, candidates: [] };
  const cmd = parts[0]?.toLowerCase();
  const arg = parts[parts.length - 1] ?? '';
  if (!cmd) return { text: input, candidates: [] };

  let pool: readonly string[] = [];
  if (cmd === 'open' || cmd === 'cat') {
    pool = ORDER;
  } else if (cmd === 'cd') {
    const combined = [...ORDER, ...(listDir(cwd) ?? [])];
    pool = [...new Set(combined)];
  } else {
    return { text: input, candidates: [] };
  }

  const lower = arg.toLowerCase();
  const hits = pool.filter((s) => s.toLowerCase().startsWith(lower)).sort();

  if (hits.length === 0) return { text: input, candidates: [] };

  const head = parts.slice(0, -1).join(' ');

  if (hits.length === 1) {
    return { text: `${head} ${hits[0]}`, candidates: hits };
  }

  const cp = commonPrefix(hits);
  if (cp.length > arg.length) {
    return { text: `${head} ${cp}`, candidates: hits };
  }
  return { text: input, candidates: hits };
}
