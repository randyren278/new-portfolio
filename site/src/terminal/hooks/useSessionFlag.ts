'use client';
import { useEffect, useState } from 'react';

export function useSessionFlag(key: string): [boolean, () => void] {
  const [set, setSet] = useState(false);
  useEffect(() => {
    try { setSet(sessionStorage.getItem(key) === '1'); } catch { /* private mode */ }
  }, [key]);
  const mark = () => { try { sessionStorage.setItem(key, '1'); setSet(true); } catch { /* ignore */ } };
  return [set, mark];
}
