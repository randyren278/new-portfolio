import type { ParsedCommand } from './types';

export function parse(input: string): ParsedCommand | null {
  const raw = input.trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  const first = parts[0];
  if (!first) return null;
  const cmd = first.toLowerCase();
  const args = parts.slice(1);
  return { cmd, args, raw: input.trim() };
}
