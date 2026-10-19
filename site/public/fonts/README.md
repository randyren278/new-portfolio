# Local site fonts

Latin faces downloaded from Google Fonts on 2026-10-19, preserving the existing
families, styles and weights. `src/app/fonts.css` contains the original unicode
ranges and `font-display: swap`. Newsreader's WOFF was losslessly repackaged as
WOFF2 with FontTools. No outline or hinting changes were made.

Source stylesheet:
https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Serif:ital@1&family=Instrument+Serif:ital@0;1&family=Newsreader:ital@1&display=swap

Each family is licensed under the SIL Open Font License; copies are included
alongside the fonts. Upstream sources and license files:

- https://github.com/google/fonts/tree/main/ofl/ibmplexmono
- https://github.com/google/fonts/tree/main/ofl/ibmplexserif
- https://github.com/google/fonts/tree/main/ofl/instrumentserif
- https://github.com/google/fonts/tree/main/ofl/newsreader

The intro's existing TTF fonts also have losslessly repackaged WOFF2 siblings
in `public/puff-intro/assets/fonts`. Their original TTF files remain available.
