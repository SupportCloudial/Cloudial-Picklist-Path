# Managed-package integration harness

This directory is outside the `force-app` package directory and is not included
in package versions. It proves that a no-namespace subscriber LWC can compile
against the installed managed component.

Prerequisites:

- Lightning Web Security is enabled in the target org.
- A `Cloudial Picklist Path` managed package version is installed.

Target org must be non-namespaced (subscriber-like). When creating a scratch
from `CloudialPBO`, pass `--no-namespace`.

Deploy the harness with:

```powershell
sf project deploy start --source-dir test-support --target-org TARGET_ORG
```

For a browser smoke test, open:

```text
/c/cloudialPicklistPathConsumerApp.app
```

### Manual smoke checklist

1. Path renders five sample steps; **Negotiation** is current (complete before it).
2. Click **Signed** → selected value and last click labels update.
3. Click **Celebrate** → confetti overlay appears for about two seconds
   (skip if `prefers-reduced-motion`).
4. Optional: place the managed component on a record page with a picklist field
   and confirm describe-driven steps.
