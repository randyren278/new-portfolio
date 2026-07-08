'use client';

import { useEffect, useState } from 'react';
import { apply, current, getStored } from './theme';

/**
 * Top-right theme toggle. Renders `● dark` or `○ light` in mono; hover
 * flips the color to ink via CSS. Two-way sync with the head script's
 * matchMedia listener via the `themechange` CustomEvent, so if the
 * visitor is on `auto` and the system flips, the glyph updates too.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(current());
    const onFlip = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: 'light' | 'dark' }>).detail;
      if (detail?.theme) setTheme(detail.theme);
    };
    document.addEventListener('themechange', onFlip);
    return () => document.removeEventListener('themechange', onFlip);
  }, []);

  const onClick = () => {
    // If the visitor was on `auto` (no stored value), treat this as their
    // explicit first choice — flip to the opposite of what's rendered.
    // Otherwise flip between their explicit choices.
    const stored = getStored();
    if (stored === 'auto') {
      apply(current() === 'dark' ? 'light' : 'dark');
    } else {
      apply(stored === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onClick}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '● dark' : '○ light'}
    </button>
  );
}
