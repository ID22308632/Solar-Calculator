import { validateConsumption, type ElectricityMode } from "./consumption.ts";
import { initialRoofBox, type RoofBox } from "./roof-geometry.ts";

export const ASSESSMENT_DRAFT_KEY = "solarcheck.assessment-draft.v1";
const DRAFT_VERSION = 1;
const MAX_DRAFT_LENGTH = 10_000;
const BUILDING_IDS = new Set(["house", "apartment", "commercial", "industrial"]);
const SOLUTION_IDS = new Set(["solar", "storage"]);

export type AssessmentDraft = {
  step: number;
  buildingType: string;
  solution: string;
  address: string;
  electricityMode: ElectricityMode;
  electricityValues: Record<ElectricityMode, string>;
  roofBox: RoofBox;
};

/** sessionStorage-compatible surface; callers decide which storage to use. */
export type DraftStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function createAssessmentDraft(): AssessmentDraft {
  return {
    step: 1,
    buildingType: "",
    solution: "",
    address: "",
    electricityMode: "bill",
    electricityValues: { bill: "", kwh: "" },
    roofBox: { ...initialRoofBox },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validRoofBox(value: unknown): value is RoofBox {
  if (!isRecord(value)) return false;
  const { x, y, width, height } = value;
  return (
    typeof x === "number" && Number.isFinite(x) &&
    typeof y === "number" && Number.isFinite(y) &&
    typeof width === "number" && Number.isFinite(width) &&
    typeof height === "number" && Number.isFinite(height) &&
    x >= 0 && y >= 0 && width >= 10 && height >= 10 &&
    x + width <= 100 && y + height <= 100
  );
}

function consumptionText(value: unknown, mode: ElectricityMode): string {
  if (typeof value !== "string" || value.length > 100) return "";
  return validateConsumption(value, mode).valid ? value.trim() : "";
}

function sanitizeDraft(value: Record<string, unknown>): AssessmentDraft {
  const draft = createAssessmentDraft();
  if (typeof value.buildingType === "string" && BUILDING_IDS.has(value.buildingType)) {
    draft.buildingType = value.buildingType;
  }
  if (typeof value.solution === "string" && SOLUTION_IDS.has(value.solution)) {
    draft.solution = value.solution;
  }
  if (typeof value.address === "string" && value.address.length <= 500) {
    draft.address = value.address.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  }
  const modeValid = value.electricityMode === "bill" || value.electricityMode === "kwh";
  if (modeValid) {
    draft.electricityMode = value.electricityMode === "kwh" ? "kwh" : "bill";
  }
  if (isRecord(value.electricityValues)) {
    draft.electricityValues = {
      bill: consumptionText(value.electricityValues.bill, "bill"),
      kwh: consumptionText(value.electricityValues.kwh, "kwh"),
    };
  }
  const roofValid = validRoofBox(value.roofBox);
  if (roofValid) {
    const roof = value.roofBox as RoofBox;
    draft.roofBox = { x: roof.x, y: roof.y, width: roof.width, height: roof.height };
  }
  if (typeof value.step === "number" && Number.isInteger(value.step) && value.step >= 1 && value.step <= 5) {
    draft.step = value.step;
  }

  // A stored report cannot bypass prerequisites or revive invalid estimates.
  if (!draft.buildingType) draft.step = 1;
  else if (!draft.solution) draft.step = Math.min(draft.step, 2);
  else if (!roofValid) draft.step = Math.min(draft.step, 3);
  else if (!modeValid || !validateConsumption(draft.electricityValues[draft.electricityMode], draft.electricityMode).valid) {
    draft.step = Math.min(draft.step, 4);
  }
  return draft;
}

export function encodeAssessmentDraft(draft: AssessmentDraft): string {
  return JSON.stringify({ version: DRAFT_VERSION, draft: sanitizeDraft(draft) });
}

/** Treat storage as untrusted input, including old or manually edited drafts. */
export function decodeAssessmentDraft(raw: string | null): AssessmentDraft | null {
  if (typeof raw !== "string" || raw.length > MAX_DRAFT_LENGTH) return null;
  try {
    const envelope: unknown = JSON.parse(raw);
    if (!isRecord(envelope) || envelope.version !== DRAFT_VERSION || !isRecord(envelope.draft)) return null;
    return sanitizeDraft(envelope.draft);
  } catch {
    return null;
  }
}

export function loadAssessmentDraft(storage: DraftStorage): AssessmentDraft | null {
  try {
    return decodeAssessmentDraft(storage.getItem(ASSESSMENT_DRAFT_KEY));
  } catch {
    return null;
  }
}

export function saveAssessmentDraft(storage: DraftStorage, draft: AssessmentDraft): boolean {
  try {
    storage.setItem(ASSESSMENT_DRAFT_KEY, encodeAssessmentDraft(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearAssessmentDraft(storage: DraftStorage): boolean {
  try {
    storage.removeItem(ASSESSMENT_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
}
