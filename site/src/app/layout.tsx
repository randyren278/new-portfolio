import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './fonts.css';
import '../../public/surfaces.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.randyren.org'),
  title: 'Randy Ren',
  description: 'A working catalogue.',
  alternates: { canonical: '/' },
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
  themeColor: '#181818',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="puff-theme">
      <body>{children}</body>
    </html>
  );
}
