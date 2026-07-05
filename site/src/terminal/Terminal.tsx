'use client';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Slug } from '@/content/projects';
import { execute, type CommandResult } from './engine/commands';
import { complete } from './engine/completion';
import { createHistory } from './engine/history';
import { AboutCard } from './AboutCard';
import { Chips, buildChipSet } from './Chips';
import { InlineLabel } from './InlineLabel';
import { Palette } from './Palette';
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
  const [chromeBrGone, setChromeBrGone] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrollAffOn, setScrollAffOn] = useState(false);
  const [focused, setFocused] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTabRef = useRef<{ input: string; candidates: string[] } | null>(null);
  const cmdKUsedRef = useRef(false);
  const history = useMemo(createHistory, []);
  const { visibleSlugs, onChange } = useVisibleSlug();

  const pwdFor = (p: string) => (p === '/randy' ? '~' : `~${p.slice('/randy'.length)}`);
  const renderPrompt = (p: string) => {
    const pwd = pwdFor(p);
    return (
      <span className={styles.prompt}>
        <span className={styles.promptUser}>visitor</span>
        <span className={styles.promptAt}>@museum</span>
        <span className={styles.promptColon}>:</span>
        <span className={styles.promptPwd}>{pwd}</span>
        <span className={styles.promptDollar}>$</span>
      </span>
    );
  };

  const push = useCallback((node: ReactNode) => {
    setLines((prev) => [...prev, { id: nextId(), node }]);
  }, []);

  const runInput = useCallback((raw: string) => {
    if (!raw.trim()) return;
    const trimmed = raw.trim();
    const bangN = /^!(\d+)$/.exec(trimmed);
    let resolved = raw;
    if (trimmed === '!!' || bangN) {
      let target: string | null = null;
      if (trimmed === '!!') target = cmdHistory[cmdHistory.length - 1] ?? null;
      else if (bangN) {
        const n = parseInt(bangN[1]!, 10);
        if (n >= 1 && n <= cmdHistory.length) target = cmdHistory[n - 1] ?? null;
      }
      if (!target) {
        push(
          <div className={styles.echo}>
            {renderPrompt(cwd)}
            <span className={styles.echoText}>{raw}</span>
          </div>
        );
        push(<div className={styles.err}>{`zsh: event not found: ${trimmed}`}</div>);
        return;
      }
      resolved = target;
    }
    history.push(resolved);
    push(
      <div className={styles.echo}>
        {renderPrompt(cwd)}
        <span className={styles.echoText}>{resolved}</span>
      </div>
    );
    setTypedCount((n) => n + 1);
    const nextHistory = [...cmdHistory, resolved];
    setCmdHistory(nextHistory);
    const result: CommandResult = execute(resolved, { cwd, visibleSlugs, history: nextHistory });
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
      case 'openAbout':
        push(<AboutCard />);
        break;
      case 'openPlate':
        setPlateSlug(result.slug);
        break;
    }
  }, [cwd, visibleSlugs, history, cmdHistory, push, reduced, onChange]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!cmdKUsedRef.current) setChromeBrGone(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!cmdKUsedRef.current) {
      idleTimerRef.current = setTimeout(() => setChromeBrGone(true), 3000);
    }
    if (e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'l') { e.preventDefault(); setLines([]); return; }
      if (k === 'c') {
        e.preventDefault();
        const current = input;
        push(
          <div className={styles.echo}>
            {renderPrompt(cwd)}
            <span className={styles.echoText}>{`${current}^C`}</span>
          </div>
        );
        setInput('');
        history.reset();
        lastTabRef.current = null;
        return;
      }
      const el = e.currentTarget;
      if (k === 'a') { e.preventDefault(); el.setSelectionRange(0, 0); return; }
      if (k === 'e') { e.preventDefault(); const n = el.value.length; el.setSelectionRange(n, n); return; }
      if (k === 'u') { e.preventDefault(); setInput(''); return; }
      if (k === 'w') {
        e.preventDefault();
        const start = el.selectionStart ?? el.value.length;
        const before = el.value.slice(0, start);
        const after = el.value.slice(start);
        const m = before.match(/\s*\S*$/);
        const cut = m ? before.slice(0, before.length - m[0].length) : before;
        setInput(cut + after);
        requestAnimationFrame(() => {
          const node = inputRef.current;
          if (node) node.setSelectionRange(cut.length, cut.length);
        });
        return;
      }
    }
    if (e.key === 'Enter') { e.preventDefault(); runInput(input); setInput(''); history.reset(); lastTabRef.current = null; return; }
    if (e.key === 'Tab')   {
      e.preventDefault();
      const { text, candidates } = complete(input, cwd);
      if (candidates.length > 1) {
        const prev = lastTabRef.current;
        if (prev && prev.input === input && prev.candidates.length === candidates.length && prev.candidates.every((c, i) => c === candidates[i])) {
          push(<div className={styles.tabBlock}>{candidates.join('  ')}</div>);
          lastTabRef.current = null;
          return;
        }
        lastTabRef.current = { input: text, candidates };
        if (text !== input) setInput(text);
        return;
      }
      lastTabRef.current = null;
      if (text !== input) setInput(text);
      return;
    }
    if (e.key === 'ArrowUp')   { e.preventDefault(); const v = history.up();   if (v !== null) setInput(v); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); const v = history.down(); if (v !== null) setInput(v); return; }
  };

  useEffect(() => {
    idleTimerRef.current = setTimeout(() => setChromeBrGone(true), 3000);
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const nearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 24;
      setScrollAffOn(!nearBottom);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [lines]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduced ? 'instant' : 'smooth' });
  }, [lines, reduced]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (paletteOpen) return;
        cmdKUsedRef.current = true;
        setChromeBrGone(true);
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onGlobalKey);
    return () => document.removeEventListener('keydown', onGlobalKey);
  }, [paletteOpen]);

  useEffect(() => {
    const blurredClass = styles.blurred;
    if (!blurredClass) return;
    const onBlur = () => caretRef.current?.classList.add(blurredClass);
    const onFocus = () => caretRef.current?.classList.remove(blurredClass);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const chips = buildChipSet(cwd, visibleSlugs);

  return (
    <div
      className={styles.frame}
      onMouseUp={() => {
        if (window.getSelection()?.toString().length) return;
        inputRef.current?.focus();
      }}
    >
      <div className={styles.chromeTr}>RANDY REN &middot; MUSEUM SHELL &middot; v0.9</div>
      <div className={`${styles.chromeBr}${chromeBrGone ? ` ${styles.gone}` : ''}`}>&#8984;K palette</div>
      <div className={`${styles.scrollAff}${scrollAffOn ? ` ${styles.on}` : ''}`}>+ scroll &darr; for the prompt</div>
      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.welcome}>
          <span className={styles.kicker}>catalog</span>
          <span className={styles.sub}>a museum expressed as a curator's terminal. type <code>help</code> or use the chips below.</span>
        </div>
        {lines.map((l) => <div key={l.id}>{l.node}</div>)}
        <div className={`${styles.promptLine}${focused ? ` ${styles.focused}` : ''}`}>
          {renderPrompt(cwd)}
          <span className={styles.inputWrap} data-value={input}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="terminal input"
            />
          </span>
          <span ref={caretRef} className={styles.caret} aria-hidden />
          <span className={`${styles.marginHint}${typedCount >= 3 ? ` ${styles.gone}` : ''}`}>click any filename to open</span>
          {focused ? <span className={styles.promptDot} aria-hidden /> : null}
        </div>
      </div>
      <Chips chips={chips} onRun={runInput} />
      {plateSlug ? <PlateViewer slug={plateSlug} onClose={() => { setPlateSlug(null); inputRef.current?.focus(); }} /> : null}
      {paletteOpen ? (
        <Palette
          onRun={(cmd) => runInput(cmd)}
          onClose={() => {
            setPaletteOpen(false);
            inputRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
