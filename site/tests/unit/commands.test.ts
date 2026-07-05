import { describe, expect, it } from 'vitest';
import { execute } from '@/terminal/engine/commands';

const ctx = (cwd: string, visibleSlug: null | 'oryzo' | 'halcyon' | 'paperlane' | 'atlas' | 'koinu' | 'linen' = null) =>
  ({ cwd, visibleSlug });

describe('execute', () => {
  it('pwd echoes the current directory as ~ form', () => {
    const r = execute('pwd', ctx('/randy'));
    expect(r).toEqual({ kind: 'text', lines: ['~'] });
  });

  it('ls at ~ lists work about contact', () => {
    const r = execute('ls', ctx('/randy'));
    expect(r).toEqual({ kind: 'text', lines: ['work  about  contact'] });
  });

  it('ls at ~/work lists ORDER', () => {
    const r = execute('ls', ctx('/randy/work'));
    expect(r).toEqual({
      kind: 'text',
      lines: ['oryzo  halcyon  paperlane  atlas  koinu  linen']
    });
  });

  it('cd bare slug from ~/work resolves to child', () => {
    const r = execute('cd oryzo', ctx('/randy/work'));
    expect(r).toEqual({ kind: 'cd', newCwd: '/randy/work/oryzo' });
  });

  it('cd bare slug from ~ falls back to ~/work/<slug>', () => {
    const r = execute('cd halcyon', ctx('/randy'));
    expect(r).toEqual({ kind: 'cd', newCwd: '/randy/work/halcyon' });
  });

  it('cd ~ returns to home', () => {
    const r = execute('cd ~', ctx('/randy/work/oryzo'));
    expect(r).toEqual({ kind: 'cd', newCwd: '/randy' });
  });

  it('open <slug> returns inline when slug not visible', () => {
    const r = execute('open oryzo', ctx('/randy/work', null));
    expect(r).toEqual({ kind: 'openInline', slug: 'oryzo' });
  });

  it('open <slug> promotes to plate when slug is visible', () => {
    const r = execute('open oryzo', ctx('/randy/work', 'oryzo'));
    expect(r).toEqual({ kind: 'openPlate', slug: 'oryzo' });
  });

  it('open about is always inline', () => {
    const r = execute('open about', ctx('/randy'));
    expect(r).toEqual({ kind: 'text', lines: expect.any(Array) });
  });

  it('unknown command returns error', () => {
    const r = execute('sudo rm -rf /', ctx('/randy'));
    expect(r.kind).toBe('error');
  });

  it('clear returns kind clear', () => {
    expect(execute('clear', ctx('/randy'))).toEqual({ kind: 'clear' });
  });

  it('help returns kind help with a lines array', () => {
    const r = execute('help', ctx('/randy'));
    expect(r.kind).toBe('help');
  });
});
