/**
 * Photo pool + Fisher-Yates shuffle.
 *
 * The bento has three PhotoCells. On mount, BentoHome shuffles this pool
 * and passes one filename to each cell in order. On reload → new shuffle
 * → new permutation. That's the whole "photos change per visit" effect.
 *
 * Files live in /public/photos/<filename>. If a file is missing (which is
 * the default state until Randy drops JPGs in there), PhotoCell hides the
 * <img> via onError so only the muted rectangle + filename label render.
 */

export const PHOTO_POOL: readonly string[] = Array.from(
  { length: 40 },
  (_, i) => `photo-${String(i + 1).padStart(2, '0')}.jpg`,
);

/**
 * Fisher-Yates on a copy of the pool. Not seedable — visitors get a fresh
 * permutation each visit, which is the intent.
 */
export function shufflePhotos(): string[] {
  const out = PHOTO_POOL.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
