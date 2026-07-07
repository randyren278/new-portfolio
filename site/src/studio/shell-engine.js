/* ============================================================
   randy.sh — studio shell engine (raw JS)
   Wrapped as bootShell(content) so top-level content constants
   come from a server-injected object instead of being hard-coded.
   ============================================================ */
export function bootShell(content) {
'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// TOUCH devices don't get the full-plate modal — the inline label card is
// the entire project surface. Also drives the mobile chip label wording so
// "Open the project" (which implies the plate) becomes "Show the note".
const TOUCH = window.matchMedia('(pointer: coarse)').matches;

/* ---------- Theme-aware color palette ----------
   All inline SVG generation reads colors here rather than hardcoding hex.
   Values come from the CSS custom properties on <html data-theme="…">,
   which is set pre-paint by src/studio/theme.ts. Call this fresh at each
   render/redraw site — the user can flip theme at any time, and the
   `themechange` CustomEvent (dispatched by theme.ts) triggers a redraw
   pass through the listener at the bottom of this file.

   Named `themePalette` to avoid shadowing the `palette` DOM constant
   later in this file (the Cmd-K palette element). */
function themePalette() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink:    cs.getPropertyValue('--ink').trim()    || '#111',
    muted:  cs.getPropertyValue('--muted').trim()  || '#7A4A1F',
    accent: cs.getPropertyValue('--accent').trim() || '#a8100a',
  };
}

/* ---------- Filesystem model ---------- */

/* Content constants — sourced from server-injected `content` object.
   In index.html these were inline literals; here they are looked up from
   the props passed to bootShell so the /admin route can edit them. */
const NOTES = content.NOTES;
const MEDIUMS = content.MEDIUMS;
const ORDER = content.ORDER;
const ABOUT_TEXT = content.ABOUT_TEXT;
const CONTACT_TEXT = content.CONTACT_TEXT;
const HOURS_TEXT = content.HOURS_TEXT;
const COLOPHON_TEXT = content.COLOPHON_TEXT;

/* Filesystem tree — dirs and files.
   `latest` is a command, not a file; it appears as a synthetic row in the
   root listing (see cmd_ls) so first-time visitors can discover it. */
function buildFs() {
  const root = {
    name: 'randy', type: 'dir', children: {
      about:    { type: 'file' },
      contact:  { type: 'file' },
      hours:    { type: 'file' },
      colophon: { type: 'file' },
      work:     { type: 'dir', children: {}, order: ORDER.slice() }
    }
  };
  for (const slug of ORDER) {
    root.children.work.children[slug] = {
      type: 'dir', order: ['label','plate'], children: {
        label: { type: 'file' },
        plate: { type: 'file' }
      }
    };
  }
  return root;
}
const FS = buildFs();

/* ---------- Path resolution ---------- */
let cwd = ['randy']; // path segments

function pwdString() {
  if (cwd.length === 1 && cwd[0] === 'randy') return '~';
  return '~/' + cwd.slice(1).join('/');
}

function nodeAt(pathArr) {
  let n = FS;
  if (!pathArr || !pathArr.length || pathArr[0] !== 'randy') return null;
  for (let i = 1; i < pathArr.length; i++) {
    if (!n.children || !n.children[pathArr[i]]) return null;
    n = n.children[pathArr[i]];
  }
  return n;
}

function resolvePath(input) {
  if (input === undefined || input === null || input === '') return ['randy'];
  let raw = String(input).trim();
  let segs;
  if (raw === '~') return ['randy'];
  if (raw.startsWith('~/')) { segs = raw.slice(2).split('/'); return ['randy', ...segs.filter(Boolean)]; }
  if (raw.startsWith('/')) {
    segs = raw.slice(1).split('/');
    if (segs[0] === 'randy') return ['randy', ...segs.slice(1).filter(Boolean)];
    return null;
  }
  const out = cwd.slice();
  const parts = raw.split('/');
  for (const p of parts) {
    if (p === '' || p === '.') continue;
    if (p === '..') { if (out.length > 1) out.pop(); continue; }
    out.push(p);
  }
  return out;
}

/* ---------- Terminal DOM helpers ---------- */
const term = document.getElementById('term');
const buffer = document.getElementById('buffer');
const activeLine = document.getElementById('active-line');
const promptFragment = document.getElementById('prompt-fragment');
const inputBefore = document.getElementById('input-before');
const inputAfter  = document.getElementById('input-after');
const caretEl = document.getElementById('caret');
const caretUnder = caretEl.querySelector('.under');
const chipsEl = document.getElementById('chips');
const marginHint = document.getElementById('margin-hint');
const chromeCmdK = document.getElementById('chrome-cmdk');

function scrollBottom() {
  requestAnimationFrame(() => {
    term.scrollTop = term.scrollHeight;
  });
}

/* Reserve an element's current rendered height as an inline min-height, then
   return a disposer that removes it. Used to "pre-frame" a card before its
   reveal starts: we measure each animated section while its final text is
   populated, lock the box, then empty the section for type-in. The card's
   OUTER dimensions are final from frame 1, so scrollBottom() on insert lands
   the whole tail (card bottom + trailing prompt + #chips row) inside the
   terminal viewport once and doesn't need to be chased as sections type in.

   On desktop the whole card usually fits above the fold anyway — reserving
   height is a no-op there. On mobile it's the difference between the chip
   row landing in the viewport at rest vs. being scrolled off. */
function reserveHeight(el) {
  if (!el) return () => {};
  const h = el.offsetHeight;
  if (!h) return () => {};
  const prev = el.style.minHeight;
  el.style.minHeight = h + 'px';
  return () => { el.style.minHeight = prev; };
}

function makePromptSpan(pwdText) {
  const s = document.createElement('span');
  s.className = 'prompt-line';
  s.innerHTML = `<span class="prompt-user">visitor</span><span class="prompt-at">@studio</span><span class="prompt-colon">:</span><span class="prompt-pwd">${escapeHtml(pwdText)}</span><span class="prompt-dollar">$ </span>`;
  return s;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let margCounter = 0;
function printLine(html, opts) {
  opts = opts || {};
  const row = document.createElement('div');
  row.className = 'row';
  if (opts.stagger) row.classList.add('stagger');
  row.innerHTML = html;
  // Add ambient tick flicker to any .marg span in this row
  const margs = row.querySelectorAll('.marg');
  margs.forEach(m => {
    m.classList.add('tick');
    m.style.setProperty('--marg-idx', String(margCounter++ % 5));
  });
  buffer.appendChild(row);
  scrollBottom();
  return row;
}

/* ---------- Command echoing ---------- */
function pushExecutedPrompt(cmdText) {
  const row = document.createElement('div');
  row.className = 'row';
  const p = makePromptSpan(pwdString());
  row.appendChild(p);
  const t = document.createElement('span');
  t.textContent = cmdText;
  row.appendChild(t);
  buffer.appendChild(row);
  scrollBottom();
}

/* ---------- Session state ---------- */
const SS = {
  get typedCount() { return parseInt(sessionStorage.getItem('typedCount') || '0', 10); },
  set typedCount(v) { sessionStorage.setItem('typedCount', String(v)); },
  get cdOverrideCount() { return parseInt(sessionStorage.getItem('cdOverrideCount') || '0', 10); },
  set cdOverrideCount(v) { sessionStorage.setItem('cdOverrideCount', String(v)); },
  animCache: (() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('animCache') || '[]')); }
    catch(e) { return new Set(); }
  })(),
  cacheAdd(k) { this.animCache.add(k); sessionStorage.setItem('animCache', JSON.stringify([...this.animCache])); },
  get cmdKUsed() { return sessionStorage.getItem('cmdKUsed') === '1'; },
  set cmdKUsed(v) { sessionStorage.setItem('cmdKUsed', v ? '1' : '0'); },
};

/* ---------- Chips ---------- */
function chipSet() {
  const pwd = pwdString();
  if (pwd === '~') {
    return [
      { l1: 'See the work',     cmd: 'cd work/' },
      { l1: 'Read about Randy', cmd: 'cat about' },
      { l1: 'Latest run/ride',  cmd: 'latest' },
      { l1: 'Get in touch',     cmd: 'cat contact' },
      { l1: 'Help',             cmd: 'help' }
    ];
  }
  if (pwd === '~/work') {
    // If a label is currently visible in the buffer, collapse to focused chips
    // for that project. Otherwise show the full six-project chip row.
    const visibleSlug = firstVisibleInlineSlug(ORDER);
    if (visibleSlug) {
      const title = visibleSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      // On touch there is no full-plate view, so the "Show the note" chip
      // would just re-render the label the visitor is already looking at.
      // Collapse to a single navigation chip.
      if (TOUCH) return [{ l1: 'Back home', cmd: 'cd ~' }];
      return [
        { l1: 'Open the project', cmd: `open ${visibleSlug}` },
        { l1: 'Back home',      cmd: 'cd ~' }
      ];
    }
    return [
      { l1: 'Open Oryzo',        cmd: 'open oryzo' },
      { l1: 'Open Halcyon',      cmd: 'open halcyon' },
      { l1: 'Open Aperture',     cmd: 'open aperture' },
      { l1: 'Open Fieldnote',    cmd: 'open fieldnote' },
      { l1: 'Open Signal Garden', cmd: 'open signal-garden' },
      { l1: 'Open Loom',         cmd: 'open loom' },
      { l1: 'Back home',         cmd: 'cd ~' }
    ];
  }
  if (pwd.startsWith('~/work/')) {
    // Extract the project slug from the pwd (last segment)
    const slug = pwd.slice('~/work/'.length).split('/')[0];
    const idx = ORDER.indexOf(slug);
    const prev = idx > 0 ? ORDER[idx - 1] : null;
    const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    const title = (s) => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    // On touch the "open" chip would re-render the same label the visitor
    // is looking at (plate is disabled on mobile). Start with an empty chip
    // list and only add navigation.
    const chips = TOUCH ? [] : [
      { l1: 'Open the project', cmd: `open ${slug}` }
    ];
    if (next) chips.push({ l1: `Next: ${title(next)}`, cmd: `cd ${next}` });
    if (prev) chips.push({ l1: `Prev: ${title(prev)}`, cmd: `cd ${prev}` });
    chips.push({ l1: 'Back to work', cmd: 'cd ..' });
    chips.push({ l1: 'Get in touch', cmd: 'cat ~/contact' });
    return chips;
  }
  return [
    { l1: 'Home', cmd: 'cd ~' },
    { l1: 'List', cmd: 'ls' }
  ];
}

let chipsFilter = '';
function renderChips() {
  const set = chipSet();
  const filtered = chipsFilter
    ? set.filter(c => c.cmd.toLowerCase().startsWith(chipsFilter.toLowerCase()))
    : set;
  chipsEl.innerHTML = '';
  filtered.forEach((c, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'chip-sep';
      sep.textContent = '·';
      chipsEl.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.tabIndex = 0;
    btn.style.setProperty('--chip-idx', String(i));
    btn.innerHTML = `<span class="l1">${escapeHtml(c.l1)}</span><span class="l2">${escapeHtml(c.cmd)}</span>`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      chipInvoke(c.cmd);
    });
    chipsEl.appendChild(btn);
  });
  updateChipsOpacity();
}

function baseChipOpacity() {
  const n = SS.typedCount;
  if (n >= 8) return 0.55;
  if (n >= 3) return 0.75;
  return 1.0;
}
function updateChipsOpacity() {
  chipsEl.style.opacity = String(baseChipOpacity());
  // Pause the idle micromotion once chips have faded to competence-level.
  chipsEl.classList.toggle('calm', baseChipOpacity() <= 0.55);
}
let chipPulseT = null;
function pulseChips() {
  if (baseChipOpacity() >= 1) return;
  chipsEl.style.opacity = '1';
  clearTimeout(chipPulseT);
  chipPulseT = setTimeout(() => { chipsEl.style.opacity = String(baseChipOpacity()); }, 400);
}

/* Chip invoke: type-stream then execute */
function chipInvoke(cmd) {
  if (busy) return;
  setInputText('', '');
  streamIntoInput(cmd, 140, () => {
    submitInput({fromChip: true});
  });
}

function streamIntoInput(text, totalMs, done) {
  const n = text.length;
  if (n === 0) { done && done(); return; }
  const per = Math.max(8, Math.floor(totalMs / n));
  let i = 0;
  const step = () => {
    i++;
    setInputText(text.slice(0, i), '');
    if (i < n) setTimeout(step, per);
    else done && done();
  };
  step();
}

/* ---------- Line editor state ---------- */
let inputText = '';
let caretPos = 0;
let history = [];
let histIdx = -1;
let stashCurrent = '';
let blurQueue = [];
let hasFocus = true;
let busy = false;
let typingHoldT = null;

function setCaretState(mode) {
  caretEl.classList.remove('typing','blurred');
  if (mode === 'solid') caretEl.classList.add('typing');
  else if (mode === 'blurred') caretEl.classList.add('blurred');
}

function pauseBlinkForTyping() {
  setCaretState('solid');
  clearTimeout(typingHoldT);
  typingHoldT = setTimeout(() => {
    if (hasFocus) setCaretState('blink');
  }, 400);
}

function setInputText(before, after) {
  inputText = before + after;
  caretPos = before.length;
  renderInputLine();
  const t = inputText.trimStart();
  const firstWord = t.split(/\s+/)[0] || '';
  chipsFilter = firstWord;
  renderChips();
}

function renderInputLine() {
  promptFragment.innerHTML = '';
  promptFragment.appendChild(makePromptSpan(pwdString()));
  const before = inputText.slice(0, caretPos);
  const under = inputText.slice(caretPos, caretPos + 1) || ' ';
  const after = inputText.slice(caretPos + 1);
  inputBefore.textContent = before;
  caretUnder.textContent = under === '\n' ? ' ' : under;
  inputAfter.textContent = after;
  scrollBottom();
}

function updatePrompt() {
  renderInputLine();
  renderChips();
  updateMarginHint();
}

function updateMarginHint() {
  if (SS.typedCount >= 3) marginHint.classList.add('gone');
  else marginHint.classList.remove('gone');
}

