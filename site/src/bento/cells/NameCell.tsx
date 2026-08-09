/**
 * Name card — top-left corner of the bento.
 *
 * Wordmark in mono, bio in Newsreader italic (a text-optical serif, unlike
 * the display-cut Instrument Serif used elsewhere in the plate essay),
 * meta strip in mono uppercase for location.
 */
export function NameCell({ aboutText }: { aboutText: string }) {
  // Drop the trailing "Open to roles…" sentence — the meta strip below
  // carries location; a status line is intentionally omitted (hard
  // dates only live in the projects section).
  const bio = aboutText
    .split(/(?<=\.)\s/)
    .slice(0, 3)
    .join(' ');

  return (
    <section className="cell cell-name" aria-label="Randy Ren — index">
      <div className="kicker">§ INDEX</div>
      <div className="name-wordmark">RANDY REN</div>
      <p className="name-bio">{bio}</p>
      <div className="name-meta">VANCOUVER, BC · PT/GMT-8</div>
    </section>
  );
}
