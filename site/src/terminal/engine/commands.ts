import { BIO } from '@/content/bio';
import { ORDER, type Slug } from '@/content/projects';
import { getNode, listDir, resolvePath } from './filesystem';
import { parse } from './parser';

export type ExecContext = { cwd: string; visibleSlugs: Set<Slug>; history: readonly string[] };

export type CommandResult =
  | { kind: 'text'; lines: string[] }
  | { kind: 'cd'; newCwd: string }
  | { kind: 'openInline'; slug: Slug }
  | { kind: 'openPlate'; slug: Slug }
  | { kind: 'openAbout' }
  | { kind: 'clear' }
  | { kind: 'help'; lines: string[] }
  | { kind: 'error'; message: string };

const SLUGS: readonly Slug[] = ORDER;

const HOURS_LINES = [
  'monday      quiet hours (writing)',
  'tuesday     10:00–19:00',
  'wednesday   10:00–19:00',
  'thursday    10:00–19:00',
  'friday      10:00–15:00',
  'saturday    by appointment',
  'sunday      closed'
];

const HOURS_NOTE = '# the museum keeps a quiet room. reach out anytime — replies within a day.';

const HELP_MARGINALIA = '# type any command, or click a chip below.';

const HELP_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['pwd', 'print working directory'],
  ['ls', 'list entries in current dir'],
  ['cd', 'change directory (accepts ~, .., paths)'],
  ['cat', 'print a file'],
  ['open', 'open a project — label + plate'],
  ['hours', 'museum hours'],
  ['contact', 'ways to reach randy'],
  ['whoami', 'you are the visitor'],
  ['help', 'this message'],
  ['man', 'manual page for a command'],
  ['history', 'recent commands'],
  ['clear', 'clear the screen (Ctrl-L)']
];

type ManEntry = { name: string; desc: string; synopsis: string; see: string };

const MAN: Record<string, ManEntry> = {
  pwd:     { name: 'pwd(1)',     desc: 'print the name of the current working directory.',            synopsis: 'pwd',           see: 'cd, ls' },
  ls:      { name: 'ls(1)',      desc: 'list directory contents in exhibition order.',                synopsis: 'ls [path]',     see: 'cd, cat' },
  cd:      { name: 'cd(1)',      desc: 'change directory. accepts absolute, relative, .. and ~.',     synopsis: 'cd [path]',     see: 'pwd, ls' },
  cat:     { name: 'cat(1)',     desc: 'concatenate and print files. wall labels animate on first view.', synopsis: 'cat file',   see: 'open, ls' },
  open:    { name: 'open(1)',    desc: 'a museum verb. opens the plate viewer for a project.',        synopsis: 'open project',  see: 'cat, ls' },
  hours:   { name: 'hours(1)',   desc: 'print the museum hours.',                                     synopsis: 'hours',         see: 'contact' },
  contact: { name: 'contact(1)', desc: 'print ways to reach the artist.',                             synopsis: 'contact',       see: 'hours' },
  whoami:  { name: 'whoami(1)',  desc: 'print the user visiting this shell.',                         synopsis: 'whoami',        see: 'help' },
  help:    { name: 'help(1)',    desc: 'list available commands.',                                    synopsis: 'help',          see: 'man' },
  man:     { name: 'man(1)',     desc: 'display the manual page for a command.',                     synopsis: 'man command',   see: 'help' },
  history: { name: 'history(1)', desc: 'print numbered command history for this session.',            synopsis: 'history',       see: '!! and !n' },
  clear:   { name: 'clear(1)',   desc: 'clear the terminal buffer. Ctrl-L is a shortcut.',            synopsis: 'clear',         see: 'help' }
};

function manLines(entry: ManEntry): string[] {
  return [
    'NAME',
    `     ${entry.name} — ${entry.desc}`,
    '',
    'SYNOPSIS',
    `     ${entry.synopsis}`,
    '',
    'SEE ALSO',
    `     ${entry.see}`
  ];
}

function toDisplay(path: string): string {
  if (path === '/randy') return '~';
  if (path.startsWith('/randy/')) return '~' + path.slice('/randy'.length);
  return path;
}

function isSlug(s: string): s is Slug {
  return (SLUGS as readonly string[]).includes(s);
}

function smartResolveCd(cwd: string, arg: string): string | null {
  const direct = resolvePath(cwd, arg);
  if (direct && getNode(direct)?.kind === 'dir') return direct;
  if (isSlug(arg)) {
    const viaWork = resolvePath('/randy/work', arg);
    if (viaWork && getNode(viaWork)?.kind === 'dir') return viaWork;
  }
  const viaRoot = resolvePath('/randy', arg);
  if (viaRoot && getNode(viaRoot)?.kind === 'dir') return viaRoot;
  return null;
}