/* ---------- Focus & blur ---------- */
function focusInput() {
  // On touch devices we suppress ALL focus paths — mouseup, window focus,
  // visibilitychange, palette/plate close handlers. Calling .focus() on
  // the hidden keysink input inside a synthesized user-gesture (touchend
  // → mouseup) makes iOS Safari summon the soft keyboard even for
  // off-screen inputs, which is exactly what we're trying to avoid.
  // Typing on mobile is disabled by design; the input model is chips.
  if (TOUCH) return;
  hasFocus = true;
  setCaretState('blink');
  activeLine.classList.add('focused');
  try { document.getElementById('keysink').focus({preventScroll:true}); } catch(e){}
  if (blurQueue.length) {
    for (const k of blurQueue) handleKeyChar(k);
    blurQueue = [];
  }
}
function onBlur() {
  hasFocus = false;
  setCaretState('blurred');
  activeLine.classList.remove('focused');
}
window.addEventListener('focus', focusInput);
window.addEventListener('blur', onBlur);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') onBlur();
  else focusInput();
});

/* Click focus stickiness — but preserve selection */
term.addEventListener('mouseup', (e) => {
  const sel = document.getSelection();
  if (sel && sel.toString().length) return;
  if (e.target.closest && e.target.closest('button')) return;
  focusInput();
});

/* ---------- Keyboard ---------- */

function handleKeyChar(ch) {
  const before = inputText.slice(0, caretPos) + ch;
  const after = inputText.slice(caretPos);
  setInputText(before, after);
}

/* ---------- Theme change — redraw motifs on flip ----------
   theme.ts dispatches a `themechange` CustomEvent on `document` whenever
   the palette flips (toggle click, `theme` command, or an `auto` visitor
   whose system pref changed). Every SVG built by this engine reads its
   colors at DRAW time from CSS vars — but the strokes/fills are baked into
   attributes at build. So on flip we walk every tagged motif SVG and
   rebuild it in place. Cheap: total ~7 motifs at any time, and only when
   the user actively toggles. */
document.addEventListener('themechange', () => {
  // Plate motif (small, in the plate overlay + inline card): container is
  // .plate-wrap with data-motif-slug.
  document.querySelectorAll('.plate-wrap[data-motif-slug]').forEach(wrap => {
    const slug = wrap.getAttribute('data-motif-slug');
    if (!slug) return;
    const fresh = plateFor(slug);
    // Keep the plate-wrap element; replace its inner SVG. The stroke
    // reveal animations are one-shot on first draw — after a theme flip
    // we want the motif to appear at full-opacity, not re-animate.
    wrap.innerHTML = '';
    fresh.strokes.forEach(s => { s.style.strokeDashoffset = '0'; });
    if (fresh.washRect) fresh.washRect.setAttribute('opacity','0.82');
    fresh.glyph.style.opacity = '1';
    // The wrap already contains one child (a fresh SVG) from plateFor; move it in.
    while (fresh.wrap.firstChild) wrap.appendChild(fresh.wrap.firstChild);
  });

  // Full-page motif (~/projects listing): the SVG itself is tagged.
  document.querySelectorAll('svg.motif-svg[data-motif-slug]').forEach(oldSvg => {
    const slug = oldSvg.getAttribute('data-motif-slug');
    if (!slug) return;
    const parent = oldSvg.parentNode;
    if (!parent) return;
    const { svg: newSvg, strokes } = buildMotif(slug);
    // Skip the stroke-in animation on flip — motif was already visible.
    strokes.forEach(s => { s.style.strokeDashoffset = '0'; });
    parent.replaceChild(newSvg, oldSvg);
  });

  // Strava polyline: single-path SVG, restroke to fresh ink.
  document.querySelectorAll('svg[data-strava-polyline] path').forEach(p => {
    p.setAttribute('stroke', themePalette().ink);
  });
});

document.addEventListener('keydown', (e) => {
  if (plateOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closePlate(); return; }
    if (e.key === 'Backspace' && !isEditableFocus()) { e.preventDefault(); closePlate(); return; }
    return;
  }
  if (paletteOpen) return;

  // Cmd-K / Ctrl-K
  if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    openPalette();
    return;
  }

  // Any-key skips reveal
  if (revealInProgress) {
    if (e.key === 'Escape' || (!e.metaKey && !e.ctrlKey && !e.altKey)) {
      e.preventDefault();
      finishReveal();
      return;
    }
  }

  if (busy) { e.preventDefault(); return; }

  if (!hasFocus) {
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (blurQueue.length < 6) blurQueue.push(e.key);
      return;
    }
    return;
  }

  // Ctrl combos
  if (e.ctrlKey && !e.metaKey && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 'a') { e.preventDefault(); caretPos = 0; renderInputLine(); pauseBlinkForTyping(); return; }
    if (k === 'e') { e.preventDefault(); caretPos = inputText.length; renderInputLine(); pauseBlinkForTyping(); return; }
    if (k === 'u') { e.preventDefault(); setInputText('', ''); pauseBlinkForTyping(); return; }
    if (k === 'w') {
      e.preventDefault();
      const b = inputText.slice(0, caretPos);
      const a = inputText.slice(caretPos);
      const m = b.match(/\s*\S*$/);
      const cut = m ? b.slice(0, b.length - m[0].length) : b;
      setInputText(cut, a);
      pauseBlinkForTyping();
      return;
    }
    if (k === 'l') { e.preventDefault(); clearScreen(); return; }
    if (k === 'c') { e.preventDefault(); cancelInput(); return; }
  }

  if (e.metaKey || e.altKey) return;

  switch (e.key) {
    case 'Enter': {
      e.preventDefault();
      submitInput({});
      return;
    }
    case 'Backspace': {
      e.preventDefault();
      if (caretPos > 0) {
        const b = inputText.slice(0, caretPos - 1);
        const a = inputText.slice(caretPos);
        setInputText(b, a);
      }
      pauseBlinkForTyping();
      pulseChips();
      return;
    }
    case 'Delete': {
      e.preventDefault();
      const b = inputText.slice(0, caretPos);
      const a = inputText.slice(caretPos + 1);
      setInputText(b, a);
      pauseBlinkForTyping();
      pulseChips();
      return;
    }
    case 'ArrowLeft': {
      e.preventDefault();
      if (caretPos > 0) caretPos--;
      renderInputLine();
      pauseBlinkForTyping();
      return;
    }
    case 'ArrowRight': {
      e.preventDefault();
      if (caretPos < inputText.length) caretPos++;
      renderInputLine();
      pauseBlinkForTyping();
      return;
    }
    case 'Home': {
      e.preventDefault();
      caretPos = 0;
      renderInputLine();
      pauseBlinkForTyping();
      return;
    }
    case 'End': {
      e.preventDefault();
      caretPos = inputText.length;
      renderInputLine();
      pauseBlinkForTyping();
      return;
    }
    case 'ArrowUp': {
      e.preventDefault();
      historyBack();
      return;
    }
    case 'ArrowDown': {
      e.preventDefault();
      historyForward();
      return;
    }
    case 'Tab': {
      e.preventDefault();
      handleTab(e.shiftKey);
      return;
    }
    case 'Escape': {
      return;
    }
    default: {
      if (e.key.length === 1) {
        e.preventDefault();
        handleKeyChar(e.key);
        pauseBlinkForTyping();
        pulseChips();
      }
    }
  }
});

function cancelInput() {
  const row = document.createElement('div');
  row.className = 'row';
  const p = makePromptSpan(pwdString());
  row.appendChild(p);
  const t = document.createElement('span');
  t.textContent = inputText + '^C';
  row.appendChild(t);
  buffer.appendChild(row);
  setInputText('', '');
  histIdx = -1;
  stashCurrent = '';
  scrollBottom();
}

function historyBack() {
  if (!history.length) return;
  if (histIdx === -1) stashCurrent = inputText;
  if (histIdx < history.length - 1) histIdx++;
  const v = history[history.length - 1 - histIdx];
  setInputText(v, '');
  pauseBlinkForTyping();
}
function historyForward() {
  if (histIdx === -1) return;
  histIdx--;
  if (histIdx === -1) {
    setInputText(stashCurrent, '');
  } else {
    const v = history[history.length - 1 - histIdx];
    setInputText(v, '');
  }
  pauseBlinkForTyping();
}

/* ---------- Tab completion ---------- */
let lastTabState = null;

function handleTab(shift) {
  const raw = inputText;
  const upToCaret = raw.slice(0, caretPos);
  const parts = upToCaret.split(/\s+/);
  const isFirst = parts.length === 1;
  const frag = parts[parts.length - 1] || '';
  const cmd = parts[0] || '';

  let candidates = [];
  if (isFirst) {
    candidates = COMMANDS.filter(c => c.startsWith(frag)).sort();
  } else {
    const lastSlash = frag.lastIndexOf('/');
    const dirPart = lastSlash >= 0 ? frag.slice(0, lastSlash + 1) : '';
    const namePart = lastSlash >= 0 ? frag.slice(lastSlash + 1) : frag;
    const basePath = resolvePath(dirPart || '.');
    if (basePath) {
      const node = nodeAt(basePath);
      if (node && node.type === 'dir') {
        const keys = Object.keys(node.children);
        const matches = keys.filter(k => k.startsWith(namePart));
        candidates = matches.map(m => {
          const child = node.children[m];
          return dirPart + m + (child.type === 'dir' ? '/' : '');
        });
      }
    }
    // Smart-completion for cd/open/cat: also match bare project slugs from
    // anywhere on the plate. So `cd h<Tab>` from ~/work/oryzo can still
    // complete to `halcyon`. About/contact are also allowed for cat.
    if ((cmd === 'cd' || cmd === 'open' || cmd === 'cat') && !dirPart) {
      const extras = [];
      for (const slug of ORDER) {
        if (slug.startsWith(namePart) && !candidates.some(c => c.replace(/\/$/,'') === slug)) {
          extras.push(cmd === 'cd' ? slug + '/' : slug);
        }
      }
      if (cmd === 'cat') {
        for (const f of ['about','contact','hours','colophon']) {
          if (f.startsWith(namePart) && !candidates.includes(f)) extras.push(f);
        }
      }
      candidates = candidates.concat(extras).sort();
    }
  }

  if (candidates.length === 0) return;

  if (lastTabState && sameArr(lastTabState.matches, candidates) && lastTabState.prefix === frag) {
    const row = document.createElement('div');
    row.className = 'row instant';
    row.innerHTML = `<span class="tab-block">${candidates.map(escapeHtml).join('  ')}</span>`;
    buffer.appendChild(row);
    scrollBottom();
    lastTabState = null;
    return;
  }

  if (candidates.length === 1) {
    const only = candidates[0];
    const before = raw.slice(0, caretPos);
    const after = raw.slice(caretPos);
    // Never auto-append a space after completing a project slug — the user
    // may still want to keep typing (e.g. `cd hal<Tab>` → `cd halcyon`, then
    // they can press Enter themselves rather than us doing it implicitly).
    // Only append a space for a fully-resolved file (not a dir slash, not a
    // slug that could still be an open target).
    const isDir = only.endsWith('/');
    const isSlug = ORDER.indexOf(only) !== -1;
    const suffix = (isDir || isSlug) ? '' : ' ';
    const newBefore = before.slice(0, before.length - frag.length) + only + suffix;
    setInputText(newBefore, after);
    lastTabState = null;
    return;
  }

  const cp = commonPrefix(candidates);
  if (cp.length > frag.length) {
    const before = raw.slice(0, caretPos);
    const after = raw.slice(caretPos);
    const newBefore = before.slice(0, before.length - frag.length) + cp;
    setInputText(newBefore, after);
  }
  lastTabState = { prefix: inputText.slice(0, caretPos).split(/\s+/).pop(), matches: candidates, idx: 0 };
}

