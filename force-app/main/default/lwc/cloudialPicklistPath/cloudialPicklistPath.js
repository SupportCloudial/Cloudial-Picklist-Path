import { LightningElement, api, wire } from "lwc";
import {
  getObjectInfo,
  getPicklistValues
} from "lightning/uiObjectInfoApi";
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { FlowAttributeChangeEvent } from "lightning/flowSupport";

/**
 * Chevron picklist path driven by parent-passed steps or picklist describe.
 * Visual rule: unmatched `value` → all steps upcoming (no implicit current).
 * Dependent picklists are not auto-filtered; pass explicit `steps` instead.
 */
export default class CloudialPicklistPath extends LightningElement {
  /** @type {{ value: string, label: string }[]} */
  @api steps = [];

  /**
   * Current API value string.
   * When provided (non-empty), this is the display source of truth (nested use).
   * When empty/undefined with objectApiName + fieldApiName + recordId, the field
   * is wired from the record for standalone display.
   */
  @api value;

  /**
   * Interaction mode: `event` (default), `update`, or `readOnly`.
   */
  @api interaction = "event";

  /** When true, the whole path is non-clickable. */
  @api disabled = false;

  /** Object API name for describe-driven steps / LDS update. */
  @api objectApiName;

  /** Picklist field API name for describe-driven steps / LDS update. */
  @api fieldApiName;

  /** Optional record type id for picklist describe. */
  @api recordTypeId;

  /** Optional record id used for record type resolve, wired value, and update. */
  @api recordId;

  /** @type {string[]} API values to hide from the path. */
  @api excludedValues = [];

  /** @type {Object.<string, string>} API value → display label. */
  @api labelOverrides = {};

  /** @type {string[]} API values that remain visible but are not clickable. */
  @api disabledValues = [];

  /**
   * Text direction override for nested hosts/tests: `ltr`, `rtl`, or empty.
   * Empty inherits org/page direction (App Builder / Flow do not expose this).
   */
  @api direction = "";

  /**
   * Color preset: `default` (blue current) or `neutral` (gray current).
   * Override further with CSS custom properties on the host.
   */
  @api variant = "default";

  /**
   * Optional single picklist API value that arms celebration.
   * Update mode auto-celebrates after a successful save to this value;
   * event mode only celebrates when the parent calls `celebrate()`.
   */
  @api celebrationValue;

  _objectInfo;
  _record;
  _picklistData;
  /** Field value from getRecord when parent `value` is not the display source. */
  _wiredFieldValue;
  /** True while the full-screen confetti overlay is visible. */
  _celebrating = false;
  _celebrationTimer;
  /** Stable particle descriptors regenerated when a celebration starts. */
  _celebrationParticles = [];

  @wire(getObjectInfo, { objectApiName: "$objectApiName" })
  wiredObjectInfo({ data }) {
    this._objectInfo = data;
  }

  @wire(getRecord, {
    recordId: "$recordIdForWire",
    fields: "$recordWireFields"
  })
  wiredRecord({ data }) {
    this._record = data;
    this._wiredFieldValue = this.extractFieldValue(data);
  }

  @wire(getPicklistValues, {
    recordTypeId: "$resolvedRecordTypeId",
    fieldApiName: "$wiredFieldApiName"
  })
  wiredPicklistValues({ data }) {
    this._picklistData = data;
  }

  get hasExplicitSteps() {
    return Array.isArray(this.steps) && this.steps.length > 0;
  }

  /**
   * Parent `value` wins for display when it is a non-empty string.
   * Empty / null / undefined allow standalone wiring.
   */
  get hasParentValue() {
    return this.value !== undefined && this.value !== null && this.value !== "";
  }

  get needsRecordTypeFromRecord() {
    return (
      !!this.objectApiName &&
      !!this.recordId &&
      !this.recordTypeId &&
      !this.hasExplicitSteps
    );
  }

  get needsWiredFieldValue() {
    return (
      !this.hasParentValue &&
      !!this.objectApiName &&
      !!this.fieldApiName &&
      !!this.recordId
    );
  }

  get recordIdForWire() {
    if (!this.recordId) {
      return undefined;
    }
    if (this.needsRecordTypeFromRecord || this.needsWiredFieldValue) {
      return this.recordId;
    }
    return undefined;
  }

