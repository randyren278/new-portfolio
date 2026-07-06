// Rasterize favicon + og-image assets from HTML sources using headless Chromium.
// Produces:
//   public/favicon-16.png       — optically thickened tag, 16×16
//   public/favicon-32.png       — mid-weight tag, 32×32
//   public/apple-touch-icon.png — tag on cream, safe-zone padded, 180×180
//   public/og-image.png         — specimen plate, 1200×630
//
// Playwright is used (not sips/magick) so IBM Plex Mono and Instrument Serif
// render from Google Fonts instead of falling back to a system serif.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Serif:ital@1&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
`;

const targets = [
  {
    name: 'favicon-32.png',
    w: 32, h: 32,
    body: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <rect width="64" height="64" fill="#F1E8D4"/>
        <path d="M8 22 L44 22 L56 34 L56 54 L8 54 Z" fill="none" stroke="#111" stroke-width="2.4"/>
        <circle cx="14" cy="28" r="2.6" fill="#111"/>
        <text x="30" y="48" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="600" fill="#111">RR</text>
      </svg>
    `,
  },
  {
    name: 'favicon-16.png',
    w: 16, h: 16,
    body: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="image-rendering:crisp-edges">
        <rect width="64" height="64" fill="#F1E8D4"/>
        <path d="M6 20 L44 20 L58 34 L58 56 L6 56 Z" fill="none" stroke="#111" stroke-width="4"/>
        <circle cx="14" cy="28" r="3.5" fill="#111"/>
        <text x="30" y="50" font-family="'IBM Plex Mono', monospace" font-size="18" font-weight="700" fill="#111">RR</text>
      </svg>
    `,
  },
  {
    name: 'apple-touch-icon.png',
    w: 180, h: 180,
    body: `
      <div style="width:180px;height:180px;background:#F1E8D4;display:grid;place-items:center;">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="132" height="132">
          <path d="M8 22 L44 22 L56 34 L56 54 L8 54 Z" fill="none" stroke="#111" stroke-width="2"/>
          <circle cx="14" cy="28" r="2.2" fill="#111"/>
          <text x="30" y="47" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" fill="#111">RR</text>
        </svg>
      </div>
    `,
  },
  {
    // Specimen plate — 1200×630 OG image.
    name: 'og-image.png',
    w: 1200, h: 630,
    body: `
      <div style="
        width:1200px;height:630px;
        background:#F1E8D4;color:#111;
        font-family:'IBM Plex Mono', ui-monospace, Menlo, monospace;
        display:flex;flex-direction:column;
        padding:80px 96px;box-sizing:border-box;
        position:relative;
      ">
        <!-- top hairline -->
        <div style="position:absolute;top:0;left:0;right:0;height:5px;background:#111;"></div>

        <!-- kicker row -->
        <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:22px;letter-spacing:0.16em;color:#5A3818;">
          <div>
            <span style="color:#a8100a;font-family:'IBM Plex Serif',serif;font-style:italic;font-size:30px;letter-spacing:0;padding-right:8px;">§</span>
            RANDY.SH
          </div>
          <div>STUDIO</div>
        </div>

        <!-- name -->
        <div style="
          font-family:'Instrument Serif', serif;font-style:italic;font-weight:400;
          font-size:180px;line-height:1;letter-spacing:-0.01em;
          margin-top:80px;margin-bottom:4px;
        ">Randy Ren.</div>

        <!-- location -->
        <div style="
          font-family:'IBM Plex Serif', serif;font-style:italic;
          font-size:36px;color:#5A3818;margin-bottom:52px;
        ">Vancouver, BC.</div>

        <!-- colophon -->
        <div style="
          font-family:'IBM Plex Mono', monospace;
          font-size:22px;color:#7A4A1F;letter-spacing:0.02em;margin-bottom:36px;
        ">a working catalogue.</div>

        <!-- hairline -->
        <div style="height:2px;background:rgba(17,17,17,.55);margin-bottom:22px;"></div>

        <!-- footer: single OPEN -> on the right -->
        <div style="display:flex;justify-content:flex-end;align-items:baseline;font-size:22px;color:#5A3818;letter-spacing:0.08em;">
          <span style="color:#1F3A5F;font-weight:500;letter-spacing:0.16em;">OPEN →</span>
        </div>
      </div>
    `,
  },
];

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 1 });

for (const t of targets) {
  const page = await context.newPage();
  const html = `<!doctype html><html><head><meta charset="utf-8"/>${FONTS}
    <style>
      *{box-sizing:border-box;}
      html,body{margin:0;padding:0;background:transparent;}
    </style>
    </head><body>${t.body}</body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  // Extra wait so custom fonts are 100% ready.
  await page.evaluate(() => (document).fonts?.ready);
  await page.setViewportSize({ width: t.w, height: t.h });
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: t.w, height: t.h },
    omitBackground: false,
    type: 'png',
  });
  writeFileSync(resolve(publicDir, t.name), buf);
  console.log(`wrote ${t.name}  ${t.w}×${t.h}  ${buf.length}B`);
  await page.close();
}

await browser.close();
