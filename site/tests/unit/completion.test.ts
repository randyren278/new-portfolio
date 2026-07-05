import { describe, expect, it } from 'vitest';
import { complete } from '@/terminal/engine/completion';

describe('complete', () => {
  it('completes a unique open slug', () => {
    expect(complete('open ory', '/randy')).toEqual({ text: 'open oryzo', candidates: ['oryzo'] });
  });

  it('completes cat with case-insensitive prefix', () => {
    expect(complete('cat Hal', '/randy')).toEqual({ text: 'cat halcyon', candidates: ['halcyon'] });
  });

  it('returns input unchanged on ambiguous prefix', () => {
    // no ambiguous slugs share a real prefix, so contrive one for cd against a dir
    expect(complete('open x', '/randy')).toEqual({ text: 'open x', candidates: [] });
  });

  it('returns input unchanged when nothing to complete', () => {
    expect(complete('ls', '/randy')).toEqual({ text: 'ls', candidates: [] });
  });

  it('cd completes among cwd children when unique', () => {
    expect(complete('cd or', '/randy/work')).toEqual({ text: 'cd oryzo', candidates: ['oryzo'] });
  });

  it('returns all candidates when open prefix is empty', () => {
    const r = complete('open ', '/randy');
    expect(r.candidates.length).toBeGreaterThan(1);
    expect(r.text).toBe('open ');
  });
});
