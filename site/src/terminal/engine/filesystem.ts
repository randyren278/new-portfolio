import { ORDER, type Slug } from '@/content/projects';

export type FsNode = {
  kind: 'dir' | 'file';
  children?: Record<string, FsNode>;
  slug?: Slug;
  label?: string;
};

function buildProjectDir(slug: Slug): FsNode {
  return {
    kind: 'dir',
    children: {
      label: { kind: 'file', slug, label: `${slug}.label` }
    }
  };
}

const workChildren: Record<string, FsNode> = {};
for (const slug of ORDER) workChildren[slug] = buildProjectDir(slug);

export const FS: FsNode = {
  kind: 'dir',
  children: {
    randy: {
      kind: 'dir',
      children: {
        work: { kind: 'dir', children: workChildren },
        about: { kind: 'file', label: 'about.txt' },
        contact: { kind: 'file', label: 'contact.txt' }
      }
    }
  }
};

const ROOT = '/randy';

function splitAbs(path: string): string[] {
  return path.split('/').filter(Boolean);
}

export function resolvePath(cwd: string, target: string): string | null {
  if (!target || target === '~') return ROOT;
  let base: string[];
  if (target.startsWith('~/')) {
    base = splitAbs(ROOT);
    target = target.slice(2);
  } else if (target.startsWith('/')) {
    base = [];
  } else {
    base = splitAbs(cwd);
  }
  const parts = target.split('/').filter(Boolean);
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (base.length === 0) return null;
      base.pop();
      continue;
    }
    base.push(part);
  }
  const abs = '/' + base.join('/');
  return abs === '/' ? null : abs;
}

export function getNode(path: string): FsNode | null {
  if (path === '/') return FS;
  const parts = splitAbs(path);
  let node: FsNode | undefined = FS;
  for (const p of parts) {
    if (!node || node.kind !== 'dir' || !node.children) return null;
    node = node.children[p];
  }
  return node ?? null;
}

export function listDir(path: string): string[] | null {
  const node = getNode(path);
  if (!node || node.kind !== 'dir' || !node.children) return null;
  // preserve insertion order — /randy/work uses ORDER
  return Object.keys(node.children);
}
