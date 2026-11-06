import {
  QUESTIONS,
  BASE_QUESTIONS,
  LEGACY_QUESTIONS,
  CATEGORIES,
  ANSWER_BANK_VERSION,
} from './questions.mjs';

export const DAY_SECONDS = 25;
export const ROUND_COUNT = 7;
export const MAX_SCORE = 700;
export const STORAGE_KEY = 'randy-dive-v1';

const DAY_MS = 86400000;
const EPOCH = Date.UTC(2026, 0, 1);
const questionById = new Map(QUESTIONS.map((question) => [question.id, question]));
const baseQuestionById = new Map(BASE_QUESTIONS.map((question) => [question.id, question]));
const categoryIds = new Set(CATEGORIES.map((category) => category.id));
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const safeText = (value, max = 80) => (typeof value === 'string' ? value.slice(0, max) : '');

export function dayKey(date = new Date()) {
  const parsed = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(parsed.getTime())) throw new RangeError('Invalid puzzle date');
  return parsed.toISOString().slice(0, 10);
}

function validDay(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const time = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isFinite(time) && dayKey(new Date(time)) === key;
}

export function dailyNumber(key = dayKey()) {
  if (!validDay(key)) throw new RangeError('Invalid puzzle date');
  return Math.floor((Date.parse(`${key}T00:00:00.000Z`) - EPOCH) / DAY_MS) + 1;
}

function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

function randomSource(seed) {
  let state = hash(seed);
  return () => {
    state += 0x6d2b79f5;
    let next = Math.imul(state ^ (state >>> 15), state | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

let freshCounter = 0;
function freshSeed() {
  const bytes = new Uint32Array(3);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 4294967296);
  return `${Date.now().toString(36)}-${[...bytes].map((value) => value.toString(36)).join('-')}-${++freshCounter}`;
}

export function createRun({ mode = 'daily', dateKey = dayKey(), category = 'all', seed } = {}) {
  if (!['daily', 'unlimited'].includes(mode)) throw new RangeError('Unknown dive mode');
  if (!validDay(dateKey)) throw new RangeError('Invalid puzzle date');
  const selectedCategory = mode === 'daily' ? 'all' : category;
  if (selectedCategory !== 'all' && !categoryIds.has(selectedCategory))
    throw new RangeError('Unknown category');
  // Expanding a dated puzzle's pool would invalidate its saved questions.
  const bank =
    mode === 'daily' && dateKey < '2026-11-07'
      ? LEGACY_QUESTIONS.map((question) => questionById.get(question.id))
      : QUESTIONS;
  const pool = bank.filter(
    (question) => selectedCategory === 'all' || question.category === selectedCategory,
  );
  if (pool.length < ROUND_COUNT)
    throw new RangeError('This category needs at least seven questions');
  const runSeed = mode === 'daily' ? `daily:${dateKey}` : String(seed ?? freshSeed());
  const random = randomSource(runSeed);
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    id: mode === 'daily' ? runSeed : `unlimited:${selectedCategory}:${runSeed}`,
    mode,
    dateKey,
    category: selectedCategory,
    questions: shuffled.slice(0, ROUND_COUNT),
    round: 0,
    answers: [],
    score: 0,
    complete: false,
  };
}

export function normalizeAnswer(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(?:a|an|the) /, '')
    .replace(/\s+/g, ' ');
}

function singular(text) {
  if (text.length < 5 || /(?:ss|us|is)$/.test(text)) return text;
  if (text.endsWith('ies') && text.length > 5) return `${text.slice(0, -3)}y`;
  if (/(?:ches|shes|xes|zes)$/.test(text)) return text.slice(0, -2);
  if (text.endsWith('s')) return text.slice(0, -1);
  return text;
}

