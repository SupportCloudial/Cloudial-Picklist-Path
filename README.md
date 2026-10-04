# Cloudial Picklist Path

A reusable Lightning Web Component chevron path for Salesforce picklist fields.
Builders and developers can nest it in other LWCs, place it on Flow screens and
Lightning record pages, and theme it without forking the package.

Managed 2GP under the `CloudialPackage` namespace. See
[`docs/MANAGED-PACKAGE-SETUP.md`](docs/MANAGED-PACKAGE-SETUP.md) for create,
install, and promote steps.

## Use in another LWC

After installing the managed package (namespace `CloudialPackage`):

```html
<cloudialPackage-cloudial-picklist-path
  steps={steps}
  value={status}
  interaction="event"
  variant="default"
  celebration-value="Activated"
  onpathstepclick={handlePathStepClick}
></cloudialPackage-cloudial-picklist-path>
```

Describe-driven steps from object + field (optional record type / record id):

```html
<cloudialPackage-cloudial-picklist-path
  object-api-name="Order__c"
  field-api-name="Status__c"
  record-type-id={recordTypeId}
  record-id={recordId}
  value={status}
  excluded-values={excludedValues}
  label-overrides={labelOverrides}
  disabled-values={disabledValues}
  interaction="event"
  onpathstepclick={handlePathStepClick}
></cloudialPackage-cloudial-picklist-path>
```

Dependent picklists are not auto-filtered by a controlling field. Pass an explicit
`steps` array when you need a filtered or custom ordered set.

Cross-namespace nesting requires Lightning Web Security in the subscriber org.

## Surfaces

- **Nested LWC** — full public property surface (see `docs/API.md`).
- **Lightning App Page / Record Page** — App Builder properties for object/field,
  record id, interaction, value, variant, and celebration value. Leave
  `direction` empty to inherit org/page locale (recommended).
- **Flow Screen** — `value` is input/output; interaction, object/field/record
  context, variant, and celebration value are inputs.

## Direction and theming

- Default: inherit org/page direction. Chevrons mirror via CSS `:dir(rtl)`.
- Optional nested override: `direction` `ltr` / `rtl` (also still in App Builder
  for managed upgrade compatibility — leave empty in practice).
- Step labels follow org picklist translations (`getPicklistValues`).
- `variant`: `default` or `neutral`.
- CSS custom properties (preferred for product branding):
  - `--cloudial-picklist-path-border`
  - `--cloudial-picklist-path-text`
  - `--cloudial-picklist-path-current`
  - `--cloudial-picklist-path-current-hover`
  - `--cloudial-picklist-path-chevron`

Example:

```css
cloudialPackage-cloudial-picklist-path {
  --cloudial-picklist-path-current: #0b6bcb;
  --cloudial-picklist-path-text: #032d60;
}
```

Public API: [`docs/API.md`](docs/API.md).

## Development

```sh
npm install
npm test
npm run test:coverage
npm run lint
```

Only `force-app` is a Salesforce package directory. The `test-support` harness
is for install-time smoke tests and is not packaged.
