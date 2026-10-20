import { BentoHome } from '@/bento/BentoHome';
import { loadShellContent } from '@/content/loader';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Puff Up · Randy Ren',
  description: 'An endless climb with Puff.',
  alternates: { canonical: '/game' },
};

export default async function GamePage() {
  return <BentoHome content={await loadShellContent()} initialGame />;
}
