# Neutral charcoal surfaces

The live baseline reproduced the green cast: initial HTML/body and replay curtain
were rgb(24,25,23); the Puff invitation was rgb(32,34,30). Before screenshots and
computed colors are retained under output/neutral-transitions/before/.

The canonical palette now lives in site/public/surfaces.css. The root layout
bundles it and the intro/game HTML documents load the same file. Page, panel,
space, glass, borders and muted UI colors use neutral RGB channels. Intro lighting
keeps a neutral backdrop; its former sage option is silver. Transition timing and
lifecycle are unchanged. Browser theme chrome also uses neutral charcoal.

Pause/results panels are opaque #181818 and have no drop shadow, removing both
the broad halo and the faint Puff silhouette showing through the old alpha fill.
On mobile, only the game UI disables text selection and iOS touch callouts;
portfolio text remains selectable.

Validation: production build/type checking and pnpm lint passed. The new native
Umbra verifier passed65 checks on1440×1000 and390×844, covering initial paint,
three lighting settings, all three intro scenes, project/training/game dialogs,
training/replay/game curtains, opaque menus and selection scope. The existing
Puff release verifier passed39 checks, including steering, return, focus/scroll,
photo/project functionality and navigation cleanup. Independent source review
reported no material findings.

Run from the repository root:

    node site/scripts/verify-neutral-surfaces.mjs BASE_URL OUTPUT_DIRECTORY
    node site/scripts/verify-puff-up.mjs BASE_URL OUTPUT_DIRECTORY

Local training navigation used fixtures. Production verification uses the public
site. macOS WebKit does not expose the iOS-only touch-callout property; computed
user-select:none is verified live and the iOS CSS declaration is checked as a
served asset. Physical iPhone long-press was not automated. The first verifier
receipt that incorrectly required the unsupported macOS property is preserved
as checks-callout-capability.json. No performance claim is made.
