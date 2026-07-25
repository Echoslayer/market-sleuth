# 03 — Add manual cutoff preview

**What to build:** A developer can preview predictive mode at an arbitrary cutoff date, while reveal-all remains the clear override when both controls are set.

**Blocked by:** 01 — Expand settings blob for dev controls

**Status:** done

- [x] Settings (dev) exposes a date input for the manual cutoff override.
- [x] Before submit, an empty manual cutoff falls back to the scenario's own cutoff date.
- [x] Before submit, a non-empty manual cutoff filters visible prices and news through the existing reveal-cutoff behaviour.
- [x] Reveal-all shows the full scenario regardless of any manual cutoff.
