'use client';

import { useEffect, useRef } from 'react';
import type { ShellContent } from '@/content/types';
import { bootShell } from './shell-engine.js';
import './shell.css';

/**
 * Client wrapper around the imperative shell engine.
 *
 * The engine (shell-engine.js) is the original ~2,800-line index.html script
 * extracted verbatim — same FS model, same page-loader S-curve, same boot
 * ceremony, same plate reveal animation. Only the top-level content constants
 * (NOTES, MEDIUMS, ABOUT_TEXT, PLATE_DATA, etc.) come from a `content` prop
 * so the /admin route can edit them.
 *
 * The DOM structure below is copy-pasted from index.html's <body> because the
 * engine uses `document.getElementById(...)` and expects these exact IDs.
 */
export function MuseumShell({ content }: { content: ShellContent }) {
  const mountedRef = useRef(false);

  useEffect(() => {
    // React 18/19 StrictMode double-invokes effects in dev; the engine binds
    // window listeners and starts animations, so we boot it exactly once.
    if (mountedRef.current) return;
    mountedRef.current = true;
    bootShell(content);
  }, [content]);

  return (
    <>
      {/* Page-level first-visit loader (hard refresh only). Cookie-gated. */}
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
      <div className="chrome-tr">RANDY REN</div>
      <div className="chrome-br" id="chrome-cmdk">
        ⌘K palette
      </div>
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

      {/* Hidden focus sink */}
      <input
        id="keysink"
        style={{ position: 'fixed', left: -10000, top: -10000, opacity: 0 }}
        aria-hidden="true"
        tabIndex={-1}
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
