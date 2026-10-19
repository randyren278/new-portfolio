# Candidate assets review

**PASS for reviewed asset correctness and packaging.** Current candidate inspected on 2026-10-19 against `/tmp/portfolio-perf-baseline-20261019/site` (baseline Git revision `63b4678b925f80bb8e699250f7d8b336eac70a0d`). Browser rendering and timing are independently owned by the root verifier. This worker changed only this report, performed no browser/build activity, and used read-only network downloads in memory to check font provenance.

## Verified photo fallbacks

The new URL map has the same two keys as baseline. Both extracted files are **byte-for-byte identical** to the decoded baseline JSON JPEGs, verified with Node Buffer equality and SHA-256:

| File | Bytes | Dimensions | SHA-256 |
| --- | ---: | --- | --- |
| `public/photo-fallbacks/photo-01-e43a2c0cb0.jpg` | 15,635 | 360×480 | `e43a2c0cb09e7a8ae09da6dd941cd357964d00fe8ab936207862b0947bcc356a` |
| `public/photo-fallbacks/photo-02-97c6a9c4c9.jpg` | 31,984 | 360×480 | `97c6a9c4c99080cdfdb933749af09b160a62d86ada6e767d98b7018cf1fb4b6c` |

Sharp metadata confirms sRGB, no alpha, no profile, and no EXIF/XMP/IPTC fields. The existing photos library is untouched by this extraction. The hash prefixes in the URLs correctly match the bytes. This preserves exact fallback pixels while removing their base64 representation from the client import.

## Verified résumé derivative

The new WebP is **480×621, 58,934 bytes**, versus **935×1210, 264,213 bytes** baseline JPEG: **77.7% fewer bytes**. Metadata is sRGB, no alpha/profile/EXIF/XMP/IPTC. `src/content/data.ts` points at the new WebP. The component preserves the previous HTML intrinsic ratio and adds async decoding/low fetch priority. The rounded derivative dimensions differ from the exact original ratio by only ~0.03%; CSS previously controls fitting.

The original preview JPEG remains byte-identical to baseline with SHA-256 `10c12fe053959f690401c92d28db766b73517871bdbd951609d162517615db78`. The original PDF remains byte-identical, **1,298,108 bytes**, SHA-256 `f0f868d8dba4e3165fd550b5655af39b800ae784c1477933f514d516ba25d10e`. Current View and Download URLs are unchanged. Visual crispness and live download responses remain root browser checks.

## Verified global font faces and provenance

Every local `@font-face` matches one corresponding **Latin block** from `output/performance-2026-10-19/google-fonts.css` for family, style, weight, display, and unicode range, ignoring immaterial quote style:

- IBM Plex Mono normal 400 and normal 500.
- IBM Plex Serif italic 400.
- Instrument Serif normal 400 and italic 400.
- Newsreader italic 400.

All six use `font-display: swap`. RootLayout imports the local stylesheet and removes the Google stylesheet/preconnect tags.

The five upstream WOFF2 faces were independently fetched from the recorded Google URLs into memory; every local file exactly equals the upstream bytes. Newsreader's recorded upstream WOFF (30,372 bytes) was compared to the 24,344-byte local WOFF2 with FontTools 4.67.0. All 260 glyph outlines and glyph order are identical; compiled `hhea`, `maxp`, `OS/2`, `hmtx`, `cmap`, `name`, `post`, `gasp`, `GDEF`, `GPOS`, `GSUB`, and `STAT` tables are byte-identical. The source family name “Newsreader 16pt 16pt” is already present upstream; the declared CSS family remains Newsreader as before.

Scope note: the new stylesheet retains the Latin subsets actually used by the site's English content. The original Google stylesheet additionally declared Latin-extended, Vietnamese, and/or Cyrillic subsets depending on the family. Those additional declarations are omitted, so this is not identical font coverage for future non-Latin content; such text will use fallback fonts. Current Latin declaration equivalence is verified.

## Verified intro TTF → WOFF2 packaging

FontTools comparisons were performed independently against baseline TTFs. Each pair has identical glyph order, every decomposed glyph outline, cmap, horizontal metrics, kerning/shaping tables, names, and hinting tables where present. Glyph counts: Instrument Serif 342, DM Sans 439, Plex Mono 995. All non-container compiled tables match. The only `head` changes are checksum adjustment, modified timestamp, and the WOFF2 lossless-compression flag (bit 11); these are expected packaging differences, not changed geometry or metrics. Baseline TTFs remain available, and base.css now uses the WOFF2 siblings with the same family aliases and `font-display: swap`.

| Intro face | Baseline TTF bytes | WOFF2 bytes | Saved |
| --- | ---: | ---: | ---: |
| instrument-serif | 62,284 | 25,220 | 59.5% |
| dm-sans | 48,280 | 19,104 | 60.4% |
| plex-mono | 128,812 | 37,204 | 71.1% |

## Licenses

Full SIL OFL 1.1 license files for IBM Plex Mono, IBM Plex Serif, Instrument Serif, Newsreader, and DM Sans are present under `public/fonts`. Each was independently downloaded read-only from its Google Fonts upstream OFL URL and compared byte-for-byte. All five match exactly and contain the full license text/copyright notice.

