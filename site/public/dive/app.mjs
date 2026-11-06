import {
  DAY_SECONDS,
  ROUND_COUNT,
  STORAGE_KEY,
  dayKey,
  dailyNumber,
  createRun,
  recordAnswer,
  evaluateAnswer,
  loadProgress,
  saveProgress,
  finishRun,
} from './model.mjs';
import { CATEGORIES, QUESTIONS } from './questions.mjs';
import { mountOcean } from './scene.mjs';
import { RARITY_BANDS, rarityFor, diveRarityFor, rarityIcon, rarityLadder } from './rarity.mjs';

const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const number = (value) => Number(value).toLocaleString('en-US');
const dateLabel = (key) =>
  new Date(`${key}T12:00:00Z`)
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
    .toUpperCase();
let storage;
let persistent = true;
try {
  storage = window.localStorage;
} catch {
  /* Private browsing can disable storage. */
}
let progress = loadProgress(storage);
let run = null;
let feedback = false;
let deadline = 0;
let interval = null;
let selected = { mode: 'daily', dateKey: dayKey(), category: 'all' };
let wasBest = false;
let followToday = true;
let audio;
const scene = mountOcean($('#ocean'));
const screen = $('#screen');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.dataset.input = 'pointer';
addEventListener(
  'pointerdown',
  () => {
    document.documentElement.dataset.input = 'pointer';
  },
  true,
);
addEventListener(
  'keydown',
  (event) => {
    if (event.key === 'Tab' || event.key.startsWith('Arrow'))
      document.documentElement.dataset.input = 'keyboard';
  },
  true,
);
function revealScreen() {
  if (!reducedMotion.matches)
    screen.animate(
      [
        { opacity: 0, transform: 'translateY(5px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 160, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );
}

function persist() {
  persistent = saveProgress(storage, progress);
  if (!persistent)
    $('#storage-note').textContent = 'Storage is unavailable. Scores last only this visit.';
}
function playTone(good, notes = [392, 587.33]) {
  if (!progress.sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    audio ??= new Audio();
    audio.resume().catch(() => {});
    const now = audio.currentTime;
    const tones = good ? notes : [196, 146.83];
    for (let i = 0; i < tones.length; i++) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = tones[i];
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.035, now + i * 0.1 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.28);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now + i * 0.1);
      oscillator.stop(now + i * 0.1 + 0.3);
    }
  } catch {
    /* Sound is optional on browsers without Web Audio. */
  }
}
function stopClock() {
  clearInterval(interval);
  interval = null;
}
function updateSound() {
  $('#sound').classList.toggle('muted', !progress.sound);
  $('#sound').setAttribute('aria-pressed', String(progress.sound));
  $('#sound').setAttribute('aria-label', progress.sound ? 'Turn sound off' : 'Turn sound on');
}
function updateMetrics() {
  const score = run?.score ?? 0;
  $('#score').textContent = number(score);
  $('#best').textContent = number(progress.best);
  $('#scene-depth').textContent = number(score * 10);
  $('#depth-marker').style.top = `${(score / 700) * 100}%`;
  $('#zone').textContent =
    score >= 600
      ? 'THE HADAL ZONE · KEEP WONDERING'
      : score >= 400
        ? 'THE ABYSS · A QUIET KIND OF WONDER'
        : score >= 200
          ? 'MIDNIGHT WATER · FOLLOW THE LIGHT'
          : score > 0
            ? 'THE TWILIGHT ZONE · DOWN WE GO'
            : 'A LITTLE OUT OF OUR DEPTH';
  scene.setDepth(score * 10);
  const key = run?.dateKey ?? selected.dateKey;
  $('#dive-label').textContent =
    (run?.mode ?? selected.mode) === 'daily'
      ? `${key === dayKey() ? 'DAILY' : 'ARCHIVE'} DIVE № ${dailyNumber(key)}`
      : `${selected.category === 'all' ? 'OPEN WATER' : (CATEGORIES.find((item) => item.id === selected.category)?.label ?? 'THEMED').toUpperCase()} · UNLIMITED`;
  $('#daily-date').textContent = dateLabel(key);
  $('#daily-mode').classList.toggle('selected', selected.mode === 'daily');
  $('#unlimited-mode').classList.toggle('selected', selected.mode === 'unlimited');
}
function focusScreen() {
  screen.focus({ preventScroll: true });
}
function setPlaying(playing) {
  document.body.classList.toggle('in-run', playing);
  $('.ocean-panel').classList.toggle('playing', playing);
}
function saveActive() {
  if (run?.mode === 'daily' && !run.complete) {
    progress.activeDaily = { run, deadline, feedback };
    progress.activeDailies ??= {};
    progress.activeDailies[run.dateKey] = progress.activeDaily;
  }
  persist();
}
function showHome(options = selected) {
  stopClock();
  selected = options;
  followToday = selected.mode === 'daily' && selected.dateKey === dayKey();
  run = null;
  feedback = false;
  setPlaying(false);
  scene.setMood('idle');
  updateMetrics();
  const saved = progress.daily[selected.dateKey];
  const active =
    selected.mode === 'daily' &&
    (progress.activeDailies?.[selected.dateKey] ||
      progress.activeDaily?.run.dateKey === selected.dateKey);
  const daily = selected.mode === 'daily';
  screen.dataset.state = 'home';
  screen.innerHTML = `<h2 class="home-title">${daily ? 'Daily dive.' : 'Open water.'}</h2>
    <p class="home-note">${saved && daily ? `${number(saved.score * 10)}m reached.${selected.dateKey === dayKey() ? ' Next daily in <span id="reset-time"></span>.' : ''}` : active ? 'Your boat is waiting.' : 'Seven prompts. Rarer answers go deeper.'}</p>
    <button class="primary" type="button" id="begin">${daily ? (saved ? 'View your dive' : active ? 'Resume dive' : 'Dive in') : 'Dive in'} <span aria-hidden="true">↓</span></button>
    ${daily && saved ? '<button class="text-button" type="button" id="free-dive">Into open water ∞</button>' : ''}`;
  revealScreen();
  $('#begin').onclick = begin;
  if ($('#free-dive'))
    $('#free-dive').onclick = () => {
      selected = { mode: 'unlimited', dateKey: dayKey(), category: 'all' };
      begin();
    };
  if ($('#reset-time') && selected.dateKey !== dayKey())
    $('#reset-time').textContent = 'today’s expedition';
  if ($('#reset-time') && selected.dateKey === dayKey()) {
    updateReset();
    interval = setInterval(updateReset, 1000);
  }
}
function updateReset() {
  const reset = $('#reset-time');
  if (!reset) return;
  if (selected.dateKey !== dayKey()) {
    showHome({ mode: 'daily', dateKey: dayKey(), category: 'all' });
    return;
  }
  const seconds = Math.ceil((Date.parse(`${dayKey()}T00:00:00Z`) + 86400000 - Date.now()) / 1000);
  reset.textContent = `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
}
function begin() {
  stopClock();
  if (followToday && selected.mode === 'daily') selected.dateKey = dayKey();
  // Read again so a completed daily dive in another tab stays completed.
  if (storage && persistent) progress = loadProgress(storage);
  if (selected.mode === 'daily' && progress.daily[selected.dateKey])
    return showResult(progress.daily[selected.dateKey]);
  const savedActive =
    progress.activeDailies?.[selected.dateKey] ??
    (progress.activeDaily?.run.dateKey === selected.dateKey ? progress.activeDaily : null);
  if (selected.mode === 'daily' && savedActive) {
    const active = savedActive;
    selected = { mode: 'daily', dateKey: active.run.dateKey, category: 'all' };
    run = active.run;
    feedback = Boolean(active.feedback && run.round > 0);
    deadline = active.deadline;
  } else {
    run = createRun(selected);
    feedback = false;
    deadline = Date.now() + DAY_SECONDS * 1000;
  }
  setPlaying(true);
  saveActive();
  renderRound();
}
function dots() {
  return `<div class="round-dots" aria-label="${run.round} of seven answers recorded">${Array.from({ length: ROUND_COUNT }, (_, i) => `<i class="${i < run.round ? (run.answers[i].valid ? 'scored' : 'missed') : i === run.round ? 'current' : ''}"></i>`).join('')}</div>`;
}
function renderRound() {
  stopClock();
  updateMetrics();
  if (run.complete) return showResult(run);
  if (feedback) return renderFeedback();
  scene.setMood('thinking');
  const question = run.questions[run.round];
  screen.dataset.state = 'question';
  screen.innerHTML = `<div class="round-top"><span>${String(run.round + 1).padStart(2, '0')} / 07</span>${dots()}</div>
    <h2 class="question" id="prompt">${escape(question.prompt)}</h2>
    <form class="answer-form"><label class="sr-only" for="answer">Your answer</label><div class="input-row"><input id="answer" name="answer" type="text" maxlength="80" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Your answer…" aria-labelledby="prompt" aria-describedby="answer-message"><span class="timer" id="timer" aria-hidden="true">25<small>s</small></span><button type="submit" class="submit-answer" aria-label="Submit answer">↓</button></div><div class="time-track" aria-hidden="true"><i id="time-bar"></i></div><p class="answer-help" id="answer-message" role="status"></p><button class="skip" type="button" id="skip">Skip ↗</button></form><span class="sr-only" id="time-announcement" role="status"></span>`;
  revealScreen();
  $('.answer-form').onsubmit = (event) => {
    event.preventDefault();
    submitAnswer(false);
  };
  $('#skip').onclick = () => submitAnswer(false, true);
  if (matchMedia('(min-width: 701px)').matches) $('#answer').focus({ preventScroll: true });
  else focusScreen();
  tick();
  if (!feedback && !run.complete) interval = setInterval(tick, 100);
}
function tick() {
  if (!run || feedback || run.complete) return;
  const remaining = Math.max(0, deadline - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  const timer = $('#timer');
  if (timer) {
    timer.innerHTML = `${seconds}<small>s</small>`;
    timer.classList.toggle('urgent', seconds <= 5);
  }
  if ($('#time-bar')) $('#time-bar').style.width = `${(remaining / (DAY_SECONDS * 1000)) * 100}%`;
  if (
    seconds <= 5 &&
    $('#time-announcement') &&
    $('#time-announcement').dataset.seconds !== String(seconds)
  ) {
    $('#time-announcement').textContent = `${seconds} seconds remaining`;
    $('#time-announcement').dataset.seconds = String(seconds);
  }
  if (!remaining) submitAnswer(true);
}
function submitAnswer(timedOut, skipped = false) {
  if (!run || run.complete || feedback) return;
  // Timer expiry wins over a simultaneous Enter press.
  const expired = timedOut || Date.now() >= deadline;
  const input = $('#answer')?.value ?? '';
  if (
    !expired &&
    !skipped &&
    input.trim() &&
    !evaluateAnswer(run.questions[run.round], input).valid
  ) {
    $('#answer-message').textContent = 'Not listed. Try another before time runs out.';
    $('#answer-message').classList.add('unrecognized');
    $('#answer').setAttribute('aria-invalid', 'true');
    return;
  }
  stopClock();
  run = recordAnswer(run, skipped ? '' : ($('#answer')?.value ?? ''), {
    timedOut: expired,
  });
  feedback = true;
  deadline = 0;
  const earned = run.answers.at(-1);
  playTone(earned.valid, rarityFor(earned.score)?.notes);
  if (run.complete) {
    wasBest = run.score > progress.best;
    progress = finishRun(progress, run);
    persist();
  } else saveActive();
  renderFeedback();
}
function renderFeedback() {
  stopClock();
  updateMetrics();
  const answer = run.answers.at(-1);
  const question = run.questions[run.round - 1];
  const rare = [...question.answers].sort((a, b) => b.score - a.score).slice(0, 3);
  const tier = rarityFor(answer.score);
  if (tier) scene.celebrate(tier.rank, tier.color);
  else scene.setMood('miss');
  screen.dataset.rarity = tier?.id ?? 'miss';
  screen.style.setProperty('--rarity-color', tier?.color ?? '#a5bad5');
  screen.dataset.state = 'feedback';
  const label =
    tier?.label ?? (answer.kind === 'timeout' ? 'THE CLOCK CAUGHT US' : 'Nothing landed');
  const message =
    tier?.message ??
    (answer.kind === 'timeout'
      ? 'Time ran out. A fresh current is next.'
      : 'An empty line. There’s more ocean ahead.');
  screen.innerHTML = `<div class="round-top"><span>${String(run.round).padStart(2, '0')} / 07</span>${dots()}</div>
    <div class="rarity-reveal" role="status"><div class="rarity-heading"><span class="rarity-emblem">${rarityIcon(tier?.id ?? 'miss')}</span><div><p class="feedback-title">${label}</p>${tier ? `<span class="rarity-level">RARITY ${tier.rank + 1} / 6</span>` : ''}</div></div>
    <h2 class="result-answer">${answer.valid ? escape(answer.canonical) : 'A quiet moment.'}</h2>
    <p class="rarity-verdict">${message}</p><p class="result-score">+${answer.score}<small> PTS · ${number(answer.score * 10)}m</small></p></div>
    ${tier ? rarityLadder(tier) : ''}
    <button class="primary" id="next" type="button">${run.complete ? 'Surface' : 'Deeper'} <span aria-hidden="true">${run.complete ? '↑' : '↓'}</span></button>
    <details class="rare-answers"><summary>Other possibilities</summary><p class="examples">${rare.map((entry) => `${escape(entry.name)} <span>${entry.score}</span>`).join(' · ')}</p></details>`;
  revealScreen();
  $('#next').onclick = () => {
    if (run.complete) return showResult(run);
    feedback = false;
    deadline = Date.now() + DAY_SECONDS * 1000;
    saveActive();
    renderRound();
  };
  $('#next').focus({ preventScroll: true });
}
function showResult(finished) {
  stopClock();
  run = finished;
  selected = { mode: run.mode, dateKey: run.dateKey, category: run.category };
  feedback = false;
  setPlaying(false);
  const grade = diveRarityFor(run.score);
  scene.celebrate(grade.rank, grade.color);
  screen.dataset.rarity = grade.id;
  screen.style.setProperty('--rarity-color', grade.color);
  updateMetrics();
  const daily = run.mode === 'daily';
  screen.dataset.state = 'result';
  screen.innerHTML = `<div class="dive-grade">${rarityIcon(grade.id)}<span>${grade.label}</span></div><p class="eyebrow">DIVE COMPLETE${wasBest ? ' · NEW BEST' : ''}</p><h2 class="final-depth">${number(run.score * 10)}<small>m</small></h2>
    <p class="result-summary">${run.score} points · ${run.answers.filter((answer) => answer.valid).length} of 7 landed</p>
    <button class="primary" type="button" id="again">${daily ? 'Into open water' : 'Dive again'} <span aria-hidden="true">∞</span></button>
    <div class="result-links"><button class="text-button" type="button" id="share">Copy result ↗</button><button class="text-button" type="button" id="return">Surface ↑</button></div>
    <details><summary>Your answers</summary><ol class="answer-log">${run.answers.map((answer, i) => `<li><span>${i + 1}</span><span>${escape(answer.canonical ?? (answer.input || '—'))}<small>${escape(answer.prompt)}</small></span><span>${answer.score}</span></li>`).join('')}</ol></details><span class="sr-only" id="copy-status" role="status"></span>`;
  revealScreen();
  $('#again').onclick = () => {
    wasBest = false;
    selected = {
      mode: 'unlimited',
      dateKey: dayKey(),
      category: daily ? 'all' : run.category,
    };
    begin();
  };
  $('#return').onclick = () => {
    wasBest = false;
    showHome({ mode: 'daily', dateKey: dayKey(), category: 'all' });
  };
  $('#share').onclick = copyResult;
  focusScreen();
}
async function copyResult() {
  const marks = run.answers
    .map((answer) => {
      const tier = rarityFor(answer.score);
      return tier ? ['🫧', '🤹', '🐟', '🦑', '🏮', '🌟'][tier.rank] : '⬜';
    })
    .join('');
  const text = `Puff’s Daily Dive ${run.mode === 'daily' ? `#${dailyNumber(run.dateKey)} · ${run.dateKey}` : '· Open water'}\n${marks}\n${run.score}/700 · ${number(run.score * 10)}m deep\nhttps://rillion.randyren.org/`;
  try {
    await navigator.clipboard.writeText(text);
    $('#share').textContent = 'Copied ✓';
    $('#copy-status').textContent = 'Result copied to clipboard.';
  } catch {
    $('#copy-status').textContent = text;
    const result = document.createElement('textarea');
    result.value = text;
    result.setAttribute('aria-label', 'Your result — select and copy');
    result.rows = 5;
    result.style.cssText = 'width:100%;margin-top:12px;background:#222;color:#eee7d7;padding:10px';
    screen.append(result);
    result.select();
    $('#share').textContent = 'Select and copy below';
  }
}
function fillDialog(id) {
  if (id === 'help')
    $('#rarity-guide').innerHTML = RARITY_BANDS.map(
      (band) =>
        `<div class="rarity-guide-row" style="--rarity-color:${band.color}">${rarityIcon(band.id)}<span>${band.label}</span><small>${band.min}–${band.max} PTS</small></div>`,
    ).join('');
  if (id === 'stats') {
    $('#stats-content').innerHTML =
      `<div class="stats-grid"><div><strong>${progress.best}</strong><span>PERSONAL BEST</span></div><div><strong>${progress.played}</strong><span>DIVES FINISHED</span></div><div><strong>${progress.played ? Math.round(progress.total / progress.played) : 0}</strong><span>AVERAGE SCORE</span></div></div><p class="eyebrow">RECENT EXPEDITIONS</p>${
        progress.history.length
          ? progress.history
              .slice(0, 10)
              .map(
                (item) =>
                  `<div class="history-row"><span>${dateLabel(item.dateKey)} · ${item.mode === 'daily' ? 'DAILY' : 'OPEN WATER'}</span><strong>${item.score} PTS · ${number(item.score * 10)} M</strong></div>`,
              )
              .join('')
          : '<p class="small empty">A blank page. A whole ocean ahead of you.</p>'
      }`;
  }
  if (id === 'themes') {
    $('#theme-list').innerHTML = CATEGORIES.map(
      (category) =>
        `<button type="button" data-theme="${escape(category.id)}"><strong>${escape(category.label)}</strong><small>${QUESTIONS.filter((question) => question.category === category.id).length} PROMPTS · 7 PER DIVE ↗</small></button>`,
    ).join('');
    for (const button of $('#theme-list').querySelectorAll('button'))
      button.onclick = () => {
        $('#themes').close();
        wasBest = false;
        showHome({
          mode: 'unlimited',
          dateKey: dayKey(),
          category: button.dataset.theme,
        });
      };
  }
  if (id === 'archive') {
    $('#archive-list').innerHTML = Array.from({ length: 30 }, (_, i) => {
      const key = dayKey(new Date(Date.parse(`${dayKey()}T00:00:00Z`) - (i + 1) * 86400000));
      return `<button type="button" data-date="${key}"><span>${dateLabel(key)} · ${new Date(`${key}T12:00:00Z`).getUTCFullYear()}</span><span>${progress.daily[key] ? `${progress.daily[key].score} PTS · VIEW` : 'DIVE IN ↗'}</span></button>`;
    }).join('');
    for (const button of $('#archive-list').querySelectorAll('button'))
      button.onclick = () => {
        $('#archive').close();
        wasBest = false;
        showHome({
          mode: 'daily',
          dateKey: button.dataset.date,
          category: 'all',
        });
      };
  }
}
for (const button of document.querySelectorAll('[data-dialog]'))
  button.onclick = () => {
    fillDialog(button.dataset.dialog);
    $(`#${button.dataset.dialog}`).showModal();
  };
for (const button of document.querySelectorAll('[data-close]'))
  button.onclick = () => button.closest('dialog').close();
for (const dialog of document.querySelectorAll('dialog'))
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    }
  });
