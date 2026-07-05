import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/contact/schema';
import { getLimiter } from '@/contact/rateLimit';

export const runtime = 'nodejs';

function ipFrom(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0]?.trim()) ?? '0.0.0.0';
}

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation failed' }, { status: 400 });
  }
  if (parsed.data.hp) {
    return NextResponse.json({ ok: true });
  }

  const limiter = getLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ipFrom(req));
    if (!success) return NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { name, email, message } = parsed.data;
  const { error } = await resend.emails.send({
    from: 'catalog <noreply@randyren.com>',
    to: [to],
    replyTo: email,
    subject: `note from ${name}`,
    text: `from: ${name} <${email}>\n\n${message}\n`
  });
  if (error) return NextResponse.json({ ok: false, error: 'send failed' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
