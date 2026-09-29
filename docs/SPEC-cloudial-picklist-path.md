# Spec: Cloudial Picklist Path

Status: ready-for-agent (local only — not published to an external tracker)

Repository: https://github.com/SupportCloudial/Cloudial-Picklist-Path.git

## Problem Statement

Salesforce builders and product teams need a reusable, embeddable picklist path control: show ordered steps from any picklist (or an explicit step list), optionally let users advance by click, optionally write the field, and optionally celebrate a milestone — without hardcoding steps inside each app LWC and without relying on Salesforce Path Assistant (which does not fit custom embedded UIs well).

Today, similar UI in Package Builder is hardcoded to Order statuses and domain-specific activation, so it cannot be shipped as a generic Cloudial package.

## Solution

Ship a managed second-generation package **Cloudial Picklist Path** under namespace `CloudialPackage` from this repository. One public LWC (`cloudialPicklistPath`) renders a chevron-style path, supports nested LWC use, Flow screens, and Lightning record pages, and offers three interaction modes: event-only, Lightning Data Service field update, and read-only. Optional celebration confetti can run when a configured milestone value is reached. After the first promoted release, catalog the package in the `cursor-skills` package index only (not rooms-devops). Package Builder / rooms-devops are not consumers in this work.

## User Stories

1. As a subscriber developer, I want a managed LWC I can nest in my components, so that I do not rebuild picklist path UI in every app.
2. As a subscriber developer, I want to pass an object and field API name, so that the path steps come from the org picklist definition.
3. As a subscriber developer, I want optional record type id for describe, so that record-type-specific picklist values are correct.
4. As a subscriber developer, I want the package to use the record’s record type when record id is known and record type id was omitted, so that record pages work with less configuration.
5. As a subscriber developer, I want to pass an explicit ordered list of value/label steps, so that I can override describe (including label mismatches such as Signed vs Activated).
6. As a subscriber developer, I want describe-by-default with list override, so that common cases stay simple and edge cases stay possible.
7. As a subscriber developer nesting the path, I want to control the current value via an input property, so that my parent owns record state.
8. As an admin placing the path on a record page, I want the component to load the field value when object and field are configured, so that the page works without a custom wrapper.
9. As a Flow author, I want the same mode and field configuration on a Flow screen, so that screen flows can show and advance a picklist path.
10. As a subscriber developer, I want interaction mode `event`, so that clicks notify my parent and never perform DML inside the package.
11. As a subscriber developer or admin, I want interaction mode `update`, so that a click writes the picklist field through Lightning Data Service.
12. As a subscriber developer or admin, I want interaction mode `readOnly`, so that the path is display-only with no clicks.
13. As a user, I want to click any non-disabled step (including completed ones), so that I can move backward or sideways when the parent allows it.
14. As a subscriber developer in `event` mode, I want a click on the current step to still fire an event, so that my parent can re-assert or ignore.
15. As a user in `update` mode, I want a click on the already-current step to do nothing, so that the package does not issue a pointless update.
16. As a subscriber developer, I want excluded values, so that some picklist entries never appear on the path.
17. As a subscriber developer, I want label overrides by API value, so that display labels can differ from org picklist labels.
18. As a subscriber developer, I want disabled values, so that some steps remain visible but not clickable.
19. As a subscriber developer, I want a whole-path disabled or read-only switch, so that I can freeze the control during parent work.
20. As a user, I want clear visual states for current, complete, and upcoming steps, so that progress is obvious.
21. As a user in RTL locales or with explicit direction, I want the chevron path to mirror correctly, so that the UI matches reading direction.
22. As a subscriber developer, I want color theming via variant and/or CSS custom properties, so that the path can match product branding without forking the package.
23. As a user in `update` mode, when a save fails, I want a toast and the displayed value to stay correct, so that I am not misled.
24. As a subscriber developer, I want an error event when `update` fails, so that my parent can react.
25. As a Flow author, I want selected value as a Flow output when using event-style behavior, so that the flow can branch on the choice.
26. As a Flow author, I want `update` mode to persist the field when configured, so that the flow screen can write without extra elements.
27. As a product owner, I want an optional celebration value input, so that reaching a milestone can show full-screen confetti for about two seconds.
28. As a user with reduced motion preference, I want celebration animation skipped, so that the UI stays accessible.
29. As a subscriber developer in `event` mode, I want celebration only when I call a public `celebrate()` method after my own success, so that failed parent validation does not celebrate.
30. As a user in `update` mode, I want confetti after a successful save to the celebration value, so that milestones feel rewarding without parent code.
31. As a packaging engineer, I want a new 2GP under the existing `CloudialPackage` namespace and same Dev Hub as Date Input, so that installs and indexing stay consistent.
32. As a packaging engineer, I want this package’s source in `Cloudial-Picklist-Path`, so that versioning is independent of Date Input.
33. As an agent or developer discovering Cloudial packages, I want the promoted release listed in the `cursor-skills` package index, so that reuse skills can find the exact version.
34. As a Cloudial maintainer, I do not want rooms-devops or Package Builder changed in this project, so that the package contract stays generic and uncoupled.
35. As a subscriber org admin, I want Lightning Web Security called out as a prerequisite for cross-namespace nesting, so that composition works as documented.
36. As a developer integrating the path, I want documented public properties, events, and methods, so that I can integrate without reading source.
37. As a QA engineer, I want a non-packaged test-support host, so that I can smoke-test nested and record-page usage against an installed build.
38. As a subscriber developer, I want step order to follow picklist define-order or my array order, so that the path matches business sequence.
39. As a subscriber developer, I want dependent picklists out of automatic support, so that I am not surprised by incomplete controlling-field logic; I can pass an explicit step list instead.
40. As a release manager, I want beta install, smoke, then promote, so that the first listed version is a tested managed release.

