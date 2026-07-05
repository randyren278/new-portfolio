import { describe, expect, it } from 'vitest';
import { contactSchema } from '@/contact/schema';

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'a@b.co', message: 'hello there!' });
    expect(r.success).toBe(true);
  });

  it('rejects short messages', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'a@b.co', message: 'hi' });
    expect(r.success).toBe(false);
  });

  it('rejects bad emails', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'not-an-email', message: 'long enough now.' });
    expect(r.success).toBe(false);
  });

  it('allows honeypot field', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'a@b.co', message: 'long enough now.', hp: 'bot' });
    expect(r.success).toBe(true);
  });
});
