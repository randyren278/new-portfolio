# Rillion

Daily Dive lives at **https://rillion.randyren.org/** on the separate Vercel project `rillion`. The top-left Randy Ren link returns to https://randyren.org/. The portfolio's `/dive` route redirects here.

The game source remains in `site/public/dive/`. Build a self-contained static release, including its shared Puff renderer, fonts, and the portfolio's SVG, PNG, and Apple icons:

```sh
node rillion/build.mjs
```

Serve `rillion/dist/` to preview the root page. Asset hashes are recorded in `output/rillion-release/bundle.json`. The generated directory is ignored by Git.

The eight gameplay quality requirements are in `rillion/quality-contract.json`. Run the model and motion regressions, build, then verify the actual game through Umbra against a local static server:

```sh
node --test site/scripts/dive*.test.mjs
node rillion/build.mjs
python3 -m http.server 4331 --bind 127.0.0.1 --directory rillion/dist
# In another terminal:
node site/scripts/verify-rillion-quality.mjs http://127.0.0.1:4331 /tmp/rillion-quality
```

The verifier uses an isolated browser profile and saves screenshots, sampled journey frames and a receipt. Deep-water and timeout checks use persisted run fixtures; a complete seven-round dive uses the normal input path. Viewport checks do not reproduce a physical phone keyboard.

Current scores use reviewed concept tiers rather than list order. Unreviewed accepted concepts receive a disclosed provisional 45 points; they do not receive inferred rare or exceptional ratings. Old answer-bank versions remain frozen for saved scores. Rarity is editorial, not a player-frequency statistic.

The text-free sharing card is `site/public/dive/share-boat-v1.png` (1200×630). Open Graph and Twitter metadata reference this public PNG directly so link previews work without JavaScript. To regenerate it from the game's actual renderer using an isolated Umbra profile:

```sh
node rillion/render-share-card.mjs https://rillion.randyren.org/
```

Check the crawler-visible metadata and image response against a local preview or the live domain:

```sh
node rillion/verify-share-card.mjs https://rillion.randyren.org/ /tmp/rillion-share-card.json
```

After verification, deploy the built directory using the authenticated Vercel account:

```sh
vercel deploy rillion/dist --project rillion --scope randyren278s-projects --prod --yes
```

Daily progress, history, and the high score are stored in the browser under `randy-dive-v1`. Each origin has its own storage; saves on localhost or the portfolio do not automatically transfer to this subdomain.
