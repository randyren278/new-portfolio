import { ORDER } from '@/content/projects';
import { listDir } from './filesystem';

function matchOne(prefix: string, pool: readonly string[]): string | null {
  const lower = prefix.toLowerCase();
  const hits = pool.filter((s) => s.toLowerCase().startsWith(lower));
  return hits.length === 1 ? (hits[0] ?? null) : null;
}

export function complete(input: string, cwd: string): string {
  const trimmed = input.trimEnd();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return input;
  const cmd = parts[0]?.toLowerCase();
  const arg = parts[parts.length - 1] ?? '';
  if (!cmd || !arg) return input;

  let pool: readonly string[] = [];
  if (cmd === 'open' || cmd === 'cat') {
    pool = ORDER;
  } else if (cmd === 'cd') {
    const combined = [...ORDER, ...(listDir(cwd) ?? [])];
    pool = [...new Set(combined)];
  } else {
    return input;
  }

  const hit = matchOne(arg, pool);
  if (!hit) return input;
  const head = parts.slice(0, -1).join(' ');
  return `${head} ${hit}`;
}
