/**
 * Colophon card — bottom-right corner (replaces the Hours card).
 *
 * Parses COLOPHON_TEXT ("fonts     IBM Plex Mono, ...") into
 * two-column rows: label (uppercase mono, muted) + value (ink).
 */
type Row = { lab: string; val: string };

function parseColophon(text: string): Row[] {
  const rows: Row[] = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s{2,}/);
    if (parts.length < 2) continue;
    const lab = parts[0].trim().toUpperCase();
    const val = parts.slice(1).join('  ').trim();
    rows.push({ lab, val });
  }
  return rows;
}

export function ColophonCell({ colophonText }: { colophonText: string }) {
  const rows = parseColophon(colophonText);
  return (
    <section className="cell cell-colophon" aria-label="Colophon">
      <div className="kicker">§ COLOPHON</div>
      <div className="colophon-rows">
        {rows.map((r) => (
          <div key={r.lab} className="colophon-row">
            <div className="colophon-lab">{r.lab}</div>
            <div className="colophon-val">{r.val}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