function sameArr(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function commonPrefix(arr) {
  if (!arr.length) return '';
  let p = arr[0];
  for (let i = 1; i < arr.length; i++) {
    while (arr[i].indexOf(p) !== 0) { p = p.slice(0, -1); if (!p) return ''; }
  }
  return p;
}

/* ---------- Commands ---------- */
const COMMANDS = ['cat','cd','clear','contact','help','history','hours','latest','ls','man','open','pwd','theme','whoami'];

function submitInput(opts) {
  opts = opts || {};
  const raw = inputText;
  const cmd = raw.trim();
  const fromChip = !!opts.fromChip;

  pushExecutedPrompt(raw);

  if (cmd === '') {
    setInputText('', '');
    histIdx = -1; stashCurrent = '';
    updatePrompt();
    return;
  }

  if (cmd === '!!' || /^![0-9]+$/.test(cmd)) {
    let target = null;
    if (cmd === '!!') target = history[history.length - 1];
    else {
      const n = parseInt(cmd.slice(1), 10);
      if (n >= 1 && n <= history.length) target = history[n - 1];
    }
    if (!target) {
      printLine(`<span class="err">zsh: event not found: ${escapeHtml(cmd)}</span>`);
    } else {
      printLine(escapeHtml(target));
      runCommand(target, {fromChip});
      history.push(target);
    }
    setInputText('', '');
    histIdx = -1; stashCurrent = '';
    updatePrompt();
    return;
  }

  history.push(cmd);
  if (!fromChip) SS.typedCount = SS.typedCount + 1;
  runCommand(cmd, {fromChip});
  setInputText('', '');
  histIdx = -1; stashCurrent = '';
  updatePrompt();
}

function runCommand(cmd, opts) {
  opts = opts || {};
  const tokens = cmd.split(/\s+/);
  const c = tokens[0];
  const args = tokens.slice(1);
  switch (c) {
    case 'pwd':      cmd_pwd(); break;
    case 'ls':       cmd_ls(args); break;
    case 'cd':       cmd_cd(args); break;
    case 'cat': {
      const raw = (args[0] || '').replace(/^\.\//,'').replace(/^~\//,'').replace(/\/$/,'');
      const bare = raw.split('/').pop();
      if (bare === 'about')   { renderAboutCard(); break; }
      if (bare === 'contact') { renderContactCard(); break; }
      cmd_cat(args);
      break;
    }
    case 'open': {
      const arg = (args[0] || '').replace(/\/$/,'');
      if (arg && MEDIUMS[arg]) {
        // Two-click promotion: if the inline label for this project is
        // already visible in the terminal, open the full plate. Otherwise,
        // render the inline label first so the user can preview before
        // committing to the plate view.
        //
        // On touch devices we skip the plate entirely — the inline label
        // is the whole project surface. `open` becomes idempotent: the
        // label re-renders (or stays cached) but no full-screen modal.
        if (!TOUCH && isInlineCardVisible(arg)) {
          openPlate(arg);
        } else {
          renderFile(['randy','work',arg,'label'], {});
        }
        break;
      }
      cmd_open(args);
      break;
    }
    case 'hours':    cmd_hours(); break;
    case 'contact':  cmd_contact(); break;
    case 'latest':   cmd_latest(); break;
    case 'whoami':   printLine('<span class="dim">visitor</span>'); break;
    case 'help':     cmd_help(); break;
    case 'man':      cmd_man(args); break;
    case 'history':  cmd_history(); break;
    case 'clear':    clearScreen(); break;
    case 'theme':    cmd_theme(args); break;
    default:         unknown(c);
  }
}

function cmd_pwd() {
  const p = cwd.length === 1 ? '/randy' : '/' + cwd.join('/');
  printLine(escapeHtml(p));
}

function cmd_ls(args) {
  let target = cwd;
  if (args[0]) {
    const p = resolvePath(args[0]);
    if (!p || !nodeAt(p)) { printLine(`<span class="err">ls: no such file or directory: ${escapeHtml(args[0])}</span>`); return; }
    target = p;
  }
  const node = nodeAt(target);
  if (!node) return;
  if (node.type !== 'dir') {
    printLine(escapeHtml(target[target.length-1]));
    return;
  }

  let entries;
  if (node.order) {
    entries = node.order.slice();
  } else {
    const dirs = [], files = [];
    for (const k of Object.keys(node.children)) {
      if (node.children[k].type === 'dir') dirs.push(k);
      else files.push(k);
    }
    dirs.sort(); files.sort();
    entries = [...dirs, ...files];
  }

  const key = 'ls:' + target.join('/');
  const cached = SS.animCache.has(key);
  const stagger = !cached && !REDUCED;

  if (node.marginalia) {
    const row = document.createElement('div');
    row.className = 'row' + (stagger ? ' stagger' : '');
    row.innerHTML = `<span class="marg tick" style="--marg-idx:${margCounter++ % 5}">${escapeHtml(node.marginalia)}</span>`;
    buffer.appendChild(row);
  }

  entries.forEach((name, i) => {
    const child = node.children[name];
    const isDir = child.type === 'dir';
    const display = name + (isDir ? '/' : '');
    const row = document.createElement('div');
    row.className = 'row';
    if (stagger && i < 6) {
      row.classList.add('stagger');
      row.style.animationDelay = (i * 60) + 'ms';
    }
    const btn = document.createElement('button');
    btn.className = 'link';
    btn.type = 'button';
    btn.textContent = display;
    btn.addEventListener('click', () => {
      // If we're not in this directory, prefix path
      const rel = (target.length === cwd.length && target.every((v,idx) => v === cwd[idx]))
        ? name
        : (target.slice(1).join('/') + '/' + name);
      chipInvoke(isDir ? `cd ${rel}` : `cat ${rel}`);
    });
    row.appendChild(btn);
    buffer.appendChild(row);
  });

  // Synthetic entry: `latest` is a command, not a file, but we want visitors
  // to see it in the root listing so they discover the Strava widget. It's
  // rendered like a file row but its click handler runs the command directly.
  if (target.length === 1 && target[0] === 'randy') {
    const i = entries.length;
    const row = document.createElement('div');
    row.className = 'row';
    if (stagger && i < 6) {
      row.classList.add('stagger');
      row.style.animationDelay = (i * 60) + 'ms';
    }
    const btn = document.createElement('button');
    btn.className = 'link';
    btn.type = 'button';
    btn.textContent = 'latest';
    btn.addEventListener('click', () => { chipInvoke('latest'); });
    row.appendChild(btn);
    buffer.appendChild(row);
  }

  SS.cacheAdd(key);
  scrollBottom();
}

function cmd_cd(args) {
  const arg = args[0];
  const raw = arg === undefined ? '~' : arg;

  // UI first, terminal clone second — try smart resolutions before erroring.
  const attempts = [raw];
  const bare = raw.replace(/\/$/,'');
  // If bare arg is a known project slug, allow jumping there from anywhere.
  if (MEDIUMS[bare]) attempts.push('~/work/' + bare);
  // If arg starts with "work/..." allow it to mean "~/work/..." from anywhere.
  if (bare.startsWith('work/') || bare === 'work') attempts.push('~/' + bare);
  // If arg starts with "randy/..." accept it as if from root.
  if (bare.startsWith('randy/') || bare === 'randy') attempts.push('/' + bare);

  let path = null, node = null;
  for (const a of attempts) {
    const p = resolvePath(a);
    if (!p) continue;
    const n = nodeAt(p);
    if (n && n.type === 'dir') { path = p; node = n; break; }
  }

  if (!path || !node) {
    printLine(`<span class="err">cd: no such file or directory: ${escapeHtml(arg)}</span>`);
    return;
  }
  cwd = path;
  updatePrompt();

  const p = pwdString();
  if (p === '~/work') {
    cmd_ls([]);
  } else if (p.startsWith('~/work/')) {
    // Entering a project dir: show the label directly. No ls, no marginalia.
    // Skip auto-label if the user landed here via `cd ..` from a deeper path
    // (shouldn't happen with current tree, but be defensive) or via a prior
    // visit where label is already cached this session.
    const slug = p.slice('~/work/'.length).split('/')[0];
    if (MEDIUMS[slug]) {
      renderFile(['randy','work',slug,'label'], {});
    } else {
      cmd_ls([]);
    }
  } else if (SS.cdOverrideCount < 3) {
    SS.cdOverrideCount = SS.cdOverrideCount + 1;
    printLine(`<span class="marg"># you are now in ${escapeHtml(p)}. try 'ls' or click a chip below.</span>`);
    cmd_ls([]);
  }
}

function cmd_cat(args) {
  const arg = args[0];
  if (!arg) { printLine(`<span class="err">cat: missing file</span>`); return; }
  const bare = arg.replace(/\/$/,'');

  // UI first — try smart resolutions like cmd_cd does.
  const attempts = [bare];
  // If bare is a project slug, cat its label directly.
  if (MEDIUMS[bare]) attempts.push('~/work/' + bare + '/label');
  // If arg is "work/..." from anywhere, allow it.
  if (bare.startsWith('work/')) attempts.push('~/' + bare);
  // If arg is "randy/..." allow from root.
  if (bare.startsWith('randy/')) attempts.push('/' + bare);

  let path = null, node = null;
  for (const a of attempts) {
    const p = resolvePath(a);
    if (!p) continue;
    const n = nodeAt(p);
    if (n && n.type === 'file') { path = p; node = n; break; }
  }
  if (!path || !node) {
    // Distinguish "is a directory" vs "not found" for the original arg.
    const origPath = resolvePath(bare);
    const origNode = origPath ? nodeAt(origPath) : null;
    if (origNode && origNode.type !== 'file') {
      printLine(`<span class="err">cat: ${escapeHtml(arg)}: is a directory</span>`);
    } else {
      printLine(`<span class="err">cat: no such file: ${escapeHtml(arg)}</span>`);
    }
    return;
  }
  renderFile(path);
}

function cmd_open(args) {
  const arg = args[0];
  if (!arg) { printLine(`<span class="err">open: which project?</span>`); return; }
  const slug = arg.replace(/\/$/, '');
  if (!MEDIUMS[slug]) { printLine(`<span class="err">open: unknown project: ${escapeHtml(slug)}</span>`); return; }
  const pathBase = ['randy','work',slug];
  renderFile([...pathBase,'label'], { chain: [
    [...pathBase,'plate']
  ]});
}

function cmd_hours() {
  printLine(`<span class="nowrap">${escapeHtml(HOURS_TEXT)}</span>`);
  printLine(`<span class="marg"># the studio keeps quiet hours for writing. reach out anytime — replies within a day.</span>`);
}
function cmd_contact() {
  printLine(`<span class="nowrap">${escapeHtml(CONTACT_TEXT)}</span>`);
}

function cmd_help() {
  printLine(`<span class="marg"># type any command, or click a chip below.</span>`);
  // Intentionally omits `whoami` and `man` — both still work if typed
  // directly, they just don't need to advertise themselves here.
  const rows = [
    ['pwd',     'print working directory'],
    ['ls',      'list entries in current dir'],
    ['cd',      'change directory (accepts ~, .., paths)'],
    ['cat',     'print a file'],
    ['open',    'open a project — label + plate'],
    ['hours',   'hours'],
    ['contact', 'ways to reach randy'],
    ['latest',  'most recent gps activity from strava'],
    ['help',    'this message'],
    ['history', 'recent commands'],
    ['theme',   'dark | light | auto'],
    ['clear',   'clear the screen (Ctrl-L)'],
  ];
  const w = 9;
  rows.forEach(([k,v]) => {
    printLine(`<span class="nowrap">${escapeHtml(k.padEnd(w))}</span>${escapeHtml(v)}`);
  });
}

const MAN = content.MAN;

function cmd_man(args) {
  const c = args[0];
  if (!c) { printLine(`<span class="err">man: what manual page do you want?</span>`); return; }
  const m = MAN[c];
  if (!m) { printLine(`<span class="err">man: no manual entry for ${escapeHtml(c)}</span>`); return; }
  printLine(`<span class="nowrap">NAME</span>`);
  printLine(`<span class="nowrap">     ${escapeHtml(m.name)} — ${escapeHtml(m.desc)}</span>`);
  printLine('&nbsp;');
  printLine(`<span class="nowrap">SYNOPSIS</span>`);
  printLine(`<span class="nowrap">     ${escapeHtml(m.synopsis)}</span>`);
  printLine('&nbsp;');
  printLine(`<span class="nowrap">SEE ALSO</span>`);
  printLine(`<span class="nowrap">     ${escapeHtml(m.see)}</span>`);
}

function cmd_history() {
  history.forEach((h, i) => {
    const idx = String(i + 1).padStart(4, ' ');
    printLine(`<span class="nowrap">${escapeHtml(idx)}  ${escapeHtml(h)}</span>`);
  });
}

/* ---------- theme: dark | light | auto ----------
   Reads/writes the same localStorage key as src/studio/theme.ts (`theme`)
   and dispatches the same `themechange` event so the redraw listener at
   the bottom of this file picks it up. Also drives the top-left chrome
   button's glyph — see StudioShell.tsx's `themechange` handler.

   Without an argument, prints the current effective theme and stored
   preference. `theme auto` clears the stored value so the visitor
   follows their system preference again. */
function cmd_theme(args) {
  const arg = (args[0] || '').toLowerCase();
  const html = document.documentElement;
  const stored = (() => {
    try { return localStorage.getItem('theme') || 'auto'; } catch { return 'auto'; }
  })();
  const rendered = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  if (!arg) {
    printLine(`<span class="dim">theme rendered: ${rendered}, stored: ${stored}</span>`);
    printLine('<span class="dim">usage: theme dark | light | auto</span>');
    return;
  }
  if (arg !== 'dark' && arg !== 'light' && arg !== 'auto') {
    printLine(`<span class="err">theme: unknown value "${escapeHtml(arg)}"; expected dark, light, or auto</span>`);
    return;
  }

  const next = arg === 'auto'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : arg;

  html.setAttribute('data-theme', next);
  try {
    if (arg === 'auto') localStorage.removeItem('theme');
    else localStorage.setItem('theme', arg);
  } catch {}
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  printLine(`<span class="dim">theme set to ${arg}${arg === 'auto' ? ` (resolved: ${next})` : ''}</span>`);
}

/* ---------- latest: Strava field recording ----------
   Fetches /api/strava/latest, formats distance + pace, renders an inline
   card in the same visual language as the studio notes. GPS trace is drawn
   as an SVG polyline in --ink on --cream. */

// In-shell memoization — avoids a network round-trip on repeat invocations
// within a minute. The server-side data cache holds for 15 min beyond this.
let _latestCache = null;
let _latestCacheAt = 0;

function formatDistanceKm(m) {
  return (m / 1000).toFixed(2) + ' km';
}

function formatPacePerKm(m, s) {
  if (!m || !s) return '—';
  const secPerKm = s / (m / 1000);
  const mm = Math.floor(secPerKm / 60);
  const ss = Math.round(secPerKm - mm * 60);
  return `${mm}:${String(ss).padStart(2, '0')} /km`;
}

function formatSpeedKmh(m, s) {
  if (!m || !s) return '—';
  const kmh = (m / 1000) / (s / 3600);
  return kmh.toFixed(1) + ' km/h';
}

/* Strava's `type` field is broad (Run, Ride, Swim, Hike, Walk, VirtualRide,
   EBikeRide, TrailRun, ...). Group them so we know whether to show pace
   (foot activities) or speed (wheels/water). Everything unfamiliar defaults
   to pace — matches the running-first character of the portfolio.

   Also drives the time-of-day verb ("Morning run" vs "Morning ride"). */
function activityKind(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('ride')) return 'ride';   // Ride, VirtualRide, EBikeRide, MountainBikeRide
  if (t.includes('swim')) return 'swim';
  if (t.includes('walk')) return 'walk';
  if (t.includes('hike')) return 'hike';
  if (t.includes('row'))  return 'row';    // Rowing, VirtualRow
  return 'run'; // Run, TrailRun, VirtualRun, and anything else foot-based
}

/* Speed vs pace picker. Wheels/water get speed (km/h); feet get pace (min/km). */
function paceOrSpeed(kind, m, s) {
  if (kind === 'ride' || kind === 'swim' || kind === 'row') {
    return { label: 'Speed', value: formatSpeedKmh(m, s) };
  }
  return { label: 'Pace', value: formatPacePerKm(m, s) };
}

/* Human-readable verb for the title. Reads Strava's type but doesn't quote
   the athlete's own title text — the shell chooses its own words. */
function activityVerb(kind) {
  return { run: 'run', ride: 'ride', swim: 'swim', walk: 'walk', hike: 'hike', row: 'row' }[kind] || 'session';
}

/* Time-of-day bucket, using the activity's own start time (not the viewer's
   wall clock). Matches Strava's default naming convention. */
function timeOfDay(iso) {
  const h = new Date(iso).getHours();
  if (h < 5)  return 'Late night';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night';
}

function generatedTitle(activity) {
  return `${timeOfDay(activity.startDate)} ${activityVerb(activityKind(activity.activityType))}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* Build the latest-activity card. Mirrors inlineCardEl's structure — kicker,
   title, meta dl, hairline rule, "blurb" (which here is the SVG map), hint —
   so it inherits every styling rule that already exists for label-card. */
function latestCardEl(activity) {
  const card = document.createElement('div');
  card.className = 'label-card';

  const kicker = document.createElement('div');
  kicker.className = 'label-kicker';
  kicker.textContent = '§ LATEST FIELD RECORDING';

  const title = document.createElement('h2');
  title.className = 'label-title';
  title.textContent = generatedTitle(activity);

  const meta = document.createElement('dl');
  meta.className = 'label-meta';
  const kind = activityKind(activity.activityType);
  const speed = paceOrSpeed(kind, activity.distanceM, activity.movingTimeS);
  const rows = [
    ['Distance',   formatDistanceKm(activity.distanceM)],
    [speed.label,  speed.value],
    ['Type',       String(activity.activityType || 'Activity')],
    ['Date',       formatDate(activity.startDate)],
  ];
  for (const [k, v] of rows) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    meta.appendChild(dt); meta.appendChild(dd);
  }

  const rule = document.createElement('div');
  rule.className = 'label-rule';

  // The SVG map takes the visual slot the blurb would occupy. Match the
  // stroke language of the plate SVGs: ink on cream, 1px non-scaling.
  const mapWrap = document.createElement('div');
  mapWrap.className = 'label-blurb';
  mapWrap.style.padding = '0';
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 360 200');
  svg.setAttribute('width', '100%');
  svg.setAttribute('style', 'display:block; max-width:100%; height:auto;');
  svg.setAttribute('data-strava-polyline', '1'); // for themechange redraw
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', activity.polylinePath);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', themePalette().ink);
  path.setAttribute('stroke-width', '1');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(path);
  mapWrap.appendChild(svg);

  const hint = document.createElement('div');
  hint.className = 'label-hint';
  hint.innerHTML = 'From Strava. Refreshes every 15 minutes.';

  card.appendChild(kicker);
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(rule);
  card.appendChild(mapWrap);
  card.appendChild(hint);
  return card;
}

function renderLatestCard(activity) {
  // Use the activity id in the cache key so a new activity always animates
  // in even if the user already saw a previous one this session.
  const key = 'card:latest:' + activity.id;
  const card = latestCardEl(activity);
  card.dataset.inlineSlug = 'latest';
  if (SS.animCache.has(key) || REDUCED) {
    const wrap = document.createElement('div');
    wrap.className = 'row';
    wrap.appendChild(card);
    buffer.appendChild(wrap);
    scrollBottom();
  } else {
    animateLabelCard(card, () => { SS.cacheAdd(key); });
  }
}

async function cmd_latest() {
  // 60s in-shell memoization; server cache handles the longer window.
  const now = Date.now();
  if (_latestCache && now - _latestCacheAt < 60000) {
    renderLatestCard(_latestCache);
    return;
  }

  // Print a soft "fetching" line that we'll leave in the buffer — it acts as
  // a natural preface to the card, and gives the user feedback if the fetch
  // is slow (cold serverless).
  const loadingRow = document.createElement('div');
  loadingRow.className = 'row';
  loadingRow.innerHTML = '<span class="dim">fetching latest activity…</span>';
  buffer.appendChild(loadingRow);
  scrollBottom();

  try {
    const res = await fetch('/api/strava/latest', { cache: 'no-store' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      loadingRow.remove();
      if (res.status === 503) {
        printLine('<span class="err">latest: strava not connected yet.</span>');
        printLine('<span class="dim">the artist has to visit /api/strava/connect once to authorize.</span>');
      } else if (res.status === 404) {
        printLine('<span class="err">latest: no gps activities found on the artist\'s account.</span>');
      } else {
        printLine('<span class="err">latest: ' + escapeHtml(body.error || ('http ' + res.status)) + '</span>');
      }
      return;
    }
    const activity = await res.json();
    _latestCache = activity;
    _latestCacheAt = Date.now();
    loadingRow.remove();
    renderLatestCard(activity);
  } catch (e) {
    loadingRow.remove();
    printLine('<span class="err">latest: network error — ' + escapeHtml(e.message || String(e)) + '</span>');
  }
}

function clearScreen() {
  buffer.innerHTML = '';
  scrollBottom();
}

function unknown(c) {
  // Fuzzy navigation: when a bare token doesn't match any command, try to
  // read it as a place. This is the "gimmick" nicety — from anywhere in the
  // tree, typing e.g. `work` or `oryzo` or `abo` should just take you there
  // instead of erroring. Scope is intentional: root files, root dirs, project
  // slugs, and children of the current or parent directory (one level up,
  // one level down).
  const hit = fuzzyNavTarget(c);
  if (hit) {
    printLine(`<span class="marg"># ${escapeHtml(hit.hint)}</span>`);
    runCommand(hit.cmd, {});
    return;
  }
  const suggestion = closestCommand(c);
  printLine(`<span class="err">zsh: command not found: ${escapeHtml(c)}</span>`);
  if (suggestion) {
    printLine(`<span class="err">did you mean '${escapeHtml(suggestion)}'?</span>`);
  }
}

