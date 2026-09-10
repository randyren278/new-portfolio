# Photo import instructions

These rules apply to every file added under `public/photos/`.

## Import workflow

1. Inspect the incoming image before changing it. Confirm that it is an intentional photo addition and note its dimensions, byte size, orientation, and metadata.
2. Assign the next unused sequential name: `photo-NN.jpg`. Keep the two-digit numbering convention and never overwrite an existing photo.
3. Do not publish the original camera export. Create a derivative with Sharp that:
   - applies EXIF orientation with `.rotate()`;
   - fits within a 1600×1600 box without enlargement;
   - encodes a progressive JPEG at quality 88 with mozjpeg; and
   - omits metadata, especially GPS and device details.
4. Visually inspect the derivative and verify its dimensions and metadata. On macOS, `file`, `sips`, and `mdls` are suitable read-only checks. `kMDItemLatitude` and `kMDItemLongitude` must be null.
5. Preserve the original outside the repository until the derivative is verified. Prefer moving it to the macOS Trash with a collision-free name so recovery remains possible.
6. From `site/`, run `pnpm build:photos`. The generator fails closed on non-canonical names, images over 1600px, and embedded EXIF/XMP/IPTC metadata. Do not edit `src/bento/photos.manifest.json` by hand.

## Required verification

- Confirm the manifest contains exactly one entry for every `photo-NN.jpg` file and includes each newly added filename.
- Run `pnpm build`.
- Start the production server on port 3877 and run both smoke suites:

  ```sh
  pnpm start --port 3877
  node scripts/smoke-bento.cjs
  DEVICE=mobile node scripts/smoke-bento.cjs
  ```

- Verify each new file responds successfully at `/photos/photo-NN.jpg` and can render as both the main photograph and paired thumbnail.
- Before committing, make sure no raw `IMG_*` camera exports or other non-canonical JPEG filenames remain in this directory.
- After deployment, repeat both smoke suites with `BASE_URL=https://www.randyren.org/` to verify the production path.

## Scope boundaries

- The bento selects two photos per visit from the generated manifest. Adding a photo does not require editing `src/bento/photos.ts`.
- Add or change a caption in `src/content/data.ts` only when the user supplies or requests one.
- Commit the normalized photos and regenerated manifest together.
