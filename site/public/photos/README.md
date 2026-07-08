# /public/photos/

Photography for the bento home. The middle column of the 3×3 grid renders
three PhotoCells; each cell picks one filename from the shuffled pool.

## Naming

Drop 8 files here named:

```
photo-01.jpg
photo-02.jpg
photo-03.jpg
photo-04.jpg
photo-05.jpg
photo-06.jpg
photo-07.jpg
photo-08.jpg
```

(or `.webp` — update `src/bento/photos.ts` to match if you switch formats).

The bento cells crop with `object-fit: cover`, so no dimension requirement.
Aim for **1000–1600px on the long edge** for retina; smaller is fine, just
softer.

## Behavior

`src/bento/photos.ts` holds the pool. `BentoHome` mounts, `PhotoCell`
resolves its slot to a filename from the shuffled pool, and attempts to
`<img src="/photos/<filename>">`. If the file 404s (this folder empty on
first ship), `onError` hides the `<img>` and the cell shows just the soft
muted rectangle + mono filename label. **No broken-image icons.**

Every reload → new Fisher-Yates shuffle → different photos in different
cells. This is intentional — the grid breathes on repeat visits.

## Adding more than 8

Extend `PHOTO_POOL` in `src/bento/photos.ts` and add the files. The cells
only assign the first N of the shuffled pool (where N = number of
PhotoCells = 3), so extras just widen the rotation.