/* Fuzzy navigation resolver.
   Returns null (no confident match) or { cmd, hint } where cmd is the actual
   engine command to run (e.g. "cd work" / "cat about" / "open oryzo") and
   hint is a short line rendered above the result so the user sees what we
   interpreted. */
function fuzzyNavTarget(raw) {
  const q = String(raw || '').trim().toLowerCase();
  if (q.length < 2) return null;

  // Candidate pool: label → { verb, arg, place }.
  // `verb` is what runCommand receives; `place` is the human-readable hint.
  const pool = [];
  // Root files
  for (const f of ['about','contact','hours','colophon']) {
    pool.push({ label: f, verb: 'cat', arg: `~/${f}`, place: `~/${f}` });
  }
  // Root dirs
  pool.push({ label: 'work', verb: 'cd', arg: '~/work', place: '~/work' });
  // Project slugs — "open" is the most useful verb from anywhere.
  for (const slug of ORDER) {
    pool.push({ label: slug, verb: 'open', arg: slug, place: `~/work/${slug}` });
  }
  // Latest command (no path — surface as itself).
  pool.push({ label: 'latest', verb: 'latest', arg: '', place: '~/latest' });
  // Current-dir children (one level "down" from where you stand).
  const here = nodeAt(cwd);
  if (here && here.children) {
    for (const k of Object.keys(here.children)) {
      const child = here.children[k];
      const rel = k;
      const place = (pwdString() === '~' ? '~/' : pwdString() + '/') + k;
      const verb = child.type === 'dir' ? 'cd' : 'cat';
      pool.push({ label: k, verb, arg: rel, place });
    }
  }
  // Sibling entries (one level "up" — parent's other children).
  if (cwd.length > 1) {
    const parent = nodeAt(cwd.slice(0, -1));
    if (parent && parent.children) {
      const self = cwd[cwd.length - 1];
      for (const k of Object.keys(parent.children)) {
        if (k === self) continue;
        const child = parent.children[k];
        // Reference the sibling by absolute-ish path so cd resolves correctly
        // regardless of where the user is.
        const parentPath = cwd.slice(1, -1).join('/');
        const rel = parentPath ? `~/${parentPath}/${k}` : `~/${k}`;
        const verb = child.type === 'dir' ? 'cd' : 'cat';
        pool.push({ label: k, verb, arg: rel, place: rel });
      }
    }
  }

  // Rank: prefix > substring > small Levenshtein. Break ties by shortest label
  // (prefer "work" over "workroom" for `work`).
  let best = null;
  let bestScore = Infinity;
  for (const c of pool) {
    const label = c.label.toLowerCase();
    let score;
    if (label === q) score = 0;
    else if (label.startsWith(q)) score = 1;
    else if (label.includes(q)) score = 2;
    else {
      const d = levenshtein(q, label);
      // Only accept typo-tolerant matches when the query is close enough that
      // a bystander would agree — cap at 2 edits.
      if (d > 2) continue;
      score = 2 + d;
    }
    // Tiebreak on shorter labels (better exact intent).
    score = score * 100 + label.length;
    if (score < bestScore) { bestScore = score; best = c; }
  }
  if (!best) return null;

  const cmd = best.arg ? `${best.verb} ${best.arg}` : best.verb;
  const hint = `jumping to ${best.place}`;
  return { cmd, hint };
}

function closestCommand(input) {
  let best = null, bestD = 3;
  for (const c of COMMANDS) {
    const d = levenshtein(input, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
function levenshtein(a,b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = new Array(n+1);
  for (let j=0;j<=n;j++) dp[j]=j;
  for (let i=1;i<=m;i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j=1;j<=n;j++) {
      const t = dp[j];
      dp[j] = a[i-1]===b[j-1] ? prev : 1 + Math.min(prev, dp[j-1], dp[j]);
      prev = t;
    }
  }
  return dp[n];
}

/* ---------- File rendering ---------- */
function renderFile(path, opts) {
  opts = opts || {};
  const name = path[path.length - 1];
  const isProject = path.length === 4 && path[1] === 'work' && MEDIUMS[path[2]];

  if (name === 'about') {
    const key = 'file:about';
    if (SS.animCache.has(key) || REDUCED) {
      printLine(escapeHtml(ABOUT_TEXT));
      afterFile(opts);
    } else {
      typeFirstLineThenDump(ABOUT_TEXT, () => { SS.cacheAdd(key); afterFile(opts); });
    }
    return;
  }
  if (name === 'contact')  { printLine(`<span class="nowrap">${escapeHtml(CONTACT_TEXT)}</span>`); afterFile(opts); return; }
  if (name === 'hours')    { printLine(`<span class="nowrap">${escapeHtml(HOURS_TEXT)}</span>`);   afterFile(opts); return; }
  if (name === 'colophon') { printLine(`<span class="nowrap">${escapeHtml(COLOPHON_TEXT)}</span>`); afterFile(opts); return; }

  if (isProject) {
    const slug = path[2];
    const key = `${name}:${slug}`;
    const cached = SS.animCache.has(key);
    if (name === 'label') {
      if (cached || REDUCED) { renderLabelInstant(slug); afterFile(opts); }
      else { renderLabelAnimated(slug, () => { SS.cacheAdd(key); afterFile(opts); }); }
      return;
    }
    if (name === 'plate') {
      if (cached || REDUCED) { renderPlateInstant(slug); afterFile(opts); }
      else { renderPlateAnimated(slug, () => { SS.cacheAdd(key); afterFile(opts); }); }
      return;
    }
    if (name === 'notes') {
      const t = NOTES[slug] || '';
      if (cached || REDUCED) { printLine(`<span class="marg">${escapeHtml(t)}</span>`); afterFile(opts); }
      else { typeFirstLineThenDumpMarg(t, () => { SS.cacheAdd(key); afterFile(opts); }); }
      return;
    }
  }

  printLine(`<span class="err">cat: cannot read ${escapeHtml(name)}</span>`);
  afterFile(opts);
}

function afterFile(opts) {
  if (opts && opts.chain && opts.chain.length) {
    const next = opts.chain.shift();
    if (REDUCED) renderFile(next, opts);
    else setTimeout(() => renderFile(next, opts), 200);
  }
}

/* ---------- Studio note — inline HTML card (serif + mono, no ASCII box) ---------- */
function labelCardEl(slug) {
  const m = MEDIUMS[slug];
  const card = document.createElement('div');
  card.className = 'label-card';
  card.dataset.inlineSlug = slug;

  const kicker = document.createElement('div');
  kicker.className = 'label-kicker';
  kicker.textContent = '§ Studio note';

  const title = document.createElement('h2');
  title.className = 'label-title';
  // Title-case with special-case for two-word slugs (Signal Garden)
  const displayTitle = String(m.title || slug).replace(/\b\w/g, c => c.toUpperCase()).toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
  title.textContent = displayTitle;

  const meta = document.createElement('dl');
  meta.className = 'label-meta';
  const rows = [
    ['Artist', 'Randy Ren'],
    ['Year', String(m.year)],
    ['Medium', m.medium],
    ['Dimensions', m.dim],
    ['From',       'From the studio'],
  ];
  for (const [k, v] of rows) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    meta.appendChild(dt); meta.appendChild(dd);
  }

  const rule = document.createElement('div');
  rule.className = 'label-rule';

  const blurb = document.createElement('p');
  blurb.className = 'label-blurb';
  blurb.textContent = m.blurb;

  const hint = document.createElement('div');
  hint.className = 'label-hint';
  hint.innerHTML = 'Type <span class="lk">open ' + slug + '</span> to see the full page.';

  card.appendChild(kicker);
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(rule);
  card.appendChild(blurb);
  // The hint points at the full-plate view — which doesn't exist on
  // touch. Skip the append so mobile visitors aren't told to "Type
  // `open oryzo` to see the full page" when there IS no full page.
  if (!TOUCH) card.appendChild(hint);
  return card;
}

function renderLabelInstant(slug) {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  const card = labelCardEl(slug);
  wrap.appendChild(card);
  buffer.appendChild(wrap);
  scrollBottom();
  // Chip row may need to collapse now that a label is on screen.
  renderChips();
}

/* Build an inline card matching the wall-label visual language, for arbitrary content. */
function inlineCardEl(opts) {
  const card = document.createElement('div');
  card.className = 'label-card';

  const kicker = document.createElement('div');
  kicker.className = 'label-kicker';
  kicker.textContent = opts.kicker;

  const title = document.createElement('h2');
  title.className = 'label-title';
  title.textContent = opts.title;

  const meta = document.createElement('dl');
  meta.className = 'label-meta';
  for (const row of opts.meta) {
    const dt = document.createElement('dt'); dt.textContent = row[0];
    const dd = document.createElement('dd');
    if (row[2] === 'html') dd.innerHTML = row[1];
    else dd.textContent = row[1];
    meta.appendChild(dt); meta.appendChild(dd);
  }

  const rule = document.createElement('div');
  rule.className = 'label-rule';

  const blurb = document.createElement('p');
  blurb.className = 'label-blurb';
  blurb.textContent = opts.blurb;

  const hint = document.createElement('div');
  hint.className = 'label-hint';
  hint.innerHTML = opts.hintHtml;

  card.appendChild(kicker);
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(rule);
  card.appendChild(blurb);
  card.appendChild(hint);
  return card;
}

/* Return true if an inline card with data-inline-slug=slug is currently on
   screen (any part visible in the terminal viewport). Used to promote a
   second `cat about` / `cat contact` into a full plate view. */
function isInlineCardVisible(slug) {
  const cards = buffer.querySelectorAll('[data-inline-slug="' + slug + '"]');
  if (!cards.length) return false;
  const termRect = term.getBoundingClientRect();
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    // Visible if any part overlaps the terminal viewport.
    if (r.bottom > termRect.top && r.top < termRect.bottom) return true;
  }
  return false;
}

