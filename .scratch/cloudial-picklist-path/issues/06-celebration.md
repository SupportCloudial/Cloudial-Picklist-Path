Status: done

# 06: Celebration

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

When `celebrationValue` is set, reaching that API value can show full-screen confetti for about two seconds. In `update` mode this happens after a successful save to that value. In `event` mode confetti runs only when the parent calls public `celebrate()`. Prefer reduced-motion users get no particle animation. No duration or multi-value knobs in v1.

## Reusable packages

None

## Acceptance criteria

- [x] Optional celebrationValue input arms celebration
- [x] After successful update to celebrationValue, confetti runs ~2s
- [x] event mode does not auto-celebrate on click; public celebrate() triggers it
- [x] prefers-reduced-motion skips particle celebration
- [x] CSS/DOM implementation only (no third-party confetti library)
- [x] Jest asserts gating (update success vs event click vs celebrate()), not pixel-perfect animation

## Blocked by

- .scratch/cloudial-picklist-path/issues/04-update-mode-lds-binding.md

## How to test

### Automated

- Jest: celebrate gating matrix; reduced-motion skip if detectable in jsdom

### Manual

- Click milestone step in update mode; call celebrate() from a nested host in event mode
