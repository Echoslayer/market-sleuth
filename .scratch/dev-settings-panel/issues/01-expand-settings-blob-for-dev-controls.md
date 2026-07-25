# 01 — Expand settings blob for dev controls

**What to build:** The dev settings panel remembers every round-tuning control in one persisted settings object, so newly-added controls survive reloads and older stored settings still get sensible defaults.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Settings include scenario id, reveal-all, manual cutoff override, false-positive penalty weight, and debug overlay state.
- [x] Loading persisted settings merges stored values over defaults so missing fields do not break older localStorage blobs.
- [x] The existing scenario override and reveal-all behaviour still work after the settings shape changes.
