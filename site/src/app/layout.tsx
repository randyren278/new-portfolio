import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// Metadata matches index.html <head> exactly. Fonts come from Google via a
// raw <link> tag (same as source) because the shell CSS references named
// families by string; using next/font would require refactoring those
// declarations, which would fight the "byte-for-byte" preservation goal.

export const metadata: Metadata = {
  title: 'Randy Ren',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F1E8D4',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Serif:ital@1&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