  get recordWireFields() {
    if (!this.objectApiName) {
      return undefined;
    }
    const fields = [];
    if (this.needsRecordTypeFromRecord) {
      fields.push(`${this.objectApiName}.RecordTypeId`);
    }
    if (this.needsWiredFieldValue && this.fieldApiName) {
      fields.push(`${this.objectApiName}.${this.fieldApiName}`);
    }
    return fields.length > 0 ? fields : undefined;
  }

  get resolvedRecordTypeId() {
    if (this.hasExplicitSteps) {
      return undefined;
    }
    if (this.recordTypeId) {
      return this.recordTypeId;
    }
    const fromRecord = this._record?.fields?.RecordTypeId?.value;
    if (fromRecord) {
      return fromRecord;
    }
    return this._objectInfo?.defaultRecordTypeId;
  }

  get wiredFieldApiName() {
    if (
      this.hasExplicitSteps ||
      !this.objectApiName ||
      !this.fieldApiName
    ) {
      return undefined;
    }
    return {
      objectApiName: this.objectApiName,
      fieldApiName: this.fieldApiName
    };
  }

  /** Value used for current/complete/upcoming and update no-op checks. */
  get displayedValue() {
    if (this.hasParentValue) {
      return this.value;
    }
    return this._wiredFieldValue;
  }

  get sourceSteps() {
    if (this.hasExplicitSteps) {
      return this.steps;
    }
    const values = this._picklistData?.values;
    if (!Array.isArray(values)) {
      return [];
    }
    return values.map((entry) => ({
      value: entry.value,
      label: entry.label
    }));
  }

  get displaySteps() {
    const excluded = new Set(
      Array.isArray(this.excludedValues) ? this.excludedValues : []
    );
    const overrides =
      this.labelOverrides && typeof this.labelOverrides === "object"
        ? this.labelOverrides
        : {};

    return this.sourceSteps
      .filter((step) => !excluded.has(step.value))
      .map((step) => ({
        value: step.value,
        label:
          overrides[step.value] != null ? overrides[step.value] : step.label
      }));
  }

  get disabledValueSet() {
    return new Set(
      Array.isArray(this.disabledValues) ? this.disabledValues : []
    );
  }

  get resolvedSteps() {
    const steps = this.displaySteps;
    const currentIndex = steps.findIndex(
      (step) => step.value === this.displayedValue
    );
    const inactive = this.isInactive;
    const disabledValues = this.disabledValueSet;

    return steps.map((step, index) => {
      let state = "upcoming";
      if (currentIndex >= 0) {
        if (index < currentIndex) {
          state = "complete";
        } else if (index === currentIndex) {
          state = "current";
        }
      }

      const valueDisabled = disabledValues.has(step.value);
      return {
        value: step.value,
        label: step.label,
        buttonClass: this.stepClass(state, valueDisabled),
        isDisabled: inactive || valueDisabled
      };
    });
  }

  get isInactive() {
    return this.disabled === true || this.interaction === "readOnly";
  }

  /** Explicit dir for the root path; null omits the attribute (inherit). */
  get directionValue() {
    return this.direction === "ltr" || this.direction === "rtl"
      ? this.direction
      : null;
  }

  get resolvedVariant() {
    const raw =
      typeof this.variant === "string" ? this.variant.trim().toLowerCase() : "";
    return raw === "neutral" ? "neutral" : "default";
  }

  get pathClass() {
    const variant = this.resolvedVariant;
    return variant === "default" ? "path" : `path path--${variant}`;
  }

  get isCelebrating() {
    return this._celebrating === true;
  }

  get celebrationParticles() {
    return this._celebrationParticles;
  }

  get isCelebrationArmed() {
    return (
      this.celebrationValue !== undefined &&
      this.celebrationValue !== null &&
      this.celebrationValue !== ""
    );
  }

  disconnectedCallback() {
    this.clearCelebrationTimer();
  }

  /**
   * Public entry for event-mode hosts: run confetti after the parent’s own
   * success path. No-ops when celebrationValue is unset or reduced-motion.
   */
  @api
  celebrate() {
    this.startCelebration();
  }

