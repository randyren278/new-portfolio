'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ORDER } from '@/content/projects';
import { FS, type FsNode } from './engine/filesystem';
import styles from './Palette.module.css';

const COMMANDS = [
  'cat',
  'cd',
  'clear',
  'contact',
  'help',
  'history',
  'hours',
  'ls',
  'man',
  'open',
  'pwd',
  'whoami'
];

type PalItem = { label: string; kind: 'command' | 'dir' | 'file' | 'project'; cmd: string };

function toTilde(abs: string): string {
  return '~' + abs.replace(/^\/randy/, '');
}

function walk(node: FsNode, prefix: string, items: PalItem[]) {
  if (!node.children) return;
  for (const k of Object.keys(node.children)) {
    const child = node.children[k];
    if (!child) continue;
    const p = prefix + '/' + k;
    if (child.kind === 'dir') {
      items.push({ label: toTilde(p), kind: 'dir', cmd: `cd ${toTilde(p)}` });
      walk(child, p, items);
    } else {
      items.push({ label: toTilde(p), kind: 'file', cmd: `cat ${toTilde(p)}` });
    }
  }
}

function buildEntries(): PalItem[] {
  const items: PalItem[] = [];
  for (const c of COMMANDS) items.push({ label: c, kind: 'command', cmd: c });
  const randy = FS.children?.randy;
  if (randy) walk(randy, '/randy', items);
  for (const s of ORDER) items.push({ label: `open ${s}`, kind: 'project', cmd: `open ${s}` });
  return items;
}

export function Palette({ onRun, onClose }: { onRun: (cmd: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(buildEntries, []);
  const items = useMemo(() => {
    const s = query.toLowerCase();
    if (!s) return allItems;
    return allItems.filter((i) => i.label.toLowerCase().includes(s) || i.kind.includes(s));
  }, [allItems, query]);

  useEffect(() => {
    setIdx(0);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = listRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  const run = useCallback(
    (item: PalItem) => {
      onClose();
      onRun(item.cmd);
    },
    [onClose, onRun]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => (i < items.length - 1 ? i + 1 : i));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => (i > 0 ? i - 1 : 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[idx];
      if (it) run(it);
      return;
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-label="command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.card}>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="search commands, files, projects..."
          autoComplete="off"
          spellCheck={false}
          aria-label="palette search"
        />
        <div ref={listRef} className={styles.list}>
          {items.length === 0 ? (
            <div className={styles.empty}>nothing matches.</div>
          ) : (
            items.map((it, i) => (
              <div
                key={`${it.kind}:${it.cmd}`}
                className={`${styles.item}${i === idx ? ` ${styles.sel}` : ''}`}
                onMouseEnter={() => setIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  run(it);
                }}
              >
                <span>{it.label}</span>
                <span className={styles.kind}>{it.kind}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
