# Puff entrance

The original bento components retain their content and typography, with a viewport-fitted desktop composition and a warm dark palette, photo shuffle, a small Correspondence Puff, and Return to intro. Each fresh visit selects Orbit, Pool or Kite with equal probability; there is no scene selector. Return to intro replays the visit's selection.

This directory contains the approved entrance engines/artwork and a same-origin handoff (`bridge.js`). The iframe isolates scene CSS from the original portfolio. It reveals the real bento during its transition, then unmounts completely: no scenery persists behind the portfolio. The entrance has no monogram, Skip or Pause controls. Escape during the transition and automatic reduced motion remain supported. The invitation does not receive focus automatically; keyboard focus remains visible.

Transitions run at 1.65 times their original duration (Orbit 2.46s, Pool 2.89s, Kite 3.05s), with a soft bento arrival. The name remains 72px across screen sizes. Kite scenery clicks send wind from the clicked half: left pushes right; right pushes left. Keyboard wind uses a direction appropriate to Puff's position.

See `SOURCES.md` for renderer/artwork provenance. The original approved study and checkpoints remain in `explorations/quiet-orbit/` outside the deployed application.

Desktop viewports at least 1280×720 fit the complete bento without clipping. Narrower windows retain natural scrolling. Entry and replay fade the complete page as one surface; photo faces have no separate entrance transforms. The lighting control uses SVG, avoiding platform emoji, and main-landmark focus has no decorative outline while interactive controls retain keyboard focus indicators.

The lighting star recolours the existing renderers without resetting actors, clouds or water. Pool opens through an expanding, feathered ripple while the water field zooms outward and pixel bubbles rise; Puff keeps the helmet throughout the dive.

Pool occasionally has a 26 × 14 pixel fish jump beside Puff. Timing, position and direction are random: first arrival after 6–14 seconds, then 10–20 seconds of quiet after each splash. User-triggered ripples also have a 25% chance of a fish jump, with at most one fish active. Automatic ambient ripples do not roll this chance. Fish stop for reduced motion, background tabs, scene disposal and portfolio entry; no fish canvas remains behind the bento.
