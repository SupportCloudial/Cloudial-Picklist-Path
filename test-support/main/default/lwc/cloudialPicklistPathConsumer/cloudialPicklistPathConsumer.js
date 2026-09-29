import { LightningElement } from "lwc";

const SAMPLE_STEPS = [
  { value: "Draft", label: "Draft" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Signed", label: "Signed" },
  { value: "Activated", label: "Activated" },
  { value: "Closed", label: "Closed" }
];

export default class CloudialPicklistPathConsumer extends LightningElement {
  steps = SAMPLE_STEPS;
  selectedValue = "Negotiation";
  lastClickLabel = "";
  celebrationValue = "Signed";

  handlePathStepClick(event) {
    this.selectedValue = event.detail.value;
    this.lastClickLabel = event.detail.label;
  }

  handleCelebrate() {
    const path = this.template.querySelector(
      "cloudialPackage-cloudial-picklist-path"
    );
    if (path) {
      path.celebrate();
    }
  }
}
