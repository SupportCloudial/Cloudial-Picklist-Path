Status: done

# 03: Describe-driven steps, exclusions, labels, disabled steps

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

When object and field API names are set and no overriding step list is passed, the path builds steps from picklist describe (optional record type id; if omitted and record id is known, use the record’s record type when possible). Exclusions hide values; label overrides change display text; disabled values stay visible but are not clickable. Explicit step lists still override describe. Step order follows picklist define-order or the parent array order.

## Reusable packages

None

## Acceptance criteria

- [x] Object + field describe populates steps when parent does not pass a step list
- [x] Optional recordTypeId is honored; sensible fallback when omitted with/without recordId
- [x] Parent-passed step list overrides describe
- [x] excludedValues remove steps from the path
- [x] labelOverrides change displayed labels for API values
- [x] disabledValues render but do not fire events / accept clicks
- [x] Dependent picklists are not auto-handled (documented escape hatch: pass steps)
- [x] Jest covers describe mocking, exclusions, overrides, and disabled steps

## Blocked by

- .scratch/cloudial-picklist-path/issues/02-explicit-steps-modes-events.md

## How to test

### Automated

- Jest with mocked getPicklistValues / getPicklistValuesByRecordType (or equivalent)

### Manual

- Record with a real picklist field once a host exists (optional here)
