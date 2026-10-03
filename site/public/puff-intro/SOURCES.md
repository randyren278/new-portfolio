# Puff scenes — artwork, motion and provenance

The Puff entrance adapts public Claude.dev client scene engines with **original Puff artwork**. The approved local studies remain archived separately.

## What is shared with the reference

`fields.js` is the extracted module 98092, including `spaceField`: the actual crescent, ringed planet, flowing halftone density and shooting stars. `puff-engine.js` adapts extracted module 82742: actor motion, sprite playback, pool water, sky and riding scenes. All four original sprite-data initializers are replaced with Puff sprite families. The pool additionally preserves only the reference's blue environment pixels: ring, facets and nearby specks across all 44 frames. Every reference character pixel is excluded. No Claude character or vehicle sprite frames remain in this adapted module. `runtime.js` provides a minimal module loader; only the shared reduced-motion flag is supplied, without unrelated site behavior.

Public sources, retrieved October 2, 2026:

- https://claude.dev/_next/static/chunks/3ujeutb_bgqh0.js
- https://claude.dev/_next/static/chunks/09vvvyoggmt1p.js
- https://claude.dev/blog/using-claude-code-the-unreasonable-effectiveness-of-html/
- Upstream URLs and SHA-256 hashes are in `engine-sources.json`. The complete original extraction also remains in `../reference-code/manifest.json` in the repository.

Attribution does not assert an upstream redistribution license. No server-side source or source maps were recovered.

## Puff artwork

`puff-pixels.js` is authored for this exploration from approved Puff 07. It creates indexed-color frames on a fixed grid, not a CSS distortion of an illustration. The broad asymmetric cream silhouette, square eyes, tiny feet and enclosing helmet remain consistent across all eight sprite sets. Kite, skateboard, scooter, bicycle and car are newly drawn. Puff replaces the character inside the reference pool's blue ring; the earlier coral float is removed. The orbit frames include original tiny star companions.

Each sprite palette has ten colors; each frame's silhouette uses fewer. Pool retains the reference's three blues (`#c1d9ef`, `#699acb`, `#476c91`) and its 44-frame blue environment masks, reshaped into a shallow ring beneath Puff. Puff is drawn above the ring with his full approved helmet, face and feet; the blue environment never cuts into his silhouette. The wider water field retains its gray color, original spacing, dot sizes, noise and ripple displacement. The authored pool transition uses the same three blues and square pixel bubbles. Idle motion uses small local foot/eye/light changes. Foot-edge shading and helmet highlights change locally; Puff's body silhouette stays fixed. The adapted scene engines provide global float, velocity-driven roll, water response and scrolling landscape. Kite cloud drift is explicitly tuned: elapsed-time motion at up to 30 redraws per second replaces the original 420 ms step. Its original cloud geometry and halftone pattern remain intact. Other scenes retain their prior cloud behavior.

Research used:

- 2D Will Never Die, [Give your sprites depth with sub-pixel animation](https://2dwillneverdie.com/tutorial/give-your-sprites-depth-with-sub-pixel-animation/), especially restrained silhouette motion and changing edge colors to imply small movements.
- [Saint11's pixel-art tutorials](https://saint11.art/blog/pixel-art-tutorials/#characterIdle), used as a further artist reference for small readable silhouettes and animation economy.

## Integration and accessibility

The scene wrapper owns canvas hosts, engine handles, listeners and resize observers. Pause and reduced motion suppress animation. The production entrance chooses a scene randomly; no selector is displayed. Keyboard focus is visible on deliberate navigation, and entering transfers focus to the real bento. Skip and reduced motion bypass the transition.

The scene iframe is removed after the scene-specific transition. The original application components, content, photo details, project details, résumé and activity remain in the main document, with a scoped dark palette and no persistent scene canvas.

Responsive cloud-height Kite placement, idle drift and glance/blink selection, soft text clear zones, ambient triggers, float contact ellipse, scene-specific transitions and the application handoff are original additions. Click position determines Kite wind direction. The name retains a fixed size across responsive layouts.
