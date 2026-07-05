import type { ReactNode } from 'react';
import { Instrument_Serif, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google';
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

export const metadata = {
  title: 'Randy Ren',
  description: "randy ren's catalog. a museum expressed as a curator's terminal."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} ${italic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
