import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const RESUME_FILE = 'Randy_Ren_Resume.pdf';
const RESUME_PATH = join(process.cwd(), 'public', 'resume', RESUME_FILE);

export const runtime = 'nodejs';

/**
 * Serve the résumé as an attachment. A plain static-file link plus the HTML
 * `download` hint is not enough in every browser, so this endpoint makes the
 * view and download actions unambiguous at the HTTP layer.
 */
export async function GET() {
  try {
    const pdf = await readFile(RESUME_PATH);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `attachment; filename="${RESUME_FILE}"`,
        'Content-Length': String(pdf.byteLength),
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Résumé not available', { status: 404 });
  }
}
