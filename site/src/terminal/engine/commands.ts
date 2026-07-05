import { BIO } from '@/content/bio';
import { ORDER, type Slug } from '@/content/projects';
import { getNode, listDir, resolvePath } from './filesystem';
import { parse } from './parser';

export type ExecContext = { cwd: string; visibleSlugs: Set<Slug> };

export type CommandResult =
  | { kind: 'text'; lines: string[] }
  | { kind: 'cd'; newCwd: string }
  | { kind: 'openInline'; slug: Slug }
  | { kind: 'openPlate'; slug: Slug }
  | { kind: 'clear' }
  | { kind: 'help'; lines: string[] }
  | { kind: 'error'; message: string };

const SLUGS: readonly Slug[] = ORDER;

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
  return [
    'available commands',
    '  ls              list current directory',
    '  cd <path>       change directory (accepts bare slugs)',
    '  pwd             print working directory',
    '  cat <slug>      read a label inline',
    '  open <slug>     first click: inline. second (while visible): plate.',
    '  about           inline about card',
    '  contact         inline contact card',
    '  clear           clear the screen',
    '  help            this list'
  ];
}

function renderAbout(): string[] {
  return BIO.about.split('\n').filter(Boolean);
}

function renderContact(): string[] {
  const socials = BIO.contact.social.map((s) => `  ${s.label.padEnd(10)} ${s.href}`);
  return [`email  ${BIO.contact.email}`, ...socials];
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
      return { kind: 'text', lines: ['randy'] };

    case 'ls': {
      const arg = args[0] ?? '.';
      const target = resolvePath(ctx.cwd, arg);
      if (!target) return { kind: 'error', message: `ls: ${arg}: no such directory` };
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
      return { kind: 'text', lines: renderAbout() };

    case 'contact':
      return { kind: 'text', lines: renderContact() };

    case 'cat':
    case 'open': {
      const arg = args[0];
      if (!arg) return { kind: 'error', message: `${cmd}: missing argument` };
      if (arg === 'about') return { kind: 'text', lines: renderAbout() };
      if (arg === 'contact') return { kind: 'text', lines: renderContact() };
      if (!isSlug(arg)) return { kind: 'error', message: `${cmd}: ${arg}: not a project` };
      if (cmd === 'open' && ctx.visibleSlugs.has(arg)) return { kind: 'openPlate', slug: arg };
      return { kind: 'openInline', slug: arg };
    }

    default:
      return { kind: 'error', message: `command not found: ${cmd}. type "help".` };
  }
}
