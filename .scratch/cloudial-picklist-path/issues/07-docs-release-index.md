Status: done

# 07: Docs, test-support, 2GP release, cursor-skills index

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

Ship the first managed release: complete public API and setup docs, a non-packaged test-support consumer host, create and smoke a managed beta under CloudialPackage (same Dev Hub/namespace org as Date Input), promote the tested version, then add the catalog row to cursor-skills PACKAGE-INDEX only (not rooms-devops).

## Reusable packages

None

## Acceptance criteria

- [x] docs/API.md documents properties, events, methods, modes, surfaces, styling, celebration, LWS prerequisite
- [x] Managed-package setup notes exist for create/install/promote
- [x] test-support host can exercise nested (and preferably record-page) usage against an installed build
- [x] Managed 2GP package Cloudial Picklist Path created; beta installed and smoked
- [x] Exact tested beta promoted; version id recorded in-repo identity as appropriate
- [x] cursor-skills PACKAGE-INDEX.md gains cloudial-picklist-path entry with package/version ids, API link, LWC tag, LWS note
- [x] rooms-devops index and Package Builder are not modified

## Blocked by

- .scratch/cloudial-picklist-path/issues/05-rtl-theming-flow-record-page.md
- .scratch/cloudial-picklist-path/issues/06-celebration.md

## How to test

### Automated

- Full Jest suite green before beta

### Manual

- Install beta in a subscriber-like org, run test-support smoke, then promote and verify index fields
- Browser: open `/c/cloudialPicklistPathConsumerApp.app` on CloudialPicklistPathBeta (or subscriber scratch)
