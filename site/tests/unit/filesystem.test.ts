import { describe, expect, it } from 'vitest';
import { FS, getNode, listDir, resolvePath } from '@/terminal/engine/filesystem';

describe('resolvePath', () => {
  it('expands ~ to /randy', () => {
    expect(resolvePath('/randy', '~')).toBe('/randy');
    expect(resolvePath('/randy', '~/work')).toBe('/randy/work');
  });

  it('handles absolute paths', () => {
    expect(resolvePath('/randy/work', '/randy/about')).toBe('/randy/about');
  });

  it('handles relative paths with ..', () => {
    expect(resolvePath('/randy/work/oryzo', '..')).toBe('/randy/work');
    expect(resolvePath('/randy/work/oryzo', '../halcyon')).toBe('/randy/work/halcyon');
  });

  it('returns null when walking above root', () => {
    expect(resolvePath('/randy', '../..')).toBeNull();
  });

  it('resolves bare slug from ~/work parent when unambiguous', () => {
    // handled in commands layer, not here; keep filesystem pure
    expect(resolvePath('/randy/work', 'oryzo')).toBe('/randy/work/oryzo');
  });
});

describe('listDir', () => {
  it('lists the six project slugs under ~/work in fixed order', () => {
    expect(listDir('/randy/work')).toEqual(['oryzo', 'halcyon', 'paperlane', 'atlas', 'koinu', 'linen']);
  });

  it('lists work, about, contact under ~', () => {
    expect(listDir('/randy')).toEqual(['work', 'about', 'contact']);
  });

  it('returns null for a file', () => {
    expect(listDir('/randy/about')).toBeNull();
  });
});

describe('getNode', () => {
  it('finds the oryzo label file', () => {
    const node = getNode('/randy/work/oryzo/label');
    expect(node?.kind).toBe('file');
    expect(node?.slug).toBe('oryzo');
  });
});

describe('FS', () => {
  it('root is a directory', () => {
    expect(FS.kind).toBe('dir');
  });
});
