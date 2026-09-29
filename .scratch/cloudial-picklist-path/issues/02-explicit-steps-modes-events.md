Status: done

# 02: Explicit steps, value, modes, and click events

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

A parent can pass an ordered step list and the current value. In `event` mode, clicking any non-disabled step (including the current one) fires a step event with API value and label. In `readOnly` mode (or when the whole control is disabled), clicks do nothing. Steps show current, complete, and upcoming states from the current value.

## Reusable packages

None

## Acceptance criteria

- [x] Parent can supply ordered `{ value, label }` steps and `value`
- [x] Interaction modes `event` and `readOnly` work as specified
- [x] Whole-path disabled/read-only prevents clicks
- [x] `event` mode click on any enabled step fires a bubbling composed event with value and label, including when the step is already current
- [x] Visual states distinguish current, complete, and upcoming
- [x] Jest covers modes, events, and states with parent-passed steps (no live org)

## Blocked by

- .scratch/cloudial-picklist-path/issues/01-repo-bootstrap-path-shell.md

## How to test

### Automated

- Jest: event vs readOnly, current-step click still events, state classes/labels from value

### Manual

- Nested host with hardcoded steps (optional until test-support exists)
