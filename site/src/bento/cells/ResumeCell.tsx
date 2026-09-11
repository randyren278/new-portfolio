import type { ResumeContent } from '@/content/types';

/**
 * Résumé card — bottom-right corner.
 *
 * The page preview makes the document tangible without pretending its
 * typesetting can stay readable at card scale. The real PDF remains the
 * source of truth for viewing, searching, printing, and downloading.
 */
export function ResumeCell({ resume }: { resume: ResumeContent }) {
  return (
    <section className="cell cell-resume" aria-label="Résumé">
      <h2 className="kicker">§ RÉSUMÉ / ONE PAGE</h2>

      <div className="resume-layout">
        <div className="resume-preview" aria-hidden="true">
          <img src={resume.previewSrc} alt="" width="935" height="1210" />
          <span>1 / 1</span>
        </div>

        <div className="resume-copy">
          <p className="resume-summary">{resume.summary}</p>
          <div className="resume-spec">PDF · 1 PAGE</div>
        </div>
      </div>

      <div className="resume-actions">
        <a
          className="resume-action resume-action-primary resume-view"
          href={resume.pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${resume.name} résumé (PDF, opens in a new tab)`}
        >
          VIEW RÉSUMÉ ↗︎
        </a>
        <a
          className="resume-action resume-download"
          href="/api/resume/download"
          download={resume.downloadName}
          aria-label={`Download ${resume.name} résumé (PDF)`}
        >
          DOWNLOAD ↓
        </a>
      </div>
    </section>
  );
}
