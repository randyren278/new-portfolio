/**
 * Theme resolver — dark ⇄ light selection for the studio shell.
 *
 * The system is a `data-theme="light" | "dark"` attribute on <html>. All CSS
 * lives under `:root[data-theme="…"]` selectors in shell.css; the engine's
 * SVG code reads live values from CSS custom properties via `palette()`.
 *
 * Three call sites use this module:
 *
 *   1. `layout.tsx` renders `HEAD_SCRIPT` inline in <head>. This runs
 *      synchronously before body, sets `data-theme` from
 *      localStorage → prefers-color-scheme → 'light', and starts a
 *      matchMedia listener so `auto` follows the system live. Pre-paint —
 *      no cream flash.
 *
 *   2. `StudioShell.tsx` uses `apply()` on toggle click.
 *
 *   3. `shell-engine.js` uses `apply()` for the `theme` command; and
 *      listens for the `themechange` CustomEvent to redraw motifs.
 *
 * The head script is authored as a raw string (not a compiled TS export)
 * because it must run before any bundle — Next.js will inline it as-is.
 */

export type Theme = 'light' | 'dark';
export type ThemeChoice = Theme | 'auto';

const KEY = 'theme';

/**
 * Inline pre-paint script rendered into <head>. Keep it defensive:
 * localStorage can throw in privacy modes; matchMedia may be missing in
 * ancient browsers. Fall through to 'light' on any error — the site
 * remains functional.
 *
 * Note: this string is duplicated logic from `resolve()` below. Keeping
 * it as a self-contained IIFE avoids a bundle dependency for a script
 * that must run before the bundle loads.
 */
export const HEAD_SCRIPT = `
(function () {
  try {
    var m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    var stored = null;
    try { stored = localStorage.getItem('${KEY}'); } catch (_) {}
    var t;
    if (stored === 'dark' || stored === 'light') {
      t = stored;
    } else {
      t = (m && m.matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);

    // Follow system changes when the user's choice is 'auto' (i.e. no
    // stored value). If they pick a specific theme later, the click
    // handler writes to localStorage and this branch stops firing.
    if (m && m.addEventListener) {
      m.addEventListener('change', function (e) {
        var s = null;
        try { s = localStorage.getItem('${KEY}'); } catch (_) {}
        if (s !== 'dark' && s !== 'light') {
          var next = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', next);
          document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
        }
      });
    }
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`.trim();

/** What's currently rendered (reads the DOM, so must be called client-side). */
export function current(): Theme {
  if (typeof document === 'undefined') return 'light';
  const v = document.documentElement.getAttribute('data-theme');
  return v === 'dark' ? 'dark' : 'light';
}

/** Read the user's explicit choice; `auto` means no stored value. */
export function getStored(): ThemeChoice {
  if (typeof localStorage === 'undefined') return 'auto';
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {}
  return 'auto';
}

/** Resolve `auto` to a concrete theme by reading system preference now. */
export function resolve(choice: ThemeChoice): Theme {
  if (choice === 'dark' || choice === 'light') return choice;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Set the theme. `dark`/`light` persist to localStorage; `auto` clears the
 * stored value so the system-pref listener in HEAD_SCRIPT takes over again.
 * Always writes the attribute AND fires `themechange` so engine listeners
 * (motif redraw, etc.) can react.
 */
export function apply(choice: ThemeChoice): void {
  const t = resolve(choice);
  document.documentElement.setAttribute('data-theme', t);
  try {
    if (choice === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {}
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
}
