import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// Fonts come from Google via a raw <link> tag because the shell CSS
// references named families by string; using next/font would require
// refactoring those declarations without benefit.

export const metadata: Metadata = {
  metadataBase: new URL('https://www.randyren.org'),
  title: 'Randy Ren',
  description: 'A working catalogue.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Randy Ren',
    description: 'A working catalogue.',
    url: 'https://www.randyren.org',
    siteName: 'randyren.org',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Randy Ren',
    description: 'A working catalogue.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Required so env(safe-area-inset-*) resolves to non-zero on notched
  // iPhones — every CSS max(14px, env(safe-area-inset-top)) below depends
  // on this flag.
  viewportFit: 'cover',
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
