Status: done

# 04: Update mode, LDS errors, and value binding split

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

Interaction mode `update` writes the picklist field with Lightning Data Service only (no Apex). Clicking the already-current step does not DML. On failure, the user sees a toast, an error event fires, and the displayed value stays correct. Nested usage keeps parent-driven `value`; when object, field, and record id are set for record-page/Flow-style use, the component can wire the field for display.

## Reusable packages

None

## Acceptance criteria

- [x] `update` mode calls updateRecord with the clicked API value
- [x] No updateRecord when clicked value already equals current value
- [x] No Apex in the package for updates
- [x] Failure shows toast, fires error event, and re-syncs displayed value
- [x] Nested: parent `value` remains source of truth for display
- [x] Object + field + recordId path can load/display the field value for standalone use
- [x] Jest mocks LDS success and failure paths

## Blocked by

- .scratch/cloudial-picklist-path/issues/03-describe-exclusions-labels-disabled.md

## How to test

### Automated

- Jest: updateRecord called/not called, error event + value stability on failure

### Manual

- Record page smoke after exposure ticket (or temporary host)