function helpLines(): string[] {
  const width = HELP_ROWS.reduce((max, [name]) => Math.max(max, name.length), 0) + 2;
  return [
    HELP_MARGINALIA,
    ...HELP_ROWS.map(([name, desc]) => `${name.padEnd(width)}${desc}`)
  ];
}

function renderContact(): string[] {
  const socials = BIO.contact.social.map((s) => `  ${s.label.padEnd(10)} ${s.handle}`);
  return [`email     ${BIO.contact.email}`, ...socials, `location  ${BIO.contact.location}`];
}

const KNOWN_COMMANDS: readonly string[] = [
  'cat', 'cd', 'clear', 'contact', 'help', 'history', 'hours', 'ls', 'man', 'open', 'pwd', 'whoami'
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[] = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const t = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j - 1]!, dp[j]!);
      prev = t;
    }
  }
  return dp[n]!;
}

function closestCommand(input: string): string | null {
  let best: string | null = null;
  let bestD = 3;
  for (const c of KNOWN_COMMANDS) {
    const d = levenshtein(input, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

export function execute(input: string, ctx: ExecContext): CommandResult {
  const parsed = parse(input);
  if (!parsed) return { kind: 'text', lines: [] };
  const { cmd, args } = parsed;

  switch (cmd) {
    case 'help':
    case '?':
      return { kind: 'help', lines: helpLines() };

    case 'clear':
    case 'cls':
      return { kind: 'clear' };

    case 'pwd':
      return { kind: 'text', lines: [toDisplay(ctx.cwd)] };

    case 'whoami':
      return { kind: 'text', lines: ['visitor'] };

    case 'hours':
      return { kind: 'text', lines: [...HOURS_LINES, HOURS_NOTE] };

    case 'ls': {
      const arg = args[0] ?? '.';
      const target = resolvePath(ctx.cwd, arg);
      if (!target) return { kind: 'error', message: `ls: no such file or directory: ${arg}` };
      const entries = listDir(target);
      if (!entries) return { kind: 'error', message: `ls: ${arg}: not a directory` };
      return { kind: 'text', lines: [entries.join('  ')] };
    }

    case 'cd': {
      const arg = args[0] ?? '~';
      const dest = smartResolveCd(ctx.cwd, arg);
      if (!dest) return { kind: 'error', message: `cd: ${arg}: no such directory` };
      return { kind: 'cd', newCwd: dest };
    }

    case 'about':
      return { kind: 'openAbout' };

    case 'man': {
      const c = args[0];
      if (!c) return { kind: 'error', message: 'man: what manual page do you want?' };
      const entry = MAN[c];
      if (!entry) return { kind: 'error', message: `man: no manual entry for ${c}` };
      return { kind: 'text', lines: manLines(entry) };
    }

    case 'history': {
      const lines = ctx.history.map((h, i) => `${String(i + 1).padStart(4, ' ')}  ${h}`);
      return { kind: 'text', lines };
    }

    case 'contact':
      return { kind: 'text', lines: renderContact() };

    case 'cat': {
      const arg = args[0];
      if (!arg) return { kind: 'error', message: 'cat: missing file' };
      if (arg === 'about') return { kind: 'openAbout' };
      if (arg === 'contact') return { kind: 'text', lines: renderContact() };
      if (isSlug(arg)) return { kind: 'openInline', slug: arg };
      const target = resolvePath(ctx.cwd, arg);
      const node = target ? getNode(target) : null;
      if (node?.kind === 'file' && typeof node.content === 'string') {
        return { kind: 'text', lines: node.content.split('\n') };
      }
      if (node?.kind === 'dir') return { kind: 'error', message: `cat: ${arg}: is a directory` };
      return { kind: 'error', message: `cat: no such file: ${arg}` };
    }

    case 'open': {
      const arg = args[0];
      if (!arg) return { kind: 'error', message: 'open: which project?' };
      if (arg === 'about') return { kind: 'openAbout' };
      if (arg === 'contact') return { kind: 'text', lines: renderContact() };
      if (!isSlug(arg)) return { kind: 'error', message: `open: unknown project: ${arg}` };
      if (ctx.visibleSlugs.has(arg)) return { kind: 'openPlate', slug: arg };
      return { kind: 'openInline', slug: arg };
    }

    default: {
      const suggestion = closestCommand(cmd);
      const base = `command not found: ${cmd}`;
      const message = suggestion ? `${base} — did you mean ${suggestion}?` : `${base}. type "help".`;
      return { kind: 'error', message };
    }
  }
}