const IRREGULAR_PLURALS = {
  mouse: 'mice',
  goose: 'geese',
  tooth: 'teeth',
  foot: 'feet',
  child: 'children',
  person: 'people',
  man: 'men',
  woman: 'women',
  ox: 'oxen',
  die: 'dice',
  knife: 'knives',
  leaf: 'leaves',
  wolf: 'wolves',
  calf: 'calves',
  loaf: 'loaves',
  shelf: 'shelves',
  scarf: 'scarves',
  hoof: 'hooves',
  half: 'halves',
  life: 'lives',
  wife: 'wives',
  self: 'selves',
  axis: 'axes',
  analysis: 'analyses',
  crisis: 'crises',
  thesis: 'theses',
  diagnosis: 'diagnoses',
  index: 'indices',
  matrix: 'matrices',
  vertex: 'vertices',
  phenomenon: 'phenomena',
  criterion: 'criteria',
  bookshelf: 'bookshelves',
  dormouse: 'dormice',
  fireman: 'firemen',
  policeman: 'policemen',
  policewoman: 'policewomen',
  chairman: 'chairmen',
  craftsman: 'craftsmen',
  potato: 'potatoes',
  tomato: 'tomatoes',
  hero: 'heroes',
  echo: 'echoes',
  domino: 'dominoes',
  torpedo: 'torpedoes',
  volcano: 'volcanoes',
  buffalo: 'buffaloes',
  mosquito: 'mosquitoes',
  quiz: 'quizzes',
  bacterium: 'bacteria',
  medium: 'media',
  cactus: 'cacti',
  fungus: 'fungi',
  octopus: 'octopi',
};

function pluralForms(text) {
  const split = text.lastIndexOf(' ') + 1;
  const prefix = text.slice(0, split);
  const word = text.slice(split);
  const irregular = IRREGULAR_PLURALS[word];
  const regular = /[^aeiou]y$/.test(word)
    ? `${word.slice(0, -1)}ies`
    : /(?:s|x|z|ch|sh)$/.test(word)
      ? `${word}es`
      : `${word}s`;
  return [regular, ...(irregular ? [irregular] : [])].map((form) => prefix + form);
}

function oneTypo(left, right) {
  if (Math.abs(left.length - right.length) > 1 || Math.min(left.length, right.length) < 5)
    return false;
  if (left.length === right.length) {
    const different = [];
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) different.push(i);
    return (
      different.length === 1 ||
      (different.length === 2 &&
        different[1] === different[0] + 1 &&
        left[different[0]] === right[different[1]] &&
        left[different[1]] === right[different[0]])
    );
  }
  const longer = left.length > right.length ? left : right;
  const shorter = left.length > right.length ? right : left;
  let offset = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i + offset] !== shorter[i]) {
      if (offset) return false;
      offset = 1;
      if (longer[i + offset] !== shorter[i]) return false;
    }
  }
  return true;
}

export function answerKey(question, value) {
  // The original normalizer remains available for recorded version-one answers.
  let text = value;
  if (question?.matchingVersion === 2)
    text = text.replace(
      /[æœøłđðþß]/giu,
      (letter) =>
        ({ æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ß: 'ss' })[
          letter.toLowerCase()
        ],
    );
  if (question?.preciseMatching) text = text.replaceAll('♀', ' female').replaceAll('♂', ' male');
  return normalizeAnswer(text);
}

export function evaluateAnswer(question, input) {
  const answer = safeText(input).trim();
  const normalize = (value) => answerKey(question, value);
  const normalized = normalize(answer);
  const empty = {
    valid: false,
    answer,
    canonical: null,
    score: 0,
    kind: normalized ? 'invalid' : 'blank',
  };
  if (
    !normalized ||
    typeof input !== 'string' ||
    input.length > 80 ||
    !Array.isArray(question?.answers)
  )
    return empty;
  const candidates = question.answers.map((entry) => ({
    entry,
    names: [entry.name, ...(entry.aliases ?? [])].map(normalize),
  }));
  const exact = candidates.find(({ names }) => names.includes(normalized));
  if (!exact && question.rejectedInputs?.some((entry) => normalize(entry) === normalized))
    return empty;
  const inputPlurals = !exact && question.matchingVersion === 2 ? pluralForms(normalized) : [];
  const plural = exact
    ? []
    : candidates.filter(({ names }) =>
        names.some((name) =>
          question.matchingVersion === 2
            ? inputPlurals.includes(name) || pluralForms(name).includes(normalized)
            : singular(name) === singular(normalized),
        ),
      );
  const typo =
    exact || plural.length === 1
      ? []
      : candidates.filter(({ names }) =>
          names.some(
            (name) =>
              (!question.preciseMatching ||
                (name.match(/\d+/g) ?? []).join(':') ===
                  (normalized.match(/\d+/g) ?? []).join(':')) &&
              oneTypo(name, normalized),
          ),
        );
  const match = exact ?? (plural.length === 1 ? plural[0] : typo.length === 1 ? typo[0] : null);
  if (!match) return empty;
  return {
    valid: true,
    answer,
    canonical: match.entry.name,
    score: match.entry.score,
    kind: 'accepted',
  };
}

