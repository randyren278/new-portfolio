import { describe, expect, it } from 'vitest';
import { parse } from '@/terminal/engine/parser';

describe('parse', () => {
  it('returns null for empty input', () => {
    expect(parse('')).toBeNull();
    expect(parse('   ')).toBeNull();
  });

  it('splits cmd and args on whitespace', () => {
    expect(parse('ls -la ~/work')).toEqual({
      cmd: 'ls',
      args: ['-la', '~/work'],
      raw: 'ls -la ~/work'
    });
  });

  it('trims outer whitespace but preserves inner spacing', () => {
    expect(parse('  open   oryzo  ')?.args).toEqual(['oryzo']);
  });

  it('lowercases the command but not args', () => {
    expect(parse('CAT Oryzo')?.cmd).toBe('cat');
    expect(parse('CAT Oryzo')?.args).toEqual(['Oryzo']);
  });
});
