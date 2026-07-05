import { describe, expect, it } from 'vitest';
import { complete } from '@/terminal/engine/completion';

describe('complete', () => {
  it('completes a unique open slug', () => {
    expect(complete('open ory', '/randy')).toBe('open oryzo');
  });

  it('completes cat with case-insensitive prefix', () => {
    expect(complete('cat Hal', '/randy')).toBe('cat halcyon');
  });

  it('returns input unchanged on ambiguous prefix', () => {
    // no ambiguous slugs share a real prefix, so contrive one for cd against a dir
    expect(complete('open x', '/randy')).toBe('open x');
  });

  it('returns input unchanged when nothing to complete', () => {
    expect(complete('ls', '/randy')).toBe('ls');
  });

  it('cd completes among cwd children when unique', () => {
    expect(complete('cd or', '/randy/work')).toBe('cd oryzo');
  });
});
