import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSESSMENT_DRAFT_KEY,
  clearAssessmentDraft,
  createAssessmentDraft,
  decodeAssessmentDraft,
  encodeAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
  type AssessmentDraft,
  type DraftStorage,
} from "../src/lib/assessment-draft.ts";
import {
  createConsumptionState,
  getConsumptionValue,
  setConsumptionMode,
  setConsumptionValue,
  validateConsumption,
} from "../src/lib/consumption.ts";
import { getDemoRoofArea, moveRoof, resizeRoof } from "../src/lib/roof-geometry.ts";

function tabStorage(): DraftStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => { items.set(key, value); },
    removeItem: (key) => { items.delete(key); },
  };
}

function reportDraft(): AssessmentDraft {
  const fresh = createAssessmentDraft();
  const positionedRoof = moveRoof(fresh.roofBox, 5, -5);
  const resizedRoof = resizeRoof(positionedRoof, "br", 7, 6);
  let consumption = setConsumptionValue(createConsumptionState(), "1250.50");
  consumption = setConsumptionMode(consumption, "kwh");
  consumption = setConsumptionValue(consumption, "450");

  return {
    ...fresh,
    step: 5,
    buildingType: "commercial",
    solution: "storage",
    address: "Example workshop",
    roofBox: resizedRoof,
    electricityMode: consumption.mode,
    electricityValues: consumption.values,
  };
}

test("a completed assessment keeps the chosen site, roof and both inputs across same-tab reload", () => {
  const storage = tabStorage();
  assert.equal(loadAssessmentDraft(storage), null);
  const draft = reportDraft();
  assert.equal(validateConsumption(draft.electricityValues[draft.electricityMode], draft.electricityMode).valid, true);
  assert.equal(saveAssessmentDraft(storage, draft), true);

  const restored = loadAssessmentDraft(storage);
  assert.ok(restored);
  assert.equal(restored.step, 5);
  assert.equal(restored.buildingType, "commercial");
  assert.equal(restored.solution, "storage");
  assert.equal(restored.address, "Example workshop");
  assert.deepEqual(restored.roofBox, { x: 39, y: 25, width: 35, height: 30 });
  assert.equal(getDemoRoofArea(restored.roofBox), 84);
  assert.equal(restored.electricityMode, "kwh");
  assert.deepEqual(restored.electricityValues, { bill: "1250.50", kwh: "450" });
  assert.deepEqual(decodeAssessmentDraft(encodeAssessmentDraft(restored)), restored);
});

test("changing units retrieves the user's separate values without inventing a conversion", () => {
  let consumption = setConsumptionValue(createConsumptionState(), "900");
  consumption = setConsumptionMode(consumption, "kwh");
  assert.equal(getConsumptionValue(consumption), "");
  assert.equal(validateConsumption(getConsumptionValue(consumption), consumption.mode).valid, false);
  consumption = setConsumptionValue(consumption, "320.75");

  for (let i = 0; i < 3; i += 1) {
    consumption = setConsumptionMode(consumption, "bill");
    assert.equal(getConsumptionValue(consumption), "900");
    consumption = setConsumptionMode(consumption, "kwh");
    assert.equal(getConsumptionValue(consumption), "320.75");
  }

  const restored = decodeAssessmentDraft(encodeAssessmentDraft({
    ...reportDraft(),
    electricityMode: consumption.mode,
    electricityValues: consumption.values,
  }));
  assert.deepEqual(restored?.electricityValues, { bill: "900", kwh: "320.75" });
  assert.equal(restored?.electricityMode, "kwh");
});

test("a report with a missing or invalid active input returns to the consumption step", () => {
  for (const activeValue of ["", "0", "-1", "1e3", "Infinity", "1000001"]) {
    const draft = reportDraft();
    draft.electricityValues.kwh = activeValue;
    const restored = decodeAssessmentDraft(encodeAssessmentDraft(draft));
    assert.ok(restored);
    assert.equal(restored.step, 4);
    assert.equal(restored.electricityMode, "kwh");
    assert.equal(restored.electricityValues.kwh, "");
    assert.equal(restored.electricityValues.bill, "1250.50");
    assert.equal(restored.address, draft.address);
    assert.deepEqual(restored.roofBox, draft.roofBox);
  }
});

test("returning to edit a report preserves the roof and site through edge adjustments", () => {
  const draft = reportDraft();
  draft.step = 3;
  draft.roofBox = moveRoof(draft.roofBox, 500, 500);
  draft.roofBox = resizeRoof(draft.roofBox, "tl", -500, -500);
  draft.step = 5;
  const restored = decodeAssessmentDraft(encodeAssessmentDraft(draft));
  assert.ok(restored);
  assert.equal(restored.step, 5);
  assert.equal(restored.address, "Example workshop");
  assert.deepEqual(restored.roofBox, { x: 0, y: 0, width: 100, height: 100 });
  assert.equal(getDemoRoofArea(restored.roofBox), 800);
  assert.deepEqual(restored.electricityValues, draft.electricityValues);
});

test("restart clears the saved assessment and a new assessment starts with empty personal fields", () => {
  const storage = tabStorage();
  saveAssessmentDraft(storage, reportDraft());
  assert.equal(clearAssessmentDraft(storage), true);
  assert.equal(loadAssessmentDraft(storage), null);
  const restarted = createAssessmentDraft();
  assert.equal(restarted.step, 1);
  assert.equal(restarted.buildingType, "");
  assert.equal(restarted.solution, "");
  assert.equal(restarted.address, "");
  assert.deepEqual(restarted.electricityValues, { bill: "", kwh: "" });
  assert.equal(restarted.electricityMode, "bill");
  assert.equal(saveAssessmentDraft(storage, restarted), true);
  assert.deepEqual(loadAssessmentDraft(storage), restarted);
});

test("an unreadable saved draft can be replaced with a fresh usable assessment", () => {
  const storage = tabStorage();
  storage.setItem(ASSESSMENT_DRAFT_KEY, '{"version":1,"draft":');
  const recovered = loadAssessmentDraft(storage) ?? createAssessmentDraft();
  assert.equal(recovered.step, 1);
  assert.equal(recovered.address, "");
  assert.equal(saveAssessmentDraft(storage, reportDraft()), true);
  assert.equal(loadAssessmentDraft(storage)?.step, 5);
  assert.equal(loadAssessmentDraft(storage)?.electricityValues.kwh, "450");
});
