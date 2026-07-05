export function createHistory() {
  const buf: string[] = [];
  let idx = -1;
  return {
    push(cmd: string) {
      if (!cmd.trim()) return;
      if (buf[buf.length - 1] !== cmd) buf.push(cmd);
      idx = buf.length;
    },
    up(): string | null {
      if (buf.length === 0) return null;
      idx = Math.max(0, idx - 1);
      return buf[idx] ?? null;
    },
    down(): string | null {
      if (buf.length === 0) return null;
      idx = Math.min(buf.length, idx + 1);
      return idx === buf.length ? '' : (buf[idx] ?? null);
    },
    reset() {
      idx = buf.length;
    }
  };
}