/* Return the first slug (from the provided list) whose inline card is
   currently visible in the terminal viewport. Used to reduce chip clutter
   when the user has already opened one project's label. */
function firstVisibleInlineSlug(slugList) {
  for (const s of slugList) {
    if (isInlineCardVisible(s)) return s;
  }
  return null;
}

function aboutCardEl() {
  return inlineCardEl({
    kicker: '§ ABOUT THE STUDIO',
    title: 'Randy Ren',
    meta: [
      ['Based', 'San Francisco, CA'],
      ['Focus', 'AI × Interface'],
      ['Status', 'Open Fall 2026'],
      ['Practice', 'Design + Engineering'],
    ],
    blurb: "Randy is a designer-engineer working at the seam between AI systems and human interfaces. Previously shipped consumer products used by millions; now focused on making agents feel like real collaborators — the kind you'd want in the room, not the kind that eats your afternoon. Believes the best interfaces disappear until you need them, then arrive already knowing why.",
    hintHtml: 'Type <span class="lk">cat contact</span> to reach out.'
  });
}

function contactCardEl() {
  const mail = '<a href="mailto:hey@randy.sh" class="lk" style="color:var(--ink);font-weight:500;text-decoration:none;border-bottom:1px solid var(--ink);">hey@randy.sh</a>';
  const tw   = '<a href="https://twitter.com/randyren" target="_blank" rel="noopener" class="lk" style="color:var(--ink);font-weight:500;text-decoration:none;border-bottom:1px solid var(--ink);">@randyren</a>';
  const gh   = '<a href="https://github.com/randyren" target="_blank" rel="noopener" class="lk" style="color:var(--ink);font-weight:500;text-decoration:none;border-bottom:1px solid var(--ink);">randyren</a>';
  const li   = '<a href="https://linkedin.com/in/randyren" target="_blank" rel="noopener" class="lk" style="color:var(--ink);font-weight:500;text-decoration:none;border-bottom:1px solid var(--ink);">/in/randyren</a>';
  return inlineCardEl({
    kicker: '§ GET IN TOUCH',
    title: 'Get in touch',
    meta: [
      ['Email',    mail, 'html'],
      ['Twitter',  tw,   'html'],
      ['GitHub',   gh,   'html'],
      ['LinkedIn', li,   'html'],
      ['Based',    'San Francisco · PT/GMT−7'],
    ],
    blurb: "Open to select client work and staff+ roles starting fall 2026. Best reached by email; I read everything. I like problems where the interface is doing more than displaying — where the interaction itself changes the shape of the work.",
    hintHtml: 'Type <span class="lk">cat about</span> to know more.'
  });
}

function renderAboutCard() {
  const key = 'card:about';
  const card = aboutCardEl();
  card.dataset.inlineSlug = 'about';
  if (SS.animCache.has(key) || REDUCED) {
    const wrap = document.createElement('div');
    wrap.className = 'row';
    wrap.appendChild(card);
    buffer.appendChild(wrap);
    scrollBottom();
  } else {
    animateLabelCard(card, () => { SS.cacheAdd(key); });
  }
}

function renderContactCard() {
  const key = 'card:contact';
  const card = contactCardEl();
  card.dataset.inlineSlug = 'contact';
  if (SS.animCache.has(key) || REDUCED) {
    const wrap = document.createElement('div');
    wrap.className = 'row';
    wrap.appendChild(card);
    buffer.appendChild(wrap);
    scrollBottom();
  } else {
    animateLabelCard(card, () => { SS.cacheAdd(key); });
  }
}

let revealInProgress = false;
let revealFinishers = [];
function finishReveal() {
  const list = revealFinishers.slice();
  revealFinishers = [];
  for (const f of list) { try { f(); } catch(e) {} }
  revealInProgress = false;
}

function renderLabelAnimated(slug, done) {
  const card = labelCardEl(slug);
  // Refresh chips one tick after the card is inserted into the buffer, so the
  // chip row collapses in sync with the reveal starting.
  animateLabelCard(card, done);
  requestAnimationFrame(() => renderChips());
}

/* Shared corner-typed reveal for studio notes, about, and contact cards.
   A small caret walks the card top-to-bottom; each section streams its
   characters left-to-right, section by section. No shimmer. */
function animateLabelCard(card, done) {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  wrap.appendChild(card);
  buffer.appendChild(wrap);

  if (REDUCED) {
    scrollBottom();
    revealInProgress = false;
    done && done();
    return;
  }

  const kickerEl = card.querySelector('.label-kicker');
  const titleEl  = card.querySelector('.label-title');
  const metaEl   = card.querySelector('.label-meta');
  const ruleEl   = card.querySelector('.label-rule');
  const blurbEl  = card.querySelector('.label-blurb');
  const hintEl   = card.querySelector('.label-hint');

  // Snapshot final text of each text node; empty them; type them back in place.
  // For elements with mixed inline HTML (like hint with .lk span), snapshot innerHTML.
  const kickerText = kickerEl ? kickerEl.textContent : '';
  const titleText  = titleEl  ? titleEl.textContent  : '';
  const blurbHtml  = blurbEl  ? blurbEl.innerHTML    : '';
  const hintHtml   = hintEl   ? hintEl.innerHTML     : '';

  // Meta rows — capture each dt/dd pair's original textContent (and any HTML in dd for links).
  const metaChildren = metaEl ? Array.from(metaEl.children) : [];
  const metaSnaps = [];
  for (let i = 0; i < metaChildren.length; i += 2) {
    const dt = metaChildren[i];
    const dd = metaChildren[i+1];
    metaSnaps.push({
      dt, dd,
      dtText: dt ? dt.textContent : '',
      ddHtml: dd ? dd.innerHTML   : ''
    });
  }

  // Pre-frame: with the card FULLY populated (as inserted above), measure each
  // animated section and lock its height via min-height. That freezes the
  // card's outer dimensions to their FINAL layout before we clear any text,
  // so scrollBottom() below lands the whole card + trailing prompt + chips
  // in view once — and the reveal that follows doesn't grow the box.
  const dispose = [];
  if (kickerEl) dispose.push(reserveHeight(kickerEl));
  if (titleEl)  dispose.push(reserveHeight(titleEl));
  if (metaEl)   dispose.push(reserveHeight(metaEl));
  if (blurbEl)  dispose.push(reserveHeight(blurbEl));
  if (hintEl)   dispose.push(reserveHeight(hintEl));

  // Now that heights are locked, park the tail at the visible bottom.
  // #chips is the last child of #term, so scrollHeight includes it —
  // scrollBottom() brings the whole tail (card bottom + prompt + chips)
  // into view. This is the ONE scroll for the whole reveal.
  scrollBottom();

  // Card starts empty visually — hide each element until its type-in starts.
  const hide = (el) => { if (el) { el.style.opacity = '0'; } };
  hide(kickerEl); hide(titleEl); hide(ruleEl); hide(blurbEl); hide(hintEl);
  if (metaEl) metaEl.style.opacity = '0';
  metaSnaps.forEach(m => { if (m.dt) m.dt.textContent = ''; if (m.dd) m.dd.innerHTML = ''; });
  if (kickerEl) kickerEl.textContent = '';
  if (titleEl)  titleEl.textContent  = '';
  if (blurbEl)  blurbEl.innerHTML    = '';
  if (hintEl)   hintEl.innerHTML     = '';
  if (ruleEl)   ruleEl.style.transform = 'scaleX(0)';

  // No caret during card reveal — content types in without any tracking cursor.
  card.style.position = card.style.position || 'relative';

  // Corner-trace frame — four L-brackets that draw first, then the four edges
  // complete inward. Uses one <svg> with four <path>s (one per side, each drawn
  // from its corner toward the midpoint).
  const frameSvg = buildCardFrame(card);
  card.classList.add('framing');
  card.appendChild(frameSvg);

  revealInProgress = true;
  const timers = [];
  const T = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  let cancelled = false;

  // Kick off the frame. Visible but not indulgent — corners trace over ~800ms.
  const FRAME_MS = 800;
  animateCardFrame(frameSvg, FRAME_MS);
  // Bring the native border back at the moment the frame completes.
  T(() => {
    card.classList.remove('framing');
    if (frameSvg && frameSvg.parentNode) frameSvg.parentNode.removeChild(frameSvg);
  }, FRAME_MS + 40);

  // No-op: caret removed from card reveal; kept as a stub because it's called
  // from many places inside the typing routines.
  function repositionCaretTo(_el) { /* intentionally empty */ }

  // Type text into el (textContent). msPerChar: base cadence.
  function typeInto(el, text, msPerChar, onDone) {
    if (!el || cancelled) { onDone && onDone(); return; }
    el.style.opacity = '1';
    let i = 0;
    const step = () => {
      if (cancelled) return;
      el.textContent = text.slice(0, i);
      repositionCaretTo(el);
      if (i >= text.length) { onDone && onDone(); return; }
      const ch = text.charAt(i);
      let delay = msPerChar;
      const seed = ((i * 9301 + 49297) % 233280) / 233280;
      delay += (seed - 0.5) * 6;
      if (/[.,;:!?]/.test(ch)) delay += 40;
      if (ch === '—') delay += 60;
      if (ch === '\n') delay += 80;
      i++;
      const t = setTimeout(step, delay);
      timers.push(t);
    };
    step();
  }

  // Type into an element that may contain HTML (e.g. blurb with <em>, hint with <span class="lk">).
  function typeHtmlInto(el, html, msPerChar, onDone) {
    if (!el || cancelled) { onDone && onDone(); return; }
    el.style.opacity = '1';
    el.innerHTML = html;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push({ node: walker.currentNode, target: walker.currentNode.textContent });
    nodes.forEach(n => { n.node.textContent = ''; });
    let ni = 0, ci = 0;
    const step = () => {
      if (cancelled) return;
      if (ni >= nodes.length) { onDone && onDone(); return; }
      const n = nodes[ni];
      if (ci > n.target.length) { ni++; ci = 0; const t = setTimeout(step, 8); timers.push(t); return; }
      n.node.textContent = n.target.slice(0, ci);
      repositionCaretTo(el);
      const ch = n.target.charAt(ci) || '';
      let delay = msPerChar;
      const seed = ((ni * 131 + ci * 9301 + 49297) % 233280) / 233280;
      delay += (seed - 0.5) * 6;
      if (/[.,;:!?]/.test(ch)) delay += 40;
      if (ch === '—') delay += 60;
      ci++;
      const t = setTimeout(step, delay);
      timers.push(t);
    };
    step();
  }

  // Sequence — top to bottom. Because the card's outer height was locked
  // via reserveHeight() above, sections type in place without changing
  // layout, and no per-section scroll is needed.
  const seq = [];
  // Ceremony: wait until the frame is a little underway, then start content.
  seq.push((next) => T(next, Math.floor(FRAME_MS * 0.45)));
  seq.push((next) => {
    typeInto(kickerEl, kickerText, 22, next);
  });
  seq.push((next) => T(next, 90));
  seq.push((next) => {
    typeInto(titleEl, titleText, 24, next);
  });
  seq.push((next) => T(next, 120));
  seq.push((next) => {
    if (metaEl) metaEl.style.opacity = '1';
    let mi = 0;
    const doRow = () => {
      if (mi >= metaSnaps.length) { next(); return; }
      const m = metaSnaps[mi];
      typeInto(m.dt, m.dtText, 12, () => {
        typeHtmlInto(m.dd, m.ddHtml, 11, () => {
          mi++;
          T(doRow, 40);
        });
      });
    };
    doRow();
  });
  seq.push((next) => T(next, 100));
  seq.push((next) => {
    if (ruleEl) {
      ruleEl.style.opacity = '1';
      ruleEl.style.transition = 'transform 340ms cubic-bezier(0.16,1,0.3,1)';
      requestAnimationFrame(() => { ruleEl.style.transform = 'scaleX(1)'; });
    }
    T(next, 260);
  });
  seq.push((next) => {
    typeHtmlInto(blurbEl, blurbHtml, 14, next);
  });
  seq.push((next) => T(next, 120));
  seq.push((next) => {
    typeHtmlInto(hintEl, hintHtml, 12, next);
  });
  // Small settle beat at the end — release the min-height locks so the
  // card can flex to natural sizing on future reflows (theme flip, window
  // resize). By this point the ink is set; the box was correctly sized;
  // nothing visible changes when the locks come off.
  seq.push((next) => {
    dispose.forEach(fn => { try { fn(); } catch(e) {} });
    T(next, 200);
  });

  let idx = 0;
  const runNext = () => {
    if (cancelled) return;
    if (idx >= seq.length) {
      revealInProgress = false;
      done && done();
      return;
    }
    const step = seq[idx++];
    step(runNext);
  };
  runNext();

  revealFinishers.push(() => {
    cancelled = true;
    timers.forEach(clearTimeout);
    // Release any still-armed height locks — user aborted mid-reveal, so
    // some sections may still have their inline min-height set.
    dispose.forEach(fn => { try { fn(); } catch(e) {} });
    // Snap to final state.
    card.classList.remove('framing');
    if (frameSvg && frameSvg.parentNode) frameSvg.parentNode.removeChild(frameSvg);
    if (kickerEl) { kickerEl.textContent = kickerText; kickerEl.style.opacity = '1'; }
    if (titleEl)  { titleEl.textContent  = titleText;  titleEl.style.opacity  = '1'; }
    if (metaEl)   metaEl.style.opacity = '1';
    metaSnaps.forEach(m => {
      if (m.dt) m.dt.textContent = m.dtText;
      if (m.dd) m.dd.innerHTML   = m.ddHtml;
    });
    if (ruleEl)  { ruleEl.style.opacity  = '1'; ruleEl.style.transform = 'scaleX(1)'; }
    if (blurbEl) { blurbEl.innerHTML     = blurbHtml; blurbEl.style.opacity = '1'; }
    if (hintEl)  { hintEl.innerHTML      = hintHtml;  hintEl.style.opacity  = '1'; }
    revealInProgress = false;
    done && done();
  });
}

