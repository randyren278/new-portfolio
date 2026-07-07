'use client';

import { useEffect, useRef, useState } from 'react';
import type { ShellContent } from '@/content/types';
import { bootShell } from './shell-engine.js';
import { apply as applyTheme, current as currentTheme, getStored } from './theme';
import './shell.css';

/**
 * Client wrapper around the imperative shell engine.
 *
 * The engine (shell-engine.js) is a ~2,800-line hand-written script — same FS
 * model, same page-loader S-curve, same boot ceremony, same plate reveal
 * animation. Content constants (NOTES, MEDIUMS, ABOUT_TEXT, PLATE_DATA, etc.)
 * come from a `content` prop so future edits don't require touching the
 * engine.
 *
 * The DOM structure below is written to match exactly what the engine's
 * `document.getElementById(...)` calls expect — do not rename IDs.
 */
export function StudioShell({ content }: { content: ShellContent }) {
  const mountedRef = useRef(false);

  // `theme` is the currently-rendered value ('light' | 'dark'). Initialized
  // to 'light' for SSR — the pre-paint script in <head> already set the
  // correct `data-theme` on <html> before this component hydrates, so the
  // useEffect below reads the DOM to sync state without flicker.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // React 18/19 StrictMode double-invokes effects in dev; the engine binds
    // window listeners and starts animations, so we boot it exactly once.
    if (mountedRef.current) return;
    mountedRef.current = true;
    setTheme(currentTheme());
    bootShell(content);

    // Keep the toggle glyph in sync when theme flips from another source
    // (the `theme` command in the engine, or the system-pref matchMedia
    // listener when the user hasn't picked a specific theme).
    const onFlip = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: 'light' | 'dark' }>).detail;
      if (detail?.theme) setTheme(detail.theme);
    };
    document.addEventListener('themechange', onFlip);
    return () => document.removeEventListener('themechange', onFlip);
  }, [content]);

  // Fires the same event the engine's Cmd+K listener listens for. The
  // listener lives on `document` (shell-engine.js:385) so dispatch there,
  // not on window — events bubble up, not down.
  const openPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  };

  // Toggle click. If the visitor was on 'auto' (no stored value) we flip
  // to the opposite of what's currently rendered — treat this as their
  // explicit first choice. Otherwise flip between their explicit choices.
  const toggleTheme = () => {
    const stored = getStored();
    if (stored === 'auto') {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    } else {
      applyTheme(stored === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <>
      {/* First-visit page loader (per browser session). */}
      <div id="page-loader" aria-hidden="true" data-active="0">
        <div className="pl-inner">
          <div className="pl-kicker">§ RANDY.SH</div>
          <div className="pl-counter">
            <span id="pl-num">0</span>
            <span className="pl-pct">%</span>
          </div>
          <div className="pl-bar">
            <div className="pl-bar-fill" id="pl-fill" />
          </div>
          <div className="pl-log" id="pl-log" />
          <div className="pl-hint" id="pl-hint">
            any key to skip
          </div>
        </div>
      </div>
      {/*
        Top-right chrome cluster — RANDY REN wordmark plus the theme
        toggle stacked underneath it. Both are site-identity/site-level
        controls, so they share a container and the right edge stays
        flush regardless of the toggle text's width. The parent stays
        pointer-events:none (so the wordmark doesn't block drag-select
        near that corner); the button inside re-enables pointer-events
        so it remains tappable. The aria-label follows the ACTION (what
        the click will do) rather than the current state.
      */}
      <div className="chrome-tr">
        <span className="chrome-tr-mark">RANDY REN</span>
        <button
          type="button"
          className="chrome-theme"
          id="chrome-theme"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
        >
          {theme === 'dark' ? '● dark' : '○ light'}
        </button>
      </div>
      {/*
        The bottom-right chrome hint is now a real button on touch devices —
        tapping it opens the command palette (Cmd+K is otherwise unreachable
        without a physical keyboard). On desktop the base CSS rule keeps
        pointer-events:none on .chrome-br so it remains inert and drag-select
        in the bottom-right corner is unaffected; the (pointer: coarse) block
        re-enables pointer-events on touch input surfaces.
      */}
      <button
        type="button"
        className="chrome-br"
        id="chrome-cmdk"
        onClick={openPalette}
        aria-label="Open command palette"
      >
        ⌘K palette
      </button>
      <div id="scroll-aff">+ scroll ↓ for the prompt</div>

      <div id="term" tabIndex={-1}>
        <div id="buffer" />
        <div id="active-line" aria-hidden="false">
          <span className="prompt-fragment" id="prompt-fragment" />
          <span
            id="input-area"
            role="textbox"
            aria-label="randy.sh prompt"
            tabIndex={0}
          >
            <span className="txt" id="input-before" />
            <span id="caret">
              <span className="under"> </span>
            </span>
            <span className="txt" id="input-after" />
          </span>
          <span id="margin-hint">click any filename to open</span>
          <span id="prompt-dot">▪</span>
        </div>
        <div id="chips" aria-label="quick commands" />
      </div>

      {/*
        Hidden focus sink. Positioned off-screen by the .keysink class in
        shell.css. On desktop the engine keeps it focused so keydown events
        route to the shell's own input handler. On touch the placement stays
        off-screen unconditionally so iOS Safari refuses to summon the soft
        keyboard — typing on mobile is intentionally disabled; the whole
        input model there is chips + label taps.
      */}
      <input
        id="keysink"
        className="keysink"
        aria-hidden="true"
        tabIndex={-1}
        readOnly
        inputMode="none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Cmd-K palette */}
      <div id="palette" role="dialog" aria-label="command palette">
        <div className="pal-card">
          <input
            id="pal-input"
            className="pal-input"
            placeholder="search commands, files, projects..."
            autoComplete="off"
            spellCheck={false}
          />
          <div id="pal-list" className="pal-list" />
        </div>
      </div>
    </>
  );
}
