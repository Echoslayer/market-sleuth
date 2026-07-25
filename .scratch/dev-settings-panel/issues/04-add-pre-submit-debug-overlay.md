# 04 — Add pre-submit debug overlay

**What to build:** A developer can turn on a display-only overlay that reveals the correct direction and marks visible key-event news before submitting, without affecting scoring.

**Blocked by:** 01 — Expand settings blob for dev controls

**Status:** done

- [x] Settings (dev) exposes a debug overlay toggle.
- [x] When debug is on before submit, the round shows the correct direction near the direction picker.
- [x] In list mode, visible key-event news items are marked before submit.
- [x] In swipe mode, debug mode shows a hint to switch to list mode for key-event marks.
- [x] The overlay marks only currently visible items and does not alter the submitted score.