/* Build the four-sided corner-trace frame for a card. Returns an <svg> element
   containing four <path>s (top, right, bottom, left), each drawn from its
   starting corner toward the midpoint of its edge. Uses viewBox in card pixels
   captured at build time (we re-measure on paint). */
function buildCardFrame(card) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'card-frame');
  svg.setAttribute('preserveAspectRatio', 'none');
  // We'll set viewBox and path data after measurement so it matches actual card size.
  const rect = card.getBoundingClientRect();
  const W = Math.max(40, Math.round(rect.width));
  const H = Math.max(40, Math.round(rect.height));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  // Four L-shaped corner brackets that grow into full edges.
  // Each side is a <path>. It is drawn from one corner toward the midpoint.
  // The four sides together compose the whole border.
  const mkPath = (d) => {
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    return p;
  };
  // Path definitions — draw from a corner along one edge toward its midpoint,
  // then from the same corner along the perpendicular edge toward its midpoint.
  // Two paths meet at each edge midpoint.
  const top    = mkPath(`M ${W/2} 0 L 0 0 L 0 ${H/2}`);          // top-left corner
  const right  = mkPath(`M ${W} ${H/2} L ${W} 0 L ${W/2} 0`);    // top-right corner
  const bottom = mkPath(`M ${W/2} ${H} L ${W} ${H} L ${W} ${H/2}`); // bottom-right corner
  const left   = mkPath(`M 0 ${H/2} L 0 ${H} L ${W/2} ${H}`);    // bottom-left corner
  [top, right, bottom, left].forEach(p => svg.appendChild(p));
  return svg;
}

function animateCardFrame(svg, totalMs) {
  const paths = Array.from(svg.querySelectorAll('path'));
  const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
  paths.forEach((p, i) => {
    const len = p.getTotalLength ? p.getTotalLength() : 400;
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
    // stagger corners: two pairs of diagonally opposite corners
    // top-left + bottom-right start together; top-right + bottom-left start ~80ms later.
    const stagger = (i === 0 || i === 2) ? 0 : 80;
    p.style.transition = `stroke-dashoffset ${totalMs - stagger}ms ${easing}`;
    p.style.transitionDelay = `${stagger}ms`;
    // Force reflow so transition takes hold on the next frame.
    // eslint-disable-next-line no-unused-expressions
    p.getBoundingClientRect();
    requestAnimationFrame(() => {
      p.style.strokeDashoffset = '0';
    });
  });
}

