# Cloudial Picklist Path API

Managed LWC tag after install: `cloudialPackage-cloudial-picklist-path`.

Cross-namespace LWC composition requires **Lightning Web Security** in the
subscriber org. Legacy Lightning Locker is not sufficient for nesting this
managed component from a no-namespace (or other-namespace) LWC.

## Public properties

| Property | Type | Default | Notes |
| --- | --- | --- | --- |
| `steps` | `{ value, label }[]` | `[]` | Explicit ordered steps; non-empty overrides describe. |
| `value` | `String` | — | Current API value. Non-empty parent value wins over wired record field. |
| `interaction` | `String` | `event` | `event`, `update`, or `readOnly`. |
| `disabled` | `Boolean` | `false` | Freezes the whole path. |
| `objectApiName` | `String` | — | Object for describe / LDS. |
| `fieldApiName` | `String` | — | Picklist field for describe / LDS. |
| `recordTypeId` | `String` | — | Optional describe record type. |
| `recordId` | `String` | — | Record type resolve, wired value, and `update`. |
| `excludedValues` | `String[]` | `[]` | API values hidden from the path. |
| `labelOverrides` | `Object` | `{}` | API value → display label. |
| `disabledValues` | `String[]` | `[]` | Visible but not clickable. |
| `direction` | `String` | `""` | `ltr`, `rtl`, or empty to inherit. |
| `variant` | `String` | `default` | `default` (blue current) or `neutral` (gray current). |
| `celebrationValue` | `String` | — | Optional single API value that arms celebration. |

Dependent picklists are not auto-filtered; pass `steps` when you need a custom
set.

### Value and step resolution

- Non-empty `steps` always win over picklist describe.
- Without `steps`, steps come from `getPicklistValues` for
  `objectApiName` + `fieldApiName`.
- Describe uses `recordTypeId` when set; otherwise the record’s record type
  when `recordId` is available; otherwise the object’s default record type.
- Display value: non-empty parent `value` wins. When parent `value` is empty
  and object/field/`recordId` are set, the field is wired from the record.
- Unmatched `value` → all steps render as upcoming (no implicit current).

## Public methods

- `celebrate()` — runs the confetti overlay when `celebrationValue` is set and
  the user does not prefer reduced motion. Intended for `event` mode after the
  parent’s own successful validation/save. No-ops when unarmed or under
  `prefers-reduced-motion: reduce`.

## Events

- `pathstepclick` — bubbles, composed. Detail: `{ value, label }`. Fired in
  `event` mode on any enabled click (including the already-current step). In
  `update` mode, fired after a successful `updateRecord` (not on current-value
  no-op).
- `patherror` — bubbles, composed. Detail: `{ message }`. Fired when an
  `update` fails or required update ids are missing. A toast is also shown.
- Flow also receives `FlowAttributeChangeEvent` for `value` whenever
  `pathstepclick` is dispatched (supports Flow Screen output binding).

## Interaction modes

| Mode | Click behavior | Celebration |
| --- | --- | --- |
| `event` | Notify parent via `pathstepclick`; no DML | Parent must call `celebrate()` after success |
| `update` | `updateRecord` via LDS; current-value click is a no-op | Auto after successful save to `celebrationValue` |
| `readOnly` | No clicks | N/A |

`update` requires `recordId`, `objectApiName`, and `fieldApiName`. The running
user needs edit access on the field. On failure: toast + `patherror`, and the
displayed value is re-synced from the parent value or last wired record.

## Exposure

| Surface | Status |
| --- | --- |
| Nested LWC | Yes — full property surface |
| Lightning App Page | Yes |
| Lightning Record Page | Yes — configure `fieldApiName` + `interaction`; `recordId` / `objectApiName` usually from the page |
| Flow Screen | Yes — `value` is input/output; other properties input-only |

### Interaction matrix (short)

| Mode | Nested | Record page / Flow |
| --- | --- | --- |
| `event` | Parent owns `value`; listen for `pathstepclick` | Flow `value` output updates on click; no DML |
| `update` | Needs `recordId` + object/field; LDS write | Same; toast + `patherror` on failure |
| `readOnly` | Display only | Display only |

After installing the managed package, a subscriber LWC references the package
namespace:

```html
<cloudialPackage-cloudial-picklist-path
  steps={steps}
  value={status}
  interaction="event"
  celebration-value="Activated"
  onpathstepclick={handlePathStepClick}
></cloudialPackage-cloudial-picklist-path>
```

## Styling hooks

Set on the host (or a parent that reaches the host):

- `--cloudial-picklist-path-border`
- `--cloudial-picklist-path-text`
- `--cloudial-picklist-path-current`
- `--cloudial-picklist-path-current-hover`
- `--cloudial-picklist-path-chevron`

Short aliases `--cpp-*` resolve to the same tokens.

`variant="neutral"` remaps the current-step colors. Custom properties still win
when set on the host after the preset.

### Direction

`direction="rtl"` sets `dir="rtl"` on the path root and mirrors chevron
clip-paths. Empty `direction` omits `dir` so the control inherits page/locale
direction. Layout spacing uses logical inline properties.

## Celebration

- Arm with `celebrationValue` (single picklist API value).
- Overlay: ~2s full-screen CSS/DOM confetti particles.
- Skipped when `prefers-reduced-motion: reduce`.
- `update` mode: auto after successful save to that value.
- `event` mode: only via public `celebrate()` after the parent’s success path
  (failed parent validation must not celebrate).