export function recordAnswer(
  run,
  input,
  { timedOut = false, bankVersion = ANSWER_BANK_VERSION } = {},
) {
  if (run.complete) return run;
  if (!integer(bankVersion, 1, ANSWER_BANK_VERSION))
    throw new RangeError('Unknown answer bank version');
  const current = run.questions[run.round];
  const question = bankVersion === 1 ? baseQuestionById.get(current?.id) : current;
  const entered = safeText(input).trim();
  if (!question) throw new RangeError('No current question');
  const result = timedOut
    ? {
        valid: false,
        answer: entered,
        canonical: null,
        score: 0,
        kind: 'timeout',
      }
    : evaluateAnswer(question, entered);
  const answers = [
    ...run.answers,
    {
      ...result,
      input: entered,
      ...(bankVersion > 1 ? { bankVersion } : {}),
      questionId: question.id,
      prompt: question.prompt,
    },
  ];
  return {
    ...run,
    answers,
    round: answers.length,
    score: answers.reduce((sum, answer) => sum + answer.score, 0),
    complete: answers.length === ROUND_COUNT,
  };
}

function emptyProgress() {
  return {
    version: 1,
    best: 0,
    played: 0,
    total: 0,
    history: [],
    daily: {},
    activeDaily: null,
    activeDailies: {},
    sound: true,
    completedIds: [],
  };
}

function validateRun(value, requireComplete = false) {
  if (
    !plain(value) ||
    !['daily', 'unlimited'].includes(value.mode) ||
    !validDay(value.dateKey) ||
    typeof value.id !== 'string' ||
    value.id.length > 200 ||
    !Array.isArray(value.questions) ||
    value.questions.length !== ROUND_COUNT ||
    !Array.isArray(value.answers) ||
    value.answers.length > ROUND_COUNT
  )
    return null;
  const category = value.mode === 'daily' ? 'all' : value.category;
  if (category !== 'all' && !categoryIds.has(category)) return null;
  const ids = value.questions.map((question) => (plain(question) ? question.id : null));
  if (new Set(ids).size !== ROUND_COUNT || ids.some((id) => !questionById.has(id))) return null;
  const questions = ids.map((id) => questionById.get(id));
  if (category !== 'all' && questions.some((question) => question.category !== category))
    return null;
  if (value.mode === 'daily') {
    const expected = createRun({ dateKey: value.dateKey });
    if (value.id !== expected.id || ids.some((id, i) => id !== expected.questions[i].id))
      return null;
  } else if (!value.id.startsWith(`unlimited:${category}:`)) return null;
  let run = {
    id: value.id,
    mode: value.mode,
    dateKey: value.dateKey,
    category,
    questions,
    round: 0,
    answers: [],
    score: 0,
    complete: false,
  };
  for (let i = 0; i < value.answers.length; i++) {
    const answer = value.answers[i];
    if (
      !plain(answer) ||
      answer.questionId !== questions[i].id ||
      typeof answer.input !== 'string' ||
      answer.input.length > 80
    )
      return null;
    const bankVersion = answer.bankVersion ?? 1;
    if (!integer(bankVersion, 1, ANSWER_BANK_VERSION)) return null;
    run = recordAnswer(run, answer.input, {
      timedOut: answer.kind === 'timeout',
      bankVersion,
    });
    const checked = run.answers[i];
    if (
      answer.score !== checked.score ||
      answer.kind !== checked.kind ||
      answer.valid !== checked.valid
    )
      return null;
  }
  if (
    value.round !== run.round ||
    value.score !== run.score ||
    value.complete !== run.complete ||
    (requireComplete && !run.complete)
  )
    return null;
  return run;
}

function validateFinished(value) {
  const run = validateRun(value, true);
  if (!run || !Number.isFinite(value.completedAt) || value.completedAt < 0) return null;
  return { ...run, completedAt: value.completedAt };
}

