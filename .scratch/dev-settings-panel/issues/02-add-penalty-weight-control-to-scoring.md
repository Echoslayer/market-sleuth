# 02 — Add penalty weight control to scoring

**What to build:** A developer can choose how harshly false-positive news picks are penalized, including disabling the penalty, and the submitted round uses that weight without changing default scoring.

**Blocked by:** 01 — Expand settings blob for dev controls

**Status:** done

- [x] Settings (dev) exposes false-positive penalty weights of 0, 0.5, 1, and 2x with 1x as the default.
- [x] Submitting a round applies the selected weight to false-positive deductions while preserving existing scoring when no config is provided.
- [x] Scoring tests cover penalty disabled and doubled penalty, including clamping at zero.
