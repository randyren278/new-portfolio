/**
 * Contact card — top-right corner.
 *
 * Parses CONTACT_TEXT (a plaintext block of `label   value` lines) into
 * two-column rows. Email is a mailto:; twitter/github/linkedin values
 * are wrapped in <a> pointing at their canonical URLs; location is left
 * plain.
 */
type Row = { lab: string; val: string; href?: string };

function parseContact(text: string): Row[] {
  const rows: Row[] = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // Split on 2+ spaces: `label   value with spaces`
    const parts = line.split(/\s{2,}/);
    if (parts.length < 2) continue;
    const lab = parts[0].trim().toUpperCase();
    const val = parts.slice(1).join('  ').trim();
    let href: string | undefined;
    if (lab === 'EMAIL' || (val.includes('@') && !val.startsWith('@'))) {
      href = `mailto:${val}`;
    } else if (lab === 'TWITTER') {
      const handle = val.replace(/^@/, '');
      href = `https://twitter.com/${handle}`;
    } else if (lab === 'GITHUB') {
      href = `https://github.com/${val.replace(/^\//, '')}`;
    } else if (lab === 'LINKEDIN') {
      const path = val.replace(/^\//, '');
      href = `https://linkedin.com/${path}`;
    }
    rows.push({ lab, val, href });
  }
  return rows;
}

export function ContactCell({ contactText }: { contactText: string }) {
  const rows = parseContact(contactText);
  return (
    <section className="cell cell-contact" aria-label="Contact">
      <div className="kicker">§ CORRESPONDENCE</div>
      <div className="contact-rows">
        {rows.map((r) => (
          <div key={r.lab} style={{ display: 'contents' }}>
            <div className="contact-lab">{r.lab}</div>
            <div className="contact-val">
              {r.href ? (
                <a
                  href={r.href}
                  target={r.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                >
                  {r.val}
                </a>
              ) : (
                r.val
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
