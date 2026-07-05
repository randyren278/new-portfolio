'use client';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS, type Slug } from '@/content/projects';
import { execute, type CommandResult } from './engine/commands';
import { complete } from './engine/completion';
import { createHistory } from './engine/history';
import { Chips, buildChipSet } from './Chips';
import { InlineLabel } from './InlineLabel';
import { PlateViewer } from './PlateViewer';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useVisibleSlug } from './hooks/useVisibleSlug';
import styles from './Terminal.module.css';

type Line = { id: number; node: ReactNode };
let uid = 0;
const nextId = () => ++uid;

export function Terminal() {
  const reduced = useReducedMotion();
  const [cwd, setCwd] = useState('/randy');
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [plateSlug, setPlateSlug] = useState<Slug | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const history = useMemo(createHistory, []);
  const { visible, onChange } = useVisibleSlug();

  const promptFor = (p: string) => (p === '/randy' ? '~' : `~${p.slice('/randy'.length)}`);

  const push = useCallback((node: ReactNode) => {
    setLines((prev) => [...prev, { id: nextId(), node }]);
  }, []);

  const runInput = useCallback((raw: string) => {
    if (!raw.trim()) return;
    history.push(raw);
    push(
      <div className={styles.echo}>
        <span className={styles.prompt}>{promptFor(cwd)}</span>
        <span className={styles.echoText}>{raw}</span>
      </div>
    );
    const result: CommandResult = execute(raw, { cwd, visibleSlug: visible });
    switch (result.kind) {
      case 'text':
      case 'help':
        for (const line of result.lines) push(<div className={styles.textLine}>{line}</div>);
        break;
      case 'error':
        push(<div className={styles.err}>{result.message}</div>);
        break;
      case 'cd':
        setCwd(result.newCwd);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'openInline':
        push(<InlineLabel slug={result.slug} instant={reduced} onVisibilityChange={onChange} />);
        break;
      case 'openPlate':
        setPlateSlug(result.slug);
        break;
    }
  }, [cwd, visible, history, push, reduced, onChange]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); runInput(input); setInput(''); history.reset(); return; }
    if (e.key === 'Tab')   { e.preventDefault(); setInput((v) => complete(v, cwd)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); const v = history.up();   if (v !== null) setInput(v); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); const v = history.down(); if (v !== null) setInput(v); return; }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const chips = buildChipSet(cwd, visible);

  return (
    <div className={styles.frame} onClick={() => inputRef.current?.focus()}>
      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.welcome}>
          <span className={styles.kicker}>catalog</span>
          <span className={styles.sub}>a museum expressed as a curator's terminal. type <code>help</code> or use the chips below.</span>
        </div>
        {lines.map((l) => <div key={l.id}>{l.node}</div>)}
        <div className={styles.promptLine}>
          <span className={styles.prompt}>{promptFor(cwd)}</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="terminal input"
          />
          <span className={styles.caret} aria-hidden />
        </div>
      </div>
      <Chips chips={chips} onRun={runInput} />
      {plateSlug ? <PlateViewer slug={plateSlug} onClose={() => { setPlateSlug(null); inputRef.current?.focus(); }} /> : null}
    </div>
  );
}
