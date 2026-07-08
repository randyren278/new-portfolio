/**
 * Hours card — bottom-right corner.
 *
 * Parses HOURS_TEXT ("monday    10:00–19:00\n...") into two-column rows.
 * Day abbreviations are uppercased and truncated to 3 chars for the
 * label column; the value column shows the hours verbatim.
 */
type Row = { day: string; val: string };

function parseHours(text: string): Row[] {
  const rows: Row[] = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s{2,}/);
    if (parts.length < 2) continue;
    const day = parts[0].trim().slice(0, 3).toUpperCase();
    const val = parts.slice(1).join('  ').trim();
    rows.push({ day, val });
  }
  return rows;
}

export function HoursCell({ hoursText }: { hoursText: string }) {
  const rows = parseHours(hoursText);
  return (
    <section className="cell cell-hours" aria-label="Hours">
      <div className="kicker">§ HOURS</div>
      <div className="hours-rows">
        {rows.map((r) => (
          <div key={r.day} className="hours-row">
            <div className="hours-day">{r.day}</div>
            <div className="hours-val">{r.val}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
