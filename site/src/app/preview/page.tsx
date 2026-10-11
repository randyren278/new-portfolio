import type { Metadata } from 'next';

// Local review route: the same live-content bento, with the approved Puff
// entrance. Kept out of search results — it duplicates the home page.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Declared here, not re-exported: Next reads route config statically and
// ignores a re-exported `dynamic`.
export const dynamic = 'force-dynamic';

export { default } from '../page';
