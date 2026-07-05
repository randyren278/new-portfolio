'use client';
import { useState } from 'react';
import { Loader } from '@/terminal/Loader';
import { Terminal } from '@/terminal/Terminal';
import { useSessionFlag } from '@/terminal/hooks/useSessionFlag';

export default function Home() {
  const [seen, mark] = useSessionFlag('randy.seen');
  const [ready, setReady] = useState(seen);
  if (!ready) return <Loader onDone={() => { mark(); setReady(true); }} />;
  return <Terminal />;
}
