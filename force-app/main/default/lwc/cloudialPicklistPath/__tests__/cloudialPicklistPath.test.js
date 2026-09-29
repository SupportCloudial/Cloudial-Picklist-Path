import { createElement } from "lwc";
import CloudialPicklistPath from "c/cloudialPicklistPath";
import {
  getObjectInfo,
  getPicklistValues
} from "lightning/uiObjectInfoApi";
import { getRecord, updateRecord } from "lightning/uiRecordApi";

jest.mock(
  "lightning/flowSupport",
  () => ({
    FlowAttributeChangeEvent: class FlowAttributeChangeEvent extends CustomEvent {
      constructor(attributeName, newValue) {
        super("flowattributechange", {
          detail: { attributeName, newValue }
        });
      }
    }
  }),
  { virtual: true }
);

const SHOW_TOAST_EVENT = "lightning__showtoast";
const FLOW_ATTRIBUTE_CHANGE = "flowattributechange";

const SAMPLE_STEPS = [
  { value: "Draft", label: "Draft" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Signed", label: "Signed" }
];

const MASTER_RT = "012000000000001AAA";
const RECORD_RT = "012000000000002BBB";

const PICKLIST_WIRE = {
  values: [
    { label: "Draft", value: "Draft" },
    { label: "Negotiation", value: "Negotiation" },
    { label: "Signed", value: "Signed" },
    { label: "Cancelled", value: "Cancelled" }
  ]
};

function createPath(props = {}) {
  const element = createElement("c-cloudial-picklist-path", {
    is: CloudialPicklistPath
  });
  Object.assign(element, props);
  document.body.appendChild(element);
  return element;
}

function pathRoot(element) {
  return element.shadowRoot.querySelector('[data-id="path"]');
}

function stepLabels(element) {
  return Array.from(
    element.shadowRoot.querySelectorAll('[data-id="step-label"]')
  ).map((node) => node.textContent.trim());
}

function stepButtons(element) {
  return Array.from(element.shadowRoot.querySelectorAll("button.path__step"));
}

function stepByValue(element, value) {
  return element.shadowRoot.querySelector(`button[data-value="${value}"]`);
}

function celebrationOverlay(element) {
  return element.shadowRoot.querySelector('[data-id="celebration"]');
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

async function emitDescribe(picklistData = PICKLIST_WIRE, recordTypeId = MASTER_RT) {
  getObjectInfo.emit({ defaultRecordTypeId: MASTER_RT });
  await flush();
  getPicklistValues.emit(picklistData);
  await flush();
  return recordTypeId;
}

describe("c-cloudial-picklist-path", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    updateRecord.mockReset();
    updateRecord.mockResolvedValue({});
  });

  it("renders no step buttons when steps are empty", () => {
    const element = createPath();

    const root = pathRoot(element);
    expect(root).not.toBeNull();
    expect(stepButtons(element)).toHaveLength(0);
  });

  it("renders parent-passed steps in order", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Negotiation"
    });
    await Promise.resolve();

    expect(stepLabels(element)).toEqual(["Draft", "Negotiation", "Signed"]);
  });

  it("marks complete, current, and upcoming from value", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Negotiation"
    });
    await Promise.resolve();

    expect(stepByValue(element, "Draft").className).toContain(
      "path__step--complete"
    );
    expect(stepByValue(element, "Negotiation").className).toContain(
      "path__step--current"
    );
    expect(stepByValue(element, "Signed").className).toContain(
      "path__step--upcoming"
    );
  });

  it("treats all steps as upcoming when value matches none", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Unknown"
    });
    await Promise.resolve();

    stepButtons(element).forEach((button) => {
      expect(button.className).toContain("path__step--upcoming");
      expect(button.className).not.toContain("path__step--current");
      expect(button.className).not.toContain("path__step--complete");
    });
  });

  it("fires pathstepclick with value and label in event mode, including current step", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Negotiation",
      interaction: "event"
    });
    await Promise.resolve();

    const handler = jest.fn();
    element.addEventListener("pathstepclick", handler);

    stepByValue(element, "Signed").click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].bubbles).toBe(true);
    expect(handler.mock.calls[0][0].composed).toBe(true);
    expect(handler.mock.calls[0][0].detail).toEqual({
      value: "Signed",
      label: "Signed"
    });

    handler.mockClear();
    stepByValue(element, "Negotiation").click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      value: "Negotiation",
      label: "Negotiation"
    });
  });

  it("emits FlowAttributeChangeEvent for value on pathstepclick", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      interaction: "event"
    });
    await Promise.resolve();

    const flowHandler = jest.fn();
    element.addEventListener(FLOW_ATTRIBUTE_CHANGE, flowHandler);

    stepByValue(element, "Signed").click();

    expect(flowHandler).toHaveBeenCalledTimes(1);
    expect(flowHandler.mock.calls[0][0].detail).toEqual({
      attributeName: "value",
      newValue: "Signed"
    });
  });

  it("defaults interaction to event", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft"
    });
    await Promise.resolve();

    const handler = jest.fn();
    element.addEventListener("pathstepclick", handler);
    stepByValue(element, "Signed").click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire pathstepclick in readOnly interaction", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      interaction: "readOnly"
    });
    await Promise.resolve();

    const handler = jest.fn();
    element.addEventListener("pathstepclick", handler);
    stepByValue(element, "Signed").click();

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire pathstepclick when disabled", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      interaction: "event",
      disabled: true
    });
    await Promise.resolve();

    const handler = jest.fn();
    element.addEventListener("pathstepclick", handler);
    stepByValue(element, "Signed").click();

    expect(handler).not.toHaveBeenCalled();
  });

  it("sets dir=rtl on the path root when direction is rtl", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      direction: "rtl"
    });
    await flush();

    expect(pathRoot(element).getAttribute("dir")).toBe("rtl");
  });

  it("sets dir=ltr when direction is ltr", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      direction: "ltr"
    });
    await flush();

    expect(pathRoot(element).getAttribute("dir")).toBe("ltr");
  });

  it("omits dir when direction is empty so the path inherits", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      direction: ""
    });
    await flush();

    expect(pathRoot(element).hasAttribute("dir")).toBe(false);

    element.direction = "rtl";
    await flush();
    expect(pathRoot(element).getAttribute("dir")).toBe("rtl");

    element.direction = "";
    await flush();
    expect(pathRoot(element).hasAttribute("dir")).toBe(false);
  });

  it("exposes default and neutral variants on the path root", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft"
    });
    await flush();

    const root = pathRoot(element);
    expect(root.getAttribute("data-variant")).toBe("default");
    expect(root.classList.contains("path--neutral")).toBe(false);

    element.variant = "neutral";
    await flush();
    expect(pathRoot(element).getAttribute("data-variant")).toBe("neutral");
    expect(pathRoot(element).classList.contains("path--neutral")).toBe(true);

    element.variant = "unknown";
    await flush();
    expect(pathRoot(element).getAttribute("data-variant")).toBe("default");
  });

  it("populates steps from picklist describe when object and field are set", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      value: "Negotiation"
    });
    await emitDescribe();

    expect(stepLabels(element)).toEqual([
      "Draft",
      "Negotiation",
      "Signed",
      "Cancelled"
    ]);
  });

  it("honors recordTypeId for describe when provided", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      recordTypeId: RECORD_RT,
      value: "Draft"
    });
    await flush();
    getPicklistValues.emit({
      values: [{ label: "RT Draft", value: "Draft" }]
    });
    await flush();

    expect(stepLabels(element)).toEqual(["RT Draft"]);
  });

  it("resolves record type from recordId when recordTypeId is omitted", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      recordId: "a00RECORD000001",
      value: "Draft"
    });
    await flush();
    getObjectInfo.emit({ defaultRecordTypeId: MASTER_RT });
    getRecord.emit({
      fields: { RecordTypeId: { value: RECORD_RT } }
    });
    await flush();
    getPicklistValues.emit({
      values: [{ label: "From Record RT", value: "Draft" }]
    });
    await flush();

    expect(stepLabels(element)).toEqual(["From Record RT"]);
  });

  it("falls back to default record type when recordTypeId and recordId are omitted", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      value: "Draft"
    });
    await emitDescribe({
      values: [{ label: "Master Draft", value: "Draft" }]
    });

    expect(stepLabels(element)).toEqual(["Master Draft"]);
  });

  it("lets parent-passed steps override describe", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      steps: SAMPLE_STEPS,
      value: "Draft"
    });
    await emitDescribe();

    expect(stepLabels(element)).toEqual(["Draft", "Negotiation", "Signed"]);
  });

  it("hides excludedValues from the path", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      excludedValues: ["Cancelled", "Negotiation"],
      value: "Draft"
    });
    await emitDescribe();

    expect(stepLabels(element)).toEqual(["Draft", "Signed"]);
  });

  it("applies labelOverrides to displayed labels", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      labelOverrides: { Signed: "Activated" },
      value: "Draft"
    });
    await emitDescribe();

    expect(stepLabels(element)).toEqual([
      "Draft",
      "Negotiation",
      "Activated",
      "Cancelled"
    ]);
  });

  it("renders disabledValues as disabled and does not fire pathstepclick", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      disabledValues: ["Cancelled"],
      value: "Draft",
      interaction: "event"
    });
    await emitDescribe();

    const cancelled = stepByValue(element, "Cancelled");
    expect(cancelled.disabled).toBe(true);
    expect(cancelled.className).toContain("path__step--disabled");

    const handler = jest.fn();
    element.addEventListener("pathstepclick", handler);
    cancelled.click();
    expect(handler).not.toHaveBeenCalled();

    stepByValue(element, "Signed").click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      value: "Signed",
      label: "Signed"
    });
  });

  it("applies exclusions, overrides, and disabledValues to parent-passed steps", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      excludedValues: ["Draft"],
      labelOverrides: { Signed: "Activated" },
      disabledValues: ["Negotiation"],
      value: "Negotiation",
      interaction: "event"
    });
    await flush();

    expect(stepLabels(element)).toEqual(["Negotiation", "Activated"]);
    expect(stepByValue(element, "Negotiation").disabled).toBe(true);

    const handler = jest.fn();
    element.addEventListener("pathstepclick", handler);
    stepByValue(element, "Negotiation").click();
    expect(handler).not.toHaveBeenCalled();

    stepByValue(element, "Signed").click();
    expect(handler.mock.calls[0][0].detail).toEqual({
      value: "Signed",
      label: "Activated"
    });
  });

  it("calls updateRecord with clicked value in update mode", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      interaction: "update",
      recordId: "a00RECORD000001",
      objectApiName: "Order__c",
      fieldApiName: "Status__c"
    });
    await flush();

    const clickHandler = jest.fn();
    const flowHandler = jest.fn();
    element.addEventListener("pathstepclick", clickHandler);
    element.addEventListener(FLOW_ATTRIBUTE_CHANGE, flowHandler);

    stepByValue(element, "Signed").click();
    await flush();

    expect(updateRecord).toHaveBeenCalledTimes(1);
    expect(updateRecord).toHaveBeenCalledWith({
      fields: {
        Id: "a00RECORD000001",
        Status__c: "Signed"
      }
    });
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler.mock.calls[0][0].detail).toEqual({
      value: "Signed",
      label: "Signed"
    });
    expect(flowHandler).toHaveBeenCalledTimes(1);
    expect(flowHandler.mock.calls[0][0].detail).toEqual({
      attributeName: "value",
      newValue: "Signed"
    });
  });

  it("does not call updateRecord or fire pathstepclick when clicking current value in update mode", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Negotiation",
      interaction: "update",
      recordId: "a00RECORD000001",
      objectApiName: "Order__c",
      fieldApiName: "Status__c"
    });
    await flush();

    const clickHandler = jest.fn();
    element.addEventListener("pathstepclick", clickHandler);

    stepByValue(element, "Negotiation").click();
    await flush();

    expect(updateRecord).not.toHaveBeenCalled();
    expect(clickHandler).not.toHaveBeenCalled();
  });

  it("shows toast, fires patherror, and keeps displayed value on updateRecord failure", async () => {
    updateRecord.mockRejectedValueOnce({
      body: { message: "FIELD_CUSTOM_VALIDATION_EXCEPTION: blocked" }
    });

    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      interaction: "update",
      recordId: "a00RECORD000001",
      objectApiName: "Order__c",
      fieldApiName: "Status__c"
    });
    await flush();

    const errorHandler = jest.fn();
    const toastHandler = jest.fn();
    const clickHandler = jest.fn();
    element.addEventListener("patherror", errorHandler);
    element.addEventListener(SHOW_TOAST_EVENT, toastHandler);
    element.addEventListener("pathstepclick", clickHandler);

    stepByValue(element, "Signed").click();
    await flush();
    await flush();

    expect(updateRecord).toHaveBeenCalledTimes(1);
    expect(clickHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler.mock.calls[0][0].detail.message).toContain("blocked");
    expect(toastHandler).toHaveBeenCalledTimes(1);
    expect(toastHandler.mock.calls[0][0].detail.variant).toBe("error");

    expect(stepByValue(element, "Draft").className).toContain(
      "path__step--current"
    );
    expect(stepByValue(element, "Signed").className).toContain(
      "path__step--upcoming"
    );
  });

  it("wires field value for display when parent value is empty", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      recordId: "a00RECORD000001",
      recordTypeId: MASTER_RT
    });
    await flush();
    getRecord.emit({
      fields: {
        Status__c: { value: "Negotiation" }
      }
    });
    getPicklistValues.emit(PICKLIST_WIRE);
    await flush();

    expect(stepByValue(element, "Negotiation").className).toContain(
      "path__step--current"
    );
    expect(stepByValue(element, "Draft").className).toContain(
      "path__step--complete"
    );
  });

  it("keeps parent value as display source over wired record field", async () => {
    const element = createPath({
      objectApiName: "Order__c",
      fieldApiName: "Status__c",
      recordId: "a00RECORD000001",
      recordTypeId: MASTER_RT,
      value: "Signed"
    });
    await flush();
    getRecord.emit({
      fields: {
        Status__c: { value: "Draft" }
      }
    });
    getPicklistValues.emit(PICKLIST_WIRE);
    await flush();

    expect(stepByValue(element, "Signed").className).toContain(
      "path__step--current"
    );
    expect(stepByValue(element, "Draft").className).toContain(
      "path__step--complete"
    );
  });

  it("fires patherror when update mode lacks required ids", async () => {
    const element = createPath({
      steps: SAMPLE_STEPS,
      value: "Draft",
      interaction: "update"
    });
    await flush();

    const errorHandler = jest.fn();
    element.addEventListener("patherror", errorHandler);

    stepByValue(element, "Signed").click();
    await flush();

    expect(updateRecord).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler.mock.calls[0][0].detail.message).toContain(
      "recordId"
    );
  });

  describe("celebration", () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    function mockReducedMotion(matches) {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches:
          matches &&
          String(query).includes("prefers-reduced-motion") &&
          String(query).includes("reduce"),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }));
    }

    it("auto-celebrates after successful update to celebrationValue", async () => {
      mockReducedMotion(false);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "update",
        celebrationValue: "Signed",
        recordId: "a00RECORD000001",
        objectApiName: "Order__c",
        fieldApiName: "Status__c"
      });
      await flush();

      expect(celebrationOverlay(element)).toBeNull();

      stepByValue(element, "Signed").click();
      await flush();
      await flush();

      const overlay = celebrationOverlay(element);
      expect(overlay).not.toBeNull();
      expect(overlay.classList.contains("celebration--active")).toBe(true);
      expect(overlay.querySelectorAll(".celebration__particle").length).toBeGreaterThan(
        0
      );
    });

    it("does not auto-celebrate after update to a non-celebration value", async () => {
      mockReducedMotion(false);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "update",
        celebrationValue: "Signed",
        recordId: "a00RECORD000001",
        objectApiName: "Order__c",
        fieldApiName: "Status__c"
      });
      await flush();

      stepByValue(element, "Negotiation").click();
      await flush();
      await flush();

      expect(updateRecord).toHaveBeenCalledTimes(1);
      expect(celebrationOverlay(element)).toBeNull();
    });

    it("does not auto-celebrate on event-mode click of celebrationValue", async () => {
      mockReducedMotion(false);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "event",
        celebrationValue: "Signed"
      });
      await flush();

      const handler = jest.fn();
      element.addEventListener("pathstepclick", handler);

      stepByValue(element, "Signed").click();
      await flush();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(celebrationOverlay(element)).toBeNull();
    });

    it("shows celebration UI when celebrate() is called while armed", async () => {
      mockReducedMotion(false);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "event",
        celebrationValue: "Signed"
      });
      await flush();

      element.celebrate();
      await flush();

      const overlay = celebrationOverlay(element);
      expect(overlay).not.toBeNull();
      expect(overlay.classList.contains("celebration--active")).toBe(true);
    });

    it("does not celebrate when celebrationValue is unset", async () => {
      mockReducedMotion(false);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "event"
      });
      await flush();

      element.celebrate();
      await flush();

      expect(celebrationOverlay(element)).toBeNull();
    });

    it("skips particle celebration when prefers-reduced-motion is reduce", async () => {
      mockReducedMotion(true);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "event",
        celebrationValue: "Signed"
      });
      await flush();

      element.celebrate();
      await flush();

      expect(celebrationOverlay(element)).toBeNull();
    });

    it("skips auto-celebrate particles under reduced-motion after update success", async () => {
      mockReducedMotion(true);
      const element = createPath({
        steps: SAMPLE_STEPS,
        value: "Draft",
        interaction: "update",
        celebrationValue: "Signed",
        recordId: "a00RECORD000001",
        objectApiName: "Order__c",
        fieldApiName: "Status__c"
      });
      await flush();

      stepByValue(element, "Signed").click();
      await flush();
      await flush();

      expect(updateRecord).toHaveBeenCalledTimes(1);
      expect(celebrationOverlay(element)).toBeNull();
    });
  });
});
