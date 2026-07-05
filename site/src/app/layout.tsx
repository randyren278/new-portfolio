import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google';
import { getSiteUrl } from '@/lib/env';
import { AnalyticsProbe } from '@/lib/analytics';
import './globals.css';

const serif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-google'
});
const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-google'
});
const italic = IBM_Plex_Serif({
  weight: '400',
  style: 'italic',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-italic-google'
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'randy ren · catalog', template: '%s · randy ren' },
  description: "a museum expressed as a curator's terminal. six plates.",
  openGraph: {
    title: 'randy ren · catalog',
    description: "a museum expressed as a curator's terminal.",
    url: '/',
    siteName: 'randy ren',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website'
  },
  twitter: { card: 'summary_large_image', title: 'randy ren · catalog', images: ['/og-default.png'] },
  icons: { icon: '/favicon.svg' }
};

export const viewport: Viewport = {
  themeColor: '#F1E8D4',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} ${italic.variable}`}>
      <body>{children}<AnalyticsProbe /></body>
    </html>
  );
}