## Implementation Decisions

- Create Salesforce project layout parallel to Cloudial Date Input: packaged `force-app` source, non-packaged `test-support` consumer host, Jest, README, `docs/API.md`, managed-package setup docs, and package identity metadata as needed for release.
- Single public LWC module: `cloudialPicklistPath` (managed tag `cloudialPackage-cloudial-picklist-path`).
- Package display name: **Cloudial Picklist Path**. GitHub repo: [SupportCloudial/Cloudial-Picklist-Path](https://github.com/SupportCloudial/Cloudial-Picklist-Path.git).
- Namespace: `CloudialPackage`. New 2GP package id (not an add-on to the Date Input package). Same Dev Hub / namespace org as Date Input.
- Interaction API: one mode input with values `event`, `update`, and `readOnly`.
- Step sources: (1) object API name + field API name → picklist describe; (2) optional explicit steps array overriding describe; order = picklist define-order or array order.
- Optional `recordTypeId`; if omitted and `recordId` is available, use the record’s record type when describing; otherwise fall back sensibly for org default / available values.
- Nested usage: parent supplies `value`. Record page / Flow with object+field may wire the field for display; nested remains parent-driven for `value`.
- `update` mode uses Lightning Data Service `updateRecord` only — no Apex in the package. Running user needs edit access on the field.
- Click on non-disabled steps fires a bubbling, composed step-click (or equivalent) event with API value and label in `event` mode. In `update` mode, successful save may also notify; click on current value is a no-op for DML.
- Configuration: `excludedValues`, `labelOverrides`, `disabledValues`, plus whole-control read-only/disabled.
- Visual: chevron path inspired by Package Builder; support `direction` ltr/rtl; colors via variant and/or CSS custom properties in v1.
- Celebration: optional `celebrationValue` (single API value). ~2s full-screen CSS/DOM confetti; skip when `prefers-reduced-motion`. Auto after successful `update` to that value; in `event` mode only via public `celebrate()`.
- Exposure: nested LWC + Flow Screen + Lightning record page (App Builder).
- DML failure: toast + error event; displayed value re-synced from record/wire or parent value.
- Dependent picklists: not implemented; document escape hatch (explicit steps).
- After first promoted version: add catalog entry to `cursor-skills` `PACKAGE-INDEX.md` only (canonical index). Do not update rooms-devops index in this work.
- Do not modify rooms-devops Package Builder or any rooms-devops product code as part of this spec.
- Public API documentation lives in-repo (`docs/API.md`) before/at release; index points at that API doc after promote.

## Reusable Packages

None selected.

This work *produces* a reusable package; it does not consume one. No target-org install approval is required for implementing this package’s source. Install/smoke orgs used during packaging are operational choices for the release checklist, not grilled consumer approvals.

## Testing Decisions

### Seams (proposed — confirm)

Prefer **one primary seam**: the public `cloudialPicklistPath` LWC’s external behavior.

- Drive the component with `createElement`, set public properties, stub/mock Lightning wires and `updateRecord`, click steps, assert rendered step labels/states, emitted events, whether `updateRecord` was called, error toast/event behavior, `celebrate()` / celebration gating, RTL direction, exclusions/overrides/disabled steps, and mode differences.
- Do **not** assert internal CSS class name churn or private helpers as the main contract.
- If step-resolution logic is extracted to a pure module, optional unit tests on that helper are allowed but must not replace LWC external tests as the source of truth.

Secondary process checks (not Jest seams): managed package create/install, consumer host deploy from `test-support`, manual smoke on record page / Flow / nested host — documented like Date Input.

### What makes a good test

Only external behavior: inputs, outputs, events, public methods, and user-visible outcomes. Mock platform adapters; do not require a live org for the automated suite.

### Modules under test

- `cloudialPicklistPath` LWC (required).
- Optional pure step-resolution helper if extracted.

### Prior art

Cloudial Date Input in the Date Input repository: sfdx-lwc-jest on the public LWC, RTL-focused tests, `test-support` consumer for org smoke, no Apex in the UI package.

## Out of Scope

- Any change to rooms-devops, Package Builder, or migrating PB’s hardcoded status path onto this package.
- Updating the rooms-devops copy of the package index.
- Dependent picklist / controlling-field describe logic.
- Packaged Apex for updates.
- Salesforce Path Assistant replacement or setup automation.
- Multiple celebration values or configurable celebration duration in v1.
- Third-party confetti libraries.
- Time, datetime, multi-select, or non-picklist field types.
- Committing secrets, auto-promote without smoke, or indexing a beta as the catalog release.

## Further Notes

- Empty repo bootstrap is part of delivery: project config, LWC, tests, docs, packaging metadata, then beta → smoke → promote → `cursor-skills` index row.
- Grilling locked dual value-binding (parent vs record-page/Flow wire) and dual interaction (event vs update); API docs must make the matrix explicit to avoid misuse.
- Label override exists specifically so describe-based paths can still show business labels that differ from stored API values.
- Shared understanding was reached in grilling before this spec; treat the decision log in that conversation as normative if a detail here is ambiguous.