The initial review found the new DM Sans derivative lacked a bundled full license (its embedded name table contains only an OFL URL). The root agent added `public/fonts/dmsans-OFL.txt` during review; it now matches upstream exactly. That issue is resolved. The public font README documents source URLs and lossless repackaging; no licensed font outlines were modified.

## Candidate identity

These SHA-256 digests identify the exact files reviewed; the parent may continue editing unrelated candidate code after this snapshot. Baseline source was read from the isolated baseline copy, not from a prior cached report.

| Current site-relative path | Bytes | SHA-256 |
| --- | ---: | --- |
| `src/bento/photo-fallbacks.json` | 127 | `653662c33d07647f8b3162acd368e1fd7613d520b85b73381af7538eaded8a04` |
| `src/bento/cells/ResumeCell.tsx` | 1,685 | `cf37569b2dc11b0690a53bfbb38a6869591948222e645a3678c48581a965df84` |
| `src/content/data.ts` | 18,647 | `a206bf329450fdae9820bd150bc2cde46f9cd7622df79b7c80daf4250bd996e9` |
| `src/app/layout.tsx` | 1,502 | `80b1e33dc96f86773725ad56693856fb08fb86c93b392851ca4688707fb01cb3` |
| `src/app/fonts.css` | 2,319 | `6238b977d59769f084a7ed4e948c593a040e32e7f5e71c36812b6c613830d5b0` |
| `public/puff-intro/base.css` | 24,367 | `185470c30baad9ec8164bfc3971f17df7dd2eabaf8ae1821f339c6e36c27e156` |
| `public/photo-fallbacks/photo-01-e43a2c0cb0.jpg` | 15,635 | `e43a2c0cb09e7a8ae09da6dd941cd357964d00fe8ab936207862b0947bcc356a` |
| `public/photo-fallbacks/photo-02-97c6a9c4c9.jpg` | 31,984 | `97c6a9c4c99080cdfdb933749af09b160a62d86ada6e767d98b7018cf1fb4b6c` |
| `public/fonts/README.md` | 1,050 | `617f5d0fa2e5ec352c8d50200b7c5e3ed661fee23733d05544c0973eeb1f0f7e` |
| `public/fonts/dmsans-OFL.txt` | 4,482 | `9af36190332437f5ecd09974de43c1f7c77a310a996cdd8ceb25628b458840e1` |
| `public/fonts/ibm-plex-mono-normal-400.woff2` | 10,052 | `c36f509c0a8f9f85f29cb44bc8701d8a9e0b14c499e77a884f789ead7093a7ac` |
| `public/fonts/ibm-plex-mono-normal-500.woff2` | 10,060 | `a76f53ca6612e7b3828eec2311098675b7f9849ae4169a8bcef6302aec02a6c0` |
| `public/fonts/ibm-plex-serif-italic-400.woff2` | 16,024 | `9daa6f3da3e4917e5da8537fe9b42a1d764f967e40920ef91cb1b01e069bd241` |
| `public/fonts/ibmplexmono-OFL.txt` | 4,456 | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` |
| `public/fonts/ibmplexserif-OFL.txt` | 4,456 | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` |
| `public/fonts/instrument-serif-italic-400.woff2` | 15,684 | `6ee678c33f388dd7ba59700ebea635deb98821baafd817b09891f7927177f702` |
| `public/fonts/instrument-serif-normal-400.woff2` | 15,040 | `60c06664b5a95c7de6cc3e00d1f9034d78bd1e40b564016b241674449a067d4d` |
| `public/fonts/instrumentserif-OFL.txt` | 4,405 | `129ed7618959716959f2941fdd5b49e0ad6e6c1d78726761786a00253d865521` |
| `public/fonts/newsreader-OFL.txt` | 4,394 | `fdfad38143ec470553cae82a1e45320bdd1b9ec70415d37bd0171051d8a4ded8` |
| `public/fonts/newsreader-italic-400.woff2` | 24,344 | `3d758e1a71e13c8ee5199b070828c7da29b1ea54c4ac0588117b7c8c77455d86` |
| `public/puff-intro/assets/fonts/dm-sans.woff2` | 19,104 | `91b4e35a8d14951a8565c2d99dd472b7b9658ec12ec5ccd1930a134519369cd4` |
| `public/puff-intro/assets/fonts/instrument-serif.woff2` | 25,220 | `b644fa631f014a9c60a78c9232c151546bd4dc47834fb2e18bdd8b6d2457457c` |
| `public/puff-intro/assets/fonts/plex-mono.woff2` | 37,204 | `e9d455c1360d215e703d031178db4e5a982ad1b8823e1dbbc0a0adaba3016a76` |
| `public/resume/Randy_Ren_Resume-preview.webp` | 58,934 | `f2cb454cc7fd0cdd4b332a26670229bd60aa2ccd972e6e168c5d4f634b0491d7` |
| `public/resume/Randy_Ren_Resume.pdf` | 1,298,108 | `f0f868d8dba4e3165fd550b5655af39b800ae784c1477933f514d516ba25d10e` |

## Remaining verification boundary

This is a structural/payload review, not a visual or latency pass. Root must verify the extracted fallback request/paint path, résumé crispness, local fonts loading successfully, intro scene pixels/typography, mobile/desktop/reduced motion, and full-site interactions through Umbra. No blocking issue remains in the reviewed asset contents or licenses.
