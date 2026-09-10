# /public/photos/

Photography for the bento home. The middle column of the 3×3 grid renders
two PhotoCells selected as a color-coherent pair from the generated manifest.

## Naming

Use sequential names:

```
photo-01.jpg
photo-02.jpg
...
```

Camera-export names such as `IMG_1234.jpeg` are not production filenames.
Normalize them to a metadata-free `photo-NN.jpg` derivative before committing;
see `AGENTS.md` for the complete import and verification procedure.

The bento cells crop with `object-fit: cover`. Keep the long edge at or below
1600px for an appropriate retina-quality/performance balance.

## Behavior

`pnpm build:photos` scans this directory and writes
`src/bento/photos.manifest.json`, including dimensions, hue, and palette data.
`BentoHome` mounts, `PhotoCell` resolves its slot from that manifest, and
attempts to load `<img src="/photos/<filename>">`. If the file 404s,
`onError` hides the `<img>` and the cell shows just the soft muted rectangle
and mono filename label. **No broken-image icons.**

Every reload selects a different adjacent pair from the hue-sorted pool. This
is intentional—the grid breathes on repeat visits while the two frames remain
visually related.

## Adding photos

Add the normalized file and run `pnpm build:photos`. The manifest is the pool;
`src/bento/photos.ts` does not need a manual entry.
