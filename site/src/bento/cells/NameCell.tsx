/**
 * Name card — top-left corner of the bento.
 *
 * Wordmark in mono, one-line bio in Instrument Serif italic (the one and
 * only serif moment in the bento chrome, aside from the plate essay),
 * meta strip in mono uppercase for location + status.
 */
export function NameCell({ aboutText }: { aboutText: string }) {
  // First sentence of ABOUT_TEXT — a single, tight bio line.
  const firstSentence = aboutText.split(/(?<=\.)\s/)[0] ?? aboutText;

  return (
    <section className="cell cell-name" aria-label="Randy Ren — index">
      <div className="kicker">§ INDEX</div>
      <div className="name-wordmark">RANDY REN</div>
      <p className="name-bio">{firstSentence}</p>
      <div className="name-meta">
        SAN FRANCISCO · PT/GMT-7
        <br />
        OPEN FALL 2026
      </div>
    </section>
  );
}
