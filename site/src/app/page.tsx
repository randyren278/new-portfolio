import { BentoHome } from '@/bento/BentoHome';
import { loadShellContent } from '@/content/loader';

export const dynamic = 'force-dynamic';

// Optional activity data must not hold up the static entrance or hydration.
export default async function Page() {
  const content = await loadShellContent();
  return <BentoHome content={content} />;
}
