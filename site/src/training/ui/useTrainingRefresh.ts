'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';

/** Pick up completed server refreshes without discarding scroll or reloading the page. */
export function useTrainingRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  useEffect(() => {
    busy.current = pending;
  }, [pending]);

  useEffect(() => {
    let lastAttempt = 0;
    const refresh = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine || busy.current) return;
      const now = Date.now();
      if (now - lastAttempt < 5000) return;
      lastAttempt = now;
      startTransition(() => router.refresh());
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [router]);
}
