# Rillion

Daily Dive lives at **https://rillion.randyren.org/** on the separate Vercel project `rillion`. The top-left Randy Ren link returns to https://randyren.org/. The portfolio's `/dive` route redirects here.

The game source remains in `site/public/dive/`. Build a self-contained static release, including its shared Puff renderer, fonts, and the portfolio's SVG, PNG, and Apple icons:

```sh
node rillion/build.mjs
```

Serve `rillion/dist/` to preview the root page. Asset hashes are recorded in `output/rillion-release/bundle.json`. The generated directory is ignored by Git.

After verification, deploy the built directory using the authenticated Vercel account:

```sh
vercel deploy rillion/dist --project rillion --scope randyren278s-projects --prod --yes
```

Daily progress, history, and the high score are stored in the browser under `randy-dive-v1`. Each origin has its own storage; saves on localhost or the portfolio do not automatically transfer to this subdomain.