function sanitizeProgress(value) {
  const clean = emptyProgress();
  if (!plain(value) || value.version !== 1) return clean;
  clean.sound = typeof value.sound === 'boolean' ? value.sound : true;
  clean.history = Array.isArray(value.history)
    ? value.history.map(validateFinished).filter(Boolean).slice(0, 30)
    : [];
  if (plain(value.daily)) {
    for (const [key, record] of Object.entries(value.daily)) {
      const finished = validDay(key) ? validateFinished(record) : null;
      if (finished?.mode === 'daily' && finished.dateKey === key) clean.daily[key] = finished;
    }
  }
  clean.completedIds = Array.isArray(value.completedIds)
    ? [
        ...new Set(
          value.completedIds.filter(
            (id) => typeof id === 'string' && id.length > 0 && id.length <= 200,
          ),
        ),
      ].slice(-10000)
    : [];
  for (const record of [...clean.history, ...Object.values(clean.daily)]) {
    if (!clean.completedIds.includes(record.id)) clean.completedIds.push(record.id);
  }
  clean.best = integer(value.best, 0, MAX_SCORE) ? value.best : 0;
  clean.played = integer(value.played, 0, Number.MAX_SAFE_INTEGER) ? value.played : 0;
  clean.total = integer(value.total, 0, Number.MAX_SAFE_INTEGER) ? value.total : 0;
  const records = [
    ...new Map(
      [...clean.history, ...Object.values(clean.daily)].map((record) => [record.id, record]),
    ).values(),
  ];
  clean.best = Math.max(clean.best, 0, ...records.map((record) => record.score));
  clean.played = Math.max(clean.played, clean.completedIds.length);
  clean.total = Math.max(
    clean.total,
    records.reduce((sum, record) => sum + record.score, 0),
  );
  const validateActive = (active, key) => {
    if (!plain(active) || !Number.isFinite(active.deadline) || active.deadline < 0) return null;
    const run = validateRun(active.run);
    if (
      run?.mode !== 'daily' ||
      run.complete ||
      clean.daily[run.dateKey] ||
      (key && key !== run.dateKey)
    )
      return null;
    const checked = {
      run,
      deadline: Math.min(active.deadline, Date.now() + DAY_SECONDS * 1000),
    };
    if (typeof active.feedback === 'boolean') checked.feedback = active.feedback;
    return checked;
  };
  if (plain(value.activeDailies)) {
    for (const [key, active] of Object.entries(value.activeDailies)) {
      const checked = validDay(key) ? validateActive(active, key) : null;
      if (checked) clean.activeDailies[key] = checked;
    }
  }
  const legacyActive = validateActive(value.activeDaily);
  if (legacyActive) {
    const key = legacyActive.run.dateKey;
    clean.activeDailies[key] ??= legacyActive;
    clean.activeDaily = clean.activeDailies[key];
  } else clean.activeDaily = Object.values(clean.activeDailies).at(-1) ?? null;
  return clean;
}

export function loadProgress(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? sanitizeProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage, progress) {
  try {
    if (typeof storage?.setItem !== 'function') return false;
    const clean = sanitizeProgress(progress);
    const compact = (run) => ({
      ...run,
      questions: run.questions.map(({ id }) => ({ id })),
    });
    clean.history = clean.history.map(compact);
    clean.daily = Object.fromEntries(
      Object.entries(clean.daily).map(([key, run]) => [key, compact(run)]),
    );
    const compactActive = (active) => ({ ...active, run: compact(active.run) });
    clean.activeDailies = Object.fromEntries(
      Object.entries(clean.activeDailies).map(([key, active]) => [key, compactActive(active)]),
    );
    if (clean.activeDaily) clean.activeDaily = compactActive(clean.activeDaily);
    storage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

export function finishRun(progress, run) {
  const valid = validateRun(run, true);
  if (!valid) return progress;
  if (
    progress.completedIds?.includes(valid.id) ||
    progress.history?.some((record) => record.id === valid.id) ||
    (valid.mode === 'daily' && progress.daily?.[valid.dateKey])
  )
    return progress;
  const result = { ...valid, completedAt: Date.now() };
  const activeDailies = { ...(progress.activeDailies ?? {}) };
  if (valid.mode === 'daily') delete activeDailies[valid.dateKey];
  const legacyActive = progress.activeDaily;
  const activeDaily =
    valid.mode === 'daily' && legacyActive?.run.dateKey === valid.dateKey
      ? (Object.values(activeDailies).at(-1) ?? null)
      : (legacyActive ?? null);
  return {
    ...progress,
    version: 1,
    best: Math.max(progress.best ?? 0, valid.score),
    played: (progress.played ?? 0) + 1,
    total: (progress.total ?? 0) + valid.score,
    history: [result, ...(progress.history ?? [])].slice(0, 30),
    daily:
      valid.mode === 'daily'
        ? { ...(progress.daily ?? {}), [valid.dateKey]: result }
        : { ...(progress.daily ?? {}) },
    activeDaily,
    activeDailies,
    completedIds: [...(progress.completedIds ?? []), valid.id].slice(-10000),
  };
}