/* ---------- Plates (SVG) ---------- */
function plateFor(slug) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const wrap = document.createElement('div');
  wrap.className = 'plate-wrap';
  wrap.setAttribute('data-motif-slug', slug); // for themechange redraw
  const svg = document.createElementNS(svgNS, 'svg');
  const W = 360, H = 200;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  /* Treatment D — stripped + heritage accent.
     `ink` for the majority of strokes, `accent` for the one asymmetric
     element per motif (was prussian in the old cream palette). No wash —
     the motif floats on the plate figure's own muted radial. `muted` is
     used only for the corner slug glyph. All colors resolved fresh so a
     `themechange` redraw picks up the flipped palette. */
  const p = themePalette();
  const ink = p.ink, accent = p.accent, muted = p.muted;
  const strokes = [];

  function arc(cx,cy,r,a1,a2,color){
    const p = document.createElementNS(svgNS,'path');
    const toXY = (a) => [cx + r*Math.cos(a), cy + r*Math.sin(a)];
    const [x1,y1] = toXY(a1); const [x2,y2] = toXY(a2);
    const large = (a2 - a1) > Math.PI ? 1 : 0;
    p.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`);
    p.setAttribute('stroke', color); p.setAttribute('fill','none'); p.setAttribute('stroke-width','1');
    p.setAttribute('vector-effect','non-scaling-stroke');
    return p;
  }
  function circle(cx,cy,r,color){
    const c = document.createElementNS(svgNS,'circle');
    c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',r);
    c.setAttribute('stroke',color); c.setAttribute('fill','none'); c.setAttribute('stroke-width','1');
    c.setAttribute('vector-effect','non-scaling-stroke');
    return c;
  }
  function rect(x,y,w,h,color){
    const r = document.createElementNS(svgNS,'rect');
    r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',h);
    r.setAttribute('stroke',color); r.setAttribute('fill','none'); r.setAttribute('stroke-width','1');
    r.setAttribute('vector-effect','non-scaling-stroke');
    return r;
  }
  function line(x1,y1,x2,y2,color){
    const l = document.createElementNS(svgNS,'line');
    l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2);
    l.setAttribute('stroke', color); l.setAttribute('stroke-width','1'); l.setAttribute('fill','none');
    l.setAttribute('vector-effect','non-scaling-stroke');
    return l;
  }
  function poly(pts, color) {
    const p = document.createElementNS(svgNS,'polygon');
    p.setAttribute('points', pts);
    p.setAttribute('stroke',color); p.setAttribute('fill','none'); p.setAttribute('stroke-width','1');
    p.setAttribute('vector-effect','non-scaling-stroke');
    return p;
  }

  let washRect = null;

  if (slug === 'oryzo') {
    strokes.push(arc(180, 130, 90, Math.PI*1.05, Math.PI*1.95, ink));
    strokes.push(arc(180, 130, 68, Math.PI*1.10, Math.PI*1.90, ink));
    strokes.push(arc(180, 130, 46, Math.PI*1.15, Math.PI*1.85, accent));
    strokes.push(line(180, 130, 180, 30, ink));
  } else if (slug === 'halcyon') {
    strokes.push(rect(60, 40, 240, 120, ink));
    strokes.push(poly('90,90 130,90 120,120', accent));
    strokes.push(poly('220,70 260,70 250,100', ink));
    strokes.push(poly('180,130 220,130 210,160', accent));
  } else if (slug === 'aperture') {
    strokes.push(circle(180, 100, 78, ink));
    strokes.push(circle(180, 100, 54, ink));
    strokes.push(circle(180, 100, 30, accent));
    strokes.push(circle(180, 100, 12, ink));
  } else if (slug === 'fieldnote') {
    for (let i = 0; i < 7; i++) {
      strokes.push(line(60, 40 + i * 20, 300, 40 + i * 20, ink));
    }
    strokes.push(line(210, 30, 210, 170, accent));
  } else if (slug === 'signal-garden') {
    const hex = (cx, cy, r) => {
      let pts = '';
      for (let k = 0; k < 6; k++) {
        const a = Math.PI/3 * k + Math.PI/6;
        pts += `${(cx + r*Math.cos(a)).toFixed(2)},${(cy + r*Math.sin(a)).toFixed(2)} `;
      }
      return pts.trim();
    };
    const offsets = [[-70,-30],[0,-30],[70,-30],[-35,20],[35,20],[0,70]];
    offsets.forEach((o,i) => {
      const p = poly(hex(180+o[0], 100+o[1], 22), i===2 ? accent : ink);
      p.setAttribute('transform', `rotate(4 ${180+o[0]} ${100+o[1]})`);
      strokes.push(p);
    });
  } else if (slug === 'loom') {
    const cx = 180, cy = 100;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      const x = cx + 40 * Math.cos(a), y = cy + 40 * Math.sin(a);
      strokes.push(circle(x, y, 32, i === 0 ? accent : ink));
    }
  }

  strokes.forEach(s => svg.appendChild(s));
  if (washRect) {
    washRect.setAttribute('opacity','0');
    svg.appendChild(washRect);
  }

  const g = document.createElementNS(svgNS,'text');
  g.setAttribute('x', W-8); g.setAttribute('y', H-6);
  g.setAttribute('text-anchor','end');
  g.setAttribute('font-family','IBM Plex Mono, monospace');
  g.setAttribute('font-size','9');
  g.setAttribute('fill', muted);
  g.setAttribute('letter-spacing','1.5');
  g.textContent = slug.toUpperCase().replace('-',' ');
  svg.appendChild(g);

  wrap.appendChild(svg);
  return { wrap, strokes, washRect, glyph: g };
}

function renderPlateInstant(slug) {
  const { wrap, strokes, washRect, glyph } = plateFor(slug);
  buffer.appendChild(wrap);
  strokes.forEach(s => { s.style.strokeDashoffset = '0'; });
  if (washRect) washRect.setAttribute('opacity','0.82');
  glyph.style.opacity = '1';
  scrollBottom();
}

function renderPlateAnimated(slug, done) {
  const { wrap, strokes, washRect, glyph } = plateFor(slug);
  buffer.appendChild(wrap);
  scrollBottom();

  strokes.forEach(s => {
    try {
      const len = s.getTotalLength ? s.getTotalLength() : 400;
      s.style.strokeDasharray = String(len);
      s.style.strokeDashoffset = String(len);
      s._len = len;
    } catch(e) { s._len = 400; }
  });
  glyph.style.opacity = '0';

  revealInProgress = true;
  const start = performance.now();
  const strokeStart = 400, strokeEnd = 780;
  const dur = strokeEnd - strokeStart;
  let raf = 0;
  // trailing 15% at 40% speed
  function progressAt(t) {
    // t is 0..1 of the stroke reveal duration
    // eased outer curve
    const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out approx
    // apply trailing drag: last 0.15 of the eased distance at 0.4x speed
    // if eased <= 0.85, linear map to 0..0.85
    // else the remaining 0.15 needs 0.375 time-budget; but we already spent (t) time.
    // Simple: split time-domain instead. First 70% of time delivers 85% of distance, last 30% delivers 15% at slower rate.
    if (t <= 0.70) return (t / 0.70) * 0.85;
    return 0.85 + ((t - 0.70) / 0.30) * 0.15;
  }
  function frame(now) {
    const el = now - start;
    if (el < strokeStart) { raf = requestAnimationFrame(frame); return; }
    let t = (el - strokeStart) / dur;
    if (t > 1) t = 1;
    const p = progressAt(t);
    strokes.forEach(s => {
      const len = s._len || 400;
      s.style.strokeDashoffset = String(len * (1 - p));
    });
    if (t < 1) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  let washRAF = requestAnimationFrame(function w(now){
    const el = now - start;
    if (!washRect) return;
    if (el < 560) { washRAF = requestAnimationFrame(w); return; }
    let t = (el - 560) / 240;
    if (t > 1) t = 1;
    const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    washRect.setAttribute('opacity', String(eased * 0.82));
    if (t < 1) washRAF = requestAnimationFrame(w);
  });

  const glyphShow = setTimeout(() => { glyph.style.opacity = '1'; }, 780);
  const doneT = setTimeout(() => {
    revealInProgress = false;
    done && done();
  }, 820);

  revealFinishers.push(() => {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(washRAF);
    strokes.forEach(s => { s.style.strokeDashoffset = '0'; });
    if (washRect) washRect.setAttribute('opacity','0.82');
    glyph.style.opacity = '1';
    clearTimeout(glyphShow); clearTimeout(doneT);
    revealInProgress = false;
    done && done();
  });
}

/* ---------- Type-first-line-then-dump helpers ---------- */
function typeFirstLineThenDump(text, done) {
  const idx = text.indexOf(' ', 40);
  const cutAt = idx > 0 ? idx : Math.min(60, text.length);
  const head = text.slice(0, cutAt);
  const tail = text.slice(cutAt);
  const row = document.createElement('div');
  row.className = 'row';
  const s = document.createElement('span');
  row.appendChild(s);
  buffer.appendChild(row);
  scrollBottom();
  let i = 0;
  revealInProgress = true;
  const timers = [];
  function step() {
    if (i >= head.length) {
      s.textContent = head + tail;
      revealInProgress = false;
      done && done();
      return;
    }
    i++;
    s.textContent = head.slice(0, i);
    const to = setTimeout(step, 16);
    timers.push(to);
  }
  step();
  revealFinishers.push(() => {
    timers.forEach(clearTimeout);
    s.textContent = text;
    revealInProgress = false;
    done && done();
  });
}
function typeFirstLineThenDumpMarg(text, done) {
  const idx = text.indexOf(' ', 40);
  const cutAt = idx > 0 ? idx : Math.min(60, text.length);
  const head = text.slice(0, cutAt);
  const tail = text.slice(cutAt);
  const row = document.createElement('div');
  row.className = 'row';
  const s = document.createElement('span');
  s.className = 'marg';
  row.appendChild(s);
  buffer.appendChild(row);
  scrollBottom();
  let i = 0;
  revealInProgress = true;
  const timers = [];
  function step() {
    if (i >= head.length) {
      s.textContent = head + tail;
      revealInProgress = false;
      done && done();
      return;
    }
    i++;
    s.textContent = head.slice(0, i);
    const to = setTimeout(step, 16);
    timers.push(to);
  }
  step();
  revealFinishers.push(() => {
    timers.forEach(clearTimeout);
    s.textContent = text;
    revealInProgress = false;
    done && done();
  });
}

/* ---------- Plate viewer (full-viewport editorial takeover) ---------- */

const ROMAN = { 2023: 'MMXXIII', 2024: 'MMXXIV', 2025: 'MMXXV', 2026: 'MMXXVI' };

const PLATE_DATA = content.PLATE_DATA;

let plateOpen = false;
let plateEl = null;
let plateLastFocus = null;

function isEditableFocus() {
  const a = document.activeElement;
  if (!a) return false;
  const tag = a.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || a.isContentEditable;
}

function svgNS() { return 'http://www.w3.org/2000/svg'; }

function buildStripes() {
  const ns = svgNS();
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'stripes-svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('viewBox', '0 0 1000 500');
  // stripe every ~16px in viewBox coordinates
  for (let x = 8; x < 1000; x += 16) {
    const l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', x); l.setAttribute('x2', x);
    l.setAttribute('y1', 0); l.setAttribute('y2', 500);
    l.setAttribute('stroke', themePalette().ink);
    l.setAttribute('stroke-width', '1');
    l.setAttribute('opacity', '0.06');
    l.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(l);
  }
  return svg;
}

function buildMotif(slug) {
  const ns = svgNS();
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'motif-svg');
  svg.setAttribute('data-motif-slug', slug); // for themechange redraw
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const W = 1000, H = 500;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  /* Full-page motif ~/projects. Same treatment-D mapping as plateFor().
     `about` motif keeps its subtle background rectangle — we use muted
     instead of the old umber. Colors read live from CSS vars. */
  const p = themePalette();
  const ink = p.ink, accent = p.accent, muted = p.muted;
  const strokes = [];

  const addLine = (x1,y1,x2,y2,color,opacity,sw) => {
    const l = document.createElementNS(ns,'line');
    l.setAttribute('x1',x1); l.setAttribute('x2',x2);
    l.setAttribute('y1',y1); l.setAttribute('y2',y2);
    l.setAttribute('stroke', color);
    l.setAttribute('stroke-width', sw || 1);
    if (opacity !== undefined) l.setAttribute('opacity', opacity);
    l.setAttribute('vector-effect','non-scaling-stroke');
    l.setAttribute('fill','none');
    return l;
  };
  const addCircle = (cx,cy,r,color,opacity,sw) => {
    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',r);
    c.setAttribute('stroke',color); c.setAttribute('fill','none');
    c.setAttribute('stroke-width', sw || 1);
    if (opacity !== undefined) c.setAttribute('opacity', opacity);
    c.setAttribute('vector-effect','non-scaling-stroke');
    return c;
  };
  const addPoly = (pts, color, opacity, filled) => {
    const p = document.createElementNS(ns,'polygon');
    p.setAttribute('points', pts);
    p.setAttribute('stroke', color);
    p.setAttribute('fill', filled ? color : 'none');
    p.setAttribute('stroke-width','1');
    if (opacity !== undefined) p.setAttribute('opacity', opacity);
    p.setAttribute('vector-effect','non-scaling-stroke');
    return p;
  };

  if (slug === 'oryzo') {
    // dense vertical hairlines + horizontal accent rule
    for (let x = 40; x < W - 40; x += 6) {
      const el = addLine(x, 60, x, H - 60, ink, 0.28);
      svg.appendChild(el);
      strokes.push(el);
    }
    const rule = addLine(40, H/2, W - 40, H/2, accent, 1, 1.5);
    svg.appendChild(rule);
    strokes.push(rule);
  } else if (slug === 'halcyon') {
    // scatter of small cursor triangles
    const rand = (seed) => {
      let s = seed;
      return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    };
    const r = rand(7);
    for (let i = 0; i < 32; i++) {
      const x = 60 + r() * (W - 120);
      const y = 60 + r() * (H - 120);
      const sz = 14 + r() * 10;
      const color = r() > 0.7 ? accent : ink;
      const opacity = 0.3 + r() * 0.55;
      const pts = `${x},${y} ${x + sz},${y + sz*0.35} ${x + sz*0.4},${y + sz*0.75} ${x + sz*0.25},${y + sz}`;
      const p = addPoly(pts, color, opacity, true);
      svg.appendChild(p);
      strokes.push(p);
    }
  } else if (slug === 'aperture') {
    // concentric circles
    const cx = W/2, cy = H/2;
    const radii = [200, 160, 122, 88, 58, 32];
    radii.forEach((rd, i) => {
      const c = addCircle(cx, cy, rd, i === radii.length - 1 ? accent : ink, 0.7 - i*0.05);
      svg.appendChild(c);
      strokes.push(c);
    });
    // filled iris center
    const iris = addCircle(cx, cy, 14, accent, 1);
    iris.setAttribute('fill', accent);
    svg.appendChild(iris);
    strokes.push(iris);
  } else if (slug === 'fieldnote') {
    // notebook lines + caret glyph
    for (let i = 0; i < 12; i++) {
      const y = 60 + i * 32;
      if (y > H - 40) break;
      const l = addLine(60, y, W - 60, y, ink, 0.35);
      svg.appendChild(l);
      strokes.push(l);
    }
    // caret glyph on one line
    const cx = 280, cy = 60 + 5 * 32;
    const caretW = 14, caretH = 20;
    const p = addPoly(`${cx},${cy - caretH/2} ${cx + caretW},${cy} ${cx},${cy + caretH/2}`, accent, 1, false);
    p.setAttribute('stroke-width','1.5');
    svg.appendChild(p);
    strokes.push(p);
    // small vertical hairline for caret bar
    const bar = addLine(cx + caretW + 6, cy - caretH/2, cx + caretW + 6, cy + caretH/2, accent, 1, 1.5);
    svg.appendChild(bar);
    strokes.push(bar);
  } else if (slug === 'signal-garden') {
    // hex cell grid
    const hex = (cx, cy, r) => {
      let pts = '';
      for (let k = 0; k < 6; k++) {
        const a = Math.PI/3 * k + Math.PI/6;
        pts += `${(cx + r*Math.cos(a)).toFixed(2)},${(cy + r*Math.sin(a)).toFixed(2)} `;
      }
      return pts.trim();
    };
    const R = 34;
    const dx = R * Math.sqrt(3);
    const dy = R * 1.5;
    let idx = 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 9; col++) {
        const x = 120 + col * dx + (row % 2 ? dx/2 : 0);
        const y = 90 + row * dy;
        if (x > W - 80 || y > H - 60) continue;
        idx++;
        const seed = ((idx * 9301 + 49297) % 233280) / 233280;
        const filled = seed > 0.72;
        const p = addPoly(hex(x, y, R * 0.85), filled ? accent : ink, filled ? 0.7 : 0.4, filled);
        svg.appendChild(p);
        strokes.push(p);
      }
    }
  } else if (slug === 'loom') {
    // six interlocking loops
    const cx = W/2, cy = H/2;
    const R = 90;
    const layout = [
      [-R*1.6, -R*0.5], [0, -R*0.5], [R*1.6, -R*0.5],
      [-R*0.8, R*0.5], [R*0.8, R*0.5], [0, R*0.5 + R*0.6]
    ];
    layout.forEach((o, i) => {
      const c = addCircle(cx + o[0], cy + o[1], R, i === 0 ? accent : ink, 0.65);
      svg.appendChild(c);
      strokes.push(c);
    });
  } else if (slug === 'about') {
    // subtle muted rectangle with a single accent rule bisecting
    const g = document.createElementNS(ns, 'rect');
    g.setAttribute('x', 60); g.setAttribute('y', 80);
    g.setAttribute('width', W - 120); g.setAttribute('height', H - 160);
    g.setAttribute('fill', muted);
    g.setAttribute('opacity', '0.08');
    g.setAttribute('stroke', 'none');
    svg.appendChild(g);
    const rule = addLine(60, H/2, W - 60, H/2, accent, 0.75, 1);
    svg.appendChild(rule);
    strokes.push(rule);
  } else if (slug === 'contact') {
    // no motif — the giant email overlay is the figure; leave the stripes background alone
  }

  return { svg, strokes };
}

function makeCol(labText, valText, withGlyph) {
  const col = document.createElement('div');
  col.className = 'col';
  const lab = document.createElement('div');
  lab.className = 'lab';
  if (withGlyph) {
    const g = document.createElement('span');
    g.className = 'glyph';
    g.textContent = '└';
    lab.appendChild(g);
  }
  lab.appendChild(document.createTextNode(labText));
  const val = document.createElement('div');
  val.className = 'val';
  val.textContent = valText;
  col.appendChild(lab);
  col.appendChild(val);
  return col;
}

function openPlate(slug) {
  if (plateOpen) return;
  const data = PLATE_DATA[slug];
  if (!data) return;

  plateLastFocus = document.activeElement;
  plateOpen = true;
  busy = true; // block terminal input while plate is up

  const overlay = document.createElement('div');
  overlay.className = 'plate-overlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-label', data.title + ' plate');
  overlay.setAttribute('aria-modal','true');
  overlay.tabIndex = -1;

  // The floating card that hosts all plate content
  const card = document.createElement('div');
  card.className = 'plate-card';

  // Vertical hairline rules inset 24px from plate-card edges
  const ruleLeft = document.createElement('div');
  ruleLeft.className = 'plate-rule-left';
  const ruleRight = document.createElement('div');
  ruleRight.className = 'plate-rule-right';
  card.appendChild(ruleLeft);
  card.appendChild(ruleRight);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'plate-close';
  closeBtn.setAttribute('aria-label','Close plate (Esc)');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => closePlate());

  const inner = document.createElement('div');
  inner.className = 'plate-inner';

  // Header
  const header = document.createElement('div');
  header.className = 'plate-header';

  const marker = document.createElement('div');
  marker.className = 'plate-marker';
  marker.innerHTML = `§ ${escapeHtml(data.marker)}` + (data.number ? `<span class="num">${escapeHtml(data.number)}</span>` : '');
  header.appendChild(marker);

  const title = document.createElement('h1');
  title.className = 'plate-title';
  title.textContent = data.title;
  header.appendChild(title);

  const year = document.createElement('div');
  year.className = 'plate-year';
  year.textContent = data.year ? (ROMAN[data.year] || String(data.year)) : '';
  header.appendChild(year);

  inner.appendChild(header);

  const rule = document.createElement('div');
  rule.className = 'plate-rule';
  inner.appendChild(rule);

  // Meta grid
  const meta = document.createElement('div');
  meta.className = 'plate-meta';
  data.meta.forEach((m, i) => {
    meta.appendChild(makeCol(m.lab, m.val, i === 0));
  });
  inner.appendChild(meta);

  // Figure
  const figWrap = document.createElement('div');
  figWrap.className = 'plate-figure-wrap';
  const fig = document.createElement('div');
  fig.className = 'plate-figure';

  const stripes = buildStripes();
  fig.appendChild(stripes);

  const wash = document.createElement('div');
  wash.className = 'wash';
  fig.appendChild(wash);

  const cap = document.createElement('div');
  cap.className = 'plate-cap';
  cap.textContent = data.plateCap;
  fig.appendChild(cap);

  let strokes = [];
  if (slug === 'contact') {
    const emailWrap = document.createElement('div');
    emailWrap.className = 'email-plate';
    const a = document.createElement('a');
    a.href = 'mailto:hey@randy.sh';
    a.textContent = 'hey@randy.sh';
    emailWrap.appendChild(a);
    fig.appendChild(emailWrap);
  } else {
    const motif = buildMotif(slug);
    fig.appendChild(motif.svg);
    strokes = motif.strokes;
  }

  figWrap.appendChild(fig);
  inner.appendChild(figWrap);

  // Essay
  const essayWrap = document.createElement('div');
  essayWrap.className = 'plate-essay-wrap';
  const essayLabel = document.createElement('div');
  essayLabel.className = 'plate-essay-label';
  essayLabel.textContent = '└ ESSAY';
  essayWrap.appendChild(essayLabel);
  const essay = document.createElement('div');
  essay.className = 'plate-essay';
  data.essay.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    essay.appendChild(el);
  });
  essayWrap.appendChild(essay);
  inner.appendChild(essayWrap);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'plate-footer';
  footer.textContent = 'PRESS ESC OR × TO RETURN TO THE SHELL';
  inner.appendChild(footer);

  overlay.appendChild(card);
  card.appendChild(closeBtn);
  card.appendChild(inner);
  document.body.appendChild(overlay);

  overlay.addEventListener('pointerdown', (e) => {
    // only if clicked/tapped directly on the overlay (not any child card).
    // pointerdown fires for mouse, touch, and pen — a superset of mousedown
    // that also works reliably on iOS Safari where mousedown synthesis from
    // touch is inconsistent.
    if (e.target === overlay) closePlate();
  });

  plateEl = overlay;

  const cacheKey = 'plate:' + slug;
  const motifCached = SS.animCache.has(cacheKey);

  // Prepare motif stroke-in
  if (!REDUCED && !motifCached && strokes.length) {
    strokes.forEach(s => {
      try {
        const len = s.getTotalLength ? s.getTotalLength() : 400;
        s.style.strokeDasharray = String(len);
        s.style.strokeDashoffset = String(len);
        s._len = len;
      } catch(e) { s._len = 400; }
    });
  }

  // Trigger reveal
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    requestAnimationFrame(() => {
      overlay.classList.add('mounted');
    });
  });

  // Motif draw-in animation, starting after grid stagger (~540ms after mount)
  if (!REDUCED && !motifCached && strokes.length) {
    const startAt = performance.now() + 540;
    const dur = 600;
    let raf = 0;
    function ease(t) {
      // cubic-bezier(0.16, 1, 0.3, 1) approximation with final 15% decelerated
      const e = 1 - Math.pow(1 - t, 3);
      if (e <= 0.85) return e;
      return 0.85 + (e - 0.85) * 0.6;
    }
    function frame(now) {
      if (!plateOpen || plateEl !== overlay) return;
      if (now < startAt) { raf = requestAnimationFrame(frame); return; }
      let t = (now - startAt) / dur;
      if (t > 1) t = 1;
      const p = ease(t);
      strokes.forEach(s => {
        const len = s._len || 400;
        s.style.strokeDashoffset = String(len * (1 - p));
      });
      if (t < 1) raf = requestAnimationFrame(frame);
      else SS.cacheAdd(cacheKey);
    }
    raf = requestAnimationFrame(frame);
  } else if (strokes.length) {
    strokes.forEach(s => { s.style.strokeDashoffset = '0'; });
    SS.cacheAdd(cacheKey);
  } else {
    SS.cacheAdd(cacheKey);
  }

  // Focus management: focus close button (or the mailto link on contact)
  setTimeout(() => {
    if (!plateOpen || plateEl !== overlay) return;
    if (slug === 'contact') {
      const link = overlay.querySelector('.email-plate a');
      if (link) { link.focus(); return; }
    }
    closeBtn.focus();
  }, 240);
}

function closePlate() {
  if (!plateOpen || !plateEl) return;
  const overlay = plateEl;
  plateOpen = false;
  overlay.classList.remove('mounted');
  overlay.classList.remove('open');
  overlay.classList.add('closing');
  const cleanup = () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    plateEl = null;
    busy = false;
    // restore focus to terminal prompt
    focusInput();
    if (plateLastFocus && plateLastFocus.focus && document.contains(plateLastFocus)) {
      try { plateLastFocus.focus({preventScroll:true}); } catch(e) {}
    }
    plateLastFocus = null;
  };
  if (REDUCED) { cleanup(); return; }
  setTimeout(cleanup, 260);
}


/* ---------- Cmd-K palette ---------- */
const palette = document.getElementById('palette');
const palInput = document.getElementById('pal-input');
const palList = document.getElementById('pal-list');
let paletteOpen = false;
let palIdx = 0;
let palItems = [];

function palEntries() {
  const items = [];
  COMMANDS.forEach(c => items.push({ label: c, kind: 'command', run: () => runFromPalette(c) }));
  function walk(node, prefix) {
    if (!node.children) return;
    for (const k of Object.keys(node.children)) {
      const child = node.children[k];
      const p = prefix + '/' + k;
      if (child.type === 'dir') {
        items.push({ label: '~' + p.replace(/^\/randy/,''), kind: 'dir', run: () => runFromPalette('cd ~' + p.replace(/^\/randy/,'')) });
        walk(child, p);
      } else {
        items.push({ label: '~' + p.replace(/^\/randy/,''), kind: 'file', run: () => runFromPalette('cat ~' + p.replace(/^\/randy/,'')) });
      }
    }
  }
  walk(FS, '/randy');
  ORDER.forEach(s => items.push({ label: `open ${s}`, kind: 'project', run: () => runFromPalette('open ' + s) }));
  return items;
}

function runFromPalette(cmd) {
  closePalette();
  setTimeout(() => chipInvoke(cmd), 40);
}

function openPalette() {
  paletteOpen = true;
  SS.cmdKUsed = true;
  chromeCmdK.classList.add('gone');
  palette.classList.add('open');
  palInput.value = '';
  renderPalList('');
  setTimeout(() => palInput.focus(), 10);
}
function closePalette() {
  paletteOpen = false;
  palette.classList.remove('open');
  focusInput();
}
function renderPalList(q) {
  const items = palEntries();
  const s = q.toLowerCase();
  palItems = s
    ? items.filter(i => i.label.toLowerCase().includes(s) || i.kind.includes(s))
    : items;
  palIdx = 0;
  palList.innerHTML = '';
  if (!palItems.length) {
    palList.innerHTML = '<div class="pal-empty">nothing matches.</div>';
    return;
  }
  palItems.forEach((it, i) => {
    const d = document.createElement('div');
    d.className = 'pal-item' + (i === palIdx ? ' sel' : '');
    d.innerHTML = `<span>${escapeHtml(it.label)}</span><span class="kind">${escapeHtml(it.kind)}</span>`;
    d.addEventListener('mouseenter', () => { palIdx = i; refreshPalSel(); });
    d.addEventListener('click', () => it.run());
    palList.appendChild(d);
  });
}
function refreshPalSel() {
  [...palList.children].forEach((c, i) => c.classList.toggle('sel', i === palIdx));
  const sel = palList.children[palIdx];
  if (sel && sel.scrollIntoView) sel.scrollIntoView({block:'nearest'});
}
palInput.addEventListener('input', () => renderPalList(palInput.value));
palInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closePalette(); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); if (palIdx < palItems.length-1) palIdx++; refreshPalSel(); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); if (palIdx > 0) palIdx--; refreshPalSel(); return; }
  if (e.key === 'Enter') { e.preventDefault(); const it = palItems[palIdx]; if (it) it.run(); return; }
});
palette.addEventListener('pointerdown', (e) => {
  if (e.target === palette) closePalette();
});

/* ---------- Boot sequence ---------- */

function boot() {
  updatePrompt();
  renderChips();
  focusInput();

  // Reduced-motion visitors get the filesystem straight away — the ceremony
  // would just flash past. Everyone else gets the full preamble every load;
  // the cookie fast-path is gone.
  if (REDUCED) {
    cmd_ls([]);
    return;
  }
  busy = true;

  const now = new Date();
  const stamp = now.toDateString() + ' ' + now.toTimeString().split(' ')[0];
  const lines = [
    { text: '[randy.sh — studio v0.9]', delay: 0 },
    { text: `Last login: ${stamp} on tty1`, delay: 90 },
    { text: '', delay: 130 },
    { text: '$ source ~/.randyrc', delay: 220 },
    { text: '[studio hours — open]', umber: true, delay: 380 },
    { text: '[lights on]', umber: true, delay: 560 },
    { text: '', delay: 620 },
    { text: 'welcome, visitor.', delay: 780 },
    { text: "type 'help' — or click a chip below to begin.", delay: 920 },
  ];

  const timers = [];
  lines.forEach(l => {
    const to = setTimeout(() => {
      const row = document.createElement('div');
      row.className = 'row';
      if (l.text === '') row.innerHTML = '&nbsp;';
      else if (l.umber) row.innerHTML = `<span class="umber">${escapeHtml(l.text)}</span>`;
      else row.textContent = l.text;
      if (l.text === '[lights on]' && !REDUCED) {
        row.classList.add('boot-pulse');
      }
      buffer.appendChild(row);
      scrollBottom();
    }, l.delay);
    timers.push(to);
  });
  // Once the ceremony finishes (either the natural timeline or a user-skip)
  // we run a single trailing `ls`. `bootDone` guards against both paths
  // firing back-to-back — without it the timed finish fires, then the user's
  // very next keystroke re-enters skip() and appends a second `ls` block.
  let bootDone = false;
  const removeSkipListeners = () => {
    window.removeEventListener('keydown', skip, true);
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('wheel', skip, true);
  };
  const complete = () => {
    if (bootDone) return;
    bootDone = true;
    busy = false;
    cmd_ls([]);
    removeSkipListeners();
  };
  const finish = setTimeout(complete, 1200);
  timers.push(finish);

  const skip = () => {
    if (bootDone) return;
    timers.forEach(clearTimeout);
    buffer.innerHTML = '';
    lines.forEach(l => {
      const row = document.createElement('div');
      row.className = 'row';
      if (l.text === '') row.innerHTML = '&nbsp;';
      else if (l.umber) row.innerHTML = `<span class="umber">${escapeHtml(l.text)}</span>`;
      else row.textContent = l.text;
      buffer.appendChild(row);
    });
    complete();
  };
  window.addEventListener('keydown', skip, {capture:true, once:true});
  // pointerdown is a superset of mousedown that also fires on iOS touch taps.
  window.addEventListener('pointerdown', skip, {capture:true, once:true});
  window.addEventListener('wheel', skip, {capture:true, once:true, passive:true});
}

/* ---------- Init ---------- */
if (SS.cmdKUsed) chromeCmdK.classList.add('gone');

/* Ambient life-signs — chrome tag flicker + scroll affordance */
if (!REDUCED) {
  const chromeMark = document.querySelector('.chrome-tr-mark');
  function scheduleFlicker() {
    const wait = 8000 + Math.random() * 4000; // 8-12s
    setTimeout(() => {
      if (!chromeMark) return;
      chromeMark.classList.add('flicker');
      setTimeout(() => chromeMark.classList.remove('flicker'), 120);
      scheduleFlicker();
    }, wait);
  }
  scheduleFlicker();

  const scrollAff = document.getElementById('scroll-aff');
  function checkScrollAff() {
    if (!scrollAff) return;
    const nearBottom = (term.scrollHeight - term.scrollTop - term.clientHeight) < 24;
    scrollAff.classList.toggle('on', !nearBottom);
  }
  // Re-render chips when the visible inline label changes so the chip row
  // collapses to a focused set when a project label is on screen, and expands
  // back to the full six-project menu when the user scrolls it out of view.
  let lastVisibleSlug = null;
  function checkChipContext() {
    if (pwdString() !== '~/work') { lastVisibleSlug = null; return; }
    const v = firstVisibleInlineSlug(ORDER);
    if (v !== lastVisibleSlug) {
      lastVisibleSlug = v;
      renderChips();
    }
  }
  term.addEventListener('scroll', () => { checkScrollAff(); checkChipContext(); }, { passive: true });
  window.addEventListener('resize', () => { checkScrollAff(); checkChipContext(); });
  // initial check
  setTimeout(() => { checkScrollAff(); checkChipContext(); }, 400);
}

// Engine entrypoint. In index.html this was `window.addEventListener('load',
// ...)` and fired as part of natural page load. In the Next.js wrapper the
// engine is loaded lazily by React's useEffect — by the time bootShell runs,
// `load` has already fired, so the listener would never trigger. Guard on
// document.readyState to invoke immediately when appropriate.
if (document.readyState === 'complete') {
  runPageLoader(() => { boot(); });
} else {
  window.addEventListener('load', () => {
    runPageLoader(() => { boot(); });
  });
}

/* ---------- Page-level first-visit loader ----------
   Storage key: randy_page_loaded (sessionStorage — clears on new tab / hard
   refresh, so a browser reload replays the ceremony). */
function hasPageLoadedThisSession() {
  try { return sessionStorage.getItem('randy_page_loaded') === '1'; } catch(e) { return false; }
}
function markPageLoadedThisSession() {
  try { sessionStorage.setItem('randy_page_loaded','1'); } catch(e) {}
}
function runPageLoader(done) {
  const el = document.getElementById('page-loader');
  if (!el) { done(); return; }
  // Skip if already loaded this session, or reduced motion.
  if (hasPageLoadedThisSession() || REDUCED) {
    el.remove();
    done();
    return;
  }
  document.body.classList.add('pl-active');
  el.setAttribute('data-active', '1');
  markPageLoadedThisSession();

  const num  = document.getElementById('pl-num');
  const fill = document.getElementById('pl-fill');
  const log  = document.getElementById('pl-log');

  // Log lines (staggered as counter advances). Each fires at a percent threshold.
  const lines = [
    { at:  4, text: '[randy.sh] studio v0.9', cls: 'lg-dim' },
    { at: 12, text: 'linking /usr/lib/agents..done', cls: 'lg-dim' },
    { at: 22, text: 'mounting /work (6 volumes)..done', cls: 'lg-dim' },
    { at: 34, text: 'reading /randy/.order..done', cls: 'lg-dim' },
    { at: 44, text: 'linking /work/*..ok', cls: 'lg-ok' },
    { at: 56, text: 'starting shell..done', cls: 'lg-dim' },
    { at: 66, text: 'loading typeface: Instrument Serif..done', cls: 'lg-dim' },
    { at: 76, text: 'loading typeface: IBM Plex Mono..done', cls: 'lg-dim' },
    { at: 84, text: 'lights on..ok', cls: 'lg-ok' },
    { at: 92, text: 'sourcing ~/.randyrc..done', cls: 'lg-dim' },
    { at: 98, text: 'ready.', cls: 'lg-ok' },
  ];

  // Counter animation: 0 → 100 over ~2200ms with slight non-linear cadence
  // (fast at first, small plateau around 60-75%, then quick finish — feels like a real boot).
  const DURATION = 2200;
  const t0 = performance.now();
  let logIdx = 0;
  let cancelled = false;

  const easedProgress = (t) => {
    // A gentle S-curve with a plateau around 60-75%.
    // Piecewise: 0-0.4 linear-ish, 0.4-0.75 slowed, 0.75-1 fast finish.
    if (t < 0.4)   return t * 1.25;                    // 0 → 50 quickly
    if (t < 0.75)  return 0.50 + (t - 0.4) * 0.71;     // 50 → 75 slower
    return 0.75 + (t - 0.75) * 1.0;                    // 75 → 100 quick
  };

  // Latches so `done` fires at most once and skip() can't run after the
  // loader has already dissolved (its listeners live on `window`, so a
  // keystroke seconds after natural completion used to re-enter skip →
  // schedule another dissolve → call `done` a second time → boot again).
  let doneFired = false;
  const teardownSkipListeners = () => {
    window.removeEventListener('keydown', skip, true);
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('wheel', skip, true);
  };
  const finish = () => {
    if (doneFired) return;
    doneFired = true;
    teardownSkipListeners();
    if (el && el.parentNode) el.parentNode.removeChild(el);
    done();
  };

  function tick(now) {
    if (cancelled) return;
    const t = Math.min(1, (now - t0) / DURATION);
    const p = Math.min(1, easedProgress(t));
    const pct = Math.floor(p * 100);
    if (num) num.textContent = String(pct);
    if (fill) fill.style.width = pct + '%';
    // Emit any log lines whose threshold has been passed.
    while (logIdx < lines.length && pct >= lines[logIdx].at) {
      const l = lines[logIdx++];
      const row = document.createElement('span');
      row.className = 'lg-line ' + (l.cls || '');
      row.textContent = l.text + '\n';
      if (log) log.appendChild(row);
    }
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Hold at 100 briefly, then dissolve.
      setTimeout(dissolve, 220);
    }
  }

  function dissolve() {
    if (cancelled || doneFired) return;
    el.classList.add('dissolve');
    document.body.classList.remove('pl-active');
    setTimeout(finish, 720);
  }

  function skip() {
    if (cancelled || doneFired) return;
    cancelled = true;
    teardownSkipListeners();
    // Flush counter to 100 and all log lines.
    if (num) num.textContent = '100';
    if (fill) fill.style.width = '100%';
    while (logIdx < lines.length) {
      const l = lines[logIdx++];
      const row = document.createElement('span');
      row.className = 'lg-line ' + (l.cls || '');
      row.textContent = l.text + '\n';
      if (log) log.appendChild(row);
    }
    setTimeout(() => {
      cancelled = false; // allow dissolve to proceed
      dissolve();
    }, 120);
  }

  window.addEventListener('keydown', skip, {capture:true, once:true});
  window.addEventListener('pointerdown', skip, {capture:true, once:true});
  window.addEventListener('wheel', skip, {capture:true, once:true, passive:true});

  requestAnimationFrame(tick);
}

}
