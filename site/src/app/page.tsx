import { loadShellContent } from '@/content/loader';
import { MuseumShell } from '@/museum/MuseumShell';

// Server component: fetches all shell content (Phase 1: static snapshot,
// Phase 2: Postgres) and hands it to the client wrapper. The wrapper does
// not fetch anything at runtime — everything is hydrated from these props.

export default async function Page() {
  const content = await loadShellContent();
  return <MuseumShell content={content} />;
}
