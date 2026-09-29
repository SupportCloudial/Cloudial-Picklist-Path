# Managed 2GP setup and release

The source can be developed and deployed before packaging. Perform these steps
only when a Cloudial Partner Business Org administrator is available.

## Current release

- Package ID: `0HoJ6000000005zKAA`
- Version: `1.0.0`
- Subscriber package version: `04tJ6000000Lx39IAC`
- Installation key: none
- Install URL:
  `https://login.salesforce.com/packaging/installPackage.apexp?p0=04tJ6000000Lx39IAC`

## Permanent ownership

Use the Cloudial Partner Business Org (PBO) as the permanent Dev Hub and owner
of the managed second-generation package. Scratch orgs are disposable test
environments; they do not own the package. Do not create the released package
under a personal Developer Edition Dev Hub.

This package shares the `CloudialPackage` namespace and the same Dev Hub
(`CloudialPBO`) as Cloudial Date Input. It is a **separate** 2GP package, not
an add-on to Date Input.

## One-time administrator setup

1. In the PBO, enable **Dev Hub** and **Second-Generation Managed Packaging**.
2. Give the package developer permission to create package versions and promote
   versions.
3. Register a permanent namespace in a separate namespace Developer Edition
   org. Choose carefully: a registered namespace cannot be changed or reused.
4. Link that namespace to the PBO from **Namespace Registries**.
5. Authorize the PBO locally:

   ```powershell
   sf org login web --alias CloudialPBO --set-default-dev-hub
   ```

6. Verify access before continuing:

   ```powershell
   sf package list --target-dev-hub CloudialPBO
   ```

Stop if package or namespace objects are unavailable; an administrator must fix
the PBO settings or user permissions.

## Configure and create the package

1. Put the linked namespace in `sfdx-project.json` (`CloudialPackage`).
2. Create the managed package:

   ```powershell
   sf package create --name "Cloudial Picklist Path" --package-type Managed --path force-app --target-dev-hub CloudialPBO
   ```

3. Keep the returned package alias/`0Ho` ID in `sfdx-project.json`.

## Beta validation

Create the version without an installation key:

```powershell
sf package version create --package "Cloudial Picklist Path" --installation-key-bypass --code-coverage --wait 60 --target-dev-hub CloudialPBO
```

Beta versions can be installed only in scratch orgs and sandboxes. Create a
disposable scratch org and install the returned `04t` version:

```powershell
sf org create scratch --definition-file config/project-scratch-def.json --alias CloudialPicklistPathBeta --duration-days 7 --target-dev-hub CloudialPBO --no-namespace
sf package install --package 04tVERSION --target-org CloudialPicklistPathBeta --wait 30 --publish-wait 30 --no-prompt
```

Use `--no-namespace` so the scratch behaves like a subscriber org and can
reference the managed tag `cloudialPackage-cloudial-picklist-path` from
`test-support`.

Deploy the non-packaged harness and smoke nested usage:

```powershell
sf project deploy start --source-dir test-support --target-org CloudialPicklistPathBeta
```

Open `/c/cloudialPicklistPathConsumerApp.app` and confirm steps render, clicks
fire, and celebration works when armed. A beta installation cannot be upgraded,
so do not use a long-lived UAT org for this check.

## Release 1.0

Promotion is irreversible. Promote only the exact tested beta:

```powershell
sf package version promote --package 04tVERSION --target-dev-hub CloudialPBO --no-prompt
```

Install the released version in a subscriber-like Developer Edition when
available (for example `DevEditionPersonal`). If no DE is authorized, install
in a second non-namespaced scratch and document that. Then update
`package.identity.json`:

- `packageType`: `managed`
- `status`: `released`
- `version`: `1.0.0`
- `installUrl`: installation URL containing the released `04t` ID

Add the catalog row to `cursor-skills` `PACKAGE-INDEX.md` only (not
rooms-devops).

## Official references

- [Know Your Orgs for Managed 2GP](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_before_know_orgs.htm)
- [Link a Namespace to a Dev Hub](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_reg_namespace.htm)
- [Release a Managed 2GP Version](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_create_pkg_ver_promote.htm)
- [Install with a URL](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_install_pkg_ui.htm)
