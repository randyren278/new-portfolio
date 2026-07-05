import { expect, test } from '@playwright/test';

test('POST /api/contact validates', async ({ request }) => {
  const bad = await request.post('/api/contact', { data: { name: '', email: 'x', message: '' } });
  expect(bad.status()).toBe(400);
});

test('POST /api/contact accepts honeypot silently', async ({ request }) => {
  const r = await request.post('/api/contact', {
    data: { name: 'r', email: 'a@b.co', message: 'long enough message.', hp: 'bot' }
  });
  expect(r.status()).toBe(200);
});