$('#sound').onclick = () => {
  progress.sound = !progress.sound;
  updateSound();
  persist();
  if (progress.sound) playTone(true);
};
$('#daily-mode').onclick = () => {
  wasBest = false;
  showHome({ mode: 'daily', dateKey: dayKey(), category: 'all' });
};
$('#unlimited-mode').onclick = () => {
  wasBest = false;
  showHome({ mode: 'unlimited', dateKey: dayKey(), category: 'all' });
};
addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});
addEventListener('pagehide', () => {
  audio?.suspend();
});
addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  progress = loadProgress(storage);
  updateSound();
  if (run?.mode === 'daily' && !run.complete) {
    if (progress.daily[run.dateKey]) return showResult(progress.daily[run.dateKey]);
    const active =
      progress.activeDailies?.[run.dateKey] ??
      (progress.activeDaily?.run.dateKey === run.dateKey ? progress.activeDaily : null);
    if (
      active &&
      (active.run.round !== run.round ||
        active.deadline !== deadline ||
        Boolean(active.feedback) !== feedback ||
        JSON.stringify(active.run.answers) !== JSON.stringify(run.answers))
    ) {
      run = active.run;
      feedback = Boolean(active.feedback);
      deadline = active.deadline;
      renderRound();
    } else updateMetrics();
  } else updateMetrics();
});
updateSound();
persist();
showHome();
