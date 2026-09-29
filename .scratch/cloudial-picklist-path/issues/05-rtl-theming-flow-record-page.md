Status: done

# 05: Visual direction, theming, Flow and record-page exposure

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

The chevron path supports explicit or inherited RTL/LTR direction and color theming via variant and/or CSS custom properties. The LWC is exposed for Flow screens and Lightning record pages with the mode and field inputs/outputs needed for those surfaces.

## Reusable packages

None

## Acceptance criteria

- [x] direction ltr/rtl (and inherit-empty behavior) mirrors the path correctly
- [x] Variant and/or documented CSS custom properties adjust path colors
- [x] js-meta exposes Flow Screen and Lightning Record Page targets
- [x] Flow inputs/outputs cover mode, value, object/field/record context as specified
- [x] Jest covers direction / theming hooks at the external behavior level
- [x] API docs draft updated for surfaces and styling hooks (can finalize in release ticket)

## Blocked by

- .scratch/cloudial-picklist-path/issues/04-update-mode-lds-binding.md

## How to test

### Automated

- Jest: direction attribute affects layout/dir; CSS hooks or variant reflected in public contract tests where feasible

### Manual

- App Builder + Flow screen placement after install/deploy