  prefersReducedMotion() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  buildCelebrationParticles() {
    const colors = [
      "#4194f9",
      "#2f7fe2",
      "#ff6b6b",
      "#ffd93d",
      "#6bcb77",
      "#a66cff",
      "#ff8c42"
    ];
    const particles = [];
    for (let i = 0; i < 48; i += 1) {
      const left = (i * 17 + 7) % 100;
      const delay = ((i * 37) % 80) / 100;
      const duration = 1.4 + ((i * 13) % 60) / 100;
      const size = 6 + (i % 5);
      const color = colors[i % colors.length];
      particles.push({
        id: `p-${i}`,
        style: [
          `left:${left}%`,
          `width:${size}px`,
          `height:${size}px`,
          `background:${color}`,
          `animation-delay:${delay}s`,
          `animation-duration:${duration}s`
        ].join(";")
      });
    }
    return particles;
  }

  clearCelebrationTimer() {
    if (this._celebrationTimer != null) {
      clearTimeout(this._celebrationTimer);
      this._celebrationTimer = undefined;
    }
  }

  startCelebration() {
    if (!this.isCelebrationArmed) {
      return;
    }
    if (this.prefersReducedMotion()) {
      return;
    }

    this.clearCelebrationTimer();
    this._celebrationParticles = this.buildCelebrationParticles();
    this._celebrating = true;

    this._celebrationTimer = setTimeout(() => {
      this._celebrating = false;
      this._celebrationParticles = [];
      this._celebrationTimer = undefined;
    }, 2000);
  }

  maybeAutoCelebrate(stepValue) {
    if (
      this.interaction === "update" &&
      this.isCelebrationArmed &&
      stepValue === this.celebrationValue
    ) {
      this.startCelebration();
    }
  }

  extractFieldValue(record) {
    if (!record || !this.fieldApiName) {
      return undefined;
    }
    return record.fields?.[this.fieldApiName]?.value;
  }

  stepClass(state, valueDisabled) {
    const base = "path__step";
    let classes;
    if (state === "current") {
      classes = `${base} path__step--current`;
    } else if (state === "complete") {
      classes = `${base} path__step--complete`;
    } else {
      classes = `${base} path__step--upcoming`;
    }
    if (valueDisabled) {
      classes += " path__step--disabled";
    }
    return classes;
  }

  dispatchPathStepClick(step) {
    this.dispatchEvent(
      new CustomEvent("pathstepclick", {
        bubbles: true,
        composed: true,
        detail: { value: step.value, label: step.label }
      })
    );
    this.dispatchEvent(new FlowAttributeChangeEvent("value", step.value));
  }

  reduceError(error) {
    if (!error) {
      return "Unknown error";
    }
    if (typeof error === "string") {
      return error;
    }
    if (Array.isArray(error.body)) {
      return error.body
        .map((entry) => entry.message)
        .filter(Boolean)
        .join(", ");
    }
    if (error.body?.message) {
      return error.body.message;
    }
    if (error.message) {
      return error.message;
    }
    return "Unknown error";
  }

  reportUpdateError(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message,
        variant: "error"
      })
    );
    this.dispatchEvent(
      new CustomEvent("patherror", {
        bubbles: true,
        composed: true,
        detail: { message }
      })
    );
  }

  /** Re-sync display from parent value or last wired record (no optimistic drift). */
  resyncDisplayedValue() {
    if (this.hasParentValue) {
      this._wiredFieldValue = undefined;
      return;
    }
    this._wiredFieldValue = this.extractFieldValue(this._record);
  }

  async handleUpdateClick(step) {
    if (step.value === this.displayedValue) {
      return;
    }

    if (!this.recordId || !this.objectApiName || !this.fieldApiName) {
      this.reportUpdateError(
        "Update mode requires recordId, objectApiName, and fieldApiName."
      );
      return;
    }

    try {
      await updateRecord({
        fields: {
          Id: this.recordId,
          [this.fieldApiName]: step.value
        }
      });

      if (!this.hasParentValue) {
        this._wiredFieldValue = step.value;
      }

      this.dispatchPathStepClick(step);
      this.maybeAutoCelebrate(step.value);
    } catch (error) {
      this.reportUpdateError(this.reduceError(error));
      this.resyncDisplayedValue();
    }
  }

  handleStepClick(event) {
    if (this.isInactive) {
      return;
    }

    const { value } = event.currentTarget.dataset;
    if (this.disabledValueSet.has(value)) {
      return;
    }

    const step = this.displaySteps.find((entry) => entry.value === value);
    if (!step) {
      return;
    }

    if (this.interaction === "update") {
      this.handleUpdateClick(step);
      return;
    }

    this.dispatchPathStepClick(step);
  }
}
