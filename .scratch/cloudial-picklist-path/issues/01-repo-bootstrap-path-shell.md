Status: done

# 01: Repo bootstrap and empty path shell

## Parent

- Spec: docs/SPEC-cloudial-picklist-path.md

## What to build

A new Salesforce package repo that can deploy a public Cloudial Picklist Path LWC shell. A developer opens the project, deploys to a scratch or namespace org, and sees a placeholder chevron path from `cloudialPicklistPath`, with Jest proving the component mounts.

## Reusable packages

None

## Acceptance criteria

- [x] Salesforce project layout exists parallel to Date Input (packaged app source, Jest, README stubs as needed for a deployable empty package)
- [x] Public LWC `cloudialPicklistPath` is present and exposed for nesting at minimum
- [x] Placeholder chevron path renders with static sample steps (not yet driven by real API)
- [x] Jest proves the component mounts and renders the placeholder path
- [x] Namespace target is `CloudialPackage`; package display name direction is Cloudial Picklist Path (package version create may wait for later tickets)

## Blocked by

None (can start immediately)

## How to test

### Automated

- Jest: component mounts and shows placeholder steps

### Manual

- Deploy force-app to a scratch or namespace org and open a simple host or preview if available
