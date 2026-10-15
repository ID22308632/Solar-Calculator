import type { AssessmentDraft } from "./assessment-draft.ts";
import { CONSUMPTION_FIELDS, validateConsumption } from "./consumption.ts";
import { getDemoRoofArea } from "./roof-geometry.ts";

const buildingLabels: Record<string, string> = {
  house: "Detached House",
  apartment: "Apartment / Site",
  commercial: "Commercial",
  industrial: "Industrial",
};

const solutionLabels: Record<string, string> = {
  solar: "Solar Energy System",
  storage: "Solar Energy + Storage",
};

export const REPORT_DISCLOSURE =
  "Demo roof area is illustrative; no real map measurement or solar production, savings, or payback calculation is available.";

export type AssessmentReport = {
  building: string;
  solution: string;
  location: string;
  consumption: string;
  roofArea: number;
  annualLabel: string;
  annualValue: string;
  status: "Prototype input summary";
  disclosure: string;
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** Summarize supplied inputs; this prototype has no solar feasibility model. */
export function buildAssessmentReport(draft: AssessmentDraft): AssessmentReport | null {
  const building = Object.hasOwn(buildingLabels, draft.buildingType)
    ? buildingLabels[draft.buildingType]
    : undefined;
  const solution = Object.hasOwn(solutionLabels, draft.solution)
    ? solutionLabels[draft.solution]
    : undefined;
  if (!building || !solution) return null;

  const validation = validateConsumption(
    draft.electricityValues[draft.electricityMode],
    draft.electricityMode,
  );
  if (!validation.valid) return null;

  const unit = CONSUMPTION_FIELDS[draft.electricityMode].unit;

  return {
    building,
    solution,
    location: draft.address.trim() || "Not provided",
    consumption: `${numberFormatter.format(validation.value)} ${unit} / month`,
    roofArea: getDemoRoofArea(draft.roofBox),
    annualLabel: draft.electricityMode === "bill"
      ? "Annualized electricity bill"
      : "Annualized electricity usage",
    annualValue: `${numberFormatter.format(validation.value * 12)} ${unit} / year`,
    status: "Prototype input summary",
    disclosure: REPORT_DISCLOSURE,
  };
}
