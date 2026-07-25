# 05 — Keep dev panel removable

**What to build:** The dev settings panel remains easy to remove before a player-facing release, with the dev-only surface isolated from normal play behaviour.

**Blocked by:** 02 — Add penalty weight control to scoring, 03 — Add manual cutoff preview, 04 — Add pre-submit debug overlay

**Status:** done

- [x] Dev settings UI stays isolated behind the header settings button and native dialog.
- [x] Core scenario data contracts and pipeline output stay unchanged.
- [x] Removing the settings button, dialog, and settings state leaves the normal round flow using scenario defaults.
